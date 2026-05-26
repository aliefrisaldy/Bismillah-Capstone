<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->string('id_pelapor', 36)->nullable()->after('id_user')->index();
            $table->string('nama_pelapor', 100)->nullable()->after('id_pelapor');
            $table->string('no_telpon_pelapor', 15)->nullable()->after('nama_pelapor');

            $table->foreignId('id_user')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            $table->dropColumn(['id_pelapor', 'nama_pelapor', 'no_telpon_pelapor']);

            $table->foreignId('id_user')->nullable(false)->change();
        });
    }
};
