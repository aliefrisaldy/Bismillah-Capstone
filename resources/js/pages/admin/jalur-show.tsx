import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Route,
    MapPin,
    Truck,
    CalendarClock,
    ChevronRight,
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Map, MapControls, MapRoute, useMap } from '@/components/ui/map';
import {
    formatJadwalLabel,
    getHariLabel,
    normalizeJadwal
    
} from '@/lib/jalur-schedule';
import type {JadwalItem} from '@/lib/jalur-schedule';

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

type JalurDetail = {
    id_jalur_angkut: number;
    nama: string;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
    aktif: boolean;
    jadwal: JadwalItem[] | unknown;
    coordinates: [number, number][];
    titik_count: number;
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    jalur: JalurDetail;
};

const DEFAULT_CENTER: [number, number] = [119.8707, -0.8917];

const tipeConfig: Record<TipeKendaraan, { label: string; pill: string }> = {
    'Pick Up': {
        label: 'Pick Up',
        pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    Kaisar: {
        label: 'Kaisar',
        pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    R6: {
        label: 'R6',
        pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
};

function RouteFitBounds({ coordinates }: { coordinates: [number, number][] }) {
    const { map, isLoaded } = useMap();
    const done = useRef(false);

    useEffect(() => {
        if (!map || !isLoaded || coordinates.length < 2 || done.current) {
return;
}

        done.current = true;

        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 500 });
        }

        return () => {
            done.current = false;
        };
    }, [map, isLoaded, coordinates]);

    return null;
}

export default function AdminJalurShow({ jalur }: Props) {
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string } }).flash;
    const jadwal = useMemo(() => normalizeJadwal(jalur.jadwal), [jalur.jadwal]);
    const cfg = tipeConfig[jalur.tipe_kendaraan];
    const hasRoute = jalur.coordinates.length >= 2;

    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light',
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(
                document.documentElement.classList.contains('dark')
                    ? 'dark'
                    : 'light',
            );
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Head title={`Detail Jalur #${jalur.id_jalur_angkut}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/jalur">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                #{jalur.id_jalur_angkut}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Detail Jalur</span>
                        </div>
                    </div>

                    <Button
                        asChild
                        className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                    >
                        <Link
                            href={`/admin/jalur/${jalur.id_jalur_angkut}/edit`}
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Jalur
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="space-y-4 lg:col-span-2">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: jalur.warna }}
                                />
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl font-extrabold text-foreground">
                                        {jalur.nama}
                                    </h1>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${cfg?.pill ?? ''}`}
                                        >
                                            {cfg?.label ?? jalur.tipe_kendaraan}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                                                jalur.aktif
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                        >
                                            {jalur.aktif ? 'AKTIF' : 'NONAKTIF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <dl className="mt-6 space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Kelurahan
                                        </dt>
                                        <dd className="font-medium">
                                            {jalur.kelurahan ?? '—'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Truck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Titik koordinat
                                        </dt>
                                        <dd className="font-medium">
                                            {jalur.titik_count} titik
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Route className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Terakhir diperbarui
                                        </dt>
                                        <dd className="font-medium">
                                            {jalur.updated_at ?? '—'}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-emerald-600" />
                                <h2 className="text-lg font-bold">
                                    Jadwal Operasi
                                </h2>
                            </div>

                            {jadwal.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada jadwal.{' '}
                                    <Link
                                        href={`/admin/jalur/${jalur.id_jalur_angkut}/edit`}
                                        className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                                    >
                                        Atur jadwal
                                    </Link>
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {jadwal.map((j) => (
                                        <li
                                            key={j.hari}
                                            className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
                                        >
                                            <span className="text-sm font-semibold">
                                                {getHariLabel(j.hari)}
                                            </span>
                                            <span className="font-mono text-sm text-muted-foreground">
                                                {j.jam_mulai} – {j.jam_selesai}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="mt-4 text-xs text-muted-foreground">
                                {formatJadwalLabel(jadwal)}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-3">
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-sm font-semibold">
                                Pratinjau Rute
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Visualisasi jalur di peta
                            </p>
                        </div>
                        <div className="h-[420px] w-full">
                            {hasRoute ? (
                                <Map
                                    center={DEFAULT_CENTER}
                                    zoom={12}
                                    theme={theme}
                                >
                                    <MapControls
                                        position="top-right"
                                        showZoom
                                        showFullscreen
                                    />
                                    <RouteFitBounds
                                        coordinates={jalur.coordinates}
                                    />
                                    <MapRoute
                                        id="jalur-detail"
                                        coordinates={jalur.coordinates}
                                        color={jalur.warna}
                                        width={5}
                                        opacity={0.9}
                                        interactive={false}
                                    />
                                </Map>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    Koordinat jalur tidak tersedia
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminJalurShow.layout = {
    breadcrumbs: [
        { title: 'Jalur Angkut', href: '/admin/jalur' },
        { title: 'Detail Jalur', href: '#' },
    ],
};
