<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tps_resmi', function (Blueprint $table) {
            $table->string('nama')->nullable()->after('id_tps_resmi');
        });
    }

    public function down(): void
    {
        Schema::table('tps_resmi', function (Blueprint $table) {
            $table->dropColumn('nama');
        });
    }
};
