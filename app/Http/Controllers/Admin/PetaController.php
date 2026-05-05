<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PetaController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/peta');
    }

    public function data(Request $request)
    {
        $query = Laporan::with('user')
                        ->whereNotNull('latitude')
                        ->whereNotNull('longitude');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $laporan = $query->get()->map(fn($item) => [
            'id'        => $item->id_laporan,
            'latitude'  => $item->latitude,
            'longitude' => $item->longitude,
            'alamat'    => $item->alamat,
            'status'    => $item->status,
            'tanggal'   => $item->tanggal_laporan?->format('d M Y'),
            'pelapor'   => $item->user?->nama ?? '-',
        ]);

        return response()->json($laporan);
    }
}