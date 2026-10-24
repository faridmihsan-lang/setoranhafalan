import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { MOCK_SANTRI_LIST, MOCK_SETORAN_LIST } from '../../lib/mockData';
import { SetoranHafalan } from '../../types';
import { getPredikatBadgeStyle } from '../../lib/utils';
import {
  HeartHandshake,
  Award,
  BookOpenCheck,
  CalendarCheck,
  Phone,
  MessageCircle,
  Sparkles,
  Home,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export function WaliDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  const { currentUser } = useAuth();
  const { showInfo } = useToast();

  const anak = MOCK_SANTRI_LIST[0]; // Ahmad Zaki Al-Fatih
  const setoranAnak = MOCK_SETORAN_LIST.filter((s) => s.santriId === anak.id);

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
      header: 'Jenis Setoran',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
            row.jenis === 'ziyadah'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {row.jenis === 'ziyadah' ? 'Ziyadah (Baru)' : 'Murajaah (Ulang)'}
        </span>
      )
    },
    {
      key: 'surahMulai',
      header: 'Surah & Ayat',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.surahMulai} : {row.ayatMulai} - {row.ayatSelesai}
          </p>
          <p className="text-[11px] text-slate-500">Juz {row.juz} · {row.totalHalaman} Halaman</p>
        </div>
      )
    },
    {
      key: 'predikat',
      header: 'Evaluasi & Nilai',
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
      header: 'Catatan dari Ustaz Pengampu',
      render: (row) => (
        <div className="bg-slate-50 p-2 rounded border border-slate-200/80 max-w-sm">
          <p className="text-xs text-slate-700 italic">"{row.catatan}"</p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{row.ustazNama}</p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Wali Child Profile Header */}
      <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <HeartHandshake className="w-4 h-4" />
            <span>Portal Orang Tua / Wali Santri</span>
          </div>
          <h2 className="text-xl font-bold">Perkembangan Hafalan: {anak.nama}</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            NIS: {anak.nis} · Halaqah: {anak.halaqahNama} · Pembimbing: {anak.ustazNama}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showInfo('Kontak Ustaz', `Hubungi ${anak.ustazNama} di nomor layanan halaqah.`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-950 bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-xs"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Konsultasi Ustaz</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Capaian Hafalan"
          value={`${anak.totalJuzHafal} Juz`}
          subtitle={`Target: ${anak.targetJuz} Juz (Takhassus)`}
          trend={{ value: '48.3% target tercapai', isPositive: true }}
          icon={Award}
        />
        <StatCard
          title="Juz Berstatus Mutqin"
          value={`${anak.juzMutqin.length} Juz`}
          subtitle="Telah diuji sekali duduk"
          badge="Kuat"
          icon={CheckCircle2}
        />
        <StatCard
          title="Setoran Pekan Ini"
          value="6 Kali"
          subtitle="Ziyadah & Murajaah Harian"
          icon={BookOpenCheck}
        />
        <StatCard
          title="Terakhir Menyetor"
          value="Hari Ini"
          subtitle="Ba'da Subuh (05:45 WIB)"
          icon={CalendarCheck}
        />
      </div>

      {/* Visual 30-Juz Progress Bar for Parents */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Peta Capaian 30 Juz</h3>
            <p className="text-xs text-slate-500">Visualisasi juz yang telah mutqin dan sedang dalam proses ziyadah.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-600">Mutqin (10 Juz)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-slate-600">Sedang Dihapal (5 Juz)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-slate-400">Belum (15 Juz)</span>
            </span>
          </div>
        </div>

        {/* 30 Juz Blocks Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-1.5 pt-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const isMutqin = anak.juzMutqin.includes(juzNum);
            const isInProgress = !isMutqin && juzNum <= 15;

            return (
              <div
                key={juzNum}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-transform hover:scale-105 select-none ${
                  isMutqin
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : isInProgress
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title={`Juz ${juzNum}: ${isMutqin ? 'Mutqin' : isInProgress ? 'Sedang Dihafal' : 'Belum Dimulai'}`}
              >
                <span className="text-xs font-mono">{juzNum}</span>
                <span className="text-[9px] mt-0.5">
                  {isMutqin ? 'Mutqin' : isInProgress ? 'Ziyadah' : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Home Murajaah Advice Box */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3">
        <div className="p-2.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
          <Home className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
            Rekomendasi Murajaah di Rumah Saat Libur
          </h4>
          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            Ustaz pembimbing menyarankan Ananda Ahmad Zaki untuk memperkuat murajaah <strong>Juz 5 (Surah An-Nisa)</strong> dan mengulang hafalan 1/2 juz setiap ba'da Maghrib bersama keluarga untuk menjaga kelancaran makharijul huruf.
          </p>
        </div>
      </div>

      {/* Setoran History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Riwayat Setoran Terbaru Ananda</h3>
          <span className="text-xs text-slate-500">{setoranAnak.length} Setoran Terdata</span>
        </div>

        <DataTable
          columns={columns}
          data={setoranAnak}
          searchPlaceholder="Cari surah, juz, atau catatan..."
          searchableKey={(item) => `${item.surahMulai} ${item.juz} ${item.catatan} ${item.predikat}`}
        />
      </div>
    </div>
  );
}
