<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JalurAngkut;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JalurAngkutController extends Controller
{
    // ── Export CSV ────────────────────────────────────────────
    public function export(Request $request)
    {
        $query = JalurAngkut::query()->orderBy('nama');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_jalur_angkut', (int) $q))
                    ->orWhere('nama', 'like', '%'.$q.'%')
                    ->orWhere('kelurahan', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('tipe')) {
            $query->where('tipe_kendaraan', $request->tipe);
        }

        if ($request->filled('kelurahan')) {
            $query->where('kelurahan', $request->kelurahan);
        }

        if ($request->filled('aktif')) {
            $query->where('aktif', $request->aktif === '1');
        }

        $filename = 'jalur-angkut-'.now()->format('Ymd-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        return response()->stream(function () use ($query) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($out, ['ID', 'Nama', 'Kelurahan', 'Tipe Kendaraan', 'Warna', 'Titik Koordinat', 'Jadwal', 'Status', 'Diperbarui']);

            $query->chunk(100, function ($jalurList) use ($out) {
                foreach ($jalurList as $j) {
                    $titikCount = count($j->getNormalizedCoordinates());
                    $jadwal = $j->jadwal
                        ? collect($j->jadwal)->pluck('hari')->join(', ')
                        : '';

                    fputcsv($out, [
                        $j->id_jalur_angkut,
                        $j->nama,
                        $j->kelurahan ?? '',
                        $j->tipe_kendaraan,
                        $j->warna,
                        $titikCount,
                        $jadwal,
                        $j->aktif ? 'Aktif' : 'Nonaktif',
                        $j->updated_at?->format('d M Y H:i') ?? '',
                    ]);
                }
            });
        }, 200, $headers);
    }

    // ── Daftar jalur (tabel) ──────────────────────────────────
    public function listIndex(Request $request)
    {
        $query = JalurAngkut::query()->orderBy('nama');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_jalur_angkut', (int) $q))
                    ->orWhere('nama', 'like', '%'.$q.'%')
                    ->orWhere('kelurahan', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('tipe')) {
            $query->where('tipe_kendaraan', $request->tipe);
        }

        if ($request->filled('kelurahan')) {
            $query->where('kelurahan', $request->kelurahan);
        }

        if ($request->filled('aktif')) {
            $query->where('aktif', $request->aktif === '1');
        }

        $partialComponent = (string) $request->header('X-Inertia-Partial-Component', '');
        $partialData = (string) $request->header('X-Inertia-Partial-Data', '');
        $isPartialForThisPage = $partialComponent === 'admin/jalur-index' && $partialData !== '';
        $wantsStats = ! $isPartialForThisPage || str_contains($partialData, 'stats');

        $stats = $wantsStats ? [
            'total' => JalurAngkut::count(),
            'aktif' => JalurAngkut::where('aktif', true)->count(),
            'nonaktif' => JalurAngkut::where('aktif', false)->count(),
            'pick_up' => JalurAngkut::where('tipe_kendaraan', 'Pick Up')->count(),
            'kaisar' => JalurAngkut::where('tipe_kendaraan', 'Kaisar')->count(),
            'r6' => JalurAngkut::where('tipe_kendaraan', 'R6')->count(),
        ] : null;

        $jalur = $query->paginate(15)->withQueryString()->through(function ($item) {
            $coords = $item->getNormalizedCoordinates();
            $titikCount = count($coords);

            return [
                'id_jalur_angkut' => $item->id_jalur_angkut,
                'nama' => $item->nama,
                'kelurahan' => $item->kelurahan,
                'tipe_kendaraan' => $item->tipe_kendaraan,
                'warna' => $item->warna,
                'aktif' => $item->aktif,
                'jadwal' => $item->jadwal,
                'titik_count' => $titikCount,
                'updated_at' => $item->updated_at?->format('d M Y H:i'),
            ];
        });

        return Inertia::render('admin/jalur-index', [
            'stats' => $stats,
            'jalur' => $jalur,
            'filters' => $request->only(['q', 'tipe', 'kelurahan', 'aktif']),
            'kelurahans' => JalurAngkut::whereNotNull('kelurahan')
                ->distinct()
                ->orderBy('kelurahan')
                ->pluck('kelurahan')
                ->values(),
        ]);
    }

    public function show($id)
    {
        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();

        return Inertia::render('admin/jalur-show', [
            'jalur' => $this->formatJalurDetail($jalur),
        ]);
    }

    public function edit($id)
    {
        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();

        return Inertia::render('admin/jalur-edit', [
            'jalur' => $this->formatJalurDetail($jalur),
        ]);
    }

    public function updateDetails(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'aktif' => 'required|boolean',
            'jadwal' => 'nullable|array',
            'jadwal.*.hari' => 'required|string|in:senin,selasa,rabu,kamis,jumat,sabtu,minggu',
            'jadwal.*.jam_mulai' => ['required', 'regex:/^\d{2}:\d{2}$/'],
            'jadwal.*.jam_selesai' => ['required', 'regex:/^\d{2}:\d{2}$/'],
        ]);

        $jadwal = collect($validated['jadwal'] ?? []);
        $hariList = $jadwal->pluck('hari');
        if ($hariList->count() !== $hariList->unique()->count()) {
            return back()->withErrors(['jadwal' => 'Setiap hari hanya boleh diisi satu kali.']);
        }

        foreach ($jadwal as $index => $item) {
            if ($item['jam_selesai'] <= $item['jam_mulai']) {
                return back()->withErrors([
                    "jadwal.{$index}.jam_selesai" => 'Jam selesai harus setelah jam mulai.',
                ]);
            }
        }

        $order = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        $sorted = $jadwal
            ->sortBy(fn ($item) => array_search($item['hari'], $order, true))
            ->values()
            ->all();

        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();
        $jalur->update([
            'nama' => $validated['nama'],
            'aktif' => $validated['aktif'],
            'jadwal' => $sorted ?: null,
        ]);

        return redirect()
            ->route('admin.jalur.show', $id)
            ->with('success', 'Jalur angkut berhasil diperbarui.');
    }

    // ── Halaman utama peta jalur ──────────────────────────────
    public function index()
    {
        return Inertia::render('admin/jalur-angkut');
    }

    // ── Ambil semua jalur (untuk ditampilkan di peta) ─────────
    public function data(Request $request)
    {
        // Wajib ada minimal satu filter
        if (! $request->filled('tipe') && ! $request->filled('kelurahan')) {
            return response()->json([]);
        }

        $query = JalurAngkut::query()->where('aktif', true);

        if ($request->filled('tipe')) {
            $query->where('tipe_kendaraan', $request->tipe);
        }
        if ($request->filled('kelurahan')) {
            $query->where('kelurahan', $request->kelurahan);
        }

        $jalur = $query->get()->map(fn ($item) => $item->toGeoJson());

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

    // ── Hapus jalur ───────────────────────────────────────────
    public function destroy($id)
    {
        JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail()->delete();

        return response()->json(['message' => 'Jalur berhasil dihapus.']);
    }

    // ── Toggle aktif/nonaktif jalur ───────────────────────────
    public function toggleAktif($id)
    {
        $jalur = JalurAngkut::where('id_jalur_angkut', $id)->firstOrFail();
        $jalur->update(['aktif' => ! $jalur->aktif]);

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

    private function formatJalurDetail(JalurAngkut $jalur): array
    {
        $coordinates = $jalur->getNormalizedCoordinates();

        return [
            'id_jalur_angkut' => $jalur->id_jalur_angkut,
            'nama' => $jalur->nama,
            'kelurahan' => $jalur->kelurahan,
            'tipe_kendaraan' => $jalur->tipe_kendaraan,
            'warna' => $jalur->warna,
            'aktif' => $jalur->aktif,
            'jadwal' => $jalur->jadwal ?? [],
            'coordinates' => $coordinates,
            'titik_count' => count($coordinates),
            'created_at' => $jalur->created_at?->format('d M Y H:i'),
            'updated_at' => $jalur->updated_at?->format('d M Y H:i'),
        ];
    }
}
