<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::insert(
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'wheniwork_id' => 01,
                'email' => 'admin@dev.com',
                'password' => Hash::make('admin@dev.com'),
                'is_admin' => true,
            ],
            [
                'first_name' => 'User',
                'last_name' => 'User',
                'wheniwork_id' => 02,
                'email' => 'user@dev.com',
                'password' => Hash::make('user@dev.com'),
                'is_admin' => false,
            ]
        );

        User::factory(50)->create();
    }
}
