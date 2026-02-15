<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserSelectionController extends Controller
{
    /**
     * Get a list of users for admin selection panel
     *
     * Scoped by account_id unless CAN_MANAGE_ALL is true.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsers(Request $request)
    {
        $currentUser = $request->user();

        // Check if user is admin
        if (! $currentUser->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Build query with account_id scoping based on CAN_MANAGE_ALL config
        $query = User::select('id', 'first_name', 'last_name', 'email', 'account_id', 'priority')
            ->orderBy('priority', 'asc')
            ->orderBy('first_name')
            ->orderBy('last_name');

        // Scope to same account_id unless CAN_MANAGE_ALL is enabled
        if (! config('availability.can_manage_all', false)) {
            $query->where('account_id', $currentUser->account_id);
        }

        $users = $query->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'account_id' => $user->account_id,
                    'priority' => $user->priority,
                ];
            });

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Get availability data for a specific user (admin only)
     *
     * Enforces account_id scoping unless CAN_MANAGE_ALL is true.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserAvailability(Request $request)
    {
        $currentUser = $request->user();

        // Validate request
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'year' => ['required', 'integer', 'between:2020,2030'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        // Check if user is admin
        if (! $currentUser->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get the target user
        $targetUser = User::find($validated['user_id']);
        if (! $targetUser) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Enforce account_id scoping unless CAN_MANAGE_ALL is enabled
        if (! config('availability.can_manage_all', false)) {
            if ($targetUser->account_id !== $currentUser->account_id) {
                return response()->json(['error' => 'Cannot access users from other accounts'], 403);
            }
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
