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
            $table->dropColumn('name');
            $table->string('password')->nullable()->change();

            $table->unsignedBigInteger('wheniwork_id')->unique()->nullable()->after('id');
            $table->unsignedBigInteger('account_id')->nullable()->after('wheniwork_id');
            $table->unsignedBigInteger('login_id')->nullable()->after('account_id');
            $table->text('wheniwork_token')->nullable()->after('login_id');

            $table->string('first_name')->nullable()->after('wheniwork_token');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->string('phone_number')->nullable()->after('last_name');
            $table->string('employee_code')->nullable()->after('phone_number');

            $table->tinyInteger('role')->default(3)->after('employee_code');
            $table->string('employment_type')->default('hourly')->after('role');

            $table->boolean('is_payroll')->default(false)->after('employment_type');
            $table->boolean('is_trusted')->default(false)->after('is_payroll');
            $table->boolean('is_private')->default(true)->after('is_trusted');
            $table->boolean('is_hidden')->default(false)->after('is_private');
            $table->boolean('activated')->default(false)->after('is_hidden');
            $table->boolean('is_active')->default(true)->after('activated');

            $table->decimal('hours_preferred', 8, 2)->default(0)->after('is_active');
            $table->decimal('hours_max', 8, 2)->default(0)->after('hours_preferred');
            $table->decimal('hourly_rate', 10, 2)->default(0)->after('hours_max');

            $table->text('notes')->nullable()->after('hourly_rate');
            $table->string('uuid')->nullable()->after('notes');
            $table->string('timezone_name')->nullable()->after('uuid');

            $table->date('start_date')->nullable()->after('timezone_name');
            $table->timestamp('hired_on')->nullable()->after('start_date');
            $table->timestamp('terminated_at')->nullable()->after('hired_on');
            $table->timestamp('last_login')->nullable()->after('terminated_at');

            $table->json('alert_settings')->nullable()->after('last_login');
            $table->json('positions')->nullable()->after('alert_settings');
            $table->json('locations')->nullable()->after('positions');
            $table->json('avatar_urls')->nullable()->after('locations');

            $table->softDeletes();

            $table->index('wheniwork_id');
            $table->index('account_id');
            $table->index('role');
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
                'account_id',
                'login_id',
                'wheniwork_token',
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
                'deleted_at'
            ]);

            $table->string('name')->after('id');
            $table->string('password')->nullable(false)->change();
        });
    }
};
