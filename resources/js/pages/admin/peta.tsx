import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { createRoot, type Root } from 'react-dom/client';
import {
    Map,
    MapControls,
    MapRoute,
    MapMarker,
    MarkerContent,
    MarkerTooltip,
} from '@/components/ui/map';
import { useMap } from '@/components/ui/map';
import maplibregl from 'maplibre-gl';
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
    CalendarClock,
} from 'lucide-react';
import { getHariLabel, normalizeJadwal } from '@/lib/jalur-schedule';

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

interface JalurProperties {
    id: number;
    nama: string | null;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
    jadwal?: unknown;
}

interface JalurFeature {
    type: 'Feature';
    properties: JalurProperties;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
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

function JalurPopupCard({
    feature,
    onEdit,
}: {
    feature: JalurFeature;
    onEdit: () => void;
}) {
    const { id, tipe_kendaraan, warna, nama, kelurahan, jadwal } =
        feature.properties;
    const cfg = TIPE_CONFIG[tipe_kendaraan as TipeKendaraan];
    const label = nama ?? tipe_kendaraan;
    const jadwalList = normalizeJadwal(jadwal);

    return (
        <div className="max-w-[260px] min-w-[200px] space-y-2.5">
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: warna }}
                />
                <strong className="text-sm" style={{ color: warna }}>
                    {label}
                </strong>
            </div>
            {kelurahan && (
                <p className="pl-4 text-[11px] text-muted-foreground">
                    {kelurahan}
                </p>
            )}
            <span
                className="ml-4 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${warna}22`, color: warna }}
            >
                {cfg?.label ?? tipe_kendaraan}
            </span>

            <div className="ml-4 space-y-1.5 border-t border-border pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    <CalendarClock className="h-3 w-3" />
                    Jadwal Operasi
                </div>
                {jadwalList.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">
                        Belum dijadwalkan
                    </p>
                ) : (
                    <ul className="space-y-1">
                        {jadwalList.map((j) => (
                            <li
                                key={j.hari}
                                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1 text-[11px]"
                            >
                                <span className="font-semibold text-foreground">
                                    {getHariLabel(j.hari)}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                    {j.jam_mulai}–{j.jam_selesai}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="ml-4 flex flex-col gap-1.5 pt-0.5">
                <Link
                    href={`/admin/jalur/${id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50"
                >
                    Lihat Detail
                    <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                >
                    <Pencil className="h-3 w-3" />
                    Edit di Peta
                </button>
            </div>
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
        if (!map || !isLoaded || !selected) return;

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
            if (map.getLayer(KELURAHAN_BORDER))
                map.removeLayer(KELURAHAN_BORDER);
            if (map.getLayer(KELURAHAN_FILL)) map.removeLayer(KELURAHAN_FILL);
            if (map.getSource(KELURAHAN_SOURCE))
                map.removeSource(KELURAHAN_SOURCE);
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
        if (!map || hoveredIdRef.current == null) return;
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
        if (!map || !isLoaded) return;

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
            if (!hit?.properties?.id) return;
            const id = Number(hit.properties.id);
            const feature = featuresRef.current.find(
                (f) => f.properties.id === id,
            );
            if (feature) onSelectRef.current(feature, e.lngLat);
        };
        const handleEnter = (e: maplibregl.MapLayerMouseEvent) => {
            const hit = e.features?.[0];
            if (hit?.id == null) return;
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
            map.off('click', JALUR_LAYER, handleClick);
            map.off('mouseenter', JALUR_LAYER, handleEnter);
            map.off('mouseleave', JALUR_LAYER, handleLeave);
            map.off('mouseout', handleLeave);
            if (map.getLayer(JALUR_LAYER)) map.removeLayer(JALUR_LAYER);
            if (map.getSource(JALUR_SOURCE)) map.removeSource(JALUR_SOURCE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isLoaded, clearHover]);

    // Update data saat features / editingId berubah
    useEffect(() => {
        if (!map || !isLoaded) return;
        clearHover();
        const src = map.getSource(JALUR_SOURCE) as
            | maplibregl.GeoJSONSource
            | undefined;
        src?.setData(collection);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isLoaded, features, editingId]);

    // Toggle visibility
    useEffect(() => {
        if (!map || !isLoaded) return;
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

function JalurMapPopup({
    feature,
    lngLat,
    onClose,
    onEdit,
}: {
    feature: JalurFeature;
    lngLat: [number, number];
    onClose: () => void;
    onEdit: () => void;
}) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded) return;

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(<JalurPopupCard feature={feature} onEdit={onEdit} />);

        const popup = new maplibregl.Popup({
            closeButton: true,
            className: 'mapcn-popup',
            maxWidth: '320px',
        })
            .setLngLat(lngLat)
            .setDOMContent(el)
            .addTo(map);

        popup.on('close', onClose);

        return () => {
            popup.off('close', onClose);
            popup.remove();
            queueMicrotask(() => root.unmount());
        };
    }, [map, isLoaded, feature, lngLat, onClose, onEdit]);

    return null;
}

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
        if (!map || !isLoaded || features.length === 0 || !fitKey) return;
        if (lastKey.current === fitKey) return;
        lastKey.current = fitKey;

        const bounds = new maplibregl.LngLatBounds();
        features.forEach((f) =>
            f.geometry.coordinates.forEach(([lng, lat]) =>
                bounds.extend([lng, lat]),
            ),
        );
        if (!bounds.isEmpty())
            map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 700 });
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
        <div className="absolute bottom-16 left-3 z-[1000] w-[220px] overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-sm">
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
                        <div className="relative">
                            <select
                                value={filterTipe}
                                onChange={(e) => onFilterTipe(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="">— Pilih Tipe —</option>
                                {TIPE_KENDARAAN.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Filter Kelurahan — hanya Pick Up */}
                    <div
                        className={`transition-opacity ${kelurahanDisabled ? 'pointer-events-none opacity-40' : ''}`}
                    >
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Kelurahan
                        </label>
                        <div className="relative">
                            <select
                                value={filterKelurahan}
                                disabled={kelurahanDisabled}
                                onChange={(e) =>
                                    onFilterKelurahan(e.target.value)
                                }
                                className="w-full appearance-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed"
                            >
                                <option value="">— Semua —</option>
                                {kelurahans.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        </div>
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
        </div>
    );
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

    // ── Fetch laporan ──
    const fetchLaporan = useCallback(async (status: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
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
        if (!filterKecamatan || !kelurahanGeoJson) return kelurahanList;
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
        if (!filterKelurahan || !kelurahanGeoJson) return laporan;

        const feature = kelurahanGeoJson.features.find(
            (f) => f.properties.kelurahan === filterKelurahan,
        );
        if (!feature) return laporan;

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
            if (kelurahan && tipe === 'Pick Up')
                params.set('kelurahan', kelurahan);
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
        if (filterTipe !== 'Pick Up') setFilterJalurKelurahan('');
    }, [filterTipe]);
    useEffect(() => {
        if (filterTipe) setJalurVisible(true);
    }, [filterTipe]);

    useEffect(() => {
        setFilterKelurahan('');
    }, [filterKecamatan]);

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
        if (editingId === null || editCoords.length < 2) return;
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
            if (!res.ok) throw new Error();
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
            if (!map) return;
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

    const jalurFitKey = `${filterTipe}|${effectiveKelurahan}|${jalurList.length}`;

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
                    <select
                        value={filterKecamatan}
                        onChange={(e) => setFilterKecamatan(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="">Semua Kecamatan</option>
                        {kecamatanList.map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>

                    {/* LAMA: select kelurahan — hanya ubah kelurahanList → filteredKelurahanList */}
                    <select
                        value={filterKelurahan}
                        onChange={(e) => setFilterKelurahan(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="">Semua Kelurahan</option>
                        {filteredKelurahanList.map(
                            (
                                k, // <-- perubahan di sini
                            ) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ),
                        )}
                    </select>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {loading
                            ? 'Memuat...'
                            : `${filteredLaporan.length} laporan di peta`}
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
                    {filterKecamatan && (
                        <button
                            type="button"
                            onClick={() => setFilterKecamatan('')}
                            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                            Reset filter kecamatan
                        </button>
                    )}

                    {filterKelurahan && (
                        <button
                            type="button"
                            onClick={() => setFilterKelurahan('')}
                            className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                            Reset filter kelurahan
                        </button>
                    )}
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
                                        if (editingId !== null) return;
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

                    {/* Panel kontrol jalur angkut */}
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
                                                className="px-5 py-3 text-left"
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
