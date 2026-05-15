import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
    Map,
    MapControls,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MarkerTooltip,
    MarkerLabel,
} from '@/components/ui/map';
import { MapPin, Filter, Layers } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'menunggu' | 'diproses' | 'selesai' | 'ditolak';

interface Laporan {
    id: number;
    latitude: number;
    longitude: number;
    alamat: string;
    status: Status;
    tanggal: string;
    pelapor: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    Status,
    { label: string; color: string; pill: string; dot: string }
> = {
    menunggu: {
        label: 'Menunggu',
        color: '#f59e0b',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    diproses: {
        label: 'Diproses',
        color: '#3b82f6',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
    },
    selesai: {
        label: 'Selesai',
        color: '#10b981',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
    ditolak: {
        label: 'Ditolak',
        color: '#ef4444',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
    },
};

const DEFAULT_CENTER: [number, number] = [119.4327, -5.1477];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Peta() {
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof document === 'undefined') return 'light';
        return document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light';
    });

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

    const fetchData = useCallback(async (status: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            const res = await fetch(`/admin/peta/data?${params.toString()}`);
            const data: Laporan[] = await res.json();
            setLaporan(data);
        } catch (err) {
            console.error('Gagal mengambil data laporan:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(filterStatus);
    }, [filterStatus, fetchData]);

    const mapCenter: [number, number] =
        laporan.length > 0
            ? [
                  laporan.reduce((s, l) => s + l.longitude, 0) / laporan.length,
                  laporan.reduce((s, l) => s + l.latitude, 0) / laporan.length,
              ]
            : DEFAULT_CENTER;

    return (
        <>
            <Head title="Peta Laporan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* ── Header ── */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-extrabold text-foreground">
                        Peta Sebaran Laporan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Visualisasi lokasi laporan sampah berdasarkan koordinat
                        GPS
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const count = laporan.filter(
                            (l) => l.status === key,
                        ).length;
                        const active = filterStatus === key;
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    setFilterStatus(active ? '' : key);
                                }}
                                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                                    active
                                        ? `border-transparent ring-2 ring-offset-1 ${cfg.pill}`
                                        : 'border-border bg-card hover:bg-muted/50'
                                }`}
                            >
                                <span
                                    className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot}`}
                                    aria-hidden
                                />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                        {cfg.label}
                                    </p>
                                    <p className="text-xl font-extrabold text-foreground">
                                        {count}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ── Filter Bar ── */}
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                        Filter:
                    </span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="">Semua Status</option>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>
                                {cfg.label}
                            </option>
                        ))}
                    </select>

                    <span className="ml-auto text-xs text-muted-foreground">
                        {loading
                            ? 'Memuat...'
                            : `${laporan.length} laporan ditemukan`}
                    </span>

                    {filterStatus && (
                        <button
                            onClick={() => setFilterStatus('')}
                            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                            Reset filter
                        </button>
                    )}
                </div>

                {/* ── Map ── */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="h-[480px] w-full sm:h-[560px]">
                        {/*
                            theme prop tidak diberikan → Map akan auto-detect dari:
                            1. class="dark" pada <html>
                            2. data-theme="dark" pada <html>
                            3. system preference
                        */}
                        <Map
                            center={mapCenter}
                            zoom={laporan.length > 0 ? 11 : 12}
                            loading={loading}
                            theme={theme}
                        >
                            <MapControls
                                position="top-right"
                                showZoom
                                showLocate
                                showFullscreen
                                showCompass
                            />

                            {laporan.map((item) => {
                                const cfg = STATUS_CONFIG[item.status];
                                return (
                                    <MapMarker
                                        key={item.id}
                                        longitude={item.longitude}
                                        latitude={item.latitude}
                                    >
                                        {/* Dot marker berwarna sesuai status */}
                                        <MarkerContent>
                                            <div
                                                className="h-4 w-4 cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                                                style={{
                                                    backgroundColor:
                                                        cfg?.color ?? '#6b7280',
                                                }}
                                            />
                                        </MarkerContent>

                                        {/* Tooltip muncul saat hover */}
                                        <MarkerTooltip>
                                            <span className="font-semibold">
                                                {item.pelapor}
                                            </span>
                                            <br />
                                            <span className="text-muted-foreground">
                                                {item.alamat}
                                            </span>
                                        </MarkerTooltip>

                                        {/* Popup muncul saat klik marker */}
                                        <MarkerPopup closeButton>
                                            <PopupCard laporan={item} />
                                        </MarkerPopup>
                                    </MapMarker>
                                );
                            })}
                        </Map>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
                        <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Keterangan:
                            </span>
                        </div>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <div
                                key={key}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                                    style={{ backgroundColor: cfg.color }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {cfg.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Tabel ── */}
                {!loading && laporan.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <h3 className="text-base font-extrabold text-foreground">
                                Daftar Laporan
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({laporan.length} data)
                                </span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-5 py-3 text-left">
                                            ID
                                        </th>
                                        <th className="px-5 py-3 text-left">
                                            Pelapor
                                        </th>
                                        <th className="px-5 py-3 text-left">
                                            Alamat
                                        </th>
                                        <th className="px-5 py-3 text-left">
                                            Tanggal
                                        </th>
                                        <th className="px-5 py-3 text-left">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {laporan.map((item) => {
                                        const cfg = STATUS_CONFIG[item.status];
                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                                                    #
                                                    {String(item.id).padStart(
                                                        5,
                                                        '0',
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 font-semibold text-foreground">
                                                    {item.pelapor}
                                                </td>
                                                <td className="max-w-[200px] truncate px-5 py-3 text-muted-foreground">
                                                    {item.alamat}
                                                </td>
                                                <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                                                    {item.tanggal}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg?.pill}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${cfg?.dot}`}
                                                        />
                                                        {cfg?.label ??
                                                            item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && laporan.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                        <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-muted-foreground">
                            Tidak ada laporan ditemukan
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {filterStatus
                                ? 'Coba reset filter status.'
                                : 'Belum ada laporan dengan koordinat GPS.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Popup Card ───────────────────────────────────────────────────────────────

function PopupCard({ laporan }: { laporan: Laporan }) {
    const cfg = STATUS_CONFIG[laporan.status];
    return (
        <div className="max-w-[260px] min-w-[200px] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                    #{String(laporan.id).padStart(5, '0')}
                </span>
                <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg?.pill}`}
                >
                    {cfg?.label ?? laporan.status}
                </span>
            </div>
            <p className="text-sm font-bold text-foreground">
                {laporan.pelapor}
            </p>
            <p className="text-xs text-muted-foreground">{laporan.alamat}</p>
            <p className="text-[11px] text-muted-foreground">
                {laporan.tanggal}
            </p>
        </div>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

Peta.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Peta Laporan', href: '#' },
    ],
};
