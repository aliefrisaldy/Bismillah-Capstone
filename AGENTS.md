# AGENTS.md

## Stack

- **Backend:** Laravel 13 (PHP ^8.3), Inertia v3, Fortify auth, Sanctum tokens, Socialite (Google OAuth)
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (New York style)
- **Build:** Vite 8, `laravel-vite-plugin`, `@inertiajs/vite`, `@laravel/vite-plugin-wayfinder`
- **DB:** MySQL (default), in-memory SQLite for tests
- **Testing:** Pest (PHP), Vitest (none found — frontend tests not present)

## Commands

| Command | What it does |
|---|---|
| `composer dev` | `php artisan serve` + `queue:listen` + `npm run dev` via concurrently |
| `composer setup` | Full project bootstrap (composer install, .env, key, migrate, npm i, build) |
| `composer test` | `config:clear` → `lint:check` → `php artisan test` (Pest) |
| `composer lint` | `pint --parallel` (auto-fix PHP) |
| `composer lint:check` | `pint --parallel --test` (dry-run) |
| `composer ci:check` | `lint:check` → `format:check` → `types:check` → test |
| `npm run format` / `format:check` | Prettier on `resources/` |
| `npm run lint` / `lint:check` | ESLint on whole project |
| `npm run types:check` | `tsc --noEmit` |
| `npm run build:ssr` | Client build + SSR build |
| `./vendor/bin/pest` | Run tests directly (used in CI) |

## Architecture

- **Two auth guards:** `web` (users table) and `admin` (admin table). Admin uses custom `AdminAuthController` + `auth.admin` middleware (`AuthAdmin.php`). Users use Laravel Fortify.
- **Routing:** Inertia SPA. Pages auto-located under `resources/js/pages/`. Layout is resolved dynamically in `app.tsx` by page name prefix (`auth/`, `admin/`, `user/`, `settings/`, `welcome`).
- **Type-safe routes:** `laravel/wayfinder` generates `resources/js/wayfinder/` (gitignored) — use `route()` calls from there.
- **Shared Inertia props:** `auth.user` shape differs by guard. Admin gets `{id, name, email, jabatan}`, user gets `{id, name, email, no_telpon}`.

## Conventions

- **ESLint:** `type` imports enforced (`consistent-type-imports` with `prefer-type-imports`, `separate-type-imports`). Import order: builtin → external → internal → parent → sibling → index (alpha within groups).
- **Style:** Prettier with `tabWidth: 4` (2 for YAML), single quotes, semicolons, `prettier-plugin-tailwindcss`. `curly: [error, all]`. 1tbs brace style, no single-line blocks. Blank lines around control flow statements required.
- **shadcn:** Components at `@/components/ui`. Path alias `@/*` → `resources/js/*`.
- **PHP:** Pint with `laravel` preset.

## Generated / ignored files

- `resources/js/actions/`, `resources/js/routes/`, `resources/js/wayfinder/` — auto-generated, gitignored. Run `php artisan wayfinder:generate` to regenerate route helpers.
- `bootstrap/ssr/` — SSR build output, gitignored.
- `.npmrc` has `ignore-scripts=true` (postinstall scripts won't run unless forced).

## Testing quirks

- Tests use SQLite `:memory:` DB (see `phpunit.xml`). Dev uses MySQL.
- `tests/Pest.php` binds Feature tests to `Tests\TestCase` with `RefreshDatabase` trait **commented out** — tests may not clean DB between runs unless explicitly added.
- `TestCase` exposes `skipUnlessFortifyHas($feature)` helper for feature-gated tests.
