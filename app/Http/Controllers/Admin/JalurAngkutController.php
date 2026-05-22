<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JalurAngkut;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JalurAngkutController extends Controller
{
    // ── Halaman utama peta jalur ──────────────────────────────
    public function index()
    {
        return Inertia::render('admin/jalur-angkut');
    }

    // ── Ambil semua jalur (untuk ditampilkan di peta) ─────────
    public function data(Request $request)
    {
        // Wajib ada minimal satu filter
        if (!$request->filled('tipe') && !$request->filled('kelurahan')) {
            return response()->json([]);
        }

        $query = JalurAngkut::query()->where('aktif', true);

        if ($request->filled('tipe')) {
            $query->where('tipe_kendaraan', $request->tipe);
        }
        if ($request->filled('kelurahan')) {
            $query->where('kelurahan', $request->kelurahan);
        }

        $jalur = $query->get()->map(fn($item) => $item->toGeoJson());

        return response()->json($jalur);
    }

    // ── Update koordinat jalur (drag & drop di peta) ──────────
    public function update(Request $request, $id)
    {
        $request->validate([
            'coordinates' => 'required|array',
        ]);

        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();
        $jalur->update([
            'coordinates' => $request->coordinates,
        ]);

        return response()->json([
            'message' => 'Jalur berhasil diperbarui.',
            'jalur' => $jalur->toGeoJson(),
        ]);
    }

    // ── Toggle aktif/nonaktif jalur ───────────────────────────
    public function toggleAktif($id)
    {
        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();
        $jalur->update(['aktif' => !$jalur->aktif]);

        return response()->json([
            'message' => 'Status jalur diperbarui.',
            'aktif' => $jalur->aktif,
        ]);
    }

    public function kelurahans()
    {
        return response()->json(
            JalurAngkut::where('aktif', true)
                ->whereNotNull('kelurahan')
                ->distinct()->orderBy('kelurahan')->pluck('kelurahan')
        );
    }
}