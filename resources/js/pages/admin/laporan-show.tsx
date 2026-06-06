import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeft,
    Loader2,
    Printer,
    Trash2,
    MapPin,
    Crosshair,
    CalendarDays,
    User,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Map, MapMarker } from '@/components/ui/map';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const FadeIn = ({
    children,
    delay = 0,
    direction = 'up',
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    className?: string;
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);

                        if (domRef.current) {
observer.unobserve(domRef.current);
}
                    }
                });
            },
            { threshold: 0.1 },
        );
        const currentRef = domRef.current;

        if (currentRef) {
observer.observe(currentRef);
}

        return () => {
            if (currentRef) {
observer.unobserve(currentRef);
}
        };
    }, []);

    const directionClasses = {
        up: 'translate-y-10',
        down: '-translate-y-10',
        left: 'translate-x-10',
        right: '-translate-x-10',
        none: 'scale-95',
    };

    return (
        <div
            ref={domRef}
            className={`transition-all duration-700 ease-out ${className} ${
                isVisible
                    ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
                    : `opacity-0 ${directionClasses[direction]}`
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

type LaporanStatus =
    | 'menunggu'
    | 'diverifikasi'
    | 'diproses'
    | 'selesai'
    | 'ditolak';

type Props = {
    laporan: {
        id_laporan: number;
        deskripsi: string;
        foto: string[] | string | null;
        alamat: string | null;
        latitude: string | number | null;
        longitude: string | number | null;
        status: LaporanStatus;
        tanggal_laporan: string | null;
        pelapor: {
            nama?: string | null;
            email?: string | null;
            no_telpon?: string | null;
        } | null;
        tindak_lanjut: Array<{
            catatan: string | null;
            foto_penanganan: string[] | string | null;
            tanggal: string | null;
            admin: string | null;
        }>;
        riwayat_status: Array<{
            status_lama: LaporanStatus | string | null;
            status_baru: LaporanStatus | string | null;
            catatan: string | null;
            tanggal: string | null;
            admin: string | null;
        }>;
    };
};

const statusMeta: Record<
    LaporanStatus,
    { label: string; pill: string; dot: string }
> = {
    menunggu: {
        label: 'Menunggu',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    diverifikasi: {
        label: 'Diverifikasi',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
    },
    diproses: {
        label: 'Diproses',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        dot: 'bg-orange-500',
    },
    selesai: {
        label: 'Selesai',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
    ditolak: {
        label: 'Ditolak',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
    },
};

function toNumberOrNull(
    input: string | number | null | undefined,
): number | null {
    if (input === null || input === undefined) {
return null;
}

    if (typeof input === 'number') {
return Number.isFinite(input) ? input : null;
}

    const n = Number(String(input).trim());

    return Number.isFinite(n) ? n : null;
}

function safeDateLabel(input?: string | null) {
    if (!input) {
return '-';
}

    const d = new Date(input);

    if (Number.isNaN(d.getTime())) {
return '-';
}

    return format(d, 'EEEE, d MMMM yyyy - HH:mm', { locale: id }) + ' WITA';
}

const ALL_STATUSES: LaporanStatus[] = [
    'menunggu',
    'diverifikasi',
    'diproses',
    'selesai',
    'ditolak',
];

function forwardStatus(current: LaporanStatus): LaporanStatus | null {
    const m: Partial<Record<LaporanStatus, LaporanStatus>> = {
        menunggu: 'diverifikasi',
        diverifikasi: 'diproses',
        diproses: 'selesai',
    };

    return m[current] ?? null;
}

function fotoSrc(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

function isStatusSelectable(
    current: LaporanStatus,
    target: LaporanStatus,
): boolean {
    if (current === 'selesai' || current === 'ditolak') {
return false;
}

    if (target === current) {
return false;
}

    if (target === 'ditolak') {
return true;
}

    return forwardStatus(current) === target;
}

export default function AdminLaporanShow({ laporan }: Props) {
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string } }).flash;
    const errors =
        (page.props as { errors?: Record<string, string> }).errors ?? {};
    const displayId = `REP-${String(laporan.id_laporan).padStart(5, '0')}`;
    const lat = toNumberOrNull(laporan.latitude);
    const lng = toNumberOrNull(laporan.longitude);
    const hasCoords = lat !== null && lng !== null;

    const images = useMemo(() => {
        const foto = laporan.foto;

        if (Array.isArray(foto)) {
return foto.filter(Boolean);
}

        if (typeof foto === 'string' && foto) {
return [foto];
}

        return [];
    }, [laporan.foto]);

    const latestTindakLanjut = useMemo(() => {
        const arr = laporan.tindak_lanjut ?? [];

        return arr.length ? arr[arr.length - 1] : null;
    }, [laporan.tindak_lanjut]);

    const terminal =
        laporan.status === 'selesai' || laporan.status === 'ditolak';

    const defaultNextStatus = useMemo(() => {
        if (terminal) {
return laporan.status;
}

        const forward = forwardStatus(laporan.status);

        if (forward && isStatusSelectable(laporan.status, forward)) {
return forward;
}

        if (isStatusSelectable(laporan.status, 'ditolak')) {
return 'ditolak';
}

        return laporan.status;
    }, [terminal, laporan.status]);

    const [nextStatus, setNextStatus] =
        useState<LaporanStatus>(defaultNextStatus);
    const [catatan, setCatatan] = useState('');
    const [fotoBuktiFiles, setFotoBuktiFiles] = useState<File[]>([]);
    const [fotoInputKey, setFotoInputKey] = useState(0);
    const [saving, setSaving] = useState(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(
        images[0] ?? null,
    );
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const imagesKey = images.join('|');

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
        setSelectedImage(images[0] ?? null);
    }, [imagesKey]);

    useEffect(() => {
        setNextStatus(defaultNextStatus);
        setFotoBuktiFiles([]);
        setFotoInputKey((k) => k + 1);
    }, [laporan.status, defaultNextStatus]);

    const canSave =
        !terminal &&
        isStatusSelectable(laporan.status, nextStatus) &&
        (nextStatus !== 'selesai' || fotoBuktiFiles.length > 0) &&
        !saving;

    const submitStatus = () => {
        if (!canSave) {
return;
}

        setSaving(true);

        const fd = new FormData();
        fd.append('status', nextStatus);

        if (catatan.trim()) {
fd.append('catatan', catatan.trim());
}

        if (nextStatus === 'selesai') {
            fotoBuktiFiles.forEach((file) =>
                fd.append('foto_penanganan[]', file),
            );
        }

        router.post(`/admin/laporan/${laporan.id_laporan}/status`, fd, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setSaving(false),
            onSuccess: () => {
                setCatatan('');
                setFotoBuktiFiles([]);
                setFotoInputKey((k) => k + 1);
            },
        });
    };

    return (
        <>
            <Head title={`Detail Laporan #${displayId}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/laporan">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                #{displayId}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Waste Report Details</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            disabled
                            title="Belum ada endpoint delete"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {flash?.success ? (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/40 dark:text-emerald-200 print:hidden">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <FadeIn delay={200}>
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="p-5 sm:p-6">
                                    {images.length ? (
                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveImage(
                                                        selectedImage,
                                                    )
                                                }
                                                className="block w-full overflow-hidden rounded-2xl border border-border"
                                            >
                                                <img
                                                    src={fotoSrc(
                                                        selectedImage ??
                                                            images[0],
                                                    )}
                                                    alt="Foto laporan"
                                                    className="h-[260px] w-full object-cover sm:h-[340px]"
                                                    loading="lazy"
                                                />
                                            </button>

                                            {images.length > 1 ? (
                                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                                    {images
                                                        .slice(0, 12)
                                                        .map((img, idx) => (
                                                            <button
                                                                key={`${img}-${idx}`}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedImage(
                                                                        img,
                                                                    )
                                                                }
                                                                className={`overflow-hidden rounded-xl border ${
                                                                    img ===
                                                                    selectedImage
                                                                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                                                        : 'border-border'
                                                                }`}
                                                            >
                                                                <img
                                                                    src={fotoSrc(
                                                                        img,
                                                                    )}
                                                                    alt={`Foto ${idx + 1}`}
                                                                    className="h-14 w-full object-cover sm:h-16"
                                                                />
                                                            </button>
                                                        ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="flex h-[260px] w-full items-center justify-center rounded-2xl border border-border bg-muted text-4xl sm:h-[340px]">
                                            🗑️
                                        </div>
                                    )}
                                </div>

                                <div className="px-5 pb-6 sm:px-6">
                                    <h2 className="text-lg font-extrabold text-foreground">
                                        Deskripsi Temuan
                                    </h2>
                                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-line break-words text-muted-foreground">
                                        {laporan.deskripsi}
                                    </p>

                                    <div className="mt-6 grid grid-cols-1 gap-4 sm:[grid-auto-rows:1fr] sm:grid-cols-2">
                                        {[
                                            {
                                                label: 'Alamat Lengkap',
                                                icon: MapPin,
                                                iconClass:
                                                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                                                value: laporan.alamat ?? '-',
                                                valueClass:
                                                    'text-sm font-semibold leading-snug text-foreground',
                                            },
                                            {
                                                label: 'Koordinat GPS',
                                                icon: Crosshair,
                                                iconClass:
                                                    'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
                                                value: hasCoords
                                                    ? `${lat}, ${lng}`
                                                    : '-',
                                                valueClass:
                                                    'font-mono text-sm font-semibold text-foreground',
                                            },
                                            {
                                                label: 'Tanggal Laporan',
                                                icon: CalendarDays,
                                                iconClass:
                                                    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                                value: safeDateLabel(
                                                    laporan.tanggal_laporan,
                                                ),
                                                valueClass:
                                                    'text-sm font-semibold text-foreground',
                                            },
                                            {
                                                label: 'Pelapor',
                                                icon: User,
                                                iconClass:
                                                    'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
                                                value:
                                                    laporan.pelapor?.nama ??
                                                    '-',
                                                valueClass:
                                                    'text-sm font-semibold text-foreground',
                                            },
                                        ].map(
                                            (
                                                {
                                                    label,
                                                    icon: Icon,
                                                    iconClass,
                                                    value,
                                                    valueClass,
                                                },
                                                idx,
                                            ) => (
                                                <FadeIn
                                                    key={label}
                                                    delay={260 + idx * 70}
                                                    direction="up"
                                                >
                                                    <div className="flex h-full items-center gap-3 rounded-2xl border border-border bg-background p-4">
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border ${iconClass}`}
                                                        >
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                                {label}
                                                            </p>
                                                            <p
                                                                className={`mt-1 ${valueClass}`}
                                                            >
                                                                {value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </FadeIn>
                                            ),
                                        )}
                                    </div>

                                    {hasCoords ? (
                                        <FadeIn delay={560} direction="up">
                                            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
                                                <div className="relative z-0 h-[240px] w-full sm:h-[280px]">
                                                    <Link
                                                        href={`/admin/peta?laporan_id=${laporan.id_laporan}`}
                                                        className="absolute top-3 right-3 z-[1] rounded-full border border-border bg-background/90 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm backdrop-blur hover:underline dark:text-emerald-300"
                                                    >
                                                        Buka di Peta
                                                    </Link>
                                                    <Map
                                                        center={[
                                                            lng,
                                                            lat,
                                                        ]}
                                                        zoom={16}
                                                        className="z-0"
                                                        theme={theme}
                                                    >
                                                        <MapMarker
                                                            longitude={lng}
                                                            latitude={lat}
                                                        >
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                                                                <MapPin className="h-5 w-5 text-white" />
                                                            </div>
                                                        </MapMarker>
                                                    </Map>
                                                </div>
                                            </div>
                                        </FadeIn>
                                    ) : null}
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    <Dialog
                        open={!!activeImage}
                        onOpenChange={(open) => {
                            if (!open) {
setActiveImage(null);
}
                        }}
                    >
                        <DialogContent className="max-w-5xl p-0">
                            <DialogTitle className="sr-only">
                                Foto laporan
                            </DialogTitle>
                            {activeImage ? (
                                <img
                                    src={fotoSrc(activeImage)}
                                    alt="Foto laporan"
                                    className="max-h-[80vh] w-full rounded-lg object-contain"
                                />
                            ) : null}
                        </DialogContent>
                    </Dialog>

                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="text-lg font-extrabold text-foreground">
                                Update Status
                            </h3>
                            
                            {errors.status ? (
                                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                                    {errors.status}
                                </p>
                            ) : null}

                            {terminal ? (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Laporan ini sudah berstatus final (
                                    <span className="font-semibold text-foreground">
                                        {statusMeta[laporan.status].label}
                                    </span>
                                    ) dan tidak dapat diubah.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                            Status laporan
                                        </label>
                                        <Select
                                            value={nextStatus}
                                            onValueChange={(v) => {
                                                const target =
                                                    v as LaporanStatus;

                                                if (
                                                    !isStatusSelectable(
                                                        laporan.status,
                                                        target,
                                                    )
                                                ) {
return;
}

                                                setNextStatus(target);

                                                if (target !== 'selesai') {
                                                    setFotoBuktiFiles([]);
                                                    setFotoInputKey(
                                                        (k) => k + 1,
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-11 w-full bg-background">
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                            <SelectContent
                                                align="start"
                                                className="min-w-[var(--radix-select-trigger-width)]"
                                            >
                                                {ALL_STATUSES.map((value) => {
                                                    const selectable =
                                                        isStatusSelectable(
                                                            laporan.status,
                                                            value,
                                                        );
                                                    const isCurrent =
                                                        value ===
                                                        laporan.status;

                                                    return (
                                                        <SelectItem
                                                            key={value}
                                                            value={value}
                                                            disabled={
                                                                !selectable
                                                            }
                                                            className={
                                                                !selectable
                                                                    ? 'cursor-not-allowed opacity-40 blur-[0.3px] saturate-50'
                                                                    : 'cursor-pointer'
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className={`size-2 rounded-full ${statusMeta[value].dot}`}
                                                                    aria-hidden
                                                                />
                                                                <span>
                                                                    {
                                                                        statusMeta[
                                                                            value
                                                                        ].label
                                                                    }
                                                                    {isCurrent
                                                                        ? ' (saat ini)'
                                                                        : ''}
                                                                </span>
                                                            </span>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span
                                                className={`size-2 rounded-full ${statusMeta[laporan.status].dot}`}
                                                aria-hidden
                                            />
                                            <span>
                                                Status saat ini:{' '}
                                                <span
                                                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${statusMeta[laporan.status].pill}`}
                                                >
                                                    {
                                                        statusMeta[
                                                            laporan.status
                                                        ].label
                                                    }
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {nextStatus === 'selesai' ? (
                                        <div>
                                            <Label
                                                htmlFor="foto-bukti"
                                                className="mb-1 block text-xs font-medium text-muted-foreground"
                                            >
                                                Foto bukti pembersihan{' '}
                                                <span className="text-red-600">
                                                    *
                                                </span>
                                                <span className="font-normal text-muted-foreground">
                                                    {' '}
                                                    (bisa lebih dari satu)
                                                </span>
                                            </Label>
                                            <input
                                                key={fotoInputKey}
                                                id="foto-bukti"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                                                onChange={(e) => {
                                                    setFotoBuktiFiles(
                                                        Array.from(
                                                            e.target.files ??
                                                                [],
                                                        ),
                                                    );
                                                }}
                                            />
                                            {fotoBuktiFiles.length > 0 ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    {fotoBuktiFiles.length} file
                                                    dipilih
                                                </p>
                                            ) : null}
                                            {errors.foto_penanganan ? (
                                                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                                                    {errors.foto_penanganan}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                            Catatan Admin
                                        </label>
                                        <Textarea
                                            value={catatan}
                                            onChange={(e) =>
                                                setCatatan(e.target.value)
                                            }
                                            placeholder="Tambahkan catatan (opsional)..."
                                            className="min-h-[110px] resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={submitStatus}
                                        disabled={!canSave}
                                        className="h-11 w-full rounded-xl bg-emerald-800 font-semibold text-white hover:bg-emerald-900"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            'Simpan Perubahan'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                       

                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <h3 className="text-lg font-extrabold text-foreground">
                                Timeline Riwayat
                            </h3>
                            <div className="mt-5 space-y-5">
                                {(laporan.riwayat_status?.length
                                    ? [...laporan.riwayat_status].reverse()
                                    : []
                                ).map((r, idx, arr) => {
                                    const s = (r.status_baru ?? 'menunggu') as
                                        | LaporanStatus
                                        | string;
                                    const known =
                                        s in statusMeta
                                            ? (s as LaporanStatus)
                                            : null;

                                    return (
                                        <div
                                            key={`${r.tanggal}-${idx}`}
                                            className="relative pl-6"
                                        >
                                            <span
                                                className={`absolute top-1.5 left-0 h-3 w-3 rounded-full ${known ? statusMeta[known].dot : 'bg-slate-300 dark:bg-slate-600'}`}
                                            />
                                            {idx !== arr.length - 1 ? (
                                                <span className="absolute top-5 left-1.5 h-[calc(100%_-_10px)] w-px bg-border" />
                                            ) : null}

                                            <div className="rounded-2xl border border-border bg-background p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-xs font-bold text-foreground">
                                                        Status diubah ke{' '}
                                                        <span className="capitalize">
                                                            {known
                                                                ? statusMeta[
                                                                      known
                                                                  ].label
                                                                : String(s)}
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {r.tanggal ?? ''}
                                                    </p>
                                                </div>
                                                {r.catatan ? (
                                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                                        &ldquo;{r.catatan}
                                                        &rdquo;
                                                    </p>
                                                ) : null}
                                                <p className="mt-2 text-[11px] text-muted-foreground">
                                                    Oleh {r.admin ?? 'Admin'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!laporan.riwayat_status?.length ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada riwayat status.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AdminLaporanShow.layout = {
    breadcrumbs: [
        { title: 'Daftar Laporan', href: '/admin/laporan' },
        { title: 'Detail Laporan', href: '#' },
    ],
};
