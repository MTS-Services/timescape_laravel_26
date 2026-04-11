<?php

use App\Models\Location;
use App\Models\LocationUser;
use App\Models\User;

it('includes users in activeAtLocation when pivot is active', function () {
    $location = Location::create([
        'account_id' => 90001,
        'wheniwork_location_id' => 77001,
        'name' => 'Test Site',
    ]);

    $user = User::factory()->create([
        'account_id' => 90001,
        'wheniwork_id' => 88001,
        'location_id' => $location->id,
    ]);

    LocationUser::create([
        'user_id' => $user->id,
        'location_id' => $location->id,
    ]);

    $ids = User::query()->activeAtLocation($location->id)->pluck('id');

    expect($ids->contains($user->id))->toBeTrue();
});

it('excludes users from activeAtLocation when pivot is soft deleted', function () {
    $location = Location::create([
        'account_id' => 90002,
        'wheniwork_location_id' => 77002,
        'name' => 'Test Site B',
    ]);

    $user = User::factory()->create([
        'account_id' => 90002,
        'wheniwork_id' => 88002,
        'location_id' => $location->id,
    ]);

    $pivot = LocationUser::create([
        'user_id' => $user->id,
        'location_id' => $location->id,
    ]);
    $pivot->delete();

    $ids = User::query()->activeAtLocation($location->id)->pluck('id');

    expect($ids->contains($user->id))->toBeFalse();
});

it('restores soft-deleted pivot via syncLocationMembershipsFromWhenIWork', function () {
    $location = Location::create([
        'account_id' => 90003,
        'wheniwork_location_id' => 77003,
        'name' => 'Test Site C',
    ]);

    $user = User::factory()->create([
        'account_id' => 90003,
        'wheniwork_id' => 88003,
        'location_id' => $location->id,
    ]);

    $pivot = LocationUser::create([
        'user_id' => $user->id,
        'location_id' => $location->id,
    ]);
    $pivot->delete();

    $byWiw = [77003 => $location->id];

    $user->syncLocationMembershipsFromWhenIWork(['locations' => [77003]], $byWiw);

    $pivot->refresh();
    expect($pivot->deleted_at)->toBeNull();
});

it('excludes users without matching pivot from getUsersByEmail', function () {
    $location = Location::create([
        'account_id' => 90004,
        'wheniwork_location_id' => 77004,
        'name' => 'Test Site D',
    ]);

    User::factory()->create([
        'email' => 'shared@example.test',
        'account_id' => 90004,
        'wheniwork_id' => 88004,
        'location_id' => $location->id,
    ]);

    $users = User::getUsersByEmail('shared@example.test');

    expect($users)->toHaveCount(0);
});
