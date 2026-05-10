<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total' => Laporan::count(),
            'menunggu' => Laporan::where('status', 'menunggu')->count(),
            'diverifikasi' => Laporan::where('status', 'diverifikasi')->count(),
            'diproses' => Laporan::where('status', 'diproses')->count(),
            'selesai' => Laporan::where('status', 'selesai')->count(),
            'ditolak' => Laporan::where('status', 'ditolak')->count(),
        ];

        $laporan_terbaru = Laporan::with('user')
            ->orderByDesc('tanggal_laporan')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'id_laporan' => $item->id_laporan,
                'alamat' => $item->alamat,
                'status' => $item->status,
                'tanggal_laporan' => $item->tanggal_laporan?->format('d M Y H:i'),
                'pelapor' => $item->user?->nama,
            ]);

        return Inertia::render('dashboard', [ // ← tetap pakai halaman bawaan
            'stats' => $stats,
            'laporan_terbaru' => $laporan_terbaru,
        ]);
    }
}