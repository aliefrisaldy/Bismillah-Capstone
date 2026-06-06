import { Head, Link } from '@inertiajs/react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import {
    ExternalLink,
    Filter,
    Layers,
    MapPin,
    Route,
    X,
    ChevronDown,
    Eye,
    EyeOff,
    Loader2,
    Pencil,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import {
    Map,
    MapControls,
    MapRoute,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
} from '@/components/ui/map';
import { useMap } from '@/components/ui/map';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';


import { JalurMapPopup } from '@/components/map/jalur-popup-card';
import type { JalurFeature } from '@/components/map/jalur-popup-card';

// ─── Types ────────────────────────────────────────────────────────────────────

type PetaStatus =
    | 'menunggu'
    | 'diverifikasi'
    | 'diproses'
    | 'selesai'
    | 'ditolak';
type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

interface Laporan {
    id: number;
    latitude: number;
    longitude: number;
    alamat: string;
    status: PetaStatus;
    tanggal: string;
    pelapor: string;
}

interface TpsResmi {
    id: number;
    latitude: number;
    longitude: number;
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

const TIPE_CONFIG: Record<
    TipeKendaraan,
    { label: string; warna: string; pill: string; dot: string }
> = {
    'Pick Up': {
        label: 'Pick Up',
        warna: '#e74c3c',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
    },
    Kaisar: {
        label: 'Kaisar',
        warna: '#3498db',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
    },
    R6: {
        label: 'R6',
        warna: '#2ecc71',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
};

const PETA_STATUSES = Object.keys(STATUS_CONFIG) as PetaStatus[];
const TIPE_KENDARAAN = Object.keys(TIPE_CONFIG) as TipeKendaraan[];

const PALU_CENTER: [number, number] = [119.87, -0.899];
const PALU_ZOOM = 8;

const JALUR_SOURCE = 'jalur-angkut-src';
const JALUR_LAYER = 'jalur-angkut-lines';

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
                        label: 'Pelapor',
                        value: laporan.pelapor,
                        style: { fontSize: 13, fontWeight: 700 },
                    },
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
                <div
                    style={{
                        borderTop: '1px solid var(--color-border,#e5e7eb)',
                    }}
                />
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
                    Lihat Detail <ExternalLink size={13} />
                </Link>
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

// ─── Jalur popup card (React) — dipasang via maplibregl.Popup imperatif ───────

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

        const beforeId = map.getLayer(JALUR_LAYER) ? JALUR_LAYER : undefined;

        if (!map.getSource(KELURAHAN_SOURCE)) {
            map.addSource(KELURAHAN_SOURCE, {
                type: 'geojson',
                data: filtered,
            });
            map.addLayer(
                {
                    id: KELURAHAN_FILL,
                    type: 'fill',
                    source: KELURAHAN_SOURCE,
                    paint: { 'fill-color': '#10b981', 'fill-opacity': 0.15 },
                },
                beforeId,
            );
            map.addLayer(
                {
                    id: KELURAHAN_BORDER,
                    type: 'line',
                    source: KELURAHAN_SOURCE,
                    paint: { 'line-color': '#10b981', 'line-width': 2 },
                },
                beforeId,
            );
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
            } catch {}
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

// ─── GeoJSON layer jalur angkut ───────────────────────────────────────────────

function JalurGeoJsonLayer({
    features,
    visible,
    editingId,
    onSelect,
}: {
    features: JalurFeature[];
    visible: boolean;
    editingId: number | null;
    onSelect: (feature: JalurFeature, lngLat: maplibregl.LngLat) => void;
}) {
    const { map, isLoaded } = useMap();
    const hoveredIdRef = useRef<string | number | null>(null);
    const featuresRef = useRef(features);
    const onSelectRef = useRef(onSelect);
    featuresRef.current = features;
    onSelectRef.current = onSelect;

    const clearHover = useCallback(() => {
        if (!map || hoveredIdRef.current == null) {
            return;
        }

        try {
            map.setFeatureState(
                { source: JALUR_SOURCE, id: hoveredIdRef.current },
                { hover: false },
            );
        } catch {}

        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = '';
    }, [map]);

    // Collection tanpa jalur yang sedang di-edit (agar garis edit tidak dobel)
    const collection = {
        type: 'FeatureCollection' as const,
        features: features
            .filter((f) => f.properties.id !== editingId)
            .map((f) => ({
                type: 'Feature' as const,
                id: f.properties.id,
                properties: { ...f.properties },
                geometry: f.geometry,
            })),
    };

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        if (!map.getSource(JALUR_SOURCE)) {
            map.addSource(JALUR_SOURCE, {
                type: 'geojson',
                data: collection,
                promoteId: 'id',
            });
            map.addLayer({
                id: JALUR_LAYER,
                type: 'line',
                source: JALUR_SOURCE,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': ['get', 'warna'],
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        6,
                        4,
                    ],
                    'line-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        1,
                        0.85,
                    ],
                },
            });
        }

        const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
            const hit = e.features?.[0];

            if (!hit?.properties?.id) {
                return;
            }

            const id = Number(hit.properties.id);
            const feature = featuresRef.current.find(
                (f) => f.properties.id === id,
            );

            if (feature) {
                onSelectRef.current(feature, e.lngLat);
            }
        };
        const handleEnter = (e: maplibregl.MapLayerMouseEvent) => {
            const hit = e.features?.[0];

            if (hit?.id == null) {
                return;
            }

            if (
                hoveredIdRef.current != null &&
                hoveredIdRef.current !== hit.id
            ) {
                try {
                    map.setFeatureState(
                        { source: JALUR_SOURCE, id: hoveredIdRef.current },
                        { hover: false },
                    );
                } catch {}
            }

            hoveredIdRef.current = hit.id;
            map.getCanvas().style.cursor = 'pointer';
            map.setFeatureState(
                { source: JALUR_SOURCE, id: hit.id },
                { hover: true },
            );
        };
        const handleLeave = () => clearHover();

        map.on('click', JALUR_LAYER, handleClick);
        map.on('mouseenter', JALUR_LAYER, handleEnter);
        map.on('mouseleave', JALUR_LAYER, handleLeave);
        map.on('mouseout', handleLeave);

        return () => {
            clearHover();

            if (!map || (map as any)._removed) {
                return;
            }

            map.off('click', JALUR_LAYER, handleClick);
            map.off('mouseenter', JALUR_LAYER, handleEnter);
            map.off('mouseleave', JALUR_LAYER, handleLeave);
            map.off('mouseout', handleLeave);

            try {
                if (map.getLayer(JALUR_LAYER)) {
                    map.removeLayer(JALUR_LAYER);
                }

                if (map.getSource(JALUR_SOURCE)) {
                    map.removeSource(JALUR_SOURCE);
                }
            } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isLoaded, clearHover]);

    // Update data saat features / editingId berubah
    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        clearHover();
        const src = map.getSource(JALUR_SOURCE) as
            | maplibregl.GeoJSONSource
            | undefined;
        src?.setData(collection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isLoaded, features, editingId]);

    // Toggle visibility
    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        if (map.getLayer(JALUR_LAYER)) {
            map.setLayoutProperty(
                JALUR_LAYER,
                'visibility',
                visible ? 'visible' : 'none',
            );
        }
    }, [map, isLoaded, visible]);

    return null;
}

// ─── Jalur popup (imperatif maplibre) ────────────────────────────────────────

// ─── Fit bounds ke jalur yang aktif ──────────────────────────────────────────

function JalurFitBounds({
    features,
    fitKey,
}: {
    features: JalurFeature[];
    fitKey: string;
}) {
    const { map, isLoaded } = useMap();
    const lastKey = useRef('');

    useEffect(() => {
        if (!map || !isLoaded || features.length === 0 || !fitKey) {
            return;
        }

        if (lastKey.current === fitKey) {
            return;
        }

        lastKey.current = fitKey;

        const bounds = new maplibregl.LngLatBounds();
        features.forEach((f) =>
            f.geometry.coordinates.forEach(([lng, lat]) =>
                bounds.extend([lng, lat]),
            ),
        );

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 700 });
        }
    }, [map, isLoaded, features, fitKey]);

    return null;
}

// ─── Panel Kontrol Jalur Angkut ───────────────────────────────────────────────

function JalurControlPanel({
    visible,
    onToggleVisible,
    filterTipe,
    onFilterTipe,
    filterKelurahan,
    onFilterKelurahan,
    kelurahans,
    jalurCount,
    loadingJalur,
}: {
    visible: boolean;
    onToggleVisible: () => void;
    filterTipe: string;
    onFilterTipe: (v: string) => void;
    filterKelurahan: string;
    onFilterKelurahan: (v: string) => void;
    kelurahans: string[];
    jalurCount: number;
    loadingJalur: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const kelurahanDisabled = filterTipe !== 'Pick Up';

    return (
        <>
            <button
                type="button"
                onClick={() => setExpanded((p) => !p)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
                <Route className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="flex-1 text-xs font-bold text-foreground">
                    Jalur Angkut
                </span>
                {loadingJalur && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
                {!loadingJalur && filterTipe && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {jalurCount}
                    </span>
                )}
                <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {expanded && (
                <div className="space-y-2.5 border-t border-border px-3 py-2.5">
                    {/* Toggle visibility */}
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                            Tampilkan layer
                        </span>
                        <button
                            type="button"
                            onClick={onToggleVisible}
                            disabled={!filterTipe}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors disabled:opacity-40 ${visible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}
                        >
                            {visible ? (
                                <Eye className="h-3 w-3" />
                            ) : (
                                <EyeOff className="h-3 w-3" />
                            )}
                            {visible ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>

                    {/* Filter Tipe */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Tipe Kendaraan
                        </label>
                        {/* Filter Tipe */}
                        <Select
                            value={filterTipe || 'none'}
                            onValueChange={(v) =>
                                onFilterTipe(v === 'none' ? '' : v)
                            }
                        >
                            <SelectTrigger className="h-8 w-full border-border bg-background text-xs font-normal focus-visible:ring-emerald-500/20">
                                <SelectValue placeholder="— Pilih Tipe —" />
                            </SelectTrigger>
                            <SelectContent
                                className="z-[9999] rounded-xl border-border/80 p-1.5 shadow-lg"
                                position="popper"
                                sideOffset={4}
                            >
                                <SelectItem
                                    value="none"
                                    className="cursor-pointer rounded-lg py-2 pr-8 pl-2.5 text-xs focus:bg-emerald-500/10"
                                >
                                    — Pilih Tipe —
                                </SelectItem>
                                {TIPE_KENDARAAN.map((t) => (
                                    <SelectItem
                                        key={t}
                                        value={t}
                                        className="cursor-pointer rounded-lg py-2 pr-8 pl-2.5 focus:bg-emerald-500/10"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="size-2 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        TIPE_CONFIG[t].warna,
                                                }}
                                            />
                                            <span className="text-xs">{t}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Kelurahan — hanya Pick Up */}
                    <div
                        className={`transition-opacity ${kelurahanDisabled ? 'pointer-events-none opacity-40' : ''}`}
                    >
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Kelurahan
                        </label>
                        {/* Filter Kelurahan */}
                        <Select
                            value={filterKelurahan || 'all'}
                            onValueChange={(v) =>
                                onFilterKelurahan(v === 'all' ? '' : v)
                            }
                            disabled={kelurahanDisabled}
                        >
                            <SelectTrigger className="h-8 w-full border-border bg-background text-xs font-normal focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed">
                                <SelectValue placeholder="— Semua —" />
                            </SelectTrigger>
                            <SelectContent
                                className="z-[9999] rounded-xl border-border/80 p-1.5 shadow-lg"
                                position="popper"
                                sideOffset={4}
                            >
                                <SelectItem
                                    value="all"
                                    className="cursor-pointer rounded-lg py-2 pr-8 pl-2.5 text-xs focus:bg-emerald-500/10"
                                >
                                    — Semua —
                                </SelectItem>
                                {kelurahans.map((k) => (
                                    <SelectItem
                                        key={k}
                                        value={k}
                                        className="cursor-pointer rounded-lg py-2 pr-8 pl-2.5 text-xs focus:bg-emerald-500/10"
                                    >
                                        {k}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mini-legend */}
                    {filterTipe && (
                        <div className="space-y-1 pt-0.5">
                            {TIPE_KENDARAAN.filter((t) => t === filterTipe).map(
                                (t) => (
                                    <div
                                        key={t}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span
                                            className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    TIPE_CONFIG[t].warna,
                                            }}
                                        />
                                        <span className="text-[11px] text-muted-foreground">
                                            {TIPE_CONFIG[t].label}
                                        </span>
                                        {jalurCount > 0 && (
                                            <span className="ml-auto text-[10px] text-muted-foreground">
                                                {jalurCount} jalur
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    )}

                    {!filterTipe && (
                        <p className="text-[10px] text-muted-foreground/70 italic">
                            Pilih tipe kendaraan untuk menampilkan jalur di peta
                        </p>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Hook: TPS Resmi markers ──────────────────────────────────────────────────

function useTpsMarkers(
    map: maplibregl.Map | null,
    tpsList: TpsResmi[],
    layerOn: boolean,
    onDelete: (id: number) => void,
) {
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const popupRefHook = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        popupRefHook.current?.remove();
        popupRefHook.current = null;

        if (!map || !layerOn || tpsList.length === 0) {
            return;
        }

        tpsList.forEach((ts) => {
            const el = document.createElement('div');
            el.style.cssText =
                'display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;';
            const circle = document.createElement('div');
            circle.style.cssText = `width:36px;height:36px;border-radius:50%;background:#10b981;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:transform 0.15s;flex-shrink:0;`;
            circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 576 512"><path fill="white" d="M560 160c10.4 0 18-9.8 15.5-19.9l-24-96C549.7 37 543.3 32 536 32h-98.9l25.6 128zM272 32H171.5l-25.6 128H272zm132.5 0H304v128h126.1zM16 160h97.3l25.6-128H40c-7.3 0-13.7 5-15.5 12.1l-24 96C-2 150.2 5.6 160 16 160m544 64h-20l4-32H32l4 32H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h28l20 160v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h320v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16l20-160h28c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16"/></svg>`;
            el.addEventListener('mouseenter', () => {
                circle.style.transform = 'scale(1.12)';
            });
            el.addEventListener('mouseleave', () => {
                circle.style.transform = 'scale(1)';
            });
            const tail = document.createElement('div');
            tail.style.cssText = `width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #10b981;margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));flex-shrink:0;`;
            el.appendChild(circle);
            el.appendChild(tail);

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                popupRefHook.current?.remove();
                popupRefHook.current = null;

                const container = document.createElement('div');
                container.style.cssText =
                    'width:220px;border-radius:14px;overflow:visible;box-shadow:0 8px 32px rgba(0,0,0,0.18);background:var(--color-card,#fff);border:1px solid var(--color-border,#e5e7eb);position:relative;font-family:system-ui,sans-serif;';

                // ── Header ──
                const header = document.createElement('div');
                header.style.cssText =
                    'background:#10b981;border-radius:14px 14px 0 0;padding:10px 12px;display:flex;align-items:center;gap:8px;';

                const iconWrap = document.createElement('div');
                iconWrap.style.cssText =
                    'background:rgba(255,255,255,0.25);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
                iconWrap.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 576 512"><path fill="white" d="M560 160c10.4 0 18-9.8 15.5-19.9l-24-96C549.7 37 543.3 32 536 32h-98.9l25.6 128zM272 32H171.5l-25.6 128H272zm132.5 0H304v128h126.1zM16 160h97.3l25.6-128H40c-7.3 0-13.7 5-15.5 12.1l-24 96C-2 150.2 5.6 160 16 160m544 64h-20l4-32H32l4 32H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h28l20 160v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h320v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16l20-160h28c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16"/></svg>';

                const titleWrap = document.createElement('div');
                titleWrap.style.cssText = 'flex:1;min-width:0;';
                const titleLabel = document.createElement('p');
                titleLabel.style.cssText =
                    'color:rgba(255,255,255,0.75);font-size:10px;font-weight:700;margin:0;letter-spacing:0.08em;text-transform:uppercase;';
                titleLabel.textContent = 'TPS Resmi';
                const titleId = document.createElement('p');
                titleId.style.cssText =
                    'color:#fff;font-size:13px;font-weight:800;margin:0;font-family:monospace;';
                titleId.textContent = `#${String(ts.id).padStart(5, '0')}`;
                titleWrap.appendChild(titleLabel);
                titleWrap.appendChild(titleId);

                const badge = document.createElement('span');
                badge.style.cssText =
                    'background:rgba(255,255,255,0.22);color:#fff;font-size:10px;font-weight:700;border-radius:20px;padding:3px 9px;border:1px solid rgba(255,255,255,0.35);white-space:nowrap;flex-shrink:0;';
                badge.textContent = 'Aktif';

                const closeBtn = document.createElement('button');
                closeBtn.style.cssText =
                    'background:rgba(0,0,0,0.20);border:none;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;color:#fff;padding:0;transition:opacity 0.15s;';
                closeBtn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.opacity = '0.7';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.opacity = '1';
                });
                closeBtn.addEventListener('click', (ce) => {
                    ce.stopPropagation();
                    popupRefHook.current?.remove();
                    popupRefHook.current = null;
                });

                header.appendChild(iconWrap);
                header.appendChild(titleWrap);
                header.appendChild(badge);
                header.appendChild(closeBtn);
                container.appendChild(header);

                // ── Body ──
                const body = document.createElement('div');
                body.style.cssText =
                    'padding:12px 14px;display:flex;flex-direction:column;gap:8px;';

                const coordLabel = document.createElement('p');
                coordLabel.style.cssText =
                    'font-size:10px;font-weight:700;color:var(--color-muted-foreground,#6b7280);margin:0 0 2px;text-transform:uppercase;letter-spacing:0.06em;';
                coordLabel.textContent = 'Koordinat';
                const coordValue = document.createElement('p');
                coordValue.style.cssText =
                    'font-size:11px;font-family:monospace;color:var(--color-foreground,#374151);margin:0;';
                coordValue.textContent = `${ts.latitude.toFixed(6)}, ${ts.longitude.toFixed(6)}`;

                const divider = document.createElement('div');
                divider.style.cssText =
                    'border-top:1px solid var(--color-border,#e5e7eb);margin:2px 0;';

                const btn = document.createElement('button');
                btn.style.cssText =
                    'width:100%;background:#ef4444;color:#fff;border:none;border-radius:8px;padding:8px 0;font-size:12px;font-weight:700;cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:6px;';
                btn.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 576 512"><path fill="currentColor" d="M560 160c10.4 0 18-9.8 15.5-19.9l-24-96C549.7 37 543.3 32 536 32h-98.9l25.6 128zM272 32H171.5l-25.6 128H272zm132.5 0H304v128h126.1zM16 160h97.3l25.6-128H40c-7.3 0-13.7 5-15.5 12.1l-24 96C-2 150.2 5.6 160 16 160m544 64h-20l4-32H32l4 32H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h28l20 160v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h320v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16l20-160h28c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16"/></svg> Hapus';
                btn.addEventListener('mouseenter', () => {
                    btn.style.opacity = '0.85';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.opacity = '1';
                });
                btn.addEventListener('click', () => {
                    onDelete(ts.id);
                    popupRefHook.current?.remove();
                    popupRefHook.current = null;
                });

                body.appendChild(coordLabel);
                body.appendChild(coordValue);
                body.appendChild(divider);
                body.appendChild(btn);
                container.appendChild(body);

                // ── Caret bawah (border) ──
                const caretOuter = document.createElement('div');
                caretOuter.style.cssText =
                    'position:absolute;bottom:-11px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:11px solid var(--color-border,#e5e7eb);z-index:1;';
                container.appendChild(caretOuter);

                // ── Caret bawah (fill) ──
                const caretInner = document.createElement('div');
                caretInner.style.cssText =
                    'position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:10px solid var(--color-card,#fff);z-index:2;';
                container.appendChild(caretInner);

                const popup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    anchor: 'bottom',
                    offset: [0, -52],
                    className: 'mapcn-popup--clean',
                    maxWidth: '260px',
                })
                    .setLngLat([ts.longitude, ts.latitude])
                    .setDOMContent(container)
                    .addTo(map);
                popupRefHook.current = popup;
                popup.on('close', () => {
                    popupRefHook.current = null;
                });
            });

            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'bottom',
            })
                .setLngLat([ts.longitude, ts.latitude])
                .addTo(map);
            markersRef.current.push(marker);
        });

        return () => {
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            popupRefHook.current?.remove();
            popupRefHook.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, tpsList, layerOn]);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Peta() {
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
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const popupRootRef = useRef<Root | null>(null);
    const focusDoneRef = useRef(false);
    const [focusId, setFocusId] = useState<number | null>(null);

    // ── Jalur angkut ──
    const [jalurList, setJalurList] = useState<JalurFeature[]>([]);
    const [jalurVisible, setJalurVisible] = useState(true);
    const [filterTipe, setFilterTipe] = useState<string>('');
    const [filterJalurKelurahan, setFilterJalurKelurahan] =
        useState<string>('');
    const [kelurahans, setKelurahans] = useState<string[]>([]);
    const [loadingJalur, setLoadingJalur] = useState(false);

    // ── Jalur popup ──
    const [popupJalur, setPopupJalur] = useState<JalurFeature | null>(null);
    const [popupLngLat, setPopupLngLat] = useState<[number, number] | null>(
        null,
    );

    // ── Jalur edit ──
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editCoords, setEditCoords] = useState<[number, number][]>([]);
    const [saving, setSaving] = useState(false);

    // ── TPS Resmi ──
    const [tpsList, setTpsList] = useState<TpsResmi[]>([]);
    const [tpsLayerOn, setTpsLayerOn] = useState(false);
    const [loadingTps, setLoadingTps] = useState(false);
    const [addingTps, setAddingTps] = useState(false);
    const [tpsExpanded, setTpsExpanded] = useState(false);
    const [tpsCoordInput, setTpsCoordInput] = useState('');
    const [tpsCoordError, setTpsCoordError] = useState('');

    // ── Toast ──
    const [toast, setToast] = useState<{
        type: 'success' | 'error';
        msg: string;
    } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

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

    // ── Focus on laporan from URL ──
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('laporan_id');

        if (id) {
            setFocusId(Number(id));
        }
    }, []);

    // ── Fetch laporan ──
    const fetchLaporan = useCallback(async (status: string) => {
        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (status) {
                params.set('status', status);
            }

            const res = await fetch(`/admin/peta/data?${params.toString()}`);
            setLaporan(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchLaporan(filterStatus);
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

    // ── Fetch kelurahans (jalur angkut) ──
    useEffect(() => {
        fetch('/admin/jalur-angkut/kelurahans')
            .then((r) => r.json())
            .then(setKelurahans)
            .catch(console.error);
    }, []);

    // ── Fetch jalur ──
    const effectiveKelurahan =
        filterTipe === 'Pick Up' ? filterJalurKelurahan : '';

    const fetchJalur = useCallback(async (tipe: string, kelurahan: string) => {
        if (!tipe) {
            setJalurList([]);

            return;
        }

        setLoadingJalur(true);

        try {
            const params = new URLSearchParams();
            params.set('tipe', tipe);

            if (kelurahan && tipe === 'Pick Up') {
                params.set('kelurahan', kelurahan);
            }

            const res = await fetch(`/admin/jalur-angkut/data?${params}`);
            setJalurList(await res.json());
        } catch {
            console.error('Gagal ambil jalur');
        } finally {
            setLoadingJalur(false);
        }
    }, []);
    useEffect(() => {
        fetchJalur(filterTipe, effectiveKelurahan);
    }, [filterTipe, effectiveKelurahan, fetchJalur]);

    useEffect(() => {
        if (filterTipe !== 'Pick Up') {
            setFilterJalurKelurahan('');
        }
    }, [filterTipe]);
    useEffect(() => {
        if (filterTipe) {
            setJalurVisible(true);
        }
    }, [filterTipe]);

    // ── Fetch TPS ──
    const fetchTps = useCallback(async () => {
        setLoadingTps(true);

        try {
            const res = await fetch('/admin/tps-resmi/data');
            setTpsList(await res.json());
        } catch {
            console.error('Gagal ambil TPS');
        } finally {
            setLoadingTps(false);
        }
    }, []);

    useEffect(() => {
        if (tpsLayerOn) {
            fetchTps();
        } else {
            setTpsList([]);
        }
    }, [tpsLayerOn, fetchTps]);

    useEffect(() => {
        setFilterKelurahan('');
    }, [filterKecamatan]);

    useEffect(() => {
        if (!filterKecamatan || !kelurahanGeoJson || !mapRef.current) {
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
            mapRef.current.fitBounds(bounds, {
                padding: 80,
                maxZoom: 14,
                duration: 700,
            });
        }
    }, [filterKecamatan, kelurahanGeoJson]);

    // Tutup jalur popup saat filter berubah
    useEffect(() => {
        setPopupJalur(null);
        setPopupLngLat(null);
    }, [filterTipe, effectiveKelurahan]);

    // ── Edit jalur ──
    const editingFeature = jalurList.find((j) => j.properties.id === editingId);
    const editWarna = editingFeature?.properties.warna ?? '#f59e0b';

    const startEdit = useCallback((feature: JalurFeature) => {
        setPopupJalur(null);
        setPopupLngLat(null);
        setEditingId(feature.properties.id);
        setEditCoords([...feature.geometry.coordinates]);
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingId(null);
        setEditCoords([]);
    }, []);

    const saveEdit = useCallback(async () => {
        if (editingId === null || editCoords.length < 2) {
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/admin/jalur-angkut/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? '',
                },
                body: JSON.stringify({ coordinates: editCoords }),
            });

            if (!res.ok) {
                throw new Error();
            }

            showToast('success', 'Jalur berhasil diperbarui!');
            cancelEdit();
            fetchJalur(filterTipe, effectiveKelurahan);
        } catch {
            showToast('error', 'Gagal menyimpan jalur.');
        } finally {
            setSaving(false);
        }
    }, [
        editingId,
        editCoords,
        cancelEdit,
        fetchJalur,
        filterTipe,
        effectiveKelurahan,
    ]);

    const updateEditCoord = (
        index: number,
        lngLat: { lng: number; lat: number },
    ) => {
        setEditCoords((prev) => {
            const next = [...prev];
            next[index] = [lngLat.lng, lngLat.lat];

            return next;
        });
    };

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
            const map = mapRef.current;

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
        [closeLaporanPopup],
    );

    useEffect(() => {
        closeLaporanPopup();
    }, [filterStatus, filterKelurahan, closeLaporanPopup]);

    useNativeMarkers(
        mapReady ? mapRef.current : null,
        filteredLaporan,
        openLaporanPopup,
    );

    // ── Fly to + popup laporan from URL ──
    useEffect(() => {
        if (!mapReady || !focusId || focusDoneRef.current) {
            return;
        }

        const target = laporan.find((l) => l.id === focusId);

        if (!target) {
            return;
        }

        focusDoneRef.current = true;
        const map = mapRef.current;

        if (!map) {
            return;
        }

        map.flyTo({ center: [target.longitude, target.latitude], zoom: 16, duration: 1500 });

        const onMoveEnd = () => {
            map.off('moveend', onMoveEnd);
            openLaporanPopup(target);
        };
        map.on('moveend', onMoveEnd);
    }, [mapReady, laporan, focusId, openLaporanPopup]);

    const jalurFitKey = `${filterTipe}|${effectiveKelurahan}|${jalurList.length}`;

    // ── TPS handlers ──
    const handleDeleteTps = useCallback(
        async (id: number) => {
            try {
                const csrf =
                    (
                        document.querySelector(
                            'meta[name="csrf-token"]',
                        ) as HTMLMetaElement
                    )?.content ?? '';
                const res = await fetch(`/admin/tps-resmi/${id}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRF-TOKEN': csrf },
                });

                if (!res.ok) {
                    throw new Error();
                }

                showToast('success', 'TPS berhasil dihapus.');
                fetchTps();
            } catch {
                showToast('error', 'Gagal menghapus TPS.');
            }
        },
        [fetchTps, showToast],
    );

    const handleAddTps = useCallback(
        async (lngLat: { lat: number; lng: number }) => {
            try {
                const csrf =
                    (
                        document.querySelector(
                            'meta[name="csrf-token"]',
                        ) as HTMLMetaElement
                    )?.content ?? '';
                const res = await fetch('/admin/tps-resmi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                    },
                    body: JSON.stringify({
                        latitude: lngLat.lat,
                        longitude: lngLat.lng,
                    }),
                });

                if (!res.ok) {
                    throw new Error();
                }

                setAddingTps(false);
                setTpsCoordInput('');
                setTpsCoordError('');
                showToast('success', 'Titik TPS berhasil ditambahkan.');
                fetchTps();
            } catch {
                showToast('error', 'Gagal menambahkan TPS.');
            }
        },
        [fetchTps, showToast],
    );

    const handleGoToCoord = useCallback(() => {
        const raw = tpsCoordInput.trim();
        const parts = raw.split(/[\s,]+/).map(Number);

        if (parts.length !== 2 || parts.some(isNaN)) {
            setTpsCoordError('Format salah. Contoh: -0.123456, 119.123456');

            return;
        }

        const [lat, lng] = parts;

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setTpsCoordError('Koordinat di luar jangkauan.');

            return;
        }

        setTpsCoordError('');

        const map = mapRef.current;

        if (!map) {
            return;
        }

        handleAddTps({ lat, lng });
        map.flyTo({ center: [lng, lat], zoom: 17, duration: 800 });
    }, [tpsCoordInput, handleAddTps]);

    // ── Map click saat addingTps ──
    useEffect(() => {
        const map = mapRef.current;

        if (!map || !mapReady || !addingTps) {
            return;
        }

        const handler = (e: maplibregl.MapMouseEvent) => {
            handleAddTps(e.lngLat);
        };

        map.on('click', handler);
        map.getCanvas().style.cursor = 'crosshair';

        return () => {
            map.off('click', handler);
            map.getCanvas().style.cursor = '';
        };
    }, [addingTps, mapReady, handleAddTps]);

    // ── Hook TPS markers ──
    useTpsMarkers(
        mapReady ? mapRef.current : null,
        tpsList,
        tpsLayerOn,
        handleDeleteTps,
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

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    {toast.msg}
                </div>
            )}

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-extrabold text-foreground">
                        Peta Sebaran Laporan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Visualisasi lokasi laporan & jalur angkut sampah di Kota
                        Palu
                    </p>
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
                            className="z-[9999] min-w-[var(--radix-select-trigger-width)] rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
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

                    {/* Kelurahan — disabled sebelum kecamatan dipilih */}
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

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {loading
                                ? 'Memuat...'
                                : `${filteredLaporan.length} Laporan`}
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
                </div>

                {/* Peta */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {/* Banner mode edit jalur */}
                    {editingId !== null && (
                        <div className="absolute top-3 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                            <Pencil className="h-4 w-4" />
                            Mode Edit Jalur — geser titik untuk mengubah rute
                            <button
                                type="button"
                                onClick={saveEdit}
                                disabled={saving}
                                className="ml-2 rounded-lg bg-white px-3 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-xs font-semibold underline opacity-80 hover:opacity-100"
                            >
                                Batal
                            </button>
                        </div>
                    )}

                    <div className="h-[480px] w-full sm:h-[560px]">
                        <Map
                            center={PALU_CENTER}
                            zoom={PALU_ZOOM}
                            loading={loading || loadingJalur}
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

                            {mapReady &&
                                filterKelurahan &&
                                kelurahanGeoJson && (
                                    <KelurahanPolygonLayer
                                        geojson={kelurahanGeoJson}
                                        selected={filterKelurahan}
                                    />
                                )}

                            {/* Layer jalur angkut */}
                            {mapReady && (
                                <JalurGeoJsonLayer
                                    features={jalurList}
                                    visible={jalurVisible && !!filterTipe}
                                    editingId={editingId}
                                    onSelect={(feature, lngLat) => {
                                        // Jangan buka popup kalau sedang edit
                                        if (editingId !== null) {
                                            return;
                                        }

                                        setPopupJalur(feature);
                                        setPopupLngLat([
                                            lngLat.lng,
                                            lngLat.lat,
                                        ]);
                                    }}
                                />
                            )}

                            {/* Auto fit bounds saat filter jalur berubah */}
                            {mapReady &&
                                jalurList.length > 0 &&
                                jalurVisible && (
                                    <JalurFitBounds
                                        features={jalurList}
                                        fitKey={jalurFitKey}
                                    />
                                )}

                            {/* Jalur popup */}
                            {popupJalur &&
                                popupLngLat &&
                                editingId === null && (
                                    <JalurMapPopup
                                        feature={popupJalur}
                                        lngLat={popupLngLat}
                                        onClose={() => {
                                            setPopupJalur(null);
                                            setPopupLngLat(null);
                                        }}
                                        onEdit={() => startEdit(popupJalur)}
                                        showDetail
                                    />
                                )}

                            {/* Garis edit (preview saat drag) */}
                            {editingId !== null && editCoords.length >= 2 && (
                                <MapRoute
                                    id="jalur-edit"
                                    coordinates={editCoords}
                                    color={editWarna}
                                    width={5}
                                    opacity={1}
                                    interactive={false}
                                />
                            )}

                            {/* Titik-titik draggable saat mode edit */}
                            {editingId !== null &&
                                editCoords.map(([lng, lat], idx) => (
                                    <MapMarker
                                        key={`edit-${idx}`}
                                        longitude={lng}
                                        latitude={lat}
                                        draggable
                                        onDragEnd={(ll) =>
                                            updateEditCoord(idx, ll)
                                        }
                                    >
                                        <MarkerContent>
                                            <div
                                                className="h-3.5 w-3.5 rounded-full border-2 border-white shadow"
                                                style={{
                                                    backgroundColor: editWarna,
                                                }}
                                            />
                                        </MarkerContent>
                                        <MarkerTooltip>
                                            Titik {idx + 1}
                                        </MarkerTooltip>
                                    </MapMarker>
                                ))}
                        </Map>
                    </div>

                    {/* Floating panel input koordinat TPS */}
                    {addingTps && (
                        <div className="absolute top-1/2 left-1/2 z-[1001] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
                            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Atau masukkan koordinat
                            </p>
                            <input
                                type="text"
                                value={tpsCoordInput}
                                onChange={(e) => {
                                    setTpsCoordInput(e.target.value);
                                    setTpsCoordError('');
                                }}
                                placeholder="-0.123456, 119.123456"
                                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
                            />
                            {tpsCoordError && (
                                <p className="mt-1 text-[10px] text-red-500">
                                    {tpsCoordError}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleGoToCoord}
                                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                            >
                                Tandai Lokasi
                            </button>
                        </div>
                    )}

                    {/* Panel kontrol gabungan: Jalur Angkut + TPS Resmi */}
                    <div className="absolute top-3 left-3 z-[1000] w-[220px] rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-sm">
                        {/* Jalur Angkut */}
                        <JalurControlPanel
                            visible={jalurVisible}
                            onToggleVisible={() => setJalurVisible((p) => !p)}
                            filterTipe={filterTipe}
                            onFilterTipe={setFilterTipe}
                            filterKelurahan={filterJalurKelurahan}
                            onFilterKelurahan={setFilterJalurKelurahan}
                            kelurahans={kelurahans}
                            jalurCount={jalurList.length}
                            loadingJalur={loadingJalur}
                        />

                        {/* TPS Resmi */}
                        <div className="border-t border-border">
                            <div className="flex items-center gap-2 px-3 py-2.5">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 576 512"
                                    className="shrink-0"
                                    style={{ color: '#10b981' }}
                                >
                                    <path
                                        fill="currentColor"
                                        d="M560 160c10.4 0 18-9.8 15.5-19.9l-24-96C549.7 37 543.3 32 536 32h-98.9l25.6 128zM272 32H171.5l-25.6 128H272zm132.5 0H304v128h126.1zM16 160h97.3l25.6-128H40c-7.3 0-13.7 5-15.5 12.1l-24 96C-2 150.2 5.6 160 16 160m544 64h-20l4-32H32l4 32H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h28l20 160v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h320v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16l20-160h28c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16"
                                    />
                                </svg>
                                <span className="flex-1 text-xs font-bold text-foreground">
                                    TPS Resmi
                                </span>
                                {loadingTps && (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                                {!loadingTps && tpsLayerOn && (
                                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        {tpsList.length}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTpsLayerOn((p) => !p);
                                        setAddingTps(false);
                                        setTpsCoordInput('');
                                        setTpsCoordError('');
                                        setTpsExpanded(false);
                                    }}
                                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${tpsLayerOn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}
                                >
                                    {tpsLayerOn ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3" />
                                    )}
                                </button>
                                <ChevronDown
                                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${tpsExpanded ? 'rotate-180' : ''} ${tpsLayerOn ? '' : 'pointer-events-none opacity-40'}`}
                                    onClick={() => setTpsExpanded((p) => !p)}
                                />
                            </div>
                            {tpsExpanded && tpsLayerOn && (
                                <div className="space-y-2 border-t border-border px-3 py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingTps((p) => !p);
                                            setTpsCoordInput('');
                                            setTpsCoordError('');
                                        }}
                                        className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${addingTps ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                    >
                                        <MapPin className="h-3.5 w-3.5" />
                                        {addingTps ? 'Batal' : 'Tambah Titik'}
                                    </button>
                                    {addingTps && (
                                        <p className="text-center text-[10px] text-muted-foreground">
                                            Klik lokasi di peta untuk menyimpan
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
                        <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Sebaran:
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

                        {filterTipe && jalurList.length > 0 && (
                            <>
                                <span className="text-muted-foreground/40">
                                    |
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Route className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                        Jalur:
                                    </span>
                                </div>
                                {TIPE_KENDARAAN.filter(
                                    (t) => t === filterTipe,
                                ).map((t) => (
                                    <div
                                        key={t}
                                        className="flex items-center gap-1.5"
                                    >
                                        <span
                                            className="inline-block h-0.5 w-5 rounded"
                                            style={{
                                                backgroundColor:
                                                    TIPE_CONFIG[t].warna,
                                            }}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {TIPE_CONFIG[t].label}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        <span className="ml-auto text-[11px] text-muted-foreground/60">
                            {editingId
                                ? 'Geser titik untuk mengubah jalur'
                                : 'Klik marker/jalur untuk detail'}
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
                                            'Pelapor',
                                            'Alamat',
                                            'Tanggal',
                                            'Status',
                                            'Aksi',
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
                                                <td className="px-5 py-3 text-center font-semibold text-foreground">
                                                    {item.pelapor}
                                                </td>
                                                <td className="max-w-[200px] truncate px-5 py-3 text-center text-muted-foreground">
                                                    {item.alamat}
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
                                                <td className="px-5 py-3 text-center">
                                                    <Link
                                                        href={`/admin/laporan/${item.id}`}
                                                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                        aria-label="Lihat detail"
                                                    >
                                                        <Eye className="h-4 w-4" />
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

                {!loading && filteredLaporan.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                        <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold text-muted-foreground">
                            Tidak ada laporan ditemukan
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {filterStatus || filterKelurahan
                                ? 'Coba reset filter status atau kelurahan.'
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
