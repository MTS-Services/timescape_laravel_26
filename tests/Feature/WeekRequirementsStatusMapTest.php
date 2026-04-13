<?php

use App\Models\Availability;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;

it('counts Saturday all-day toward weekend when reference date is that Saturday', function () {
    $user = User::factory()->create();

    // Week of 2026-04-13 (Mon) .. 2026-04-19 (Sun). Saturday = 2026-04-18.
    Availability::factory()->create([
        'user_id' => $user->id,
        'availability_date' => '2026-04-13',
        'time_slot' => 'all-day',
    ]);
    Availability::factory()->create([
        'user_id' => $user->id,
        'availability_date' => '2026-04-14',
        'time_slot' => '9:30-4:30',
    ]);
    Availability::factory()->create([
        'user_id' => $user->id,
        'availability_date' => '2026-04-18',
        'time_slot' => 'all-day',
    ]);

    $referenceSaturday = Carbon::parse('2026-04-18', 'UTC');

    $map = app(AvailabilityService::class)->getWeekRequirementsStatusMap(
        [(int) $user->id],
        $referenceSaturday,
        null
    );

    expect($map[(int) $user->id])->toBeTrue();
});
