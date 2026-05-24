import { Head } from '@inertiajs/react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import {
    Filter,
    MapPin,
    RotateCcw,
    X,
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import FadeIn from '@/components/fade-in';
import { Map, MapControls, useMap } from '@/components/ui/map';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Button } from '@/components/ui/button';

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
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    PetaStatus,
    { label: string; color: string; pill: string; dot: string }
> = {
    menunggu: {
        label: 'Menunggu',
        color: '#f59e0b',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    diverifikasi: {
        label: 'Diverifikasi',
        color: '#3b82f6',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
    },
    diproses: {
        label: 'Diproses',
        color: '#f97316',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        dot: 'bg-orange-500',
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

const PETA_STATUSES = Object.keys(STATUS_CONFIG) as PetaStatus[];

const PALU_CENTER: [number, number] = [119.87, -0.899];
const PALU_ZOOM = 8;

const KELURAHAN_SOURCE = 'kelurahan-selected';
const KELURAHAN_FILL = 'kelurahan-fill';
const KELURAHAN_BORDER = 'kelurahan-border';

interface KelurahanProperties {
    kelurahan: string;
    kecamatan: string;
}

type KelurahanFeature = Feature<Polygon | MultiPolygon, KelurahanProperties>;

interface KelurahanGeoJSON {
    type: 'FeatureCollection';
    features: KelurahanFeature[];
}

// ─── Laporan marker DOM element ───────────────────────────────────────────────

function createMarkerElement(color: string, onClick: () => void): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText =
        'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;';
    const circle = document.createElement('div');
    circle.style.cssText = `width:36px;height:36px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:transform 0.15s;flex-shrink:0;`;
    circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="rgba(0,0,0,0.3)" stroke="none"/></svg>`;
    wrap.addEventListener('mouseenter', () => {
        circle.style.transform = 'scale(1.12)';
    });
    wrap.addEventListener('mouseleave', () => {
        circle.style.transform = 'scale(1)';
    });
    const tail = document.createElement('div');
    tail.style.cssText = `width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${color};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));flex-shrink:0;`;
    wrap.appendChild(circle);
    wrap.appendChild(tail);
    wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });

    return wrap;
}

// ─── Laporan popup card (React) ───────────────────────────────────────────────

function LaporanPopupCard({
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
                background: 'var(--color-card,#fff)',
                border: '1px solid var(--color-border,#e5e7eb)',
                position: 'relative',
                fontFamily: 'system-ui,sans-serif',
            }}
        >
            <div
                style={{
                    background: cfg.color,
                    borderRadius: '14px 14px 0 0',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
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
            <div
                style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                }}
            >
                {[
                    {
                        label: 'Alamat',
                        value: laporan.alamat || '—',
                        style: { fontSize: 12, lineHeight: 1.45 },
                    },
                    {
                        label: 'Koordinat',
                        value: `${laporan.latitude.toFixed(6)}, ${laporan.longitude.toFixed(6)}`,
                        style: { fontSize: 11, fontFamily: 'monospace' },
                    },
                    {
                        label: 'Tanggal',
                        value: laporan.tanggal,
                        style: { fontSize: 12 },
                    },
                ].map(({ label, value, style }) => (
                    <div key={label}>
                        <p
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--color-muted-foreground,#6b7280)',
                                margin: '0 0 2px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}
                        >
                            {label}
                        </p>
                        <p
                            style={{
                                color: 'var(--color-foreground,#374151)',
                                margin: 0,
                                ...style,
                            }}
                        >
                            {value}
                        </p>
                    </div>
                ))}
            </div>
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
                    borderTop: '11px solid var(--color-border,#e5e7eb)',
                    zIndex: 1,
                }}
            />
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
                    borderTop: '10px solid var(--color-card,#fff)',
                    zIndex: 2,
                }}
            />
        </div>
    );
}

// ─── Layer polygon kelurahan terpilih (filter laporan) ───────────────────────

function KelurahanPolygonLayer({
    geojson,
    selected,
}: {
    geojson: KelurahanGeoJSON;
    selected: string;
}) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded || !selected) {
            return;
        }

        const filtered: KelurahanGeoJSON = {
            type: 'FeatureCollection',
            features: geojson.features.filter(
                (f) => f.properties.kelurahan === selected,
            ),
        };

        if (!map.getSource(KELURAHAN_SOURCE)) {
            map.addSource(KELURAHAN_SOURCE, {
                type: 'geojson',
                data: filtered,
            });
            map.addLayer({
                id: KELURAHAN_FILL,
                type: 'fill',
                source: KELURAHAN_SOURCE,
                paint: { 'fill-color': '#10b981', 'fill-opacity': 0.15 },
            });
            map.addLayer({
                id: KELURAHAN_BORDER,
                type: 'line',
                source: KELURAHAN_SOURCE,
                paint: { 'line-color': '#10b981', 'line-width': 2 },
            });
        } else {
            const src = map.getSource(
                KELURAHAN_SOURCE,
            ) as maplibregl.GeoJSONSource;
            src.setData(filtered);
        }

        // ── Zoom ke polygon yang dipilih ──────────────────────────
        if (filtered.features.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            filtered.features.forEach((f) => {
                const coords =
                    f.geometry.type === 'Polygon'
                        ? f.geometry.coordinates[0]
                        : f.geometry.coordinates[0][0]; // MultiPolygon
                coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: 80,
                    maxZoom: 15,
                    duration: 700,
                });
            }
        }

        return () => {
            if (!map || (map as any)._removed) {
                return;
            }

            try {
                if (map.getLayer(KELURAHAN_BORDER)) {
                    map.removeLayer(KELURAHAN_BORDER);
                }

                if (map.getLayer(KELURAHAN_FILL)) {
                    map.removeLayer(KELURAHAN_FILL);
                }

                if (map.getSource(KELURAHAN_SOURCE)) {
                    map.removeSource(KELURAHAN_SOURCE);
                }
            } catch {
                // ignore
            }
        };
    }, [map, isLoaded, geojson, selected]);

    return null;
}

// ─── Hook: native laporan markers ─────────────────────────────────────────────

function useNativeMarkers(
    map: maplibregl.Map | null,
    laporan: Laporan[],
    onMarkerClick: (item: Laporan) => void,
) {
    const markersRef = useRef<maplibregl.Marker[]>([]);
    useEffect(() => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        if (!map) {
            return;
        }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, laporan]);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PetaLaporan() {
    // ── Laporan ──
    const [laporan, setLaporan] = useState<Laporan[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // ── Filter kelurahan laporan (GeoJSON batas wilayah) ──
    const [filterKecamatan, setFilterKecamatan] = useState<string>('');
    const [kelurahanGeoJson, setKelurahanGeoJson] =
        useState<KelurahanGeoJSON | null>(null);
    const [kelurahanList, setKelurahanList] = useState<string[]>([]);
    const [kecamatanList, setKecamatanList] = useState<string[]>([]);
    const [filterKelurahan, setFilterKelurahan] = useState<string>('');

        // ── Map ──
    const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const popupRootRef = useRef<Root | null>(null);

    // ── Theme ──
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof document === 'undefined') {
            return 'light';
        }

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

    // ── Fetch laporan ──
    const fetchLaporan = useCallback(async (status: string) => {
        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (status) {
                params.set('status', status);
            }

            const res = await fetch(`/user/peta/data?${params.toString()}`);
            setLaporan(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLaporan(filterStatus);
        }, 0);

        return () => clearTimeout(timer);
    }, [filterStatus, fetchLaporan]);

    // ── Load GeoJSON batas kelurahan Palu ──
    useEffect(() => {
        fetch('/geojson/kelurahan_palu.geojson')
            .then((r) => r.json())
            .then((data: KelurahanGeoJSON) => {
                setKelurahanGeoJson(data);

                // Kecamatan unik
                const kecamatans = [
                    ...new Set(
                        data.features
                            .map((f) => f.properties?.kecamatan)
                            .filter((k): k is string => Boolean(k)),
                    ),
                ].sort((a, b) => a.localeCompare(b, 'id'));
                setKecamatanList(kecamatans);

                // Semua kelurahan (untuk saat kecamatan belum dipilih)
                const names = [
                    ...new Set(
                        data.features
                            .map((f) => f.properties?.kelurahan)
                            .filter((n): n is string => Boolean(n)),
                    ),
                ].sort((a, b) => a.localeCompare(b, 'id'));
                setKelurahanList(names);
            })
            .catch(console.error);
    }, []);

    const filteredKelurahanList = useMemo(() => {
        if (!filterKecamatan || !kelurahanGeoJson) {
            return kelurahanList;
        }

        return [
            ...new Set(
                kelurahanGeoJson.features
                    .filter((f) => f.properties.kecamatan === filterKecamatan)
                    .map((f) => f.properties.kelurahan)
                    .filter((n): n is string => Boolean(n)),
            ),
        ].sort((a, b) => a.localeCompare(b, 'id'));
    }, [filterKecamatan, kelurahanGeoJson, kelurahanList]);

    const filteredLaporan = useMemo(() => {
        if (!filterKelurahan || !kelurahanGeoJson) {
            return laporan;
        }

        const feature = kelurahanGeoJson.features.find(
            (f) => f.properties.kelurahan === filterKelurahan,
        );

        if (!feature) {
            return laporan;
        }

        return laporan.filter((item) => {
            const pt = point([item.longitude, item.latitude]);

            return booleanPointInPolygon(pt, feature);
        });
    }, [laporan, filterKelurahan, kelurahanGeoJson]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterKelurahan('');
        }, 0);

        return () => clearTimeout(timer);
    }, [filterKecamatan]);

    useEffect(() => {
        if (!filterKecamatan || !kelurahanGeoJson || !mapInstance) {
            return;
        }

        const features = kelurahanGeoJson.features.filter(
            (f) => f.properties.kecamatan === filterKecamatan,
        );

        if (features.length === 0) {
            return;
        }

        const bounds = new maplibregl.LngLatBounds();
        features.forEach((f) => {
            const coords =
                f.geometry.type === 'Polygon'
                    ? f.geometry.coordinates[0]
                    : f.geometry.coordinates[0][0]; // MultiPolygon
            coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        });

        if (!bounds.isEmpty()) {
            mapInstance.fitBounds(bounds, {
                padding: 80,
                maxZoom: 14,
                duration: 700,
            });
        }
    }, [filterKecamatan, kelurahanGeoJson, mapInstance]);

    // ── Laporan popup ──
    const closeLaporanPopup = useCallback(() => {
        popupRef.current?.remove();
        popupRef.current = null;

        if (popupRootRef.current) {
            const root = popupRootRef.current;
            popupRootRef.current = null;
            queueMicrotask(() => root.unmount());
        }
    }, []);

    const openLaporanPopup = useCallback(
        (item: Laporan) => {
            const map = mapInstance;

            if (!map) {
                return;
            }

            closeLaporanPopup();
            const container = document.createElement('div');
            const root = createRoot(container);
            popupRootRef.current = root;
            const doClose = () => {
                popup.remove();
                closeLaporanPopup();
            };
            root.render(<LaporanPopupCard laporan={item} onClose={doClose} />);
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                anchor: 'bottom',
                offset: [0, -52],
                className: 'mapcn-popup--clean',
                maxWidth: '280px',
            })
                .setLngLat([item.longitude, item.latitude])
                .setDOMContent(container)
                .addTo(map);
            popup.on('close', closeLaporanPopup);
            popupRef.current = popup;
        },
        [closeLaporanPopup, mapInstance],
    );

    useEffect(() => {
        closeLaporanPopup();
    }, [filterStatus, filterKelurahan, closeLaporanPopup]);

    useNativeMarkers(
        mapInstance,
        filteredLaporan,
        openLaporanPopup,
    );

    return (
        <>
            <Head title="Peta Laporan" />

            <style>{`
                .mapcn-popup--clean .maplibregl-popup-content {
                    padding:0!important;border-radius:14px!important;
                    box-shadow:none!important;background:transparent!important;overflow:visible!important;
                }
                .mapcn-popup--clean .maplibregl-popup-tip { display:none!important; }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="max-w-2xl">
                    <FadeIn delay={100}>
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                            Peta Sebaran Laporan
                        </h1>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                            Visualisasi lokasi laporan sampah di Kota Palu
                        </p>
                    </FadeIn>
                </div>

                {/* Stat cards laporan */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {PETA_STATUSES.map((key) => {
                        const cfg = STATUS_CONFIG[key];
                        const count = filteredLaporan.filter(
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
                                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${active ? `border-transparent ring-2 ring-offset-1 ${cfg.pill}` : 'border-border bg-card hover:bg-muted/50'}`}
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

                {/* Filter bar laporan */}
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                        Filter Laporan:
                    </span>

                    {/* Status */}
                    <Select
                        value={filterStatus || 'all'}
                        onValueChange={(v) =>
                            setFilterStatus(v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger className="h-9 w-[160px] border-input bg-background font-normal shadow-sm focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:bg-input/30 dark:hover:bg-input/45">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            className="min-w-[var(--radix-select-trigger-width)] rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
                        >
                            <SelectItem
                                value="all"
                                className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground dark:focus:bg-emerald-500/15"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="size-2 shrink-0 rounded-full bg-muted-foreground/35 ring-1 ring-border" />
                                    <span className="text-sm">
                                        Semua Status
                                    </span>
                                </span>
                            </SelectItem>
                            {[
                                {
                                    value: 'menunggu',
                                    label: 'Menunggu',
                                    dot: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.25)]',
                                },
                                {
                                    value: 'diverifikasi',
                                    label: 'Diverifikasi',
                                    dot: 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]',
                                },
                                {
                                    value: 'diproses',
                                    label: 'Diproses',
                                    dot: 'bg-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.25)]',
                                },
                                {
                                    value: 'selesai',
                                    label: 'Selesai',
                                    dot: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
                                },
                                {
                                    value: 'ditolak',
                                    label: 'Ditolak',
                                    dot: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.25)]',
                                },
                            ].map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground dark:focus:bg-emerald-500/15"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <span
                                            className={`size-2 shrink-0 rounded-full ${opt.dot}`}
                                        />
                                        <span className="text-sm">
                                            {opt.label}
                                        </span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Kecamatan */}
                    <Select
                        value={filterKecamatan || 'all'}
                        onValueChange={(v) =>
                            setFilterKecamatan(v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger className="h-9 w-[180px] border-input bg-background font-normal shadow-sm focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:bg-input/30 dark:hover:bg-input/45">
                            <SelectValue placeholder="Semua Kecamatan" />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            className="rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
                        >
                            <SelectItem
                                value="all"
                                className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground"
                            >
                                <span className="text-sm">Semua Kecamatan</span>
                            </SelectItem>
                            {kecamatanList.map((k) => (
                                <SelectItem
                                    key={k}
                                    value={k}
                                    className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground"
                                >
                                    <span className="text-sm">{k}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Kelurahan */}
                    <Select
                        value={filterKelurahan || 'all'}
                        onValueChange={(v) =>
                            setFilterKelurahan(v === 'all' ? '' : v)
                        }
                        disabled={!filterKecamatan}
                    >
                        <SelectTrigger className="h-9 w-[180px] border-input bg-background font-normal shadow-sm focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/45">
                            <SelectValue
                                placeholder={
                                    filterKecamatan
                                        ? 'Semua Kelurahan'
                                        : 'Pilih kecamatan dulu'
                                }
                            />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            className="rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
                        >
                            <SelectItem
                                value="all"
                                className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground"
                            >
                                <span className="text-sm">Semua Kelurahan</span>
                            </SelectItem>
                            {filteredKelurahanList.map((k) => (
                                <SelectItem
                                    key={k}
                                    value={k}
                                    className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground"
                                >
                                    <span className="text-sm">{k}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="ml-auto text-xs text-muted-foreground">
                        {loading
                            ? 'Memuat...'
                            : `${filteredLaporan.length} laporan di peta`}
                    </span>

                    {(filterStatus || filterKecamatan || filterKelurahan) && (
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => {
                                setFilterStatus('');
                                setFilterKecamatan('');
                                setFilterKelurahan('');
                            }}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset Filter
                        </Button>
                    )}
                </div>

                {/* Peta */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="h-[480px] w-full sm:h-[560px]">
                        <Map
                            center={PALU_CENTER}
                            zoom={PALU_ZOOM}
                            loading={loading}
                            theme={theme}
                            onLoad={(map) => {
                                setMapInstance(map);
                            }}
                        >
                            <MapControls
                                position="top-right"
                                showZoom
                                showLocate
                                showFullscreen
                                showCompass
                            />

                            {mapInstance &&
                                filterKelurahan &&
                                kelurahanGeoJson && (
                                    <KelurahanPolygonLayer
                                        geojson={kelurahanGeoJson}
                                        selected={filterKelurahan}
                                    />
                                )}
                        </Map>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Status Laporan:
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

                {/* Tabel laporan */}
                {!loading && filteredLaporan.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <h3 className="text-base font-extrabold text-foreground">
                                Daftar Laporan
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({filteredLaporan.length} data)
                                </span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        {[
                                            'ID',
                                            'Alamat',
                                            'Tanggal',
                                            'Status',
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="px-5 py-3 text-center"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredLaporan.map((item) => {
                                        const cfg = STATUS_CONFIG[item.status];

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="px-5 py-3 text-center font-mono text-xs text-muted-foreground">
                                                    #
                                                    {String(item.id).padStart(
                                                        5,
                                                        '0',
                                                    )}
                                                </td>
                                                <td className="max-w-[300px] truncate px-5 py-3 text-center text-muted-foreground">
                                                    {item.alamat || '—'}
                                                </td>
                                                <td className="px-5 py-3 text-center whitespace-nowrap text-muted-foreground">
                                                    {item.tanggal}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg?.pill}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${cfg?.dot}`}
                                                        />
                                                        {cfg?.label}
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

                {!loading && filteredLaporan.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                        <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-muted-foreground">
                            Tidak ada laporan ditemukan
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {filterStatus || filterKecamatan || filterKelurahan
                                ? 'Coba reset filter status atau kelurahan.'
                                : 'Belum ada laporan dengan koordinat GPS.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

import UserLayout from '@/layouts/user-layout';
PetaLaporan.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;
