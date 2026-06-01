import { Head, Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Download,
    Eye,
    SlidersHorizontal,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    ImageOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState  } from 'react';
import type {ReactNode} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ── FadeIn (selaras dengan halaman user /laporan) ─────────
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

type Stat = {
    total: number;
    menunggu: number;
    diverifikasi: number;
    diproses: number;
    selesai: number;
    ditolak: number;
};

type LaporanItem = {
    id_laporan: number;
    foto: string[] | string | null;
    deskripsi: string;
    alamat: string | null;
    status: 'menunggu' | 'diverifikasi' | 'diproses' | 'selesai' | 'ditolak';
    tanggal_laporan: string;
    pelapor: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Filters = {
    q?: string | null;
    status?: string | null;
    dari?: string | null;
    sampai?: string | null;
};

type Props = {
    stats: Stat | null;
    laporan: Paginator<LaporanItem>;
    filters: Filters;
};

const statusConfig: Record<string, { label: string; color: string }> = {
    menunggu: {
        label: 'MENUNGGU',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    diverifikasi: {
        label: 'DIVERIFIKASI',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    diproses: {
        label: 'DIPROSES',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    selesai: {
        label: 'SELESAI',
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    ditolak: {
        label: 'DITOLAK',
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

/** Radix Select tidak memakai value kosong; `all` dipetakan ke filter tanpa status. */
const STATUS_FILTER_ALL = 'all' as const;

const statusFilterOptions: {
    value: typeof STATUS_FILTER_ALL | LaporanItem['status'];
    label: string;
    dotClass: string;
}[] = [
    {
        value: STATUS_FILTER_ALL,
        label: 'Semua status',
        dotClass: 'bg-muted-foreground/35 ring-1 ring-border',
    },
    {
        value: 'menunggu',
        label: 'Menunggu',
        dotClass: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.25)]',
    },
    {
        value: 'diverifikasi',
        label: 'Diverifikasi',
        dotClass: 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]',
    },
    {
        value: 'diproses',
        label: 'Diproses',
        dotClass: 'bg-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.25)]',
    },
    {
        value: 'selesai',
        label: 'Selesai',
        dotClass: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
    },
    {
        value: 'ditolak',
        label: 'Ditolak',
        dotClass: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.25)]',
    },
];

function buildQuery(filters: Filters) {
    const q: Record<string, string> = {};

    if (filters.q) {
q.q = filters.q;
}

    if (filters.status) {
q.status = filters.status;
}

    if (filters.dari) {
q.dari = filters.dari;
}

    if (filters.sampai) {
q.sampai = filters.sampai;
}

    return q;
}

function toExportUrl(filters: Filters) {
    const params = new URLSearchParams(buildQuery(filters));
    const qs = params.toString();

    return qs ? `/admin/laporan/export?${qs}` : '/admin/laporan/export';
}

export default function AdminLaporanIndex({ stats, laporan, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [dari, setDari] = useState(filters?.dari ?? '');
    const [sampai, setSampai] = useState(filters?.sampai ?? '');
    const lastSerializedRef = useRef<string>('');
    const [isFiltering, setIsFiltering] = useState(false);

    const activeFilters = useMemo<Filters>(
        () => ({
            q: q?.trim() ? q.trim() : null,
            status: status || null,
            dari: dari || null,
            sampai: sampai || null,
        }),
        [q, status, dari, sampai],
    );

    useEffect(() => {
        const serialized = JSON.stringify(buildQuery(activeFilters));

        if (serialized === lastSerializedRef.current) {
return;
}

        const t = setTimeout(() => {
            lastSerializedRef.current = serialized;
            setIsFiltering(true);
            router.get('/admin/laporan', buildQuery(activeFilters), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['laporan', 'filters'],
                onFinish: () => setIsFiltering(false),
            });
        }, 350);

        return () => clearTimeout(t);
    }, [activeFilters]);

    const safeStats: Stat = stats ?? {
        total: 0,
        menunggu: 0,
        diverifikasi: 0,
        diproses: 0,
        selesai: 0,
        ditolak: 0,
    };

    const statCards = [
        {
            label: 'Total Laporan',
            value: safeStats.total,
            icon: ClipboardList,
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },
        {
            label: 'Laporan Baru',
            value: safeStats.menunggu,
            icon: Clock,
            color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        },
        {
            label: 'Verifikasi',
            value: safeStats.diverifikasi,
            icon: ShieldCheck,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            label: 'Dalam Proses',
            value: safeStats.diproses,
            icon: Loader2,
            color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        },
        {
            label: 'Selesai',
            value: safeStats.selesai,
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            label: 'Ditolak',
            value: safeStats.ditolak,
            icon: XCircle,
            color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        },
    ];

    const resetFilters = () => {
        setQ('');
        setStatus('');
        setDari('');
        setSampai('');
    };

    const exportCsv = () => {
        window.location.href = toExportUrl(activeFilters);
    };

    const getFotoSrc = (foto: LaporanItem['foto']): string | null => {
        const path = Array.isArray(foto)
            ? foto[0]
            : typeof foto === 'string'
              ? foto
              : null;

        if (!path) {
return null;
}

        return path.startsWith('http://') || path.startsWith('https://')
            ? path
            : `/storage/${path}`;
    };

    return (
        <>
            <Head title="Manajemen Laporan Sampah" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Hero */}
                <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                        <FadeIn delay={100}>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/30">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                    Pakagasa — Manajemen Laporan
                                </span>
                            </div>
                        </FadeIn>
                        <FadeIn delay={200}>
                            <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-5xl">
                                Manajemen Laporan Tempat Sampah Ilegal
                            </h1>
                        </FadeIn>
                        <FadeIn delay={300}>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                                Pantau, verifikasi, dan kelola seluruh laporan
                                warga secara real-time.
                            </p>
                        </FadeIn>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {statCards.map((card, index) => (
                        <FadeIn key={card.label} delay={120 + index * 45}>
                            <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border/70">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color} ring-1 ring-border/40`}
                                >
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                                        {card.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {card.label}
                                    </p>
                                </div>
                                <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl transition-opacity group-hover:opacity-90" />
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Filters */}
                <FadeIn delay={100}>
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 md:p-6 dark:border-sidebar-border">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold">
                                                Filter Laporan
                                            </p>
                                            {isFiltering && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                                    Memuat…
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Perubahan filter diterapkan
                                            otomatis.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={exportCsv}
                                    >
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="gap-2"
                                        onClick={resetFilters}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Reset Filter
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                                {/* Search */}
                                <div className="w-full md:flex-1">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Pencarian
                                    </label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={q}
                                            onChange={(e) =>
                                                setQ(e.target.value)
                                            }
                                            placeholder="Cari ID, pelapor, alamat, atau deskripsi…"
                                            className="h-11 pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="w-full md:w-[240px]">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <Select
                                        value={status || STATUS_FILTER_ALL}
                                        onValueChange={(v) =>
                                            setStatus(
                                                v === STATUS_FILTER_ALL
                                                    ? ''
                                                    : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full border-input bg-background font-normal shadow-sm ring-offset-background focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:bg-input/30 dark:hover:bg-input/45">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent
                                            align="start"
                                            className="min-w-[var(--radix-select-trigger-width)] rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
                                        >
                                            {statusFilterOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground dark:focus:bg-emerald-500/15"
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <span
                                                            className={`size-2 shrink-0 rounded-full ${opt.dotClass}`}
                                                            aria-hidden
                                                        />
                                                        <span className="truncate text-sm">
                                                            {opt.label}
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date range */}
                                <div className="w-full md:w-[320px]">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Rentang Tanggal
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            aria-label="Dari tanggal"
                                            type="date"
                                            value={dari}
                                            onChange={(e) =>
                                                setDari(e.target.value)
                                            }
                                            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            —
                                        </span>
                                        <input
                                            aria-label="Sampai tanggal"
                                            type="date"
                                            value={sampai}
                                            onChange={(e) =>
                                                setSampai(e.target.value)
                                            }
                                            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground">
                                Tips: ketik angka saja untuk cepat menemukan ID.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-card p-4 md:p-6 dark:border-sidebar-border">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">
                            Daftar Laporan
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {laporan.from ?? 0}-{laporan.to ?? 0}{' '}
                            dari {laporan.total} laporan
                        </p>
                    </div>

                    {isFiltering ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }, (_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                                >
                                    <div className="h-44 w-full bg-muted/70" />
                                    <div className="space-y-3 p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-20 rounded-full bg-muted/70" />
                                            <div className="h-3 w-24 rounded bg-muted/50" />
                                        </div>
                                        <div className="h-4 w-full rounded bg-muted/70" />
                                        <div className="h-3 w-3/4 rounded bg-muted/50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : laporan.data.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-12 text-center">
                            <div>
                                <p className="text-lg font-semibold">
                                    Tidak ada data
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Coba ubah filter atau reset untuk melihat
                                    semua laporan.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {laporan.data.map((item) => (
                                    <div
                                        key={item.id_laporan}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-800"
                                    >
                                        {(() => {
                                            const fotoSrc = getFotoSrc(
                                                item.foto,
                                            );

                                            return fotoSrc ? (
                                                <div className="relative h-44 w-full overflow-hidden">
                                                    <img
                                                        src={fotoSrc}
                                                        alt="Foto laporan"
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute top-3 left-3">
                                                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
                                                            #REP-
                                                            {String(
                                                                item.id_laporan,
                                                            ).padStart(5, '0')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative flex h-44 w-full flex-col items-center justify-center gap-2 bg-muted/40">
                                                    <div className="absolute top-3 left-3">
                                                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
                                                            #REP-
                                                            {String(
                                                                item.id_laporan,
                                                            ).padStart(5, '0')}
                                                        </span>
                                                    </div>
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                                                        <ImageOff className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                        Tanpa foto
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex flex-1 flex-col gap-3 p-5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[item.status]?.color}`}
                                                >
                                                    {statusConfig[item.status]
                                                        ?.label ?? item.status}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.tanggal_laporan}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="mb-1 line-clamp-1 text-sm font-semibold text-foreground">
                                                    {item.alamat ||
                                                        'Lokasi tidak tersedia'}
                                                </p>
                                                <p className="line-clamp-2 text-sm leading-relaxed break-words text-muted-foreground">
                                                    {item.deskripsi}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border pt-3">
                                                <span className="text-xs text-muted-foreground">
                                                    {item.pelapor ?? 'Anonim'}
                                                </span>
                                                <Link
                                                    href={`/admin/laporan/${item.id_laporan}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Detail
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {laporan.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-6">
                                    <button
                                        type="button"
                                        disabled={
                                            isFiltering ||
                                            laporan.current_page <= 1
                                        }
                                        onClick={() =>
                                            laporan.current_page > 1 &&
                                            router.get(
                                                `?page=${laporan.current_page - 1}`,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    only: [
                                                        'laporan',
                                                        'filters',
                                                    ],
                                                },
                                            )
                                        }
                                        className={`flex size-9 items-center justify-center rounded-lg text-sm transition-colors ${
                                            laporan.current_page <= 1 ||
                                            isFiltering
                                                ? 'pointer-events-none text-muted-foreground/30'
                                                : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>

                                    {Array.from(
                                        { length: laporan.last_page },
                                        (_, i) => i + 1,
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            disabled={isFiltering}
                                            onClick={() =>
                                                router.get(
                                                    `?page=${page}`,
                                                    {},
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        only: [
                                                            'laporan',
                                                            'filters',
                                                        ],
                                                    },
                                                )
                                            }
                                            className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                                page === laporan.current_page
                                                    ? 'bg-emerald-800 text-white shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted'
                                            } ${isFiltering ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        disabled={
                                            isFiltering ||
                                            laporan.current_page >=
                                                laporan.last_page
                                        }
                                        onClick={() =>
                                            laporan.current_page <
                                                laporan.last_page &&
                                            router.get(
                                                `?page=${laporan.current_page + 1}`,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    only: [
                                                        'laporan',
                                                        'filters',
                                                    ],
                                                },
                                            )
                                        }
                                        className={`flex size-9 items-center justify-center rounded-lg text-sm transition-colors ${
                                            laporan.current_page >=
                                                laporan.last_page || isFiltering
                                                ? 'pointer-events-none text-muted-foreground/30'
                                                : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

AdminLaporanIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daftar Laporan',
            href: '/admin/laporan',
        },
    ],
};
