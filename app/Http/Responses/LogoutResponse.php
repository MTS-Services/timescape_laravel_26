<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LogoutResponse implements LogoutResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): Response
    {
        // Clear all location-related session data
        session()->forget([
            'selected_location_id',
            'pending_location_selection',
            'pending_account_selection',
            'available_accounts',
            'login_email',
            'wheniwork_token',
            'wheniwork_person_id',
        ]);

        return redirect()->route('login');
    }
}
