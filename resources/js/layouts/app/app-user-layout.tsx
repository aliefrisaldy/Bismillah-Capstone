import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { UserHeader } from '@/components/user-header';
import type { AppLayoutProps } from '@/types';

export default function AppUserLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <UserHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
