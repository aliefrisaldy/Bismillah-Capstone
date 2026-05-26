<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use App\Models\TindakLanjut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LaporanController extends Controller
{
    private function getPelaporId(Request $request): string
    {
        $id = $request->cookie('pelapor_id');

        if (! $id) {
            $id = (string) Str::uuid();
        }

        return $id;
    }

    public function index(Request $request)
    {
        $pelaporId = $this->getPelaporId($request);

        Cookie::queue('pelapor_id', $pelaporId, 60 * 24 * 365);

        $laporan = Laporan::where('id_pelapor', $pelaporId)
            ->orderByDesc('tanggal_laporan')
            ->paginate(3)
            ->through(fn ($item) => [
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
            'nama' => 'required|string|max:100',
            'no_telpon' => 'required|string|max:15',
            'deskripsi' => 'required|string',
            'foto' => 'required|array|min:1',
            'foto.*' => 'image|max:5120',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'alamat' => 'nullable|string',
        ]);

        $pelaporId = $this->getPelaporId($request);

        $fotoPaths = collect($request->file('foto'))
            ->filter()
            ->map(fn ($f) => $f->store('laporan', 'public'))
            ->values()
            ->all();

        Laporan::create([
            'id_pelapor' => $pelaporId,
            'nama_pelapor' => $request->nama,
            'no_telpon_pelapor' => $request->no_telpon,
            'deskripsi' => $request->deskripsi,
            'foto' => $fotoPaths,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'alamat' => $request->alamat,
            'status' => 'menunggu',
        ]);

        return redirect()->route('user.laporan.index')
            ->withCookie(cookie()->make('pelapor_id', $pelaporId, 60 * 24 * 365))
            ->with('success', 'Laporan berhasil dikirim.');
    }

    public function show(Request $request, $id)
    {
        $pelaporId = $this->getPelaporId($request);

        Cookie::queue('pelapor_id', $pelaporId, 60 * 24 * 365);

        $laporan = Laporan::with([
            'riwayatStatus.admin',
            'tindakLanjut.admin',
        ])
            ->where('id_laporan', $id)
            ->where('id_pelapor', $pelaporId)
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

        $riwayat = [
            [
                'title' => 'Laporan Diterima',
                'desc' => 'Laporan berhasil masuk ke sistem.',
                'time' => $laporan->tanggal_laporan?->toISOString(),
                'tone' => 'muted',
            ],
        ];

        $perubahan = $laporan->riwayatStatus
            ->sortBy('tanggal')
            ->map(fn ($r) => [
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
                'nama_pelapor' => $laporan->nama_pelapor,
                'no_telpon_pelapor' => $laporan->no_telpon_pelapor,
            ],
            'riwayat' => $riwayat,
        ]);
    }
}
