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
        $allowed = ['menunggu', 'diverifikasi', 'diproses', 'selesai', 'ditolak'];

        $query = Laporan::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereIn('status', $allowed);

        if ($request->filled('status') && in_array($request->status, $allowed, true)) {
            $query->where('status', $request->status);
        }

        $laporan = $query->get()->map(fn ($item) => [
            'id' => $item->id_laporan,
            'latitude' => (float) $item->latitude,
            'longitude' => (float) $item->longitude,
            'alamat' => $item->alamat,
            'status' => $item->status,
            'tanggal' => $item->tanggal_laporan?->format('d M Y'),
            'pelapor' => $item->nama_pelapor ?? '-',
        ]);

        return response()->json($laporan);
    }
}
