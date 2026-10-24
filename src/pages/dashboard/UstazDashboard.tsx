import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { MOCK_SETORAN_LIST, MOCK_SANTRI_LIST } from '../../lib/mockData';
import { SURAH_LIST } from '../../lib/constants';
import { SetoranHafalan, JenisSetoran, PredikatSetoran, Santri } from '../../types';
import { formatDateTime, getPredikatBadgeStyle } from '../../lib/utils';
import {
  BookOpenCheck,
  Award,
  Users,
  CheckCircle2,
  Plus,
  BookMarked,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';

export function UstazDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  const { currentUser, activeLembaga } = useAuth();
  const { showSuccess, showError } = useToast();

  const [setoranList, setSetoranList] = useState<SetoranHafalan[]>(MOCK_SETORAN_LIST);
  const [showInputModal, setShowInputModal] = useState(false);
  const [filterJenis, setFilterJenis] = useState<string>('all');

  // Input Setoran Form State
  const [inputForm, setInputForm] = useState({
    santriId: 'san-001',
    jenis: 'ziyadah' as JenisSetoran,
    juz: 15,
    surahMulai: 'Al-Isra',
    ayatMulai: 1,
    surahSelesai: 'Al-Isra',
    ayatSelesai: 22,
    totalHalaman: 1.0,
    predikat: 'A (Mumtaz)' as PredikatSetoran,
    skorKelancaran: 92,
    skorTajwid: 90,
    skorMakhraj: 90,
    catatan: ''
  });

  const handleOpenInputForSantri = (santri: Santri) => {
    setInputForm((prev) => ({
      ...prev,
      santriId: santri.id
    }));
    setShowInputModal(true);
  };

  const handleSaveSetoran = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = MOCK_SANTRI_LIST.find((s) => s.id === inputForm.santriId);
    if (!targetSantri) {
      showError('Santri Tidak Ditemukan', 'Pilih santri terlebih dahulu.');
      return;
    }

    const newRecord: SetoranHafalan = {
      id: `set-${Date.now()}`,
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriNis: targetSantri.nis,
      ustazId: currentUser?.id || 'usr-u-01',
      ustazNama: currentUser?.nama || 'Ustaz Muhammad Ridwan, Al-Hafiz',
      lembagaId: activeLembaga?.id || 'lem-001',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: new Date().toTimeString().slice(0, 5),
      jenis: inputForm.jenis,
      juz: Number(inputForm.juz),
      surahMulai: inputForm.surahMulai,
      ayatMulai: Number(inputForm.ayatMulai),
      surahSelesai: inputForm.surahSelesai,
      ayatSelesai: Number(inputForm.ayatSelesai),
      totalHalaman: Number(inputForm.totalHalaman) || 1.0,
      predikat: inputForm.predikat,
      skorKelancaran: Number(inputForm.skorKelancaran),
      skorTajwid: Number(inputForm.skorTajwid),
      skorMakhraj: Number(inputForm.skorMakhraj),
      catatan: inputForm.catatan || 'Setoran diterima dengan baik.',
      statusVerifikasi: 'diverifikasi'
    };

    setSetoranList([newRecord, ...setoranList]);
    showSuccess(
      'Setoran Berhasil Dicatat',
      `Setoran ${inputForm.jenis.toUpperCase()} ${targetSantri.nama} (Juz ${inputForm.juz}) telah tersimpan.`
    );
    setShowInputModal(false);

    // Reset default notes
    setInputForm((prev) => ({
      ...prev,
      catatan: '',
      ayatMulai: inputForm.ayatSelesai + 1,
      ayatSelesai: inputForm.ayatSelesai + 20
    }));
  };

  const filteredSetoran = setoranList.filter((s) => {
    if (filterJenis === 'all') return true;
    return s.jenis === filterJenis;
  });

  const columns: Column<SetoranHafalan>[] = [
    {
      key: 'santriNama',
      header: 'Santri & Waktu',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.santriNama}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {row.tanggal} · {row.waktu} WIB
          </p>
        </div>
      )
    },
    {
      key: 'jenis',
      header: 'Jenis',
      render: (row) => {
        const labels: Record<string, { text: string; cls: string }> = {
          ziyadah: { text: 'Ziyadah (Baru)', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
          murajaah: { text: 'Murajaah', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          tasmi: { text: 'Tasmi 1 Juz', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
        };
        const conf = labels[row.jenis] || { text: row.jenis, cls: 'bg-slate-100 text-slate-800 border-slate-200' };
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${conf.cls}`}>
            {conf.text}
          </span>
        );
      }
    },
    {
      key: 'surahMulai',
      header: 'Ayat & Juz',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">
            {row.surahMulai} : {row.ayatMulai} - {row.surahSelesai === row.surahMulai ? row.ayatSelesai : `${row.surahSelesai} : ${row.ayatSelesai}`}
          </p>
          <p className="text-[11px] text-slate-500">
            Juz {row.juz} · {row.totalHalaman} Halaman
          </p>
        </div>
      )
    },
    {
      key: 'predikat',
      header: 'Nilai & Predikat',
      render: (row) => {
        const badge = getPredikatBadgeStyle(row.predikat);
        return (
          <div>
            <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
              {row.predikat}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
              <span>L:{row.skorKelancaran}</span>
              <span>·</span>
              <span>T:{row.skorTajwid}</span>
              <span>·</span>
              <span>M:{row.skorMakhraj}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'catatan',
      header: 'Catatan Ustaz',
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2 italic max-w-xs leading-relaxed">
          "{row.catatan || 'Mutqin & tertib'}"
        </p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Ustaz Welcome Banner */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
            Halaqah Ali bin Abi Thalib · Takhassus
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Penyimakan Setoran & Evaluasi Hafalan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengampu: {currentUser?.nama} · 16 Santri Terdaftar
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInputModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Catat Setoran Baru</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Santri Hadir Halaqah"
          value="15 / 16"
          subtitle="93.7% Kehadiran"
          trend={{ value: '1 Santri Izin', isPositive: true }}
          icon={Users}
        />
        <StatCard
          title="Setoran Masuk Hari Ini"
          value={setoranList.filter((s) => s.tanggal === '2026-10-24').length + 8}
          subtitle="Ziyadah & Murajaah"
          icon={BookOpenCheck}
        />
        <StatCard
          title="Rata-rata Skor Tajwid"
          value="91.4"
          subtitle="Standar Mutqin (>= 85)"
          badge="Mumtaz"
          icon={Award}
        />
        <StatCard
          title="Siap Ujian Tasmi"
          value="4 Santri"
          subtitle="Juz 5, 10, 15, dan 30"
          icon={FileCheck}
        />
      </div>

      {/* Santri Binaan Quick Action Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daftar Santri Halaqah Saya
          </h3>
          <span className="text-xs text-slate-400">Klik santri untuk input setoran cepat</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_SANTRI_LIST.slice(0, 4).map((s) => (
            <div
              key={s.id}
              className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg hover:border-blue-900 transition-colors flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 truncate">{s.nama}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Hafal {s.totalJuzHafal} Juz · Mutqin {s.juzMutqin.length} Juz
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenInputForSantri(s)}
                className="p-1.5 text-xs font-semibold text-blue-950 bg-white border border-slate-200 rounded-md hover:bg-blue-50 transition-colors shrink-0"
                title="Input Setoran"
              >
                Setor
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Setoran Table with Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Setoran Halaqah</h3>
            <p className="text-xs text-slate-500">Rekapitulasi setoran hafalan terbaru santri binaan.</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
            {['all', 'ziyadah', 'murajaah', 'tasmi'].map((j) => (
              <button
                key={j}
                type="button"
                onClick={() => setFilterJenis(j)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterJenis === j
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {j === 'all' ? 'Semua' : j.charAt(0).toUpperCase() + j.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredSetoran}
          searchPlaceholder="Cari nama santri, surah, atau juz..."
          searchableKey={(item) => `${item.santriNama} ${item.surahMulai} ${item.juz} ${item.catatan}`}
        />
      </div>

      {/* Modal Input Setoran Baru */}
      <Modal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        title="Catat Setoran Hafalan Santri"
        subtitle="Simak bacaan santri, catat surah/ayat, berikan nilai tajwid & makhraj."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSetoran} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Santri *
              </label>
              <select
                value={inputForm.santriId}
                onChange={(e) => setInputForm({ ...inputForm, santriId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                {MOCK_SANTRI_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} (NIS: {s.nis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Setoran
              </label>
              <select
                value={inputForm.jenis}
                onChange={(e) => setInputForm({ ...inputForm, jenis: e.target.value as JenisSetoran })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              >
                <option value="ziyadah">Ziyadah (Hafalan Baru)</option>
                <option value="murajaah">Murajaah (Pengulangan)</option>
                <option value="tasmi">Tasmi 1 Juz Bil Ghaib</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Juz (1 - 30) *
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={inputForm.juz}
                onChange={(e) => setInputForm({ ...inputForm, juz: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Halaman Disetor
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={inputForm.totalHalaman}
                onChange={(e) => setInputForm({ ...inputForm, totalHalaman: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Surah Mulai
              </label>
              <select
                value={inputForm.surahMulai}
                onChange={(e) => setInputForm({ ...inputForm, surahMulai: e.target.value, surahSelesai: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                {SURAH_LIST.map((s) => (
                  <option key={s.number} value={s.name}>{s.number}. {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ayat Mulai
              </label>
              <input
                type="number"
                min={1}
                value={inputForm.ayatMulai}
                onChange={(e) => setInputForm({ ...inputForm, ayatMulai: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Surah Selesai
              </label>
              <select
                value={inputForm.surahSelesai}
                onChange={(e) => setInputForm({ ...inputForm, surahSelesai: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                {SURAH_LIST.map((s) => (
                  <option key={s.number} value={s.name}>{s.number}. {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Ayat Selesai
              </label>
              <input
                type="number"
                min={1}
                value={inputForm.ayatSelesai}
                onChange={(e) => setInputForm({ ...inputForm, ayatSelesai: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Predikat
              </label>
              <select
                value={inputForm.predikat}
                onChange={(e) => setInputForm({ ...inputForm, predikat: e.target.value as PredikatSetoran })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="A (Mumtaz)">A (Mumtaz)</option>
                <option value="B (Jayyid Jiddan)">B (Jayyid Jiddan)</option>
                <option value="C (Jayyid)">C (Jayyid)</option>
                <option value="D (Maqbul)">D (Maqbul)</option>
                <option value="Ulang (Rasib)">Ulang (Rasib)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelancaran (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={inputForm.skorKelancaran}
                onChange={(e) => setInputForm({ ...inputForm, skorKelancaran: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tajwid (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={inputForm.skorTajwid}
                onChange={(e) => setInputForm({ ...inputForm, skorTajwid: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Makhraj (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={inputForm.skorMakhraj}
                onChange={(e) => setInputForm({ ...inputForm, skorMakhraj: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Masukan Perbaikan Tajwid / Mutasyabihat
            </label>
            <textarea
              rows={2}
              value={inputForm.catatan}
              onChange={(e) => setInputForm({ ...inputForm, catatan: e.target.value })}
              placeholder="Contoh: Makhraj huruf bersih. Perhatikan mad thobi'i pada ayat 12."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowInputModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-xs"
            >
              Simpan & Terbitkan Setoran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
