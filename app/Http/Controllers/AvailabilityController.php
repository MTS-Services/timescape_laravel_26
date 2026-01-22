<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAvailabilityRequest;
use App\Services\AvailabilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class AvailabilityController extends Controller
{
    public function __construct(
        private AvailabilityService $availabilityService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $now = now();
        $year = (int) $request->get('year', $now->year);
        $month = (int) $request->get('month', $now->month);
        $selectedUserId = (int) $request->get('user_id', $user->id);

        Log::info('Loading availability page', [
            'user_id' => $user->id,
            'year' => $year,
            'month' => $month,
            'selected_user_id' => $selectedUserId,
        ]);

        // If user is admin, they can view other users' data
        $targetUserId = $user->is_admin && $selectedUserId !== $user->id ? $selectedUserId : $user->id;

        $availabilities = $this->availabilityService->getAvailabilitiesForMonth(
            $targetUserId,
            $year,
            $month
        );

        $requirements = $this->availabilityService->checkRequirements(
            $targetUserId,
            $year,
            $month
        );

        // Get user statistics if admin
        $statistics = null;
        if ($user->is_admin) {
            $filterType = $request->get('filter_type', 'month');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $statistics = $this->availabilityService->getUserStatistics(
                $targetUserId,
                $year,
                $month,
                $filterType,
                $startDate,
                $endDate
            );
        }

        // Get all users if admin
        $users = [];
        if ($user->is_admin) {
            $users = \App\Models\User::select('id', 'first_name', 'last_name', 'email')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                    ];
                });
        }

        Log::info('Returning availability data', [
            'availabilities_count' => count($availabilities),
            'requirements' => $requirements,
            'has_statistics' => !is_null($statistics),
        ]);

        return Inertia::render('availability/index', [
            'initialSelections' => $availabilities,
            'requirements' => $requirements,
            'currentYear' => $year,
            'currentMonth' => $month,
            'statistics' => $statistics,
            'users' => $users,
            'selectedUserId' => $targetUserId,
        ]);
    }

    public function store(StoreAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();

        Log::info('Storing availability', [
            'user_id' => $user->id,
            'selections' => $request->validated('selections'),
        ]);

        $this->availabilityService->saveAvailabilities(
            $user->id,
            $request->validated('selections')
        );

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $requirements = $this->availabilityService->checkRequirements(
            $user->id,
            $year,
            $month
        );

        Log::info('Availability saved successfully', [
            'requirements' => $requirements,
        ]);

        return back()->with([
            'success' => 'Availability updated successfully!',
            'requirements' => $requirements,
        ]);
    }
}
