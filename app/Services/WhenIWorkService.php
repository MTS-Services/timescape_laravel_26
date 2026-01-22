<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class WhenIWorkService
{
    protected string $apiKey;
    protected ?string $token = null;
    protected ?string $userId = null;
    protected string $loginUrl = 'https://api.login.wheniwork.com/login';
    protected string $apiBaseUrl = 'https://api.wheniwork.com/2';

    public function __construct()
    {
        $this->apiKey = config('services.wheniwork.api_key');
    }

    /**
     * Authenticate with When I Work API
     * 
     * @param string $email
     * @param string $password
     * @return array|null
     */
    public function login(string $email, string $password): ?array
    {
        $response = Http::withHeaders([
            'W-Key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->loginUrl, [
            'email' => $email,
            'password' => $password,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $this->token = $data['token'] ?? null;
            $this->userId = $data['person']['id'] ?? null;
            return $data;
        }

        return null;
    }

    /**
     * Get the authenticated user's information
     * 
     * @return array|null
     */
    public function getUser(): ?array
    {
        if (!$this->token) {
            return null;
        }

        $response = $this->withAuth()->get("{$this->apiBaseUrl}/users");
        
        return $response->successful() ? $response->json() : null;
    }

    /**
     * Get a specific user by ID
     * 
     * @param string $userId
     * @return array|null
     */
    public function getUserById(string $userId): ?array
    {
        if (!$this->token) {
            return null;
        }

        $response = $this->withAuth()->get("{$this->apiBaseUrl}/users/{$userId}");
        
        return $response->successful() ? $response->json() : null;
    }

    /**
     * Set the token for authenticated requests
     * 
     * @param string $token
     * @return self
     */
    public function setToken(string $token): self
    {
        $this->token = $token;
        return $this;
    }

    /**
     * Set the user ID for requests
     * 
     * @param string $userId
     * @return self
     */
    public function setUserId(string $userId): self
    {
        $this->userId = $userId;
        return $this;
    }

    /**
     * Get the authorization token
     * 
     * @return string|null
     */
    public function getToken(): ?string
    {
        return $this->token;
    }

    /**
     * Get the user ID
     * 
     * @return string|null
     */
    public function getUserId(): ?string
    {
        return $this->userId;
    }

    /**
     * Add authentication headers to requests
     * 
     * @return PendingRequest
     */
    protected function withAuth(): PendingRequest
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => "Bearer {$this->token}",
        ];

        if ($this->userId) {
            $headers['W-UserId'] = $this->userId;
        }

        return Http::withHeaders($headers);
    }
}
