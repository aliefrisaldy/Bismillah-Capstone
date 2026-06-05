import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, MapPin, Pencil, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map';
import maplibregl from 'maplibre-gl';

type TpsDetail = {
    id: number;
    nama: string | null;
    latitude: number;
    longitude: number;
    aktif: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    tps: TpsDetail;
};

const DEFAULT_CENTER: [number, number] = [119.8707, -0.8917];

function FitSinglePoint({ lngLat }: { lngLat: [number, number] }) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        map.flyTo({ center: lngLat, zoom: 16, duration: 500 });
    }, [map, isLoaded, lngLat]);

    return null;
}

function TpsMarker({ lngLat }: { lngLat: [number, number] }) {
    const { map, isLoaded } = useMap();

    const el = useMemo(() => {
        const wrap = document.createElement('div');
        wrap.style.cssText =
            'display:inline-flex;flex-direction:column;align-items:center;cursor:default;user-select:none;';
        const circle = document.createElement('div');
        circle.style.cssText =
            'width:40px;height:40px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;';
        circle.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 576 512"><path fill="white" d="M560 160c10.4 0 18-9.8 15.5-19.9l-24-96C549.7 37 543.3 32 536 32h-98.9l25.6 128zM272 32H171.5l-25.6 128H272zm132.5 0H304v128h126.1zM16 160h97.3l25.6-128H40c-7.3 0-13.7 5-15.5 12.1l-24 96C-2 150.2 5.6 160 16 160m544 64h-20l4-32H32l4 32H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h28l20 160v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h320v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16l20-160h28c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16"/></svg>';
        const tail = document.createElement('div');
        tail.style.cssText =
            'width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #10b981;margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));flex-shrink:0;';
        wrap.appendChild(circle);
        wrap.appendChild(tail);

        return wrap;
    }, []);

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat(lngLat)
            .addTo(map);

        return () => {
            marker.remove();
        };
    }, [map, isLoaded, lngLat, el]);

    return null;
}

export default function TpsResmiShow({ tps }: Props) {
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string } }).flash;

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

    const lngLat: [number, number] = useMemo(
        () => [tps.longitude, tps.latitude],
        [tps.longitude, tps.latitude],
    );

    return (
        <>
            <Head title={`Detail TPS #${tps.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/tps-resmi">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                #{tps.id}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Detail TPS</span>
                        </div>
                    </div>

                    <Button
                        asChild
                        className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                    >
                        <Link href={`/admin/tps-resmi/${tps.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            Edit TPS
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">
                    <div className="space-y-4 lg:col-span-2">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <MapPin className="h-5 w-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl font-extrabold text-foreground">
                                        {tps.nama ?? `TPS #${String(tps.id).padStart(5, '0')}`}
                                    </h1>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                                                tps.aktif
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                        >
                                            {tps.aktif ? 'AKTIF' : 'NONAKTIF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <dl className="mt-6 space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Latitude
                                        </dt>
                                        <dd className="font-mono font-medium">
                                            {tps.latitude.toFixed(6)}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Longitude
                                        </dt>
                                        <dd className="font-mono font-medium">
                                            {tps.longitude.toFixed(6)}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Ditambahkan
                                        </dt>
                                        <dd className="font-medium">
                                            {tps.created_at ?? '—'}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <dt className="text-xs text-muted-foreground">
                                            Terakhir diperbarui
                                        </dt>
                                        <dd className="font-medium">
                                            {tps.updated_at ?? '—'}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-3">
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-sm font-semibold">
                                Pratinjau Lokasi
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Visualisasi titik TPS di peta
                            </p>
                        </div>
                        <div className="h-[420px] w-full">
                            <Map center={DEFAULT_CENTER} zoom={12} theme={theme}>
                                <MapControls
                                    position="top-right"
                                    showZoom
                                    showFullscreen
                                />
                                <FitSinglePoint lngLat={lngLat} />
                                <TpsMarker lngLat={lngLat} />
                            </Map>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

TpsResmiShow.layout = {
    breadcrumbs: [
        { title: 'TPS Resmi', href: '/admin/tps-resmi' },
        { title: 'Detail TPS', href: '#' },
    ],
};
