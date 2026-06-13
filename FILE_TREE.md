# File Tree Project Capstone

```
Capstone/
├── .github/workflows/
│   ├── lint.yml
│   └── tests.yml
├── AGENTS.md
├── PRD.md
├── app/
│   ├── Console/Commands/
│   │   └── ImportJadwalJalur.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── JalurAngkutController.php
│   │   │   │   ├── LaporanController.php
│   │   │   │   ├── PetaController.php
│   │   │   │   └── TpsResmiController.php
│   │   │   ├── Auth/
│   │   │   │   ├── AdminAuthController.php
│   │   │   │   └── GoogleAuthController.php
│   │   │   ├── Settings/
│   │   │   │   ├── ProfileController.php
│   │   │   │   └── SecurityController.php
│   │   │   ├── User/
│   │   │   │   ├── LaporanController.php
│   │   │   │   └── WargaPetaController.php
│   │   │   ├── Controller.php
│   │   │   └── WhatsappController.php
│   │   ├── Middleware/
│   │   │   ├── AuthAdmin.php
│   │   │   ├── HandleAppearance.php
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── RedirectIfAdmin.php
│   │   └── Requests/Settings/
│   │       ├── PasswordUpdateRequest.php
│   │       ├── ProfileDeleteRequest.php
│   │       ├── ProfileUpdateRequest.php
│   │       └── TwoFactorAuthenticationRequest.php
│   ├── Jobs/
│   │   └── KirimNotifikasiWa.php
│   ├── Models/
│   │   ├── Admin.php
│   │   ├── JalurAngkut.php
│   │   ├── Laporan.php
│   │   ├── RiwayatStatus.php
│   │   ├── TindakLanjut.php
│   │   ├── TpsResmi.php
│   │   ├── User.php
│   │   └── WaSession.php
│   └── Services/
│       └── FonnteService.php
├── bootstrap/
│   ├── app.php
│   └── providers.php
├── config/
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── inertia.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── sanctum.php
│   ├── services.php
│   └── session.php
├── database/
│   ├── factories/
│   ├── geojson/
│   │   ├── pickup/         (46 kelurahan GeoJSON)
│   │   ├── Kaisar.geojson
│   │   ├── R6.geojson
│   │   └── tps_resmi.geojson
│   ├── migrations/         (20 file migrasi)
│   └── seeders/
├── public/
│   ├── build/
│   ├── geojson/
│   ├── storage/
│   └── ...
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── actions/App/Http/Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── DashboardController.ts
│   │   │   │   ├── JalurAngkutController.ts
│   │   │   │   ├── LaporanController.ts
│   │   │   │   ├── PetaController.ts
│   │   │   │   └── TpsResmiController.ts
│   │   │   ├── Auth/
│   │   │   │   └── AdminAuthController.ts
│   │   │   ├── User/
│   │   │   │   ├── LaporanController.ts
│   │   │   │   └── WargaPetaController.ts
│   │   │   └── WhatsappController.ts
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── map/
│   │   │   ├── ui/           (shadcn: button, card, dialog, dll.)
│   │   │   └── (app-shell, sidebar, nav, chart, dll.)
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── settings/
│   │   │   └── (app/auth/public/user layouts)
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── jalur-angkut.tsx
│   │   │   │   ├── jalur-edit.tsx
│   │   │   │   ├── jalur-index.tsx
│   │   │   │   ├── jalur-show.tsx
│   │   │   │   ├── laporan-index.tsx
│   │   │   │   ├── laporan-show.tsx
│   │   │   │   ├── peta.tsx
│   │   │   │   ├── tps-resmi-edit.tsx
│   │   │   │   ├── tps-resmi-index.tsx
│   │   │   │   └── tps-resmi-show.tsx
│   │   │   ├── auth/
│   │   │   │   └── admin-login.tsx
│   │   │   ├── user/
│   │   │   │   ├── jalur-angkut.tsx
│   │   │   │   ├── laporan-create.tsx
│   │   │   │   ├── laporan-index.tsx
│   │   │   │   ├── laporan-show.tsx
│   │   │   │   └── peta-laporan.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── welcome.tsx
│   │   ├── routes/
│   │   │   ├── admin/       (dashboard, jalur, laporan, peta, tps-resmi)
│   │   │   ├── user/        (jalur-angkut, laporan, peta, tps-resmi)
│   │   │   ├── login/
│   │   │   ├── storage/local/
│   │   │   └── index.ts
│   │   ├── types/
│   │   ├── wayfinder/
│   │   └── app.tsx
│   └── views/app.blade.php
├── routes/
│   ├── api.php
│   ├── console.php
│   ├── settings.php
│   └── web.php
├── storage/
│   ├── app/
│   ├── framework/
│   └── logs/
├── tests/
│   ├── Feature/
│   │   ├── Auth/            (7 test files)
│   │   ├── Settings/        (2 test files)
│   │   └── ...
│   ├── Unit/
│   ├── Pest.php
│   └── TestCase.php
├── composer.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```
