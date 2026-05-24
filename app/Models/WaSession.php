<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'no_wa',
    'step',
    'data',
])]
class WaSession extends Model
{
    protected $table = 'wa_sessions';
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }
}