import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { MOCK_SANTRI_LIST, MOCK_HALAQAH_LIST } from '../../lib/mockData';
import { Santri, Halaqah, Lembaga } from '../../types';
import { getStatusSantriStyle } from '../../lib/utils';
import { InstitutionService } from '../../services/institutionService';
import { JENIS_LEMBAGA_OPTIONS, METODE_HAFALAN_OPTIONS } from '../../lib/constants';
import {
  Users,
  Award,
  GraduationCap,
  BookOpenCheck,
  Plus,
  BookMarked,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
  Ban,
  ShieldCheck,
  Settings,
  Mail,
  MapPin
} from 'lucide-react';

export function AdminLembagaDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  const { activeLembaga, currentUser } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const isSuspended = activeLembaga?.status === 'suspended';

  // State
  const [currentViewTab, setCurrentViewTab] = useState<'overview' | 'santri' | 'profil'>(
    activeTab === 'profil_lembaga' ? 'profil' : activeTab === 'santri' ? 'santri' : 'overview'
  );

  const [santriList, setSantriList] = useState<Santri[]>(MOCK_SANTRI_LIST);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddSantriModal, setShowAddSantriModal] = useState(false);

  // Institution Profile Form State
  const [profileForm, setProfileForm] = useState({
    nama: activeLembaga?.nama || 'Pondok Pesantren Telaga Al-Kautsar',
    jenis: activeLembaga?.jenis || 'pesantren',
    logoUrl: activeLembaga?.logoUrl || '',
    alamat: activeLembaga?.alamat || 'Jl. Pesantren No. 45, Cisarua',
    kota: activeLembaga?.kota || 'Kabupaten Bogor',
    provinsi: activeLembaga?.provinsi || 'Jawa Barat',
    nomorTelepon: activeLembaga?.nomorTelepon || '0812-3456-7890',
    email: activeLembaga?.email || 'ponpestelagaalkautsar@gmail.com',
    metodeHafalan: activeLembaga?.metodeHafalan || 'Sabaq-Sabqi-Manzil',
    passingTajwid: 75,
    passingKelancaran: 80,
    passingMakhraj: 75,
    notifWA: true
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Santri Form
  const [newSantri, setNewSantri] = useState({
    nis: '',
    nama: '',
    jenisKelamin: 'L' as 'L' | 'P',
    halaqahId: 'hlq-001',
    waliNama: '',
    waliTelepon: '',
    targetJuz: 30
  });

  useEffect(() => {
    if (activeTab === 'profil_lembaga') setCurrentViewTab('profil');
    else if (activeTab === 'santri') setCurrentViewTab('santri');
    else if (activeTab === 'overview') setCurrentViewTab('overview');
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      showWarning('Lembaga Ditangguhkan', 'Perubahan pengaturan dinonaktifkan selama masa penangguhan.');
      return;
    }

    setIsSavingProfile(true);
    const res = await InstitutionService.updateInstitutionProfile(
      activeLembaga?.id || 'lem-001',
      {
        nama: profileForm.nama,
        jenis: profileForm.jenis as any,
        alamat: profileForm.alamat,
        kota: profileForm.kota,
        provinsi: profileForm.provinsi,
        nomorTelepon: profileForm.nomorTelepon,
        email: profileForm.email,
        metodeHafalan: profileForm.metodeHafalan as any,
        logoUrl: profileForm.logoUrl
      },
      currentUser?.nama
    );
    setIsSavingProfile(false);

    if (res.success) {
      showSuccess('Profil Lembaga Disimpan', 'Identitas dan pengaturan kurikulum lembaga berhasil diperbarui.');
    } else {
      showError('Gagal Menyimpan Profil', res.error);
    }
  };

  const handleAddSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      showWarning('Operasi Ditolak', 'Lembaga yang ditangguhkan tidak dapat menambah santri baru.');
      return;
    }

    if (!newSantri.nis || !newSantri.nama || !newSantri.waliNama) {
      showError('Gagal Menyimpan', 'Harap isi NIS, Nama Santri, dan Nama Wali.');
      return;
    }

    const halaqah = MOCK_HALAQAH_LIST.find((h) => h.id === newSantri.halaqahId);

    const created: Santri = {
      id: `san-${Date.now()}`,
      nis: newSantri.nis,
      nama: newSantri.nama,
      jenisKelamin: newSantri.jenisKelamin,
      lembagaId: activeLembaga?.id || 'lem-001',
      lembagaNama: activeLembaga?.nama || 'Pesantren',
      halaqahId: newSantri.halaqahId,
      halaqahNama: halaqah?.nama || 'Halaqah Ali bin Abi Thalib',
      ustazId: halaqah?.ustazId || 'usr-u-01',
      ustazNama: halaqah?.ustazNama || 'Ustaz Pengampu',
      waliNama: newSantri.waliNama,
      waliTelepon: newSantri.waliTelepon || '0812-0000-0000',
      totalJuzHafal: 0,
      totalHalamanHafal: 0,
      targetJuz: Number(newSantri.targetJuz) || 30,
      statusHafalan: 'Aktif',
      juzMutqin: [],
      terakhirSetor: new Date().toISOString().split('T')[0]
    };

    setSantriList([created, ...santriList]);
    showSuccess('Santri Berhasil Ditambahkan', `${created.nama} telah didaftarkan ke ${created.halaqahNama}.`);
    setShowAddSantriModal(false);
    setNewSantri({
      nis: '',
      nama: '',
      jenisKelamin: 'L',
      halaqahId: 'hlq-001',
      waliNama: '',
      waliTelepon: '',
      targetJuz: 30
    });
  };

  const filteredSantri = santriList.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.statusHafalan === filterStatus;
  });

  const santriColumns: Column<Santri>[] = [
    {
      key: 'nama',
      header: 'Santri & NIS',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.nama}</p>
          <p className="text-[11px] text-slate-500 font-mono">NIS: {row.nis}</p>
        </div>
      )
    },
    {
      key: 'halaqahNama',
      header: 'Halaqah / Pengampu',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.halaqahNama}</p>
          <p className="text-[11px] text-slate-500">{row.ustazNama}</p>
        </div>
      )
    },
    {
      key: 'totalJuzHafal',
      header: 'Capaian Juz',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-slate-900 text-sm">{row.totalJuzHafal}</span>
          <span className="text-slate-400 text-xs"> / {row.targetJuz} Juz</span>
          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
            <div
              className="bg-blue-900 h-1.5 rounded-full"
              style={{ width: `${Math.min((row.totalJuzHafal / row.targetJuz) * 100, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'juzMutqin',
      header: 'Juz Mutqin',
      render: (row) => (
        <div className="flex items-center gap-1 flex-wrap">
          {row.juzMutqin.length > 0 ? (
            row.juzMutqin.slice(0, 5).map((j) => (
              <span
                key={j}
                className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 rounded"
              >
                Juz {j}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-[11px]">Belum diuji</span>
          )}
          {row.juzMutqin.length > 5 && (
            <span className="text-[10px] text-slate-500 font-medium">+{row.juzMutqin.length - 5}</span>
          )}
        </div>
      )
    },
    {
      key: 'statusHafalan',
      header: 'Status',
      align: 'center',
      render: (row) => {
        const style = getStatusSantriStyle(row.statusHafalan);
        return (
          <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${style.bg}`}>
            {style.text}
          </span>
        );
      }
    },
    {
      key: 'waliNama',
      header: 'Wali Santri',
      render: (row) => (
        <div>
          <p className="text-slate-700">{row.waliNama}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.waliTelepon}</p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Suspended Warning Banner */}
      {isSuspended && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 animate-in fade-in">
          <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Akses Operasional Lembaga Ditangguhkan (Suspended)
            </h3>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              Lembaga ini saat ini dibekukan sementara oleh Super Admin. Seluruh data historis santri dan rekam hafalan tetap aman tersimpan, namun pendaftaran santri baru dan input setoran tidak dapat diproses hingga lembaga diaktifkan kembali.
            </p>
          </div>
        </div>
      )}

      {/* Institution Header Strip */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold mb-1">
            <Building2 className="w-4 h-4" />
            <span>{activeLembaga?.nama || 'Pondok Pesantren Telaga Al-Kautsar'}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                isSuspended
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isSuspended ? 'DITANGGUHKAN' : 'STATUS AKTIF'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard Manajemen Tahfiz</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metode: {activeLembaga?.metodeHafalan || 'Sabaq-Sabqi-Manzil'} · {activeLembaga?.kota || 'Bogor'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentViewTab(currentViewTab === 'profil' ? 'overview' : 'profil')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              currentViewTab === 'profil'
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{currentViewTab === 'profil' ? 'Tutup Profil' : 'Kelola Profil Lembaga'}</span>
          </button>

          <button
            type="button"
            disabled={isSuspended}
            onClick={() => setShowAddSantriModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={isSuspended ? 'Tidak dapat menambah santri saat lembaga ditangguhkan' : 'Tambah Santri'}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri Baru</span>
          </button>
        </div>
      </div>

      {/* Profil & Pengaturan Lembaga View */}
      {currentViewTab === 'profil' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-900" />
                <span>Profil & Pengaturan Dasar Lembaga</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola identitas, alamat, kontak resmi, dan standar kurikulum tahfiz lembaga Anda.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Akses: Administrator Lembaga
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* 1. Identitas & Logo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Resmi Lembaga / Yayasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.nama}
                    onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Lembaga
                    </label>
                    <select
                      value={profileForm.jenis}
                      onChange={(e) => setProfileForm({ ...profileForm, jenis: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    >
                      {JENIS_LEMBAGA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Lembaga di Sistem
                    </label>
                    <div className="flex items-center h-10 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                      {isSuspended ? (
                        <span className="text-rose-700 flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5" /> Ditangguhkan oleh Super Admin
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif & Terverifikasi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-xl bg-blue-950 text-amber-400 flex items-center justify-center text-2xl font-bold mb-2 shadow-sm border border-blue-900">
                  {profileForm.nama.charAt(0)}
                </div>
                <p className="text-xs font-bold text-slate-800">Logo / Emblem</p>
                <input
                  type="text"
                  value={profileForm.logoUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                  placeholder="URL logo (opsional)"
                  className="mt-2 w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded text-center"
                />
              </div>
            </div>

            {/* 2. Lokasi & Kontak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.kota}
                  onChange={(e) => setProfileForm({ ...profileForm, kota: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.provinsi}
                  onChange={(e) => setProfileForm({ ...profileForm, provinsi: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={profileForm.alamat}
                  onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / Hotline
                </label>
                <input
                  type="tel"
                  value={profileForm.nomorTelepon}
                  onChange={(e) => setProfileForm({ ...profileForm, nomorTelepon: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* 3. Pengaturan Dasar Kurikulum */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pengaturan Kurikulum & Standar Kelulusan Mutqin
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Metode Hafalan
                  </label>
                  <select
                    value={profileForm.metodeHafalan}
                    onChange={(e) => setProfileForm({ ...profileForm, metodeHafalan: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {METODE_HAFALAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nilai Minimal Tajwid (0-100)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={profileForm.passingTajwid}
                    onChange={(e) => setProfileForm({ ...profileForm, passingTajwid: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nilai Minimal Kelancaran (0-100)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    value={profileForm.passingKelancaran}
                    onChange={(e) => setProfileForm({ ...profileForm, passingKelancaran: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentViewTab('overview')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Kembali ke Dashboard
              </button>
              <button
                type="submit"
                disabled={isSavingProfile || isSuspended}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Santri Terdaftar"
              value={santriList.length + 315}
              subtitle="Aktif di seluruh halaqah"
              trend={{ value: '100% kuota aktif', isPositive: true }}
              icon={Users}
            />
            <StatCard
              title="Santri Status Mutqin"
              value={142}
              subtitle="Tuntas ujian tasmi juz"
              badge="Kategori A"
              icon={Award}
            />
            <StatCard
              title="Halaqah Aktif"
              value={MOCK_HALAQAH_LIST.length}
              subtitle="18 Ustaz pengampu"
              icon={GraduationCap}
            />
            <StatCard
              title="Setoran Hari Ini"
              value={84}
              subtitle="Ba'da Subuh & Ashar"
              trend={{ value: '+12 dari kemarin', isPositive: true }}
              icon={BookOpenCheck}
            />
          </div>

          {/* Halaqah Quick Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Daftar Halaqah Utama</h3>
              <span className="text-xs text-slate-500">{MOCK_HALAQAH_LIST.length} Kelompok Belajar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_HALAQAH_LIST.map((h) => (
                <div key={h.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{h.nama}</h4>
                      <p className="text-[11px] text-blue-900 font-medium mt-0.5">{h.ustazNama}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {h.tingkat}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{h.jumlahSantri} Santri Terdaftar</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{h.jadwal}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Santri Data Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Data Perkembangan Santri</h3>
                <p className="text-xs text-slate-500">Pantau capaian hafalan, mutqin, dan kontak wali santri.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg self-start sm:self-auto">
                {['all', 'Mutqin', 'Aktif', 'Perlu Perhatian'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      filterStatus === status
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : status}
                  </button>
                ))}
              </div>
            </div>

            <DataTable
              columns={santriColumns}
              data={filteredSantri}
              searchPlaceholder="Cari nama santri, NIS, halaqah, atau wali..."
              searchableKey={(item) => `${item.nama} ${item.nis} ${item.halaqahNama} ${item.waliNama}`}
            />
          </div>
        </>
      )}

      {/* Modal Tambah Santri Baru */}
      <Modal
        isOpen={showAddSantriModal}
        onClose={() => setShowAddSantriModal(false)}
        title="Pendaftaran Santri Baru"
        subtitle="Masukkan identitas santri dan tentukan halaqah pembimbing."
        maxWidth="md"
      >
        <form onSubmit={handleAddSantri} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Santri (NIS) *
              </label>
              <input
                type="text"
                required
                value={newSantri.nis}
                onChange={(e) => setNewSantri({ ...newSantri, nis: e.target.value })}
                placeholder="2026-0089"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={newSantri.jenisKelamin}
                onChange={(e) => setNewSantri({ ...newSantri, jenisKelamin: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                <option value="L">Ikhwan (Laki-laki)</option>
                <option value="P">Akhwat (Perempuan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Santri *
            </label>
            <input
              type="text"
              required
              value={newSantri.nama}
              onChange={(e) => setNewSantri({ ...newSantri, nama: e.target.value })}
              placeholder="Contoh: Muhammad Ihsan Kamil"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilihan Halaqah
              </label>
              <select
                value={newSantri.halaqahId}
                onChange={(e) => setNewSantri({ ...newSantri, halaqahId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                {MOCK_HALAQAH_LIST.map((h) => (
                  <option key={h.id} value={h.id}>{h.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Hafalan (Juz)
              </label>
              <select
                value={newSantri.targetJuz}
                onChange={(e) => setNewSantri({ ...newSantri, targetJuz: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                <option value={5}>5 Juz</option>
                <option value={10}>10 Juz</option>
                <option value={15}>15 Juz</option>
                <option value={30}>30 Juz (Takhassus)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Orang Tua / Wali *
              </label>
              <input
                type="text"
                required
                value={newSantri.waliNama}
                onChange={(e) => setNewSantri({ ...newSantri, waliNama: e.target.value })}
                placeholder="Bpk. Rahmat Subagyo"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon Wali (WA)
              </label>
              <input
                type="tel"
                value={newSantri.waliTelepon}
                onChange={(e) => setNewSantri({ ...newSantri, waliTelepon: e.target.value })}
                placeholder="0812-3344-5566"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddSantriModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-xs"
            >
              Simpan Santri
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
