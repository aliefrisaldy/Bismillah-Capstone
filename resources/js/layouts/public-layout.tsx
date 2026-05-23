import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';

type Auth = {
    user: { name: string; email: string } | null;
};

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600">
                            <svg viewBox="0 0 18 18" fill="none" className="h-4 w-4">
                                <path d="M9 2C6 2 3.5 4.5 3.5 7.5C3.5 11 9 16 9 16C9 16 14.5 11 14.5 7.5C14.5 4.5 12 2 9 2Z" fill="white"/>
                            </svg>
                        </div>
                        <span className="text-sm font-semibold">Pakagasa</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden items-center gap-8 md:flex">
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Laporan
                        </Link>
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Peta
                        </Link>
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Tentang Kami
                        </Link>
                    </div>

                    {/* CTA */}
                    <div className="hidden items-center gap-3 md:flex">
                        {auth?.user ? (
                            <>
                                <Link
                                    href="/user/laporan"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {auth.user.name}
                                </Link>
                                <Link
                                    href="/user/laporan/buat"
                                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                                >
                                    Lapor Sekarang
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                                >
                                    Lapor Sekarang
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="flex md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                            }
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="border-t border-border px-6 py-4 md:hidden flex flex-col gap-4">
                        <Link href="/" className="text-sm text-muted-foreground">Laporan</Link>
                        <Link href="/" className="text-sm text-muted-foreground">Peta</Link>
                        <Link href="/" className="text-sm text-muted-foreground">Tentang Kami</Link>
                        {auth?.user ? (
                            <Link href="/user/laporan/buat" className="rounded-full bg-green-600 px-4 py-2 text-center text-sm font-medium text-white">
                                Lapor Sekarang
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link href="/login" className="text-sm text-center text-muted-foreground">Masuk</Link>
                                <Link href="/register" className="rounded-full bg-green-600 px-4 py-2 text-center text-sm font-medium text-white">
                                    Lapor Sekarang
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="border-t border-border bg-background">
                <div className="mx-auto max-w-6xl px-6 py-12">
                    <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600">
                                    <svg viewBox="0 0 18 18" fill="none" className="h-4 w-4">
                                        <path d="M9 2C6 2 3.5 4.5 3.5 7.5C3.5 11 9 16 9 16C9 16 14.5 11 14.5 7.5C14.5 4.5 12 2 9 2Z" fill="white"/>
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold">Pakagasa</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Inisiatif digital Pemerintah Kota Palu untuk meningkatkan kebersihan dan kualitas hidup warga melalui transparansi pelaporan sampah.
                            </p>
                        </div>
                        <div className="flex gap-12">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium">Kebijakan Privasi</p>
                                <p className="text-xs font-medium">Syarat & Ketentuan</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-medium">Kontak Kami</p>
                                <p className="text-xs font-medium">Pusat Bantuan</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} City Government of Palu. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    );
}