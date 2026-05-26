import { Head, Link, usePage } from '@inertiajs/react';
import {
    MapPin,
    Camera,
    CheckCircle,
    ArrowRight,
    Star,
    Leaf,
    Recycle,
    Trash2,
    Globe,
    ShieldCheck,
    Activity,
    Smartphone,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type Auth = {
    user: { name: string } | null;
};

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

                        // Optional: stop observing once it's visible so it doesn't animate out
                        if (domRef.current) {
observer.unobserve(domRef.current);
}
                    }
                });
            },
            { threshold: 0.15 },
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
        up: 'translate-y-12',
        down: '-translate-y-12',
        left: 'translate-x-12',
        right: '-translate-x-12',
        none: 'scale-95',
    };

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out ${className} ${
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

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-green-500/30">
            <Head title="Beranda | Pakagasa" />

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 lg:pt-32 lg:pb-28">
                {/* Background Decoration */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-100 via-background to-background opacity-80 dark:from-green-900/20" />
                <div className="absolute top-20 right-0 -mr-20 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-8">
                        {/* Kiri - Text */}
                        <div>
                            <FadeIn delay={100}>
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50/80 px-4 py-1.5 backdrop-blur-sm dark:border-green-800 dark:bg-green-900/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-bold tracking-wider text-green-700 uppercase dark:text-green-400">
                                        Pakagasa Initiative
                                    </span>
                                </div>
                            </FadeIn>

                            <FadeIn delay={200}>
                                <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                                    Wujudkan{' '}
                                    <span className="bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent">
                                        Palu
                                    </span>
                                    <br />
                                    Yang Lebih Asri
                                </h1>
                            </FadeIn>

                            <FadeIn delay={300}>
                                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                                    Platform kolaborasi warga untuk melaporkan
                                    titik sampah ilegal secara cepat dan cerdas.
                                    Bersama, kita kembalikan kemurnian
                                    lingkungan kota kita.
                                </p>
                            </FadeIn>

                            <FadeIn delay={400}>
                                <div className="mt-10 flex flex-wrap items-center gap-4">
                                    <Link
                                        href={
                                            '/user/laporan/buat'
                                        }   
                                        className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-1 hover:shadow-orange-500/40"
                                    >
                                        <Camera className="h-5 w-5 transition-transform group-hover:scale-110" />
                                        Laporkan Sekarang
                                    </Link>
                                    <Link
                                        href="#cara-kerja"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-transparent px-8 py-4 text-sm font-semibold text-foreground transition-all hover:bg-muted"
                                    >
                                        Pelajari Caranya
                                    </Link>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Kanan - Hero Illustration */}
                        <FadeIn
                            delay={300}
                            direction="left"
                            className="relative lg:ml-auto"
                        >
                            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                                {/* Decorative elements behind card */}
                                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-20 blur-2xl dark:opacity-40"></div>

                                <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
                                    {/* Mockup Header */}
                                    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                            <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                            <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                        </div>
                                    </div>

                                    {/* Mockup Content */}
                                    <div className="p-6">
                                        <div className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/10">
                                            <div className="absolute inset-0 bg-black/5 transition-colors duration-500 group-hover:bg-black/0"></div>
                                            <div className="transform text-center transition-transform duration-500 group-hover:scale-110">
                                                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl dark:bg-neutral-800">
                                                    <Recycle className="h-10 w-10 text-green-600 drop-shadow-md" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    Pembersihan Kawasan Pantai
                                                </h3>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="flex items-center gap-1.5 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-400">
                                                        <Activity className="h-3.5 w-3.5" />{' '}
                                                        Aktif
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        Oleh DLH Palu
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="animate-bounce-slow absolute top-12 -left-8 rounded-2xl border border-border bg-card p-4 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">
                                                Terverifikasi
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Baru saja
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* ── CARA KERJA ────────────────────────────────── */}
            <section
                id="cara-kerja"
                className="relative border-y border-border bg-muted/30 py-24"
            >
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <FadeIn
                        delay={100}
                        direction="up"
                        className="mx-auto max-w-2xl text-center"
                    >
                        <h2 className="text-sm font-bold tracking-widest text-green-600 uppercase dark:text-green-400">
                            Alur Pelaporan
                        </h2>
                        <h3 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
                            Bagaimana Ini Bekerja
                        </h3>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Tiga langkah sederhana untuk berkontribusi membuat
                            Palu menjadi lebih bersih dan nyaman untuk semua.
                        </p>
                    </FadeIn>

                    <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 sm:grid-cols-3">
                        {[
                            {
                                icon: Smartphone,
                                title: 'Ambil Foto',
                                desc: 'Temukan titik tumpukan sampah liar, ambil foto yang jelas menggunakan perangkat Anda.',
                                color: 'from-blue-500 to-cyan-400',
                                delay: 200,
                            },
                            {
                                icon: MapPin,
                                title: 'Tandai Lokasi',
                                desc: 'Sistem kami akan otomatis membaca lokasi Anda atau Anda dapat menandai secara manual di peta.',
                                color: 'from-orange-500 to-amber-400',
                                delay: 400,
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Selesai & Pantau',
                                desc: 'Laporan dikirim ke DLH untuk ditindaklanjuti. Pantau progres pembersihan langsung dari aplikasi.',
                                color: 'from-green-500 to-emerald-400',
                                delay: 600,
                            },
                        ].map((item, i) => (
                            <FadeIn
                                key={item.title}
                                delay={item.delay}
                                direction="up"
                                className="group relative text-center"
                            >
                                {i !== 2 && (
                                    <div className="absolute top-10 left-[60%] -z-10 hidden h-[2px] w-full bg-gradient-to-r from-border to-transparent sm:block" />
                                )}
                                <div
                                    className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-2`}
                                >
                                    <item.icon className="h-10 w-10" />
                                </div>
                                <h4 className="text-xl font-bold text-foreground">
                                    {item.title}
                                </h4>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {item.desc}
                                </p>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────────── */}
            <section className="relative overflow-hidden py-20">
                <div className="absolute inset-0 bg-green-600 dark:bg-green-900" />
                {/* Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-10 mix-blend-overlay"
                    style={{
                        backgroundImage:
                            'radial-gradient(#fff 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                ></div>

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 divide-x divide-white/20 md:grid-cols-4">
                        {[
                            {
                                icon: Trash2,
                                value: '12.5k+',
                                label: 'Sampah Diangkut',
                            },
                            {
                                icon: Globe,
                                value: '3.2k',
                                label: 'Warga Terlibat',
                            },
                            {
                                icon: Leaf,
                                value: '450',
                                label: 'Area Dibersihkan',
                            },
                            {
                                icon: Star,
                                value: '98%',
                                label: 'Tingkat Keberhasilan',
                            },
                        ].map((stat, idx) => (
                            <FadeIn
                                key={stat.label}
                                delay={idx * 150}
                                direction="none"
                                className="flex flex-col items-center px-4 text-center"
                            >
                                <stat.icon className="mb-4 h-8 w-8 text-green-200 opacity-80" />
                                <span className="text-4xl font-extrabold text-white">
                                    {stat.value}
                                </span>
                                <span className="mt-2 text-xs font-bold tracking-widest text-green-100 uppercase">
                                    {stat.label}
                                </span>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAP CTA ───────────────────────────────────── */}
            <section className="relative px-6 py-24">
                <FadeIn
                    delay={100}
                    className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Kiri — Map Visual */}
                        <div className="relative min-h-[400px] overflow-hidden bg-neutral-800 lg:min-h-full">
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                                    backgroundSize: '50px 50px',
                                }}
                            />
                            {/* Animated Markers */}
                            {[
                                {
                                    top: '30%',
                                    left: '25%',
                                    color: 'bg-orange-500',
                                    delay: '0s',
                                },
                                {
                                    top: '55%',
                                    left: '50%',
                                    color: 'bg-green-500',
                                    delay: '1s',
                                },
                                {
                                    top: '40%',
                                    left: '70%',
                                    color: 'bg-blue-500',
                                    delay: '2s',
                                },
                                {
                                    top: '65%',
                                    left: '35%',
                                    color: 'bg-green-500',
                                    delay: '1.5s',
                                },
                            ].map((marker, i) => (
                                <div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        top: marker.top,
                                        left: marker.left,
                                    }}
                                >
                                    <div className="relative flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                                        <span
                                            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${marker.color} opacity-40`}
                                            style={{
                                                animationDelay: marker.delay,
                                            }}
                                        ></span>
                                        <div
                                            className={`relative flex h-8 w-8 items-center justify-center rounded-full ${marker.color} shadow-lg ring-4 ring-neutral-900`}
                                        >
                                            <MapPin className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-900" />

                            {/* Location Badge */}
                            <div className="absolute bottom-6 left-6 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            Live Map
                                        </p>
                                        <p className="text-xs text-white/60">
                                            Kota Palu, Sulawesi Tengah
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kanan — Teks CTA */}
                        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
                            <div className="mb-4 inline-flex items-center gap-2">
                                <span className="flex h-6 items-center rounded-full bg-green-500/20 px-3 text-xs font-bold tracking-wider text-green-400 uppercase">
                                    Aksi Nyata
                                </span>
                            </div>
                            <h2 className="mb-6 text-4xl leading-tight font-extrabold text-white">
                                Satu Laporan Anda,
                                <br />
                                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                                    Berjuta Manfaat.
                                </span>
                            </h2>
                            <p className="mb-10 text-lg leading-relaxed text-neutral-400">
                                Jadilah bagian dari solusi. Laporan yang Anda
                                kirimkan membantu petugas memetakan area
                                prioritas untuk menciptakan lingkungan yang
                                lebih sehat.
                            </p>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href={
                                        auth?.user
                                            ? '/user/laporan/buat'
                                            : '/register'
                                    }
                                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-neutral-900 transition-all hover:bg-neutral-200"
                                >
                                    Mulai Melapor
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>
        </div>
    );
}

Welcome.layout = undefined;
