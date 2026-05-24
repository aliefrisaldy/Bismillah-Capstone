<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use App\Models\TindakLanjut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index()
    {
        $laporan = Laporan::where('id_user', Auth::id())
            ->orderByDesc('tanggal_laporan')
            ->paginate(3)
            ->through(fn($item) => [
                'id_laporan' => $item->id_laporan,
                'deskripsi' => $item->deskripsi,
                'foto' => $item->foto,
                'alamat' => $item->alamat,
                'status' => $item->status,
                'tanggal_laporan' => $item->tanggal_laporan?->format('d M Y H:i'),
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
            'foto' => 'required|array|min:1',
            'foto.*' => 'image|max:5120',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'alamat' => 'nullable|string',
        ]);

        $fotoPaths = collect($request->file('foto'))
            ->filter()
            ->map(fn($f) => $f->store('laporan', 'public'))
            ->values()
            ->all();

        Laporan::create([
            'id_user' => Auth::id(),
            'deskripsi' => $request->deskripsi,
            'foto' => $fotoPaths,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'alamat' => $request->alamat,
            'status' => 'menunggu',
        ]);

        return redirect()->route('user.laporan.index')
            ->with('success', 'Laporan berhasil dikirim.');
    }

    public function show($id)
    {
        $laporan = Laporan::with([
            'user',
            'riwayatStatus.admin',
            'tindakLanjut.admin',
        ])
            ->where('id_laporan', $id)
            ->where('id_user', Auth::id())
            ->firstOrFail();

        $statusToTone = [
            'menunggu' => 'amber',
            'diverifikasi' => 'blue',
            'diproses' => 'orange',
            'selesai' => 'green',
            'ditolak' => 'red',
        ];

        $statusToTitle = [
            'menunggu' => 'Laporan Diterima',
            'diverifikasi' => 'Diverifikasi Admin',
            'diproses' => 'Dalam Penanganan',
            'selesai' => 'Selesai Ditangani',
            'ditolak' => 'Laporan Ditolak',
        ];


        // "Laporan Diterima" masuk PERTAMA (paling atas)
        $riwayat = [
            [
                'title' => 'Laporan Diterima',
                'desc' => 'Laporan berhasil masuk ke sistem.',
                'time' => $laporan->tanggal_laporan?->toISOString(),
                'tone' => 'muted',
            ]
        ];

        // Tambahkan riwayat perubahan status setelahnya (ascending)
        $perubahan = $laporan->riwayatStatus
            ->sortBy('tanggal')
            ->map(fn($r) => [
                'title' => $statusToTitle[$r->status_baru] ?? ucfirst($r->status_baru),
                'desc' => $r->catatan ?? null,
                'time' => $r->tanggal?->toISOString(),
                'tone' => $statusToTone[$r->status_baru] ?? 'muted',
            ])
            ->values()
            ->toArray();

        $riwayat = array_merge($riwayat, $perubahan);



        $buktiPembersihan = [];
        if ($laporan->status === 'selesai') {
            $latestBukti = $laporan->tindakLanjut
                ->filter(fn ($t) => count(TindakLanjut::normalizeFotoPaths($t->foto_penanganan)) > 0)
                ->sortByDesc(fn ($t) => $t->tanggal?->timestamp ?? 0)
                ->first();

            if ($latestBukti) {
                $buktiPembersihan = TindakLanjut::normalizeFotoPaths($latestBukti->foto_penanganan);
            }
        }

        return Inertia::render('user/laporan-show', [
            'laporan' => [
                'id_laporan' => $laporan->id_laporan,
                'deskripsi' => $laporan->deskripsi,
                'foto' => $laporan->foto,
                'bukti_pembersihan' => $buktiPembersihan,
                'alamat' => $laporan->alamat,
                'latitude' => $laporan->latitude,
                'longitude' => $laporan->longitude,
                'status' => $laporan->status,
                'tanggal_laporan' => $laporan->tanggal_laporan?->toISOString(),
                'tanggal_diperbarui' => $laporan->tanggal_diperbarui?->toISOString(),
                'pelapor' => [
                    'name' => $laporan->user?->nama,
                ],
            ],
            'riwayat' => $riwayat, // ← data real dari database
        ]);
    }
}