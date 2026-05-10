<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index()
    {
        $laporan = Laporan::where('id_user', Auth::id())
                          ->orderByDesc('tanggal_laporan')
                          ->get()
                          ->map(fn($item) => [
                              'id_laporan'         => $item->id_laporan,
                              'deskripsi'          => $item->deskripsi,
                              'foto'               => $item->foto,
                              'alamat'             => $item->alamat,
                              'status'             => $item->status,
                              'tanggal_laporan'    => $item->tanggal_laporan?->format('d M Y H:i'),
                              'tanggal_diperbarui' => $item->tanggal_diperbarui?->format('d M Y H:i'),
                          ]);

        return Inertia::render('user/laporan-index', [
            'laporan' => $laporan,
        ]);
    }

    public function create()
    {
        return Inertia::render('user/laporan-create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'deskripsi' => 'required|string',
            'foto'      => 'required|array|min:1',
            'foto.*'    => 'image|max:5120',
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
            'alamat'    => 'nullable|string',
        ]);

        $fotoPaths = collect($request->file('foto'))
            ->filter()
            ->map(fn($f) => $f->store('laporan', 'public'))
            ->values()
            ->all();

        Laporan::create([
            'id_user'   => Auth::id(),
            'deskripsi' => $request->deskripsi,
            'foto'      => $fotoPaths,
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
            'alamat'    => $request->alamat,
            'status'    => 'menunggu',
        ]);

        return redirect()->route('user.laporan.index')
                         ->with('success', 'Laporan berhasil dikirim.');
    }

    public function show($id)
    {
        $laporan = Laporan::with([
                        'riwayatStatus.admin',
                        'tindakLanjut.admin',
                    ])
                    ->where('id_laporan', $id)
                    ->where('id_user', Auth::id())
                    ->firstOrFail();

        return Inertia::render('user/laporan-show', [
            'laporan' => [
                'id_laporan'      => $laporan->id_laporan,
                'deskripsi'       => $laporan->deskripsi,
                'foto'            => $laporan->foto,
                'alamat'          => $laporan->alamat,
                'latitude'        => $laporan->latitude,
                'longitude'       => $laporan->longitude,
                'status'          => $laporan->status,
                'tanggal_laporan' => $laporan->tanggal_laporan?->format('d M Y H:i'),
                'tindak_lanjut'   => $laporan->tindakLanjut->map(fn($t) => [
                    'catatan'         => $t->catatan,
                    'foto_penanganan' => $t->foto_penanganan,
                    'tanggal'         => $t->tanggal?->format('d M Y H:i'),
                    'admin'           => $t->admin?->nama,
                ]),
                'riwayat_status'  => $laporan->riwayatStatus->map(fn($r) => [
                    'status_lama' => $r->status_lama,
                    'status_baru' => $r->status_baru,
                    'catatan'     => $r->catatan,
                    'tanggal'     => $r->tanggal?->format('d M Y H:i'),
                    'admin'       => $r->admin?->nama,
                ]),
            ],
        ]);
    }
}