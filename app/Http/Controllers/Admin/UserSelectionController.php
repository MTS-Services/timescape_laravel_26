<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserSelectionController extends Controller
{
    /**
     * Get a list of all users for admin selection panel
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsers(Request $request)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get all users
        $users = User::select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'users' => $users
        ]);
    }

    /**
     * Get availability data for a specific user (admin only)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserAvailability(Request $request)
    {
        // Validate request
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'year' => ['required', 'integer', 'between:2020,2030'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get the user
        $targetUser = User::find($validated['user_id']);
        if (!$targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Get availability data from the service
        $availabilityService = app(\App\Services\AvailabilityService::class);
        
        $availabilities = $availabilityService->getAvailabilitiesForMonth(
            $targetUser->id,
            $validated['year'],
            $validated['month']
        );

        $requirements = $availabilityService->checkRequirements(
            $targetUser->id,
            $validated['year'],
            $validated['month']
        );

        // Add statistics for this user
        $statistics = $availabilityService->getUserStatistics(
            $targetUser->id,
            $validated['year'],
            $validated['month']
        );

        return response()->json([
            'availabilities' => $availabilities,
            'requirements' => $requirements,
            'statistics' => $statistics,
            'userName' => $targetUser->name,
        ]);
    }
}
