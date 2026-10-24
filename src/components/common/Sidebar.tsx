import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DETAILS } from '../../lib/constants';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookMarked,
  FileSpreadsheet,
  Award,
  CalendarDays,
  Settings,
  LogOut,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  BookOpenCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateTab?: (tab: string) => void;
  activeTab?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigateTab, activeTab = 'overview' }: SidebarProps) {
  const { currentUser, activeRole, activeLembaga, logout, setCurrentPage, currentPage } = useAuth();

  // Navigation schema per role
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
          { id: 'ustaz', label: 'Ustaz & Pengampu', icon: UserCheck },
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
    <aside
      className={`hidden md:flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-blue-950 border border-blue-600/50 flex items-center justify-center shrink-0 shadow-xs">
            <BookMarked className="w-5 h-5 text-amber-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block text-sm font-bold tracking-tight text-white truncate">
                Hafalan Santri
              </span>
              <span className="block text-[10px] text-blue-300 font-medium truncate">
                Digital Multitenant
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active Institution Badge (If not Super Admin) */}
      {!collapsed && activeRole !== 'super_admin' && activeLembaga && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-200 truncate">
              {activeLembaga.nama}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Metode: {activeLembaga.metodeHafalan}</span>
            <span className="text-emerald-400 font-mono">Aktif</span>
          </div>
        </div>
      )}

      {/* Role Tag & Navigation List */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {roleInfo.tag}
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              {roleInfo.label}
            </span>
          </div>
        )}

        <nav className="space-y-1">
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
                  if (onNavigateTab) {
                    onNavigateTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Section & Bottom Links */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setCurrentPage('profile')}
          className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors mb-1.5 ${
            currentPage === 'profile'
              ? 'bg-blue-900/60 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-semibold text-xs shrink-0">
            {currentUser?.nama?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.nama}</p>
              <p className="text-[10px] text-slate-400 truncate">{roleInfo.label}</p>
            </div>
          )}
          {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-md transition-colors w-full"
            title="Keluar dari akun"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
