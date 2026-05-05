import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export default function LaporanCreate() {
    const [processing, setProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [alamat, setAlamat] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [error, setError] = useState<Record<string, string>>({});
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDeteksiLokasi = () => {
        if (!navigator.geolocation) {
            alert('Browser kamu tidak mendukung GPS.');
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLatitude(String(lat));
                setLongitude(String(lng));

                // Reverse geocoding pakai Nominatim (gratis, tanpa API key)
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
                    );
                    const data = await res.json();
                    setAlamat(data.display_name ?? '');
                } catch {
                    setAlamat(`${lat}, ${lng}`);
                } finally {
                    setLocating(false);
                }
            },
            () => {
                alert('Gagal mendeteksi lokasi. Pastikan izin GPS sudah diberikan.');
                setLocating(false);
            }
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setError({});

        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('latitude', latitude);
        formData.set('longitude', longitude);
        formData.set('alamat', alamat);

        router.post('/user/laporan', formData, {
            onError: (errors) => {
                setError(errors);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Buat Laporan" />

            <div className="mx-auto max-w-2xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Buat Laporan Baru</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Laporkan keberadaan tempat pembuangan sampah ilegal di sekitarmu.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Foto */}
                    <div className="grid gap-2">
                        <Label htmlFor="foto">Foto Bukti</Label>
                        <Input
                            id="foto"
                            type="file"
                            name="foto"
                            accept="image/*"
                            ref={fileRef}
                            onChange={handleFoto}
                            required
                        />
                        {error.foto && (
                            <p className="text-sm text-red-500">{error.foto}</p>
                        )}
                        {preview && (
                            <img
                                src={preview}
                                alt="Preview foto"
                                className="mt-2 h-48 w-full rounded-lg object-cover"
                            />
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div className="grid gap-2">
                        <Label htmlFor="deskripsi">Deskripsi</Label>
                        <Textarea
                            id="deskripsi"
                            name="deskripsi"
                            placeholder="Jelaskan kondisi sampah yang kamu temukan..."
                            rows={4}
                            required
                        />
                        {error.deskripsi && (
                            <p className="text-sm text-red-500">{error.deskripsi}</p>
                        )}
                    </div>

                    {/* Lokasi */}
                    <div className="grid gap-2">
                        <Label>Lokasi</Label>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDeteksiLokasi}
                            disabled={locating}
                            className="w-full"
                        >
                            {locating ? (
                                <>
                                    <Spinner className="mr-2" />
                                    Mendeteksi lokasi...
                                </>
                            ) : (
                                '📍 Deteksi Lokasi Saya'
                            )}
                        </Button>

                        {alamat && (
                            <div className="rounded-lg border border-border bg-muted p-3">
                                <p className="text-xs text-muted-foreground">Lokasi terdeteksi:</p>
                                <p className="mt-1 text-sm">{alamat}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {latitude}, {longitude}
                                </p>
                            </div>
                        )}

                        {error.latitude && (
                            <p className="text-sm text-red-500">
                                Lokasi wajib dideteksi sebelum mengirim laporan.
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing || !latitude}
                    >
                        {processing && <Spinner className="mr-2" />}
                        Kirim Laporan
                    </Button>

                </form>
            </div>
        </>
    );
}

LaporanCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/user/dashboard' },
        { title: 'Buat Laporan', href: '/user/laporan/buat' },
    ],
};