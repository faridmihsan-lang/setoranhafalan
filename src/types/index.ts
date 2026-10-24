export type UserRole = 
  | 'super_admin' 
  | 'admin_lembaga' 
  | 'ustaz' 
  | 'wali' 
  | 'santri';

export type InstitutionStatus = 'pending' | 'active' | 'rejected' | 'suspended';

export interface Lembaga {
  id: string;
  nama: string;
  slug?: string;
  jenis: 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
  alamat: string;
  kota: string;
  provinsi: string;
  nomorTelepon: string;
  email: string;
  status: InstitutionStatus;
  statusLangganan?: 'aktif' | 'percobaan' | 'kedaluwarsa' | 'menunggu_verifikasi';
  totalSantri: number;
  totalUstaz: number;
  logoUrl?: string;
  adminName?: string;
  adminEmail?: string;
  tanggalBergabung: string;
  metodeHafalan: 'Utsmani' | 'Indo-Pak' | 'Sabaq-Sabqi-Manzil' | 'Talaqqi Kemenag';
}

export interface InstitutionApplication {
  id: string;
  namaLembaga: string;
  jenisLembaga: 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
  namaPimpinan: string;
  email: string;
  telepon: string;
  alamat: string;
  kota: string;
  provinsi: string;
  namaAdmin?: string;
  emailAdmin?: string;
  metodeHafalan: string;
  estimasiSantri: string;
  status: 'pending' | 'approved' | 'rejected';
  catatanReview?: string;
  tanggalPengajuan: string;
  approvedInstitutionId?: string;
}

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  role: UserRole;
  avatarUrl?: string;
  lembagaId?: string;
  lembagaNama?: string;
  alamat?: string;
  tanggalLahir?: string;
  jenisKelamin?: 'L' | 'P';
  // Role-specific references
  santriId?: string; // For santri role
  anakIds?: string[]; // For wali role
  halaqahIds?: string[]; // For ustaz role
}

export type JenisSetoran = 'ziyadah' | 'murajaah' | 'tasmi';
export type PredikatSetoran = 'A (Mumtaz)' | 'B (Jayyid Jiddan)' | 'C (Jayyid)' | 'D (Maqbul)' | 'Ulang (Rasib)';

export interface SetoranHafalan {
  id: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  ustazId: string;
  ustazNama: string;
  lembagaId: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm
  jenis: JenisSetoran;
  juz: number;
  surahMulai: string;
  ayatMulai: number;
  surahSelesai: string;
  ayatSelesai: number;
  halamanMulai?: number;
  halamanSelesai?: number;
  totalHalaman: number;
  predikat: PredikatSetoran;
  skorKelancaran: number; // 0-100
  skorTajwid: number;     // 0-100
  skorMakhraj: number;    // 0-100
  catatan?: string;
  statusVerifikasi: 'diverifikasi' | 'menunggu' | 'revisi';
}

export interface Santri {
  id: string;
  nis: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  lembagaId: string;
  lembagaNama: string;
  halaqahId: string;
  halaqahNama: string;
  ustazId: string;
  ustazNama: string;
  waliNama: string;
  waliTelepon: string;
  totalJuzHafal: number; // e.g. 14.5
  totalHalamanHafal: number;
  targetJuz: number; // e.g. 30
  statusHafalan: 'Aktif' | 'Izin' | 'Mutqin' | 'Perlu Perhatian';
  juzMutqin: number[]; // e.g. [1, 2, 3, 29, 30]
  terakhirSetor: string;
  fotoUrl?: string;
}

export interface Halaqah {
  id: string;
  nama: string;
  lembagaId: string;
  ustazId: string;
  ustazNama: string;
  tingkat: 'Pemula' | 'Menengah' | 'Takhassus 30 Juz' | 'Mutqin';
  targetSemester: string;
  jumlahSantri: number;
  jadwal: string; // e.g. "Ba'da Subuh & Ba'da Ashar"
  ruangan?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
  roles: UserRole[];
}
