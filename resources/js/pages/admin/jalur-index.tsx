import { Head, Link, router } from '@inertiajs/react';
import {
    Route,
    Truck,
    CheckCircle2,
    XCircle,
    Search,
    SlidersHorizontal,
    RotateCcw,
    Map,
    Loader2,
    Power,
    Eye,
    Pencil,
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
import { formatJadwalLabel, normalizeJadwal } from '@/lib/jalur-schedule';

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

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

type Stat = {
    total: number;
    aktif: number;
    nonaktif: number;
    pick_up: number;
    kaisar: number;
    r6: number;
};

type JalurItem = {
    id_jalur_angkut: number;
    nama: string;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
    aktif: boolean;
    jadwal: string[] | Record<string, unknown>[] | null;
    titik_count: number;
    updated_at: string | null;
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
    tipe?: string | null;
    kelurahan?: string | null;
    aktif?: string | null;
};

type Props = {
    stats: Stat | null;
    jalur: Paginator<JalurItem>;
    filters: Filters;
    kelurahans: string[];
};

const TIPE_FILTER_ALL = 'all' as const;
const AKTIF_FILTER_ALL = 'all' as const;
const KELURAHAN_FILTER_ALL = 'all' as const;

const tipeConfig: Record<
    TipeKendaraan,
    { label: string; pill: string; dot: string }
> = {
    'Pick Up': {
        label: 'Pick Up',
        pill: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        dot: 'bg-red-500',
    },
    Kaisar: {
        label: 'Kaisar',
        pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    R6: {
        label: 'R6',
        pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
};

const tipeFilterOptions: {
    value: typeof TIPE_FILTER_ALL | TipeKendaraan;
    label: string;
    dotClass: string;
}[] = [
    {
        value: TIPE_FILTER_ALL,
        label: 'Semua tipe',
        dotClass: 'bg-muted-foreground/35 ring-1 ring-border',
    },
    {
        value: 'Pick Up',
        label: 'Pick Up',
        dotClass: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.25)]',
    },
    {
        value: 'Kaisar',
        label: 'Kaisar',
        dotClass: 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]',
    },
    {
        value: 'R6',
        label: 'R6',
        dotClass: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
    },
];

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

    if (filters.tipe) {
q.tipe = filters.tipe;
}

    if (filters.kelurahan) {
q.kelurahan = filters.kelurahan;
}

    if (filters.aktif) {
q.aktif = filters.aktif;
}

    return q;
}

export default function AdminJalurIndex({
    stats,
    jalur,
    filters,
    kelurahans,
}: Props) {
    const [q, setQ] = useState(filters?.q ?? '');
    const [tipe, setTipe] = useState(filters?.tipe ?? '');
    const [kelurahan, setKelurahan] = useState(filters?.kelurahan ?? '');
    const [aktif, setAktif] = useState(filters?.aktif ?? '');
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const lastSerializedRef = useRef<string>('');
    const [isFiltering, setIsFiltering] = useState(false);

    const activeFilters = useMemo<Filters>(
        () => ({
            q: q?.trim() ? q.trim() : null,
            tipe: tipe || null,
            kelurahan: kelurahan || null,
            aktif: aktif || null,
        }),
        [q, tipe, kelurahan, aktif],
    );

    useEffect(() => {
        const serialized = JSON.stringify(buildQuery(activeFilters));

        if (serialized === lastSerializedRef.current) {
return;
}

        const t = setTimeout(() => {
            lastSerializedRef.current = serialized;
            setIsFiltering(true);
            router.get('/admin/jalur', buildQuery(activeFilters), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['jalur', 'filters'],
                onFinish: () => setIsFiltering(false),
            });
        }, 350);

        return () => clearTimeout(t);
    }, [activeFilters]);

    const safeStats: Stat = stats ?? {
        total: 0,
        aktif: 0,
        nonaktif: 0,
        pick_up: 0,
        kaisar: 0,
        r6: 0,
    };

    const statCards = [
        {
            label: 'Total Jalur',
            value: safeStats.total,
            icon: Route,
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
        {
            label: 'Pick Up',
            value: safeStats.pick_up,
            icon: Truck,
            color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        },
        {
            label: 'Kaisar',
            value: safeStats.kaisar,
            icon: Truck,
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            label: 'R6',
            value: safeStats.r6,
            icon: Truck,
            color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
    ];

    const resetFilters = () => {
        setQ('');
        setTipe('');
        setKelurahan('');
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
        router.get('/admin/jalur', query, {
            preserveScroll: true,
            preserveState: true,
            only: ['jalur', 'filters'],
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
            const res = await fetch(`/admin/jalur-angkut/${id}/toggle`, {
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

            router.reload({ only: ['jalur', 'stats'] });
        } catch {
            console.error('Gagal mengubah status jalur');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <>
            <Head title="Manajemen Jalur Angkut" />

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
                                    Pakagasa-Data jalur angkutan
                                </span>
                            </div>
                        </FadeIn>
                        <FadeIn delay={200}>
                            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                                Manajemen Jalur Angkutan Sampah
                            </h1>
                        </FadeIn>
                        <FadeIn delay={300}>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                                Kelola rute pengangkutan sampah per tipe
                                kendaraan dan kelurahan di Kota Palu.
                            </p>
                        </FadeIn>
                    </div>
                </div>

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
                                                Filter Jalur
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

                                <Button
                                    variant="ghost"
                                    className="gap-2"
                                    onClick={resetFilters}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Filter
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-end">
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
                                            placeholder="Cari ID, nama jalur, atau kelurahan…"
                                            className="h-11 pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-[200px]">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Tipe Kendaraan
                                    </label>
                                    <Select
                                        value={tipe || TIPE_FILTER_ALL}
                                        onValueChange={(v) =>
                                            setTipe(
                                                v === TIPE_FILTER_ALL ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tipeFilterOptions.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className={`size-2 rounded-full ${opt.dotClass}`}
                                                        />
                                                        {opt.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full md:w-[220px]">
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Kelurahan
                                    </label>
                                    <Select
                                        value={
                                            kelurahan || KELURAHAN_FILTER_ALL
                                        }
                                        onValueChange={(v) =>
                                            setKelurahan(
                                                v === KELURAHAN_FILTER_ALL
                                                    ? ''
                                                    : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Kelurahan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem
                                                value={KELURAHAN_FILTER_ALL}
                                            >
                                                Semua kelurahan
                                            </SelectItem>
                                            {kelurahans.map((k) => (
                                                <SelectItem key={k} value={k}>
                                                    {k}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full md:w-[180px]">
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
                            Daftar Jalur Angkut
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {jalur.from ?? 0}-{jalur.to ?? 0} dari{' '}
                            {jalur.total} jalur
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
                                            Kelurahan
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Tipe
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Titik
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Jadwal
                                        </th>
                                        <th className="pb-3 text-center font-medium">
                                            Diperbarui
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
                                                <div className="mx-auto h-5 w-20 rounded-full bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-10 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-32 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-4 w-24 rounded bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-5 w-16 rounded-full bg-muted/70" />
                                            </td>
                                            <td className="py-3 text-center">
                                                <div className="mx-auto h-8 w-8 rounded-md bg-muted/70" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : jalur.data.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-12 text-center">
                            <div>
                                <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                                <p className="text-lg font-semibold">
                                    Tidak ada data jalur
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Coba ubah filter atau reset untuk melihat
                                    semua jalur.
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
                                                Kelurahan
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Tipe
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Titik
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Jadwal
                                            </th>
                                            <th className="pb-3 text-center font-medium">
                                                Diperbarui
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
                                        {jalur.data.map((item) => {
                                            const cfg =
                                                tipeConfig[item.tipe_kendaraan];

                                            return (
                                                <tr
                                                    key={item.id_jalur_angkut}
                                                    className="group transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="py-3 text-center font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                                        #{item.id_jalur_angkut}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="inline-flex items-center gap-2">
                                                            <span
                                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        item.warna,
                                                                }}
                                                            />
                                                            <p className="truncate font-medium">
                                                                {item.nama}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center text-muted-foreground">
                                                        {item.kelurahan ?? '—'}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${cfg?.pill ?? ''}`}
                                                        >
                                                            {cfg?.label ??
                                                                item.tipe_kendaraan}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center text-muted-foreground tabular-nums">
                                                        {item.titik_count}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {formatJadwalLabel(
                                                                normalizeJadwal(
                                                                    item.jadwal,
                                                                ),
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 text-center text-xs text-muted-foreground">
                                                        {item.updated_at ?? '—'}
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
                                                                href={`/admin/jalur/${item.id_jalur_angkut}`}
                                                                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                            <Link
                                                                href={`/admin/jalur/${item.id_jalur_angkut}/edit`}
                                                                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                                title="Edit Jalur"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    togglingId ===
                                                                    item.id_jalur_angkut
                                                                }
                                                                onClick={() =>
                                                                    toggleAktif(
                                                                        item.id_jalur_angkut,
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
                                                                item.id_jalur_angkut ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Power
                                                                        className={`h-4 w-4 ${item.aktif ? 'text-emerald-600' : 'text-muted-foreground'}`}
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 md:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    Halaman {jalur.current_page} dari{' '}
                                    {jalur.last_page}
                                </p>
                                <div className="flex flex-wrap items-center gap-1">
                                    {jalur.links.map((l, idx) => (
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

AdminJalurIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Jalur Angkut', href: '/admin/jalur' },
    ],
};
