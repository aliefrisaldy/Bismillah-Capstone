import { Head } from '@inertiajs/react';
import { Layers, Route, CalendarClock, RotateCcw } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FadeIn from '@/components/fade-in';
import { Button } from '@/components/ui/button';
import { Map, MapControls, useMap } from '@/components/ui/map';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import UserLayout from '@/layouts/user-layout';
import { getHariLabel, normalizeJadwal } from '@/lib/jalur-schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

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

const DEFAULT_CENTER: [number, number] = [119.8707, -0.8917];

function isKelurahanFilterDisabled(tipe: string): boolean {
    return !tipe || tipe === 'R6' || tipe === 'Kaisar';
}

const JALUR_SOURCE = 'jalur-angkut-src';
const JALUR_LAYER = 'jalur-angkut-lines';

// ─── Map helpers ─────────────────────────────────────────────────────────────

function MapFitBounds({
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
        features.forEach((f) => {
            f.geometry.coordinates.forEach(([lng, lat]) =>
                bounds.extend([lng, lat]),
            );
        });

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 600 });
        }
    }, [map, isLoaded, features, fitKey]);

    return null;
}

/** Satu GeoJSON layer untuk semua jalur */
function JalurGeoJsonLayer({
    features,
    onSelect,
}: {
    features: JalurFeature[];
    onSelect: (feature: JalurFeature, lngLat: maplibregl.LngLat) => void;
}) {
    const { map, isLoaded } = useMap();
    const featuresRef = useRef(features);
    const onSelectRef = useRef(onSelect);
    const hoveredIdRef = useRef<string | number | null>(null);
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
        } catch {
            /* source/layer belum siap */
        }

        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = '';
    }, [map]);

    const collection = useMemo(
        () => ({
            type: 'FeatureCollection' as const,
            features: features.map((f) => ({
                type: 'Feature' as const,
                id: f.properties.id,
                properties: { ...f.properties },
                geometry: f.geometry,
            })),
        }),
        [features],
    );

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
                } catch {
                    /* ignore */
                }
            }

            hoveredIdRef.current = hit.id;
            map.getCanvas().style.cursor = 'pointer';
            map.setFeatureState(
                { source: JALUR_SOURCE, id: hit.id },
                { hover: true },
            );
        };

        const handleLeave = () => {
            clearHover();
        };

        const handleMapLeave = () => {
            clearHover();
        };

        map.on('click', JALUR_LAYER, handleClick);
        map.on('mouseenter', JALUR_LAYER, handleEnter);
        map.on('mouseleave', JALUR_LAYER, handleLeave);
        map.on('mouseout', handleMapLeave);

        return () => {
            if (!map || (map as any)._removed) {
return;
}

            map.off('click', JALUR_LAYER, handleClick);
            map.off('mouseenter', JALUR_LAYER, handleEnter);
            map.off('mouseleave', JALUR_LAYER, handleLeave);
            map.off('mouseout', handleMapLeave);

            try {
                if (map.getLayer(JALUR_LAYER)) {
map.removeLayer(JALUR_LAYER);
}

                if (map.getSource(JALUR_SOURCE)) {
map.removeSource(JALUR_SOURCE);
}
            } catch {}
        };
    }, [map, isLoaded, clearHover]);

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        clearHover();
        const src = map.getSource(JALUR_SOURCE) as
            | maplibregl.GeoJSONSource
            | undefined;
        src?.setData(collection);
    }, [map, isLoaded, collection, clearHover]);

    return null;
}

/** Popup MapLibre imperatif */
function JalurMapPopup({
    feature,
    lngLat,
    onClose,
}: {
    feature: JalurFeature;
    lngLat: [number, number];
    onClose: () => void;
}) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(<JalurPopupCard feature={feature} />);

        const popup = new maplibregl.Popup({
            closeButton: true,
            className: 'mapcn-popup',
            maxWidth: '300px',
        })
            .setLngLat(lngLat)
            .setDOMContent(el)
            .addTo(map);

        const handleClose = () => onClose();
        popup.on('close', handleClose);

        return () => {
            popup.off('close', handleClose);
            popup.remove();
            queueMicrotask(() => root.unmount());
        };
    }, [map, isLoaded, feature, lngLat, onClose]);

    return null;
}

function JalurPopupCard({ feature }: { feature: JalurFeature }) {
    const { tipe_kendaraan, warna, nama, kelurahan, jadwal } =
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
                    <CalendarClock className="h-3.5 w-3.5" />
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
        </div>
    );
}

// ─── TPS Resmi ─────────────────────────────────────────────────────────────────

interface TpsResmi {
    id: number;
    latitude: number;
    longitude: number;
}

function TpsMarkersLayer({
    tpsList,
    visible,
}: {
    tpsList: TpsResmi[];
    visible: boolean;
}) {
    const { map, isLoaded } = useMap();
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const popupRef = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        popupRef.current?.remove();
        popupRef.current = null;

        if (!map || !isLoaded || !visible || tpsList.length === 0) {
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
                popupRef.current?.remove();
                popupRef.current = null;

                const container = document.createElement('div');
                container.style.cssText =
                    'width:220px;border-radius:14px;overflow:visible;box-shadow:0 8px 32px rgba(0,0,0,0.18);background:var(--color-card,#fff);border:1px solid var(--color-border,#e5e7eb);position:relative;font-family:system-ui,sans-serif;';
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
                    popupRef.current?.remove();
                    popupRef.current = null;
                });

                header.appendChild(iconWrap);
                header.appendChild(titleWrap);
                header.appendChild(badge);
                header.appendChild(closeBtn);
                container.appendChild(header);

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
                body.appendChild(coordLabel);
                body.appendChild(coordValue);
                container.appendChild(body);

                const caretOuter = document.createElement('div');
                caretOuter.style.cssText =
                    'position:absolute;bottom:-11px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:11px solid var(--color-border,#e5e7eb);z-index:1;';
                container.appendChild(caretOuter);
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
                popupRef.current = popup;
                popup.on('close', () => {
                    popupRef.current = null;
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
            popupRef.current?.remove();
            popupRef.current = null;
        };
         
    }, [map, isLoaded, tpsList, visible]);

    return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JalurAngkut() {
    const [jalurList, setJalurList] = useState<JalurFeature[]>([]);
    const [kelurahans, setKelurahans] = useState<string[]>([]);
    const [filterTipe, setFilterTipe] = useState<string>('');
    const [filterKelurahan, setFilterKelurahan] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [popupJalur, setPopupJalur] = useState<JalurFeature | null>(null);
    const [popupLngLat, setPopupLngLat] = useState<[number, number] | null>(
        null,
    );

    const [tpsList, setTpsList] = useState<TpsResmi[]>([]);
    const [tpsVisible, setTpsVisible] = useState(true);

    const kelurahanDisabled = isKelurahanFilterDisabled(filterTipe);

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

    useEffect(() => {
        fetch('/user/jalur-angkut/kelurahans')
            .then((r) => r.json())
            .then(setKelurahans)
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetch('/user/tps-resmi/data')
            .then((r) => r.json())
            .then(setTpsList)
            .catch(console.error);
    }, []);

    // Kosongkan filter kelurahan saat bukan Pick Up
    useEffect(() => {
        if (filterTipe !== 'Pick Up') {
            setFilterKelurahan('');
        }
    }, [filterTipe]);

    const fetchData = useCallback(async (tipe: string, kelurahan: string) => {
        if (!tipe && !kelurahan) {
            setJalurList([]);

            return;
        }

        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (tipe) {
                params.set('tipe', tipe);
            }

            if (kelurahan && tipe === 'Pick Up') {
                params.set('kelurahan', kelurahan);
            }

            const res = await fetch(`/user/jalur-angkut/data?${params}`);
            const data: JalurFeature[] = await res.json();
            setJalurList(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const effectiveKelurahan = filterTipe === 'Pick Up' ? filterKelurahan : '';

    const closePopup = useCallback(() => {
        setPopupJalur(null);
        setPopupLngLat(null);
    }, []);

    useEffect(() => {
        fetchData(filterTipe, effectiveKelurahan);
    }, [filterTipe, effectiveKelurahan, fetchData]);

    useEffect(() => {
        closePopup();
    }, [filterTipe, effectiveKelurahan, closePopup]);

    const handleJalurSelect = useCallback(
        (feature: JalurFeature, lngLat: maplibregl.LngLat) => {
            setPopupJalur(feature);
            setPopupLngLat([lngLat.lng, lngLat.lat]);
        },
        [],
    );

    const hasFilter = filterTipe !== '' || effectiveKelurahan !== '';
    const countByTipe = (tipe: TipeKendaraan) =>
        jalurList.filter((j) => j.properties.tipe_kendaraan === tipe).length;

    const fitBoundsKey = `${filterTipe}|${effectiveKelurahan}|${jalurList.length}`;

    return (
        <>
            <Head title="Jalur Angkut" />

            <style>{`
                .mapcn-popup--clean .maplibregl-popup-content {
                    padding:0!important;border-radius:14px!important;
                    box-shadow:none!important;background:transparent!important;overflow:visible!important;
                }
                .mapcn-popup--clean .maplibregl-popup-tip { display:none!important; }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="max-w-2xl">
                    <FadeIn delay={100}>
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                            Jalur Angkut Sampah
                        </h1>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                            Pilih Tipe Kendaraan untuk menampilkan jalur di peta
                        </p>
                    </FadeIn>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {(Object.keys(TIPE_CONFIG) as TipeKendaraan[]).map(
                        (tipe) => {
                            const cfg = TIPE_CONFIG[tipe];
                            const active = filterTipe === tipe;

                            return (
                                <button
                                    key={tipe}
                                    type="button"
                                    onClick={() =>
                                        setFilterTipe(active ? '' : tipe)
                                    }
                                    className={`flex items-center gap-2 sm:gap-3 rounded-2xl border p-3 sm:p-4 text-left transition-all ${
                                        active
                                            ? `border-transparent ring-2 ring-offset-1 ${cfg.pill}`
                                            : 'border-border bg-card hover:bg-muted/50'
                                    }`}
                                >
                                    <span
                                        className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot}`}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            {cfg.label}
                                        </p>
                                        <p className="text-xl font-extrabold text-foreground">
                                            {active || filterTipe === ''
                                                ? countByTipe(tipe)
                                                : '—'}
                                        </p>
                                    </div>
                                </button>
                            );
                        },
                    )}
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-card px-4 py-3">
                    {/* Tipe Kendaraan */}
                    <div>
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Tipe Kendaraan
                        </label>
                        <Select
                            value={filterTipe || 'none'}
                            onValueChange={(v) =>
                                setFilterTipe(v === 'none' ? '' : v)
                            }
                        >
                            <SelectTrigger className="h-8 w-[170px] border-border bg-background text-xs font-normal focus-visible:ring-emerald-500/20">
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
                                    <span className="flex items-center gap-2">
                                        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/35 ring-1 ring-border" />
                                        <span>— Pilih Tipe —</span>
                                    </span>
                                </SelectItem>
                                {(Object.keys(TIPE_CONFIG) as TipeKendaraan[]).map(
                                    (tipe) => {
                                        const cfg = TIPE_CONFIG[tipe];

                                        return (
                                            <SelectItem
                                                key={tipe}
                                                value={tipe}
                                                className="cursor-pointer rounded-lg py-2 pr-8 pl-2.5 focus:bg-emerald-500/10"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className={`size-2 shrink-0 rounded-full ${cfg.dot}`}
                                                    />
                                                    <span className="text-xs">
                                                        {cfg.label}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        );
                                    },
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Kelurahan */}
                    <div
                        className={`transition-opacity ${kelurahanDisabled ? 'pointer-events-none opacity-40' : ''}`}
                        title={
                            kelurahanDisabled
                                ? !filterTipe
                                    ? 'Pilih tipe kendaraan dulu'
                                    : 'Filter kelurahan hanya untuk tipe Pick Up'
                                : undefined
                        }
                    >
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Kelurahan
                        </label>
                        <Select
                            value={filterKelurahan || 'all'}
                            onValueChange={(v) =>
                                setFilterKelurahan(v === 'all' ? '' : v)
                            }
                            disabled={kelurahanDisabled}
                        >
                            <SelectTrigger className="h-8 w-[170px] border-border bg-background text-xs font-normal focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed">
                                <SelectValue
                                    placeholder={
                                        kelurahanDisabled
                                            ? !filterTipe
                                                ? 'Pilih tipe dulu'
                                                : 'Hanya Pick Up'
                                            : '— Semua —'
                                    }
                                />
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

                    {(filterTipe || filterKelurahan) && (
                        <Button
                            variant="ghost"
                            className="gap-2"
                            onClick={() => {
                                setFilterTipe('');
                                setFilterKelurahan('');
                            }}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset Filter
                        </Button>
                    )}

                    {hasFilter && !loading && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {jalurList.length} jalur ditemukan
                        </span>
                    )}
                </div>

                {/* Peta */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {!hasFilter && (
                        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                            <Route className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                Pilih Tipe Kendaraan
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/60">
                                untuk menampilkan jalur di peta
                            </p>
                        </div>
                    )}

                    <div className="h-[600px] w-full">
                        <Map
                            center={DEFAULT_CENTER}
                            zoom={8}
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

                            {hasFilter && jalurList.length > 0 && (
                                <MapFitBounds
                                    features={jalurList}
                                    fitKey={fitBoundsKey}
                                />
                            )}

                            {hasFilter && jalurList.length > 0 && (
                                <JalurGeoJsonLayer
                                    features={jalurList}
                                    onSelect={handleJalurSelect}
                                />
                            )}

                            <TpsMarkersLayer
                                tpsList={tpsList}
                                visible={tpsVisible}
                            />

                            {popupJalur && popupLngLat && (
                                <JalurMapPopup
                                    feature={popupJalur}
                                    lngLat={popupLngLat}
                                    onClose={closePopup}
                                />
                            )}
                        </Map>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3">
                        <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                Keterangan:
                            </span>
                        </div>
                        {(Object.keys(TIPE_CONFIG) as TipeKendaraan[]).map(
                            (tipe) => (
                                <div
                                    key={tipe}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                                        style={{
                                            backgroundColor:
                                                TIPE_CONFIG[tipe].warna,
                                        }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {TIPE_CONFIG[tipe].label}
                                    </span>
                                </div>
                            ),
                        )}
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-emerald-500 shadow-sm" />
                            <button
                                type="button"
                                onClick={() => setTpsVisible((v) => !v)}
                                className={`text-xs font-semibold transition-colors ${
                                    tpsVisible
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-muted-foreground/50 line-through'
                                }`}
                            >
                                TPS Resmi
                            </button>
                        </div>
                        <span className="ml-auto text-[11px] text-muted-foreground/60">
                            Klik jalur untuk detail jadwal operasi
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

JalurAngkut.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;
