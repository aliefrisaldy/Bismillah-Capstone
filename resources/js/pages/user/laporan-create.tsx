import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { 
    Image as ImageIcon, 
    FileText, 
    MapPin, 
    CheckCircle2, 
    Eye, 
    Users,
    UploadCloud
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

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

            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Buat Laporan Baru</h1>
                    <p className="mt-2 text-base text-muted-foreground">
                        Bantu Kota Palu tetap bersih dan asri. Laporkan lokasi pembuangan sampah ilegal di sekitar Anda dengan melampirkan foto dan lokasi yang tepat.
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 md:p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Unggah Foto Sampah */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-emerald-600" />
                                <h2 className="text-sm font-semibold text-foreground">Unggah Foto Sampah</h2>
                            </div>
                            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 text-center">
                                <input
                                    id="foto"
                                    type="file"
                                    name="foto"
                                    accept="image/*"
                                    ref={fileRef}
                                    onChange={handleFoto}
                                    required
                                    className="hidden"
                                />
                                <label htmlFor="foto" className="block cursor-pointer">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                                        <UploadCloud className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">Klik atau seret foto ke sini</p>
                                    <p className="text-xs text-muted-foreground">Mendukung format JPG, PNG hingga 5MB</p>
                                </label>
                            </div>
                            {preview && (
                                <div className="mt-4">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="h-48 w-full rounded-xl object-cover border border-border"
                                    />
                                </div>
                            )}
                            {error.foto && <p className="text-xs text-destructive font-medium">{error.foto}</p>}
                        </div>

                        {/* Deskripsi Kondisi */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                <h2 className="text-sm font-semibold text-foreground">Deskripsi Kondisi</h2>
                            </div>
                            <Textarea
                                id="deskripsi"
                                name="deskripsi"
                                placeholder="Contoh: Sampah plastik menumpuk di pinggir selokan dekat jembatan, menimbulkan bau tidak sedap..."
                                rows={4}
                                required
                                className="resize-none rounded-xl bg-transparent focus-visible:ring-emerald-500"
                            />
                            {error.deskripsi && <p className="text-xs text-destructive font-medium">{error.deskripsi}</p>}
                        </div>

                        {/* Deteksi Lokasi Otomatis */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-sm font-semibold text-foreground">Deteksi Lokasi Otomatis</h2>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* Map Container */}
                                    <div className="h-[200px] w-full rounded-xl overflow-hidden border border-border relative z-0">
                                        <MapContainer 
                                            center={[Number(latitude), Number(longitude)]} 
                                            zoom={16} 
                                            scrollWheelZoom={false}
                                            className="h-full w-full z-0 relative"
                                            style={{ zIndex: 0 }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[Number(latitude), Number(longitude)]} />
                                            <ChangeView center={[Number(latitude), Number(longitude)]} zoom={16} />
                                        </MapContainer>
                                    </div>
                                    
                                    {/* Location Details */}
                                    <div className="space-y-4">
                                        <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 p-4 border border-emerald-100 dark:border-emerald-800/30">
                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                                TITIK KOORDINAT TERDETEKSI
                                            </p>
                                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 font-mono">
                                                {latitude}, {longitude}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Alamat Lengkap</label>
                                            <Input
                                                value={alamat}
                                                onChange={(e) => setAlamat(e.target.value)}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        
                                        <p className="text-[11px] text-muted-foreground">
                                            *Pastikan GPS Anda aktif untuk akurasi lokasi pelaporan.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {error.latitude && <p className="text-xs text-destructive font-medium">Lokasi wajib dideteksi sebelum mengirim laporan.</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/user/laporan')}
                                className="rounded-xl px-8"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !latitude}
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

                {/* Features Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex flex-col items-start text-left">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Validasi Cepat</h3>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            Setiap laporan akan divalidasi oleh tim lapangan dalam waktu kurang dari 24 jam.
                        </p>
                    </div>
                    
                    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex flex-col items-start text-left">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
                            <Eye className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Pantau Status</h3>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            Anda dapat melihat perkembangan pembersihan secara real-time melalui dashboard "Laporan Saya".
                        </p>
                    </div>
                    
                    <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border flex flex-col items-start text-left">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
                            <Users className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Aksi Bersama</h3>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            Partisipasi Anda sangat berarti untuk mewujudkan Palu sebagai kota bersih dan nyaman.
                        </p>
                    </div>
                </div>
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