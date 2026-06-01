# PRD — Sistem Pelaporan TPS Ilegal Kota Palu

## 1. Ringkasan Proyek

| Item | Detail |
|---|---|
| **Nama** | Sistem Pelaporan TPS Ilegal Kota Palu |
| **Tujuan** | Memfasilitasi masyarakat melaporkan Tempat Pembuangan Sampah (TPS) ilegal dan membantu DLH (Dinas Lingkungan Hidup) dalam pengelolaan laporan, pemetaan, serta penanganan |
| **Target Pengguna** | Masyarakat umum (pelapor) + Admin DLH (penindak lanjut) |
| **Tech Stack** | Laravel 13 (PHP ^8.3), React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (New York), Inertia v3, Vite 8, MySQL |

---

## 2. Arsitektur Sistem

### 2.1 Struktur Auth

Sistem hanya memiliki **satu guard autentikasi** yaitu `admin`:

| Guard | Tabel | Login | Session |
|---|---|---|---|
| `admin` | `admin` | Email + password via `/admin/login` | Session-based, middleware `auth.admin` |

> Tidak ada registrasi publik. Admin dibuat langsung via database/seed.

### 2.2 Routing

Semua route didefinisikan di `routes/web.php` dengan dua grup:

| Prefix | Middleware | Halaman |
|---|---|---|
| `/` | — | Landing page (welcome) |
| `/admin` | `auth.admin` | Dashboard, laporan, peta, jalur, TPS |

### 2.3 Stack Frontend

- **SSR**: Inertia v3 server-side rendering via Vite
- **Layout**: Otomatis dipilih berdasarkan prefix halaman (`auth/`, `admin/`, `user/`, `settings/`, `welcome`)
- **Komponen**: shadcn/ui New York style, icon lucide-react
- **Map**: Maplibre GL JS + Turf.js (spatial query client-side)
- **Chart**: Recharts (area, bar, pie)

---

## 3. Skema Database

### 3.1 Relasi Antar Tabel

```
admin ────┐
          ├─── tindak_lanjut (id_admin)
          └─── riwayat_status (id_admin)

laporan ──┐
          ├─── tindak_lanjut (id_laporan)
          └─── riwayat_status (id_laporan)
```

### 3.2 Tabel `admin`

Admin DLH yang login dan menangani laporan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_admin` | BIGINT PK | Auto-increment |
| `nama` | VARCHAR(100) | Nama lengkap admin |
| `email` | VARCHAR(100) UNIQUE | Email login |
| `password` | VARCHAR(255) | BCrypt hash |
| `jabatan` | VARCHAR(100) NULL | Jabatan di DLH |
| `created_at` | TIMESTAMP | — |
| `updated_at` | TIMESTAMP | — |

### 3.3 Tabel `laporan`

Laporan TPS ilegal yang masuk dari masyarakat (web) atau WhatsApp.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_laporan` | BIGINT PK | Auto-increment |
| `id_pelapor` | VARCHAR(36) NULL INDEX | UUID pelapor (via cookie atau WA) |
| `nama_pelapor` | VARCHAR(100) NULL | Nama pelapor |
| `no_telpon_pelapor` | VARCHAR(15) NULL | No. HP pelapor |
| `deskripsi` | TEXT | Deskripsi laporan |
| `foto` | JSON NULL | Array path foto (`["path1.jpg", ...]`) |
| `latitude` | DECIMAL(10,8) NULL | Koordinat lokasi |
| `longitude` | DECIMAL(11,8) NULL | Koordinat lokasi |
| `alamat` | TEXT NULL | Alamat lokasi |
| `status` | ENUM('menunggu','diverifikasi','diproses','selesai','ditolak') | Status penanganan, default `menunggu` |
| `tanggal_laporan` | TIMESTAMP | Waktu laporan dibuat, `useCurrent` |
| `tanggal_diperbarui` | TIMESTAMP | Waktu terakhir diupdate |

**Indexes**: `status`, `tanggal_laporan`, `id_pelapor`

### 3.4 Tabel `riwayat_status`

Riwayat setiap perubahan status laporan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_riwayat` | BIGINT PK | Auto-increment |
| `id_laporan` | BIGINT FK → `laporan` | Laporan terkait |
| `id_admin` | BIGINT FK → `admin` | Admin yang mengubah |
| `status_lama` | ENUM | Status sebelum diubah |
| `status_baru` | ENUM | Status setelah diubah |
| `catatan` | TEXT NULL | Catatan admin |
| `tanggal` | TIMESTAMP | Waktu perubahan |

### 3.5 Tabel `tindak_lanjut`

Tindak lanjut / penanganan yang dilakukan admin pada laporan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_tindak_lanjut` | BIGINT PK | Auto-increment |
| `id_laporan` | BIGINT FK → `laporan` | Laporan terkait |
| `id_admin` | BIGINT FK → `admin` | Admin pelaksana |
| `catatan` | TEXT NULL | Catatan penanganan |
| `foto_penanganan` | JSON NULL | Array foto bukti penanganan |
| `tanggal` | TIMESTAMP | Waktu penanganan |

### 3.6 Tabel `jalur_angkut`

Rute/jalur angkut sampah yang dikelola DLH.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_jalur_angkut` | BIGINT PK | Auto-increment |
| `nama` | VARCHAR(255) | Nama jalur |
| `kelurahan` | VARCHAR(255) NULL | Kelurahan yang dilayani |
| `tipe_kendaraan` | ENUM('Pick Up','Kaisar','R6') | Tipe kendaraan |
| `coordinates` | LONGTEXT | JSON array koordinat rute |
| `warna` | VARCHAR(255) | Warna garis di peta, default `#e74c3c` |
| `jadwal` | JSON NULL | Jadwal operasional |
| `aktif` | BOOLEAN | Status aktif, default `true` |
| `created_at` | TIMESTAMP | — |
| `updated_at` | TIMESTAMP | — |

### 3.7 Tabel `tps_resmi`

Titik TPS resmi yang dikelola DLH.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id_tps_resmi` | BIGINT PK | Auto-increment |
| `latitude` | DECIMAL(10,7) | Koordinat TPS |
| `longitude` | DECIMAL(10,7) | Koordinat TPS |
| `aktif` | BOOLEAN | Status aktif, default `true` |
| `created_at` | TIMESTAMP | — |
| `updated_at` | TIMESTAMP | — |

### 3.8 Tabel `wa_sessions`

Sesi percakapan bot WhatsApp untuk pelaporan via WA.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGINT PK | Auto-increment |
| `no_wa` | VARCHAR(20) UNIQUE | Nomor WA pengirim |
| `step` | VARCHAR(50) | Tahap percakapan, default `idle` |
| `data` | JSON NULL | Data sementara sesi |
| `updated_at` | TIMESTAMP | Waktu terakhir interaksi |

### 3.9 GeoJSON (Static File)

File `public/geojson/kelurahan_palu.geojson` — FeatureCollection dengan polygon batas 43 kelurahan di Kota Palu. Setiap feature memiliki properties: `kelurahan`, `kecamatan`, `kota`. Digunakan untuk spatial filtering (point-in-polygon) laporan berdasarkan kelurahan/kecamatan.

---

## 4. Fitur Masyarakat (Non-Auth)

Masyarakat dapat mengakses halaman publik **tanpa login**.

### 4.1 Beranda (Landing Page)

- `/` — Halaman selamat datang dengan informasi umum tentang sistem pelaporan.

### 4.2 Dashboard User

- `/user/dashboard` — Daftar laporan yang pernah dibuat oleh pelapor (di-filter via cookie `pelapor_id`).
- Paginasi 3 laporan per halaman.

### 4.3 Buat Laporan

- `/user/laporan/buat` — Formulir pembuatan laporan dengan:
  - Nama pelapor (wajib)
  - No. telepon (wajib)
  - Deskripsi (wajib)
  - Foto (opsional, multiple upload)
  - Peta interaktif untuk menentukan titik lokasi (Maplibre GL JS)
  - Alamat (terisi otomatis dari koordinat via reverse geocode)
- Setiap pelapor diidentifikasi via UUID yang disimpan di cookie (`pelapor_id`).

### 4.4 Detail Laporan

- `/user/laporan/{id}` — Detail laporan milik pelapor, termasuk:
  - Informasi laporan + foto
  - Timeline riwayat status
  - Tindak lanjut dari admin

### 4.5 Peta Sebaran

- `/user/peta` — Peta interaktif (Maplibre GL JS) menampilkan:
  - Marker laporan (berdasarkan status)
  - Marker TPS resmi
  - Rute jalur angkut
  - Filter status + kecamatan + kelurahan

### 4.6 Jalur Angkut

- `/user/jalur-angkut` — Peta dengan rute jalur angkut sampah.
  - Filter berdasarkan tipe kendaraan dan kelurahan
  - Perbedaan tipe kendaraan (Pick Up, Kaisar, R6)

### 4.7 TPS Resmi

- Data TPS resmi ditampilkan di peta sebaran (read-only untuk masyarakat).

---

## 5. Fitur Admin (Auth Required)

Admin login via `/admin/login` dengan email + password.

### 5.1 Dashboard

- `/admin/dashboard` — Ringkasan data dengan:
  - **Stat cards**: Total laporan, laporan minggu ini, TPS resmi, total admin
  - **Status cards**: Jumlah per status (menunggu, diverifikasi, diproses, selesai, ditolak)
  - **Area chart**: Tren laporan harian/mingguan/bulanan
  - **Pie chart**: Distribusi status
  - **Bar chart**: Jalur angkut per tipe kendaraan
  - **Bar chart (horizontal)**: Laporan per kelurahan — pilih kecamatan via dropdown, tampilkan jumlah laporan per kelurahan
  - **Tabel**: 5 laporan terbaru

### 5.2 Daftar Laporan

- `/admin/laporan` — Data table laporan dengan:
  - Search (ID, alamat, deskripsi, nama pelapor)
  - Filter status + rentang tanggal
  - Export CSV
  - Paginasi

### 5.3 Detail & Penanganan Laporan

- `/admin/laporan/{id}` — Detail laporan dengan aksi:
  - Update status (menunggu → diverifikasi → diproses → selesai/ditolak)
  - Tambah catatan & foto penanganan
  - Timeline riwayat status
  - Notifikasi WhatsApp otomatis ke pelapor saat status berubah

### 5.4 Peta Interaktif Admin

- `/admin/peta` — Peta lengkap dengan:
  - Marker laporan (filter by status)
  - Polygon kelurahan dari GeoJSON
  - Filter kecamatan + kelurahan (cascading)
  - Rute jalur angkut (filter by tipe + kelurahan)
  - Marker TPS resmi (toggle layer, hapus)
  - Popup detail setiap marker
  - Mode edit jalur (geser titik koordinat di peta)

### 5.5 Kelola Jalur Angkut

- `/admin/jalur-angkut` — Daftar jalur angkut
- `/admin/jalur/{id}/edit` — Edit detail jalur (nama, kelurahan, tipe, jadwal, warna)
- Edit rute via peta (drag coordinates)
- Toggle aktif/non-aktif

### 5.6 Kelola TPS Resmi

- `/admin/tps-resmi` — Daftar TPS resmi
- Tambah TPS baru (klik peta → konfirmasi)
- Hapus TPS
- Toggle aktif/non-aktif

---

## 6. Fitur WhatsApp

### 6.1 Bot Pelaporan

Masyarakat dapat melapor melalui WhatsApp dengan alur:

1. Kirim pesan ke nomor bot
2. Bot memandu: minta nama → deskripsi → foto → lokasi (link Google Maps)
3. Data disimpan ke tabel `laporan` via `WhatsappController`
4. Setiap sesi percakapan disimpan di tabel `wa_sessions`

### 6.2 Notifikasi Otomatis

- Saat admin mengubah status laporan → WhatsApp notifikasi dikirim ke `no_telpon_pelapor`
- Gateway: Fonnte API (via `app/Services/FonnteService.php`)

---

## 7. Autentikasi & Otorisasi

### 7.1 Admin Auth (Satu-satunya Guard)

| Komponen | Detail |
|---|---|
| **Guard** | `admin` (custom, didefinisikan di `config/auth.php`) |
| **Provider** | Tabel `admin` dengan `eloquent` driver |
| **Middleware** | `auth.admin` — memeriksa session admin (`Auth::guard('admin')->check()`) |
| **Login** | `/admin/login` — email + password + remember me |
| **Logout** | `/admin/logout` — invalidate session + regenerate token |
| **Controller** | `AdminAuthController` — showLogin, login, logout |

### 7.2 Model Admin

```php
class Admin extends Authenticatable
{
    protected $table = 'admin';
    protected $primaryKey = 'id_admin';
}
```

### 7.3 Shared Inertia Props

Admin menu dapatkan `auth.user` dengan shape: `{ id, name, email, jabatan }`.

---

## 8. API & Data Flow

### 8.1 Inertia SSR (Halaman Utama)

| Halaman | Route | Controller |
|---|---|---|
| Welcome | `GET /` | Route::inertia |
| Admin Dashboard | `GET /admin/dashboard` | `DashboardController@index` |
| Admin Laporan | `GET /admin/laporan` | `LaporanController@index` |
| Admin Detail Laporan | `GET /admin/laporan/{id}` | `LaporanController@show` |
| Admin Peta | `GET /admin/peta` | `PetaController@index` |
| Admin Jalur | `GET /admin/jalur-angkut` | `JalurAngkutController@index` |
| Admin TPS | `GET /admin/tps-resmi` | `TPSResmiController@index` |

### 8.2 AJAX Endpoints (JSON)

| Endpoint | Method | Response |
|---|---|---|
| `/admin/dashboard/trend?period=` | GET | Data tren (daily/weekly/monthly) |
| `/admin/peta/data?status=` | GET | Array laporan untuk marker peta |
| `/admin/jalur-angkut/data?tipe=&kelurahan=` | GET | GeoJSON FeatureCollection jalur |
| `/admin/jalur-angkut/{id}` | PUT | Update koordinat jalur |
| `/admin/jalur-angkut/{id}/toggle` | PATCH | Toggle aktif jalur |
| `/admin/jalur-angkut/kelurahans` | GET | Daftar kelurahan (dari tabel jalur) |
| `/admin/tps-resmi/data` | GET | Array TPS resmi |
| `/admin/tps-resmi` | POST | Tambah TPS baru |
| `/admin/tps-resmi/{id}` | DELETE | Hapus TPS |
| `/admin/tps-resmi/{id}/toggle` | PATCH | Toggle aktif TPS |
| `/admin/laporan/export` | GET | CSV laporan |
| `/admin/laporan/{id}/status` | PATCH/POST | Update status + kirim notif WA |
| `/admin/laporan/{id}/tindak-lanjut` | POST | Tambah tindak lanjut |

### 8.3 External Data

| Data | Lokasi | Format |
|---|---|---|
| Batas kelurahan | `public/geojson/kelurahan_palu.geojson` | GeoJSON FeatureCollection |
| Base map tiles | CartoDB (positron / dark-matter via Maplibre) | — |

### 8.4 Caching

- **Dashboard stats**: Cache key `dashboard.stats.v2` — TTL 300 detik
- **Trend data**: Tidak di-cache (dihitung per request)

---

## 9. Command & Tooling

### 9.1 Command

| Command | Fungsi |
|---|---|
| `composer dev` | `php artisan serve` + `queue:listen` + `npm run dev` |
| `composer setup` | Bootstrap full project |
| `composer test` | `config:clear` → `lint:check` → `php artisan test` |
| `composer lint` | `pint --parallel` (auto-fix PHP) |
| `composer lint:check` | `pint --parallel --test` (dry-run) |
| `composer ci:check` | `lint:check` → `format:check` → `types:check` → test |
| `npm run format` | Prettier pada `resources/` |
| `npm run lint` | ESLint auto-fix |
| `npm run types:check` | `tsc --noEmit` |

### 9.2 Testing

| Alat | Cakupan |
|---|---|
| **Pest** | PHP feature & unit tests (SQLite in-memory) |
| **ESLint** | TypeScript/React (consistent-type-imports, import order, padding rules) |
| **Prettier** | Formatting (tabWidth 4, single quotes, semicolons) |
| **Pint** | PHP formatting (Laravel preset) |

---

## 10. Struktur Folder

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/         # DashboardController, LaporanController, PetaController,
│   │   │                  # JalurAngkutController, TPSResmiController
│   │   ├── Auth/          # AdminAuthController
│   │   ├── User/          # LaporanController, WargaPetaController
│   │   └── WhatsappController.php
│   └── Middleware/
│       └── AuthAdmin.php
├── Models/                # Admin, Laporan, JalurAngkut, TpsResmi,
│                          # TindakLanjut, RiwayatStatus, WaSession
└── Services/
    └── FonnteService.php  # WhatsApp gateway

resources/js/
├── pages/
│   ├── admin/             # dashboard, laporan-index, laporan-show, peta,
│   │                      # jalur-index, jalur-show, jalur-edit, jalur-angkut, tps-resmi-index
│   ├── user/              # laporan-index, laporan-create, laporan-show,
│   │                      # peta-laporan, jalur-angkut
│   └── auth/              # admin-login
├── components/
│   ├── ui/                # shadcn/ui components (button, select, dialog, dll)
│   ├── app-sidebar.tsx    # Admin sidebar navigation
│   ├── nav-main.tsx       # Nav menu items
│   └── chart.tsx          # Custom SVG chart (cadangan)
└── lib/
    └── utils.ts           # cn() helper

database/migrations/       # 19 migration files
routes/web.php             # Semua route web

public/geojson/            # kelurahan_palu.geojson
```

---

## 11. Catatan Teknis

- **Spatial query** dilakukan client-side menggunakan `@turf/boolean-point-in-polygon` terhadap GeoJSON kelurahan — tidak ada spatial index di MySQL.
- **Dashboard kelurahan chart** menggunakan data point-in-polygon yang dikomputasi server-side (PHP) dan di-cache.
- **Pengguna tidak perlu login** untuk membuat laporan. Identitas dilacak via UUID di cookie browser.
- **Migrasi nama file tertukar**: File `create_tindak_lanjut_table.php` isinya membuat tabel `riwayat_status`, dan sebaliknya. Tidak mempengaruhi fungsionalitas karena kedua migrasi dijalankan di batch yang sama.
