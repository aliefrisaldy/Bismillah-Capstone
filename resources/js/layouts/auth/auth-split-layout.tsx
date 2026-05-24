'use client';

import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { url } = usePage();
    const isRegister = url.includes('register');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 400);

        return () => clearTimeout(timer);
    }, [url]);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left Side - Form (Slides Right on Register) */}
            <div
                className={`flex min-h-screen w-full flex-col justify-center px-6 py-12 transition-transform duration-700 ease-in-out md:w-1/2 md:px-12 lg:px-16 ${
                    isRegister ? 'md:translate-x-full' : 'translate-x-0'
                }`}
            >
                <div
                    className={`mx-auto w-full max-w-sm transition-all duration-400 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                >
                    <div className="flex flex-col gap-8">
                        {/* Header */}
                        <div className="flex flex-col gap-6">
                            <Link
                                href={home()}
                                className="flex items-center gap-2 font-medium"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                                    <AppLogoIcon className="size-5 fill-white text-white" />
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                    Pakagasa
                                </span>
                            </Link>

                            <div className="space-y-3">
                                <h1 className="text-3xl font-bold text-foreground">
                                    {title}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Form Content */}
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Illustration (Slides Left on Register) */}
            <div
                className={`sticky top-0 hidden h-screen w-1/2 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-50/30 p-12 transition-transform duration-700 ease-in-out md:flex dark:from-emerald-950/20 dark:to-emerald-950/10 ${
                    isRegister ? '-translate-x-full' : 'translate-x-0'
                }`}
            >
                <div className="flex flex-col items-center gap-6">
                    {/* Illustration Placeholder */}
                    <div className="relative mb-8">
                        {/* Building Icon */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/30">
                            <svg
                                className="h-8 w-8 text-emerald-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            </svg>
                        </div>

                        {/* Leaf Icon */}
                        <div className="absolute -right-2 -bottom-2 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-emerald-500 bg-white dark:bg-slate-900">
                            <svg
                                className="h-10 w-10 text-emerald-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M17.92 7.02C17.45 4.18 14.97 2 12 2s-5.45 2.18-5.92 5.02C3.97 7.55 2 9.69 2 12.25 2 15.31 4.69 18 7.75 18h9.5C19.31 18 22 15.31 22 12.25 22 9.69 20.03 7.55 17.92 7.02z" />
                            </svg>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div
                        className={`text-center transition-all duration-400 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}
                    >
                        <h2 className="text-xl font-bold text-foreground">
                            Wujudkan kota yang lebih bersih dan tertata bersama
                            Pakagasa
                        </h2>
                    </div>

                    {/* Progress Indicator - Dynamic based on page */}
                    <div className="mt-4 flex gap-1">
                        <div
                            className={`h-1 rounded-full transition-all duration-700 ${
                                isRegister
                                    ? 'w-2 bg-muted'
                                    : 'w-6 bg-emerald-600'
                            }`}
                        ></div>
                        <div
                            className={`h-1 rounded-full transition-all duration-700 ${
                                isRegister
                                    ? 'w-6 bg-emerald-600'
                                    : 'w-2 bg-muted'
                            }`}
                        ></div>
                        <div className="h-1 w-2 rounded-full bg-muted"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
