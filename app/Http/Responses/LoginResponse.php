<?php

namespace App\Http\Responses;

use App\Jobs\SyncUserAvailabilityJob;
use App\Jobs\SyncWhenIWorkUsersJob;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * Handles multi-account login flow:
     * - If multiple accounts detected, redirect to work location selection
     * - Otherwise, proceed to dashboard
     *
     * @param  Request  $request
     * @return Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        // Check if multi-location selection is needed
        if (session('pending_location_selection')) {
            $availableAccounts = session('available_accounts', []);
            $loginEmail = session('login_email');

            Log::info('Redirecting to work location selection', [
                'email' => $loginEmail,
                'account_count' => count($availableAccounts),
            ]);

            // For JSON requests (SPA), return redirect URL
            if ($request->wantsJson()) {
                return new JsonResponse([
                    'two_factor' => false,
                    'redirect' => route('auth.select-work-location'),
                ]);
            }

            // Redirect to work location selection page
            return redirect()->route('auth.select-work-location');
        }

        if ($user && $user->wheniwork_token) {
            // Always sync WhenIWork users on login
            Log::info('Dispatching WhenIWork users sync job on login', [
                'user_id' => $user->id,
            ]);
            SyncWhenIWorkUsersJob::dispatch($user->id, $user->wheniwork_token);

            // Sync 1 year availability on login (job chunks by month for API 45-day limit)
            if (config('availability.sync_mode') === 'login') {
                $this->dispatchAvailabilitySyncForLogin($user);
            }
        }

        $redirect = route('dashboard');

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false])
            : redirect()->intended($redirect);
    }

    /**
     * Dispatch full-year availability sync for the logged-in user, and for all employees when admin.
     */
    protected function dispatchAvailabilitySyncForLogin(User $user): void
    {
        // Always sync 1 year for the logged-in user
        SyncUserAvailabilityJob::dispatch($user->id, $user->wheniwork_token);

        // When admin logs in, sync 1 year for all employees in the same account
        if (! $user->canManageUsers()) {
            return;
        }

        $query = User::query()
            ->whereNotNull('wheniwork_id')
            ->whereNotNull('wheniwork_token')
            ->where('id', '!=', $user->id)
            ->activeAtLocation(User::workContextLocationId($user));

        if (! config('availability.can_manage_all', false)) {
            $query->where('account_id', $user->account_id);
        }

        $employees = $query->get();

        foreach ($employees as $employee) {
            SyncUserAvailabilityJob::dispatch($employee->id, $employee->wheniwork_token);
        }

        if ($employees->isNotEmpty()) {
            Log::info('Dispatching availability sync for all employees on admin login', [
                'admin_user_id' => $user->id,
                'employee_count' => $employees->count(),
            ]);
        }
    }
}
