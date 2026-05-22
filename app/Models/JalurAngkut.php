<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama', 'kelurahan', 'tipe_kendaraan', 'coordinates', 'warna', 'aktif'])]
class JalurAngkut extends Model
{
    protected $table = 'jalur_angkut';
    protected $primaryKey = 'id_jalur_angkut';

    protected $casts = [
        'coordinates' => 'array',
        'aktif' => 'boolean',
    ];

    public function toGeoJson(): array
    {
        $raw = $this->coordinates ?? [];

        // Flatten triple-nested: [[[lng,lat]]] → [[lng,lat]]
        if (isset($raw[0][0]) && is_array($raw[0][0])) {
            $raw = $raw[0]; // unwrap satu level
        }

        // Flat array: [lng,lat,lng,lat] → [[lng,lat],[lng,lat]]
        $coordinates = (isset($raw[0]) && !is_array($raw[0]))
            ? array_chunk($raw, 2)
            : $raw;

        // Filter koordinat yang tidak valid (harus tepat 2 elemen numerik)
        $coordinates = array_values(array_filter($coordinates, function ($point) {
            return is_array($point)
                && count($point) === 2
                && is_numeric($point[0])
                && is_numeric($point[1]);
        }));

        return [
            'type' => 'Feature',
            'properties' => [
                'id' => $this->id_jalur_angkut,
                'nama' => $this->nama,
                'kelurahan' => $this->kelurahan,
                'tipe_kendaraan' => $this->tipe_kendaraan,
                'warna' => $this->warna,
            ],
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => $coordinates,
            ],
        ];
    }
}