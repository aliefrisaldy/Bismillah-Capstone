export const HARI_LIST = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' },
] as const;

export type HariValue = (typeof HARI_LIST)[number]['value'];

export type JadwalItem = {
    hari: HariValue;
    jam_mulai: string;
    jam_selesai: string;
};

const hariLabelMap = Object.fromEntries(
    HARI_LIST.map((h) => [h.value, h.label]),
) as Record<HariValue, string>;

const hariOrder = HARI_LIST.map((h) => h.value);

export function isHariValue(value: string): value is HariValue {
    return hariOrder.includes(value as HariValue);
}

export function normalizeJadwal(raw: unknown): JadwalItem[] {
    if (!Array.isArray(raw)) return [];

    const items: JadwalItem[] = [];

    for (const entry of raw) {
        if (!entry || typeof entry !== 'object') continue;
        const row = entry as Record<string, unknown>;
        const hari = String(row.hari ?? '');
        if (!isHariValue(hari)) continue;

        const jam_mulai = String(row.jam_mulai ?? '').slice(0, 5);
        const jam_selesai = String(row.jam_selesai ?? '').slice(0, 5);
        if (!jam_mulai || !jam_selesai) continue;

        items.push({ hari, jam_mulai, jam_selesai });
    }

    return items.sort(
        (a, b) => hariOrder.indexOf(a.hari) - hariOrder.indexOf(b.hari),
    );
}

export function formatJadwalLabel(jadwal: JadwalItem[] | null | undefined): string {
    const list = normalizeJadwal(jadwal);
    if (!list.length) return 'Belum dijadwalkan';

    return list
        .map(
            (j) =>
                `${hariLabelMap[j.hari]} ${j.jam_mulai}–${j.jam_selesai}`,
        )
        .join(' · ');
}

export function getHariLabel(hari: HariValue): string {
    return hariLabelMap[hari];
}
