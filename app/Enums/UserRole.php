<?php

namespace App\Enums;

enum UserRole: int
{
    case ADMIN = 1;
    case MANAGER = 2;
    case EMPLOYEE = 3;
    case SUPERVISOR = 5;

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin',
            self::MANAGER => 'Manager',
            self::EMPLOYEE => 'Staff',
            self::SUPERVISOR => 'Supervisor',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::ADMIN;
    }

    public function isManager(): bool
    {
        return $this === self::MANAGER;
    }

    public function isEmployee(): bool
    {
        return $this === self::EMPLOYEE;
    }

    public function isSupervisor(): bool
    {
        return $this === self::SUPERVISOR;
    }

    public function canManageUsers(): bool
    {
        return in_array($this, [self::ADMIN]);
    }

    public function canAccessPayroll(): bool
    {
        return in_array($this, [self::ADMIN, self::MANAGER, self::SUPERVISOR]);
    }
}
