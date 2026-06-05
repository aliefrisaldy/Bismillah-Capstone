<?php

namespace App\Console\Commands;

use App\Models\JalurAngkut;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;



class ImportJadwalJalur extends Command
{
    protected $signature = 'jalur:import-jadwal
        {file? : Path ke file xlsx (default: public/Jadwal/*.xlsx)}
        {--dry-run : Hanya tampilkan yang akan diupdate tanpa menulis ke DB}';

    protected $description = 'Import jadwal dari file xlsx ke tabel jalur_angkut';

    private const JAM_MULAI = '16:00';
    private const JAM_SELESAI = '22:00';
    private const HARI_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

    private int $updated = 0;
    private int $notFound = 0;
    private array $missed = [];

    public function handle(): int
    {
        $filePath = $this->argument('file') ?: $this->findXlsxFile();

        if (!$filePath || !file_exists($filePath)) {
            $this->error("File xlsx tidak ditemukan.");

            return self::FAILURE;
        }

        $this->info("Membaca file: " . basename($filePath));

        $spreadsheet = IOFactory::load($filePath);
        $worksheetNames = $spreadsheet->getSheetNames();

        $this->line("Ditemukan " . count($worksheetNames) . " sheet: " . implode(', ', $worksheetNames));

        foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
            $sheetTitle = $worksheet->getTitle();
            $this->newLine();
            $this->info("--- Sheet: $sheetTitle ---");

            $isR6 = str_contains(strtolower($sheetTitle), 'r6');
            $rows = $this->parseSheet($worksheet, $isR6);

            $this->line("Total baris data: " . count($rows));

            $bar = $this->output->createProgressBar(count($rows));
            $bar->start();

            foreach ($rows as $row) {
                $this->processRow($row);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
        }

        $this->printReport();

        return self::SUCCESS;
    }

    private function findXlsxFile(): ?string
    {
        $pattern = base_path('public/Jadwal/*.xlsx');
        $files = glob($pattern);

        if (empty($files)) {
            return null;
        }

        return $files[0];
    }

    private function parseSheet(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $worksheet, bool $isR6): array
    {
        $rows = [];
        $dataRows = $worksheet->toArray(null, true, true, false);

        if (empty($dataRows)) {
            return $rows;
        }

        // Find header row
        $headerRowIdx = null;
        foreach ($dataRows as $idx => $row) {
            $rowStr = implode('', array_filter($row, fn ($v) => $v !== null && $v !== ''));
            if (str_contains(strtolower($rowStr), 'rute') || str_contains(strtolower($rowStr), 'kelurahan')) {
                $headerRowIdx = $idx;
                break;
            }
        }

        if ($headerRowIdx === null) {
            $this->warn("  Header tidak ditemukan di sheet ini, skip.");

            return $rows;
        }

        $currentKelurahan = '';

        for ($i = $headerRowIdx + 1; $i < count($dataRows); $i++) {
            $row = $dataRows[$i];

            if ($isR6) {
                // Columns: NO, Nama Sopir, Nomor Armada, KECAMATAN, Rute, Keterangan, Ruas Jalan Kota Palu
                $kecamatan = trim((string) ($row[3] ?? ''));
                $rute = trim((string) ($row[4] ?? ''));
                $keterangan = trim((string) ($row[5] ?? ''));
                $noArmada = trim((string) ($row[2] ?? ''));
                $namaSopir = trim((string) ($row[1] ?? ''));

                if ($kecamatan !== '') {
                    $currentKelurahan = $kecamatan;
                }

                if ($rute === '') {
                    continue;
                }

                $schedule = $this->parseSchedule($keterangan, $keterangan);
                $rows[] = [
                    'kelurahan' => $currentKelurahan,
                    'rute' => $rute,
                    'ket' => $keterangan,
                    'schedule' => $schedule,
                    'no_armada' => $noArmada,
                    'nama_sopir' => $namaSopir,
                ];
            } else {
                // Columns: NO, Kelurahan, No Armada, Rute, Ket
                $kelurahan = trim((string) ($row[1] ?? ''));
                $noArmada = trim((string) ($row[2] ?? ''));
                $rute = trim((string) ($row[3] ?? ''));
                $ket = trim((string) ($row[4] ?? ''));

                if ($kelurahan !== '') {
                    $currentKelurahan = $kelurahan;
                }

                if ($rute === '') {
                    continue;
                }

                $schedule = $this->parseSchedule($ket, $ket);
                $rows[] = [
                    'kelurahan' => $currentKelurahan,
                    'rute' => $rute,
                    'ket' => $ket,
                    'schedule' => $schedule,
                    'no_armada' => $noArmada,
                ];
            }
        }

        return $rows;
    }

    private function parseSchedule(string $ket, string $originalKet): array
    {
        $ket = trim($ket);
        if ($ket === '') {
            return [];
        }

        // "Setiap Hari", "Penyisiran tiap hari", "Senin s/d Minggu"
        if (str_contains($ket, 'Setiap') || str_contains($ket, 'tiap hari')
            || str_contains($ket, 'senin s/d minggu') || str_contains($ket, 'Senin s/d Minggu')
            || str_contains($ket, 'Senin s/d Minggu')
            || $ket === 'Senin s/d Minggu') {
            return self::HARI_ORDER;
        }

        // "Senin s/d Sabtu" or "Senin s/d Sabtu "
        if (preg_match('/Senin\s*s\/d\s*Sabtu/i', $ket)) {
            return ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        }

        // "Senin s/d Jumat" or similar
        if (preg_match('/Senin\s*s\/d\s*Jumat/i', $ket)) {
            return ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        }

        // "Senin s/d Sabtu" (match already done above)

        // "Senin, Rabu, Jumat, Minggu" etc.
        if (str_contains($ket, ',')) {
            $days = [];
            $parts = explode(',', $ket);
            foreach ($parts as $part) {
                $part = trim($part);
                $normalized = $this->normalizeDay($part);
                if ($normalized) {
                    $days[] = $normalized;
                }
            }

            return $days;
        }

        // Single day: "Senin", "Selasa", etc.
        $normalized = $this->normalizeDay($ket);
        if ($normalized) {
            return [$normalized];
        }

        // "Senin s/d Sabtu" format without comma
        if (preg_match('/^(\w+)\s*s\/d\s*(\w+)$/i', $ket, $m)) {
            $start = $this->normalizeDay($m[1]);
            $end = $this->normalizeDay($m[2]);
            if ($start && $end) {
                $startIdx = array_search($start, self::HARI_ORDER, true);
                $endIdx = array_search($end, self::HARI_ORDER, true);
                if ($startIdx !== false && $endIdx !== false && $startIdx <= $endIdx) {
                    return array_slice(self::HARI_ORDER, $startIdx, $endIdx - $startIdx + 1);
                }
            }
        }

        return [];
    }

    private function normalizeDay(string $day): ?string
    {
        $day = trim(strtolower($day));

        $map = [
            'senin' => 'senin',
            'selasa' => 'selasa',
            'rabu' => 'rabu',
            'kamis' => 'kamis',
            'jumat' => 'jumat',
            'jumat' => 'jumat',
            'sabtu' => 'sabtu',
            'minggu' => 'minggu',
        ];

        return $map[$day] ?? null;
    }

    private function processRow(array $row): void
    {
        $rute = $row['rute'];
        $kelurahan = $row['kelurahan'];
        $schedule = $row['schedule'];

        if (empty($schedule)) {
            return;
        }

        // Try to find matching record(s)
        $records = $this->findMatchingRecords($rute, $kelurahan);

        if (empty($records)) {
            $this->notFound++;
            $this->missed[] = "{$kelurahan} | {$rute} | {$row['ket']}";

            return;
        }

        $jadwal = $this->buildJadwal($schedule);

        foreach ($records as $record) {
            if ($this->option('dry-run')) {
                $this->line("  [DRY-RUN] Akan update #{$record->id_jalur_angkut}: {$record->nama} ({$record->kelurahan})");
                continue;
            }

            $record->update(['jadwal' => $jadwal]);
            $this->updated++;
        }
    }

    private function findMatchingRecords(string $rute, string $kelurahan): array
    {
        // Normalize kelurahan for matching (remove "Kecamatan " prefix for R6 sheet)
        $kelurahan = preg_replace('/^Kecamatan\s+/i', '', $kelurahan);

        // Try exact match first
        $records = JalurAngkut::where('nama', $rute)
            ->where('kelurahan', $kelurahan)
            ->get();

        if ($records->isNotEmpty()) {
            return $records->all();
        }

        // Try case-insensitive match
        $records = JalurAngkut::whereRaw('LOWER(nama) = ?', [strtolower($rute)])
            ->whereRaw('LOWER(kelurahan) = ?', [strtolower($kelurahan)])
            ->get();

        if ($records->isNotEmpty()) {
            return $records->all();
        }

        // Try nama LIKE + kelurahan exact
        $records = JalurAngkut::where('nama', 'like', '%' . $rute . '%')
            ->whereRaw('LOWER(kelurahan) = ?', [strtolower($kelurahan)])
            ->get();

        if ($records->isNotEmpty()) {
            return $records->all();
        }

        // Try kelurahan only match (for broader matching)
        $records = JalurAngkut::whereRaw('LOWER(kelurahan) = ?', [strtolower($kelurahan)])
            ->get();

        if ($records->isNotEmpty()) {
            return $records->all();
        }

        return [];
    }

    private function buildJadwal(array $days): array
    {
        $jadwal = [];

        foreach ($days as $day) {
            $jadwal[] = [
                'hari' => $day,
                'jam_mulai' => self::JAM_MULAI,
                'jam_selesai' => self::JAM_SELESAI,
            ];
        }

        // Sort by day order
        usort($jadwal, function ($a, $b) {
            $aIdx = array_search($a['hari'], self::HARI_ORDER, true);
            $bIdx = array_search($b['hari'], self::HARI_ORDER, true);

            return $aIdx - $bIdx;
        });

        return $jadwal;
    }

    private function printReport(): void
    {
        $this->newLine();
        $this->newLine();
        $this->info('=== LAPORAN IMPORT JADWAL ===');
        $this->line("Update berhasil: {$this->updated}");
        $this->line("Tidak ditemukan: {$this->notFound}");

        if (!empty($this->missed)) {
            $this->newLine();
            $this->warn('Baris yang tidak ditemukan di database:');
            $this->newLine();
            $this->line('  Kelurahan | Rute | Ket');
            $this->line('  ' . str_repeat('-', 60));

            foreach ($this->missed as $missed) {
                $this->line("  $missed");
            }

            $this->newLine();
            $this->warn("Total: " . count($this->missed) . " baris tidak ditemukan.");
        }
    }
}
