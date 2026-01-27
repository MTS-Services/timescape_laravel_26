<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('availabilities', function (Blueprint $table) {
            $table->unsignedBigInteger('wheniwork_availability_id')->nullable()->after('id');
            $table->index('wheniwork_availability_id');
        });
    }

    public function down(): void
    {
        Schema::table('availabilities', function (Blueprint $table) {
            $table->dropIndex(['wheniwork_availability_id']);
            $table->dropColumn('wheniwork_availability_id');
        });
    }
};
