import { Head, Link } from '@inertiajs/react';
import {
    ClipboardList,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    MapPin,
    Calendar,
    Activity,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// FadeIn component
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
                        if (domRef.current) observer.unobserve(domRef.current);
                    }
                });
            },
            { threshold: 0.1 },
        );
        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
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
            className={`transition-all duration-700 ease-out ${className} ${isVisible
                ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
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

type LaporanTerbaru = {
    id_laporan: number;
    alamat: string | null;
    status: 'menunggu' | 'diverifikasi' | 'diproses' | 'selesai' | 'ditolak';
    tanggal_laporan: string | null;
    pelapor: string | null;
};

type Props = {
    stats: Stat;
    laporan_terbaru: LaporanTerbaru[];
};

const statusConfig: Record<string, { label: string; color: string; badge: string }> = {
    menunggu: { label: 'MENUNGGU', color: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    diverifikasi: { label: 'DIVERIFIKASI', color: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    diproses: { label: 'DIPROSES', color: 'text-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    selesai: { label: 'SELESAI', color: 'text-green-500', badge: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    ditolak: { label: 'DITOLAK', color: 'text-red-500', badge: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

export default function AdminDashboard({ stats, laporan_terbaru }: Props) {
    const activeRate = stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;

    const miniStats = [
        { label: 'Menunggu', value: stats.menunggu, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Diverifikasi', value: stats.diverifikasi, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Diproses', value: stats.diproses, icon: Loader2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Ditolak', value: stats.ditolak, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">

                {/* 1. Hero Banner Dashboard */}
                <FadeIn delay={100}>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-900 p-8 text-white shadow-lg lg:p-12">
                        {/* Decorative background patterns */}
                        <div className="absolute right-0 top-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
                        <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-400 opacity-20 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                            <div className="max-w-xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                                    <Activity className="h-4 w-4" />
                                    <span className="text-xs font-bold tracking-wider">DASHBOARD PAKAGASA</span>
                                </div>
                                <h1 className="text-3xl font-extrabold md:text-5xl">
                                    Pantau Kebersihan Kota Palu
                                </h1>
                                <p className="mt-4 text-emerald-50 leading-relaxed opacity-90 text-sm md:text-base">
                                    Selamat datang di panel kontrol utama. Kelola laporan warga dengan cepat dan tingkatkan efisiensi penanganan sampah di lapangan.
                                </p>
                            </div>

                            {/* Highlighted Stat in Hero */}
                            <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20">
                                <div className="text-center">
                                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-200">Total Laporan</p>
                                    <p className="text-6xl font-black tabular-nums">{stats.total}</p>
                                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-100">
                                        <ClipboardList className="h-4 w-4" /> Masuk ke sistem
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* Kiri: Main Stats & Progress */}
                    <div className="flex flex-col gap-8 lg:col-span-2">
                        <FadeIn delay={200}>
                            <div>
                                <h3 className="mb-4 text-lg font-bold text-foreground">Distribusi Status Laporan</h3>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {miniStats.map((stat, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-transform hover:-translate-y-1">
                                            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>

                        {/* Recent Activity Feed (List layout instead of table) */}
                        <FadeIn delay={300}>
                            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">Laporan Terbaru</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Aktivitas laporan dari warga secara real-time</p>
                                    </div>
                                    <Link
                                        href="/admin/laporan"
                                        className="group inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    >
                                        Lihat Semua <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                {laporan_terbaru.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                        <ClipboardList className="h-12 w-12 opacity-20 mb-3" />
                                        <p className="font-medium">Belum ada aktivitas laporan.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {laporan_terbaru.map((laporan) => (
                                            <div key={laporan.id_laporan} className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border/50 bg-background p-4 shadow-sm transition-all hover:border-border hover:shadow-md sm:flex-row sm:items-center">
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusConfig[laporan.status]?.badge}`}>
                                                        {laporan.status === 'selesai' ? <CheckCircle2 className="h-5 w-5" /> :
                                                            laporan.status === 'ditolak' ? <XCircle className="h-5 w-5" /> :
                                                                <Clock className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-foreground">{laporan.pelapor ?? 'Warga'}</p>
                                                            <span className="text-xs text-muted-foreground">·</span>
                                                            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">#REP-{String(laporan.id_laporan).padStart(5, '0')}</p>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-[300px]">
                                                                <MapPin className="h-3 w-3 shrink-0" /> {laporan.alamat ?? 'Lokasi tidak diketahui'}
                                                            </span>
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Calendar className="h-3 w-3" /> {laporan.tanggal_laporan}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-4 ml-14 sm:ml-0 border-t border-border/50 sm:border-0 pt-3 sm:pt-0">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[laporan.status]?.badge}`}>
                                                        {statusConfig[laporan.status]?.label}
                                                    </span>
                                                    <Link
                                                        href={`/admin/laporan/${laporan.id_laporan}`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Kanan: Side Widgets */}
                    <div className="flex flex-col gap-8">
                        {/* Completion Rate Widget */}
                        <FadeIn delay={400}>
                            <div className="overflow-hidden rounded-3xl border border-border bg-card text-center shadow-sm relative p-8">
                                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-green-600"></div>
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Tingkat Penyelesaian</h3>
                                <p className="text-xs text-muted-foreground mt-1">Laporan yang telah selesai ditangani</p>

                                <div className="mt-6">
                                    <div className="flex items-end justify-center gap-1">
                                        <span className="text-5xl font-black text-foreground">{activeRate}</span>
                                        <span className="mb-1 text-xl font-bold text-muted-foreground">%</span>
                                    </div>

                                    <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${activeRate}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>{stats.selesai} Selesai</span>
                                        <span>{stats.total} Total</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Quick Actions Widget */}
                        <FadeIn delay={500}>
                            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-foreground mb-4">Aksi Cepat</h3>
                                <div className="flex flex-col gap-3">
                                    <Link href="/admin/laporan" className="group flex items-center justify-between rounded-xl bg-muted/50 p-4 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm group-hover:text-emerald-600">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>
                                            <span className="font-semibold text-sm">Kelola Laporan</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </Link>
                                    <Link href="/admin/peta" className="group flex items-center justify-between rounded-xl bg-muted/50 p-4 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm group-hover:text-emerald-600">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <span className="font-semibold text-sm">Peta Persebaran</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
    ],
};
