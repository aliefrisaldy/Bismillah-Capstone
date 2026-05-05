<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;

#[Fillable(['nama', 'email', 'password', 'jabatan'])]
#[Hidden(['password'])]
class Admin extends Authenticatable
{
    protected $table = 'admin';
    protected $primaryKey = 'id_admin';

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function tindakLanjut()
    {
        return $this->hasMany(TindakLanjut::class, 'id_admin', 'id_admin');
    }

    public function riwayatStatus()
    {
        return $this->hasMany(RiwayatStatus::class, 'id_admin', 'id_admin');
    }
}