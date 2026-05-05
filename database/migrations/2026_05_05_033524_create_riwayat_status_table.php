<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tindak_lanjut', function (Blueprint $table) {
            $table->id('id_tindak_lanjut');
            $table->foreignId('id_laporan')
                  ->constrained('laporan', 'id_laporan')
                  ->onDelete('cascade');
            $table->foreignId('id_admin')
                  ->constrained('admin', 'id_admin')
                  ->onDelete('cascade');
            $table->text('catatan')->nullable();
            $table->string('foto_penanganan', 255)->nullable();
            $table->timestamp('tanggal')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tindak_lanjut');
    }
};