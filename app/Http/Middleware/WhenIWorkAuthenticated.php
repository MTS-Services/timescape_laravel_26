<?php

namespace App\Http\Middleware;

use App\Services\WhenIWorkService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class WhenIWorkAuthenticated
{
    protected WhenIWorkService $whenIWorkService;

    public function __construct(WhenIWorkService $whenIWorkService)
    {
        $this->whenIWorkService = $whenIWorkService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->hasValidWhenIWorkToken()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->with('status', 'Your session has expired. Please log in again.');
        }

        // Set the token for the WhenIWork service
        $this->whenIWorkService->setToken($user->wheniwork_token);

        if ($user->wheniwork_id) {
            $this->whenIWorkService->setUserId($user->wheniwork_id);
        }

        return $next($request);
    }
}
