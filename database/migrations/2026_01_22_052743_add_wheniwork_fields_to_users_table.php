<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('wheniwork_id')->nullable()->after('id');
            $table->string('wheniwork_login_id')->nullable()->after('wheniwork_id');
            $table->string('wheniwork_token')->nullable()->after('remember_token');
            $table->string('wheniwork_account_id')->nullable()->after('wheniwork_login_id');
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->json('wheniwork_data')->nullable()->after('wheniwork_token');
            $table->boolean('is_admin')->default(false)->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'wheniwork_id',
                'wheniwork_login_id',
                'wheniwork_account_id',
                'wheniwork_token',
                'wheniwork_data',
                'first_name',
                'last_name',
            ]);

            if (Schema::hasColumn('users', 'is_admin')) {
                $table->dropColumn('is_admin');
            }
        });
    }
};
