<?php

namespace App\Jobs;

use App\Services\FonnteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class KirimNotifikasiWa implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $nomor,
        public string $pesan,
        public array $fotoPaths = [],
    ) {}

    public function handle(FonnteService $fonnte): void
    {
        $fonnte->kirimPesan($this->nomor, $this->pesan);

        foreach ($this->fotoPaths as $path) {
            $fonnte->kirimGambar(
                $this->nomor,
                url('storage/' . $path),
                '📸 Foto bukti penanganan oleh petugas DLH'
            );
        }
    }
}