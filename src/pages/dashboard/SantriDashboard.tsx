import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { MOCK_SANTRI_LIST, MOCK_SETORAN_LIST } from '../../lib/mockData';
import { SetoranHafalan } from '../../types';
import { getPredikatBadgeStyle } from '../../lib/utils';
import {
  BookOpen,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookMarked,
  Heart
} from 'lucide-react';

export function SantriDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  const { currentUser } = useAuth();
  const { showSuccess } = useToast();

  const santri = MOCK_SANTRI_LIST[0]; // Ahmad Zaki Al-Fatih
  const riwayatSaya = MOCK_SETORAN_LIST.filter((s) => s.santriId === santri.id);
  const [selectedJuzDetail, setSelectedJuzDetail] = useState<number | null>(15);

  const columns: Column<SetoranHafalan>[] = [
    {
      key: 'tanggal',
      header: 'Tanggal & Waktu',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.tanggal}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.waktu} WIB</p>
        </div>
      )
    },
    {
      key: 'jenis',
      header: 'Jenis',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
            row.jenis === 'ziyadah'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {row.jenis === 'ziyadah' ? 'Ziyadah' : 'Murajaah'}
        </span>
      )
    },
    {
      key: 'surahMulai',
      header: 'Materi Setoran',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">
            {row.surahMulai} ({row.ayatMulai} - {row.ayatSelesai})
          </p>
          <p className="text-[11px] text-slate-500">Juz {row.juz} · {row.totalHalaman} Halaman</p>
        </div>
      )
    },
    {
      key: 'predikat',
      header: 'Nilai & Predikat',
      render: (row) => {
        const badge = getPredikatBadgeStyle(row.predikat);
        return (
          <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
            {row.predikat}
          </span>
        );
      }
    },
    {
      key: 'catatan',
      header: 'Nasihat Ustaz',
      render: (row) => (
        <p className="text-xs text-slate-600 italic leading-relaxed">
          "{row.catatan || 'Terus pertahankan kelancaran.'}"
        </p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Portal Hifdzil Qur'an Santri
          </span>
          <h2 className="text-xl font-bold mt-0.5">Ahlan wa Sahlan, {santri.nama}!</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            NIS: {santri.nis} · Halaqah: {santri.halaqahNama} · Pembimbing: {santri.ustazNama}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-blue-900/60 border border-blue-700/60 rounded-lg text-xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-amber-300">18 Hari Berturut-turut Setor</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Hafalan Saya"
          value={`${santri.totalJuzHafal} Juz`}
          subtitle={`Target: ${santri.targetJuz} Juz`}
          trend={{ value: '48.3% Menuju Khotmil Quran', isPositive: true }}
          icon={BookOpen}
        />
        <StatCard
          title="Juz Berstatus Mutqin"
          value={`${santri.juzMutqin.length} Juz`}
          subtitle="Telah diuji sekali duduk"
          badge="Kuat"
          icon={Award}
        />
        <StatCard
          title="Target Bulan Ini"
          value="Juz 15 Penuh"
          subtitle="Sisa 9 halaman Ziyadah"
          icon={Calendar}
        />
        <StatCard
          title="Predikat Terakhir"
          value="Mumtaz (A)"
          subtitle="Surah Al-Isra 1-22"
          badge="94/100"
          icon={Sparkles}
        />
      </div>

      {/* Interactive 30 Juz Map */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Peta Capaian 30 Juz</h3>
            <p className="text-xs text-slate-500">Klik salah satu kotak juz untuk melihat detail status hafalan Anda.</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-600">Mutqin ({santri.juzMutqin.length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-slate-600">Ziyadah (5)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-slate-400">Belum (15)</span>
            </span>
          </div>
        </div>

        {/* Grid 30 Juz */}
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const isMutqin = santri.juzMutqin.includes(juzNum);
            const isInProgress = !isMutqin && juzNum <= 15;
            const isSelected = selectedJuzDetail === juzNum;

            return (
              <button
                key={juzNum}
                type="button"
                onClick={() => setSelectedJuzDetail(juzNum)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-blue-900 ring-offset-1' : ''
                } ${
                  isMutqin
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : isInProgress
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-mono">{juzNum}</span>
                <span className="text-[9px] mt-0.5">
                  {isMutqin ? 'Mutqin' : isInProgress ? 'Proses' : '-'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Juz Detail Banner */}
        {selectedJuzDetail && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">Detail Juz {selectedJuzDetail}:</span>{' '}
              {santri.juzMutqin.includes(selectedJuzDetail) ? (
                <span className="text-amber-800 font-semibold">
                  Alhamdulillah, status Mutqin (Telah lulus tasmi 1 juz sekali duduk dengan predikat Mumtaz).
                </span>
              ) : selectedJuzDetail <= 15 ? (
                <span className="text-blue-900 font-semibold">
                  Sedang dalam tahap ziyadah dan murajaah harian dengan Ustaz Muhammad Ridwan.
                </span>
              ) : (
                <span className="text-slate-500">
                  Belum dijadwalkan untuk ziyadah semester ini.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Today's Schedule & Islamic Etiquette Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schedule */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-900" />
            <span>Jadwal Setoran & Murajaah Hari Ini</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-950">Ba'da Subuh (05:15 - 06:45 WIB)</p>
                <p className="text-[11px] text-blue-700">Setoran Ziyadah Surah Al-Isra ayat 1-22</p>
              </div>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Ba'da Ashar (16:00 - 17:15 WIB)</p>
                <p className="text-[11px] text-slate-500">Murajaah Mandiri Juz 5 bersama partner halaqah</p>
              </div>
              <span className="text-slate-500 font-medium">Mendatang</span>
            </div>
          </div>
        </div>

        {/* Adab & Doa */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-emerald-700" />
            <span>Doa & Adab Hifdzil Qur'an</span>
          </h4>
          <p className="text-xs text-emerald-900 italic leading-relaxed">
            "اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ وَاجْعَلْهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً"
          </p>
          <p className="text-[11px] text-emerald-800 mt-2 leading-relaxed">
            Niatkan menghafal semata-mata karena ridha Allah SWT, jauhi perbuatan maksiat, dan jaga konsistensi (istiqamah) walau hanya setengah halaman setiap hari.
          </p>
        </div>
      </div>

      {/* Riwayat Setoran Saya */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Setoran Saya</h3>
          <span className="text-xs text-slate-500">{riwayatSaya.length} Catatan Masuk</span>
        </div>

        <DataTable
          columns={columns}
          data={riwayatSaya}
          searchPlaceholder="Cari surah, tanggal, atau nilai..."
          searchableKey={(item) => `${item.surahMulai} ${item.juz} ${item.predikat}`}
        />
      </div>
    </div>
  );
}
