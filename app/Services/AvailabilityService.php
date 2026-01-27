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
            ->keyBy(fn ($item) => $item->availability_date->format('Y-m-d'))
            ->map(fn ($item) => $item->time_slot)
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
        $today = Carbon::now()->startOfDay();
        $canEditToday = config('availability.can_edit_today', false);
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
            $dateCarbon = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

            if ($dateCarbon->lt($today)) {
                Log::info('Skipping past date', ['date' => $date]);
                $results['skipped'][] = ['date' => $date, 'reason' => 'past_date'];

                continue;
            }

            if ($dateCarbon->eq($today) && ! $canEditToday) {
                Log::info('Skipping today (editing disabled)', ['date' => $date]);
                $results['skipped'][] = ['date' => $date, 'reason' => 'today_editing_disabled'];

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
        $isAllDay = in_array($timeSlot, ['all-day', 'holyday']);

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
                    Carbon::parse($date)->addDay()->format('Y-m-d')
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
                'time_slot' => $timeSlot,
                'error' => $apiResult['error'] ?? 'Unknown error',
                'status' => $apiResult['status'] ?? null,
            ]);

            return [
                'success' => false,
                'error' => $apiResult['error'] ?? 'Failed to save to When I Work',
                'event_id' => null,
            ];
        }

        $eventId = $apiResult['event']['id'] ?? null;

        Log::info('Successfully saved to When I Work', [
            'user_id' => $user->id,
            'date' => $date,
            'time_slot' => $timeSlot,
            'event_id' => $eventId,
        ]);

        $localSaved = $this->saveLocally($user->id, $date, $timeSlot, $eventId);

        if (! $localSaved) {
            Log::error('API succeeded but local save failed', [
                'user_id' => $user->id,
                'date' => $date,
                'event_id' => $eventId,
            ]);

            return [
                'success' => false,
                'error' => 'Saved to When I Work but failed to save locally',
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
     * Check if an event overlaps with a target date
     */
    protected function eventsOverlap(array $event, string $targetDate): bool
    {
        $eventStart = Carbon::parse($event['start_time'])->startOfDay();
        $eventEnd = isset($event['end_time'])
            ? Carbon::parse($event['end_time'])->startOfDay()
            : $eventStart;
        $target = Carbon::parse($targetDate)->startOfDay();

        return $target->between($eventStart, $eventEnd) ||
            $eventStart->eq($target) ||
            $eventEnd->eq($target);
    }

    /**
     * Save availability to local database
     */
    protected function saveLocally(int $userId, string $date, string $timeSlot, ?int $wiwEventId): bool
    {
        try {
            Availability::updateOrCreate(
                [
                    'user_id' => $userId,
                    'availability_date' => $date,
                ],
                [
                    'wheniwork_availability_id' => $wiwEventId,
                    'time_slot' => $timeSlot,
                    'status' => 'available',
                ]
            );

            Log::info('Saved availability locally', [
                'user_id' => $userId,
                'date' => $date,
                'time_slot' => $timeSlot,
                'wiw_event_id' => $wiwEventId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to save availability locally', [
                'user_id' => $userId,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Delete availability from When I Work and local database
     *
     * @return array ['success' => bool, 'error' => string|null]
     */
    protected function deleteAvailabilityWithSync(User $user, string $date): array
    {
        Log::info('Starting availability deletion', [
            'user_id' => $user->id,
            'date' => $date,
        ]);

        // If user has When I Work integration, delete from API first
        if ($user->wheniwork_id) {
            $existingEvent = $this->wiwService->findExistingEvent($user->wheniwork_id, $date);

            if ($existingEvent) {
                $deleteResult = $this->wiwService->deleteAvailabilityEvent($existingEvent['id']);

                if (! $deleteResult['success']) {
                    Log::error('Failed to delete from When I Work', [
                        'user_id' => $user->id,
                        'date' => $date,
                        'event_id' => $existingEvent['id'],
                        'error' => $deleteResult['error'],
                    ]);

                    return [
                        'success' => false,
                        'error' => $deleteResult['error'] ?? 'Failed to delete from When I Work',
                    ];
                }

                Log::info('Deleted from When I Work', [
                    'event_id' => $existingEvent['id'],
                    'date' => $date,
                ]);
            }
        }

        // Delete from local database
        try {
            Availability::where('user_id', $user->id)
                ->where('availability_date', $date)
                ->delete();

            Log::info('Deleted availability locally', [
                'user_id' => $user->id,
                'date' => $date,
            ]);

            return ['success' => true, 'error' => null];
        } catch (\Exception $e) {
            Log::error('Failed to delete locally', [
                'user_id' => $user->id,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to delete locally: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Check if a date can be edited based on CAN_EDIT_TODAY setting
     */
    public function canEditDate(string $date): bool
    {
        $dateCarbon = Carbon::parse($date)->startOfDay();
        $today = Carbon::now()->startOfDay();
        $canEditToday = config('availability.can_edit_today', false);

        if ($dateCarbon->lt($today)) {
            return false;
        }

        if ($dateCarbon->eq($today) && ! $canEditToday) {
            return false;
        }

        return true;
    }

    public function checkRequirements(int $userId, int $year, int $month): array
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();
        $today = Carbon::now()->startOfDay();

        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$startDate, $endDate])
            ->where('availability_date', '>=', $today)
            ->whereNotNull('time_slot')
            ->get();

        $weekdayCount = $availabilities->filter(function ($availability) {
            $dayOfWeek = $availability->availability_date->dayOfWeek;

            return $dayOfWeek >= 1 && $dayOfWeek <= 5;
        })->count();

        $weekendCount = $availabilities->filter(function ($availability) {
            $dayOfWeek = $availability->availability_date->dayOfWeek;

            return $dayOfWeek === 0 || $dayOfWeek === 6;
        })->count();

        return [
            'weekday_blocks' => $weekdayCount,
            'weekend_blocks' => $weekendCount,
            'weekday_requirement_met' => $weekdayCount >= 3,
            'weekend_requirement_met' => $weekendCount >= 2,
            'all_requirements_met' => $weekdayCount >= 3 && $weekendCount >= 2,
        ];
    }

    /**
     * Get statistics for a user within a specified date range
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

        $today = Carbon::now()->startOfDay();

        // Get all availability entries for the user within the date range
        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$startDate, $endDate])
            ->get();

        // Calculate duty days count (all assigned days)
        $dutyDaysCount = $availabilities->count();

        // Calculate leave taken (past days marked as 'holyday')
        $leaveTakenCount = $availabilities
            ->filter(function ($availability) use ($today) {
                return $availability->time_slot === 'holyday' &&
                    $availability->availability_date->lt($today);
            })
            ->count();

        // Calculate upcoming leave (future days marked as 'holyday')
        $upcomingLeaveCount = $availabilities
            ->filter(function ($availability) use ($today) {
                return $availability->time_slot === 'holyday' &&
                    $availability->availability_date->gte($today);
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
