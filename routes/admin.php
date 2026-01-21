<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AvailabilityController;
use App\Http\Controllers\Admin\UserController;

Route::group(['as' => 'admin.', 'prefix' => 'admin', 'middleware' => ['auth', 'verified']], function () {
    Route::get('dashboard', AdminDashboardController::class)->name('dashboard');

    Route::resource('users', UserController::class)->names('users');

    Route::controller(AvailabilityController::class)->prefix('availability')->name('availability.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/month', 'getMonth')->name('month');
    });
});
