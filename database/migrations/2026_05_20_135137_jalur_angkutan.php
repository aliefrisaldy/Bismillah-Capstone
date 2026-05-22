<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('jalur_angkut', function (Blueprint $table) {
            $table->id('id_jalur_angkut');
            $table->string('nama');
            $table->string('kelurahan')->nullable();
            $table->enum('tipe_kendaraan', ['Pick Up', 'Kaisar', 'R6'])->default('Pick Up');
            $table->longText('coordinates');
            $table->string('warna')->default('#e74c3c');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jalur_angkut');
    }
};
