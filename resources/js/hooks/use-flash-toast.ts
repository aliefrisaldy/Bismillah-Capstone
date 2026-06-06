import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const lastKey = useRef('');
    const lastNav = useRef(0);
    const navId = useRef(0);

    useEffect(() => {
        const cleanupFlash = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash as Record<string, unknown> | undefined;

            if (!flash) {
                return;
            }

            const toastData = flash.toast as FlashToast | undefined;

            if (toastData) {
                const key = `toast:${toastData.type}:${toastData.message}`;

                if (key === lastKey.current && lastNav.current === navId.current) {
                    return;
                }

                lastKey.current = key;
                lastNav.current = navId.current;
                toast[toastData.type](toastData.message);

                return;
            }

            const success = flash.success as string | undefined;
            const error = flash.error as string | undefined;
            const warning = flash.warning as string | undefined;
            const info = flash.info as string | undefined;
            const msg = success ?? error ?? warning ?? info;

            if (!msg) {
                return;
            }

            const key = `${success ? 'success' : error ? 'error' : warning ? 'warning' : 'info'}:${msg}`;

            if (key === lastKey.current && lastNav.current === navId.current) {
                return;
            }

            lastKey.current = key;
            lastNav.current = navId.current;

            if (success) {
                toast.success(success);
            } else if (error) {
                toast.error(error);
            } else if (warning) {
                toast.warning(warning);
            } else if (info) {
                toast.info(info);
            }
        });

        const cleanupSuccess = router.on('success', (event) => {
            navId.current += 1;

            const page = (event as CustomEvent).detail?.page as
                | { props: Record<string, unknown> }
                | undefined;
            const flash = page?.props?.flash as Record<string, unknown> | undefined;

            if (!flash) {
                return;
            }

            const toastData = flash.toast as FlashToast | undefined;

            if (toastData) {
                const key = `toast:${toastData.type}:${toastData.message}`;

                if (key === lastKey.current && lastNav.current === navId.current) {
                    return;
                }

                lastKey.current = key;
                lastNav.current = navId.current;
                toast[toastData.type](toastData.message);

                return;
            }

            const success = flash.success as string | undefined;
            const error = flash.error as string | undefined;
            const warning = flash.warning as string | undefined;
            const info = flash.info as string | undefined;
            const msg = success ?? error ?? warning ?? info;

            if (!msg) {
                return;
            }

            const key = `${success ? 'success' : error ? 'error' : warning ? 'warning' : 'info'}:${msg}`;

            if (key === lastKey.current && lastNav.current === navId.current) {
                return;
            }

            lastKey.current = key;
            lastNav.current = navId.current;

            if (success) {
                toast.success(success);
            } else if (error) {
                toast.error(error);
            } else if (warning) {
                toast.warning(warning);
            } else if (info) {
                toast.info(info);
            }
        });

        return () => {
            cleanupFlash();
            cleanupSuccess();
        };
    }, []);
}
