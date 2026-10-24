import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { JENIS_LEMBAGA_OPTIONS, METODE_HAFALAN_OPTIONS } from '../../lib/constants';
import {
  Building2,
  User,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  ShieldCheck
} from 'lucide-react';

import { InstitutionService } from '../../services/institutionService';

export function RegisterLembagaPage() {
  const { setCurrentPage } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    namaLembaga: '',
    jenisLembaga: 'pesantren' as const,
    alamat: '',
    kota: '',
    provinsi: 'Jawa Barat',
    namaPimpinan: '',
    email: '',
    telepon: '',
    namaAdmin: '',
    emailAdmin: '',
    metodeHafalan: 'Sabaq-Sabqi-Manzil',
    estimasiSantri: '50-100',
    persetujuan: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const err: Record<string, string> = {};
    if (!formData.namaLembaga.trim()) err.namaLembaga = 'Nama lembaga wajib diisi';
    if (!formData.kota.trim()) err.kota = 'Kota / Kabupaten wajib diisi';
    if (!formData.alamat.trim()) err.alamat = 'Alamat lengkap wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    const err: Record<string, string> = {};
    if (!formData.namaPimpinan.trim()) err.namaPimpinan = 'Nama penanggung jawab wajib diisi';
    if (!formData.email.trim() || !formData.email.includes('@')) err.email = 'Email resmi lembaga valid wajib diisi';
    if (!formData.telepon.trim()) err.telepon = 'Nomor WhatsApp / telepon wajib diisi';
    if (!formData.namaAdmin.trim()) err.namaAdmin = 'Nama calon administrator wajib diisi';
    if (!formData.emailAdmin.trim() || !formData.emailAdmin.includes('@')) err.emailAdmin = 'Email administrator valid wajib diisi';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.persetujuan) {
      setErrors({ persetujuan: 'Anda harus menyetujui ketentuan layanan.' });
      return;
    }

    setLoading(true);

    const result = await InstitutionService.submitPublicApplication({
      namaLembaga: formData.namaLembaga,
      jenisLembaga: formData.jenisLembaga,
      namaPimpinan: formData.namaPimpinan,
      email: formData.email,
      telepon: formData.telepon,
      alamat: formData.alamat,
      kota: formData.kota,
      provinsi: formData.provinsi,
      namaAdmin: formData.namaAdmin,
      emailAdmin: formData.emailAdmin,
      metodeHafalan: formData.metodeHafalan,
      estimasiSantri: formData.estimasiSantri
    });

    setLoading(false);

    if (result.success) {
      setCompleted(true);
      showSuccess(
        'Pendaftaran Berhasil Dikirim!',
        `Permohonan ${formData.namaLembaga} kini berstatus PENDING menunggu peninjauan Super Admin.`
      );
    } else {
      showError('Gagal Mengirim Pendaftaran', result.error || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-950 text-amber-400 mb-2 border border-blue-800 shadow-sm">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pendaftaran Lembaga Baru
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bergabunglah dengan jaringan pesantren, rumah tahfiz, dan madrasah se-Indonesia
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {!completed && (
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full -z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-900 transition-all duration-300 -z-0"
                  style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />

                {/* Steps markers */}
                {[
                  { num: 1, label: 'Data Lembaga' },
                  { num: 2, label: 'Penanggung Jawab' },
                  { num: 3, label: 'Kurikulum & Konfirmasi' }
                ].map((s) => (
                  <div key={s.num} className="relative z-10 flex flex-col items-center bg-white px-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step >= s.num
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {s.num}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 mt-1 hidden sm:block">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pendaftaran Berhasil Dikirim!</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Terima kasih telah mendaftarkan <strong className="text-slate-800">{formData.namaLembaga}</strong>. Tim verifikator kami akan meninjau dokumen pendaftaran Anda dalam 1x24 jam kerja.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 text-left max-w-md mx-auto">
                <p className="font-semibold text-slate-800">Detail Registrasi:</p>
                <p className="mt-1">Pimpinan: {formData.namaPimpinan}</p>
                <p>Email: {formData.email}</p>
                <p>Metode: {formData.metodeHafalan}</p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Data Lembaga */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lembaga / Pesantren / Yayasan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaLembaga}
                      onChange={(e) => setFormData({ ...formData, namaLembaga: e.target.value })}
                      placeholder="Contoh: Pondok Pesantren Telaga Al-Kautsar"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                    {errors.namaLembaga && <p className="text-xs text-rose-600 mt-1">{errors.namaLembaga}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jenis Lembaga
                      </label>
                      <select
                        value={formData.jenisLembaga}
                        onChange={(e) => setFormData({ ...formData, jenisLembaga: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                      >
                        {JENIS_LEMBAGA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kota / Kabupaten <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.kota}
                        onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                        placeholder="Contoh: Kabupaten Bogor"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                      />
                      {errors.kota && <p className="text-xs text-rose-600 mt-1">{errors.kota}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                    {errors.alamat && <p className="text-xs text-rose-600 mt-1">{errors.alamat}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Penanggung Jawab */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Mudir / Pimpinan Lembaga <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaPimpinan}
                      onChange={(e) => setFormData({ ...formData, namaPimpinan: e.target.value })}
                      placeholder="Contoh: K.H. Ahmad Fauzan, Lc., M.A."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    />
                    {errors.namaPimpinan && <p className="text-xs text-rose-600 mt-1">{errors.namaPimpinan}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Resmi Lembaga <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@pesantren.id"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                      />
                      {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.telepon}
                        onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                        placeholder="0812-3456-7890"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                      />
                      {errors.telepon && <p className="text-xs text-rose-600 mt-1">{errors.telepon}</p>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-900 mb-2">Akun Calon Administrator Utama Lembaga</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Calon Administrator <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.namaAdmin}
                          onChange={(e) => setFormData({ ...formData, namaAdmin: e.target.value })}
                          placeholder="Nama lengkap pengelola harian"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                        />
                        {errors.namaAdmin && <p className="text-xs text-rose-600 mt-1">{errors.namaAdmin}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Administrator <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.emailAdmin}
                          onChange={(e) => setFormData({ ...formData, emailAdmin: e.target.value })}
                          placeholder="admin.tahfiz@pesantren.id"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                        />
                        {errors.emailAdmin && <p className="text-xs text-rose-600 mt-1">{errors.emailAdmin}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Kurikulum & Konfirmasi */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Metode Hafalan yang Diterapkan
                    </label>
                    <select
                      value={formData.metodeHafalan}
                      onChange={(e) => setFormData({ ...formData, metodeHafalan: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    >
                      {METODE_HAFALAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimasi Jumlah Santri Penghafal
                    </label>
                    <select
                      value={formData.estimasiSantri}
                      onChange={(e) => setFormData({ ...formData, estimasiSantri: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                    >
                      <option value="1-50">1 - 50 Santri (Tahap Perintisan)</option>
                      <option value="51-200">51 - 200 Santri (Berkembang)</option>
                      <option value="201-500">201 - 500 Santri (Besar)</option>
                      <option value="500+">&gt; 500 Santri (Kompleks / Kampus)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.persetujuan}
                        onChange={(e) => setFormData({ ...formData, persetujuan: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                      />
                      <span>
                        Saya menyatakan data yang diisikan adalah benar dan bersedia mengikuti ketentuan pengelolaan data hafalan santri.
                      </span>
                    </label>
                    {errors.persetujuan && <p className="text-xs text-rose-600 mt-1">{errors.persetujuan}</p>}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('login')}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Batal
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loading && <span className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
                    <span>Kirim Pendaftaran</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
