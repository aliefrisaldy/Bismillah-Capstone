<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::create([
            'nama'     => 'Admin DLH Palu',
            'email'    => 'admin@gmail.com',
            'password' => Hash::make('123'),
            'jabatan'  => 'Kepala Bidang Pengelolaan Sampah',
        ]);
    }
}