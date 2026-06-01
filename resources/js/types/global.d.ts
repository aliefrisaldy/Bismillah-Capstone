import type { Auth } from '@/types/auth';

export type LaporanSummary = {
    id_laporan: number;
    status: string;
    tanggal_diperbarui: string;
    alamat: string;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            laporan_summary: LaporanSummary[];
            [key: string]: unknown;
        };
    }
}
