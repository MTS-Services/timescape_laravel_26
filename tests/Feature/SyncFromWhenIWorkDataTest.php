<?php

use App\Models\User;

it('preserves existing user fields when API data is incomplete on login sync', function () {
    // Simulate an existing user with locally-managed data
    $user = User::factory()->create([
        'wheniwork_id' => 12345,
        'account_id' => 100,
        'email' => 'test@example.com',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'notes' => 'Priority=4 Some important notes',
        'priority' => 4,
        'hours_preferred' => 40.00,
        'hours_max' => 50.00,
        'hourly_rate' => 25.50,
        'employee_code' => 'EMP001',
        'role' => 2,
        'is_admin' => false,
    ]);

    // Simulate the fallback login path (mapLoginDataToUserData) which returns minimal data
    $incompleteApiData = [
        'id' => 12345,
        'account_id' => 100,
        'login_id' => 999,
        'email' => 'test@example.com',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'phone_number' => '555-1234',
        'role' => 3,
        'activated' => true,
        'is_active' => true,
    ];

    User::syncFromWhenIWorkData($incompleteApiData, 'fake-token', null);

    $user->refresh();

    // Fields NOT in the API data must be preserved
    expect($user->notes)->toBe('Priority=4 Some important notes');
    expect($user->priority)->toBe(4);
    expect((float) $user->hours_preferred)->toBe(40.00);
    expect((float) $user->hours_max)->toBe(50.00);
    expect((float) $user->hourly_rate)->toBe(25.50);
    expect($user->employee_code)->toBe('EMP001');

    // Fields IN the API data should be updated
    expect($user->first_name)->toBe('Jane');
    expect($user->last_name)->toBe('Doe');
    expect($user->role->value)->toBe(3);
    expect($user->wheniwork_token)->toBe('fake-token');
});

it('updates user fields when API data includes them', function () {
    $user = User::factory()->create([
        'wheniwork_id' => 12345,
        'account_id' => 100,
        'email' => 'test@example.com',
        'notes' => 'Old notes',
        'priority' => 2,
        'hours_preferred' => 20.00,
    ]);

    // Full API response that includes notes and other fields
    $fullApiData = [
        'id' => 12345,
        'account_id' => 100,
        'login_id' => 999,
        'email' => 'test@example.com',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'phone_number' => '555-1234',
        'role' => 2,
        'activated' => true,
        'is_active' => true,
        'notes' => 'Priority=5 New notes from API',
        'hours_preferred' => 35,
        'hours_max' => 45,
        'hourly_rate' => 30,
        'employee_code' => 'EMP002',
        'employment_type' => 'salary',
    ];

    User::syncFromWhenIWorkData($fullApiData, 'fake-token', null);

    $user->refresh();

    // Fields present in API data should be updated
    expect($user->notes)->toBe('Priority=5 New notes from API');
    expect($user->priority)->toBe(5);
    expect((float) $user->hours_preferred)->toBe(35.00);
    expect((float) $user->hours_max)->toBe(45.00);
    expect((float) $user->hourly_rate)->toBe(30.00);
    expect($user->employee_code)->toBe('EMP002');
    expect($user->employment_type)->toBe('salary');
});

it('creates a new user with defaults for missing fields', function () {
    $apiData = [
        'id' => 99999,
        'account_id' => 200,
        'login_id' => 888,
        'email' => 'new@example.com',
        'first_name' => 'New',
        'last_name' => 'User',
        'role' => 3,
        'activated' => true,
        'is_active' => true,
    ];

    $user = User::syncFromWhenIWorkData($apiData, 'new-token', null);

    expect($user)->toBeInstanceOf(User::class);
    expect($user->exists)->toBeTrue();
    expect($user->wheniwork_id)->toBe(99999);
    expect($user->email)->toBe('new@example.com');
    expect($user->notes)->toBeNull();
    expect($user->priority)->toBeNull();
    expect($user->wheniwork_token)->toBe('new-token');
});
