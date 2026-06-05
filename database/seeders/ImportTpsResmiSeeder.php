<?php

namespace Database\Seeders;

use App\Models\TpsResmi;
use Illuminate\Database\Seeder;

class ImportTpsResmiSeeder extends Seeder
{
    public function run(): void
    {
        $path = base_path('database/geojson/tps_resmi.geojson');

        if (! file_exists($path)) {
            $this->command->error("File tidak ditemukan: {$path}");

            return;
        }

        $geojson = json_decode(file_get_contents($path), true);

        if (empty($geojson['features'])) {
            $this->command->warn('Tidak ada fitur dalam file GeoJSON.');

            return;
        }

        $count = 0;

        foreach ($geojson['features'] as $feature) {
            $coords = $feature['geometry']['coordinates'] ?? null;

            if (! $coords || count($coords) < 2) {
                continue;
            }

            $nama = $feature['properties']['Name'] ?? null;

            // GeoJSON format: [longitude, latitude, elevation]
            $longitude = $coords[0];
            $latitude = $coords[1];

            TpsResmi::create([
                'nama' => $nama,
                'latitude' => $latitude,
                'longitude' => $longitude,
            ]);

            $count++;
        }

        $this->command->info("✅ Import {$count} TPS Resmi dari GeoJSON ke database.");
    }
}
