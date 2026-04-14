<?php

use App\Jobs\SyncUserAvailabilityRangeJob;
use App\Models\Availability;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Bus;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config()->set('availability.can_manage_all', true);
});

it('returns total holidays metrics for stats rows and summary', function () {
    $location = Location::query()->create([
        'account_id' => 10,
        'wheniwork_location_id' => 1001,
        'name' => 'Main',
    ]);

    $admin = User::factory()->create([
        'role' => 1,
        'is_admin' => true,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);

    $staff = User::factory()->create([
        'role' => 3,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $staff->locations()->attach($location->id);

    Availability::query()->create([
        'user_id' => $staff->id,
        'availability_date' => Carbon::yesterday()->format('Y-m-d'),
        'time_slot' => 'holiday',
    ]);
    Availability::query()->create([
        'user_id' => $staff->id,
        'availability_date' => Carbon::tomorrow()->format('Y-m-d'),
        'time_slot' => 'holiday',
    ]);

    $startDate = Carbon::yesterday()->format('Y-m-d');
    $endDate = Carbon::tomorrow()->format('Y-m-d');

    $response = $this
        ->actingAs($admin)
        ->withSession(['selected_location_id' => $location->id])
        ->get(route('admin.stats', [
            'filter_type' => 'custom',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('availability/stats')
        ->where('summary.total_holidays', 2)
        ->has('rows', 1)
        ->where('rows.0.leave_taken', 1)
        ->where('rows.0.upcoming_leave', 1)
        ->where('rows.0.total_holidays', 2)
    );
});

it('auto dispatches sync jobs once per hour per admin and range', function () {
    Bus::fake();

    $location = Location::query()->create([
        'account_id' => 10,
        'wheniwork_location_id' => 1001,
        'name' => 'Main',
    ]);

    $admin = User::factory()->create([
        'role' => 1,
        'is_admin' => true,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userA = User::factory()->create([
        'role' => 3,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userA->locations()->attach($location->id);
    $userB = User::factory()->create([
        'role' => 3,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userB->locations()->attach($location->id);

    $this
        ->actingAs($admin)
        ->withSession(['selected_location_id' => $location->id])
        ->get(route('admin.stats', [
            'filter_type' => 'custom',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]))
        ->assertOk();

    Bus::assertDispatchedTimes(SyncUserAvailabilityRangeJob::class, 2);

    $this
        ->actingAs($admin)
        ->withSession(['selected_location_id' => $location->id])
        ->get(route('admin.stats', [
            'filter_type' => 'custom',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]))
        ->assertOk();

    Bus::assertDispatchedTimes(SyncUserAvailabilityRangeJob::class, 2);

    $this
        ->actingAs($admin)
        ->withSession(['selected_location_id' => $location->id])
        ->get(route('admin.stats', [
            'filter_type' => 'custom',
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-31',
        ]))
        ->assertOk();

    Bus::assertDispatchedTimes(SyncUserAvailabilityRangeJob::class, 4);

    Bus::assertDispatched(SyncUserAvailabilityRangeJob::class, function (SyncUserAvailabilityRangeJob $job) use ($userA, $userB) {
        return in_array($job->userId, [$userA->id, $userB->id], true);
    });
});

it('still allows manual sync endpoint and queues selected users', function () {
    Bus::fake();

    $location = Location::query()->create([
        'account_id' => 10,
        'wheniwork_location_id' => 1001,
        'name' => 'Main',
    ]);

    $admin = User::factory()->create([
        'role' => 1,
        'is_admin' => true,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userA = User::factory()->create([
        'role' => 3,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userA->locations()->attach($location->id);
    $userB = User::factory()->create([
        'role' => 3,
        'account_id' => 10,
        'location_id' => $location->id,
    ]);
    $userB->locations()->attach($location->id);

    $response = $this
        ->actingAs($admin)
        ->withSession(['selected_location_id' => $location->id])
        ->postJson(route('admin.stats.sync'), [
            'user_ids' => [$userA->id, $userB->id],
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
        ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Sync jobs queued.',
            'queued_users' => 2,
        ]);

    Bus::assertDispatchedTimes(SyncUserAvailabilityRangeJob::class, 2);
});
