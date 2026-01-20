<?php

namespace App\Services;

use App\Models\Availability;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AvailabilityService
{
    public function getAvailabilitiesForMonth(int $userId, int $year, int $month): array
    {
        $availabilities = Availability::forUser($userId)
            ->forMonth($year, $month)
            ->get()
            ->keyBy(fn($item) => $item->availability_date->format('Y-m-d'))
            ->map(fn($item) => $item->time_slot)
            ->toArray();

        return $availabilities;
    }

    public function saveAvailabilities(int $userId, array $selections): void
    {
        foreach ($selections as $date => $timeSlot) {
            if ($timeSlot === null) {
                Availability::where('user_id', $userId)
                    ->where('availability_date', $date)
                    ->delete();
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
        }
    }

    public function checkRequirements(int $userId, int $year, int $month): array
    {
        $availabilities = Availability::forUser($userId)
            ->forMonth($year, $month)
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
