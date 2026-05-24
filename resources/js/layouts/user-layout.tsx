import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

// ── FadeIn ────────────────────────────────────────────────
export const FadeIn = ({
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
                    ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
                    : `opacity-0 ${directionClasses[direction]}`
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// ── Nav links ─────────────────────────────────────────────
const NAV_LINKS = [
    { href: '/',                   label: 'Beranda',         exact: true  },
    { href: '/user/laporan',       label: 'Laporan Saya', exact: false },
    { href: '/user/laporan/buat',  label: 'Buat Laporan', exact: true  },
    { href: '/user/peta',          label: 'Peta Laporan', exact: false },
    { href: '/user/jalur-angkut',  label: 'Jalur Angkut', exact: false },
];

// ── Layout ────────────────────────────────────────────────
export default function UserLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage().props as any;
    const currentUrl = usePage().url;
    const getInitials = useInitials();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (href: string, exact: boolean) =>
        exact ? currentUrl === href : currentUrl.startsWith(href);

    return (
        <div className="min-h-screen bg-background pb-20 font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-24">
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-tight text-foreground"
                    >
                        Pakagasa
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
                        {NAV_LINKS.map(({ href, label, exact }) =>
                            isActive(href, exact) ? (
                                <Link
                                    key={href}
                                    href={href}
                                    className="relative font-semibold text-foreground after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-foreground"
                                >
                                    {label}
                                </Link>
                            ) : (
                                <Link
                                    key={href}
                                    href={href}
                                    className="transition-colors duration-200 hover:text-foreground"
                                >
                                    {label}
                                </Link>
                            ),
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 overflow-hidden rounded-full p-0 ring-2 ring-border transition-all duration-200 hover:ring-foreground/30"
                                >
                                    <Avatar className="size-full">
                                        <AvatarImage
                                            src={auth?.user?.avatar}
                                            alt={auth?.user?.name}
                                        />
                                        <AvatarFallback className="bg-emerald-800 text-white">
                                            {getInitials(auth?.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                {auth?.user && <UserMenuContent user={auth.user} />}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            type="button"
                            className="inline-flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground backdrop-blur transition-colors hover:bg-accent md:hidden"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {menuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="border-t border-border/50 px-6 py-4 md:hidden flex flex-col gap-4">
                        {NAV_LINKS.map(({ href, label, exact }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className={
                                    isActive(href, exact)
                                        ? 'text-sm font-semibold text-foreground'
                                        : 'text-sm text-muted-foreground'
                                }
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                )}
            </header>

            {/* Content — max-w-4xl sama persis dengan laporan-create */}
            <main className="mx-auto mt-8 max-w-6xl px-6 md:px-12 lg:mt-12">
                {children}
            </main>

            {/* Footer */}
            <FadeIn delay={100}>
                <footer className="mx-auto mt-24 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border px-6 pt-8 md:flex-row md:px-12">
                    <div>
                        <h4 className="mb-1 font-bold text-foreground">Pakagasa</h4>
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Pemerintah Kota Palu -
                            Dinas Lingkungan Hidup. Digital Arboretum Initiative.
                        </p>
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="#" className="hover:text-foreground">Kebijakan Privasi</Link>
                        <Link href="#" className="hover:text-foreground">Kontak Darurat</Link>
                        <Link href="#" className="hover:text-foreground">Pusat Bantuan</Link>
                    </div>
                </footer>
            </FadeIn>
        </div>
    );
}