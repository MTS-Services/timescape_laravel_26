<?php

namespace Database\Factories;

use App\Models\Availability;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends Factory<\App\Models\Availability>
 */
class AvailabilityFactory extends Factory
{
    protected $model = Availability::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'availability_date' => Carbon::parse(fake()->dateTimeBetween('-1 month', '+1 month')->format('Y-m-d')),
            'time_slot' => fake()->randomElement(['9:30-4:30', '3:30-10:30', 'all-day', 'holyday']),
            'status' => 'available',
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
