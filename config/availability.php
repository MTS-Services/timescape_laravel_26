<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Can Edit Today
    |--------------------------------------------------------------------------
    |
    | This option controls whether users can create or update availability
    | for the current date. When set to false, today's date will be treated
    | the same as past dates (read-only).
    |
    */

    'can_edit_today' => env('CAN_EDIT_TODAY', false),

    /*
    |--------------------------------------------------------------------------
    | Include Holiday in Duty Days
    |--------------------------------------------------------------------------
    |
    | This option controls whether holiday/unavailable records are counted
    | in the total duty days calculation.
    | - false: Holidays are excluded from duty day count
    | - true: Holidays are included in duty day count
    |
    */

    'include_holiday_in_duty_days' => env('INCLUDE_HOLIDAY_IN_DUTY_DAYS', false),

    /*
    |--------------------------------------------------------------------------
    | Timezone Mode
    |--------------------------------------------------------------------------
    |
    | This option controls how the application handles timezones.
    | - 'utc': All dates/times are stored and displayed in UTC
    | - 'local': Dates/times are converted to/from user's timezone
    |
    */

    'timezone_mode' => env('AVAILABILITY_TIMEZONE_MODE', 'utc'),

    /*
    |--------------------------------------------------------------------------
    | Sync Mode
    |--------------------------------------------------------------------------
    |
    | This option controls when availability data is synced from When I Work.
    | - 'login': Fetch all availability data immediately upon user login
    | - 'periodic': Fetch availability data only when a specific month is visited
    |
    */

    'sync_mode' => env('AVAILABILITY_SYNC_MODE', 'periodic'),

    /*
    |--------------------------------------------------------------------------
    | When I Work API Settings
    |--------------------------------------------------------------------------
    |
    | Settings specific to When I Work availability events API.
    |
    */

    'wheniwork' => [
        'availability_endpoint' => 'availabilityevents',
    ],

];
