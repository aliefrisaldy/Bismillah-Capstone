import { Head, Link, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    PlusCircle,
    MapPin,
    ClipboardList,
    Timer,
    BadgeCheck,
    ImageOff,
    FilePlus2,
    ChevronLeft,
    ChevronRight,
    Camera,
    FileText,
    Wifi,
    Lightbulb,
    BellRing,
    RotateCw,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import type { LaporanSummary } from '@/types/global';

// ── FadeIn Component ──────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────
type Laporan = {
    id_laporan: number;
    deskripsi: string;
    foto: string | null;
    alamat: string | null;
    status: 'menunggu' | 'diverifikasi' | 'diproses' | 'selesai' | 'ditolak';
    tanggal_laporan: string;
    tanggal_diperbarui: string;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = { laporan: PaginatedData<Laporan> };

const statusConfig = {
    menunggu:     { label: 'MENUNGGU',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    diverifikasi: { label: 'DIVERIFIKASI', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    diproses:     { label: 'DIPROSES',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    selesai:      { label: 'SELESAI',      color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    ditolak:      { label: 'DITOLAK',      color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

// ── Page ──────────────────────────────────────────────────
export default function LaporanIndex({ laporan }: Props) {
    const items = laporan.data;
    const totalLaporan = laporan.total;
    const totalProses = items.filter(
        (l) => l.status === 'menunggu' || l.status === 'diverifikasi' || l.status === 'diproses',
    ).length;
    const totalSelesai = items.filter((l) => l.status === 'selesai').length;
    const { laporan_summary } = usePage<{ laporan_summary: LaporanSummary[] }>().props;

    return (
        <>
            <Head title="Sistem Pelaporan" />

            {/* Hero Section */}
            <div className="mb-16 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                    <FadeIn delay={100}>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/30">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                Sistem Pelaporan Aktif
                            </span>
                        </div>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                            Sistem Pelaporan Tempat{' '}
                            <br className="hidden md:block" />
                            Pembuangan Sampah Ilegal
                        </h1>
                    </FadeIn>
                    <FadeIn delay={300}>
                        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                            Selamat datang kembali, Sahabat Ekologi. Mari bersama menjaga keasrian Kota Palu
                            dengan melaporkan titik pembuangan sampah tidak resmi di lingkungan Anda.
                        </p>
                    </FadeIn>
                </div>
                <FadeIn delay={400} direction="left" className="shrink-0">
                    <Link href="/user/laporan/buat">
                        <Button className="rounded-lg bg-emerald-800 px-6 py-6 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-1 hover:bg-emerald-900">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Buat Laporan Baru
                        </Button>
                    </Link>
                </FadeIn>
            </div>

            {/* Summary Cards */}
            <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                <FadeIn delay={120}>
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Aktivitas</p>
                                <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{totalLaporan}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Total Laporan Saya</p>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
                    </div>
                </FadeIn>

                <FadeIn delay={200}>
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/40">
                                <Timer className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Proses</p>
                                <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{totalProses}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Dalam Proses</p>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
                    </div>
                </FadeIn>

                <FadeIn delay={280}>
                    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900/40">
                                <BadgeCheck className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Berhasil</p>
                                <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">{totalSelesai}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Selesai</p>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-green-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
                    </div>
                </FadeIn>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Laporan */}
                <div className="lg:col-span-2">
                    <FadeIn delay={100}>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">Laporan Terbaru</h2>
                        </div>
                    </FadeIn>

                    {items.length === 0 ? (
                        <FadeIn delay={200}>
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-10">
                                <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
                                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40">
                                    <ClipboardList className="h-7 w-7" />
                                </div>
                                <p className="mt-5 text-xl font-extrabold tracking-tight text-foreground">Belum ada laporan</p>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                                    Kamu belum membuat laporan apapun. Mulai berkontribusi dengan melaporkan
                                    titik pembuangan sampah ilegal di sekitarmu.
                                </p>
                                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                    <Link href="/user/laporan/buat">
                                        <Button className="w-full rounded-xl bg-emerald-800 px-6 text-white hover:bg-emerald-900 sm:w-auto">
                                            <FilePlus2 className="mr-2 h-5 w-5" />
                                            Buat Laporan Pertama
                                        </Button>
                                    </Link>
                                </div>
                                <p className="mt-5 text-[11px] text-muted-foreground">
                                    Tips: foto yang jelas + lokasi GPS akan mempercepat verifikasi.
                                </p>
                            </div>
                        </FadeIn>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {items.map((item) => (
                                <Link
                                    key={item.id_laporan}
                                    href={`/user/laporan/${item.id_laporan}`}
                                    className="group block"
                                >
                                    <div className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md sm:flex-row dark:hover:border-emerald-800">
                                        {Array.isArray(item.foto) ? (
                                            <img
                                                src={`/storage/${item.foto[0]}`}
                                                alt="Foto laporan"
                                                className="h-40 w-full flex-shrink-0 rounded-xl border border-border object-cover sm:h-32 sm:w-40"
                                            />
                                        ) : item.foto ? (
                                            <img
                                                src={`/storage/${item.foto}`}
                                                alt="Foto laporan"
                                                className="h-40 w-full flex-shrink-0 rounded-xl border border-border object-cover sm:h-32 sm:w-40"
                                            />
                                        ) : (
                                            <div className="flex h-40 w-full flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 text-muted-foreground sm:h-32 sm:w-40">
                                                <ImageOff className="h-7 w-7" />
                                                <span className="text-xs font-semibold">Tanpa foto</span>
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col py-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[item.status].color}`}>
                                                    {statusConfig[item.status].label}
                                                </span>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {formatDistanceToNow(new Date(item.tanggal_laporan), { addSuffix: true, locale: id })}
                                                </span>
                                            </div>
                                            <h3 className="mb-2 line-clamp-1 text-lg font-bold text-card-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                {item.alamat || 'Laporan Titik Sampah'}
                                            </h3>
                                            <p className="line-clamp-2 overflow-hidden text-sm leading-relaxed break-words text-muted-foreground">
                                                {item.deskripsi}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {laporan.last_page > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-1.5">
                                    <Link
                                        href={laporan.current_page > 1 ? `?page=${laporan.current_page - 1}` : '#'}
                                        preserveState
                                        preserveScroll
                                        className={`flex size-9 items-center justify-center rounded-lg text-sm transition-colors ${
                                            laporan.current_page > 1
                                                ? 'text-muted-foreground hover:bg-muted'
                                                : 'pointer-events-none text-muted-foreground/30'
                                        }`}
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Link>

                                    {Array.from({ length: laporan.last_page }, (_, i) => i + 1).map((page) => (
                                        <Link
                                            key={page}
                                            href={`?page=${page}`}
                                            preserveState
                                            preserveScroll
                                            className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                                page === laporan.current_page
                                                    ? 'bg-emerald-800 text-white shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {page}
                                        </Link>
                                    ))}

                                    <Link
                                        href={laporan.current_page < laporan.last_page ? `?page=${laporan.current_page + 1}` : '#'}
                                        preserveState
                                        preserveScroll
                                        className={`flex size-9 items-center justify-center rounded-lg text-sm transition-colors ${
                                            laporan.current_page < laporan.last_page
                                                ? 'text-muted-foreground hover:bg-muted'
                                                : 'pointer-events-none text-muted-foreground/30'
                                        }`}
                                    >
                                        <ChevronRight className="size-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Tips Card */}
                <div className="space-y-6 lg:col-span-1">
                    <FadeIn delay={200} direction="left">
                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm dark:border-blue-800/30 dark:bg-blue-950/40">
                            <div className="mb-5 flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-blue-800 dark:text-blue-300" />
                                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300">Tips Melapor Efektif</h3>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    { icon: Camera,   text: 'Ambil foto lokasi dengan cahaya yang cukup' },
                                    { icon: MapPin,   text: 'Nyalakan GPS agar lokasi terdeteksi otomatis' },
                                    { icon: FileText, text: 'Deskripsikan lokasi secara detail dan jelas' },
                                    { icon: Wifi,     text: 'Pastikan koneksi internet stabil saat mengirim' },
                                ].map(({ icon: Icon, text }) => (
                                    <li key={text} className="flex items-start gap-3 text-sm text-blue-700/80 dark:text-blue-400/80">
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>

                
                </div>
            </div>
        </>
    );
}

LaporanIndex.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;

// ── Notification Inline ────────────────────────────────────
const statusColorMap: Record<string, string> = {
    diverifikasi: 'border-l-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
    diproses: 'border-l-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300',
    selesai: 'border-l-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    ditolak: 'border-l-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300',
};

const NotificationInline = ({ laporan_summary }: { laporan_summary: LaporanSummary[] }) => {
    const unread = laporan_summary.filter(
        (l) =>
            !['menunggu'].includes(l.status) &&
            (l.status === 'diverifikasi' || l.status === 'diproses' || l.status === 'selesai' || l.status === 'ditolak'),
    );

    if (unread.length === 0) {
        return null;
    }

    return (
        <FadeIn delay={300} direction="left">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-foreground">
                        Perkembangan Terbaru
                    </h3>
                </div>
                <div className="flex flex-col gap-2">
                    {unread.slice(0, 3).map((l) => (
                        <a
                            key={l.id_laporan}
                            href={`/user/laporan/${l.id_laporan}`}
                            className={`flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm transition-colors hover:opacity-80 ${statusColorMap[l.status] || 'border-l-muted bg-muted text-muted-foreground'}`}
                        >
                            <span className="flex items-center gap-1.5 font-medium">
                                <RotateCw className="size-3.5" />
                                {l.status === 'diverifikasi' && 'Sudah diverifikasi'}
                                {l.status === 'diproses' && 'Sedang diproses'}
                                {l.status === 'selesai' && 'Selesai ditangani'}
                                {l.status === 'ditolak' && 'Ditolak'}
                            </span>
                            <span className="ml-auto shrink-0 text-[11px] opacity-70">
                                {new Date(l.tanggal_diperbarui).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </span>
                        </a>
                    ))}
                </div>
                {unread.length > 3 && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        +{unread.length - 3} laporan lainnya
                    </p>
                )}
            </div>
        </FadeIn>
    );
};