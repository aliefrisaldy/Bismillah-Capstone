<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tindak_lanjut', function (Blueprint $table) {
            $table->json('foto_penanganan_json')->nullable()->after('foto_penanganan');
        });

        DB::table('tindak_lanjut')
            ->select(['id_tindak_lanjut', 'foto_penanganan'])
            ->orderBy('id_tindak_lanjut')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $value = null;
                    if (! empty($row->foto_penanganan)) {
                        $decoded = json_decode($row->foto_penanganan, true);
                        if (is_array($decoded)) {
                            $value = json_encode(array_values($decoded), JSON_UNESCAPED_SLASHES);
                        } else {
                            $value = json_encode([$row->foto_penanganan], JSON_UNESCAPED_SLASHES);
                        }
                    }
                    DB::table('tindak_lanjut')
                        ->where('id_tindak_lanjut', $row->id_tindak_lanjut)
                        ->update(['foto_penanganan_json' => $value]);
                }
            }, 'id_tindak_lanjut');

        Schema::table('tindak_lanjut', function (Blueprint $table) {
            if (Schema::hasColumn('tindak_lanjut', 'foto_penanganan')) {
                $table->dropColumn('foto_penanganan');
            }
        });

        Schema::table('tindak_lanjut', function (Blueprint $table) {
            $table->renameColumn('foto_penanganan_json', 'foto_penanganan');
        });
    }

    public function down(): void
    {
        Schema::table('tindak_lanjut', function (Blueprint $table) {
            $table->string('foto_penanganan_str', 255)->nullable()->after('foto_penanganan');
        });

        DB::table('tindak_lanjut')
            ->select(['id_tindak_lanjut', 'foto_penanganan'])
            ->orderBy('id_tindak_lanjut')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $first = null;
                    if (is_string($row->foto_penanganan) && $row->foto_penanganan !== '') {
                        $decoded = json_decode($row->foto_penanganan, true);
                        if (is_array($decoded) && isset($decoded[0]) && is_string($decoded[0])) {
                            $first = $decoded[0];
                        }
                    }

                    DB::table('tindak_lanjut')
                        ->where('id_tindak_lanjut', $row->id_tindak_lanjut)
                        ->update(['foto_penanganan_str' => $first]);
                }
            }, 'id_tindak_lanjut');

        Schema::table('tindak_lanjut', function (Blueprint $table) {
            if (Schema::hasColumn('tindak_lanjut', 'foto_penanganan')) {
                $table->dropColumn('foto_penanganan');
            }
        });

        Schema::table('tindak_lanjut', function (Blueprint $table) {
            $table->renameColumn('foto_penanganan_str', 'foto_penanganan');
        });
    }
};
