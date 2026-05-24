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
                ->map(fn($ts) => [
                    'id'        => $ts->id_tps_resmi,
                    'latitude'  => $ts->latitude,
                    'longitude' => $ts->longitude,
                ])
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $ts = TpsResmi::create($validated);

        return response()->json([
            'message' => 'TPS berhasil ditambahkan.',
            'data'    => ['id' => $ts->id_tps_resmi, 'latitude' => $ts->latitude, 'longitude' => $ts->longitude],
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

        if ($request->filled('aktif')) {
            $query->where('aktif', $request->aktif === '1');
        }

        $stats = [
            'total'   => TpsResmi::count(),
            'aktif'   => TpsResmi::where('aktif', true)->count(),
            'nonaktif'=> TpsResmi::where('aktif', false)->count(),
        ];

        $tps = $query->paginate(15)->withQueryString()->through(fn($item) => [
            'id'        => $item->id_tps_resmi,
            'latitude'  => $item->latitude,
            'longitude' => $item->longitude,
            'aktif'     => $item->aktif,
            'created_at'=> $item->created_at?->format('d M Y H:i'),
        ]);

        return Inertia::render('admin/tps-resmi-index', [
            'stats'   => $stats,
            'tps'     => $tps,
            'filters' => $request->only(['aktif']),
        ]);
    }

    public function toggleAktif($id)
    {
        $ts = TpsResmi::where('id_tps_resmi', $id)->firstOrFail();
        $ts->update(['aktif' => !$ts->aktif]);

        return response()->json(['message' => 'Status diperbarui.', 'aktif' => $ts->aktif]);
    }
};