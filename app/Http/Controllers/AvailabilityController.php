<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAvailabilityRequest;
use App\Jobs\SyncUserAvailabilityJob;
use App\Services\AvailabilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

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

        // If user has can_manage_users permission, they can view other users' data
        $targetUserId = $user->can_manage_users && $selectedUserId !== $user->id ? $selectedUserId : $user->id;

        $availabilities = $this->availabilityService->getAvailabilitiesForMonth(
            $targetUserId,
            $year,
            $month
        );

        // Get current week requirements (for backward compatibility)
        $requirements = $this->availabilityService->checkRequirements($targetUserId);

        // Get weekly requirements for the entire month view
        $weeklyRequirements = $this->availabilityService->getWeeklyRequirements(
            $targetUserId,
            $year,
            $month
        );

        // Get user statistics if user has can_manage_users permission
        $statistics = null;
        if ($user->can_manage_users) {
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

        // Get all users if user has can_manage_users permission
        // Scoped by account_id unless CAN_MANAGE_ALL is true
        $users = [];
        if ($user->can_manage_users) {
            $query = \App\Models\User::select('id', 'first_name', 'last_name', 'email', 'account_id', 'priority')
                ->orderBy('priority', 'asc')
                ->orderBy('first_name')
                ->orderBy('last_name');

            // Scope to same account_id unless CAN_MANAGE_ALL is enabled
            if (! config('availability.can_manage_all', false)) {
                $query->where('account_id', $user->account_id);
            }

            $users = $query->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'account_id' => $u->account_id,
                        'priority' => $u->priority,
                    ];
                });
        }

        Log::info('Returning availability data', [
            'availabilities_count' => count($availabilities),
            'requirements' => $requirements,
            'weekly_requirements_count' => count($weeklyRequirements),
            'has_statistics' => ! is_null($statistics),
        ]);

        if (config('availability.sync_mode') === 'periodic') {
            $targetUser = \App\Models\User::find($targetUserId);
            if ($targetUser && $targetUser->wheniwork_id) {
                $date = $request->get('date', now()->toDateString());
                // Session-based job deduplication: only fetch once per month per session per date and per hour
                $hour = now()->hour;
                $sessionKey = "availability_fetch_{$year}_{$month}_{$date}_{$hour}_user_{$targetUserId}";

                if (! Session::has($sessionKey)) {
                    Log::info('Dispatching availability sync job', [
                        'user_id' => $targetUserId,
                        'year' => $year,
                        'month' => $month,
                        'date' => $date,
                        'session_key' => $sessionKey,
                    ]);

                    SyncUserAvailabilityJob::dispatch(
                        $targetUserId,
                        $user->wheniwork_token,
                        $year,
                        $month,
                        $date
                    );

                    // Mark this month as fetched for this session
                    Session::put($sessionKey, now()->toIso8601String());
                } else {
                    Log::debug('Skipping sync job - already fetched this session', [
                        'session_key' => $sessionKey,
                        'fetched_at' => Session::get($sessionKey),
                    ]);
                }
            }
        }

        // Check for user sync status from cache (set by SyncWhenIWorkUsersJob)
        $userSyncSuccess = Cache::pull("user_sync_success_{$user->id}");
        $userSyncError = Cache::pull("user_sync_error_{$user->id}");

        $props = [
            'initialSelections' => $availabilities,
            'requirements' => $requirements,
            'weeklyRequirements' => $weeklyRequirements,
            'currentYear' => $year,
            'currentMonth' => $month,
            'statistics' => $statistics,
            'users' => $users,
            'selectedUserId' => $targetUserId,
            'canEditToday' => config('availability.can_edit_today', false),
        ];

        // Add user sync notifications if present
        if ($userSyncSuccess) {
            $props['userSyncSuccess'] = $userSyncSuccess;
        }
        if ($userSyncError) {
            $props['userSyncError'] = $userSyncError;
        }

        return Inertia::render('availability/index', $props);
    }

    public function store(StoreAvailabilityRequest $request): RedirectResponse
    {
        $user = $request->user();
        $selectedUserId = (int) $request->input('user_id', $user->id);

        // Determine target user: if user has can_manage_users permission and selected another user, use that
        $targetUserId = $user->can_manage_users && $selectedUserId !== $user->id ? $selectedUserId : $user->id;

        $selections = $request->validated('selections');

        Log::info('Storing availability', [
            'logged_in_user_id' => $user->id,
            'target_user_id' => $targetUserId,
            'selections' => $selections,
        ]);

        $results = $this->availabilityService->saveAvailabilities(
            $targetUserId,
            $selections
        );

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $requirements = $this->availabilityService->checkRequirements(
            $targetUserId
        );

        // Get weekly requirements for the updated month
        $weeklyRequirements = $this->availabilityService->getWeeklyRequirements(
            $targetUserId,
            $year,
            $month
        );

        // Check if any operations failed
        if ($results['has_errors']) {
            Log::error('Availability save had errors', [
                'failed' => $results['failed'],
                'error_message' => $results['error_message'],
                'success_count' => count($results['success']),
                'failed_count' => count($results['failed']),
            ]);

            // Determine appropriate error message
            $errorMessage = $results['error_message'] ?? 'Failed to save availability';

            // If some succeeded but some failed, show partial success message
            if (count($results['success']) > 0 && count($results['failed']) > 0) {
                $errorMessage = sprintf(
                    'Partially saved: %d succeeded, %d failed. Error: %s',
                    count($results['success']),
                    count($results['failed']),
                    $results['error_message'] ?? 'Unknown error'
                );
            }

            // Use Inertia::flash() for proper flash data propagation
            return Inertia::flash([
                'error' => $errorMessage,
                'requirements' => $requirements,
                'weeklyRequirements' => $weeklyRequirements,
                'save_results' => $results,
            ])->back();
        }

        Log::info('Availability saved successfully', [
            'requirements' => $requirements,
            'weekly_requirements_count' => count($weeklyRequirements),
            'success_count' => count($results['success']),
            'skipped_count' => count($results['skipped']),
        ]);

        // Use Inertia::flash() for proper flash data propagation
        return Inertia::flash([
            'success' => 'Availability updated successfully!',
            'requirements' => $requirements,
            'weeklyRequirements' => $weeklyRequirements,
        ])->back();
    }
}
