<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'id_laporan',
    'id_admin',
    'catatan',
    'foto_penanganan',
    'tanggal',
])]
class TindakLanjut extends Model
{
    protected $table = 'tindak_lanjut';
    protected $primaryKey = 'id_tindak_lanjut';
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'tanggal' => 'datetime',
            'foto_penanganan' => 'array',
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

    /**
     * @return list<string>
     */
    public static function normalizeFotoPaths(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(
                $value,
                fn ($v) => is_string($v) && $v !== '',
            ));
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return self::normalizeFotoPaths($decoded);
            }

            return [$value];
        }

        return [];
    }
}