<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'account_id',
        'name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'account_id' => 'integer',
    ];

    /**
     * Get the users that belong to this location.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Find or create a location by account_id.
     * If exists, update the name. If not, create new.
     */
    public static function syncFromAccountId(int $accountId, string $name): self
    {
        return static::updateOrCreate(
            ['account_id' => $accountId],
            ['name' => $name]
        );
    }

    /**
     * Get a location by account_id.
     */
    public static function findByAccountId(int $accountId): ?self
    {
        return static::where('account_id', $accountId)->first();
    }
}
