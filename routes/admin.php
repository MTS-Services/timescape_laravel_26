<?php

use App\Http\Controllers\Admin\UserSelectionController;
use Illuminate\Support\Facades\Route;

// Admin-only routes
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    // User selection endpoints for admin panel
    Route::get('/admin/users/list', [UserSelectionController::class, 'getUsers'])->name('admin.users.list');
    Route::get('/admin/users/{userId}/availability', [UserSelectionController::class, 'getUserAvailability'])->name('admin.users.availability');
});
