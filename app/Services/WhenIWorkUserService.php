<?php

namespace App\Services;

use App\Models\Location;
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

        // Step 1: Sync locations first (creates/updates locations table)
        $locationsMap = $this->syncLocations($result['locations']);

        $created = 0;
        $updated = 0;
        $failed = 0;
        $errors = [];

        Log::info('Starting WhenIWork users sync', [
            'total_users' => count($result['users']),
            'total_locations' => count($result['locations']),
        ]);

        // Step 2: Sync users with location_id assignment
        foreach ($result['users'] as $userData) {
            try {
                $wiwId = $userData['id'] ?? null;

                if (! $wiwId) {
                    $failed++;
                    $errors[] = 'User data missing ID';

                    continue;
                }

                $accountId = $userData['account_id'] ?? null;
                $existingUser = User::where('account_id', $accountId)
                    ->where('wheniwork_id', $wiwId)
                    ->first();
                $wasCreated = ! $existingUser;

                // Pass locationsMap to assign location_id
                $this->syncSingleUser($userData, $token, $locationsMap);

                if ($wasCreated) {
                    $created++;
                    $this->logDebug('USER_CREATED', [
                        'wheniwork_id' => $wiwId,
                        'email' => $userData['email'] ?? 'N/A',
                        'account_id' => $accountId,
                    ]);
                } else {
                    $updated++;
                    $this->logDebug('USER_UPDATED', [
                        'wheniwork_id' => $wiwId,
                        'email' => $userData['email'] ?? 'N/A',
                        'account_id' => $accountId,
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
     * Sync locations from When I Work API response to locations table.
     *
     * @param  array  $locationsData  Array of location data from API
     * @return array<int, int> Map of account_id => location.id
     */
    protected function syncLocations(array $locationsData): array
    {
        $locationsMap = [];

        foreach ($locationsData as $locationData) {
            $accountId = $locationData['account_id'] ?? null;
            $name = $locationData['name'] ?? null;

            if (! $accountId || ! $name) {
                continue;
            }

            $location = Location::syncFromAccountId($accountId, $name);
            $locationsMap[$accountId] = $location->id;

            $this->logDebug('LOCATION_SYNCED', [
                'account_id' => $accountId,
                'name' => $name,
                'location_id' => $location->id,
            ]);
        }

        return $locationsMap;
    }

    /**
     * Sync a single user from When I Work data with multi-account support.
     *
     * Uses composite key (account_id, wheniwork_id) to identify users,
     * allowing same person to exist in multiple accounts/work locations.
     *
     * @param  array<int, int>  $locationsMap  Map of account_id => location.id
     */
    protected function syncSingleUser(array $userData, string $token, array $locationsMap = []): User
    {
        $accountId = $userData['account_id'] ?? null;
        $locationId = $accountId ? ($locationsMap[$accountId] ?? null) : null;

        return User::syncFromWhenIWorkData($userData, $token, $locationId);
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
