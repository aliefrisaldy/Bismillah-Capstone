import { Bell, BellRing, MapPin, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LaporanSummary } from '@/types/global';

const STORAGE_KEY = 'pakagasa_read_notifs';

const statusLabels: Record<string, string> = {
    diverifikasi: 'Diverifikasi',
    diproses: 'Diproses',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
};

const statusDots: Record<string, string> = {
    menunggu: 'bg-amber-400',
    diverifikasi: 'bg-blue-400',
    diproses: 'bg-orange-400',
    selesai: 'bg-emerald-400',
    ditolak: 'bg-red-400',
};

function notifKey(l: LaporanSummary): string {
    return `${l.id_laporan}:${l.status}`;
}

function getReadSet(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
}

function saveReadSet(ids: Set<string>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function markRead(l: LaporanSummary): void {
    const set = getReadSet();
    set.add(notifKey(l));
    saveReadSet(set);
}

export default function NotificationDropdown({
    laporanList,
}: {
    laporanList: LaporanSummary[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
    const [ready, setReady] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setReadKeys(getReadSet());
        setReady(true);
    }, []);

    const sorted = useMemo(
        () =>
            [...laporanList].sort(
                (a, b) =>
                    new Date(b.tanggal_diperbarui).getTime() -
                    new Date(a.tanggal_diperbarui).getTime(),
            ),
        [laporanList],
    );

    const unread = useMemo(
        () =>
            sorted.filter(
                (l) =>
                    !readKeys.has(notifKey(l)) &&
                    (l.status === 'diverifikasi' || l.status === 'diproses' || l.status === 'selesai' || l.status === 'ditolak'),
            ),
        [sorted, readKeys],
    );

    const handleClick = useCallback((l: LaporanSummary) => {
        markRead(l);
        setReadKeys(getReadSet());
    }, []);

    const handleMouseEnter = useCallback(() => {
        if (timeoutRef.current) {
clearTimeout(timeoutRef.current);
}

        setIsOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 400);
    }, []);

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                className="relative flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground backdrop-blur transition-colors hover:bg-accent"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifikasi"
            >
                {ready && unread.length > 0 ? (
                    <>
                        <BellRing className="h-5 w-5 text-emerald-600" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                            {unread.length > 9 ? '9+' : unread.length}
                        </span>
                    </>
                ) : (
                    <Bell className="h-5 w-5" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 z-40 mt-3 w-80 origin-top-right rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
                        <div className="border-b border-border px-5 py-3">
                            <p className="text-sm font-bold text-foreground">Notifikasi Laporan</p>
                            <p className="text-xs text-muted-foreground">
                                {unread.length > 0
                                    ? `${unread.length} belum dibaca`
                                    : 'Tidak ada notifikasi baru'}
                            </p>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {unread.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 px-5 py-10">
                                    <Bell className="h-8 w-8 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        Semua notifikasi sudah dibaca
                                    </p>
                                </div>
                            ) : (
                                unread.map((l) => (
                                    <a
                                        key={notifKey(l)}
                                        href={`/user/laporan/${l.id_laporan}`}
                                        onClick={() => handleClick(l)}
                                        className="flex items-start gap-3 border-b border-border/50 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/50"
                                    >
                                        <span
                                            className={`mt-1 size-2 shrink-0 rounded-full ${statusDots[l.status] || 'bg-muted-foreground'}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                Laporan {statusLabels[l.status] || l.status}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {l.alamat || 'Tanpa alamat'}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                                                <RotateCw className="size-3" />
                                                <span>
                                                    {new Date(l.tanggal_diperbarui).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                <MapPin className="ml-0.5 size-3" />
                                            </div>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
