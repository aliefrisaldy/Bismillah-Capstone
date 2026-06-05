import { Head, Link, router } from '@inertiajs/react';
import {
    MapPin,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
    RotateCcw,
    Loader2,
    Power,
    Trash2,
    Eye,
    Pencil,
    Download,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

type TpsItem = {
    id: number;
    nama: string | null;
    latitude: number;
    longitude: number;
    aktif: boolean;
    created_at: string | null;
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
    aktif?: string | null;
};

type Props = {
    stats: { total: number; aktif: number; nonaktif: number };
    tps: Paginator<TpsItem>;
    filters: Filters;
};

const AKTIF_FILTER_ALL = 'all' as const;

const aktifFilterOptions = [
    { value: AKTIF_FILTER_ALL, label: 'Semua status' },
    { value: '1', label: 'Aktif' },
    { value: '0', label: 'Nonaktif' },
] as const;

function buildQuery(filters: Filters) {
    const q: Record<string, string> = {};

    if (filters.q) {
        q.q = filters.q;
    }

    if (filters.aktif) {
        q.aktif = filters.aktif;
    }

    return q;
}

export default function TpsResmiIndex({ stats, tps, filters }: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [aktif, setAktif] = useState(filters?.aktif ?? '');
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const lastSerializedRef = useRef<string>('');
    const [isFiltering, setIsFiltering] = useState(false);

    const activeFilters = useMemo<Filters>(
        () => ({
            q: q?.trim() ? q.trim() : null,
            aktif: aktif || null,
        }),
        [q, aktif],
    );

    useEffect(() => {
        const serialized = JSON.stringify(buildQuery(activeFilters));

        if (serialized === lastSerializedRef.current) {
            return;
        }

        const t = setTimeout(() => {
            lastSerializedRef.current = serialized;
            setIsFiltering(true);
            router.get('/admin/tps-resmi', buildQuery(activeFilters), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['tps', 'filters'],
                onFinish: () => setIsFiltering(false),
            });
        }, 350);

        return () => clearTimeout(t);
    }, [activeFilters]);

    const safeStats = stats ?? { total: 0, aktif: 0, nonaktif: 0 };

    const statCards = [
        {
            label: 'Total TPS',
            value: safeStats.total,
            icon: MapPin,
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },
        {
            label: 'Aktif',
            value: safeStats.aktif,
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            label: 'Nonaktif',
            value: safeStats.nonaktif,
            icon: XCircle,
            color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        },
    ];

    function toExportUrl() {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (aktif) params.set('aktif', aktif);
        const qs = params.toString();
        return qs ? `/admin/tps-resmi/export?${qs}` : '/admin/tps-resmi/export';
    }

    const exportCsv = () => {
        window.location.href = toExportUrl();
    };

    const resetFilters = () => {
        setQ('');
        setAktif('');
    };

    const goToPage = (url: string) => {
        const page = new URL(url, window.location.origin).searchParams.get(
            'page',
        );
        const query: Record<string, string> = { ...buildQuery(activeFilters) };

        if (page) {
            query.page = page;
        }

        lastSerializedRef.current = JSON.stringify(buildQuery(activeFilters));
        setIsFiltering(true);
        router.get('/admin/tps-resmi', query, {
            preserveScroll: true,
            preserveState: true,
            only: ['tps', 'filters'],
            onFinish: () => setIsFiltering(false),
        });
    };

    const skeletonRows = useMemo(
        () => Array.from({ length: 7 }, (_, i) => i),
        [],
    );

    const toggleAktif = async (id: number) => {
        setTogglingId(id);

        try {
            const res = await fetch(`/admin/tps-resmi/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? '',
                },
            });

            if (!res.ok) {
                throw new Error();
            }

            router.reload({ only: ['tps', 'stats'] });
        } catch {
            console.error('Gagal mengubah status TPS');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Hapus titik TPS ini?')) {
            return;
        }

        setDeletingId(id);

        try {
            const res = await fetch(`/admin/tps-resmi/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? '',
                },
            });

            if (!res.ok) {
                throw new Error();
            }

            router.reload({ only: ['tps', 'stats'] });
        } catch {
            console.error('Gagal menghapus TPS');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <Head title="Manajemen TPS Resmi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="mb-8 flex flex-col justify-between gap-6 lg:mb-12 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                        <FadeIn delay={100}>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/30">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                    Pakagasa — Data TPS Resmi
                                </span>
                            </div>
                        </FadeIn>
                        <FadeIn delay={200}>
                            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                                Manajemen TPS Resmi
                            </h1>
                        </FadeIn>
                        <FadeIn delay={300}>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                                Kelola titik-titik Tempat Pembuangan Sampah
                                resmi di Kota Palu.
                            </p>
                        </FadeIn>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                                Filter TPS
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
                                <div className="w-full md:w-[220px]">
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
                                            placeholder="Cari ID atau nama TPS…"
                                            className="h-11 pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-[220px]">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <Select
                                        value={aktif || AKTIF_FILTER_ALL}
                                        onValueChange={(v) =>
                                            setAktif(
                                                v === AKTIF_FILTER_ALL ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {aktifFilterOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <div className="flex flex-1 flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-card p-4 md:p-6 dark:border-sidebar-border">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">
                            Daftar TPS Resmi
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {tps.from ?? 0}-{tps.to ?? 0} dari{' '}
                            {tps.total} TPS
                        </p>
                    </div>

                    {isFiltering ? (
                        <div className="overflow-x-auto" aria-busy="true">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-xs text-muted-foreground">
                                        <th className="pb-3 text-center font-medium">
                                            ID
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Nama
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Latitude
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Longitude
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Ditambahkan
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Status
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skeletonRows.map((k) => (
                                        <tr
                                            key={k}
                                            className="animate-pulse border-b border-border"
                                        >
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-16 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-40 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-28 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-28 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-24 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-5 w-16 rounded-full bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-8 w-20 rounded-md bg-muted/70" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : tps.data.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-12 text-center">
                            <div>
                                <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                                <p className="text-lg font-semibold">
                                    Tidak ada data TPS
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Coba ubah filter atau reset untuk melihat
                                    semua data.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-xs text-muted-foreground">
                                        <th className="pb-3 text-center font-medium">
                                            ID
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Nama
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Latitude
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Longitude
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Ditambahkan
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Status
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {tps.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="group transition-colors hover:bg-muted/40"
                                            >
                                                <td className="py-3 text-center font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                                    #
                                                    {String(item.id).padStart(
                                                        5,
                                                        '0',
                                                    )}
                                                </td>
                                                <td className="py-3 text-center text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {item.nama ?? '—'}
                                                </td>
                                                <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                                                    {item.latitude.toFixed(6)}
                                                </td>
                                                <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                                                    {item.longitude.toFixed(6)}
                                                </td>
                                                <td className="py-3 text-center text-xs text-muted-foreground">
                                                    {item.created_at ?? '—'}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                                                            item.aktif
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {item.aktif
                                                            ? 'AKTIF'
                                                            : 'NONAKTIF'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div className="inline-flex items-center gap-0.5">
                                                        <Link
                                                            href={`/admin/tps-resmi/${item.id}`}
                                                            title="Detail TPS"
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/tps-resmi/${item.id}/edit`}
                                                            title="Edit TPS"
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                togglingId ===
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                toggleAktif(
                                                                    item.id,
                                                                )
                                                            }
                                                            title={
                                                                item.aktif
                                                                    ? 'Nonaktifkan'
                                                                    : 'Aktifkan'
                                                            }
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                                                        >
                                                            {togglingId ===
                                                            item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Power
                                                                    className={`h-4 w-4 ${item.aktif ? 'text-emerald-600' : 'text-muted-foreground'}`}
                                                                />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                deletingId ===
                                                                item.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id,
                                                                )
                                                            }
                                                            title="Hapus TPS"
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                                                        >
                                                            {deletingId ===
                                                            item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 md:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    Halaman {tps.current_page} dari{' '}
                                    {tps.last_page}
                                </p>
                                <div className="flex flex-wrap items-center gap-1">
                                    {tps.links.map((l, idx) => (
                                        <button
                                            key={`${l.label}-${idx}`}
                                            type="button"
                                            disabled={isFiltering || !l.url}
                                            onClick={() =>
                                                l.url && goToPage(l.url)
                                            }
                                            className={[
                                                'min-w-9 rounded-md px-3 py-2 text-xs transition-colors',
                                                l.active
                                                    ? 'bg-emerald-800 text-white'
                                                    : 'border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                                                isFiltering || !l.url
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : '',
                                            ].join(' ')}
                                            dangerouslySetInnerHTML={{
                                                __html: l.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

TpsResmiIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'TPS Resmi', href: '/admin/tps-resmi' },
    ],
};
