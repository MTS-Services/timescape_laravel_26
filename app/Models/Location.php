<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Location extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'wheniwork_location_id',
        'name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'account_id' => 'integer',
        'wheniwork_location_id' => 'integer',
    ];

    /**
     * Users assigned to this workplace via pivot (respects soft-deleted membership).
     *
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(LocationUser::class)
            ->withTimestamps()
            ->wherePivotNull('deleted_at');
    }

    /**
     * Sync all locations from a WhenIWork GET /users response `locations` array.
     *
     * @param  array<int, array<string, mixed>>  $locationsData
     * @return array{by_wiw_location_id: array<int, int>, synced_local_ids: list<int>}
     */
    public static function syncAllFromWhenIWorkApi(array $locationsData): array
    {
        $byWiwLocationId = [];
        $syncedLocalIds = [];

        foreach ($locationsData as $locationData) {
            $accountId = $locationData['account_id'] ?? null;
            $wiwLocId = $locationData['id'] ?? null;
            $name = $locationData['name'] ?? null;

            if (! $accountId || ! $wiwLocId || ! $name) {
                continue;
            }

            $location = static::syncFromWhenIWorkData((int) $accountId, (int) $wiwLocId, (string) $name);
            $byWiwLocationId[(int) $wiwLocId] = $location->id;
            $syncedLocalIds[] = $location->id;
        }

        return [
            'by_wiw_location_id' => $byWiwLocationId,
            'synced_local_ids' => array_values(array_unique($syncedLocalIds)),
        ];
    }

    /**
     * Upsert one workplace row keyed by WhenIWork account + workplace id.
     *
     * If a single legacy row exists (wheniwork_location_id null), it is upgraded in place.
     */
    public static function syncFromWhenIWorkData(int $accountId, int $wheniworkLocationId, string $name): self
    {
        $legacyCount = static::where('account_id', $accountId)
            ->whereNull('wheniwork_location_id')
            ->count();

        if ($legacyCount === 1) {
            $legacy = static::where('account_id', $accountId)
                ->whereNull('wheniwork_location_id')
                ->first();
            $legacy->update([
                'wheniwork_location_id' => $wheniworkLocationId,
                'name' => $name,
            ]);

            return $legacy->fresh();
        }

        return static::updateOrCreate(
            [
                'account_id' => $accountId,
                'wheniwork_location_id' => $wheniworkLocationId,
            ],
            ['name' => $name]
        );
    }

    /**
     * @deprecated Use syncFromWhenIWorkData / syncAllFromWhenIWorkApi with API location id.
     */
    public static function syncFromAccountId(int $accountId, string $name): self
    {
        $location = static::where('account_id', $accountId)
            ->orderByRaw('wheniwork_location_id is null asc')
            ->orderBy('id')
            ->first();

        if ($location) {
            $location->update(['name' => $name]);

            return $location->fresh();
        }

        return static::create([
            'account_id' => $accountId,
            'wheniwork_location_id' => null,
            'name' => $name,
        ]);
    }

    /**
     * Get a location by account_id (first match; prefer row with WhenIWork workplace id set).
     */
    public static function findByAccountId(int $accountId): ?self
    {
        return static::where('account_id', $accountId)
            ->orderByRaw('wheniwork_location_id is null asc')
            ->orderBy('id')
            ->first();
    }
}
