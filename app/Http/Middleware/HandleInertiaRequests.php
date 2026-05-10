<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $isAdminRoute = str_starts_with($request->path(), 'admin')
            || $request->path() === 'dashboard';

        if ($isAdminRoute) {
            $admin = $request->user('admin');
            $authUser = $admin ? [
                'id' => $admin->id_admin,
                'name' => $admin->nama,
                'email' => $admin->email,
                'jabatan' => $admin->jabatan,
            ] : null;
        } else {
            $user = $request->user('web');
            $authUser = $user ? [
                'id' => $user->id_user,
                'name' => $user->nama,
                'email' => $user->email,
                'no_telpon' => $user->no_telpon,
            ] : null;
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $authUser,
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
