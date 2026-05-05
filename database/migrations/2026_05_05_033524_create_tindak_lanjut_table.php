<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_status', function (Blueprint $table) {
            $table->id('id_riwayat');
            $table->foreignId('id_laporan')
                  ->constrained('laporan', 'id_laporan')
                  ->onDelete('cascade');
            $table->foreignId('id_admin')
                  ->constrained('admin', 'id_admin')
                  ->onDelete('cascade');
            $table->enum('status_lama', [
                'menunggu',
                'diverifikasi',
                'diproses',
                'selesai',
                'ditolak',
            ]);
            $table->enum('status_baru', [
                'menunggu',
                'diverifikasi',
                'diproses',
                'selesai',
                'ditolak',
            ]);
            $table->text('catatan')->nullable();
            $table->timestamp('tanggal')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riwayat_status');
    }
};