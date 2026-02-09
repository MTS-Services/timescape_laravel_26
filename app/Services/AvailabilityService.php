<?php

namespace App\Services;

use App\Models\Availability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AvailabilityService
{
    public function __construct(
        protected ?WhenIWorkAvailabilityService $wiwService = null
    ) {
        $this->wiwService = $wiwService ?? app(WhenIWorkAvailabilityService::class);
    }

    public function getAvailabilitiesForMonth(int $userId, int $year, int $month): array
    {
        $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
        $monthEnd = Carbon::create($year, $month, 1)->endOfMonth();

        // Expand to full weeks for calendar view
        $calendarStart = $monthStart->copy()->startOfWeek(Carbon::MONDAY);
        $calendarEnd = $monthEnd->copy()->endOfWeek(Carbon::SUNDAY);

        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$calendarStart, $calendarEnd])
            ->get()
            ->keyBy(fn($item) => $item->availability_date->format('Y-m-d'))
            ->map(fn($item) => $item->time_slot)
            ->toArray();

        return $availabilities;
    }

    /**
     * Save availabilities with bidirectional sync to When I Work API
     *
     * @param  int  $userId  Local user ID
     * @param  array  $selections  Array of date => timeSlot pairs
     * @return array Results with success/failure info and detailed errors
     */
    public function saveAvailabilities(int $userId, array $selections): array
    {
        $results = [
            'success' => [],
            'failed' => [],
            'skipped' => [],
            'has_errors' => false,
            'error_message' => null,
        ];

        $user = User::find($userId);

        if (! $user) {
            Log::error('User not found for availability save', ['user_id' => $userId]);
            $results['has_errors'] = true;
            $results['error_message'] = 'User not found';

            return $results;
        }

        foreach ($selections as $date => $timeSlot) {
            // Use centralized date classification - cannot edit past dates
            if ($this->isDatePast($date)) {
                Log::info('Skipping past date (using centralized classification)', ['date' => $date]);
                $results['skipped'][] = ['date' => $date, 'reason' => 'past_date'];

                continue;
            }

            if ($timeSlot === null) {
                $deleteResult = $this->deleteAvailabilityWithSync($user, $date);
                if ($deleteResult['success']) {
                    $results['success'][] = ['date' => $date, 'action' => 'deleted'];
                } else {
                    $results['failed'][] = [
                        'date' => $date,
                        'action' => 'delete',
                        'reason' => $deleteResult['error'] ?? 'delete_failed',
                    ];
                    $results['has_errors'] = true;
                    $results['error_message'] = $deleteResult['error'] ?? 'Failed to delete availability';
                }

                continue;
            }

            $saveResult = $this->saveToWhenIWorkAndLocal($user, $date, $timeSlot);

            if ($saveResult['success']) {
                $results['success'][] = [
                    'date' => $date,
                    'time_slot' => $timeSlot,
                    'action' => 'saved',
                ];
            } else {
                $results['failed'][] = [
                    'date' => $date,
                    'time_slot' => $timeSlot,
                    'reason' => $saveResult['error'] ?? 'api_failed',
                ];
                $results['has_errors'] = true;
                $results['error_message'] = $saveResult['error'] ?? 'Failed to save availability';
            }
        }

        return $results;
    }

    /**
     * Save availability to When I Work first, then sync to local database
     *
     * @return array ['success' => bool, 'error' => string|null, 'event_id' => int|null]
     */
    protected function saveToWhenIWorkAndLocal(User $user, string $date, string $timeSlot): array
    {
        $isAllDay = in_array($timeSlot, ['all-day', 'holiday']);

        Log::info('Starting availability save', [
            'user_id' => $user->id,
            'date' => $date,
            'time_slot' => $timeSlot,
            'is_all_day' => $isAllDay,
        ]);

        if (! $user->wheniwork_id) {
            Log::warning('User missing wheniwork_id, saving locally only', [
                'user_id' => $user->id,
                'date' => $date,
            ]);

            $localSaved = $this->saveLocally($user->id, $date, $timeSlot, null);

            return [
                'success' => $localSaved,
                'error' => $localSaved ? null : 'Failed to save locally',
                'event_id' => null,
            ];
        }

        $payload = $this->wiwService->buildPayload($user, $date, $timeSlot);

        // Find existing event for this date
        $existingEvent = $this->wiwService->findExistingEvent($user->wheniwork_id, $date);

        $apiResult = null;

        if ($existingEvent) {
            Log::info('Found existing event, updating', [
                'event_id' => $existingEvent['id'],
                'date' => $date,
                'user_id' => $user->id,
            ]);

            $apiResult = $this->wiwService->updateAvailabilityEvent($existingEvent['id'], $payload);

            // If update fails with 409 conflict, try delete + create
            if (! $apiResult['success'] && ($apiResult['status'] ?? 0) === 409) {
                Log::info('Update failed with 409 conflict, attempting delete + create', [
                    'event_id' => $existingEvent['id'],
                    'date' => $date,
                ]);

                $deleteResult = $this->wiwService->deleteAvailabilityEvent($existingEvent['id']);

                if ($deleteResult['success']) {
                    $apiResult = $this->wiwService->createAvailabilityEvent($payload);
                }
            }
        } else {
            Log::info('No existing event found, creating new', [
                'date' => $date,
                'user_id' => $user->id,
            ]);

            $apiResult = $this->wiwService->createAvailabilityEvent($payload);

            // If create fails with 409 conflict, there might be an overlapping event
            // Try to find and delete it, then recreate
            if (! $apiResult['success'] && ($apiResult['status'] ?? 0) === 409) {
                Log::info('Create failed with 409 conflict, checking for overlapping events', [
                    'date' => $date,
                ]);

                // Fetch events for a wider range to find conflicts
                $conflictingEvents = $this->wiwService->fetchUserAvailabilities(
                    $user->wheniwork_id,
                    Carbon::parse($date)->subDay()->format('Y-m-d'),
                    Carbon::parse($date)->addDay(2)->format('Y-m-d')
                );

                // Delete any conflicting events that overlap with our target date
                foreach ($conflictingEvents as $conflictEvent) {
                    $eventDate = $this->wiwService->extractDateFromEvent($conflictEvent);
                    if ($eventDate === $date || $this->eventsOverlap($conflictEvent, $date)) {
                        Log::info('Deleting conflicting event', [
                            'event_id' => $conflictEvent['id'],
                            'event_date' => $eventDate,
                        ]);
                        $this->wiwService->deleteAvailabilityEvent($conflictEvent['id']);
                    }
                }

                // Retry create after clearing conflicts
                $apiResult = $this->wiwService->createAvailabilityEvent($payload);
            }
        }

        if (! $apiResult['success']) {
            Log::error('Failed to save availability to When I Work', [
                'user_id' => $user->id,
                'date' => $date,
                'error' => $apiResult['error'] ?? 'Unknown error',
            ]);

            return [
                'success' => false,
                'error' => $apiResult['error'] ?? 'API request failed',
                'event_id' => null,
            ];
        }

        // Save to local database with the event ID from WhenIWork
        $eventId = $apiResult['event_id'] ?? null;
        $localSaved = $this->saveLocally($user->id, $date, $timeSlot, $eventId);

        if (! $localSaved) {
            Log::error('Failed to save availability to local database after successful API save', [
                'user_id' => $user->id,
                'date' => $date,
                'event_id' => $eventId,
            ]);

            return [
                'success' => false,
                'error' => 'Failed to save to local database',
                'event_id' => $eventId,
            ];
        }

        return [
            'success' => true,
            'error' => null,
            'event_id' => $eventId,
        ];
    }

    /**
     * Delete availability with sync to When I Work
     *
     * @return array ['success' => bool, 'error' => string|null]
     */
    protected function deleteAvailabilityWithSync(User $user, string $date): array
    {
        // First, try to delete from When I Work if user has wheniwork_id
        if ($user->wheniwork_id) {
            $existingEvent = $this->wiwService->findExistingEvent($user->wheniwork_id, $date);

            if ($existingEvent) {
                $apiResult = $this->wiwService->deleteAvailabilityEvent($existingEvent['id']);

                if (! $apiResult['success']) {
                    Log::error('Failed to delete availability from When I Work', [
                        'user_id' => $user->id,
                        'date' => $date,
                        'event_id' => $existingEvent['id'],
                        'error' => $apiResult['error'] ?? 'Unknown error',
                    ]);

                    return [
                        'success' => false,
                        'error' => $apiResult['error'] ?? 'Failed to delete from When I Work',
                    ];
                }
            }
        }

        // Delete from local database
        $deleted = Availability::forUser($user->id)
            ->where('availability_date', $date)
            ->delete();

        if (! $deleted) {
            Log::warning('No local availability record found to delete', [
                'user_id' => $user->id,
                'date' => $date,
            ]);
        }

        return [
            'success' => true,
            'error' => null,
        ];
    }

    /**
     * Save availability to local database
     */
    protected function saveLocally(int $userId, string $date, string $timeSlot, ?int $eventId): bool
    {
        try {
            Availability::updateOrCreate(
                [
                    'user_id' => $userId,
                    'availability_date' => $date,
                ],
                [
                    'time_slot' => $timeSlot,
                    'wheniwork_event_id' => $eventId,
                ]
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to save availability to local database', [
                'user_id' => $userId,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Check if two events overlap
     */
    protected function eventsOverlap(array $event, string $targetDate): bool
    {
        $eventStart = Carbon::parse($event['start_time'] ?? $event['start']);
        $eventEnd = Carbon::parse($event['end_time'] ?? $event['end']);
        $targetStart = Carbon::parse($targetDate)->startOfDay();
        $targetEnd = Carbon::parse($targetDate)->endOfDay();

        return $eventStart->lt($targetEnd) && $eventEnd->gt($targetStart);
    }

    /**
     * Classify a date as 'past' or 'future' based on CAN_EDIT_TODAY config
     *
     * @param  Carbon|string  $date  The date to classify
     * @return string 'past' or 'future'
     */
    public function classifyDate(Carbon|string $date): string
    {
        $dateCarbon = $date instanceof Carbon ? $date : Carbon::parse($date);
        $today = Carbon::now()->startOfDay();
        $canEditToday = config('availability.can_edit_today', false);

        if ($dateCarbon->lt($today)) {
            return 'past';
        }

        if ($dateCarbon->eq($today)) {
            return $canEditToday ? 'future' : 'past';
        }

        return 'future';
    }

    /**
     * Check if a date is classified as past
     *
     * @param  Carbon|string  $date  The date to check
     */
    public function isDatePast(Carbon|string $date): bool
    {
        return $this->classifyDate($date) === 'past';
    }

    /**
     * Check if a date is classified as future
     *
     * @param  Carbon|string  $date  The date to check
     */
    public function isDateFuture(Carbon|string $date): bool
    {
        return $this->classifyDate($date) === 'future';
    }

    /**
     * Check if a date can be edited based on CAN_EDIT_TODAY setting
     */
    public function canEditDate(string $date): bool
    {
        return $this->isDateFuture($date);
    }

    /**
     * Get weekly requirements for the entire month view
     * Returns an array of weekly requirements covering all weeks displayed in the calendar
     */
    public function getWeeklyRequirements(int $userId, int $year, int $month): array
    {
        $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
        $monthEnd = Carbon::create($year, $month, 1)->endOfMonth();

        // Expand to full weeks for calendar view
        $calendarStart = $monthStart->copy()->startOfWeek(Carbon::MONDAY);
        $calendarEnd = $monthEnd->copy()->endOfWeek(Carbon::SUNDAY);

        // Get all availabilities for the entire calendar view
        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$calendarStart, $calendarEnd])
            ->get();

        $weeks = [];
        $currentWeekStart = $calendarStart->copy();

        while ($currentWeekStart->lte($calendarEnd)) {
            $weekEnd = $currentWeekStart->copy()->endOfWeek(Carbon::SUNDAY);

            // Get Monday-Friday range for this week
            $monday = $currentWeekStart->copy();
            $friday = $currentWeekStart->copy()->addDays(4); // Friday

            // Get Saturday-Sunday range for this week
            $saturday = $currentWeekStart->copy()->addDays(5); // Saturday
            $sunday = $weekEnd->copy();

            $weekdayBlocks = 0;
            $weekendBlocks = 0;

            foreach ($availabilities as $availability) {
                $date = $availability->availability_date;
                $slot = strtolower($availability->time_slot);

                // Determine point value
                $points = 0;
                if ($slot === 'all-day') {
                    $points = 2;
                } elseif (in_array($slot, ['9:30-4:30', '3:30-10:30'])) {
                    $points = 1;
                }

                // Check if date is in Monday-Friday of this week
                if ($date->between($monday, $friday)) {
                    $weekdayBlocks += $points;
                }
                // Check if date is in Saturday-Sunday of this week
                elseif ($date->between($saturday, $sunday)) {
                    $weekendBlocks += $points;
                }
            }

            $weekdayMet = $weekdayBlocks >= 3;
            $weekendMet = $weekendBlocks >= 2;
            $weekComplete = $weekdayMet && $weekendMet;

            $weeks[] = [
                'start_date' => $currentWeekStart->format('Y-m-d'),
                'end_date' => $weekEnd->format('Y-m-d'),
                'weekday' => [
                    'total_blocks' => $weekdayBlocks,
                    'required' => 3,
                    'is_met' => $weekdayMet,
                ],
                'weekend' => [
                    'total_blocks' => $weekendBlocks,
                    'required' => 2,
                    'is_met' => $weekendMet,
                ],
                'is_complete' => $weekComplete,
            ];

            $currentWeekStart->addWeek();
        }

        return $weeks;
    }

    /**
     * Check requirements for current week only (kept for backward compatibility)
     */
    public function checkRequirements(int $userId): array
    {
        $now = Carbon::now();

        // Define the specific boundaries for the current week
        $monday = $now->copy()->startOfWeek(Carbon::MONDAY);
        $friday = $now->copy()->next(Carbon::FRIDAY)->setHour(23)->setMinute(59);

        $saturday = $now->copy()->startOfWeek(Carbon::MONDAY)->next(Carbon::SATURDAY);
        $sunday = $now->copy()->endOfWeek(Carbon::SUNDAY);

        // Fetch all records for the full week once to save database queries
        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$monday, $sunday])
            ->get();

        $weekdayBlocks = 0;
        $weekendBlocks = 0;

        foreach ($availabilities as $availability) {
            $date = $availability->availability_date;
            $slot = strtolower($availability->time_slot);

            // Determine point value
            $points = 0;
            if ($slot === 'all-day') {
                $points = 2;
            } elseif (in_array($slot, ['9:30-4:30', '3:30-10:30'])) {
                $points = 1;
            }

            // Independent Check 1: Mon-Fri
            if ($date->between($monday, $friday)) {
                $weekdayBlocks += $points;
            }
            // Independent Check 2: Sat-Sun
            elseif ($date->between($saturday, $sunday)) {
                $weekendBlocks += $points;
            }
        }

        $weekdayMet = $weekdayBlocks >= 3;
        $weekendMet = $weekendBlocks >= 2;

        return [
            'weekday' => [
                'total_blocks' => $weekdayBlocks,
                'is_met' => $weekdayMet,
            ],
            'weekend' => [
                'total_blocks' => $weekendBlocks,
                'is_met' => $weekendMet,
            ],
            'overall_status' => ($weekdayMet && $weekendMet),
        ];
    }

    /**
     * Get statistics for a user within a specified date range
     *
     * Uses centralized date classification (classifyDate) to properly
     * categorize leave as "taken" (past) or "upcoming" (future) based
     * on the CAN_EDIT_TODAY configuration.
     *
     * @param  string|null  $filterType  'month', 'year', or 'custom'
     * @param  string|null  $startDate  For custom date range
     * @param  string|null  $endDate  For custom date range
     */
    public function getUserStatistics(int $userId, int $year, int $month, ?string $filterType = 'month', ?string $startDate = null, ?string $endDate = null): array
    {
        // Determine the date range based on filter type
        if ($filterType === 'month' || $filterType === null) {
            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth();
        } elseif ($filterType === 'year') {
            $startDate = Carbon::create($year, 1, 1)->startOfYear();
            $endDate = Carbon::create($year, 12, 31)->endOfYear();
        } elseif ($filterType === 'custom' && $startDate && $endDate) {
            $startDate = Carbon::parse($startDate)->startOfDay();
            $endDate = Carbon::parse($endDate)->endOfDay();
        } else {
            // Default to current month
            $startDate = Carbon::create($year, $month, 1)->startOfMonth();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth();
        }

        // Get all availability entries for the user within the date range
        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$startDate, $endDate])
            ->get();

        // Get config for holiday inclusion in duty days
        $includeHolidayInDutyDays = config('availability.include_holiday_in_duty_days', false);

        // Calculate duty days count
        // If includeHolidayInDutyDays is false, exclude holidays from count
        $dutyDaysCount = $availabilities
            ->filter(function ($availability) use ($includeHolidayInDutyDays) {
                if (! $includeHolidayInDutyDays && $availability->time_slot === 'holiday') {
                    return false;
                }

                return true;
            })
            ->count();

        // Calculate leave taken (PAST days marked as 'holiday')
        // Uses centralized isDatePast() which respects CAN_EDIT_TODAY
        $leaveTakenCount = $availabilities
            ->filter(function ($availability) {
                return $availability->time_slot === 'holiday' &&
                    $this->isDatePast($availability->availability_date);
            })
            ->count();

        // Calculate upcoming leave (FUTURE days marked as 'holiday')
        // Uses centralized isDateFuture() which respects CAN_EDIT_TODAY
        $upcomingLeaveCount = $availabilities
            ->filter(function ($availability) {
                return $availability->time_slot === 'holiday' &&
                    $this->isDateFuture($availability->availability_date);
            })
            ->count();

        return [
            'total_duty_days' => $dutyDaysCount,
            'leave_taken' => $leaveTakenCount,
            'upcoming_leave' => $upcomingLeaveCount,
            'filter_type' => $filterType,
            'date_range' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
        ];
    }
}
