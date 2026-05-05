<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan', function (Blueprint $table) {
            $table->id('id_laporan');
            $table->foreignId('id_user')
                  ->constrained('users', 'id_user')
                  ->onDelete('cascade');
            $table->text('deskripsi');
            $table->string('foto', 255)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('alamat')->nullable();
            $table->enum('status', [
                'menunggu',
                'diverifikasi',
                'diproses',
                'selesai',
                'ditolak',
            ])->default('menunggu');
            $table->timestamp('tanggal_laporan')->useCurrent();
            $table->timestamp('tanggal_diperbarui')
                  ->useCurrent()
                  ->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan');
    }
};