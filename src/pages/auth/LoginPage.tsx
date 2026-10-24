import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';
import { ROLE_DETAILS } from '../../lib/constants';
import {
  BookMarked,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building,
  GraduationCap,
  Users,
  Shield,
  ArrowRight,
  Database,
  Sparkles,
  Flame
} from 'lucide-react';

export function LoginPage() {
  const { login, loginWithGoogle, loginWithEmail, isFirebaseConnected, firebaseStatus, setCurrentPage } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('admin@telagaalkautsar.ac.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showError('Validasi Gagal', 'Harap isi email dan kata sandi Anda.');
      return;
    }

    setLoading(true);

    if (isFirebaseConnected) {
      const res = await loginWithEmail(email, password);
      setLoading(false);
      if (res.success) {
        showSuccess('Autentikasi Berhasil', 'Sesi Firebase aktif terverifikasi.');
      } else {
        showError('Gagal Masuk', res.error || 'Periksa email dan sandi Anda.');
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        login('admin_lembaga');
        showSuccess('Selamat Datang', 'Berhasil masuk ke Sistem Hafalan Santri.');
      }, 500);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      showSuccess('Login Google Berhasil', 'Akun berhasil diverifikasi melalui Google.');
    } else {
      showError('Gagal Masuk', res.error || 'Tidak dapat login dengan Google.');
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    login(role);
    showSuccess(
      `Login Sebagai ${ROLE_DETAILS[role].label}`,
      `Memuat antarmuka ${ROLE_DETAILS[role].tag}.`
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Emblem */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-950 text-amber-400 shadow-md mb-3 border border-blue-800">
          <BookMarked className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sistem Hafalan Santri Digital
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Platform manajemen hafalan Al-Qur'an, evaluasi mutqin, dan pemantauan perkembangan santri
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          {/* Firebase Connection State Banner */}
          <div className="mb-4 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-800">
                {isFirebaseConnected ? 'Firebase Firestore Terhubung' : 'Fondasi Multi-Tenant'}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                isFirebaseConnected
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {isFirebaseConnected ? firebaseStatus.projectId : 'Siap Terhubung'}
            </span>
          </div>

          {/* Quick Demo Switcher Card */}
          <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-950">Akses Cepat Demo:</span>
              <span className="text-[10px] text-blue-700 font-medium">Pilih 1 dari 5 Role</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('super_admin')}
                className="px-2 py-1.5 text-[11px] font-semibold rounded bg-white text-slate-800 border border-slate-200 hover:border-blue-900 hover:text-blue-900 transition-colors shadow-2xs text-left"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin_lembaga')}
                className="px-2 py-1.5 text-[11px] font-semibold rounded bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-2xs text-left"
              >
                Admin Lembaga
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ustaz')}
                className="px-2 py-1.5 text-[11px] font-semibold rounded bg-white text-slate-800 border border-slate-200 hover:border-blue-900 hover:text-blue-900 transition-colors shadow-2xs text-left"
              >
                Ustaz / Halaqah
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('wali')}
                className="px-2 py-1.5 text-[11px] font-semibold rounded bg-white text-slate-800 border border-slate-200 hover:border-blue-900 hover:text-blue-900 transition-colors shadow-2xs text-left"
              >
                Orang Tua / Wali
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('santri')}
                className="px-2 py-1.5 text-[11px] font-semibold rounded bg-white text-slate-800 border border-slate-200 hover:border-blue-900 hover:text-blue-900 transition-colors shadow-2xs text-left col-span-2 sm:col-span-1"
              >
                Santri
              </button>
            </div>
          </div>

          {/* Google Sign-in button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full mb-4 flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-300 rounded-xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">Atau gunakan email & kata sandi</span>
            </div>
          </div>

          {/* Standard Form Login */}
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pesantren.id"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                />
                <span>Ingat sesi saya</span>
              </label>
              <button
                type="button"
                onClick={() => setCurrentPage('forgot_password')}
                className="font-medium text-blue-900 hover:underline"
              >
                Lupa sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white bg-blue-950 hover:bg-blue-900 font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Lembaga belum terdaftar?{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('register_lembaga')}
                className="font-semibold text-blue-900 hover:underline"
              >
                Daftarkan Lembaga Baru
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
