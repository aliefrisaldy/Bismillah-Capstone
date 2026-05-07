import AppUserLayout from '@/layouts/app/app-user-layout';
import type { BreadcrumbItem } from '@/types';

export default function UserAppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AppUserLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppUserLayout>
    );
}