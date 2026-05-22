import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Map, MapControls } from '@/components/ui/map';
import maplibregl from 'maplibre-gl';
import { ExternalLink, Filter, Layers, MapPin } from 'lucide-react';
import { X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PetaStatus =
    | 'menunggu'
    | 'diverifikasi'
    | 'diproses'
    | 'selesai'
    | 'ditolak';

interface Laporan {
    id: number;
    latitude: number;
    longitude: number;
    alamat: string;
    status: PetaStatus;
    tanggal: string;
    pelapor: string;
}

const STATUS_CONFIG: Record<
    PetaStatus,
    { label: string; color: string; pill: string; dot: string; ring: string }
> = {
    menunggu: {
        label: 'Menunggu',
        color: '#f59e0b',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
        ring: 'ring-amber-400',
    },
    diverifikasi: {
        label: 'Diverifikasi',
        color: '#3b82f6',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
        ring: 'ring-blue-400',
    },
    diproses: {
        label: 'Diproses',
        color: '#f97316',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        dot: 'bg-orange-500',
        ring: 'ring-orange-400',
    },
    selesai: {
        label: 'Selesai',
        color: '#10b981',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-400',
    },
    ditolak: {
        label: 'Ditolak',
        color: '#ef4444',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
        ring: 'ring-red-400',
    },
};

const PETA_STATUSES = Object.keys(STATUS_CONFIG) as PetaStatus[];

const PALU_CENTER: [number, number] = [119.87, -0.899];
const PALU_ZOOM = 8;

// ─── Marker DOM element ───────────────────────────────────────────────────────
// Dibuat sebagai DOM biasa (bukan React) supaya bisa dipakai oleh
// maplibregl.Marker({ element, anchor: 'bottom' }) yang benar-benar
// menempatkan titik bawah element tepat di koordinat.

function createMarkerElement(color: string, onClick: () => void): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;

    // Lingkaran
    const circle = document.createElement('div');
    circle.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid #fff;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s;
        flex-shrink: 0;
    `;
    circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="rgba(0,0,0,0.3)" stroke="none"/></svg>`;

    wrap.addEventListener('mouseenter', () => {
        circle.style.transform = 'scale(1.12)';
    });
    wrap.addEventListener('mouseleave', () => {
        circle.style.transform = 'scale(1)';
    });

    // Ekor segitiga
    const tail = document.createElement('div');
    tail.style.cssText = `
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 9px solid ${color};
        margin-top: -1px;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
        flex-shrink: 0;
    `;

    wrap.appendChild(circle);
    wrap.appendChild(tail);
    wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });

    return wrap;
}

// ─── Popup Card (React) ───────────────────────────────────────────────────────

function PopupCard({
    laporan,
    onClose,
}: {
    laporan: Laporan;
    onClose: () => void;
}) {
    const cfg = STATUS_CONFIG[laporan.status] ?? STATUS_CONFIG.menunggu;

    return (
        <div
            style={{
                width: 260,
                borderRadius: 14,
                overflow: 'visible',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                background: 'var(--color-card, #fff)',
                border: '1px solid var(--color-border, #e5e7eb)',
                position: 'relative',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            {/* ── Header ── */}
            <div
                style={{
                    background: cfg.color,
                    borderRadius: '14px 14px 0 0',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    position: 'relative',
                }}
            >
                {/* Ikon */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.25)',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <MapPin
                        size={16}
                        color="#fff"
                        fill="#fff"
                        strokeWidth={2}
                    />
                </div>

                {/* ID */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: 10,
                            fontWeight: 700,
                            margin: 0,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Laporan
                    </p>
                    <p
                        style={{
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 800,
                            margin: 0,
                            fontFamily: 'monospace',
                        }}
                    >
                        #{String(laporan.id).padStart(5, '0')}
                    </p>
                </div>

                {/* Badge status — di kanan ID, SEBELUM tombol close */}
                <span
                    style={{
                        background: 'rgba(255,255,255,0.22)',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 20,
                        padding: '3px 9px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    {cfg.label}
                </span>

                {/* Tombol close — paling kanan, TIDAK menimpa badge */}
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(0,0,0,0.20)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        color: '#fff',
                        padding: 0,
                        
                    }}
                    aria-label="Tutup"
                >
                    <X size={14} strokeWidth={3} />
                </button>
            </div>

            {/* ── Body ── */}
            <div
                style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                }}
            >
                {/* Pelapor */}
                <div>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--color-muted-foreground, #6b7280)',
                            margin: '0 0 2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Pelapor
                    </p>
                    <p
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--color-foreground, #111)',
                            margin: 0,
                        }}
                    >
                        {laporan.pelapor}
                    </p>
                </div>

                {/* Alamat */}
                <div>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--color-muted-foreground, #6b7280)',
                            margin: '0 0 2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Alamat
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            color: 'var(--color-foreground, #374151)',
                            margin: 0,
                            lineHeight: 1.45,
                        }}
                    >
                        {laporan.alamat || '—'}
                    </p>
                </div>

                {/* Koordinat — vertikal */}
                <div>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--color-muted-foreground, #6b7280)',
                            margin: '0 0 2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Koordinat
                    </p>
                    <p
                        style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: 'var(--color-foreground, #374151)',
                            margin: 0,
                            lineHeight: 1.5,
                        }}
                    >
                        {laporan.latitude.toFixed(6)},{' '}
                        {laporan.longitude.toFixed(6)}
                    </p>
                </div>

                {/* Tanggal — vertikal, di bawah koordinat */}
                <div>
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--color-muted-foreground, #6b7280)',
                            margin: '0 0 2px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Tanggal
                    </p>
                    <p
                        style={{
                            fontSize: 12,
                            color: 'var(--color-foreground, #374151)',
                            margin: 0,
                        }}
                    >
                        {laporan.tanggal}
                    </p>
                </div>

                <div
                    style={{
                        borderTop: '1px solid var(--color-border, #e5e7eb)',
                        margin: '0',
                    }}
                />

                {/* CTA */}
                <Link
                    href={`/admin/laporan/${laporan.id}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: cfg.color,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 8,
                        padding: '8px 0',
                        textDecoration: 'none',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.opacity =
                            '0.85')
                    }
                    onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.opacity =
                            '1')
                    }
                >
                    Lihat Detail
                    <ExternalLink size={13} />
                </Link>
            </div>

            {/* ── Segitiga bawah popup (ekor mengarah ke marker) ── */}
            <div
                style={{
                    position: 'absolute',
                    bottom: -11,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: '11px solid var(--color-border, #e5e7eb)',
                    zIndex: 1,
                }}
            />
            {/* Segitiga putih (sedikit lebih kecil) untuk efek border */}
            <div
                style={{
                    position: 'absolute',
                    bottom: -9,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '9px solid transparent',
                    borderRight: '9px solid transparent',
                    borderTop: '10px solid var(--color-card, #fff)',
                    zIndex: 2,
                }}
            />
        </div>
    );
}

// ─── Hook: native maplibre markers ───────────────────────────────────────────
// Menggunakan maplibregl.Marker({ element, anchor: 'bottom' }) langsung
// sehingga titik bawah pin SELALU tepat di koordinat, di semua zoom level.

function useNativeMarkers(
    map: maplibregl.Map | null,
    laporan: Laporan[],
    onMarkerClick: (item: Laporan) => void,
) {
    const markersRef = useRef<maplibregl.Marker[]>([]);

    useEffect(() => {
        // Hapus marker lama
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        if (!map) return;

        laporan.forEach((item) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.menunggu;
            const el = createMarkerElement(cfg.color, () =>
                onMarkerClick(item),
            );

            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'bottom',
            })
                .setLngLat([item.longitude, item.latitude])
                .addTo(map);

            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
        };
        // onMarkerClick sengaja tidak di-include agar tidak re-render setiap klik
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, laporan]);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Peta() {
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapReady, setMapReady] = useState(false);

    const popupRef = useRef<maplibregl.Popup | null>(null);
    const popupRootRef = useRef<Root | null>(null);

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

    const closePopup = useCallback(() => {
        popupRef.current?.remove();
        popupRef.current = null;
        if (popupRootRef.current) {
            const root = popupRootRef.current;
            popupRootRef.current = null;
            queueMicrotask(() => root.unmount());
        }
    }, []);

    const openPopup = useCallback(
        (item: Laporan) => {
            const map = mapRef.current;
            if (!map) return;

            closePopup();

            const container = document.createElement('div');
            const root = createRoot(container);
            popupRootRef.current = root;

            // onClose di-pass ke PopupCard supaya tombol × React bisa tutup popup
            const doClose = () => {
                popup.remove();
                closePopup();
            };

            root.render(<PopupCard laporan={item} onClose={doClose} />);

            // offset: popup muncul tepat di atas marker.
            // Tinggi marker (circle 36px + tail 9px) = ~45px, tambah sedikit jarak
            const popup = new maplibregl.Popup({
                closeButton: false, // kita pakai tombol close di dalam React
                closeOnClick: false,
                anchor: 'bottom',
                offset: [0, -52], // geser ke atas sejauh tinggi marker
                className: 'mapcn-popup--clean',
                maxWidth: '280px',
            })
                .setLngLat([item.longitude, item.latitude])
                .setDOMContent(container)
                .addTo(map);

            popup.on('close', closePopup);
            popupRef.current = popup;
        },
        [closePopup],
    );

    useEffect(() => {
        closePopup();
        fetchData(filterStatus);
    }, [filterStatus, fetchData, closePopup]);

    // Native markers — anchor: 'bottom' otomatis tepat di koordinat
    useNativeMarkers(mapReady ? mapRef.current : null, laporan, openPopup);

    return (
        <>
            <Head title="Peta Laporan" />

            <style>{`
                .mapcn-popup--clean .maplibregl-popup-content {
                    padding: 0 !important;
                    border-radius: 14px !important;
                    box-shadow: none !important;
                    background: transparent !important;
                    overflow: visible !important;
                }
                .mapcn-popup--clean .maplibregl-popup-tip {
                    display: none !important;
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-extrabold text-foreground">
                        Peta Sebaran Laporan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Visualisasi lokasi laporan tempat pembuangan sampah
                        ilegal di Kota Palu
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {PETA_STATUSES.map((key) => {
                        const cfg = STATUS_CONFIG[key];
                        const count = laporan.filter(
                            (l) => l.status === key,
                        ).length;
                        const active = filterStatus === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() =>
                                    setFilterStatus(active ? '' : key)
                                }
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
                                        {filterStatus === '' || active
                                            ? count
                                            : '—'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Filter bar */}
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
                        {PETA_STATUSES.map((key) => (
                            <option key={key} value={key}>
                                {STATUS_CONFIG[key].label}
                            </option>
                        ))}
                    </select>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {loading
                            ? 'Memuat...'
                            : `${laporan.length} laporan di peta`}
                    </span>
                    {filterStatus && (
                        <button
                            type="button"
                            onClick={() => setFilterStatus('')}
                            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                            Reset filter
                        </button>
                    )}
                </div>

                {/* Map */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="h-[480px] w-full sm:h-[560px]">
                        <Map
                            center={PALU_CENTER}
                            zoom={PALU_ZOOM}
                            loading={loading}
                            theme={theme}
                            onLoad={(map) => {
                                mapRef.current = map;
                                setMapReady(true);
                            }}
                        >
                            <MapControls
                                position="top-right"
                                showZoom
                                showLocate
                                showFullscreen
                                showCompass
                            />
                            {/* Marker di-render via useNativeMarkers, bukan MapMarker */}
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
                        {PETA_STATUSES.map((key) => (
                            <div
                                key={key}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                                    style={{
                                        backgroundColor:
                                            STATUS_CONFIG[key].color,
                                    }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {STATUS_CONFIG[key].label}
                                </span>
                            </div>
                        ))}
                        <span className="ml-auto text-[11px] text-muted-foreground/60">
                            Klik marker untuk detail laporan
                        </span>
                    </div>
                </div>

                {/* Table */}
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
                                        <th className="px-5 py-3 text-left">
                                            Aksi
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
                                                        {cfg?.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <Link
                                                        href={`/admin/laporan/${item.id}`}
                                                        className="text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-300"
                                                    >
                                                        Detail →
                                                    </Link>
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

Peta.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Peta Laporan', href: '#' },
    ],
};
