<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\KirimNotifikasiWa;
use App\Models\Laporan;
use App\Models\RiwayatStatus;
use App\Models\TindakLanjut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $query = Laporan::orderByDesc('tanggal_laporan');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_laporan', (int) $q))
                    ->orWhere('alamat', 'like', '%'.$q.'%')
                    ->orWhere('deskripsi', 'like', '%'.$q.'%')
                    ->orWhere('nama_pelapor', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('dari') && $request->filled('sampai')) {
            $query->whereBetween('tanggal_laporan', [
                $request->dari.' 00:00:00',
                $request->sampai.' 23:59:59',
            ]);
        }

        // Optimasi: saat partial reload (only=laporan,filters), jangan hitung stats lagi.
        // Inertia mengirim header X-Inertia-Partial-* ketika request partial props.
        $partialComponent = (string) $request->header('X-Inertia-Partial-Component', '');
        $partialData = (string) $request->header('X-Inertia-Partial-Data', '');
        $isPartialForThisPage = $partialComponent === 'admin/laporan-index' && $partialData !== '';
        $wantsStats = ! $isPartialForThisPage || str_contains($partialData, 'stats');

        $stats = $wantsStats ? [
            'total' => Laporan::count(),
            'menunggu' => Laporan::where('status', 'menunggu')->count(),
            'diverifikasi' => Laporan::where('status', 'diverifikasi')->count(),
            'diproses' => Laporan::where('status', 'diproses')->count(),
            'selesai' => Laporan::where('status', 'selesai')->count(),
            'ditolak' => Laporan::where('status', 'ditolak')->count(),
        ] : null;

        $laporan = $query->paginate(6)->through(fn ($item) => [
            'id_laporan' => $item->id_laporan,
            'foto' => $item->foto,
            'deskripsi' => $item->deskripsi,
            'alamat' => $item->alamat,
            'status' => $item->status,
            'tanggal_laporan' => $item->tanggal_laporan?->format('d M Y H:i'),
            'pelapor' => $item->nama_pelapor ?? 'Anonim',
        ]);

        return Inertia::render('admin/laporan-index', [
            'stats' => $stats,
            'laporan' => $laporan,
            'filters' => $request->only(['status', 'dari', 'sampai', 'q']),
        ]);
    }

    public function export(Request $request)
    {
        $query = Laporan::orderByDesc('tanggal_laporan');

        if ($request->filled('q')) {
            $q = trim((string) $request->q);
            $query->where(function ($sub) use ($q) {
                $sub->when(is_numeric($q), fn ($s) => $s->orWhere('id_laporan', (int) $q))
                    ->orWhere('alamat', 'like', '%'.$q.'%')
                    ->orWhere('deskripsi', 'like', '%'.$q.'%')
                    ->orWhere('nama_pelapor', 'like', '%'.$q.'%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('dari') && $request->filled('sampai')) {
            $query->whereBetween('tanggal_laporan', [
                $request->dari.' 00:00:00',
                $request->sampai.' 23:59:59',
            ]);
        }

        $filename = 'laporan-'.now()->format('Ymd-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        return response()->stream(function () use ($query) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($out, [
                'ID Laporan',
                'Tanggal',
                'Status',
                'Pelapor',
                'Alamat',
                'Deskripsi',
                'Foto',
            ]);

            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $item) {
                    $foto = $item->foto;
                    $fotoText = '-';
                    if (is_array($foto)) {
                        $fotoText = implode('|', array_values($foto));
                    } elseif (is_string($foto) && $foto !== '') {
                        $fotoText = $foto;
                    }

                    fputcsv($out, [
                        $item->id_laporan,
                        optional($item->tanggal_laporan)->format('Y-m-d H:i:s'),
                        Str::upper((string) $item->status),
                        $item->nama_pelapor ?? '-',
                        $item->alamat ?? '-',
                        preg_replace('/\s+/', ' ', (string) $item->deskripsi),
                        $fotoText,
                    ]);
                }
            });

            fclose($out);
        }, 200, $headers);
    }

    public function show($id)
    {
        $laporan = Laporan::with([
            'tindakLanjut.admin',
            'riwayatStatus.admin',
        ])->findOrFail($id);

        return Inertia::render('admin/laporan-show', [
            'laporan' => [
                'id_laporan' => $laporan->id_laporan,
                'deskripsi' => $laporan->deskripsi,
                'foto' => $laporan->foto,
                'alamat' => $laporan->alamat,
                'latitude' => $laporan->latitude,
                'longitude' => $laporan->longitude,
                'status' => $laporan->status,
                'tanggal_laporan' => $laporan->tanggal_laporan?->toISOString(),
                'pelapor' => [
                    'nama' => $laporan->nama_pelapor,
                    'no_telpon' => $laporan->no_telpon_pelapor,
                ],
                'tindak_lanjut' => $laporan->tindakLanjut->map(fn ($t) => [
                    'catatan' => $t->catatan,
                    'foto_penanganan' => TindakLanjut::normalizeFotoPaths($t->foto_penanganan),
                    'tanggal' => $t->tanggal?->format('d M Y H:i'),
                    'admin' => $t->admin?->nama,
                ]),
                'riwayat_status' => $laporan->riwayatStatus->map(fn ($r) => [
                    'status_lama' => $r->status_lama,
                    'status_baru' => $r->status_baru,
                    'catatan' => $r->catatan,
                    'tanggal' => $r->tanggal?->format('d M Y H:i'),
                    'admin' => $r->admin?->nama,
                ]),
            ],
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $laporan = Laporan::findOrFail($id);
        $statusLama = $laporan->status;

        if (in_array($statusLama, ['selesai', 'ditolak'], true)) {
            return back()->withErrors([
                'status' => 'Laporan berstatus final tidak dapat diubah lagi.',
            ]);
        }

        $request->validate([
            'status' => 'required|in:menunggu,diverifikasi,diproses,selesai,ditolak',
            'catatan' => 'nullable|string',
            'foto_penanganan' => 'nullable|array',
            'foto_penanganan.*' => 'image|max:5120',
        ]);

        $statusBaru = (string) $request->status;

        if (! $this->isAllowedStatusTransition($statusLama, $statusBaru)) {
            return back()->withErrors([
                'status' => 'Perubahan status harus mengikuti alur: Menunggu → Diverifikasi → Diproses → Selesai. Penolakan dapat dilakukan kapan saja sebelum selesai.',
            ]);
        }

        $fotoFiles = array_filter($request->file('foto_penanganan') ?? []);

        if ($statusBaru === 'selesai' && count($fotoFiles) === 0) {
            return back()->withErrors([
                'foto_penanganan' => 'Unggah minimal satu foto bukti pembersihan untuk menyelesaikan laporan.',
            ]);
        }

        // 1. Update status
        $laporan->update(['status' => $statusBaru]);

        Cache::forget('dashboard.stats.v2');

        // 2. Catat riwayat
        RiwayatStatus::create([
            'id_laporan' => $laporan->id_laporan,
            'id_admin' => Auth::guard('admin')->id(),
            'status_lama' => $statusLama,
            'status_baru' => $statusBaru,
            'catatan' => $request->catatan,
        ]);

        // 3. Simpan foto & tindak lanjut kalau selesai
        $fotoPaths = [];
        if ($statusBaru === 'selesai') {
            $fotoPaths = collect($fotoFiles)
                ->map(fn ($file) => $file->store('tindak_lanjut', 'public'))
                ->values()
                ->all();

            TindakLanjut::create([
                'id_laporan' => $laporan->id_laporan,
                'id_admin' => Auth::guard('admin')->id(),
                'catatan' => $request->catatan,
                'foto_penanganan' => $fotoPaths,
            ]);
        }

        // 4. Kirim notifikasi WA via queue (background)
        $noWa = $laporan->no_telpon_pelapor;
        if ($noWa) {
            $pesanStatus = [
                'diverifikasi' => '✅ *Laporan Anda telah diverifikasi!*',
                'diproses' => '🧹 *Laporan Anda sedang diproses!*',
                'selesai' => '🎉 *Laporan Anda telah selesai ditangani!*',
                'ditolak' => '❌ *Laporan Anda ditolak.*',
            ];

            $pesan = $pesanStatus[$statusBaru] ?? '📋 Status laporan Anda diperbarui.';
            $catatan = $request->catatan ? "\n\n📝 Catatan: {$request->catatan}" : '';

            $teksNotif = $pesan.
                "\n\n📋 No. Laporan: *#{$laporan->id_laporan}*".
                "\n📍 Lokasi: {$laporan->alamat}".
                $catatan.
                "\n\nTerima kasih telah melapor kepada DLH ♻️";

            KirimNotifikasiWa::dispatch($noWa, $teksNotif, $fotoPaths);
        }

        return back()->with('success', 'Status laporan berhasil diperbarui.');
    }

    /**
     * Alur maju: menunggu → diverifikasi → diproses → selesai.
     * Status "ditolak" selalu diperbolehkan dari status non-final (sebelum selesai).
     */
    private function isAllowedStatusTransition(string $lama, string $baru): bool
    {
        if ($lama === $baru) {
            return false;
        }

        if ($baru === 'ditolak') {
            return $lama !== 'selesai';
        }

        return match ($lama) {
            'menunggu' => $baru === 'diverifikasi',
            'diverifikasi' => $baru === 'diproses',
            'diproses' => $baru === 'selesai',
            default => false,
        };
    }

    public function storeTindakLanjut(Request $request, $id)
    {
        $request->validate([
            'catatan' => 'required|string',
            'foto_penanganan' => 'nullable|array',
            'foto_penanganan.*' => 'image|max:5120',
        ]);

        $fotoPaths = collect(array_filter($request->file('foto_penanganan') ?? []))
            ->map(fn ($file) => $file->store('tindak_lanjut', 'public'))
            ->values()
            ->all();

        TindakLanjut::create([
            'id_laporan' => $id,
            'id_admin' => Auth::guard('admin')->id(),
            'catatan' => $request->catatan,
            'foto_penanganan' => count($fotoPaths) > 0 ? $fotoPaths : null,
        ]);

        return back()->with('success', 'Tindak lanjut berhasil ditambahkan.');
    }
}
