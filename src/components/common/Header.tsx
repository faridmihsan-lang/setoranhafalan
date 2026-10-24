import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DETAILS } from '../../lib/constants';
import { UserRole } from '../../types';
import {
  Menu,
  Bell,
  CheckCircle2,
  ChevronDown,
  User,
  Shield,
  Building,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { SecurityAuditModal } from './SecurityAuditModal';

interface HeaderProps {
  onToggleMobileNav: () => void;
  pageTitle: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ onToggleMobileNav, pageTitle, breadcrumbs }: HeaderProps) {
  const { currentUser, activeRole, switchRole, setCurrentPage, currentPage, activeLembaga } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { role: UserRole; icon: React.ReactNode }[] = [
    { role: 'super_admin', icon: <Shield className="w-3.5 h-3.5" /> },
    { role: 'admin_lembaga', icon: <Building className="w-3.5 h-3.5" /> },
    { role: 'ustaz', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { role: 'wali', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { role: 'santri', icon: <BookOpen className="w-3.5 h-3.5" /> }
  ];

  const mockNotifications = [
    {
      id: 'ntf-1',
      title: 'Setoran Baru Diverifikasi',
      desc: 'Ahmad Zaki menyetorkan Surah Al-Isra 1-22 (Predikat Mumtaz)',
      time: '15 menit lalu'
    },
    {
      id: 'ntf-2',
      title: 'Target Semester Tercapai',
      desc: 'Fatimah Az-Zahra telah menyelesaikan Juz 18!',
      time: '2 jam lalu'
    },
    {
      id: 'ntf-3',
      title: 'Pemberitahuan Sistem',
      desc: 'Jadwal Tasmi Akbar semester ganjil telah diterbitkan.',
      time: '1 hari lalu'
    }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5 truncate">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                    {bc.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right Controls: Role Switcher & Notifications & 404 test */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Role Switcher Button */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors"
            title="Ganti role untuk pengujian"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="hidden sm:inline text-slate-500">Role:</span>
            <span className="font-semibold text-slate-900">{ROLE_DETAILS[activeRole].label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Beralih Role (Demo)
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uji tampilan dan hak akses tiap pengguna
                </p>
              </div>

              <div className="py-1">
                {rolesList.map(({ role, icon }) => {
                  const isCurrent = activeRole === role;
                  const details = ROLE_DETAILS[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        switchRole(role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={isCurrent ? 'text-blue-900' : 'text-slate-400'}>{icon}</span>
                        <div className="truncate">
                          <p className="truncate">{details.label}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate">
                            {details.tag}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Lihat notifikasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Notifikasi</span>
                <span className="text-[10px] text-blue-900 font-medium">3 Baru</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Audit Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setSecurityModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-2xs"
          title="Buka Audit Keamanan Firebase & Multi-Tenant"
        >
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Audit Keamanan</span>
        </button>

        {/* 404 Preview Shortcut Button */}
        <button
          type="button"
          onClick={() => setCurrentPage('not_found')}
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Uji Tampilan Halaman 404"
        >
          <FileQuestion className="w-3.5 h-3.5" />
          <span>Uji 404</span>
        </button>

        {/* User Avatar */}
        <button
          type="button"
          onClick={() => setCurrentPage('profile')}
          className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-900/20 transition-all"
          title="Buka profil"
        >
          <div className="w-8 h-8 rounded-full bg-blue-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser?.nama?.charAt(0) || 'U'}
          </div>
        </button>
      </div>

      {/* Security Audit Dialog */}
      <SecurityAuditModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />
    </header>
  );
}
