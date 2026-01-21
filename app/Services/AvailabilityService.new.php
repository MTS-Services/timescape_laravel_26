<?php

namespace App\Services;

use App\Models\Availability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AvailabilityService
{
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

    public function saveAvailabilities(int $userId, array $selections): void
    {
        // Use server's today, not Carbon::today() which might have timezone issues
        $today = Carbon::now()->startOfDay();

        foreach ($selections as $date => $timeSlot) {
            // Parse the date string as a Carbon instance
            $dateCarbon = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

            // Only prevent saving to dates BEFORE today
            if ($dateCarbon->lt($today)) {
                Log::info('Skipping past date', ['date' => $date, 'today' => $today->format('Y-m-d')]);
                continue;
            }

            if ($timeSlot === null) {
                Availability::where('user_id', $userId)
                    ->where('availability_date', $date)
                    ->delete();
                Log::info('Deleted availability', ['date' => $date]);
                continue;
            }

            Availability::updateOrCreate(
                [
                    'user_id' => $userId,
                    'availability_date' => $date,
                ],
                [
                    'time_slot' => $timeSlot,
                    'status' => 'available',
                ]
            );

            Log::info('Saved availability', ['date' => $date, 'time_slot' => $timeSlot]);
        }
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
     * @param int $userId
     * @param int $year
     * @param int $month
     * @param string|null $filterType 'month', 'year', or 'custom'
     * @param string|null $startDate For custom date range
     * @param string|null $endDate For custom date range
     * @return array
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
