<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'id_laporan',
    'id_admin',
    'status_lama',
    'status_baru',
    'catatan',
    'tanggal',
])]
class RiwayatStatus extends Model
{
    protected $table = 'riwayat_status';
    protected $primaryKey = 'id_riwayat';
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime',
        ];
    }

    public function laporan()
    {
        return $this->belongsTo(Laporan::class, 'id_laporan', 'id_laporan');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }
}