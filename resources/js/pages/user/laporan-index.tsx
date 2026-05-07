import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { PlusCircle, HelpCircle, Info, Phone, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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
    menunggu:    { label: 'MENUNGGU',    color: 'bg-amber-100 text-amber-700' },
    diverifikasi: { label: 'DIVERIFIKASI', color: 'bg-blue-100 text-blue-700' },
    diproses:    { label: 'DIPROSES',    color: 'bg-orange-100 text-orange-700' },
    selesai:     { label: 'SELESAI',     color: 'bg-green-100 text-green-700' },
    ditolak:     { label: 'DITOLAK',     color: 'bg-red-100 text-red-700' },
};

export default function LaporanIndex({ laporan }: Props) {
    const { auth } = usePage().props as any;
    const getInitials = useInitials();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-green-500/30 pb-20">
            <Head title="Sistem Pelaporan" />

            {/* Custom Navbar matching the design */}
            <nav className="flex items-center justify-between px-6 py-6 md:px-12 lg:px-24">
                <Link href="/" className="text-[#0B3B24] font-bold text-xl tracking-tight">
                    Civic Ecology Palu
                </Link>
                
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
                    <Link href="/" className="hover:text-[#0B3B24] transition-colors">Home</Link>
                    <Link href="/user/laporan" className="text-[#0B3B24] border-b-2 border-[#0B3B24] pb-1 font-semibold">Laporan Saya</Link>
                    <Link href="/user/laporan/buat" className="hover:text-[#0B3B24] transition-colors">Buat Laporan</Link>
                </div>
                
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-10 rounded-full p-0 overflow-hidden ring-2 ring-[#0B3B24]/10 hover:ring-[#0B3B24]/30 transition-all">
                                <Avatar className="size-full">
                                    <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name} />
                                    <AvatarFallback className="bg-[#0B3B24] text-white">
                                        {getInitials(auth?.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth?.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-6 md:px-12 mt-8 lg:mt-12">
                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B3B24] leading-tight tracking-tight">
                            Sistem Pelaporan Tempat <br className="hidden md:block" />
                            Pembuangan Sampah Ilegal
                        </h1>
                        <p className="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-xl">
                            Selamat datang kembali, Sahabat Ekologi. Mari bersama menjaga keasrian Kota Palu
                            dengan melaporkan titik pembuangan sampah tidak resmi di lingkungan Anda.
                        </p>
                    </div>
                    <Link href="/user/laporan/buat" className="shrink-0">
                        <Button className="bg-[#1A4D2E] hover:bg-[#133922] text-white rounded-lg px-6 py-6 font-semibold shadow-lg shadow-green-900/20 transition-all hover:-translate-y-1">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Buat Laporan Baru
                        </Button>
                    </Link>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Laporan Terbaru */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#0B3B24]">Laporan Terbaru</h2>
                            <Link href="/user/laporan" className="text-sm font-semibold text-[#0B3B24] hover:underline flex items-center">
                                Lihat Semua <span className="ml-1">→</span>
                            </Link>
                        </div>

                        {laporan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center shadow-sm">
                                <p className="text-4xl mb-4">🗑️</p>
                                <p className="text-lg font-bold text-[#0B3B24]">Belum ada laporan</p>
                                <p className="mt-2 text-sm text-gray-500 max-w-sm">
                                    Anda belum membuat laporan apapun. Mari mulai berkontribusi dengan melaporkan titik sampah ilegal.
                                </p>
                                <Link href="/user/laporan/buat" className="mt-6">
                                    <Button variant="outline" className="border-[#0B3B24] text-[#0B3B24] hover:bg-[#0B3B24] hover:text-white rounded-lg">
                                        Buat Laporan Pertama
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {laporan.map((item) => (
                                    <Link
                                        key={item.id_laporan}
                                        href={`/user/laporan/${item.id_laporan}`}
                                        className="block group"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-green-100">
                                            
                                            {/* Foto */}
                                            {item.foto ? (
                                                <img
                                                    src={`/storage/${item.foto}`}
                                                    alt="Foto laporan"
                                                    className="h-40 sm:h-32 w-full sm:w-40 flex-shrink-0 rounded-xl object-cover border border-gray-100"
                                                />
                                            ) : (
                                                <div className="flex h-40 sm:h-32 w-full sm:w-40 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-3xl">
                                                    🗑️
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex flex-1 flex-col py-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusConfig[item.status].color}`}>
                                                        {statusConfig[item.status].label}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {formatDistanceToNow(new Date(item.tanggal_laporan), { addSuffix: true, locale: id })}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-lg font-bold text-[#0B3B24] mb-2 line-clamp-1 group-hover:text-green-700 transition-colors">
                                                    {item.alamat || 'Laporan Titik Sampah'}
                                                </h3>
                                                
                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                    {item.deskripsi}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Help & Footer Info */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Butuh Bantuan Card */}
                        <div className="rounded-2xl bg-[#E6F0FA] p-6 shadow-sm border border-blue-100">
                            <div className="flex items-center gap-2 mb-5">
                                <HelpCircle className="h-5 w-5 text-[#1E3A8A]" />
                                <h3 className="text-lg font-bold text-[#1E3A8A]">Butuh Bantuan?</h3>
                            </div>
                            
                            <ul className="space-y-4">
                                <li>
                                    <Link href="#" className="flex items-start gap-3 text-sm text-[#1E3A8A]/80 hover:text-[#1E3A8A] transition-colors group">
                                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span className="group-hover:underline">Panduan cara melapor yang efektif</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="flex items-start gap-3 text-sm text-[#1E3A8A]/80 hover:text-[#1E3A8A] transition-colors group">
                                        <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span className="group-hover:underline">Hubungi Hotline Dinas Lingkungan Hidup</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="flex items-start gap-3 text-sm text-[#1E3A8A]/80 hover:text-[#1E3A8A] transition-colors group">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span className="group-hover:underline">Lihat lokasi TPS Resmi terdekat</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="mx-auto max-w-6xl px-6 md:px-12 mt-24 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h4 className="font-bold text-[#0B3B24] mb-1">Civic Ecology Palu</h4>
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Pemerintah Kota Palu - Dinas Lingkungan Hidup. Digital Arboretum Initiative.
                    </p>
                </div>
                <div className="flex gap-6 text-sm text-gray-500 font-medium">
                    <Link href="#" className="hover:text-[#0B3B24]">Kebijakan Privasi</Link>
                    <Link href="#" className="hover:text-[#0B3B24]">Kontak Darurat</Link>
                    <Link href="#" className="hover:text-[#0B3B24]">Pusat Bantuan</Link>
                </div>
            </footer>
        </div>
    );
}

// Set layout to undefined to bypass UserAppLayout and use our custom full-page design
LaporanIndex.layout = undefined;