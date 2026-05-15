<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'id_user',
    'deskripsi',
    'foto',
    'latitude',
    'longitude',
    'alamat',
    'status',
    'tanggal_laporan',
    'tanggal_diperbarui',
])]
class Laporan extends Model
{
    protected $table = 'laporan';
    protected $primaryKey = 'id_laporan';
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'tanggal_laporan'        => 'datetime',
            'tanggal_diperbarui'     => 'datetime',
            'latitude'               => 'decimal:8',
            'longitude'              => 'decimal:8',
            'foto' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function tindakLanjut()
    {
        return $this->hasMany(TindakLanjut::class, 'id_laporan', 'id_laporan');
    }

    public function riwayatStatus()
    {
        return $this->hasMany(RiwayatStatus::class, 'id_laporan', 'id_laporan');
    }
}