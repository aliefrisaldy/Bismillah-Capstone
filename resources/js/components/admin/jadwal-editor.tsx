import { Label } from '@/components/ui/label';
import {
    HARI_LIST,
    type HariValue,
    type JadwalItem,
} from '@/lib/jalur-schedule';
import { Clock } from 'lucide-react';

type Props = {
    value: JadwalItem[];
    onChange: (jadwal: JadwalItem[]) => void;
    errors?: Record<string, string>;
};

const DEFAULT_MULAI = '08:00';
const DEFAULT_SELESAI = '17:00';

export function JadwalEditor({ value, onChange, errors }: Props) {
    const activeHari = new Set(value.map((j) => j.hari));

    const toggleHari = (hari: HariValue) => {
        if (activeHari.has(hari)) {
            onChange(value.filter((j) => j.hari !== hari));
            return;
        }
        onChange([
            ...value,
            {
                hari,
                jam_mulai: DEFAULT_MULAI,
                jam_selesai: DEFAULT_SELESAI,
            },
        ]);
    };

    const updateSlot = (
        hari: HariValue,
        field: 'jam_mulai' | 'jam_selesai',
        jam: string,
    ) => {
        onChange(
            value.map((j) =>
                j.hari === hari ? { ...j, [field]: jam } : j,
            ),
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-semibold">
                    Hari Operasional
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Pilih hari rute beroperasi, lalu tentukan jam mulai dan
                    selesai untuk setiap hari.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {HARI_LIST.map((hari) => {
                    const active = activeHari.has(hari.value);
                    return (
                        <button
                            key={hari.value}
                            type="button"
                            onClick={() => toggleHari(hari.value)}
                            className={[
                                'rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                                active
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                    : 'border-border bg-background text-muted-foreground hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20',
                            ].join(' ')}
                        >
                            {hari.label}
                        </button>
                    );
                })}
            </div>

            {errors?.jadwal && (
                <p className="text-sm text-red-600">{errors.jadwal}</p>
            )}

            {value.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                    <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Belum ada hari dipilih
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                        Klik salah satu hari di atas untuk mengatur jadwal.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {HARI_LIST.filter((h) => activeHari.has(h.value)).map(
                        (hari) => {
                            const slot = value.find(
                                (j) => j.hari === hari.value,
                            );
                            if (!slot) return null;

                            const idx = value.findIndex(
                                (j) => j.hari === hari.value,
                            );
                            const errMulai =
                                errors?.[`jadwal.${idx}.jam_mulai`];
                            const errSelesai =
                                errors?.[`jadwal.${idx}.jam_selesai`];

                            return (
                                <div
                                    key={hari.value}
                                    className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-[100px]">
                                        <p className="text-sm font-bold text-foreground">
                                            {hari.label}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Jam operasional
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-end gap-3">
                                        <div>
                                            <Label className="mb-1 block text-[11px] text-muted-foreground">
                                                Jam mulai
                                            </Label>
                                            <input
                                                type="time"
                                                value={slot.jam_mulai}
                                                onChange={(e) =>
                                                    updateSlot(
                                                        hari.value,
                                                        'jam_mulai',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
                                            />
                                            {errMulai && (
                                                <p className="mt-1 text-[11px] text-red-600">
                                                    {errMulai}
                                                </p>
                                            )}
                                        </div>
                                        <span className="pb-2 text-sm text-muted-foreground">
                                            s/d
                                        </span>
                                        <div>
                                            <Label className="mb-1 block text-[11px] text-muted-foreground">
                                                Jam selesai
                                            </Label>
                                            <input
                                                type="time"
                                                value={slot.jam_selesai}
                                                onChange={(e) =>
                                                    updateSlot(
                                                        hari.value,
                                                        'jam_selesai',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
                                            />
                                            {errSelesai && (
                                                <p className="mt-1 text-[11px] text-red-600">
                                                    {errSelesai}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            )}
        </div>
    );
}
