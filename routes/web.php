<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\User\LaporanController as UserLaporanController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LaporanController as AdminLaporanController;
use App\Http\Controllers\Admin\PetaController;

// ─── LANDING PAGE ─────────────────────────────────────────
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// ─── REDIRECT /dashboard → /user/laporan (tidak dipakai lagi) ─
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return redirect('/user/laporan');
    })->name('dashboard');
});

require __DIR__.'/settings.php';

// ─── AUTH ADMIN ───────────────────────────────────────────
Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])
     ->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/logout', [AdminAuthController::class, 'logout'])
     ->name('admin.logout');

// ─── HALAMAN USER (protected) ─────────────────────────────
Route::prefix('user')->name('user.')->middleware('auth')->group(function () {
    Route::get('dashboard',    [UserLaporanController::class, 'index'])->name('dashboard');
    Route::get('laporan',      [UserLaporanController::class, 'index'])->name('laporan.index');
    Route::get('laporan/buat', [UserLaporanController::class, 'create'])->name('laporan.create');
    Route::post('laporan',     [UserLaporanController::class, 'store'])->name('laporan.store');
    Route::get('laporan/{id}', [UserLaporanController::class, 'show'])->name('laporan.show');
});

// ─── HALAMAN ADMIN (protected) ────────────────────────────
Route::prefix('admin')->name('admin.')->middleware('auth.admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('laporan/export',              [AdminLaporanController::class, 'export'])->name('laporan.export');
    Route::get('laporan',                     [AdminLaporanController::class, 'index'])->name('laporan.index');
    Route::get('laporan/{id}',                [AdminLaporanController::class, 'show'])->name('laporan.show');
    Route::patch('laporan/{id}/status',       [AdminLaporanController::class, 'updateStatus'])->name('laporan.status');
    Route::post('laporan/{id}/tindak-lanjut', [AdminLaporanController::class, 'storeTindakLanjut'])->name('laporan.tindak-lanjut');

    Route::get('peta',      [PetaController::class, 'index'])->name('peta.index');
    Route::get('peta/data', [PetaController::class, 'data'])->name('peta.data');
});