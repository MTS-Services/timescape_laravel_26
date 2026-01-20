<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
                'name' => 'Admin',
                'email' => 'admin@dev.com',
                'password' => Hash::make('admin@dev.com'),
                'is_admin' => true,
            ],
            [
                'name' => 'User',
                'email' => 'user@dev.com',
                'password' => Hash::make('user@dev.com'),
                'is_admin' => false,
            ]
        );

        User::factory(50)->create();
    }
}
