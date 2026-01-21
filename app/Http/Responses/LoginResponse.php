<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        // $redirect = $request->user()->is_admin
        //     ? route('admin.dashboard')
        //     : route('dashboard');

        $redirect = route('dashboard');

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false])
            : redirect()->intended($redirect);
    }
}
