<?php

use App\Http\Controllers\UserSelectionController;
use App\Http\Controllers\AvailabilityController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Availability Routes
    Route::get('/dashboard', [AvailabilityController::class, 'index'])->name('dashboard');
    Route::get('/availability', [AvailabilityController::class, 'index'])->name('availability.index');
    Route::post('/availability', [AvailabilityController::class, 'store'])->name('availability.store');

    Route::controller(UserSelectionController::class)->middleware(['admin'])->prefix('admin')->name('admin.')->group([], function () {
        Route::get('/users/list', 'getUsers')->name('users.list');
        Route::get('/users/{userId}/availability', 'getUserAvailability')->name('users.availability');
    });
});

require __DIR__ . '/settings.php';
