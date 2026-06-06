<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TpsResmi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TpsResmiController extends Controller
{
    public function data()
    {
        return response()->json(
            TpsResmi::where('aktif', true)
                ->get()
                ->map(fn ($ts) => [
                    'id' => $ts->id_tps_resmi,
                    'nama' => $ts->nama,
                    'latitude' => $ts->latitude,
                    'longitude' => $ts->longitude,
                ])
        );
    }

    public function export(Request $request)
    {
        $query = TpsResmi::query()->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_tps_resmi', (int) $q))
                    ->orWhere('nama', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('aktif')) {
            $query->where('aktif', $request->aktif === '1');
        }

        $filename = 'tps-resmi-'.now()->format('Ymd-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        return response()->stream(function () use ($query) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($out, ['ID', 'Nama', 'Latitude', 'Longitude', 'Status', 'Ditambahkan']);

            $query->chunk(100, function ($tpsList) use ($out) {
                foreach ($tpsList as $ts) {
                    fputcsv($out, [
                        $ts->id_tps_resmi,
                        $ts->nama ?? '',
                        $ts->latitude,
                        $ts->longitude,
                        $ts->aktif ? 'Aktif' : 'Nonaktif',
                        $ts->created_at?->format('d M Y H:i') ?? '',
                    ]);
                }
            });
        }, 200, $headers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'nullable|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $ts = TpsResmi::create($validated);

        return response()->json([
            'message' => 'TPS berhasil ditambahkan.',
            'data' => ['id' => $ts->id_tps_resmi, 'nama' => $ts->nama, 'latitude' => $ts->latitude, 'longitude' => $ts->longitude],
        ], 201);
    }

    public function destroy($id)
    {
        TpsResmi::where('id_tps_resmi', $id)->firstOrFail()->delete();

        return response()->json(['message' => 'TPS berhasil dihapus.']);
    }

    public function index(Request $request)
    {
        $query = TpsResmi::query()->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_tps_resmi', (int) $q))
                    ->orWhere('nama', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('aktif')) {
            $query->where('aktif', $request->aktif === '1');
        }

        $stats = [
            'total' => TpsResmi::count(),
            'aktif' => TpsResmi::where('aktif', true)->count(),
            'nonaktif' => TpsResmi::where('aktif', false)->count(),
        ];

        $tps = $query->paginate(15)->withQueryString()->through(fn ($item) => [
            'id' => $item->id_tps_resmi,
            'nama' => $item->nama,
            'latitude' => $item->latitude,
            'longitude' => $item->longitude,
            'aktif' => $item->aktif,
            'created_at' => $item->created_at?->format('d M Y H:i'),
        ]);

        return Inertia::render('admin/tps-resmi-index', [
            'stats' => $stats,
            'tps' => $tps,
            'filters' => $request->only(['q', 'aktif']),
        ]);
    }

    public function show($id)
    {
        $ts = TpsResmi::where('id_tps_resmi', $id)->firstOrFail();

        return Inertia::render('admin/tps-resmi-show', [
            'tps' => $this->formatTpsDetail($ts),
        ]);
    }

    public function edit($id)
    {
        $ts = TpsResmi::where('id_tps_resmi', $id)->firstOrFail();

        return Inertia::render('admin/tps-resmi-edit', [
            'tps' => $this->formatTpsDetail($ts),
        ]);
    }

    public function updateDetails(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'nullable|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'aktif' => 'required|boolean',
        ]);

        $ts = TpsResmi::where('id_tps_resmi', $id)->firstOrFail();
        $ts->update($validated);

        return redirect()
            ->route('admin.tps-resmi.show', $id)
            ->with('success', 'TPS Resmi berhasil diperbarui.');
    }

    public function toggleAktif($id)
    {
        $ts = TpsResmi::where('id_tps_resmi', $id)->firstOrFail();
        $ts->update(['aktif' => ! $ts->aktif]);

        return response()->json(['message' => 'Status diperbarui.', 'aktif' => $ts->aktif]);
    }

    private function formatTpsDetail(TpsResmi $ts): array
    {
        return [
            'id' => $ts->id_tps_resmi,
            'nama' => $ts->nama,
            'latitude' => $ts->latitude,
            'longitude' => $ts->longitude,
            'aktif' => $ts->aktif,
            'created_at' => $ts->created_at?->format('d M Y H:i'),
            'updated_at' => $ts->updated_at?->format('d M Y H:i'),
        ];
    }
}
