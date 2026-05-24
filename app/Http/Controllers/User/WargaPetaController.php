<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\JalurAngkut;
use App\Models\Laporan;
use App\Models\TpsResmi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WargaPetaController extends Controller
{
    public function index()
    {
        return Inertia::render('user/peta-laporan');
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
            'id'        => $item->id_laporan,
            'latitude'  => (float) $item->latitude,
            'longitude' => (float) $item->longitude,
            'alamat'    => $item->alamat,
            'status'    => $item->status,
            'tanggal'   => $item->tanggal_laporan?->format('d M Y'),
        ]);

        return response()->json($laporan);
    }

    public function jalurIndex()
    {
        return Inertia::render('user/jalur-angkut');
    }

    public function jalurData(Request $request)
    {
        // Wajib ada minimal satu filter
        if (!$request->filled('tipe') && !$request->filled('kelurahan')) {
            return response()->json([]);
        }

        $query = JalurAngkut::query()->where('aktif', true);

        if ($request->filled('tipe')) {
            $query->where('tipe_kendaraan', $request->tipe);
        }

        if ($request->filled('kelurahan') && $request->tipe === 'Pick Up') {
            $query->where('kelurahan', $request->kelurahan);
        }

        $jalur = $query->get()->map(fn ($item) => $item->toGeoJson());

        return response()->json($jalur);
    }

    public function kelurahans()
    {
        $kelurahans = JalurAngkut::where('aktif', true)
            ->whereNotNull('kelurahan')
            ->distinct()
            ->orderBy('kelurahan')
            ->pluck('kelurahan');

        return response()->json($kelurahans);
    }

    public function tpsData()
    {
        return response()->json(
            TpsResmi::where('aktif', true)
                ->get()
                ->map(fn ($ts) => [
                    'id'        => $ts->id_tps_resmi,
                    'latitude'  => $ts->latitude,
                    'longitude' => $ts->longitude,
                ])
        );
    }
}
