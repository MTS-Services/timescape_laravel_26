<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('availability_date');
            $table->string('time_slot')->nullable();
            $table->enum('status', ['available', 'unavailable', 'preferred'])->default('available');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'availability_date']);
            $table->index(['user_id', 'availability_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availabilities');
    }
};
