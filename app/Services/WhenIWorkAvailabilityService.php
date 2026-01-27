<?php

namespace App\Services;

use App\Helpers\WhenIWorkHelper;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhenIWorkAvailabilityService
{
    protected string $endpoint;

    protected string $timezoneMode;

    protected bool $debugMode;

    public function __construct()
    {
        $this->endpoint = config('availability.wheniwork.availability_endpoint', 'availabilityevents');
        $this->timezoneMode = config('availability.timezone_mode', 'utc');
        $this->debugMode = config('app.env') === 'local';
    }

    /**
     * Fetch availability events for a user within a date range from When I Work API
     *
     * @param  int  $wiwUserId  When I Work user ID
     * @param  string  $startDate  Start date (YYYY-MM-DD)
     * @param  string  $endDate  End date (YYYY-MM-DD)
     * @param  string|null  $token  Optional token override
     */
    public function fetchUserAvailabilities(int $wiwUserId, string $startDate, string $endDate, ?string $token = null): array
    {
        try {
            $response = $this->makeRequest('GET', $this->endpoint, [
                'user_id' => $wiwUserId,
                'start' => $startDate,
                'end' => $endDate,
            ], $token);

            if (! $response->successful()) {
                Log::warning('Failed to fetch availability events from When I Work', [
                    'user_id' => $wiwUserId,
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);

                return [];
            }

            $data = $response->json();

            return $data['availabilityevents'] ?? [];
        } catch (\Exception $e) {
            Log::error('Error fetching availability events', [
                'message' => $e->getMessage(),
                'user_id' => $wiwUserId,
            ]);

            return [];
        }
    }

    /**
     * Find an existing availability event for a user on a specific date
     *
     * @param  int  $wiwUserId  When I Work user ID
     * @param  string  $date  Date (YYYY-MM-DD)
     * @param  string|null  $token  Optional token override
     */
    public function findExistingEvent(int $wiwUserId, string $date, ?string $token = null): ?array
    {
        $events = $this->fetchUserAvailabilities($wiwUserId, $date, $date, $token);

        foreach ($events as $event) {
            $eventDate = $this->extractDateFromEvent($event);
            if ($eventDate === $date) {
                return $event;
            }
        }

        return null;
    }

    /**
     * Create a new availability event in When I Work
     *
     * @param  string|null  $token  Optional token override
     * @return array Returns ['success' => bool, 'event' => array|null, 'error' => string|null, 'status' => int|null]
     */
    public function createAvailabilityEvent(array $payload, ?string $token = null): array
    {
        $this->logDebug('CREATE_REQUEST', $payload);

        try {
            $response = $this->makeRequest('POST', $this->endpoint, $payload, $token);
            $responseData = $response->json();
            $status = $response->status();

            $this->logDebug('CREATE_RESPONSE', [
                'status' => $status,
                'body' => $responseData,
            ]);

            if (! $response->successful()) {
                $errorMessage = $this->extractErrorMessage($responseData, $status);

                Log::error('Failed to create availability event in When I Work', [
                    'payload' => $payload,
                    'status' => $status,
                    'response' => $responseData,
                    'error_message' => $errorMessage,
                ]);

                return [
                    'success' => false,
                    'event' => null,
                    'error' => $errorMessage,
                    'status' => $status,
                    'response' => $responseData,
                ];
            }

            $event = $responseData['availabilityevent'] ?? null;

            if (! $event) {
                Log::warning('Create succeeded but no event returned', [
                    'payload' => $payload,
                    'response' => $responseData,
                ]);

                return [
                    'success' => false,
                    'event' => null,
                    'error' => 'API returned success but no event data',
                    'status' => $status,
                    'response' => $responseData,
                ];
            }

            Log::info('Successfully created availability event in When I Work', [
                'event_id' => $event['id'] ?? 'unknown',
                'user_id' => $payload['user_id'] ?? 'unknown',
            ]);

            return [
                'success' => true,
                'event' => $event,
                'error' => null,
                'status' => $status,
            ];
        } catch (\Exception $e) {
            Log::error('Exception creating availability event', [
                'message' => $e->getMessage(),
                'payload' => $payload,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'event' => null,
                'error' => 'Exception: '.$e->getMessage(),
                'status' => null,
            ];
        }
    }

    /**
     * Update an existing availability event in When I Work
     *
     * @param  int  $eventId  When I Work event ID
     * @param  string|null  $token  Optional token override
     * @return array Returns ['success' => bool, 'event' => array|null, 'error' => string|null, 'status' => int|null]
     */
    public function updateAvailabilityEvent(int $eventId, array $payload, ?string $token = null): array
    {
        $this->logDebug('UPDATE_REQUEST', [
            'event_id' => $eventId,
            'payload' => $payload,
        ]);

        try {
            $response = $this->makeRequest('PUT', "{$this->endpoint}/{$eventId}", $payload, $token);
            $responseData = $response->json();
            $status = $response->status();

            $this->logDebug('UPDATE_RESPONSE', [
                'event_id' => $eventId,
                'status' => $status,
                'body' => $responseData,
            ]);

            if (! $response->successful()) {
                $errorMessage = $this->extractErrorMessage($responseData, $status);

                Log::error('Failed to update availability event in When I Work', [
                    'event_id' => $eventId,
                    'payload' => $payload,
                    'status' => $status,
                    'response' => $responseData,
                    'error_message' => $errorMessage,
                ]);

                return [
                    'success' => false,
                    'event' => null,
                    'error' => $errorMessage,
                    'status' => $status,
                    'response' => $responseData,
                ];
            }

            $event = $responseData['availabilityevent'] ?? ($responseData['availabilityevents'][0] ?? null);

            if (! $event) {
                Log::warning('Update succeeded but no event returned', [
                    'event_id' => $eventId,
                    'response' => $responseData,
                ]);

                return [
                    'success' => false,
                    'event' => null,
                    'error' => 'API returned success but no event data',
                    'status' => $status,
                    'response' => $responseData,
                ];
            }

            Log::info('Successfully updated availability event in When I Work', [
                'event_id' => $eventId,
                'user_id' => $payload['user_id'] ?? 'unknown',
            ]);

            return [
                'success' => true,
                'event' => $event,
                'error' => null,
                'status' => $status,
            ];
        } catch (\Exception $e) {
            Log::error('Exception updating availability event', [
                'message' => $e->getMessage(),
                'event_id' => $eventId,
                'payload' => $payload,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'event' => null,
                'error' => 'Exception: '.$e->getMessage(),
                'status' => null,
            ];
        }
    }

    /**
     * Delete an availability event in When I Work
     *
     * @param  int  $eventId  When I Work event ID
     * @param  string|null  $token  Optional token override
     * @return array Returns ['success' => bool, 'error' => string|null]
     */
    public function deleteAvailabilityEvent(int $eventId, ?string $token = null): array
    {
        $this->logDebug('DELETE_REQUEST', ['event_id' => $eventId]);

        try {
            $response = $this->makeRequest('DELETE', "{$this->endpoint}/{$eventId}", [], $token);
            $status = $response->status();

            $this->logDebug('DELETE_RESPONSE', [
                'event_id' => $eventId,
                'status' => $status,
            ]);

            if (! $response->successful()) {
                $responseData = $response->json();
                $errorMessage = $this->extractErrorMessage($responseData, $status);

                Log::error('Failed to delete availability event in When I Work', [
                    'event_id' => $eventId,
                    'status' => $status,
                    'response' => $responseData,
                ]);

                return [
                    'success' => false,
                    'error' => $errorMessage,
                    'status' => $status,
                ];
            }

            Log::info('Successfully deleted availability event in When I Work', [
                'event_id' => $eventId,
            ]);

            return [
                'success' => true,
                'error' => null,
                'status' => $status,
            ];
        } catch (\Exception $e) {
            Log::error('Exception deleting availability event', [
                'message' => $e->getMessage(),
                'event_id' => $eventId,
            ]);

            return [
                'success' => false,
                'error' => 'Exception: '.$e->getMessage(),
                'status' => null,
            ];
        }
    }

    /**
     * Build payload for When I Work API from local availability data
     *
     * @param  string  $date  Date (YYYY-MM-DD)
     * @param  string  $timeSlot  Local time slot value
     */
    public function buildPayload(User $user, string $date, string $timeSlot): array
    {
        $isAllDay = in_array($timeSlot, ['all-day', 'holiday']);
        $type = $this->mapTimeSlotToType($timeSlot);

        $payload = [
            'account_id' => $user->account_id,
            'user_id' => $user->wheniwork_id,
            'login_id' => (string) $user->login_id,
            'type' => $type,
            'all_day' => $isAllDay,
            'notes' => $this->buildNotes($timeSlot),
        ];

        if ($isAllDay) {
            // All-day events need both start_time and end_time spanning the full day
            // Start at 00:00:00 and end at 23:59:59 of the same day
            $payload['start_time'] = $this->formatDateTimeForApi($date, '00:00:00', $user);
            $payload['end_time'] = $this->formatDateTimeForApi($date, '23:59:59', $user);
        } else {
            [$startTime, $endTime] = $this->parseTimeSlot($timeSlot);
            $payload['start_time'] = $this->formatDateTimeForApi($date, $startTime, $user);
            $payload['end_time'] = $this->formatDateTimeForApi($date, $endTime, $user);
        }

        $this->logDebug('PAYLOAD_BUILT', [
            'date' => $date,
            'time_slot' => $timeSlot,
            'is_all_day' => $isAllDay,
            'payload' => $payload,
        ]);

        return $payload;
    }

    /**
     * Map local time slot to When I Work type
     * Type 1 = Unavailable, Type 2 = Preferred/Available
     */
    public function mapTimeSlotToType(string $timeSlot): int
    {
        return match ($timeSlot) {
            'holiday' => 1,
            default => 2,
        };
    }

    /**
     * Map When I Work event to local availability data
     *
     * @param  array  $event  When I Work event data
     * @param  string|null  $userTimezone  User's timezone for correct time extraction
     * @return array Local availability data
     */
    public function mapEventToLocal(array $event, ?string $userTimezone = null): array
    {
        $date = $this->extractDateFromEvent($event);
        $timeSlot = $this->extractTimeSlotFromEvent($event, $userTimezone);

        return [
            'wheniwork_availability_id' => $event['id'],
            'availability_date' => $date,
            'time_slot' => $timeSlot,
            'status' => 'available',
            'notes' => $event['notes'] ?? null,
        ];
    }

    /**
     * Extract the date from a When I Work event
     *
     * @return string Date in YYYY-MM-DD format
     */
    public function extractDateFromEvent(array $event): string
    {
        $startTime = $event['start_time'];

        if ($event['all_day'] && ! empty($event['events'])) {
            $localStart = $event['events'][0]['start'];

            return Carbon::parse($localStart)->format('Y-m-d');
        }

        return Carbon::parse($startTime)->format('Y-m-d');
    }

    /**
     * Extract time slot from When I Work event
     *
     * CRITICAL: The API returns times in UTC. We need to check the 'events' array
     * which contains the local timezone times, or convert UTC to local.
     *
     * @param  array  $event  When I Work event data
     * @param  string|null  $userTimezone  User's timezone for conversion
     */
    public function extractTimeSlotFromEvent(array $event, ?string $userTimezone = null): string
    {
        if ($event['all_day']) {
            return $event['type'] === 1 ? 'holiday' : 'all-day';
        }

        // For time-based events, use the 'events' array which has local times
        // or convert from UTC to user's timezone
        if (! empty($event['events']) && isset($event['events'][0]['start'])) {
            // 'events' array contains local timezone times
            $startTime = Carbon::parse($event['events'][0]['start']);
            $endTime = Carbon::parse($event['events'][0]['end']);
        } else {
            // Fallback: convert UTC times to user's local timezone
            $timezone = $userTimezone ?? 'UTC';
            $startTime = Carbon::parse($event['start_time'])->setTimezone($timezone);
            $endTime = Carbon::parse($event['end_time'])->setTimezone($timezone);
        }

        $startHour = $startTime->format('G:i');
        $endHour = $endTime->format('G:i');

        $this->logDebug('EXTRACT_TIME_SLOT', [
            'event_id' => $event['id'] ?? null,
            'start_hour' => $startHour,
            'end_hour' => $endHour,
            'user_timezone' => $userTimezone,
        ]);

        if ($startHour === '9:30' && $endHour === '16:30') {
            return '9:30-4:30';
        }

        if ($startHour === '15:30' && $endHour === '22:30') {
            return '3:30-10:30';
        }

        return 'all-day';
    }

    /**
     * Parse time slot string into start and end times
     *
     * @return array [startTime, endTime] in HH:MM:SS format
     */
    protected function parseTimeSlot(string $timeSlot): array
    {
        return match ($timeSlot) {
            '9:30-4:30' => ['09:30:00', '16:30:00'],
            '3:30-10:30' => ['15:30:00', '22:30:00'],
            default => ['00:00:00', '23:59:59'],
        };
    }

    /**
     * Format date and time for When I Work API
     * Format: "Tue, 27 Jan 2026 09:30:00 +0000"
     *
     * CRITICAL DISCOVERY: When I Work API IGNORES timezone offsets!
     * It treats all times as UTC regardless of the offset we send.
     *
     * Example of the bug:
     * - We sent: "15:30:00 +0600" (3:30 PM local)
     * - API stored: "15:30:00 +0000" (treated as 3:30 PM UTC)
     * - API displayed: "21:30:00 +0600" (9:30 PM local - WRONG!)
     *
     * The fix:
     * 1. Parse the time as user's local timezone
     * 2. Convert to UTC
     * 3. Send to API as UTC (+0000)
     *
     * @param  string  $date  YYYY-MM-DD
     * @param  string  $time  HH:MM:SS (in user's local timezone)
     */
    protected function formatDateTimeForApi(string $date, string $time, User $user): string
    {
        $userTimezone = $user->timezone_name ?? 'UTC';

        // Create the datetime IN THE USER'S TIMEZONE
        // This is critical: the time "15:30:00" means 3:30 PM in the user's timezone
        $dateTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            "{$date} {$time}",
            $userTimezone
        );

        // Convert to UTC for the API (When I Work ignores timezone offsets)
        $dateTimeUtc = $dateTime->copy()->setTimezone('UTC');

        $this->logDebug('TIMEZONE_FORMAT', [
            'input_date' => $date,
            'input_time' => $time,
            'user_timezone' => $userTimezone,
            'local_datetime' => $dateTime->format('Y-m-d H:i:s O'),
            'utc_datetime' => $dateTimeUtc->format('Y-m-d H:i:s O'),
            'formatted_api' => $dateTimeUtc->format('D, d M Y H:i:s O'),
        ]);

        // Return in RFC 2822 format as UTC
        // When I Work will store this as UTC and display correctly in user's timezone
        return $dateTimeUtc->format('D, d M Y H:i:s O');
    }

    /**
     * Build notes string for When I Work API
     */
    protected function buildNotes(string $timeSlot): string
    {
        return match ($timeSlot) {
            '9:30-4:30' => 'Morning shift availability',
            '3:30-10:30' => 'Evening shift availability',
            'all-day' => 'Available all day',
            'holiday' => 'Holiday/Day off',
            default => 'Availability',
        };
    }

    /**
     * Make an HTTP request to When I Work API
     *
     * @return \Illuminate\Http\Client\Response
     */
    protected function makeRequest(string $method, string $endpoint, array $data = [], ?string $token = null)
    {
        $token = $token ?? WhenIWorkHelper::getToken();

        if (! $token) {
            throw new \Exception('When I Work token not available');
        }

        $url = config('services.wheniwork.base_url').ltrim($endpoint, '/');

        $request = Http::withHeaders([
            'W-Token' => $token,
        ]);

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \Exception("Unsupported HTTP method: {$method}"),
        };
    }

    /**
     * Categorize a date as past, current (today), or future
     *
     * @param  string  $date  YYYY-MM-DD
     * @return string 'past', 'current', or 'future'
     */
    public function categorizeDate(string $date): string
    {
        $dateCarbon = Carbon::parse($date)->startOfDay();
        $today = Carbon::now()->startOfDay();

        if ($dateCarbon->lt($today)) {
            return 'past';
        }

        if ($dateCarbon->eq($today)) {
            return 'current';
        }

        return 'future';
    }

    /**
     * Extract user-friendly error message from API response
     */
    protected function extractErrorMessage(?array $responseData, int $status): string
    {
        if (! $responseData) {
            return "API error (HTTP {$status})";
        }

        if (isset($responseData['error'])) {
            $error = $responseData['error'];
            $code = $responseData['code'] ?? '';

            // Handle specific error codes
            if ($status === 409 || $code === 4090) {
                return 'Availability conflicts with an existing event. Please delete the existing event first.';
            }

            return $error;
        }

        if (isset($responseData['message'])) {
            return $responseData['message'];
        }

        return "API error (HTTP {$status})";
    }

    /**
     * Log debug information (only in local environment)
     */
    protected function logDebug(string $action, array $data): void
    {
        if ($this->debugMode) {
            Log::debug("WhenIWork API [{$action}]", $data);
        }
    }
}
