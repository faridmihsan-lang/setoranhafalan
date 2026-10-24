import { UserRole } from '../types';

export const ROLE_DETAILS: Record<UserRole, { label: string; description: string; tag: string }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Pengelola platform global, seluruh lembaga & langganan',
    tag: 'Sistem Global'
  },
  admin_lembaga: {
    label: 'Admin Lembaga',
    description: 'Pengelola pondok pesantren, madrasah atau rumah tahfiz',
    tag: 'Manajemen Lembaga'
  },
  ustaz: {
    label: 'Ustaz / Pengampu',
    description: 'Penyimak setoran hafalan, evaluasi tajwid & mutqin santri',
    tag: 'Akademik & Halaqah'
  },
  wali: {
    label: 'Orang Tua / Wali',
    description: 'Pemantau perkembangan hafalan harian dan grafik target anak',
    tag: 'Akses Keluarga'
  },
  santri: {
    label: 'Santri / Mahasantri',
    description: 'Portal target hafalan pribadi, murajaah mandiri, dan capaian juz',
    tag: 'Portal Pembelajar'
  }
};

export interface QuranSurah {
  number: number;
  name: string;
  arabic: string;
  ayatCount: number;
  juz: number;
}

export const SURAH_LIST: QuranSurah[] = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', ayatCount: 7, juz: 1 },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', ayatCount: 286, juz: 1 },
  { number: 3, name: 'Ali Imran', arabic: 'آل عمران', ayatCount: 200, juz: 3 },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', ayatCount: 176, juz: 4 },
  { number: 5, name: 'Al-Maidah', arabic: 'المائدة', ayatCount: 120, juz: 6 },
  { number: 6, name: 'Al-Anam', arabic: 'الأنعام', ayatCount: 165, juz: 7 },
  { number: 7, name: 'Al-Araf', arabic: 'الأعراف', ayatCount: 206, juz: 8 },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', ayatCount: 75, juz: 9 },
  { number: 9, name: 'At-Taubah', arabic: 'التوبة', ayatCount: 129, juz: 10 },
  { number: 10, name: 'Yunus', arabic: 'يونس', ayatCount: 109, juz: 11 },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', ayatCount: 110, juz: 15 },
  { number: 36, name: 'Yasin', arabic: 'يس', ayatCount: 83, juz: 22 },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', ayatCount: 78, juz: 27 },
  { number: 56, name: 'Al-Waqiah', arabic: 'الواقعة', ayatCount: 96, juz: 27 },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', ayatCount: 30, juz: 29 },
  { number: 78, name: 'An-Naba', arabic: 'النبأ', ayatCount: 40, juz: 30 },
  { number: 79, name: 'An-Naziat', arabic: 'النازعات', ayatCount: 46, juz: 30 },
  { number: 80, name: 'Abasa', arabic: 'عبس', ayatCount: 42, juz: 30 },
  { number: 87, name: 'Al-Ala', arabic: 'الأعلى', ayatCount: 19, juz: 30 },
  { number: 93, name: 'Ad-Duha', arabic: 'الضحى', ayatCount: 11, juz: 30 },
  { number: 94, name: 'Al-Insyirah', arabic: 'الشرح', ayatCount: 8, juz: 30 },
  { number: 95, name: 'At-Tin', arabic: 'التين', ayatCount: 8, juz: 30 },
  { number: 96, name: 'Al-Alaq', arabic: 'العلق', ayatCount: 19, juz: 30 },
  { number: 97, name: 'Al-Qadr', arabic: 'القدر', ayatCount: 5, juz: 30 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', ayatCount: 4, juz: 30 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', ayatCount: 5, juz: 30 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', ayatCount: 6, juz: 30 }
];

export const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

export const JENIS_LEMBAGA_OPTIONS = [
  { value: 'pesantren', label: 'Pondok Pesantren Tahfiz' },
  { value: 'rumah_tahfiz', label: 'Rumah Tahfiz Qur\'an (RTQ)' },
  { value: 'sekolah_islam', label: 'Sekolah Islam Terpadu (SDIT/SMPIT/SMAIT)' },
  { value: 'madrasah', label: 'Madrasah (MI / MTs / MA)' },
  { value: 'halaqah', label: 'Halaqah Masjid / Majelis Taklim' }
];

export const METODE_HAFALAN_OPTIONS = [
  { value: 'Sabaq-Sabqi-Manzil', label: 'Sabaq, Sabqi & Manzil (Klasik Pesantren)' },
  { value: 'Utsmani', label: 'Metode Rasm Utsmani Madinah' },
  { value: 'Talaqqi Kemenag', label: 'Talaqqi & Musyafahah Standar Kemenag' },
  { value: 'Indo-Pak', label: 'Mushaf Standar Indonesia' }
];
