<?php

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
});

require __DIR__ . '/settings.php';
require __DIR__ . '/admin.php';
