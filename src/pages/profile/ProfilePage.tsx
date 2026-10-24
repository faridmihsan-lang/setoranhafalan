import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_DETAILS } from '../../lib/constants';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Lock,
  Bell,
  Save,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export function ProfilePage() {
  const { currentUser, activeRole, activeLembaga, updateUserProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [nama, setNama] = useState(currentUser?.nama || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [telepon, setTelepon] = useState(currentUser?.telepon || '');
  const [alamat, setAlamat] = useState(currentUser?.alamat || 'Kompleks Pesantren, Asrama Putra Blok A');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Notification toggles
  const [notifWA, setNotifWA] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifHalaqah, setNotifHalaqah] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) {
      showError('Gagal Menyimpan', 'Nama dan email tidak boleh kosong.');
      return;
    }
    updateUserProfile({ nama, email, telepon, alamat });
    showSuccess('Profil Diperbarui', 'Data identitas pengguna berhasil disimpan.');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Validasi Gagal', 'Harap isi kata sandi saat ini dan kata sandi baru.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Sandi Tidak Cocok', 'Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }
    if (newPassword.length < 6) {
      showError('Sandi Terlalu Pendek', 'Kata sandi minimal 6 karakter.');
      return;
    }

    setPassLoading(true);
    setTimeout(() => {
      setPassLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Kata Sandi Berhasil Diubah', 'Gunakan kata sandi baru untuk login berikutnya.');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="w-16 h-16 rounded-full bg-blue-950 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white ring-2 ring-blue-900/20 shrink-0">
          {nama ? nama.charAt(0) : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{nama}</h2>
            <span className="inline-block px-2 py-0.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded self-center sm:self-auto">
              {ROLE_DETAILS[activeRole].label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeLembaga?.nama || 'Sistem Hafalan Santri Digital'} · {currentUser?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Edit Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-900" />
              <span>Informasi Pribadi & Kontak</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Pengguna *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="tel"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-900" />
              <span>Ganti Kata Sandi</span>
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ulangi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi sandi baru"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  {passLoading && <span className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />}
                  <span>Perbarui Sandi</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Roles & Notifications */}
        <div className="space-y-6">
          {/* Institutional Info Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-900" />
              <span>Hak Akses & Lembaga</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Role Aktif:</span>
                <span className="font-semibold text-slate-900">{ROLE_DETAILS[activeRole].label}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lembaga Induk:</span>
                <span className="font-semibold text-slate-900">{activeLembaga?.nama || 'Pusat Nasional'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Akun:</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
                  Terverifikasi Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-900" />
              <span>Preferensi Notifikasi</span>
            </h4>
            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifWA}
                  onChange={(e) => setNotifWA(e.target.checked)}
                  className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                />
                <div>
                  <p className="font-semibold text-slate-800">Notifikasi WhatsApp</p>
                  <p className="text-[11px] text-slate-400">Pemberitahuan setoran harian langsung ke WA.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.checked)}
                  className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                />
                <div>
                  <p className="font-semibold text-slate-800">Laporan Mingguan Email</p>
                  <p className="text-[11px] text-slate-400">Ringkasan kemajuan hafalan ke kotak masuk.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifHalaqah}
                  onChange={(e) => setNotifHalaqah(e.target.checked)}
                  className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
                />
                <div>
                  <p className="font-semibold text-slate-800">Pengingat Jadwal Halaqah</p>
                  <p className="text-[11px] text-slate-400">Pemberitahuan 15 menit sebelum halaqah dimulai.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
