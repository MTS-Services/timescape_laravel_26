<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'wheniwork_id',
        'account_id',
        'location_id',
        'login_id',
        'wheniwork_token',
        'email',
        'first_name',
        'middle_name',
        'last_name',
        'phone_number',
        'employee_code',
        'role',
        'employment_type',
        'is_payroll',
        'is_trusted',
        'is_private',
        'is_hidden',
        'activated',
        'is_active',
        'hours_preferred',
        'hours_max',
        'hourly_rate',
        'notes',
        'priority',
        'uuid',
        'timezone_name',
        'start_date',
        'hired_on',
        'terminated_at',
        'last_login',
        'alert_settings',
        'positions',
        'locations',
        'avatar_urls',
        'is_admin',
        'avatar',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'wheniwork_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'is_admin' => 'boolean',
            'is_payroll' => 'boolean',
            'is_trusted' => 'boolean',
            'is_private' => 'boolean',
            'is_hidden' => 'boolean',
            'activated' => 'boolean',
            'is_active' => 'boolean',
            'hours_preferred' => 'decimal:2',
            'hours_max' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'start_date' => 'date',
            'hired_on' => 'datetime',
            'terminated_at' => 'datetime',
            'last_login' => 'datetime',
            'alert_settings' => 'array',
            'positions' => 'array',
            'locations' => 'array',
            'avatar_urls' => 'array',
        ];
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn() => trim($this->first_name . ' ' . $this->last_name),
        );
    }

    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getRoleLabelAttribute(): string
    {
        return $this->role?->label() ?? 'Unknown';
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isManager(): bool
    {
        return $this->role === UserRole::MANAGER;
    }

    public function isEmployee(): bool
    {
        return $this->role === UserRole::EMPLOYEE;
    }

    public function isSupervisor(): bool
    {
        return $this->role === UserRole::SUPERVISOR;
    }

    public function canManageUsers(): bool
    {
        return $this->role?->canManageUsers() ?? false;
    }

    public function getCanManageUsersAttribute(): bool
    {
        return $this->canManageUsers();
    }

    /**
     * Get the location that this user belongs to.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function canAccessPayroll(): bool
    {
        return $this->role?->canAccessPayroll() ?? false;
    }

    public function canViewRequirements(): bool
    {
        // If they can manage users, they are strictly forbidden from viewing requirements
        if ($this->canManageUsers()) {
            return false;
        }

        // Otherwise, check if priority exists and is greater than 3
        // return ($this->priority ?? 0) > 3;
        return true;
    }


    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_urls && isset($this->avatar_urls['url'])) {
            return str_replace('%s', 'medium', $this->avatar_urls['url']);
        }

        return $this->avatar;
    }

    /**
     * Sync user from When I Work data with multi-account support.
     *
     * Uses composite key (account_id, wheniwork_id) to identify users,
     * allowing same person to exist in multiple accounts/work locations.
     *
     * @param  int|null  $locationId  The location_id from the locations table
     */
    public static function syncFromWhenIWorkData(array $userData, string $token, ?int $locationId = null): self
    {
        $accountId = $userData['account_id'] ?? null;
        $wiwId = $userData['id'];
        $loginId = $userData['login_id'] ?? null;
        $email = $userData['email'];

        // Extract priority from notes field (e.g., "Priority=4")
        $priority = self::extractPriorityFromNotes($userData['notes'] ?? null);

        // Multi-account support: use composite key for uniqueness
        // Find existing user by account_id + wheniwork_id combination
        $user = static::where('account_id', $accountId)
            ->where('wheniwork_id', $wiwId)
            ->first();

        // Fields that are always set (core identity / session data)
        $coreAttributes = [
            'account_id' => $accountId,
            'location_id' => $locationId,
            'login_id' => $loginId,
            'wheniwork_token' => $token,
            'email' => $email,
            'last_login' => now(),
        ];

        // Fields sourced from the API — keyed by model attribute => API source key.
        // These are only included when the source key exists in $userData,
        // preventing incomplete API responses from nulling out existing data.
        $apiFields = [
            'first_name'      => ['key' => 'first_name',      'default' => ''],
            'middle_name'     => ['key' => 'middle_name',     'default' => null],
            'last_name'       => ['key' => 'last_name',       'default' => ''],
            'phone_number'    => ['key' => 'phone_number',    'default' => null],
            'employee_code'   => ['key' => 'employee_code',   'default' => null],
            'role'            => ['key' => 'role',            'default' => 3],
            'employment_type' => ['key' => 'employment_type', 'default' => 'hourly'],
            'is_payroll'      => ['key' => 'is_payroll',      'default' => false],
            'is_trusted'      => ['key' => 'is_trusted',      'default' => false],
            'is_private'      => ['key' => 'is_private',      'default' => true],
            'is_hidden'       => ['key' => 'is_hidden',       'default' => false],
            'activated'       => ['key' => 'activated',       'default' => false],
            'is_active'       => ['key' => 'is_active',       'default' => true],
            'hours_preferred' => ['key' => 'hours_preferred', 'default' => 0],
            'hours_max'       => ['key' => 'hours_max',       'default' => 0],
            'hourly_rate'     => ['key' => 'hourly_rate',     'default' => 0],
            'notes'           => ['key' => 'notes',           'default' => null],
            'uuid'            => ['key' => 'uuid',            'default' => null],
            'timezone_name'   => ['key' => 'timezone_name',   'default' => null],
            'alert_settings'  => ['key' => 'alert_settings',  'default' => null],
            'positions'       => ['key' => 'positions',       'default' => []],
            'locations'       => ['key' => 'locations',       'default' => []],
            'avatar_urls'     => ['key' => 'avatar',          'default' => null],
        ];

        // Date fields that use !empty() instead of ?? for safety
        $dateFields = [
            'start_date'    => 'start_date',
            'hired_on'      => 'hired_on',
            'terminated_at' => 'terminated_at',
        ];

        if ($user) {
            // UPDATE: only include fields whose source key exists in $userData
            $updateAttributes = $coreAttributes;

            foreach ($apiFields as $attr => $meta) {
                if (array_key_exists($meta['key'], $userData)) {
                    $updateAttributes[$attr] = $userData[$meta['key']] ?? $meta['default'];
                }
            }

            foreach ($dateFields as $attr => $sourceKey) {
                if (array_key_exists($sourceKey, $userData)) {
                    $updateAttributes[$attr] = ! empty($userData[$sourceKey]) ? $userData[$sourceKey] : null;
                }
            }

            // Derived fields: only set when their source key is present
            if (array_key_exists('notes', $userData)) {
                $updateAttributes['priority'] = $priority;
            }
            if (array_key_exists('role', $userData)) {
                $updateAttributes['is_admin'] = ($userData['role'] ?? 3) === 1;
            }

            $user->update($updateAttributes);
        } else {
            // CREATE: use all fields with defaults for missing keys
            $createAttributes = $coreAttributes;

            foreach ($apiFields as $attr => $meta) {
                $createAttributes[$attr] = $userData[$meta['key']] ?? $meta['default'];
            }

            foreach ($dateFields as $attr => $sourceKey) {
                $createAttributes[$attr] = ! empty($userData[$sourceKey]) ? $userData[$sourceKey] : null;
            }

            $createAttributes['priority'] = $priority;
            $createAttributes['is_admin'] = ($userData['role'] ?? 3) === 1;

            $user = static::create(array_merge(['wheniwork_id' => $wiwId], $createAttributes));
        }

        return $user;
    }

    /**
     * Extract priority value from When I Work notes field.
     *
     * Looks for pattern "Priority=<number>" in the notes string.
     * Returns null if not found or invalid.
     */
    public static function extractPriorityFromNotes(?string $notes): ?int
    {
        if (empty($notes)) {
            return null;
        }

        if (preg_match('/Priority\s*=\s*(\d+)/i', $notes, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /**
     * Get all users with the same email address (for multi-account selection).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, static>
     */
    public static function getUsersByEmail(string $email): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('email', $email)
            ->whereNotNull('account_id')
            ->get();
    }

    /**
     * Get the work location name for this user.
     * Uses the location relationship from the locations table.
     */
    public function getWorkLocationNameAttribute(): ?string
    {
        // Primary source: location relationship
        if ($this->location_id && $this->relationLoaded('location') && $this->location) {
            return $this->location->name;
        }

        // Lazy load if not already loaded
        if ($this->location_id) {
            $location = $this->location;
            if ($location) {
                return $location->name;
            }
        }

        // Fallback to account_id display (should not happen in normal flow)
        return $this->account_id ? "Location #{$this->account_id}" : null;
    }
}
