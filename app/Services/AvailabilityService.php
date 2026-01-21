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
}
