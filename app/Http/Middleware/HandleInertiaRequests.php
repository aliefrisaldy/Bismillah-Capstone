<?php

namespace App\Http\Middleware;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $admin = $request->user('admin');
        $authUser = $admin ? [
            'id' => $admin->id_admin,
            'name' => $admin->nama,
            'email' => $admin->email,
            'jabatan' => $admin->jabatan,
        ] : null;

        $pelaporId = $request->cookie('pelapor_id');
        $laporanSummary = [];

        if ($pelaporId) {
            $laporanSummary = Laporan::where('id_pelapor', $pelaporId)
                ->orderByDesc('tanggal_diperbarui')
                ->get(['id_laporan', 'status', 'tanggal_diperbarui', 'alamat'])
                ->toArray();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $authUser,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
            'laporan_summary' => $laporanSummary,
        ];
    }
}
