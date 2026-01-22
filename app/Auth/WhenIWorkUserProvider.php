<?php

namespace App\Auth;

use App\Models\WhenIWorkUser;
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
        return session('wheniwork_user');
    }

    public function retrieveByToken($identifier, $token)
    {
        return null;
    }

    public function updateRememberToken(Authenticatable $user, $token)
    {
        // Not implemented for API-based auth
    }

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials['email']) || empty($credentials['password'])) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'W-Key' => $this->config['api_key'],
            ])->post($this->config['login_url'], [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['person']) && isset($data['token'])) {
                    $user = new WhenIWorkUser([
                        'id' => $data['person']['id'],
                        'email' => $data['person']['email'],
                        'firstName' => $data['person']['firstName'],
                        'lastName' => $data['person']['lastName'],
                        'token' => $data['token'],
                        'person' => $data['person'],
                    ]);

                    session(['wheniwork_user' => $user]);
                    session(['wheniwork_token' => $data['token']]);
                    session(['wheniwork_person' => $data['person']]);

                    return $user;
                }
            }

            Log::warning('When I Work login failed', [
                'email' => $credentials['email'],
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('When I Work API error', [
                'message' => $e->getMessage(),
                'email' => $credentials['email'],
            ]);

            return null;
        }
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        return $user instanceof WhenIWorkUser && $user->getId() !== null;
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        // Not applicable for API-based auth
    }
}
