<?php

namespace App\Helpers;

class WhenIWorkHelper
{
    public static function getToken(): ?string
    {
        return session('wheniwork_token');
    }

    public static function getPersonData(): ?array
    {
        return session('wheniwork_person');
    }

    public static function getUser()
    {
        return session('wheniwork_user');
    }

    public static function makeApiRequest(string $endpoint, string $method = 'GET', array $data = [])
    {
        $token = self::getToken();

        if (!$token) {
            throw new \Exception('When I Work token not found in session');
        }

        $url = config('services.wheniwork.base_url') . ltrim($endpoint, '/');

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
