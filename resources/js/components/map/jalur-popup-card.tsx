import { Link } from '@inertiajs/react';
import { CalendarClock, ExternalLink, Pencil } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useMap } from '@/components/ui/map';
import { getHariLabel, normalizeJadwal } from '@/lib/jalur-schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

export interface JalurProperties {
    id: number;
    nama: string | null;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
    jadwal?: unknown;
}

export interface JalurFeature {
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

// ─── Popup Card ────────────────────────────────────────────────────────────────

interface JalurPopupCardProps {
    feature: JalurFeature;
    onEdit?: () => void;
    showDetail?: boolean;
}

export function JalurPopupCard({
    feature,
    onEdit,
    showDetail,
}: JalurPopupCardProps) {
    const { id, tipe_kendaraan, warna, nama, kelurahan, jadwal } =
        feature.properties;
    const cfg = TIPE_CONFIG[tipe_kendaraan as TipeKendaraan];
    const label = nama ?? tipe_kendaraan;
    const jadwalList = normalizeJadwal(jadwal);
    const hasActions = showDetail || onEdit;

    return (
        <div className="min-w-[200px] max-w-[280px]">
            <div className="space-y-3 px-3.5 pb-3.5 pt-3">
                {/* Header: nama + badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: warna }}
                        />
                        <strong
                            className="truncate text-sm leading-tight"
                            style={{ color: warna }}
                        >
                            {label}
                        </strong>
                    </div>
                    <span
                        className="inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight"
                        style={{
                            backgroundColor: `${warna}22`,
                            color: warna,
                        }}
                    >
                        {cfg?.label ?? tipe_kendaraan}
                    </span>
                </div>

                {/* Kelurahan */}
                {kelurahan && (
                    <p className="text-[11px] text-muted-foreground">
                        {kelurahan}
                    </p>
                )}

                {/* Jadwal */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        <CalendarClock className="h-3 w-3" />
                        Jadwal Operasi
                    </div>
                    {jadwalList.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">
                            Belum dijadwalkan
                        </p>
                    ) : (
                        <div className="space-y-0.5">
                            {jadwalList.map((j) => (
                                <div
                                    key={j.hari}
                                    className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-2 py-1 text-[11px]"
                                >
                                    <span className="font-semibold text-foreground">
                                        {getHariLabel(j.hari)}
                                    </span>
                                    <span className="font-mono text-muted-foreground">
                                        {j.jam_mulai}–{j.jam_selesai}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions footer */}
            {hasActions && (
                <div className="flex items-center gap-1.5 border-t border-border px-3.5 py-2">
                    {showDetail && (
                        <Link
                            href={`/admin/jalur/${id}`}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/50"
                        >
                            Lihat Detail
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-600"
                        >
                            <Pencil className="h-3 w-3" />
                            Edit di Peta
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── MapLibre Popup Imperatif ───────────────────────────────────────────────────

interface JalurMapPopupProps {
    feature: JalurFeature;
    lngLat: [number, number];
    onClose: () => void;
    onEdit?: () => void;
    showDetail?: boolean;
    maxWidth?: string;
}

export function JalurMapPopup({
    feature,
    lngLat,
    onClose,
    onEdit,
    showDetail,
    maxWidth = '300px',
}: JalurMapPopupProps) {
    const { map, isLoaded } = useMap();

    useEffect(() => {
        if (!map || !isLoaded) {
            return;
        }

        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(
            <JalurPopupCard
                feature={feature}
                onEdit={onEdit}
                showDetail={showDetail}
            />,
        );

        const popup = new maplibregl.Popup({
            closeButton: false,
            className: 'mapcn-popup',
            maxWidth,
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
    }, [map, isLoaded, feature, lngLat, onClose, onEdit, showDetail, maxWidth]);

    return null;
}
