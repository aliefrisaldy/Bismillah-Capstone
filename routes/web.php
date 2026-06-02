<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\JalurAngkutController;
use App\Http\Controllers\Admin\LaporanController as AdminLaporanController;
use App\Http\Controllers\Admin\PetaController;
use App\Http\Controllers\Admin\TpsResmiController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\User\LaporanController as UserLaporanController;
use App\Http\Controllers\User\WargaPetaController;
use Illuminate\Support\Facades\Route;

// ─── LANDING PAGE ─────────────────────────────────────────
Route::inertia('/', 'welcome')->name('home');

// ─── AUTH ADMIN ───────────────────────────────────────────
Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])
    ->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/logout', [AdminAuthController::class, 'logout'])
    ->name('admin.logout');

// ─── HALAMAN USER (publik) ────────────────────────────────
Route::prefix('user')->name('user.')->group(function () {
    Route::get('dashboard', [UserLaporanController::class, 'index'])->name('dashboard');
    Route::get('laporan', [UserLaporanController::class, 'index'])->name('laporan.index');
    Route::get('laporan/buat', [UserLaporanController::class, 'create'])->name('laporan.create');
    Route::post('laporan', [UserLaporanController::class, 'store'])->name('laporan.store');
    Route::get('laporan/{id}', [UserLaporanController::class, 'show'])->name('laporan.show');

    Route::get('peta', [WargaPetaController::class, 'index'])->name('peta.index');
    Route::get('peta/data', [WargaPetaController::class, 'data'])->name('peta.data');

    // Jalur Angkut
    Route::get('jalur-angkut', [WargaPetaController::class, 'jalurIndex'])->name('jalur-angkut.index');
    Route::get('jalur-angkut/data', [WargaPetaController::class, 'jalurData'])->name('jalur-angkut.data');
    Route::get('jalur-angkut/kelurahans', [WargaPetaController::class, 'kelurahans'])->name('jalur-angkut.kelurahans');

    // TPS Resmi (hanya aktif, read-only untuk warga)
    Route::get('tps-resmi/data', [WargaPetaController::class, 'tpsData'])->name('tps-resmi.data');
});

// ─── HALAMAN ADMIN (protected) ────────────────────────────
Route::prefix('admin')->name('admin.')->middleware('auth.admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('dashboard/trend', [DashboardController::class, 'getTrendData'])->name('admin.dashboard.trend');

    Route::get('laporan/export', [AdminLaporanController::class, 'export'])->name('laporan.export');
    Route::get('laporan', [AdminLaporanController::class, 'index'])->name('laporan.index');
    Route::get('laporan/{id}', [AdminLaporanController::class, 'show'])->name('laporan.show');
    Route::match(['patch', 'post'], 'laporan/{id}/status', [AdminLaporanController::class, 'updateStatus'])->name('laporan.status');
    Route::post('laporan/{id}/tindak-lanjut', [AdminLaporanController::class, 'storeTindakLanjut'])->name('laporan.tindak-lanjut');

    Route::get('peta', [PetaController::class, 'index'])->name('peta.index');
    Route::get('peta/data', [PetaController::class, 'data'])->name('peta.data');

    Route::get('jalur', [JalurAngkutController::class, 'listIndex'])->name('jalur.index');
    Route::get('jalur/{id}/edit', [JalurAngkutController::class, 'edit'])->name('jalur.edit');
    Route::put('jalur/{id}', [JalurAngkutController::class, 'updateDetails'])->name('jalur.update');
    Route::get('jalur/{id}', [JalurAngkutController::class, 'show'])->name('jalur.show');
    Route::get('/jalur-angkut', [JalurAngkutController::class, 'index'])->name('jalur-angkut.index');
    Route::get('/jalur-angkut/data', [JalurAngkutController::class, 'data']);
    Route::put('/jalur-angkut/{id}', [JalurAngkutController::class, 'update']);
    Route::patch('/jalur-angkut/{id}/toggle', [JalurAngkutController::class, 'toggleAktif']);
    Route::get('/jalur-angkut/kelurahans', [JalurAngkutController::class, 'kelurahans']);

    Route::get('/tps-resmi/data', [TpsResmiController::class, 'data'])->name('tps-resmi.data');
    Route::post('/tps-resmi', [TpsResmiController::class, 'store'])->name('tps-resmi.store');
    Route::delete('/tps-resmi/{id}', [TpsResmiController::class, 'destroy'])->name('tps-resmi.destroy');
    Route::get('/tps-resmi', [TpsResmiController::class, 'index'])->name('tps-resmi.index');
    Route::patch('/tps-resmi/{id}/toggle', [TpsResmiController::class, 'toggleAktif'])->name('tps-resmi.toggle');
});
