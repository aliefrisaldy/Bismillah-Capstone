import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { ReactNode } from 'react';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: {
    children: ReactNode;
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex min-h-svh">

            {/* Kiri — Form */}
            <div className="flex w-full flex-col justify-between p-8 md:w-1/2 lg:p-14">
                {/* Logo */}
                <Link href={home()} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600">
                        <svg viewBox="0 0 18 18" fill="none" className="h-4 w-4">
                            <path d="M9 2C6 2 3.5 4.5 3.5 7.5C3.5 11 9 16 9 16C9 16 14.5 11 14.5 7.5C14.5 4.5 12 2 9 2Z" fill="white"/>
                        </svg>
                    </div>
                    <span className="text-sm font-semibold">Palu Clean City</span>
                </Link>

                {/* Form Area */}
                <div className="mx-auto w-full max-w-sm">
                    {title && (
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                            {description && (
                                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                            )}
                        </div>
                    )}
                    {children}
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Palu Clean City. Dinas Lingkungan Hidup Kota Palu.
                </p>
            </div>

            {/* Kanan — Ilustrasi */}
            <div className="hidden flex-col items-center justify-center gap-8 rounded-l-3xl bg-[#F0F7F0] p-12 md:flex md:w-1/2">
                {/* Placeholder ilustrasi */}
                <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/60">
                    <div className="flex flex-col items-center gap-3 text-green-600">
                        <svg viewBox="0 0 80 80" fill="none" className="h-24 w-24">
                            <circle cx="40" cy="40" r="38" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4"/>
                            <path d="M40 12C28 12 18 22 18 34C18 50 40 68 40 68C40 68 62 50 62 34C62 22 52 12 40 12Z" fill="#22c55e" opacity="0.9"/>
                            <circle cx="40" cy="34" r="8" fill="white"/>
                        </svg>
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        Wujudkan kota yang lebih<br />bersih dan tertata bersama<br />Palu Clean City
                    </h2>
                    {/* Dots indicator */}
                    <div className="mt-6 flex justify-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                        <div className="h-2 w-8 rounded-full bg-gray-800"></div>
                    </div>
                </div>
            </div>

        </div>
    );
}