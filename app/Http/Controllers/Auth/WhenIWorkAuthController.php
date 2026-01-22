<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WhenIWorkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WhenIWorkAuthController extends Controller
{
    protected WhenIWorkService $whenIWorkService;

    public function __construct(WhenIWorkService $whenIWorkService)
    {
        $this->whenIWorkService = $whenIWorkService;
    }

    /**
     * Display the login view.
     *
     * @return \Inertia\Response
     */
    public function showLoginForm()
    {
        return Inertia::render('auth/wheniwork-login');
    }

    /**
     * Handle an authentication attempt.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function login(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput($request->only('email'));
        }

        $wiw = $this->whenIWorkService->login(
            $request->email,
            $request->password
        );

        if (!$wiw) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Get user data from When I Work API
        $this->whenIWorkService->setToken($wiw['token']);
        $userInfo = $this->whenIWorkService->getUser();

        if (!$userInfo) {
            throw ValidationException::withMessages([
                'email' => __('Failed to fetch user information from When I Work.'),
            ]);
        }

        // Find or create the user in our database
        $user = $this->findOrCreateUser($wiw, $userInfo);

        // Login the user
        Auth::login($user);

        // Redirect to dashboard
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Find or create a user based on When I Work data.
     *
     * @param  array  $wiwAuth
     * @param  array  $wiwUserInfo
     * @return \App\Models\User
     */
    protected function findOrCreateUser(array $wiwAuth, array $wiwUserInfo): User
    {
        // Extract user data from WIW response
        $person = $wiwAuth['person'];
        $userId = $person['id'];
        $firstName = $person['firstName'];
        $lastName = $person['lastName'];
        $email = $person['email'];
        $token = $wiwAuth['token'];

        // Get account ID and other user data from the second API call
        $wiwUser = $wiwUserInfo['users'][0] ?? null;
        $accountId = $wiwUser['account_id'] ?? null;
        $loginId = $wiwUser['login_id'] ?? null;

        // Find user by When I Work ID or email
        $user = User::where('wheniwork_id', $userId)
            ->orWhere('email', $email)
            ->first();

        if (!$user) {
            // Create new user
            $user = new User();
            $user->name = "{$firstName} {$lastName}";
            $user->email = $email;
            $user->password = Hash::make(Str::random(16));
            $user->wheniwork_id = $userId;
        }

        // Update user with latest WIW data
        $user->first_name = $firstName;
        $user->last_name = $lastName;
        $user->wheniwork_login_id = $loginId;
        $user->wheniwork_account_id = $accountId;
        $user->wheniwork_token = $token;
        $user->wheniwork_data = $wiwUser ?? [];

        // Save avatar if available
        if (isset($person['avatar']) && !empty($person['avatar']['medium'])) {
            $user->avatar = $person['avatar']['medium'];
        }

        $user->save();

        return $user;
    }

    /**
     * Log the user out of the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
