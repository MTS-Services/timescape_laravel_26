<?php

namespace App\Auth;

use App\Models\Location;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhenIWorkUserProvider implements UserProvider
{
    protected $config;

    public function __construct()
    {
        $this->config = [
            'api_key' => config('services.wheniwork.api_key'),
            'login_url' => config('services.wheniwork.login_url'),
            'base_url' => config('services.wheniwork.base_url'),
        ];
    }

    public function retrieveById($identifier)
    {
        return User::find($identifier);
    }

    public function retrieveByToken($identifier, $token)
    {
        return User::where('id', $identifier)
            ->where('remember_token', $token)
            ->first();
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        $user->setRememberToken($token);
        $user->save();
    }

    /**
     * Retrieve user by credentials with multi-account support.
     *
     * If a user has multiple accounts (same email, different account_id),
     * this method stores the available accounts in session and returns
     * the first one. The LoginResponse will check for multiple accounts
     * and redirect to account selection if needed.
     */
    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['email']) || empty($credentials['password'])) {
            return null;
        }

        // Check if user is selecting a specific account after multi-account detection
        $selectedAccountId = $credentials['selected_account_id'] ?? session('selected_account_id');

        try {
            $loginResponse = Http::withHeaders([
                'W-Key' => $this->config['api_key'],
            ])->post($this->config['login_url'], [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ]);

            if (! $loginResponse->successful()) {
                Log::warning('When I Work login failed', [
                    'email' => $credentials['email'],
                    'status' => $loginResponse->status(),
                    'response' => $loginResponse->json(),
                ]);

                return null;
            }

            $loginData = $loginResponse->json();

            if (! isset($loginData['person']) || ! isset($loginData['token'])) {
                Log::warning('When I Work login response missing data', ['data' => $loginData]);

                return null;
            }

            $token = $loginData['token'];
            $personId = $loginData['person']['id'];

            // Fetch all users to find user data and detect multiple accounts
            $apiData = $this->fetchAllUsersData($token);
            $fullUserData = null;
            $userAccounts = [];
            $locationsMap = [];

            if ($apiData) {
                $allUsersData = $apiData['users'];
                $locationsData = $apiData['locations'];

                // Sync locations to database and build map: account_id -> location.id
                foreach ($locationsData as $locationData) {
                    $accountId = $locationData['account_id'] ?? null;
                    $name = $locationData['name'] ?? null;
                    if ($accountId && $name) {
                        $location = Location::syncFromAccountId($accountId, $name);
                        $locationsMap[$accountId] = $location->id;
                    }
                }

                // Find all accounts that match this login_id (same person, different accounts)
                foreach ($allUsersData as $userData) {
                    if (isset($userData['login_id']) && $userData['login_id'] == $personId) {
                        $userAccounts[] = $userData;
                        if ($fullUserData === null) {
                            $fullUserData = $userData;
                        }
                    }
                }

                // If specific account is selected, find that account's data
                if ($selectedAccountId && count($userAccounts) > 1) {
                    foreach ($userAccounts as $account) {
                        if (($account['account_id'] ?? null) == $selectedAccountId) {
                            $fullUserData = $account;
                            break;
                        }
                    }
                }
            }

            if (! $fullUserData) {
                $fullUserData = $this->mapLoginDataToUserData($loginData['person']);
            }

            // Get location_id from the locationsMap for this user's account
            $userAccountId = $fullUserData['account_id'] ?? null;
            $locationId = $userAccountId ? ($locationsMap[$userAccountId] ?? null) : null;

            // Sync and get/create the user with location_id
            $user = User::syncFromWhenIWorkData($fullUserData, $token, $locationId);

            // Store token and person ID in session
            session(['wheniwork_token' => $token]);
            session(['wheniwork_person_id' => $personId]);

            // Check for multiple accounts with same email
            $existingUsersWithEmail = User::getUsersByEmail($credentials['email']);

            if ($existingUsersWithEmail->count() > 1 && !$selectedAccountId) {
                // Store available accounts for selection page with location data from DB
                $accountOptions = $existingUsersWithEmail->load('location')->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'account_id' => $u->account_id,
                        'location_id' => $u->location_id,
                        'work_location_name' => $u->location?->name ?? $u->work_location_name,
                        'name' => $u->name,
                        'email' => $u->email,
                    ];
                })->values()->toArray();

                session(['pending_location_selection' => true]);
                session(['available_accounts' => $accountOptions]);
                session(['login_email' => $credentials['email']]);

                Log::info('Multiple accounts detected for email', [
                    'email' => $credentials['email'],
                    'account_count' => count($accountOptions),
                ]);
            } else {
                // Single account or account already selected - clear any pending selection
                session()->forget(['pending_location_selection', 'pending_account_selection', 'available_accounts', 'login_email']);

                // Store selected location_id in session for scoping
                session(['selected_location_id' => $user->location_id]);
            }

            return $user;
        } catch (\Exception $e) {
            Log::error('When I Work API error', [
                'message' => $e->getMessage(),
                'email' => $credentials['email'],
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        return $user instanceof User && $user->wheniwork_id !== null;
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        // Not applicable for API-based auth
    }

    /**
     * Fetch all users and locations data from When I Work API
     *
     * @return array{users: array, locations: array}|null Array with users and locations or null on failure
     */
    protected function fetchAllUsersData(string $token): ?array
    {
        try {
            $response = Http::withHeaders([
                'W-Token' => $token,
            ])->get($this->config['base_url'].'users');

            if (! $response->successful()) {
                Log::warning('Failed to fetch users data from When I Work', [
                    'status' => $response->status(),
                ]);

                return null;
            }

            $data = $response->json();

            if (! isset($data['users']) || ! is_array($data['users'])) {
                return null;
            }

            return [
                'users' => $data['users'],
                'locations' => $data['locations'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching users data', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    protected function fetchFullUserData(string $personId, string $token): ?array
    {
        $apiData = $this->fetchAllUsersData($token);

        if (! $apiData) {
            return null;
        }

        $allUsers = $apiData['users'];

        foreach ($allUsers as $user) {
            if (isset($user['login_id']) && $user['login_id'] == $personId) {
                return $user;
            }
        }

        if (! empty($allUsers)) {
            return $allUsers[0];
        }

        return null;
    }

    protected function mapLoginDataToUserData(array $person): array
    {
        return [
            'id' => 0,
            'login_id' => $person['id'],
            'email' => $person['email'] ?? '',
            'first_name' => $person['firstName'] ?? '',
            'last_name' => $person['lastName'] ?? '',
            'phone_number' => $person['phone'] ?? '',
            'role' => 3,
            'activated' => true,
            'is_active' => true,
        ];
    }

    public function getModel(): string
    {
        return User::class;
    }
}
