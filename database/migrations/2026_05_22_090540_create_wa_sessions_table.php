<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wa_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('no_wa', 20)->unique();
            $table->string('step', 50)->default('idle');
            $table->json('data')->nullable();
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_sessions');
    }
};
