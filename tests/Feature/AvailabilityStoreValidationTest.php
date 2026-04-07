<?php

use App\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;

test('non-priority-1 user cannot submit priority-1-only time slots', function () {
    $user = User::factory()->create([
        'role' => UserRole::EMPLOYEE,
        'priority' => 2,
        'first_name' => 'Staff',
        'last_name' => 'Two',
    ]);

    $date = Carbon::now()->addWeek()->format('Y-m-d');

    $response = $this->actingAs($user)->post(route('availability.store'), [
        'selections' => [$date => '9:30-5:30'],
        'year' => (int) substr($date, 0, 4),
        'month' => (int) substr($date, 5, 2),
    ]);

    $response->assertSessionHasErrors();
});

test('priority-1 user cannot submit standard-only shift slots', function () {
    $user = User::factory()->create([
        'role' => UserRole::EMPLOYEE,
        'priority' => 1,
        'first_name' => 'Staff',
        'last_name' => 'One',
    ]);

    $date = Carbon::now()->addWeek()->format('Y-m-d');

    $response = $this->actingAs($user)->post(route('availability.store'), [
        'selections' => [$date => '9:30-4:30'],
        'year' => (int) substr($date, 0, 4),
        'month' => (int) substr($date, 5, 2),
    ]);

    $response->assertSessionHasErrors();
});

test('admin cannot save priority-1 slots for a non-priority-1 target user', function () {
    $admin = User::factory()->create([
        'role' => UserRole::ADMIN,
        'priority' => null,
        'first_name' => 'Admin',
        'last_name' => 'User',
    ]);

    $staff = User::factory()->create([
        'role' => UserRole::EMPLOYEE,
        'priority' => 3,
        'first_name' => 'Staff',
        'last_name' => 'Three',
    ]);

    $date = Carbon::now()->addWeek()->format('Y-m-d');

    $response = $this->actingAs($admin)->post(route('availability.store'), [
        'user_id' => $staff->id,
        'selections' => [$date => '2:00-10:00'],
        'year' => (int) substr($date, 0, 4),
        'month' => (int) substr($date, 5, 2),
    ]);

    $response->assertSessionHasErrors();
});

test('priority-1 user may submit extended shift slots when saving locally', function () {
    $user = User::factory()->create([
        'role' => UserRole::EMPLOYEE,
        'priority' => 1,
        'wheniwork_id' => null,
        'first_name' => 'Staff',
        'last_name' => 'P1',
    ]);

    $date = Carbon::now()->addWeek()->format('Y-m-d');

    $response = $this->actingAs($user)->post(route('availability.store'), [
        'selections' => [$date => '9:30-5:30'],
        'year' => (int) substr($date, 0, 4),
        'month' => (int) substr($date, 5, 2),
    ]);

    $response->assertSessionDoesntHaveErrors();
});
