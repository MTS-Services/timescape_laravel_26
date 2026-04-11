<?php

namespace App\Services;

use App\Models\Location;
use App\Models\LocationUser;
use App\Models\User;
use Illuminate\Http\Client\Response;
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
            $url = config('services.wheniwork.base_url').'users';

            /** @var Response $response */
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

        $sync = Location::syncAllFromWhenIWorkApi($result['locations']);
        $byWiwLocationId = $sync['by_wiw_location_id'];
        $syncedLocalIds = $sync['synced_local_ids'];

        foreach ($result['locations'] as $locationData) {
            $accountId = $locationData['account_id'] ?? null;
            $name = $locationData['name'] ?? null;
            $wiwLocId = $locationData['id'] ?? null;
            if ($accountId && $name && $wiwLocId) {
                $this->logDebug('LOCATION_SYNCED', [
                    'account_id' => $accountId,
                    'wheniwork_location_id' => $wiwLocId,
                    'name' => $name,
                    'location_id' => $byWiwLocationId[(int) $wiwLocId] ?? null,
                ]);
            }
        }

        $presentByLocalLocationId = $this->buildPresentWheniworkIdsByLocalLocationId(
            $result['users'],
            $byWiwLocationId
        );

        $created = 0;
        $updated = 0;
        $failed = 0;
        $errors = [];

        Log::info('Starting WhenIWork users sync', [
            'total_users' => count($result['users']),
            'total_locations' => count($result['locations']),
        ]);

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

                $primaryLocationId = User::resolvePrimaryLocalLocationId($userData, $byWiwLocationId);
                if ($primaryLocationId === null && $accountId !== null) {
                    $primaryLocationId = Location::where('account_id', $accountId)
                        ->orderByRaw('wheniwork_location_id is null asc')
                        ->orderBy('id')
                        ->value('id');
                }

                $user = User::syncFromWhenIWorkData($userData, $token, $primaryLocationId);
                $user->syncLocationMembershipsFromWhenIWork($userData, $byWiwLocationId);

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

        $softRemoved = 0;
        foreach ($syncedLocalIds as $localLocationId) {
            $present = $presentByLocalLocationId[$localLocationId] ?? [];
            $softRemoved += $this->reconcileLocationMemberships($localLocationId, $present);
        }

        Log::info('WhenIWork users sync completed', [
            'created' => $created,
            'updated' => $updated,
            'failed' => $failed,
            'pivot_soft_removed' => $softRemoved,
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
     * @param  array<int, array<string, mixed>>  $users
     * @param  array<int, int>  $byWiwLocationId
     * @return array<int, list<int>>
     */
    protected function buildPresentWheniworkIdsByLocalLocationId(array $users, array $byWiwLocationId): array
    {
        $map = [];

        foreach ($users as $userData) {
            if (! isset($userData['id'])) {
                continue;
            }
            $wiwUserId = (int) $userData['id'];
            $wiwLocs = $userData['locations'] ?? [];
            if (! is_array($wiwLocs)) {
                continue;
            }

            foreach ($wiwLocs as $wiwLocId) {
                $localId = $byWiwLocationId[(int) $wiwLocId] ?? null;
                if ($localId === null) {
                    continue;
                }
                $map[$localId] ??= [];
                $map[$localId][$wiwUserId] = true;
            }
        }

        foreach ($map as $localId => $set) {
            $map[$localId] = array_keys($set);
        }

        return $map;
    }

    /**
     * Soft-delete pivot rows for users still marked active locally but absent from the API list for this workplace.
     *
     * @param  list<int>  $presentWheniworkUserIds
     */
    protected function reconcileLocationMemberships(int $localLocationId, array $presentWheniworkUserIds): int
    {
        $location = Location::find($localLocationId);
        if (! $location) {
            return 0;
        }

        $accountId = $location->account_id;
        $present = array_map('intval', $presentWheniworkUserIds);

        $query = LocationUser::query()
            ->where('location_id', $localLocationId)
            ->whereNull('deleted_at')
            ->whereHas('user', function ($q) use ($accountId, $present): void {
                $q->where('account_id', $accountId);
                if ($present !== []) {
                    $q->whereNotIn('wheniwork_id', $present);
                }
            });

        $removed = 0;
        foreach ($query->cursor() as $pivot) {
            $pivot->delete();
            $removed++;
        }

        return $removed;
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
