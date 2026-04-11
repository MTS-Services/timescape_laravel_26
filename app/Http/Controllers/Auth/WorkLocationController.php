<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SyncUserAvailabilityJob;
use App\Jobs\SyncWhenIWorkUsersJob;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class WorkLocationController extends Controller
{
    /**
     * Show the work location selection page.
     *
     * Displays available work locations for users with multiple accounts.
     *
     * @return Response|RedirectResponse
     */
    public function show(Request $request)
    {
        $availableAccounts = session('available_accounts', []);
        $loginEmail = session('login_email');

        if (empty($availableAccounts)) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/select-work-location', [
            'accounts' => $availableAccounts,
            'email' => $loginEmail,
        ]);
    }

    /**
     * Handle work location selection.
     *
     * Switches the authenticated user to the selected location.
     */
    public function select(Request $request)
    {
        $validated = $request->validate([
            'location_id' => ['required', 'integer'],
        ]);

        $selectedLocationId = $validated['location_id'];
        $loginEmail = session('login_email');

        Log::info('User selecting work location', [
            'email' => $loginEmail,
            'selected_location_id' => $selectedLocationId,
        ]);

        // Find the user record for the selected location
        $selectedUser = User::where('location_id', $selectedLocationId)
            ->where('email', $loginEmail)
            ->activeAtAssignedLocationPivot()
            ->first();

        if (! $selectedUser) {
            Log::warning('Selected location not found', [
                'location_id' => $selectedLocationId,
                'email' => $loginEmail,
            ]);

            return back()->withErrors([
                'location_id' => 'The selected work location could not be found.',
            ]);
        }

        // Log out current user and log in as the selected location's user
        Auth::logout();
        Auth::login($selectedUser);

        // Clear multi-location session data
        session()->forget(['pending_location_selection', 'pending_account_selection', 'available_accounts', 'login_email']);

        // Store selected location_id in session for scoping
        session(['selected_location_id' => $selectedLocationId]);

        Log::info('Work location selected successfully', [
            'user_id' => $selectedUser->id,
            'location_id' => $selectedLocationId,
            'email' => $selectedUser->email,
        ]);

        // Dispatch sync jobs for the selected user
        if ($selectedUser->wheniwork_token) {
            SyncWhenIWorkUsersJob::dispatch($selectedUser->id, $selectedUser->wheniwork_token);

            if (config('availability.sync_mode') === 'login') {
                // 1 year availability for the selected user
                SyncUserAvailabilityJob::dispatch(
                    $selectedUser->id,
                    $selectedUser->wheniwork_token
                );
                // When admin selects location, sync 1 year for all employees in account
                $this->dispatchAvailabilitySyncForAllEmployees($selectedUser);
            }
        }

        return redirect()->route('dashboard');
    }

    /**
     * When admin selects work location, dispatch 1-year availability sync for all other employees in the account.
     */
    protected function dispatchAvailabilitySyncForAllEmployees(User $selectedUser): void
    {
        if (! $selectedUser->canManageUsers()) {
            return;
        }

        $query = User::query()
            ->whereNotNull('wheniwork_id')
            ->whereNotNull('wheniwork_token')
            ->where('id', '!=', $selectedUser->id)
            ->activeAtLocation($selectedUser->location_id);

        if (! config('availability.can_manage_all', false)) {
            $query->where('account_id', $selectedUser->account_id);
        }

        foreach ($query->get() as $employee) {
            SyncUserAvailabilityJob::dispatch($employee->id, $employee->wheniwork_token);
        }
    }
}
