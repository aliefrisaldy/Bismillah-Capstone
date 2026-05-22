import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Map,
    MapControls,
    MapMarker,
    MapRoute,
    MarkerContent,
    MarkerTooltip,
    useMap,
} from '@/components/ui/map';
import maplibregl from 'maplibre-gl';
import {
    Layers,
    Pencil,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Route,
} from 'lucide-react';

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

interface JalurProperties {
    id: number;
    nama: string | null;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
}

interface JalurFeature {
    type: 'Feature';
    properties: JalurProperties;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

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
    return tipe === 'R6' || tipe === 'Kaisar';
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
        if (!map || !isLoaded || features.length === 0 || !fitKey) return;
        if (lastKey.current === fitKey) return;
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

/** Satu GeoJSON layer untuk semua jalur (performa seperti Leaflet L.geoJSON) */
function JalurGeoJsonLayer({
    features,
    editingId,
    onSelect,
}: {
    features: JalurFeature[];
    editingId: number | null;
    onSelect: (feature: JalurFeature, lngLat: maplibregl.LngLat) => void;
}) {
    const { map, isLoaded } = useMap();
    const featuresRef = useRef(features);
    const onSelectRef = useRef(onSelect);
    const hoveredIdRef = useRef<string | number | null>(null);
    featuresRef.current = features;
    onSelectRef.current = onSelect;

    const clearHover = useCallback(() => {
        if (!map || hoveredIdRef.current == null) return;
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
            features: features
                .filter((f) => f.properties.id !== editingId)
                .map((f) => ({
                    type: 'Feature' as const,
                    id: f.properties.id,
                    properties: { ...f.properties },
                    geometry: f.geometry,
                })),
        }),
        [features, editingId],
    );

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
            clearHover();
            map.off('click', JALUR_LAYER, handleClick);
            map.off('mouseenter', JALUR_LAYER, handleEnter);
            map.off('mouseleave', JALUR_LAYER, handleLeave);
            map.off('mouseout', handleMapLeave);
            if (map.getLayer(JALUR_LAYER)) map.removeLayer(JALUR_LAYER);
            if (map.getSource(JALUR_SOURCE)) map.removeSource(JALUR_SOURCE);
        };
    }, [map, isLoaded, clearHover]);

    useEffect(() => {
        if (!map || !isLoaded) return;
        clearHover();
        const src = map.getSource(JALUR_SOURCE) as
            | maplibregl.GeoJSONSource
            | undefined;
        src?.setData(collection);
    }, [map, isLoaded, collection, clearHover]);

    return null;
}

/** Popup MapLibre imperatif — MapPopup React tidak render pada mount pertama */
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
        root.render(
            <JalurPopupCard feature={feature} onEdit={onEdit} />,
        );

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
    }, [map, isLoaded, feature, lngLat, onClose, onEdit]);

    return null;
}

function JalurPopupCard({
    feature,
    onEdit,
}: {
    feature: JalurFeature;
    onEdit: () => void;
}) {
    const { tipe_kendaraan, warna, nama, kelurahan } = feature.properties;
    const cfg = TIPE_CONFIG[tipe_kendaraan as TipeKendaraan];
    const label = nama ?? tipe_kendaraan;

    return (
        <div className="min-w-[180px] space-y-2">
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
            <button
                type="button"
                onClick={onEdit}
                className="ml-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
            >
                <Pencil className="h-3 w-3" />
                Edit Jalur
            </button>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JalurAngkut() {
    const [jalurList, setJalurList] = useState<JalurFeature[]>([]);
    const [kelurahans, setKelurahans] = useState<string[]>([]);
    const [filterTipe, setFilterTipe] = useState<string>('');
    const [filterKelurahan, setFilterKelurahan] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editCoords, setEditCoords] = useState<[number, number][]>([]);
    const [saving, setSaving] = useState(false);
    const [popupJalur, setPopupJalur] = useState<JalurFeature | null>(null);
    const [popupLngLat, setPopupLngLat] = useState<[number, number] | null>(
        null,
    );
    const [toast, setToast] = useState<{
        type: 'success' | 'error';
        msg: string;
    } | null>(null);

    const kelurahanDisabled = isKelurahanFilterDisabled(filterTipe);

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

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetch('/admin/jalur-angkut/kelurahans')
            .then((r) => r.json())
            .then(setKelurahans)
            .catch(console.error);
    }, []);

    // Kosongkan filter kelurahan saat bukan Pick Up (mis. pindah ke R6/Kaisar)
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
            if (tipe) params.set('tipe', tipe);
            if (kelurahan && tipe === 'Pick Up') {
                params.set('kelurahan', kelurahan);
            }
            const res = await fetch(`/admin/jalur-angkut/data?${params}`);
            const data: JalurFeature[] = await res.json();
            setJalurList(data);
        } catch {
            showToast('error', 'Gagal mengambil data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const effectiveKelurahan =
        filterTipe === 'Pick Up' ? filterKelurahan : '';

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

    const startEdit = useCallback((feature: JalurFeature) => {
        closePopup();
        setEditingId(feature.properties.id);
        setEditCoords([...feature.geometry.coordinates]);
    }, [closePopup]);

    const handleJalurSelect = useCallback(
        (feature: JalurFeature, lngLat: maplibregl.LngLat) => {
            setPopupJalur(feature);
            setPopupLngLat([lngLat.lng, lngLat.lat]);
        },
        [],
    );

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
            fetchData(filterTipe, effectiveKelurahan);
        } catch {
            showToast('error', 'Gagal menyimpan jalur.');
        } finally {
            setSaving(false);
        }
    }, [
        editingId,
        editCoords,
        cancelEdit,
        fetchData,
        filterTipe,
        effectiveKelurahan,
    ]);

    const updateEditCoord = (index: number, lngLat: { lng: number; lat: number }) => {
        setEditCoords((prev) => {
            const next = [...prev];
            next[index] = [lngLat.lng, lngLat.lat];
            return next;
        });
    };

    const hasFilter = filterTipe !== '' || effectiveKelurahan !== '';
    const countByTipe = (tipe: TipeKendaraan) =>
        jalurList.filter((j) => j.properties.tipe_kendaraan === tipe).length;

    const editingFeature = jalurList.find(
        (j) => j.properties.id === editingId,
    );
    const editWarna = editingFeature?.properties.warna ?? '#f59e0b';

    const fitBoundsKey = `${filterTipe}|${effectiveKelurahan}|${jalurList.length}`;

    return (
        <>
            <Head title="Jalur Angkut" />

            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
                        toast.type === 'success'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                    }`}
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
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-extrabold text-foreground">
                        Manajemen Jalur Angkut
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Pilih Tipe Kendaraan untuk menampilkan
                        jalur di peta
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-3">
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
                                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
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
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-[160px]">
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Tipe Kendaraan
                        </label>
                        <div className="relative">
                            <select
                                value={filterTipe}
                                onChange={(e) => setFilterTipe(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="">Semua Tipe</option>
                                {(
                                    Object.keys(TIPE_CONFIG) as TipeKendaraan[]
                                ).map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div
                        className={`relative min-w-[200px] transition-opacity ${
                            kelurahanDisabled
                                ? 'pointer-events-none opacity-40'
                                : ''
                        }`}
                        title={
                            kelurahanDisabled
                                ? 'Filter kelurahan hanya untuk tipe Pick Up'
                                : undefined
                        }
                    >
                        <label className="mb-1 block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            Kelurahan
                        </label>
                        <div className="relative">
                            <select
                                value={filterKelurahan}
                                disabled={kelurahanDisabled}
                                onChange={(e) =>
                                    setFilterKelurahan(e.target.value)
                                }
                                className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed"
                            >
                                <option value="">— Semua Kelurahan —</option>
                                {kelurahans.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    {hasFilter && !loading && (
                        <div className="flex items-end pb-0.5">
                            <span className="text-sm text-muted-foreground">
                                {jalurList.length} jalur ditemukan
                            </span>
                        </div>
                    )}
                </div>

                {/* Peta */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {editingId !== null && (
                        <div className="absolute top-3 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                            <Pencil className="h-4 w-4" />
                            Mode Edit Aktif — geser titik untuk mengubah jalur
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
                                    editingId={editingId}
                                    onSelect={handleJalurSelect}
                                />
                            )}

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

                            {popupJalur &&
                                popupLngLat &&
                                editingId === null && (
                                    <JalurMapPopup
                                        feature={popupJalur}
                                        lngLat={popupLngLat}
                                        onClose={closePopup}
                                        onEdit={() => startEdit(popupJalur)}
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
                        <span className="ml-auto text-[11px] text-muted-foreground/60">
                            Klik jalur untuk detail & edit
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

JalurAngkut.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Jalur Angkut', href: '#' },
    ],
};
