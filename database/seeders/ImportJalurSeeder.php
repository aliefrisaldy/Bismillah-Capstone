<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JalurAngkut;

class ImportJalurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ── 1. Import Pick Up (per kelurahan) ──────────────────
        $folderPickUp = base_path('database/geojson/pickup');

        foreach (glob($folderPickUp . '/*.geojson') as $file) {

            $namaKelurahan = pathinfo($file, PATHINFO_FILENAME);

            $geojson = json_decode(file_get_contents($file), true);

            foreach ($geojson['features'] as $feature) {
                $coords = $feature['geometry']['coordinates'] ?? null;
                if (!$coords)
                    continue;

                JalurAngkut::create([
                    'nama' => $feature['properties']['Nama_Jalan'] // ← dari properti GeoJSON
                        ?? $namaKelurahan,                      // fallback nama file

                    'kelurahan' => $feature['properties']['kelurahan'] ?? $namaKelurahan,
                    'tipe_kendaraan' => 'Pick Up',
                    'coordinates' => $coords,
                    'warna' => '#e74c3c',
                    'aktif' => true,
                ]);
            }

            $this->command->info("✅ Pick Up - {$namaKelurahan}");
        }

        // ── 2. Import Kaisar ───────────────────────────────────
        $this->importSingleFile(
            base_path('database/geojson/Kaisar.geojson'),
            'Kaisar',
            '#3498db' // biru
        );

        // ── 3. Import R6 ───────────────────────────────────────
        $this->importSingleFile(
            base_path('database/geojson/R6.geojson'),
            'R6',
            '#2ecc71' // hijau
        );

        $this->command->info("\n✅ Semua jalur berhasil diimport!");
    }

    /**
     * Import 1 file GeoJSON
     */
    private function importSingleFile(
        string $path,
        string $tipe,
        string $warna
    ): void {

        if (!file_exists($path)) {
            $this->command->error("❌ File tidak ditemukan: {$path}");
            return;
        }

        $geojson = json_decode(file_get_contents($path), true);

        $count = 0;

        foreach ($geojson['features'] as $feature) {

            $coords = $feature['geometry']['coordinates'] ?? null;

            if (!$coords) {
                continue;
            }

            JalurAngkut::create([
                'nama' => $feature['properties']['Lokasi']      // R6
                    ?? $feature['properties']['Nama_Jalan']  // Kaisar & Pick Up
                    ?? $tipe,                                // fallback ke nama tipe

                'kelurahan' => $feature['properties']['kelurahan']  // Pick Up
                    ?? $feature['properties']['Armada_Kel']  // Kaisar
                    ?? $feature['properties']['Kecamatan']   // R6
                    ?? null,

                'tipe_kendaraan' => $tipe,
                'coordinates' => $coords,
                'warna' => $warna,
                'aktif' => true,
            ]);

            $count++;
        }

        $this->command->info("✅ {$tipe} → {$count} jalur");
    }
}