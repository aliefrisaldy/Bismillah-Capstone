import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeft,
    MapPin,
    CalendarDays,
    Crosshair,
    User,
    CircleDot,
} from 'lucide-react';
import type { ReactNode} from 'react';
import { useEffect, useState } from 'react';
import FadeIn from '@/components/fade-in';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Map, MapMarker } from '@/components/ui/map';

type LaporanStatus =
    | 'menunggu'
    | 'diverifikasi'
    | 'diproses'
    | 'selesai'
    | 'ditolak';

type RiwayatItem = {
    title: string;
    desc?: string | null;
    time?: string | null;
    tone?: 'amber' | 'blue' | 'orange' | 'green' | 'red' | 'muted';
};

type LaporanDetail = {
    id_laporan: number;
    kode_laporan?: string | null;
    deskripsi: string;
    foto: string[] | string | null;
    /** Path relatif di disk `public` (kolom `foto_penanganan` pada tindak lanjut). */
    bukti_pembersihan?: string[] | string | null;
    alamat: string | null;
    status: LaporanStatus;
    tanggal_laporan: string;
    tanggal_diperbarui: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    nama_pelapor?: string | null;
    no_telpon_pelapor?: string | null;
};

type Props = {
    laporan: LaporanDetail;
    riwayat?: RiwayatItem[];
};

const statusConfig: Record<
    LaporanStatus,
    { label: string; pill: string; panel: string; dot: string; hint: string }
> = {
    menunggu: {
        label: 'MENUNGGU',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        panel: 'border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/30',
        dot: 'bg-amber-500',
        hint: 'Laporan sedang menunggu verifikasi admin.',
    },
    diverifikasi: {
        label: 'DIVERIFIKASI',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        panel: 'border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-950/30',
        dot: 'bg-blue-500',
        hint: 'Laporan dinyatakan valid dan siap ditindaklanjuti.',
    },
    diproses: {
        label: 'DIPROSES',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        panel: 'border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-950/30',
        dot: 'bg-orange-500',
        hint: 'Tim kebersihan sedang dalam proses penanganan.',
    },
    selesai: {
        label: 'SELESAI',
        pill: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        panel: 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-950/30',
        dot: 'bg-green-500',
        hint: 'Laporan sudah ditangani dan diselesaikan.',
    },
    ditolak: {
        label: 'DITOLAK',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        panel: 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-950/30',
        dot: 'bg-red-500',
        hint: 'Laporan ditolak. Silakan cek detail/keterangan.',
    },
};

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

const toneToDot: Record<NonNullable<RiwayatItem['tone']>, string> = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    muted: 'bg-slate-300 dark:bg-slate-600',
};

function toNumberOrNull(input?: string | number | null): number | null {
    if (input === null || input === undefined) {
return null;
}

    if (typeof input === 'number') {
return Number.isFinite(input) ? input : null;
}

    const n = Number(String(input).trim());

    return Number.isFinite(n) ? n : null;
}

export default function LaporanShow({ laporan, riwayat }: Props) {
    const displayId =
        laporan.kode_laporan ??
        `REP-${String(laporan.id_laporan).padStart(4, '0')}`;
    const lat = toNumberOrNull(laporan.latitude ?? null);
    const lng = toNumberOrNull(laporan.longitude ?? null);
    const hasCoords = lat !== null && lng !== null;
    const images = (
        Array.isArray(laporan.foto)
            ? laporan.foto
            : typeof laporan.foto === 'string' && laporan.foto
              ? [laporan.foto]
              : []
    ) as string[];
    const buktiImages = (
        Array.isArray(laporan.bukti_pembersihan)
            ? laporan.bukti_pembersihan
            : typeof laporan.bukti_pembersihan === 'string' &&
                laporan.bukti_pembersihan
              ? [laporan.bukti_pembersihan]
              : []
    ) as string[];

    const [selectedImage, setSelectedImage] = useState<string | null>(
        images[0] ?? null,
    );
    const [selectedBukti, setSelectedBukti] = useState<string | null>(
        buktiImages[0] ?? null,
    );
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const imagesKey = images.join('|');
    const buktiKey = buktiImages.join('|');

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
        setSelectedBukti(buktiImages[0] ?? null);
    }, [buktiKey]);
    const resolvedRiwayat = (riwayat ?? []).map((r) => ({
        ...r,
        time: r.time ?? null,
        tone: r.tone ?? 'muted',
    }));

    return (
        <>
            <Head title={`Detail Laporan #${displayId}`} />
                {/* Breadcrumb + Heading */}
                <FadeIn delay={100}>
                    <div className="mb-8">
                        <p className="text-xs font-medium text-muted-foreground">
                            Laporan <span className="mx-2">/</span> Detail #
                            {displayId}
                        </p>
                        <h1 className="mt-2 text-4xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                            Detail Laporan #{displayId}
                        </h1>

                    </div>
                </FadeIn>

                {/* Actions */}
                <FadeIn delay={160} direction="up">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <Link href="/user/laporan" className="sm:mr-auto">
                            <Button
                                variant="outline"
                                className="w-full rounded-xl border-border text-foreground hover:bg-accent hover:text-accent-foreground sm:w-auto"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali ke Daftar
                            </Button>
                        </Link>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left: detail */}
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
                                                    src={`/storage/${selectedImage ?? images[0]}`}
                                                    alt="Foto laporan"
                                                    className="h-[260px] w-full object-cover sm:h-[340px]"
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
                                                                    src={`/storage/${img}`}
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
                                                value: (
                                                    <>
                                                        {laporan.nama_pelapor ??
                                                            'Masyarakat'}
                                                        <br />
                                                        <span className="text-xs font-bold text-muted-foreground">
                                                            {laporan.no_telpon_pelapor ??
                                                                '-'}
                                                        </span>
                                                    </>
                                                ),
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
                                                        href={`/user/peta?laporan_id=${laporan.id_laporan}`}
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

                                    {laporan.status === 'selesai' &&
                                    buktiImages.length > 0 ? (
                                        <FadeIn
                                            delay={hasCoords ? 620 : 560}
                                            direction="up"
                                        >
                                            <div className="mt-6 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 sm:p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                                <h2 className="text-lg font-extrabold text-foreground">
                                                    Bukti Pembersihan
                                                </h2>
                                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                    Dokumentasi lokasi setelah
                                                    penanganan oleh petugas.
                                                </p>
                                                <div className="mt-4 space-y-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveImage(
                                                                selectedBukti ??
                                                                    buktiImages[0],
                                                            )
                                                        }
                                                        className="block w-full overflow-hidden rounded-2xl border border-border"
                                                    >
                                                        <img
                                                            src={`/storage/${selectedBukti ?? buktiImages[0]}`}
                                                            alt="Bukti pembersihan"
                                                            className="h-[200px] w-full object-cover sm:h-[260px]"
                                                        />
                                                    </button>

                                                    {buktiImages.length > 1 ? (
                                                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                                            {buktiImages
                                                                .slice(0, 12)
                                                                .map(
                                                                    (
                                                                        img,
                                                                        idx,
                                                                    ) => (
                                                                        <button
                                                                            key={`${img}-${idx}`}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setSelectedBukti(
                                                                                    img,
                                                                                )
                                                                            }
                                                                            className={`overflow-hidden rounded-xl border ${
                                                                                img ===
                                                                                selectedBukti
                                                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                                                                    : 'border-border'
                                                                            }`}
                                                                        >
                                                                            <img
                                                                                src={`/storage/${img}`}
                                                                                alt={`Bukti ${idx + 1}`}
                                                                                className="h-14 w-full object-cover sm:h-16"
                                                                            />
                                                                        </button>
                                                                    ),
                                                                )}
                                                        </div>
                                                    ) : null}
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
                                Pratinjau gambar
                            </DialogTitle>
                            {activeImage ? (
                                <img
                                    src={`/storage/${activeImage}`}
                                    alt="Pratinjau gambar"
                                    className="max-h-[80vh] w-full rounded-lg object-contain"
                                />
                            ) : null}
                        </DialogContent>
                    </Dialog>

                    {/* Right: status + riwayat + hotline */}
                    <div className="space-y-6 lg:col-span-1">
                        <FadeIn delay={240} direction="left">
                            <div
                                className={`rounded-2xl border p-6 shadow-sm ${statusConfig[laporan.status].panel}`}
                            >
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Status Saat Ini
                                </p>
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wider">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${statusConfig[laporan.status].dot}`}
                                    />
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[laporan.status].pill}`}
                                    >
                                        {statusConfig[laporan.status].label}
                                    </span>
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                    {statusConfig[laporan.status].hint}
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={280} direction="left">
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                <h3 className="text-sm font-extrabold text-foreground">
                                    Riwayat Penanganan
                                </h3>

                                <div className="mt-5 space-y-5">
                                    {resolvedRiwayat.map((item, idx) => (
                                        <FadeIn
                                            key={`${item.title}-${idx}`}
                                            delay={300 + idx * 80}
                                            direction="up"
                                        >
                                            <div className="relative pl-6">
                                                <span
                                                    className={`absolute top-1.5 left-0 h-3 w-3 rounded-full ${toneToDot[item.tone as NonNullable<RiwayatItem['tone']>]}`}
                                                />
                                                {idx !==
                                                    resolvedRiwayat.length -
                                                        1 && (
                                                    <span className="absolute top-5 left-1.5 h-[calc(100%_-_10px)] w-px bg-border" />
                                                )}
                                                <div className="rounded-2xl border border-border bg-background p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="text-xs font-bold text-foreground">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {item.time
                                                                ? format(
                                                                      new Date(
                                                                          item.time,
                                                                      ),
                                                                      'd MMM, HH:mm',
                                                                      {
                                                                          locale: id,
                                                                      },
                                                                  )
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    {item.desc ? (
                                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                                            {item.desc}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </FadeIn>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={320} direction="left">
                            <div className="rounded-2xl bg-emerald-900 p-6 text-white shadow-lg shadow-emerald-900/20">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-15 items-center justify-center rounded-xl bg-white/10">
                                        <CircleDot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm leading-snug font-extrabold">
                                            Punya Informasi Tambahan?
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-white/80">
                                            Hubungi petugas kami jika Anda
                                            memiliki info tambahan terkait
                                            laporan ini.
                                        </p>
                                    </div>
                                </div>

                                <Button className="mt-5 w-full rounded-xl bg-white/10 font-semibold text-white hover:bg-white/15">
                                    Hubungi Hotline
                                </Button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
        </>
    );
}

import UserLayout from '@/layouts/user-layout';
LaporanShow.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;
