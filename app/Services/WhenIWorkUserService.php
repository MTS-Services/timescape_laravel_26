<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhenIWorkUserService
{
    protected bool $debugMode;

    public function __construct()
    {
        $this->debugMode = config('app.env') === 'local';
    }

    /**
     * Fetch all users from When I Work API
     *
     * @return array{success: bool, users: array, locations: array, error: string|null}
     */
    public function fetchAllUsers(string $token): array
    {
        $this->logDebug('FETCH_USERS_START', ['token_length' => strlen($token)]);

        try {
            $url = config('services.wheniwork.base_url') . 'users';

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'W-Token' => $token,
            ])->get($url);

            $status = $response->status();
            $data = $response->json();

            $this->logDebug('FETCH_USERS_RESPONSE', [
                'status' => $status,
                'users_count' => count($data['users'] ?? []),
                'locations_count' => count($data['locations'] ?? []),
            ]);

            if (! $response->successful()) {
                $errorMessage = $this->extractErrorMessage($data, $status);
                Log::error('Failed to fetch users from When I Work', [
                    'status' => $status,
                    'error' => $errorMessage,
                    'response' => $data,
                ]);

                return [
                    'success' => false,
                    'users' => [],
                    'locations' => [],
                    'error' => $errorMessage,
                ];
            }

            return [
                'success' => true,
                'users' => $data['users'] ?? [],
                'locations' => $data['locations'] ?? [],
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Exception fetching users from When I Work', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'users' => [],
                'locations' => [],
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Sync all users from When I Work to local database
     *
     * @return array{success: bool, created: int, updated: int, failed: int, errors: array}
     */
    public function syncAllUsers(string $token): array
    {
        $result = $this->fetchAllUsers($token);

        if (! $result['success']) {
            return [
                'success' => false,
                'created' => 0,
                'updated' => 0,
                'failed' => 0,
                'errors' => [$result['error']],
            ];
        }

        $created = 0;
        $updated = 0;
        $failed = 0;
        $errors = [];

        Log::info('Starting WhenIWork users sync', [
            'total_users' => count($result['users']),
        ]);

        foreach ($result['users'] as $userData) {
            try {
                $wiwId = $userData['id'] ?? null;

                if (! $wiwId) {
                    $failed++;
                    $errors[] = 'User data missing ID';

                    continue;
                }

                $existingUser = User::where('wheniwork_id', $wiwId)->first();
                $wasCreated = ! $existingUser;

                $this->syncSingleUser($userData, $token);

                if ($wasCreated) {
                    $created++;
                    $this->logDebug('USER_CREATED', [
                        'wheniwork_id' => $wiwId,
                        'email' => $userData['email'] ?? 'N/A',
                    ]);
                } else {
                    $updated++;
                    $this->logDebug('USER_UPDATED', [
                        'wheniwork_id' => $wiwId,
                        'email' => $userData['email'] ?? 'N/A',
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "Failed to sync user {$userData['id']}: {$e->getMessage()}";
                Log::error('Failed to sync WhenIWork user', [
                    'wheniwork_id' => $userData['id'] ?? 'unknown',
                    'email' => $userData['email'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('WhenIWork users sync completed', [
            'created' => $created,
            'updated' => $updated,
            'failed' => $failed,
        ]);

        return [
            'success' => $failed === 0,
            'created' => $created,
            'updated' => $updated,
            'failed' => $failed,
            'errors' => $errors,
        ];
    }

    /**
     * Sync a single user from When I Work data
     */
    protected function syncSingleUser(array $userData, string $token): User
    {
        return User::updateOrCreate(
            ['wheniwork_id' => $userData['id']],
            [
                'account_id' => $userData['account_id'] ?? null,
                'login_id' => $userData['login_id'] ?? null,
                'email' => $userData['email'],
                'first_name' => $userData['first_name'] ?? '',
                'middle_name' => $userData['middle_name'] ?? null,
                'last_name' => $userData['last_name'] ?? '',
                'phone_number' => $userData['phone_number'] ?? null,
                'employee_code' => $userData['employee_code'] ?? null,
                'role' => $userData['role'] ?? 3,
                'employment_type' => $userData['employment_type'] ?? 'hourly',
                'is_payroll' => $userData['is_payroll'] ?? false,
                'is_trusted' => $userData['is_trusted'] ?? false,
                'is_private' => $userData['is_private'] ?? true,
                'is_hidden' => $userData['is_hidden'] ?? false,
                'activated' => $userData['activated'] ?? false,
                'is_active' => $userData['is_active'] ?? true,
                'hours_preferred' => $userData['hours_preferred'] ?? 0,
                'hours_max' => $userData['hours_max'] ?? 0,
                'hourly_rate' => $userData['hourly_rate'] ?? 0,
                'notes' => $userData['notes'] ?? null,
                'uuid' => $userData['uuid'] ?? null,
                'timezone_name' => $userData['timezone_name'] ?? null,
                'start_date' => ! empty($userData['start_date']) ? $userData['start_date'] : null,
                'hired_on' => ! empty($userData['hired_on']) ? $userData['hired_on'] : null,
                'terminated_at' => ! empty($userData['terminated_at']) ? $userData['terminated_at'] : null,
                'alert_settings' => $userData['alert_settings'] ?? null,
                'positions' => $userData['positions'] ?? [],
                'locations' => $userData['locations'] ?? [],
                'avatar_urls' => $userData['avatar'] ?? null,
                'is_admin' => ($userData['role'] ?? 3) === 1,
            ]
        );
    }

    /**
     * Extract user-friendly error message from API response
     */
    protected function extractErrorMessage(?array $responseData, int $status): string
    {
        if (! $responseData) {
            return "API error (HTTP {$status})";
        }

        if (isset($responseData['error'])) {
            return $responseData['error'];
        }

        if (isset($responseData['message'])) {
            return $responseData['message'];
        }

        return "API error (HTTP {$status})";
    }

    /**
     * Log debug information (only in local environment)
     */
    protected function logDebug(string $action, array $data): void
    {
        if ($this->debugMode) {
            Log::debug("WhenIWork User API [{$action}]", $data);
        }
    }
}
