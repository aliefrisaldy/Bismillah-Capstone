import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

type Laporan = {
    id_laporan: number;
    deskripsi: string;
    foto: string | null;
    alamat: string | null;
    status: 'menunggu' | 'diverifikasi' | 'diproses' | 'selesai' | 'ditolak';
    tanggal_laporan: string;
    tanggal_diperbarui: string;
};

type Props = {
    laporan: Laporan[];
};

const statusConfig = {
    menunggu:    { label: 'Menunggu',    color: 'bg-gray-100 text-gray-700' },
    diverifikasi: { label: 'Diverifikasi', color: 'bg-blue-100 text-blue-700' },
    diproses:    { label: 'Diproses',    color: 'bg-yellow-100 text-yellow-700' },
    selesai:     { label: 'Selesai',     color: 'bg-green-100 text-green-700' },
    ditolak:     { label: 'Ditolak',     color: 'bg-red-100 text-red-700' },
};

export default function LaporanIndex({ laporan }: Props) {
    return (
        <>
            <Head title="Laporan Saya" />

            <div className="mx-auto max-w-4xl p-6">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Laporan Saya</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Daftar laporan sampah ilegal yang pernah kamu kirim.
                        </p>
                    </div>
                    <Link href="/user/laporan/buat">
                        <Button>+ Buat Laporan</Button>
                    </Link>
                </div>

                {/* Kosong */}
                {laporan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                        <p className="text-4xl">🗑️</p>
                        <p className="mt-4 text-lg font-medium">Belum ada laporan</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Temukan titik sampah ilegal dan laporkan sekarang.
                        </p>
                        <Link href="/user/laporan/buat" className="mt-4">
                            <Button>Buat Laporan Pertama</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {laporan.map((item) => (
                            <Link
                                key={item.id_laporan}
                                href={`/user/laporan/${item.id_laporan}`}
                                className="block"
                            >
                                <div className="flex gap-4 rounded-xl border border-border p-4 transition hover:bg-muted/50">

                                    {/* Foto */}
                                    {item.foto ? (
                                        <img
                                            src={`/storage/${item.foto}`}
                                            alt="Foto laporan"
                                            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                                            🗑️
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <p className="text-sm font-medium line-clamp-2">
                                                {item.deskripsi}
                                            </p>
                                            {item.alamat && (
                                                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                                                    📍 {item.alamat}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {item.tanggal_laporan}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[item.status].color}`}>
                                                {statusConfig[item.status].label}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </>
    );
}

LaporanIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/user/dashboard' },
        { title: 'Laporan Saya', href: '/user/laporan' },
    ],
};