<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Multi-Account Support Changes:
     * 1. Remove email unique constraint (email alone should NOT identify a user)
     * 2. Remove wheniwork_id unique constraint (same person can have different wheniwork_id per account)
     * 3. Add composite unique constraint on (account_id, wheniwork_id, login_id, email)
     * 4. Add priority column for user priority from When I Work notes
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop existing unique constraints
            $table->dropUnique('users_email_unique');
            $table->dropUnique('users_wheniwork_id_unique');

            // Add composite unique constraint for multi-account support
            // This ensures uniqueness across (account_id, wheniwork_id, login_id, email)
            $table->unique(
                ['account_id', 'wheniwork_id', 'login_id', 'email'],
                'users_multi_account_unique'
            );

            // Add priority column (nullable integer, extracted from When I Work notes)
            $table->integer('priority')->nullable()->after('notes');

            // Add index on email for faster lookups during login
            $table->index('email', 'users_email_index');

            // Add index on login_id for faster lookups
            $table->index('login_id', 'users_login_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('users_multi_account_unique');

            // Drop the indexes
            $table->dropIndex('users_email_index');
            $table->dropIndex('users_login_id_index');

            // Drop priority column
            $table->dropColumn('priority');

            // Restore original unique constraints
            $table->unique('email', 'users_email_unique');
            $table->unique('wheniwork_id', 'users_wheniwork_id_unique');
        });
    }
};
