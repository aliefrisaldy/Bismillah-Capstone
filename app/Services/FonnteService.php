<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FonnteService
{
    protected string $token;

    public function __construct()
    {
        $this->token = env('FONNTE_TOKEN');
    }

    public function kirimPesan(string $nomor, string $pesan): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post('https://api.fonnte.com/send', [
                        'target' => $nomor,
                        'message' => $pesan,
                    ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Fonnte error: ' . $e->getMessage());
            return false;
        }
    }

    public function kirimGambar(string $nomor, string $urlGambar, string $caption = ''): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post('https://api.fonnte.com/send', [
                        'target' => $nomor,
                        'message' => $caption,
                        'url' => $urlGambar,
                    ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Fonnte kirimGambar error: ' . $e->getMessage());
            return false;
        }
    }
}