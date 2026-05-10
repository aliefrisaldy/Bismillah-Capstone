<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan', function (Blueprint $table) {
            // Create a new JSON column first so we can safely migrate data from the old string column.
            $table->json('foto_json')->nullable()->after('foto');
        });

        // Migrate existing single-photo strings into JSON array format.
        DB::table('laporan')
            ->select(['id_laporan', 'foto'])
            ->orderBy('id_laporan')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $value = null;
                    if (!empty($row->foto)) {
                        $value = json_encode([$row->foto], JSON_UNESCAPED_SLASHES);
                    }
                    DB::table('laporan')
                        ->where('id_laporan', $row->id_laporan)
                        ->update(['foto_json' => $value]);
                }
            }, 'id_laporan');

        // Drop legacy columns and rename foto_json -> foto.
        Schema::table('laporan', function (Blueprint $table) {
            if (Schema::hasColumn('laporan', 'fotos')) {
                $table->dropColumn('fotos');
            }
        });

        Schema::table('laporan', function (Blueprint $table) {
            // Drop old string column, then rename json column to `foto`.
            if (Schema::hasColumn('laporan', 'foto')) {
                $table->dropColumn('foto');
            }
        });

        Schema::table('laporan', function (Blueprint $table) {
            $table->renameColumn('foto_json', 'foto');
        });
    }

    public function down(): void
    {
        // Best-effort rollback: convert JSON array back to the first string value.
        Schema::table('laporan', function (Blueprint $table) {
            $table->string('foto_str', 255)->nullable()->after('foto');
        });

        DB::table('laporan')
            ->select(['id_laporan', 'foto'])
            ->orderBy('id_laporan')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $first = null;
                    if (is_string($row->foto) && $row->foto !== '') {
                        $decoded = json_decode($row->foto, true);
                        if (is_array($decoded) && isset($decoded[0]) && is_string($decoded[0])) {
                            $first = $decoded[0];
                        }
                    }

                    DB::table('laporan')
                        ->where('id_laporan', $row->id_laporan)
                        ->update(['foto_str' => $first]);
                }
            }, 'id_laporan');

        Schema::table('laporan', function (Blueprint $table) {
            if (Schema::hasColumn('laporan', 'foto')) {
                $table->dropColumn('foto');
            }
        });

        Schema::table('laporan', function (Blueprint $table) {
            $table->renameColumn('foto_str', 'foto');
        });
    }
};

