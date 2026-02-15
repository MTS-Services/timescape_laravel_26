<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SyncUserAvailabilityJob;
use App\Jobs\SyncWhenIWorkUsersJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WorkLocationController extends Controller
{
    /**
     * Show the work location selection page.
     *
     * Displays available work locations for users with multiple accounts.
     *
     * @return \Inertia\Response|\Illuminate\Http\RedirectResponse
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
                SyncUserAvailabilityJob::dispatch(
                    $selectedUser->id,
                    $selectedUser->wheniwork_token
                );
            }
        }

        return redirect()->route('dashboard');
    }
}
