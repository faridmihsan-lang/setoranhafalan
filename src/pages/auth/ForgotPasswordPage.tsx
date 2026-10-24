import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowLeft, CheckCircle2, BookMarked } from 'lucide-react';

import { AuthService } from '../../services/authService';

export function ForgotPasswordPage() {
  const { setCurrentPage, isFirebaseConnected } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    if (isFirebaseConnected) {
      const res = await AuthService.resetPassword(email);
      setLoading(false);
      if (res.success) {
        setIsSubmitted(true);
        showSuccess('Tautan Terkirim', 'Instruksi pemulihan telah dikirim oleh Firebase Auth.');
      } else {
        showError('Gagal Mengirim Tautan', res.error || 'Terjadi kesalahan.');
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        setIsSubmitted(true);
        showSuccess('Tautan Terkirim', 'Instruksi reset kata sandi telah dikirim ke email Anda.');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-900 mb-3 border border-blue-200">
              <BookMarked className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Lupa Kata Sandi</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Masukkan alamat email terdaftar untuk menerima tautan pemulihan kata sandi akun Anda.
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Periksa Kotak Masuk Anda</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kami telah mengirimkan instruksi ke <span className="font-semibold text-slate-700">{email}</span>. Silakan periksa folder inbox atau spam.
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="mt-6 w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@pesantren.id"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  'Kirim Tautan Pemulihan'
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
