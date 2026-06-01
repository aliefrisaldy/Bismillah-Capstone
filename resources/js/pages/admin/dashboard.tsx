import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    MapPin,
    Route,
    TrendingUp,
    Trash2,
    Users,
    XCircle,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentLaporan {
    id: number;
    alamat: string;
    status: string;
    tanggal: string;
    pelapor: string;
}

interface TrendData {
    labels: string[];
    values: number[];
}

interface Props {
    totalLaporan: number;
    laporanHariIni: number;
    laporanMingguIni: number;
    byStatus: Record<string, number>;
    recentLaporan: RecentLaporan[];
    totalTps: number;
    totalJalur: number;
    jalurByTipe: Record<string, number>;
    totalUser: number;
    trendBulanan: TrendData;
    kecamatanList: string[];
    laporanByKecamatan: Record<string, Record<string, number>>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; pill: string; dot: string; icon: React.FC<{ className?: string }> }
> = {
    menunggu: {
        label: 'Menunggu',
        color: '#f59e0b',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    diverifikasi: {
        label: 'Diverifikasi',
        color: '#3b82f6',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
        icon: ShieldCheck,
    },
    diproses: {
        label: 'Diproses',
        color: '#f97316',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        dot: 'bg-orange-500',
        icon: Loader2,
    },
    selesai: {
        label: 'Selesai',
        color: '#10b981',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    ditolak: {
        label: 'Ditolak',
        color: '#ef4444',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
        icon: XCircle,
    },
};

const TIPE_COLORS: Record<string, string> = {
    'Pick Up': '#e74c3c',
    Kaisar: '#3498db',
    R6: '#2ecc71',
};

type Period = 'daily' | 'weekly' | 'monthly';

// ─── Subcomponents ────────────────────────────────────────────────────────────

const StatCard = memo(function StatCard({
    label,
    value,
    icon: Icon,
    colorClass,
    bgClass,
    sub,
}: {
    label: string;
    value: number;
    icon: React.FC<{ className?: string }>;
    colorClass: string;
    bgClass: string;
    sub?: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
                <Icon className={`h-6 w-6 ${colorClass}`} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase truncate">
                    {label}
                </p>
                <p className="text-2xl font-extrabold text-foreground">{value.toLocaleString()}</p>
                {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
});

const SectionHeader = memo(function SectionHeader({ title, icon: Icon }: { title: string; icon: React.FC<{ className?: string }> }) {
    return (
        <div className="flex items-center gap-2 border-b border-border pb-2">
            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-extrabold text-foreground">{title}</h2>
        </div>
    );
});

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

const TrendTooltip = memo(function TrendTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
            <p className="text-sm font-extrabold text-foreground">{payload[0].value} laporan</p>
        </div>
    );
});

const StatusTooltip = memo(function StatusTooltip({ active, payload }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const entry = payload[0];
    const cfg = Object.values(STATUS_CONFIG).find((s) => s.label === entry.name);

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cfg?.color ?? '#6b7280' }}
                />
                <p className="text-[11px] font-bold text-muted-foreground">{entry.name}</p>
            </div>
            <p className="text-sm font-extrabold text-foreground">{entry.value} laporan</p>
        </div>
    );
});

const JalurTooltip = memo(function JalurTooltip({ active, payload }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const entry = payload[0];
    const color = TIPE_COLORS[entry.payload.tipe] ?? '#6b7280';

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: color }}
                />
                <p className="text-[11px] font-bold text-muted-foreground">{entry.payload.tipe}</p>
            </div>
            <p className="text-sm font-extrabold text-foreground">{entry.value} jalur</p>
        </div>
    );
});

const KelurahanTooltip = memo(function KelurahanTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) {
        return null;
    }

    const entry = payload[0];

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
            <p className="text-sm font-extrabold text-foreground">{entry.value} laporan</p>
        </div>
    );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dashboard({
    totalLaporan,
    laporanHariIni,
    laporanMingguIni,
    byStatus,
    recentLaporan,
    totalTps,
    totalJalur,
    jalurByTipe,
    totalUser,
    trendBulanan,
    kecamatanList,
    laporanByKecamatan,
}: Props) {
    const [period, setPeriod] = useState<Period>('monthly');
    const [trendData, setTrendData] = useState<TrendData>(trendBulanan);
    const [loadingTrend, setLoadingTrend] = useState(false);
    const [selectedKecamatan, setSelectedKecamatan] = useState<string>(
        kecamatanList.length > 0 ? kecamatanList[0] : '',
    );

    const fetchTrend = useCallback(async (p: Period) => {
        setLoadingTrend(true);

        try {
            const res = await fetch(`/admin/dashboard/trend?period=${p}`);
            setTrendData(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTrend(false);
        }
    }, []);

    const handlePeriod = (p: Period) => {
        setPeriod(p);

        if (p === 'monthly') {
            setTrendData(trendBulanan);
        } else {
            fetchTrend(p);
        }
    };

    // Chart data
    const trendChartData = useMemo(
        () => trendData.labels.map((label, i) => ({ label, value: trendData.values[i] })),
        [trendData],
    );

    const statusPieData = useMemo(
        () =>
            Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                name: cfg.label,
                value: byStatus[key] ?? 0,
                color: cfg.color,
            })),
        [byStatus],
    );

    const jalurBarData = useMemo(
        () =>
            Object.entries(jalurByTipe).map(([tipe, total]) => ({
                tipe,
                total,
                color: TIPE_COLORS[tipe] ?? '#6b7280',
            })),
        [jalurByTipe],
    );

    const kelurahanChartData = useMemo(() => {
        if (!selectedKecamatan || !laporanByKecamatan[selectedKecamatan]) {
            return [];
        }

        return Object.entries(laporanByKecamatan[selectedKecamatan])
            .map(([kelurahan, total]) => ({ kelurahan, total }))
            .sort((a, b) => b.total - a.total);
    }, [selectedKecamatan, laporanByKecamatan]);

    const totalKecamatanLaporan = useMemo(
        () => kelurahanChartData.reduce((acc, d) => acc + d.total, 0),
        [kelurahanChartData],
    );

    const KELURAHAN_BAR_COLORS = [
        '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
        '#059669', '#047857', '#065f46', '#064e3b', '#022c22',
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-extrabold text-foreground">Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        Ringkasan data pelaporan TPS ilegal Kota Palu
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        label="Total Laporan"
                        value={totalLaporan}
                        icon={FileText}
                        colorClass="text-emerald-600 dark:text-emerald-400"
                        bgClass="bg-emerald-100 dark:bg-emerald-900/30"
                        sub={`+${laporanHariIni} hari ini`}
                    />
                    <StatCard
                        label="Laporan Minggu Ini"
                        value={laporanMingguIni}
                        icon={TrendingUp}
                        colorClass="text-blue-600 dark:text-blue-400"
                        bgClass="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatCard
                        label="TPS Resmi"
                        value={totalTps}
                        icon={Trash2}
                        colorClass="text-amber-600 dark:text-amber-400"
                        bgClass="bg-amber-100 dark:bg-amber-900/30"
                    />
                    <StatCard
                        label="Total Pengguna"
                        value={totalUser}
                        icon={Users}
                        colorClass="text-purple-600 dark:text-purple-400"
                        bgClass="bg-purple-100 dark:bg-purple-900/30"
                    />
                </div>

                {/* ── Status Cards ── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <div
                            key={key}
                            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                        >
                            <span className={`h-3 w-3 shrink-0 rounded-full ${cfg.dot}`} />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase truncate">
                                    {cfg.label}
                                </p>
                                <p className="text-xl font-extrabold text-foreground">
                                    {byStatus[key] ?? 0}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Section: Tren Laporan ── */}
                <SectionHeader title="Tren & Distribusi Laporan" icon={TrendingUp} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Trend Chart */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-foreground">Tren Laporan</h3>
                            <div className="flex gap-1.5">
                                {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handlePeriod(p)}
                                        className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-colors ${
                                            period === p
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-56">
                            {loadingTrend && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<TrendTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        fill="url(#grad)"
                                        dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Pie */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-sm font-extrabold text-foreground">Status Laporan</h3>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {statusPieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<StatusTooltip />} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => (
                                            <span className="text-[11px] text-muted-foreground">{value}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Section: Jalur & Infrastruktur ── */}
                <SectionHeader title="Infrastruktur" icon={Route} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Jalur by Tipe */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-1 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-foreground">Armada Pengangkutan Sampah</h3>
                            <span className="text-[11px] text-muted-foreground">{totalJalur} total jalur</span>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={jalurBarData}
                                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="currentColor"
                                        strokeOpacity={0.06}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="tipe"
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                                        content={<JalurTooltip />}
                                    />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                        {jalurBarData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Laporan per Kelurahan */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-foreground">
                                Laporan Setiap Kelurahan
                            </h3>
                            {kecamatanList.length > 0 && (
                                <Select
                                    value={selectedKecamatan}
                                    onValueChange={setSelectedKecamatan}
                                >
                                    <SelectTrigger className="h-9 w-[180px] border-input bg-background font-normal shadow-sm focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 dark:bg-input/30 dark:hover:bg-input/45">
                                        <SelectValue placeholder="Pilih Kecamatan" />
                                    </SelectTrigger>
                                    <SelectContent
                                        align="start"
                                        className="rounded-xl border-border/80 p-1.5 shadow-lg dark:border-sidebar-border"
                                    >
                                        {kecamatanList.map((k) => (
                                            <SelectItem
                                                key={k}
                                                value={k}
                                                className="cursor-pointer rounded-lg py-2.5 pr-10 pl-2.5 focus:bg-emerald-500/10 focus:text-foreground"
                                            >
                                                <span className="text-sm">{k}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {selectedKecamatan && kelurahanChartData.length > 0 ? (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={kelurahanChartData}
                                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                                        layout="vertical"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="currentColor"
                                            strokeOpacity={0.06}
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="kelurahan"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={90}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'currentColor', fillOpacity: 0.05 }}
                                            content={<KelurahanTooltip />}
                                        />
                                        <Bar
                                            dataKey="total"
                                            radius={[0, 6, 6, 0]}
                                            maxBarSize={20}
                                        >
                                            {kelurahanChartData.map((entry, i) => (
                                                <Cell
                                                    key={entry.kelurahan}
                                                    fill={
                                                        KELURAHAN_BAR_COLORS[
                                                            i % KELURAHAN_BAR_COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                                <MapPin className="mb-2 h-8 w-8" />
                                <p className="text-sm">
                                    {selectedKecamatan
                                        ? 'Belum ada laporan'
                                        : 'Pilih kecamatan terlebih dahulu'}
                                </p>
                            </div>
                        )}
                        <div className="mt-2 text-right text-[11px] text-muted-foreground">
                            {selectedKecamatan
                                ? `${totalKecamatanLaporan} laporan di ${selectedKecamatan}`
                                : ''}
                        </div>
                    </div>
                </div>

                {/* ── Section: Laporan Terbaru ── */}
                <SectionHeader title="Laporan Terbaru" icon={FileText} />

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h3 className="text-sm font-extrabold text-foreground">
                            5 Laporan Terakhir
                        </h3>
                        <Link
                            href="/admin/laporan"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            Lihat Semua →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-muted/50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                <tr>
                                    {['ID', 'Pelapor', 'Alamat', 'Tanggal', 'Status', 'Aksi'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-center">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {!Array.isArray(recentLaporan) || recentLaporan.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                            Belum ada laporan
                                        </td>
                                    </tr>
                                ) : (
                                    recentLaporan.map((item) => {
                                        const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.menunggu;

                                        return (
                                            <tr key={item.id} className="transition-colors hover:bg-muted/40">
                                                <td className="px-5 py-3 text-center font-mono text-xs text-muted-foreground">
                                                    #{String(item.id).padStart(5, '0')}
                                                </td>
                                                <td className="px-5 py-3 text-center font-semibold text-foreground">
                                                    {item.pelapor}
                                                </td>
                                                <td className="max-w-[180px] truncate px-5 py-3 text-center text-muted-foreground">
                                                    {item.alamat || '—'}
                                                </td>
                                                <td className="px-5 py-3 text-center whitespace-nowrap text-muted-foreground">
                                                    {item.tanggal}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.pill}`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <Link
                                                        href={`/admin/laporan/${item.id}`}
                                                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                                        aria-label="Lihat detail"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
    ],
};