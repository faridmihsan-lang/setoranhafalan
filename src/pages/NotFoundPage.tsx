import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookMarked, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const { setCurrentPage, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center mx-auto mb-4">
          <BookMarked className="w-8 h-8 text-amber-500" />
        </div>

        <span className="text-4xl font-extrabold text-blue-950 font-mono tracking-tight">
          404
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-2">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Mohon maaf, halaman atau tautan hafalan yang Anda tuju tidak ditemukan atau telah dipindahkan ke menu lain.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'login')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>{isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Halaman Masuk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
