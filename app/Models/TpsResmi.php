<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama', 'latitude', 'longitude', 'aktif'])]
class TpsResmi extends Model
{
    protected $table = 'tps_resmi';

    protected $primaryKey = 'id_tps_resmi';

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'aktif' => 'boolean',
    ];
}
