import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Loader2, Save } from 'lucide-react';
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

type TpsDetail = {
    id: number;
    nama: string | null;
    latitude: number;
    longitude: number;
    aktif: boolean;
};

type Props = {
    tps: TpsDetail;
};

export default function TpsResmiEdit({ tps }: Props) {
    const page = usePage();
    const errors =
        (page.props as { errors?: Record<string, string> }).errors ?? {};

    const { data, setData, put, processing } = useForm({
        nama: tps.nama ?? '',
        latitude: String(tps.latitude),
        longitude: String(tps.longitude),
        aktif: tps.aktif,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/tps-resmi/${tps.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Edit TPS #${tps.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/admin/tps-resmi/${tps.id}`}>
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                #{tps.id}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Edit TPS</span>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="mx-auto w-full max-w-3xl space-y-6"
                >
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <h1 className="text-2xl font-extrabold text-foreground">
                            Edit TPS Resmi
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            #{String(tps.id).padStart(5, '0')}
                            {tps.nama ? ` · ${tps.nama}` : ''}
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label htmlFor="nama">Nama TPS</Label>
                                <Input
                                    id="nama"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData('nama', e.target.value)
                                    }
                                    className="mt-1.5 h-11"
                                    placeholder="Nama lokasi TPS"
                                />
                                {errors.nama && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.nama}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={data.latitude}
                                    onChange={(e) =>
                                        setData('latitude', e.target.value)
                                    }
                                    className="mt-1.5 h-11 font-mono"
                                />
                                {errors.latitude && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.latitude}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={data.longitude}
                                    onChange={(e) =>
                                        setData('longitude', e.target.value)
                                    }
                                    className="mt-1.5 h-11 font-mono"
                                />
                                {errors.longitude && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.longitude}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Status TPS</Label>
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
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/tps-resmi/${tps.id}`}>
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

TpsResmiEdit.layout = {
    breadcrumbs: [
        { title: 'TPS Resmi', href: '/admin/tps-resmi' },
        { title: 'Edit TPS', href: '#' },
    ],
};
