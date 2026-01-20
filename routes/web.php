<?php

use App\Http\Controllers\AvailabilityController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserDashboardController;

// Route::get('/', function () {
//     return Inertia::render('welcome', [
//         'canRegister' => Features::enabled(Features::registration()),
//     ]);
// })->name('home');

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('user/dashboard');
//     })->name('dashboard');
// });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', UserDashboardController::class)->name('user.dashboard');
});

Route::resource('todos', \App\Http\Controllers\TodoController::class)
    ->only(['index', 'store', 'update', 'destroy']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/availability', [AvailabilityController::class, 'index'])
        ->name('availability.index');

    Route::post('/availability', [AvailabilityController::class, 'store'])
        ->name('availability.store');

    Route::get('/availability/month', [AvailabilityController::class, 'getMonth'])
        ->name('availability.month');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/frontend.php';
require __DIR__ . '/user.php';
require __DIR__ . '/admin.php';
