<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JalurAngkut;
use App\Models\Laporan;
use App\Models\TpsResmi;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private const CACHE_TTL = 300; // 5 menit

    public function index()
    {
        $data = Cache::remember('dashboard.stats.v2', self::CACHE_TTL, function () {
            // ── Laporan counts — 1 query ──
            $byStatusRaw = Laporan::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $defaultStatus = ['menunggu', 'diverifikasi', 'diproses', 'selesai', 'ditolak'];
            $byStatus = collect($defaultStatus)
                ->mapWithKeys(fn ($s) => [$s => (int) ($byStatusRaw[$s] ?? 0)])
                ->all();

            $totalLaporan = array_sum($byStatus);

            // ── Laporan hari/minggu ini — 2 queries ──
            $laporanHariIni = Laporan::whereDate('tanggal_laporan', Carbon::today())->count();
            $laporanMingguIni = Laporan::whereBetween('tanggal_laporan', [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek(),
            ])->count();

            // ── Recent laporan — 1 query ──
            $recentLaporan = Laporan::orderByDesc('tanggal_laporan')
                ->take(5)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id_laporan,
                    'alamat' => $l->alamat,
                    'status' => $l->status,
                    'tanggal' => Carbon::parse($l->tanggal_laporan)->format('d M Y'),
                    'pelapor' => $l->nama_pelapor ?? '—',
                ])
                ->values()
                ->all();

            // ── TPS — 1 query ──
            $totalTps = TpsResmi::count();

            // ── Jalur — 2 queries (total + group) ──
            $totalJalur = JalurAngkut::count();
            $jalurByTipe = JalurAngkut::selectRaw('tipe_kendaraan, COUNT(*) as total')
                ->groupBy('tipe_kendaraan')
                ->pluck('total', 'tipe_kendaraan')
                ->all();

            // ── User — 1 query ──
            $totalUser = User::count();

            // ── Data kelurahan/kecamatan dari GeoJSON ──
            $kecamatanList = $this->getKecamatanList();
            $laporanByKecamatan = $this->computeLaporanByKecamatan();

            return compact(
                'totalLaporan', 'laporanHariIni', 'laporanMingguIni', 'byStatus',
                'recentLaporan', 'totalTps', 'totalJalur', 'jalurByTipe', 'totalUser',
                'kecamatanList', 'laporanByKecamatan',
            );
        });

        // Trend data — di-cache terpisah agar bisa di-invalidate sendiri
        $trendBulanan = $this->getTrendBulanan();

        return Inertia::render('admin/dashboard', array_merge($data, [
            'trendBulanan' => $trendBulanan,
        ]));
    }

    public function getTrendData(Request $request)
    {
        $period = $request->get('period', 'monthly');

        return response()->json(match ($period) {
            'daily' => $this->getTrendHarian(),
            'weekly' => $this->getTrendMingguan(),
            default => $this->getTrendBulanan(),
        });
    }

    // ── Private helpers ──

    private function getTrendHarian(): array
    {
        $start = Carbon::now()->startOfWeek(Carbon::MONDAY);

        $raw = Laporan::selectRaw('DATE(tanggal_laporan) as tgl, COUNT(*) as total')
            ->whereBetween('tanggal_laporan', [$start, $start->copy()->addDays(6)])
            ->groupBy('tgl')
            ->pluck('total', 'tgl');

        $labels = $values = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $start->copy()->addDays($i);
            $labels[] = $date->translatedFormat('D');
            $values[] = (int) ($raw[$date->format('Y-m-d')] ?? 0);
        }

        return compact('labels', 'values');
    }

    private function getTrendMingguan(): array
    {
        $start = Carbon::now()->subWeeks(8)->startOfWeek();
        $end = Carbon::now()->endOfWeek();

        $raw = Laporan::selectRaw('YEARWEEK(tanggal_laporan, 1) as minggu, COUNT(*) as total')
            ->where('tanggal_laporan', '>=', $start)
            ->groupBy('minggu')
            ->pluck('total', 'minggu');

        $labels = $values = [];
        for ($i = 8; $i >= 0; $i--) {
            $week = Carbon::now()->subWeeks($i);
            $key = $week->format('o').$week->format('W');
            $labels[] = 'Mgg '.$week->weekOfYear;
            $values[] = (int) ($raw[(int) $key] ?? 0);
        }

        return compact('labels', 'values');
    }

    private function getTrendBulanan(): array
    {
        $start = Carbon::now()->subMonths(5)->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $raw = Laporan::selectRaw("DATE_FORMAT(tanggal_laporan, '%Y-%m') as bulan, COUNT(*) as total")
            ->where('tanggal_laporan', '>=', $start)
            ->groupBy('bulan')
            ->pluck('total', 'bulan');

        $labels = $values = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $key = $month->format('Y-m');
            $labels[] = $month->translatedFormat('M Y');
            $values[] = (int) ($raw[$key] ?? 0);
        }

        return compact('labels', 'values');
    }

    // ── GeoJSON helpers ──

    private function getKecamatanList(): array
    {
        $features = $this->loadGeoJsonFeatures();
        if (empty($features)) {
            return [];
        }

        $kecamatans = [];
        foreach ($features as $feature) {
            $kecamatan = $feature['properties']['kecamatan'] ?? null;
            if ($kecamatan) {
                $kecamatans[$kecamatan] = true;
            }
        }

        $list = array_keys($kecamatans);
        sort($list);

        return $list;
    }

    private function computeLaporanByKecamatan(): array
    {
        $laporans = Laporan::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get(['id_laporan', 'latitude', 'longitude']);

        if ($laporans->isEmpty()) {
            return [];
        }

        $features = $this->loadGeoJsonFeatures();
        if (empty($features)) {
            return [];
        }

        // Build polygon lookup: kecamatan → kelurahan → [rings]
        $kelurahanPolygons = [];
        foreach ($features as $feature) {
            $props = $feature['properties'] ?? [];
            $kecamatan = $props['kecamatan'] ?? '';
            $kelurahan = $props['kelurahan'] ?? '';
            if (! $kecamatan || ! $kelurahan) {
                continue;
            }

            $rings = $this->extractRings($feature['geometry'] ?? []);
            if (! empty($rings)) {
                $kelurahanPolygons[$kecamatan][$kelurahan] = $rings;
            }
        }

        // Init counts
        $counts = [];
        foreach ($kelurahanPolygons as $kec => $kels) {
            $counts[$kec] = [];
            foreach ($kels as $kel => $_rings) {
                $counts[$kec][$kel] = 0;
            }
        }

        // Assign each laporan to a kelurahan
        foreach ($laporans as $laporan) {
            $point = [(float) $laporan->longitude, (float) $laporan->latitude];

            foreach ($kelurahanPolygons as $kec => $kels) {
                foreach ($kels as $kel => $rings) {
                    foreach ($rings as $ring) {
                        if ($this->pointInPolygon($point, $ring)) {
                            $counts[$kec][$kel]++;

                            continue 4;
                        }
                    }
                }
            }
        }

        return $counts;
    }

    private function loadGeoJsonFeatures(): array
    {
        $path = public_path('geojson/kelurahan_palu.geojson');
        if (! file_exists($path)) {
            return [];
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return [];
        }

        $geojson = json_decode($contents, true);
        if (! is_array($geojson)) {
            return [];
        }

        return $geojson['features'] ?? [];
    }

    private function extractRings(array $geometry): array
    {
        $type = $geometry['type'] ?? '';
        $coordinates = $geometry['coordinates'] ?? [];

        if ($type === 'Polygon') {
            return $this->polygonToRings($coordinates);
        }

        if ($type === 'MultiPolygon') {
            $rings = [];
            foreach ($coordinates as $polygon) {
                $rings = array_merge($rings, $this->polygonToRings($polygon));
            }

            return $rings;
        }

        return [];
    }

    private function polygonToRings(array $coords): array
    {
        $rings = [];
        foreach ($coords as $ring) {
            $flat = [];
            foreach ($ring as $c) {
                $flat[] = [(float) $c[0], (float) $c[1]];
            }
            $rings[] = $flat;
        }

        return $rings;
    }

    private function pointInPolygon(array $point, array $polygon): bool
    {
        $x = $point[0];
        $y = $point[1];
        $inside = false;
        $n = count($polygon);
        $j = $n - 1;

        for ($i = 0; $i < $n; $i++) {
            $xi = $polygon[$i][0];
            $yi = $polygon[$i][1];
            $xj = $polygon[$j][0];
            $yj = $polygon[$j][1];

            if (($yi > $y) !== ($yj > $y)
                && $x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi
            ) {
                $inside = ! $inside;
            }

            $j = $i;
        }

        return $inside;
    }
}
