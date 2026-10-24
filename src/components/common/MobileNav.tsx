import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DETAILS } from '../../lib/constants';
import {
  X,
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookMarked,
  FileSpreadsheet,
  Award,
  CalendarDays,
  User,
  LogOut,
  ShieldCheck,
  BookOpenCheck
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  activeTab: string;
}

export function MobileNav({ isOpen, onClose, onNavigateTab, activeTab }: MobileNavProps) {
  const { currentUser, activeRole, activeLembaga, logout, setCurrentPage, currentPage } = useAuth();

  const getNavItems = () => {
    switch (activeRole) {
      case 'super_admin':
        return [
          { id: 'overview', label: 'Ringkasan Global', icon: LayoutDashboard },
          { id: 'lembaga', label: 'Kelola Lembaga', icon: Building2 },
          { id: 'applications', label: 'Antrean Permohonan', icon: BookOpenCheck },
          { id: 'audit_logs', label: 'Audit Log & Sistem', icon: FileSpreadsheet }
        ];
      case 'admin_lembaga':
        return [
          { id: 'overview', label: 'Dashboard Lembaga', icon: LayoutDashboard },
          { id: 'profil_lembaga', label: 'Profil & Identitas', icon: Building2 },
          { id: 'santri', label: 'Data Santri', icon: Users },
          { id: 'ustaz', label: 'Ustaz & Pengampu', icon: GraduationCap },
          { id: 'halaqah', label: 'Halaqah & Kelas', icon: GraduationCap },
          { id: 'kurikulum', label: 'Target Kurikulum', icon: BookMarked },
          { id: 'laporan', label: 'Laporan Hafalan', icon: FileSpreadsheet }
        ];
      case 'ustaz':
        return [
          { id: 'overview', label: 'Halaqah Saya', icon: LayoutDashboard },
          { id: 'input_setoran', label: 'Input Setoran Baru', icon: BookOpenCheck },
          { id: 'riwayat_setoran', label: 'Riwayat Setoran', icon: FileSpreadsheet },
          { id: 'santri_binaan', label: 'Santri Binaan', icon: Users },
          { id: 'evaluasi_tajwid', label: 'Evaluasi Mutqin', icon: Award }
        ];
      case 'wali':
        return [
          { id: 'overview', label: 'Pantau Hafalan Anak', icon: LayoutDashboard },
          { id: 'riwayat_anak', label: 'Riwayat Setoran Harian', icon: FileSpreadsheet },
          { id: 'capaian_juz', label: 'Capaian 30 Juz', icon: Award },
          { id: 'murajaah_rumah', label: 'Murajaah di Rumah', icon: CalendarDays }
        ];
      case 'santri':
        return [
          { id: 'overview', label: 'Portal Hafalan Saya', icon: LayoutDashboard },
          { id: 'target_pribadi', label: 'Target & Capaian Juz', icon: Award },
          { id: 'riwayat_saya', label: 'Riwayat Setoran', icon: FileSpreadsheet },
          { id: 'jadwal_murajaah', label: 'Jadwal Murajaah', icon: CalendarDays },
          { id: 'adab_hafalan', label: 'Doa & Adab Menghafal', icon: BookMarked }
        ];
      default:
        return [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();
  const roleInfo = ROLE_DETAILS[activeRole];

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-slate-100 flex flex-col h-full z-10 p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-amber-400">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white leading-tight">Hafalan Santri</h2>
                  <p className="text-[10px] text-blue-300">{roleInfo.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                aria-label="Tutup navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lembaga Info */}
            {activeLembaga && (
              <div className="mt-3 p-2.5 bg-slate-800 rounded-lg text-xs">
                <p className="font-semibold text-white truncate">{activeLembaga.nama}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeLembaga.kota}</p>
              </div>
            )}

            {/* Menu List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === 'dashboard' && activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (currentPage !== 'dashboard') {
                        setCurrentPage('dashboard');
                      }
                      onNavigateTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('profile');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Profil Saya</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar on Small Screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 z-30 px-3 flex items-center justify-around">
        <button
          type="button"
          onClick={() => {
            setCurrentPage('dashboard');
            onNavigateTab('overview');
          }}
          className={`flex flex-col items-center justify-center py-1 flex-1 text-[10px] font-medium transition-colors ${
            currentPage === 'dashboard' && activeTab === 'overview'
              ? 'text-blue-900 font-bold'
              : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentPage('dashboard');
            // Navigate to main action based on role
            if (activeRole === 'ustaz') onNavigateTab('input_setoran');
            else if (activeRole === 'wali') onNavigateTab('riwayat_anak');
            else if (activeRole === 'santri') onNavigateTab('target_pribadi');
            else onNavigateTab('santri');
          }}
          className={`flex flex-col items-center justify-center py-1 flex-1 text-[10px] font-medium transition-colors ${
            currentPage === 'dashboard' && activeTab !== 'overview'
              ? 'text-blue-900 font-bold'
              : 'text-slate-500'
          }`}
        >
          <BookMarked className="w-4 h-4 mb-0.5" />
          <span>Hafalan</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('profile')}
          className={`flex flex-col items-center justify-center py-1 flex-1 text-[10px] font-medium transition-colors ${
            currentPage === 'profile' ? 'text-blue-900 font-bold' : 'text-slate-500'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>Profil</span>
        </button>
      </div>
    </>
  );
}
