<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLocationSelected
{
    /**
     * Handle an incoming request.
     *
     * Ensures that users with multiple locations have selected a specific
     * work location before accessing protected routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Check if there's a pending location selection
        if (session('pending_location_selection')) {
            // First check if other locations 

            // Redirect to the location selection page
            return redirect()->route('auth.select-work-location');
        }

        // Check if user has multiple locations but no selected location
        $selectedLocationId = session('selected_location_id');

        if (!$selectedLocationId) {
            // Check if user has multiple accounts with same email
            $accountsCount = User::where('email', $user->email)
                ->whereNotNull('location_id')
                ->count();

            if ($accountsCount > 1) {
                // Store available accounts for selection with location data
                $accounts = User::where('email', $user->email)
                    ->whereNotNull('location_id')
                    ->with('location')
                    ->get()
                    ->map(function ($u) {
                        return [
                            'id' => $u->id,
                            'account_id' => $u->account_id,
                            'location_id' => $u->location_id,
                            'work_location_name' => $u->location?->name ?? $u->work_location_name,
                            'name' => $u->name,
                            'email' => $u->email,
                        ];
                    })
                    ->values()
                    ->toArray();

                session(['pending_location_selection' => true]);
                session(['available_accounts' => $accounts]);
                session(['login_email' => $user->email]);

                return redirect()->route('auth.select-work-location');
            }

            // Single location - set selected_location_id automatically
            session(['selected_location_id' => $user->location_id]);
        }

        return $next($request);
    }
}
