<?php

namespace App\Auth;

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

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['email']) || empty($credentials['password'])) {
            return null;
        }

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

            $fullUserData = $this->fetchFullUserData($personId, $token);

            if (! $fullUserData) {
                $fullUserData = $this->mapLoginDataToUserData($loginData['person']);
            }

            $user = User::syncFromWhenIWorkData($fullUserData, $token);

            session(['wheniwork_token' => $token]);
            session(['wheniwork_person_id' => $personId]);

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

    protected function fetchFullUserData(string $personId, string $token): ?array
    {
        try {
            $response = Http::withHeaders([
                'W-Token' => $token,
            ])->get($this->config['base_url'].'users');

            if (! $response->successful()) {
                Log::warning('Failed to fetch full user data from When I Work', [
                    'person_id' => $personId,
                    'status' => $response->status(),
                ]);

                return null;
            }

            $data = $response->json();

            if (! isset($data['users']) || ! is_array($data['users'])) {
                return null;
            }

            foreach ($data['users'] as $user) {
                if (isset($user['login_id']) && $user['login_id'] == $personId) {
                    return $user;
                }
            }

            if (! empty($data['users'])) {
                return $data['users'][0];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Error fetching full user data', [
                'message' => $e->getMessage(),
                'person_id' => $personId,
            ]);

            return null;
        }
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
