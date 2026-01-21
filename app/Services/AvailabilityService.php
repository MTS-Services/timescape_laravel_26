<?php

namespace App\Services;

use App\Models\Availability;
use Carbon\Carbon;

class AvailabilityService
{
    public function getAvailabilitiesForMonth(int $userId, int $year, int $month): array
    {
        // Get the entire calendar view range (includes overflow from prev/next months)
        $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
        $monthEnd = Carbon::create($year, $month, 1)->endOfMonth();

        // Expand to full weeks (Monday to Sunday)
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
        $today = Carbon::today();

        foreach ($selections as $date => $timeSlot) {
            $dateCarbon = Carbon::parse($date);

            // CRITICAL: Only prevent saving to dates BEFORE today (not including today)
            if ($dateCarbon->lt($today)) {
                continue;
            }

            if ($timeSlot === null) {
                // Delete availability if null (user unchecked)
                Availability::where('user_id', $userId)
                    ->where('availability_date', $date)
                    ->delete();
                continue;
            }

            // Save or update availability (today and future dates allowed)
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
        }
    }

    public function checkRequirements(int $userId, int $year, int $month): array
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();
        $today = Carbon::today();

        // Count availabilities from today onwards (including today)
        $availabilities = Availability::forUser($userId)
            ->whereBetween('availability_date', [$startDate, $endDate])
            ->where('availability_date', '>=', $today)
            ->whereNotNull('time_slot')
            ->get();

        $weekdayCount = $availabilities->filter(function ($availability) {
            $dayOfWeek = $availability->availability_date->dayOfWeek;
            return $dayOfWeek >= 1 && $dayOfWeek <= 5; // Mon-Fri
        })->count();

        $weekendCount = $availabilities->filter(function ($availability) {
            $dayOfWeek = $availability->availability_date->dayOfWeek;
            return $dayOfWeek === 0 || $dayOfWeek === 6; // Sat-Sun
        })->count();

        return [
            'weekday_blocks' => $weekdayCount,
            'weekend_blocks' => $weekendCount,
            'weekday_requirement_met' => $weekdayCount >= 3,
            'weekend_requirement_met' => $weekendCount >= 2,
            'all_requirements_met' => $weekdayCount >= 3 && $weekendCount >= 2,
        ];
    }
}
