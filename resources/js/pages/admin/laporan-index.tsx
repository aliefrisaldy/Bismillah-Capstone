    import { Head, Link, router } from '@inertiajs/react';
    import { useEffect, useMemo, useRef, useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
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
    } from 'lucide-react';

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
        menunggu: { label: 'MENUNGGU', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        diverifikasi: { label: 'DIVERIFIKASI', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        diproses: { label: 'DIPROSES', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        selesai: { label: 'SELESAI', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        ditolak: { label: 'DITOLAK', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };

    function buildQuery(filters: Filters) {
        const q: Record<string, string> = {};
        if (filters.q) q.q = filters.q;
        if (filters.status) q.status = filters.status;
        if (filters.dari) q.dari = filters.dari;
        if (filters.sampai) q.sampai = filters.sampai;
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

        const activeFilters = useMemo<Filters>(() => ({
            q: q?.trim() ? q.trim() : null,
            status: status || null,
            dari: dari || null,
            sampai: sampai || null,
        }), [q, status, dari, sampai]);

        useEffect(() => {
            const serialized = JSON.stringify(buildQuery(activeFilters));
            if (serialized === lastSerializedRef.current) return;

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

        const renderFotoThumb = (foto: LaporanItem['foto']) => {
            const path =
                Array.isArray(foto) ? foto[0] :
                typeof foto === 'string' ? foto :
                null;

            if (!path) {
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                        N/A
                    </div>
                );
            }

            return (
                <img
                    src={`/storage/${path}`}
                    alt="Foto"
                    className="h-10 w-10 rounded-lg border border-border object-cover"
                    loading="lazy"
                />
            );
        };

        return (
            <>
                <Head title="Manajemen Laporan Sampah" />

                <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold">Manajemen Laporan Sampah</h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau, verifikasi, dan kelola semua laporan penumpukan sampah liar secara real-time.
                        </p>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                        {statCards.map((card) => (
                            <div
                                key={card.label}
                                className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border"
                            >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <p className="text-xs text-muted-foreground">{card.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border md:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <SlidersHorizontal className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold">Filter Laporan</p>
                                            {isFiltering && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                                    Memuat…
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Perubahan filter diterapkan otomatis.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="gap-2" onClick={exportCsv}>
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </Button>
                                    <Button variant="ghost" className="gap-2" onClick={resetFilters}>
                                        <RotateCcw className="h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            {/* Search */}
                            <div className="w-full md:flex-1">
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Pencarian</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="Cari ID, pelapor, alamat, atau deskripsi…"
                                        className="h-11 pl-9"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="w-full md:w-[220px]">
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="menunggu">Menunggu</option>
                                    <option value="diverifikasi">Diverifikasi</option>
                                    <option value="diproses">Diproses</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="ditolak">Ditolak</option>
                                </select>
                            </div>

                            {/* Date range */}
                            <div className="w-full md:w-[320px]">
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Rentang Tanggal</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        aria-label="Dari tanggal"
                                        type="date"
                                        value={dari}
                                        onChange={(e) => setDari(e.target.value)}
                                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                    <span className="text-xs text-muted-foreground">—</span>
                                    <input
                                        aria-label="Sampai tanggal"
                                        type="date"
                                        value={sampai}
                                        onChange={(e) => setSampai(e.target.value)}
                                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            Tips: ketik angka saja untuk cepat menemukan ID.
                        </p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-card p-4 dark:border-sidebar-border md:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Daftar Laporan</h2>
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {laporan.from ?? 0}-{laporan.to ?? 0} dari {laporan.total} laporan
                            </p>
                        </div>

                        {laporan.data.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center py-12 text-center">
                                <div>
                                    <p className="text-lg font-semibold">Tidak ada data</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Coba ubah filter atau reset untuk melihat semua laporan.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                                <th className="pb-3 pr-4 font-medium">ID Laporan</th>
                                                <th className="pb-3 pr-4 font-medium">Foto</th>
                                                <th className="pb-3 pr-4 font-medium">Tanggal</th>
                                                <th className="pb-3 pr-4 font-medium">Lokasi</th>
                                                <th className="pb-3 pr-4 font-medium">Pelapor</th>
                                                <th className="pb-3 pr-4 font-medium">Status</th>
                                                <th className="pb-3 font-medium text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {laporan.data.map((item) => (
                                                <tr key={item.id_laporan} className="group">
                                                    <td className="py-3 pr-4 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                                                        #REP-{String(item.id_laporan).padStart(5, '0')}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        {renderFotoThumb(item.foto)}
                                                    </td>
                                                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                                                        {item.tanggal_laporan}
                                                    </td>
                                                    <td className="py-3 pr-4 max-w-[340px]">
                                                        <p className="truncate font-medium">{item.alamat ?? '-'}</p>
                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                            {item.deskripsi}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 pr-4 font-medium">
                                                        {item.pelapor ?? '-'}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[item.status]?.color}`}
                                                        >
                                                            {statusConfig[item.status]?.label ?? item.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <Link
                                                            href={`/admin/laporan/${item.id_laporan}`}
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                            aria-label="Lihat detail"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 md:flex-row">
                                    <p className="text-xs text-muted-foreground">
                                        Halaman {laporan.current_page} dari {laporan.last_page}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {laporan.links.map((l, idx) => (
                                            <button
                                                key={`${l.label}-${idx}`}
                                                type="button"
                                                disabled={!l.url}
                                                onClick={() => l.url && router.get(l.url, {}, { preserveScroll: true, preserveState: true, only: ['laporan', 'filters'] })}
                                                className={[
                                                    'min-w-9 rounded-md px-3 py-2 text-xs transition-colors',
                                                    l.active
                                                        ? 'bg-emerald-800 text-white'
                                                        : 'border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                                                    !l.url ? 'cursor-not-allowed opacity-50' : '',
                                                ].join(' ')}
                                                dangerouslySetInnerHTML={{ __html: l.label }}
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

    AdminLaporanIndex.layout = {
        breadcrumbs: [
            {
                title: 'Daftar Laporan',
                href: '/admin/laporan',
            },
        ],
    };
