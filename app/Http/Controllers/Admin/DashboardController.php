<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use App\Models\TpsResmi;
use App\Models\JalurAngkut;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // ── Laporan ────────────────────────────────────────────────
        $totalLaporan     = Laporan::count();
        $laporanHariIni   = Laporan::whereDate('tanggal_laporan', Carbon::today())->count();
        $laporanMingguIni = Laporan::whereBetween('tanggal_laporan', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek(),
        ])->count();

        $byStatus = [
            'menunggu'     => Laporan::where('status', 'menunggu')->count(),
            'diverifikasi' => Laporan::where('status', 'diverifikasi')->count(),
            'diproses'     => Laporan::where('status', 'diproses')->count(),
            'selesai'      => Laporan::where('status', 'selesai')->count(),
            'ditolak'      => Laporan::where('status', 'ditolak')->count(),
        ];

        // Laporan terbaru (5)
        $recentLaporan = Laporan::with('user')
            ->orderByDesc('tanggal_laporan')
            ->take(5)
            ->get()
            ->map(fn ($l) => [
                'id'      => $l->id_laporan,
                'alamat'  => $l->alamat,
                'status'  => $l->status,
                'tanggal' => Carbon::parse($l->tanggal_laporan)->format('d M Y'),
                'pelapor' => $l->user?->name ?? '—',
            ]);

        // Top kelurahan — dari alamat karena tidak ada kolom kelurahan terpisah
        // Jika ada kolom kelurahan di tabel, ganti 'alamat' dengan 'kelurahan'
        $topKelurahan = collect([]); // kosongkan dulu, isi jika ada kolom kelurahan

        // ── TPS Resmi ──────────────────────────────────────────────
        $totalTps = TpsResmi::count();

        // ── Jalur Angkut ───────────────────────────────────────────
        $totalJalur  = JalurAngkut::count();
        $jalurByTipe = [
            'Pick Up' => JalurAngkut::where('tipe_kendaraan', 'Pick Up')->count(),
            'Kaisar'  => JalurAngkut::where('tipe_kendaraan', 'Kaisar')->count(),
            'R6'      => JalurAngkut::where('tipe_kendaraan', 'R6')->count(),
        ];

        // ── User/Pelapor ───────────────────────────────────────────
        $totalUser = User::count();

        // ── Tren bulanan (6 bulan) ─────────────────────────────────
        $trendBulanan = $this->getTrendBulanan();

        return Inertia::render('admin/dashboard', [
            'totalLaporan'     => $totalLaporan,
            'laporanHariIni'   => $laporanHariIni,
            'laporanMingguIni' => $laporanMingguIni,
            'byStatus'         => $byStatus,
            'recentLaporan'    => $recentLaporan,
            'topKelurahan'     => $topKelurahan,
            'totalTps'         => $totalTps,
            'totalJalur'       => $totalJalur,
            'jalurByTipe'      => $jalurByTipe,
            'totalUser'        => $totalUser,
            'trendBulanan'     => $trendBulanan,
        ]);
    }

    public function getTrendData(Request $request)
    {
        $period = $request->get('period', 'monthly');

        return response()->json(match ($period) {
            'daily'  => $this->getTrendHarian(),
            'weekly' => $this->getTrendMingguan(),
            default  => $this->getTrendBulanan(),
        });
    }

    // ── Private helpers ────────────────────────────────────────────

    private function getTrendHarian(): array
    {
        $start = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $labels = $values = [];

        for ($i = 0; $i < 7; $i++) {
            $date     = $start->copy()->addDays($i);
            $labels[] = $date->translatedFormat('D');
            $values[] = Laporan::whereDate('tanggal_laporan', $date)->count();
        }

        return compact('labels', 'values');
    }

    private function getTrendMingguan(): array
    {
        $labels = $values = [];

        for ($i = 7; $i >= 0; $i--) {
            $week     = Carbon::now()->subWeeks($i);
            $labels[] = 'Mgg ' . $week->weekOfYear;
            $values[] = Laporan::whereBetween('tanggal_laporan', [
                $week->copy()->startOfWeek(),
                $week->copy()->endOfWeek(),
            ])->count();
        }

        return compact('labels', 'values');
    }

    private function getTrendBulanan(): array
    {
        $labels = $values = [];

        for ($i = 5; $i >= 0; $i--) {
            $month    = Carbon::now()->subMonths($i);
            $labels[] = $month->translatedFormat('M Y');
            $values[] = Laporan::whereYear('tanggal_laporan', $month->year)
                ->whereMonth('tanggal_laporan', $month->month)
                ->count();
        }

        return compact('labels', 'values');
    }
}