<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laporan;
use App\Models\TindakLanjut;
use App\Models\RiwayatStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $query = Laporan::with('user')->orderByDesc('tanggal_laporan');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('dari') && $request->filled('sampai')) {
            $query->whereBetween('tanggal_laporan', [
                $request->dari . ' 00:00:00',
                $request->sampai . ' 23:59:59',
            ]);
        }

        $laporan = $query->paginate(10)->through(fn($item) => [
            'id_laporan'      => $item->id_laporan,
            'deskripsi'       => $item->deskripsi,
            'alamat'          => $item->alamat,
            'status'          => $item->status,
            'tanggal_laporan' => $item->tanggal_laporan?->format('d M Y H:i'),
            'pelapor'         => $item->user?->nama,
        ]);

        return Inertia::render('admin/laporan-index', [
            'laporan' => $laporan,
            'filters' => $request->only(['status', 'dari', 'sampai']),
        ]);
    }

    public function show($id)
    {
        $laporan = Laporan::with([
            'user',
            'tindakLanjut.admin',
            'riwayatStatus.admin',
        ])->findOrFail($id);

        return Inertia::render('admin/laporan-show', [
            'laporan' => [
                'id_laporan'      => $laporan->id_laporan,
                'deskripsi'       => $laporan->deskripsi,
                'foto'            => $laporan->foto,
                'alamat'          => $laporan->alamat,
                'latitude'        => $laporan->latitude,
                'longitude'       => $laporan->longitude,
                'status'          => $laporan->status,
                'tanggal_laporan' => $laporan->tanggal_laporan?->format('d M Y H:i'),
                'pelapor'         => [
                    'nama'      => $laporan->user?->nama,
                    'email'     => $laporan->user?->email,
                    'no_telpon' => $laporan->user?->no_telpon,
                ],
                'tindak_lanjut'  => $laporan->tindakLanjut->map(fn($t) => [
                    'catatan'         => $t->catatan,
                    'foto_penanganan' => $t->foto_penanganan,
                    'tanggal'         => $t->tanggal?->format('d M Y H:i'),
                    'admin'           => $t->admin?->nama,
                ]),
                'riwayat_status' => $laporan->riwayatStatus->map(fn($r) => [
                    'status_lama' => $r->status_lama,
                    'status_baru' => $r->status_baru,
                    'catatan'     => $r->catatan,
                    'tanggal'     => $r->tanggal?->format('d M Y H:i'),
                    'admin'       => $r->admin?->nama,
                ]),
            ],
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status'  => 'required|in:menunggu,diverifikasi,diproses,selesai,ditolak',
            'catatan' => 'nullable|string',
        ]);

        $laporan    = Laporan::findOrFail($id);
        $statusLama = $laporan->status;

        $laporan->update(['status' => $request->status]);

        RiwayatStatus::create([
            'id_laporan'  => $laporan->id_laporan,
            'id_admin'    => Auth::guard('admin')->id(),
            'status_lama' => $statusLama,
            'status_baru' => $request->status,
            'catatan'     => $request->catatan,
        ]);

        return back()->with('success', 'Status laporan berhasil diperbarui.');
    }

    public function storeTindakLanjut(Request $request, $id)
    {
        $request->validate([
            'catatan'         => 'required|string',
            'foto_penanganan' => 'nullable|image|max:5120',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto_penanganan')) {
            $fotoPath = $request->file('foto_penanganan')
                                ->store('tindak_lanjut', 'public');
        }

        TindakLanjut::create([
            'id_laporan'      => $id,
            'id_admin'        => Auth::guard('admin')->id(),
            'catatan'         => $request->catatan,
            'foto_penanganan' => $fotoPath,
        ]);

        return back()->with('success', 'Tindak lanjut berhasil ditambahkan.');
    }
}