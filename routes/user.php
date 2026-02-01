<?php

use App\Http\Controllers\User\DashboardController as UserDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->prefix('user')->name('user.')->group(function () {
    Route::get('dashboard', UserDashboardController::class)->name('dashboard');
});
