<?php

// use App\Http\Controllers\AvailabilityController;
// use Illuminate\Support\Facades\Route;

// Route::resource('todos', \App\Http\Controllers\TodoController::class)
//     ->only(['index', 'store', 'update', 'destroy']);

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::controller(AvailabilityController::class)->group(function () {
//         Route::get('/dashboard', 'index')->name('dashboard');
//         Route::group(['as' => 'availability.', 'prefix' => 'availability'], function () {
//             Route::post('/', 'store')->name('store');
//             // Route::get('/month', 'getMonth')->name('month');
//         });
//     });
// });

// require __DIR__ . '/settings.php';
// require __DIR__ . '/frontend.php';
// require __DIR__ . '/admin.php';


use App\Http\Controllers\AvailabilityController;
use Illuminate\Support\Facades\Route;

Route::resource('todos', \App\Http\Controllers\TodoController::class)
    ->only(['index', 'store', 'update', 'destroy']);

Route::middleware(['auth', 'verified'])->group(function () {
    // Availability Routes
    Route::get('/dashboard', [AvailabilityController::class, 'index'])->name('dashboard');
    Route::get('/availability', [AvailabilityController::class, 'index'])->name('availability.index');
    Route::post('/availability', [AvailabilityController::class, 'store'])->name('availability.store');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/frontend.php';
require __DIR__ . '/admin.php';
