<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\WaSession;
use App\Models\User;
use App\Models\Laporan;
use App\Services\FonnteService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class WhatsappController extends Controller
{
    protected FonnteService $fonnte;

    public function __construct(FonnteService $fonnte)
    {
        $this->fonnte = $fonnte;
    }

    public function webhook(Request $request)
    {
        Log::info('RAW DATA:', [
            'all' => $request->all(),
            'type' => $request->input('type'),
            'url' => $request->input('url'),
            'message' => $request->input('message'),
        ]);

        $pengirim = $request->input('sender');
        $pesan = trim($request->input('message') ?? '');
        $type = $request->input('type');

        // Abaikan kalau tidak ada pengirim
        if (empty($pengirim)) {
            return response()->json(['status' => 'ignored']);
        }

        // Abaikan pesan dari grup
        if ($request->input('isgroup')) {
            return response()->json(['status' => 'ignored']);
        }

        // Kalau foto, set pesan jadi '__foto__'
        if ($type === 'image') {
            $pesan = '__foto__';
        }

        if (!empty($request->input('location'))) {
            $pesan = '__lokasi__';
        }

        $this->prosesPercakapan($pengirim, $pesan, $request);

        return response()->json(['status' => 'ok']);
    }

    private function prosesPercakapan(string $nomor, string $pesan, Request $request): void
    {
        $session = WaSession::firstOrCreate(
            ['no_wa' => $nomor],
            ['step' => 'idle', 'data' => []]
        );

        // Cek perintah batal di semua tahap
        if (strtolower($pesan) === 'batal') {
            $session->update(['step' => 'idle', 'data' => []]);
            $this->fonnte->kirimPesan(
                $nomor,
                "❌ Laporan dibatalkan.\n\n" .
                "Ketik *LAPOR* jika ingin membuat laporan baru."
            );
            return;
        }

        switch ($session->step) {

            case 'idle':
                if (strtolower($pesan) === 'lapor') {
                    $session->update(['step' => 'nama', 'data' => []]);
                    $this->fonnte->kirimPesan(
                        $nomor,
                        "Halo! Selamat datang di layanan pengaduan DLH 🌿\n\n" .
                        "Silakan ketik *nama lengkap* Anda:\n\n" .
                        "_Ketik *BATAL* untuk membatalkan laporan_"
                    );
                } else {
                    $this->fonnte->kirimPesan(
                        $nomor,
                        "Halo! Saya adalah bot pengaduan DLH 🌿\n\n" .
                        "Ketik *LAPOR* untuk membuat laporan baru."
                    );
                }
                break;

            case 'nama':
                $session->update([
                    'step' => 'deskripsi',
                    'data' => ['nama' => $pesan]
                ]);
                $this->fonnte->kirimPesan(
                    $nomor,
                    "Terima kasih *{$pesan}* 👋\n\n" .
                    "Silakan ceritakan masalah lingkungan yang ingin dilaporkan:\n\n" .
                    "_Ketik *BATAL* untuk membatalkan laporan_"
                );
                break;

            case 'deskripsi':
                $data = $session->data ?? [];
                $data['deskripsi'] = $pesan;
                $session->update([
                    'step' => 'foto',
                    'data' => $data
                ]);
                $this->fonnte->kirimPesan(
                    $nomor,
                    "Laporan dicatat ✅\n\n" .
                    "Sekarang kirim *foto* kondisi lingkungan tersebut 📷\n\n" .
                    "_Ketik *BATAL* untuk membatalkan laporan_"
                );
                break;

            case 'foto':
                $data = $session->data ?? [];
                $fotoUrl = $request->input('url');

                if ($pesan !== '__foto__' || empty($fotoUrl)) {
                    $this->fonnte->kirimPesan(
                        $nomor,
                        "Mohon kirim *foto* ya, bukan teks 🙏\n\n" .
                        "_Ketik *BATAL* untuk membatalkan laporan_"
                    );
                    return;
                }

                // Download foto dari Fonnte dan simpan ke storage lokal
                try {
                    $fotoContents = Http::get($fotoUrl)->body();
                    $extension = pathinfo(parse_url($fotoUrl, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                    $filename = 'laporan/' . uniqid('wa_') . '.' . $extension;

                    Storage::disk('public')->put($filename, $fotoContents);
                    $data['foto'] = $filename;
                } catch (\Exception $e) {
                    Log::error('Gagal download foto WA: ' . $e->getMessage());
                    $data['foto'] = $fotoUrl; // fallback ke URL kalau gagal
                }

                $session->update([
                    'step' => 'lokasi',
                    'data' => $data
                ]);
                $this->fonnte->kirimPesan(
                    $nomor,
                    "Foto diterima 📷\n\n" .
                    "Terakhir, kirim *lokasi* menggunakan fitur Share Location di WA 📍\n\n" .
                    "_Ketik *BATAL* untuk membatalkan laporan_"
                );
                break;

            case 'lokasi':
                $data = $session->data ?? [];
                $lokasi = $request->input('location');

                if ($pesan !== '__lokasi__' || empty($lokasi)) {
                    $this->fonnte->kirimPesan(
                        $nomor,
                        "Mohon kirim *lokasi* menggunakan fitur Share Location di WA 📍\n\n" .
                        "_Ketik *BATAL* untuk membatalkan laporan_"
                    );
                    return;
                }

                $koordinat = explode(',', $lokasi);
                $lat = trim($koordinat[0] ?? '');
                $lng = trim($koordinat[1] ?? '');
                $data['latitude'] = $lat;
                $data['longitude'] = $lng;
                $data['alamat'] = $this->koordinatKeAlamat((float) $lat, (float) $lng);

                $this->simpanLaporan($nomor, $data, $request->input('name'));
                $session->update(['step' => 'idle', 'data' => []]);
                break;
        }
    }

    private function simpanLaporan(string $nomor, array $data, string $namaPengirim): void
    {
        // Cek apakah user sudah ada
        $user = User::where('no_telpon', $nomor)->first();

        // Kalau belum ada, buat akun otomatis
        if (!$user) {
            $user = User::create([
                'nama' => $data['nama'] ?? $namaPengirim,
                'email' => $nomor . '@wa.dlh.local',
                'password' => Hash::make(Str::random(32)),
                'no_telpon' => $nomor,
                'sumber_daftar' => 'whatsapp',
            ]);
        }

        // Simpan laporan
        $laporan = Laporan::create([
            'id_user' => $user->id_user,
            'deskripsi' => $data['deskripsi'] ?? '',
            'foto' => [$data['foto']],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'alamat' => $data['alamat'],
            'status' => 'menunggu',
            'tanggal_laporan' => now(),
        ]);

        // Kirim konfirmasi ke warga
        $this->fonnte->kirimPesan(
            $nomor,
            "✅ *Laporan berhasil dikirim!*\n\n" .
            "📋 No. Laporan: *#{$laporan->id_laporan}*\n" .
            "📝 Deskripsi: {$data['deskripsi']}\n" .
            "📍 Lokasi: {$data['alamat']}\n\n" .
            "Kami akan segera menindaklanjuti laporan Anda.\n" .
            "Anda akan mendapat notifikasi saat status laporan berubah 🌿\n\n" .
            "Ketik *LAPOR* jika ingin membuat laporan baru."
        );
    }
    private function koordinatKeAlamat(float $lat, float $lng): string
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'DLH-Capstone/1.0'
            ])->get('https://nominatim.openstreetmap.org/reverse', [
                        'lat' => $lat,
                        'lon' => $lng,
                        'format' => 'json',
                        'accept-language' => 'id',
                    ]);

            $data = $response->json();

            if (!empty($data['display_name'])) {
                return $data['display_name'];
            }
        } catch (\Exception $e) {
            Log::error('Geocoding error: ' . $e->getMessage());
        }

        return 'Lokasi via WhatsApp';
    }
}