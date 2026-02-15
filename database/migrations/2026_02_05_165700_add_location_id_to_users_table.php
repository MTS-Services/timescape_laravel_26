<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds location_id foreign key to users table.
     * Each user belongs to one location (work location from When I Work).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('location_id')
                ->nullable()
                ->after('account_id')
                ->constrained('locations')
                ->nullOnDelete();

            $table->index('location_id', 'users_location_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropIndex('users_location_id_index');
            $table->dropColumn('location_id');
        });
    }
};
