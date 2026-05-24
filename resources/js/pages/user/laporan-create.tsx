import { Head, router } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Image as ImageIcon,
    FileText,
    MapPin,
    CheckCircle2,
    Eye,
    Users,
    UploadCloud,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import FadeIn from '@/components/fade-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// ── Types ─────────────────────────────────────────────────
function ChangeView({
    center,
    zoom,
}: {
    center: [number, number];
    zoom: number;
}) {
    const map = useMap();
    map.setView(center, zoom);

    return null;
}

export default function LaporanCreate() {
    const [processing, setProcessing] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [locating, setLocating] = useState(false);
    const [alamat, setAlamat] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [error, setError] = useState<Record<string, string>>({});
    const fileRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const next = files.map((f) => URL.createObjectURL(f));
        setPreviews(next);

        return () => {
            next.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [files]);

    const addFiles = (fileList?: FileList | null) => {
        if (!fileList?.length) {
return;
}

        const incoming = Array.from(fileList).filter((f) =>
            f.type.startsWith('image/'),
        );

        if (!incoming.length) {
return;
}

        setFiles((prev) => [...prev, ...incoming]);
    };

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(e.target.files);
        e.currentTarget.value = '';
    };

    const handleCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(e.target.files);
        e.currentTarget.value = '';
    };

    const removeFileAt = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
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

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
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
                alert(
                    'Gagal mendeteksi lokasi. Pastikan izin GPS sudah diberikan.',
                );
                setLocating(false);
            },
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
        formData.delete('foto');
        files.forEach((f) => formData.append('foto[]', f));
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
                {/* Header */}
                <FadeIn delay={100}>
                    <div className="mb-8">
                        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-foreground md:text-5xl">
                            Buat Laporan Baru
                        </h1>
                        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                            Bantu Kota Palu tetap bersih dan asri. Laporkan
                            lokasi pembuangan sampah ilegal di sekitar Anda
                            dengan melampirkan foto dan lokasi yang tepat.
                        </p>
                    </div>
                </FadeIn>

                {/* Form Container */}
                <FadeIn delay={200}>
                    <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Unggah Foto Sampah */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Unggah Foto Sampah
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Kamu bisa unggah beberapa foto
                                        sekaligus, atau ambil foto langsung dari
                                        kamera.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() =>
                                                cameraRef.current?.click()
                                            }
                                        >
                                            Ambil dari Kamera
                                        </Button>
                                        <Button
                                            type="button"
                                            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                            onClick={() =>
                                                fileRef.current?.click()
                                            }
                                        >
                                            Pilih Foto
                                        </Button>
                                    </div>
                                </div>
                                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20">
                                    <input
                                        id="foto"
                                        type="file"
                                        name="foto"
                                        accept="image/*"
                                        ref={fileRef}
                                        onChange={handleFoto}
                                        multiple
                                        className="sr-only"
                                    />
                                    <input
                                        id="foto_kamera"
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={cameraRef}
                                        onChange={handleCamera}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="foto"
                                        className="block cursor-pointer"
                                    >
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                            <UploadCloud className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="mb-1 text-sm font-medium text-foreground">
                                            Klik area ini untuk memilih foto
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Mendukung format JPG, PNG hingga 5MB
                                        </p>
                                    </label>
                                </div>
                                {previews.length ? (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {previews.map((src, idx) => (
                                            <div
                                                key={`${src}-${idx}`}
                                                className="group relative overflow-hidden rounded-xl border border-border"
                                            >
                                                <img
                                                    src={src}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="h-32 w-full object-cover sm:h-36"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFileAt(idx)
                                                    }
                                                    className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                {error.foto && (
                                    <p className="text-xs font-medium text-destructive">
                                        {error.foto}
                                    </p>
                                )}
                                {!files.length ? (
                                    <p className="text-[11px] text-muted-foreground">
                                        *Minimal 1 foto diperlukan.
                                    </p>
                                ) : null}
                            </div>

                            {/* Deskripsi Kondisi */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Deskripsi Kondisi
                                    </h2>
                                </div>
                                <Textarea
                                    id="deskripsi"
                                    name="deskripsi"
                                    placeholder="Contoh: Sampah plastik menumpuk di pinggir selokan dekat jembatan, menimbulkan bau tidak sedap..."
                                    rows={4}
                                    required
                                    className="resize-none rounded-xl bg-transparent focus-visible:ring-emerald-500"
                                />
                                {error.deskripsi && (
                                    <p className="text-xs font-medium text-destructive">
                                        {error.deskripsi}
                                    </p>
                                )}
                            </div>

                            {/* Deteksi Lokasi Otomatis */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-emerald-600" />
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Deteksi Lokasi Otomatis
                                        </h2>
                                    </div>
                                </div>

                                {!latitude ? (
                                    <Button
                                        type="button"
                                        onClick={handleDeteksiLokasi}
                                        disabled={locating}
                                        variant="outline"
                                        className="w-full rounded-xl py-6 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
                                    >
                                        {locating ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Mendeteksi lokasi...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="mr-2 h-5 w-5" />
                                                Klik untuk Deteksi Lokasi Anda
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                                        <div className="relative z-0 h-[200px] w-full overflow-hidden rounded-xl border border-border">
                                            <MapContainer
                                                center={[
                                                    Number(latitude),
                                                    Number(longitude),
                                                ]}
                                                zoom={16}
                                                scrollWheelZoom={false}
                                                className="relative z-0 h-full w-full"
                                                style={{ zIndex: 0 }}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <Marker
                                                    position={[
                                                        Number(latitude),
                                                        Number(longitude),
                                                    ]}
                                                />
                                                <ChangeView
                                                    center={[
                                                        Number(latitude),
                                                        Number(longitude),
                                                    ]}
                                                    zoom={16}
                                                />
                                            </MapContainer>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-800/30 dark:bg-emerald-900/20">
                                                <p className="mb-1 text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                                    TITIK KOORDINAT TERDETEKSI
                                                </p>
                                                <p className="font-mono text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                                    {latitude}, {longitude}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Alamat Lengkap
                                                </label>
                                                <Input
                                                    value={alamat}
                                                    onChange={(e) =>
                                                        setAlamat(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="rounded-xl"
                                                />
                                            </div>

                                            <p className="text-[11px] text-muted-foreground">
                                                *Pastikan GPS Anda aktif untuk
                                                akurasi lokasi pelaporan.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {error.latitude && (
                                    <p className="text-xs font-medium text-destructive">
                                        Lokasi wajib dideteksi sebelum mengirim
                                        laporan.
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 border-t border-border pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit('/user/laporan')
                                    }
                                    className="rounded-xl px-8"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || !latitude || !files.length
                                    }
                                    className="rounded-xl bg-orange-500 px-8 text-white hover:bg-orange-600 disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="mr-2 h-4 w-4" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        'Kirim Laporan'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </FadeIn>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                    {[
                        {
                            icon: CheckCircle2,
                            title: 'Validasi Cepat',
                            desc: 'Setiap laporan yang anda kirim akan divalidasi oleh tim lapangan dalam waktu kurang dari 24 jam.',
                            delay: 100,
                        },
                        {
                            icon: Eye,
                            title: 'Pantau Status',
                            desc: 'Anda dapat melihat perkembangan pembersihan secara real-time".',
                            delay: 200,
                        },
                        {
                            icon: Users,
                            title: 'Aksi Bersama',
                            desc: 'Partisipasi Anda sangat berarti untuk mewujudkan Palu sebagai kota bersih dan nyaman.',
                            delay: 300,
                        },
                    ].map(({ icon: Icon, title, desc, delay }) => (
                        <FadeIn key={title} delay={delay} direction="up">
                            <div className="flex flex-col items-start rounded-xl border border-border bg-card p-6 text-left text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                    <Icon className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">
                                    {title}
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {desc}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
        </>
    );
}

import UserLayout from '@/layouts/user-layout';
LaporanCreate.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;
