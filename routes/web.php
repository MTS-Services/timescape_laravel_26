<?php

use App\Http\Controllers\Auth\WorkLocationController;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\UserSelectionController;
use App\Http\Controllers\UserStatsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

// Work Location Selection (for multi-account users)
Route::middleware(['auth'])->group(function () {
    Route::get('/select-work-location', [WorkLocationController::class, 'show'])
        ->name('auth.select-work-location');
    Route::post('/select-work-location', [WorkLocationController::class, 'select'])
        ->name('auth.select-work-location.store');
});

Route::middleware(['auth', 'verified', 'location.selected'])->group(function () {
    // Availability Routes
    Route::get('/dashboard', [AvailabilityController::class, 'index'])->name('dashboard');
    Route::get('/availability', [AvailabilityController::class, 'index'])->name('availability.index');
    Route::post('/availability', [AvailabilityController::class, 'store'])->name('availability.store');

    Route::controller(UserSelectionController::class)->middleware(['admin'])->prefix('admin')->name('admin.')->group([], function () {
        Route::get('/users/list', 'getUsers')->name('users.list');
        Route::get('/users/{userId}/availability', 'getUserAvailability')->name('users.availability');
    });

    Route::get('/users/stats', [UserStatsController::class, 'stats'])->middleware(['admin'])->name('admin.stats');

    Route::controller(UserStatsController::class)->middleware(['admin'])->prefix('admin')->name('admin.stats.')->group(function () {
        Route::get('/users/stats/data', 'data')->name('data');
        Route::post('/users/stats/sync', 'sync')->name('sync');
    });
});

require __DIR__ . '/settings.php';
