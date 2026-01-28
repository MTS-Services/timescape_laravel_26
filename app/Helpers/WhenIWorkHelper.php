<?php

namespace App\Helpers;

class WhenIWorkHelper
{
    public static function getToken(): ?string
    {
        $user = auth()->user();
        if ($user && $user->wheniwork_token) {
            return $user->wheniwork_token;
        }

        return session('wheniwork_token');
    }

    public static function getPersonData(): ?array
    {
        $user = auth()->user();
        if ($user) {
            return [
                'id' => $user->wheniwork_id,
                'login_id' => $user->login_id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'role' => $user->role?->value,
                'role_label' => $user->role_label,
            ];
        }

        return null;
    }

    public static function getUser()
    {
        return auth()->user();
    }

    public static function makeApiRequest(string $endpoint, string $method = 'GET', array $data = [])
    {
        $token = self::getToken();

        if (! $token) {
            throw new \Exception('When I Work token not found in session');
        }

        $url = config('services.wheniwork.base_url').ltrim($endpoint, '/');

        $request = \Illuminate\Support\Facades\Http::withHeaders([
            'W-Token' => $token,
        ]);

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'DELETE' => $request->delete($url, $data),
            'PATCH' => $request->patch($url, $data),
            default => throw new \Exception("Unsupported HTTP method: {$method}"),
        };
    }
}
