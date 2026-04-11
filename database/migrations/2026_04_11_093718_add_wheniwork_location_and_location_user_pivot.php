<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->unsignedBigInteger('wheniwork_location_id')->nullable()->after('account_id');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique('locations_account_id_unique');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->unique(['account_id', 'wheniwork_location_id'], 'locations_account_id_wheniwork_location_id_unique');
        });

        Schema::create('location_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_id', 'location_id'], 'location_user_user_id_location_id_unique');
        });

        $driver = Schema::getConnection()->getDriverName();
        $now = now()->format('Y-m-d H:i:s');

        if ($driver === 'mysql') {
            DB::statement('
                INSERT INTO location_user (user_id, location_id, created_at, updated_at, deleted_at)
                SELECT u.id, u.location_id, ?, ?, NULL
                FROM users u
                WHERE u.location_id IS NOT NULL
                  AND u.deleted_at IS NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM location_user lu
                    WHERE lu.user_id = u.id AND lu.location_id = u.location_id
                  )
            ', [$now, $now]);
        } else {
            foreach (DB::table('users')
                ->whereNotNull('location_id')
                ->whereNull('deleted_at')
                ->get(['id', 'location_id']) as $row) {
                $exists = DB::table('location_user')
                    ->where('user_id', $row->id)
                    ->where('location_id', $row->location_id)
                    ->exists();

                if (! $exists) {
                    DB::table('location_user')->insert([
                        'user_id' => $row->id,
                        'location_id' => $row->location_id,
                        'created_at' => $now,
                        'updated_at' => $now,
                        'deleted_at' => null,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_user');

        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique('locations_account_id_wheniwork_location_id_unique');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->unique('account_id', 'locations_account_id_unique');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn('wheniwork_location_id');
        });
    }
};
