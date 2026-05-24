import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { JadwalEditor } from '@/components/admin/jadwal-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { normalizeJadwal  } from '@/lib/jalur-schedule';
import type {JadwalItem} from '@/lib/jalur-schedule';

type TipeKendaraan = 'Pick Up' | 'Kaisar' | 'R6';

type JalurDetail = {
    id_jalur_angkut: number;
    nama: string;
    kelurahan: string | null;
    tipe_kendaraan: TipeKendaraan;
    warna: string;
    aktif: boolean;
    jadwal: JadwalItem[] | unknown;
};

type Props = {
    jalur: JalurDetail;
};

export default function AdminJalurEdit({ jalur }: Props) {
    const page = usePage();
    const errors =
        (page.props as { errors?: Record<string, string> }).errors ?? {};

    const { data, setData, put, processing } = useForm({
        nama: jalur.nama,
        aktif: jalur.aktif,
        jadwal: normalizeJadwal(jalur.jadwal),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/jalur/${jalur.id_jalur_angkut}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Edit Jalur #${jalur.id_jalur_angkut}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/admin/jalur`}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                #{jalur.id_jalur_angkut}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Edit Jalur</span>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="mx-auto w-full max-w-3xl space-y-6"
                >
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <h1 className="text-2xl font-extrabold text-foreground">
                            Edit Jalur Angkut
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {jalur.tipe_kendaraan}
                            {jalur.kelurahan ? ` · ${jalur.kelurahan}` : ''}
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="nama">Nama Jalur</Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData('nama', e.target.value)
                                    }
                                    className="mt-1.5 h-11"
                                />
                                {errors.nama && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Status Jalur</Label>
                                <Select
                                    value={data.aktif ? '1' : '0'}
                                    onValueChange={(v) =>
                                        setData('aktif', v === '1')
                                    }
                                >
                                    <SelectTrigger className="mt-1.5 h-11 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Aktif</SelectItem>
                                        <SelectItem value="0">
                                            Nonaktif
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.aktif && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.aktif}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Tipe Kendaraan</Label>
                                <Input
                                    value={jalur.tipe_kendaraan}
                                    disabled
                                    className="mt-1.5 h-11 bg-muted/50"
                                />
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Tipe kendaraan tidak dapat diubah di sini.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <JadwalEditor
                            value={data.jadwal}
                            onChange={(jadwal) => setData('jadwal', jadwal)}
                            errors={errors}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link
                                href={`/admin/jalur/${jalur.id_jalur_angkut}`}
                            >
                                Batal
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="gap-2 bg-emerald-700 hover:bg-emerald-800"
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminJalurEdit.layout = {
    breadcrumbs: [
        { title: 'Jalur Angkut', href: '/admin/jalur' },
        { title: 'Edit Jalur', href: '#' },
    ],
};
