import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import { useAppearance } from '@/hooks/use-appearance';
import { useFlashToast } from '@/hooks/use-flash-toast';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            richColors
            expand
            visibleToasts={2}
            duration={2000}
            toastOptions={{
                classNames: {
                    toast:
                        'text-base font-semibold shadow-lg border border-border/50 py-4 px-5',
                    title: 'text-base',
                    description: 'text-sm',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
