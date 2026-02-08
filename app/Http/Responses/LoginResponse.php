<?php

namespace App\Http\Responses;

use App\Jobs\SyncUserAvailabilityJob;
use App\Jobs\SyncWhenIWorkUsersJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * Handles multi-account login flow:
     * - If multiple accounts detected, redirect to work location selection
     * - Otherwise, proceed to dashboard
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
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

            // Sync availability based on config
            if (config('availability.sync_mode') === 'login') {
                SyncUserAvailabilityJob::dispatch(
                    $user->id,
                    $user->wheniwork_token
                );
            }
        }

        $redirect = route('dashboard');

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false])
            : redirect()->intended($redirect);
    }
}
