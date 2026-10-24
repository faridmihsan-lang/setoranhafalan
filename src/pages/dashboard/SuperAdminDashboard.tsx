import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Lembaga, InstitutionApplication, InstitutionStatus } from '../../types';
import {
  InstitutionService,
  CreateInstitutionInput,
  AuditLogItem
} from '../../services/institutionService';
import { JENIS_LEMBAGA_OPTIONS, METODE_HAFALAN_OPTIONS } from '../../lib/constants';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Ban,
  Plus,
  Eye,
  FileCheck2,
  XCircle,
  FileText,
  AlertTriangle,
  RotateCw,
  Search,
  Filter
} from 'lucide-react';

export function SuperAdminDashboard({ activeTab = 'overview' }: { activeTab?: string }) {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [currentTab, setCurrentTab] = useState<'institutions' | 'applications' | 'audit'>(
    activeTab === 'applications' ? 'applications' : 'institutions'
  );

  // Data states
  const [institutions, setInstitutions] = useState<Lembaga[]>([]);
  const [applications, setApplications] = useState<InstitutionApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('pending');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailAppModal, setShowDetailAppModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Selected Items for Action
  const [selectedApp, setSelectedApp] = useState<InstitutionApplication | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Lembaga | null>(null);
  const [targetStatus, setTargetStatus] = useState<InstitutionStatus>('suspended');
  const [actionReason, setActionReason] = useState('');

  // Form State for Direct Institution Creation
  const [createForm, setCreateForm] = useState<CreateInstitutionInput>({
    nama: '',
    jenis: 'pesantren',
    alamat: '',
    kota: '',
    provinsi: 'Jawa Barat',
    nomorTelepon: '',
    email: '',
    adminName: '',
    adminEmail: '',
    metodeHafalan: 'Sabaq-Sabqi-Manzil',
    status: 'active'
  });

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [instList, appList, logs] = await Promise.all([
        InstitutionService.getInstitutions(),
        InstitutionService.getApplications(),
        InstitutionService.getAuditLogs()
      ]);
      setInstitutions(instList);
      setApplications(appList);
      setAuditLogs(logs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync with tab changes from props
  useEffect(() => {
    if (activeTab === 'applications') setCurrentTab('applications');
    else if (activeTab === 'audit_logs') setCurrentTab('audit');
    else if (activeTab === 'lembaga') setCurrentTab('institutions');
  }, [activeTab]);

  // Direct Institution Creation Handler
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nama.trim() || !createForm.adminName.trim() || !createForm.adminEmail.trim()) {
      showError('Validasi Gagal', 'Harap isi nama lembaga, nama administrator, dan email.');
      return;
    }

    const res = await InstitutionService.createInstitutionDirect(
      createForm,
      currentUser?.id,
      currentUser?.nama
    );

    if (res.success && res.data) {
      showSuccess('Lembaga Berhasil Dibuat', `${res.data.nama} telah ditambahkan ke sistem.`);
      setShowCreateModal(false);
      setCreateForm({
        nama: '',
        jenis: 'pesantren',
        alamat: '',
        kota: '',
        provinsi: 'Jawa Barat',
        nomorTelepon: '',
        email: '',
        adminName: '',
        adminEmail: '',
        metodeHafalan: 'Sabaq-Sabqi-Manzil',
        status: 'active'
      });
      loadData();
    } else {
      showError('Gagal Membuat Lembaga', res.error || 'Terjadi kesalahan sistem.');
    }
  };

  // Application Approval Handler
  const handleApproveApplication = async (app: InstitutionApplication) => {
    const res = await InstitutionService.approveApplication(
      app.id,
      currentUser?.id,
      currentUser?.nama,
      'Disetujui dan diverifikasi oleh Super Admin'
    );

    if (res.success) {
      showSuccess('Permohonan Disetujui', res.message || `${app.namaLembaga} kini telah aktif.`);
      setShowDetailAppModal(false);
      loadData();
    } else {
      showError('Gagal Menyetujui', res.error || 'Terjadi kesalahan saat memproses persetujuan.');
    }
  };

  // Application Rejection Handler
  const handleConfirmReject = async () => {
    if (!selectedApp) return;
    if (!actionReason.trim()) {
      showError('Alasan Diperlukan', 'Harap masukkan alasan penolakan permohonan.');
      return;
    }

    const res = await InstitutionService.rejectApplication(
      selectedApp.id,
      currentUser?.id,
      currentUser?.nama,
      actionReason
    );

    if (res.success) {
      showSuccess('Permohonan Ditolak', `Permohonan ${selectedApp.namaLembaga} telah ditolak.`);
      setShowRejectModal(false);
      setShowDetailAppModal(false);
      setActionReason('');
      setSelectedApp(null);
      loadData();
    } else {
      showError('Gagal Menolak', res.error || 'Terjadi kesalahan sistem.');
    }
  };

  // Status Change Handler (Suspend / Activate)
  const handleConfirmStatusChange = async () => {
    if (!selectedInstitution) return;

    const res = await InstitutionService.updateInstitutionStatus(
      selectedInstitution.id,
      targetStatus,
      currentUser?.id,
      currentUser?.nama,
      actionReason || (targetStatus === 'suspended' ? 'Penangguhan akun sementara' : 'Aktivasi kembali')
    );

    if (res.success) {
      showSuccess('Status Lembaga Diperbarui', res.message);
      setShowStatusModal(false);
      setSelectedInstitution(null);
      setActionReason('');
      loadData();
    } else {
      showError('Gagal Mengubah Status', res.error);
    }
  };

  // Metrics calculation
  const totalLembagaCount = institutions.length;
  const activeLembagaCount = institutions.filter((i) => i.status === 'active').length;
  const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;
  const suspendedLembagaCount = institutions.filter((i) => i.status === 'suspended').length;

  // Filtered lists
  const filteredInstitutions = institutions.filter((i) => {
    if (statusFilter === 'all') return true;
    return i.status === statusFilter;
  });

  const filteredApplications = applications.filter((a) => {
    if (appStatusFilter === 'all') return true;
    return a.status === appStatusFilter;
  });

  // Table Columns: Institutions
  const institutionColumns: Column<Lembaga>[] = [
    {
      key: 'nama',
      header: 'Nama Lembaga & Lokasi',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.nama}</p>
          <p className="text-[11px] text-slate-500">{row.kota}, {row.provinsi}</p>
        </div>
      )
    },
    {
      key: 'jenis',
      header: 'Jenis',
      render: (row) => {
        const labels: Record<string, string> = {
          pesantren: 'Pesantren',
          rumah_tahfiz: 'Rumah Tahfiz',
          sekolah_islam: 'Sekolah Islam',
          madrasah: 'Madrasah',
          halaqah: 'Halaqah'
        };
        return <span className="text-slate-700 font-medium">{labels[row.jenis] || row.jenis}</span>;
      }
    },
    {
      key: 'tanggalBergabung',
      header: 'Tgl Terdaftar',
      sortable: true,
      render: (row) => <span className="font-mono text-slate-600">{row.tanggalBergabung || '-'}</span>
    },
    {
      key: 'adminName',
      header: 'Administrator Utama',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.adminName || row.nama}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.adminEmail || row.email}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status Operasional',
      align: 'center',
      render: (row) => {
        if (row.status === 'active') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Aktif
            </span>
          );
        }
        if (row.status === 'suspended') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <Ban className="w-3 h-3 text-rose-600" />
              Ditangguhkan
            </span>
          );
        }
        if (row.status === 'pending') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Menunggu
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Tindakan',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === 'active' ? (
            <button
              type="button"
              onClick={() => {
                setSelectedInstitution(row);
                setTargetStatus('suspended');
                setShowStatusModal(true);
              }}
              className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
              title="Tangguhkan akses operasional lembaga"
            >
              Tangguhkan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedInstitution(row);
                setTargetStatus('active');
                setShowStatusModal(true);
              }}
              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
              title="Aktifkan kembali lembaga"
            >
              Aktifkan
            </button>
          )}
        </div>
      )
    }
  ];

  // Table Columns: Applications Queue
  const applicationColumns: Column<InstitutionApplication>[] = [
    {
      key: 'namaLembaga',
      header: 'Nama Lembaga & Pimpinan',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.namaLembaga}</p>
          <p className="text-[11px] text-slate-500">Mudir: {row.namaPimpinan} · {row.kota}</p>
        </div>
      )
    },
    {
      key: 'tanggalPengajuan',
      header: 'Diajukan Pada',
      sortable: true,
      render: (row) => <span className="font-mono text-slate-600 text-xs">{row.tanggalPengajuan}</span>
    },
    {
      key: 'namaAdmin',
      header: 'Calon Administrator',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.namaAdmin || row.namaPimpinan}</p>
          <p className="text-[11px] text-slate-400 font-mono">{row.emailAdmin || row.email}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status Verifikasi',
      align: 'center',
      render: (row) => {
        if (row.status === 'pending') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Menunggu Review
            </span>
          );
        }
        if (row.status === 'approved') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Disetujui
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Ditolak
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Aksi Keputusan',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedApp(row);
              setShowDetailAppModal(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
          >
            <Eye className="w-3 h-3" />
            Detail
          </button>
          {row.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleApproveApplication(row)}
              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded transition-colors shadow-2xs"
            >
              Setujui
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl shadow-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            Manajemen Multi-Tenant Global
          </span>
          <h2 className="text-xl font-bold mt-0.5">Tata Kelola Lembaga & Permohonan Masuk</h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Pusat administrasi perizinan, verifikasi permohonan pendaftaran mandiri, dan pengawasan status operasional lembaga tahfiz se-Indonesia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-950 bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Tambah Lembaga Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards as Required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Lembaga Terdaftar"
          value={totalLembagaCount}
          subtitle="Pesantren, RTQ, Madrasah"
          icon={Building2}
        />
        <StatCard
          title="Lembaga Aktif"
          value={activeLembagaCount}
          subtitle="Operasional normal"
          badge="Berjalan"
          trend={{ value: `${Math.round((activeLembagaCount / (totalLembagaCount || 1)) * 100)}% aktif`, isPositive: true }}
          icon={CheckCircle2}
        />
        <StatCard
          title="Permohonan Menunggu"
          value={pendingAppsCount}
          subtitle="Menunggu persetujuan Super Admin"
          badge={pendingAppsCount > 0 ? 'Perlu Ditinjau' : 'Nihil'}
          icon={Clock}
        />
        <StatCard
          title="Lembaga Ditangguhkan"
          value={suspendedLembagaCount}
          subtitle="Akses operasional dibekukan"
          icon={Ban}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentTab('institutions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              currentTab === 'institutions'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Daftar Lembaga ({institutions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('applications')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 relative ${
              currentTab === 'applications'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Permohonan Pendaftaran</span>
            {pendingAppsCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingAppsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('audit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              currentTab === 'audit'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Tindakan</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 p-2 rounded-lg"
          title="Segarkan data"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tab Content 1: Institutions Table */}
      {currentTab === 'institutions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Lembaga Terdaftar</h3>
              <p className="text-xs text-slate-500">Kelola status, administrator utama, dan izin operasional lembaga.</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
              {['all', 'active', 'suspended', 'pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all'
                    ? 'Semua Status'
                    : st === 'active'
                    ? 'Aktif'
                    : st === 'suspended'
                    ? 'Ditangguhkan'
                    : 'Menunggu'}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={institutionColumns}
            data={filteredInstitutions}
            searchPlaceholder="Cari nama lembaga, kota, atau administrator..."
            searchableKey={(item) => `${item.nama} ${item.kota} ${item.provinsi} ${item.adminName} ${item.email}`}
          />
        </div>
      )}

      {/* Tab Content 2: Applications Queue */}
      {currentTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antrean Permohonan Mandiri</h3>
              <p className="text-xs text-slate-500">Tinjau dokumen, tentukan persetujuan atau penolakan permohonan pendaftaran lembaga baru.</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
              {['pending', 'approved', 'rejected', 'all'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAppStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    appStatusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'pending'
                    ? 'Menunggu'
                    : st === 'approved'
                    ? 'Disetujui'
                    : st === 'rejected'
                    ? 'Ditolak'
                    : 'Semua'}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={applicationColumns}
            data={filteredApplications}
            searchPlaceholder="Cari nama lembaga pemohon atau pimpinan..."
            searchableKey={(item) => `${item.namaLembaga} ${item.namaPimpinan} ${item.email}`}
          />
        </div>
      )}

      {/* Tab Content 3: Audit Logs */}
      {currentTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audit Log & Rekam Jejak Tindakan</h3>
              <p className="text-xs text-slate-500">Pencatatan mutlak untuk pembuatan lembaga, persetujuan, penolakan, dan penangguhan.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Penyimpanan Terproteksi</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.aksi.includes('APPROVE') || log.aksi.includes('ACTIVATE')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.aksi.includes('SUSPEND') || log.aksi.includes('REJECT')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {log.aksi}
                    </span>
                    <span className="font-bold text-slate-900">{log.target}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{log.detail}</p>
                </div>
                <div className="text-right sm:self-center shrink-0">
                  <p className="text-slate-700 font-medium">{log.actorName}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{log.waktu}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Tambah Lembaga Langsung (Super Admin) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Lembaga Baru (Super Admin)"
        subtitle="Daftarkan lembaga baru langsung ke dalam sistem dengan administrator utama."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInstitution} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lembaga *
              </label>
              <input
                type="text"
                required
                value={createForm.nama}
                onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
                placeholder="Contoh: Pondok Pesantren Baitul Qur'an"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Lembaga
              </label>
              <select
                value={createForm.jenis}
                onChange={(e) => setCreateForm({ ...createForm, jenis: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                {JENIS_LEMBAGA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota / Kabupaten *
              </label>
              <input
                type="text"
                required
                value={createForm.kota}
                onChange={(e) => setCreateForm({ ...createForm, kota: e.target.value })}
                placeholder="Contoh: Surakarta"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Provinsi *
              </label>
              <input
                type="text"
                required
                value={createForm.provinsi}
                onChange={(e) => setCreateForm({ ...createForm, provinsi: e.target.value })}
                placeholder="Jawa Tengah"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              value={createForm.alamat}
              onChange={(e) => setCreateForm({ ...createForm, alamat: e.target.value })}
              placeholder="Jl. Raya No. ..., Kecamatan"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / Hotline
              </label>
              <input
                type="tel"
                value={createForm.nomorTelepon}
                onChange={(e) => setCreateForm({ ...createForm, nomorTelepon: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Resmi Lembaga
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="kontak@pesantren.id"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Administrator Utama */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-900">Administrator Utama Lembaga</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Administrator *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.adminName}
                  onChange={(e) => setCreateForm({ ...createForm, adminName: e.target.value })}
                  placeholder="Ustaz Penanggung Jawab"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Administrator *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.adminEmail}
                  onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                  placeholder="admin@pesantren.id"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Hafalan
              </label>
              <select
                value={createForm.metodeHafalan}
                onChange={(e) => setCreateForm({ ...createForm, metodeHafalan: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                {METODE_HAFALAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Awal
              </label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="active">Aktif (Dapat Beroperasi Langsung)</option>
                <option value="suspended">Ditangguhkan (Perlu Review Tambahan)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-xs"
            >
              Simpan & Daftarkan Lembaga
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Detail Permohonan Pendaftaran & Aksi */}
      {selectedApp && (
        <Modal
          isOpen={showDetailAppModal}
          onClose={() => setShowDetailAppModal(false)}
          title={`Detail Permohonan: ${selectedApp.namaLembaga}`}
          subtitle={`Diajukan pada ${selectedApp.tanggalPengajuan}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Status: {selectedApp.status.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                {selectedApp.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    >
                      Tolak Permohonan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveApplication(selectedApp)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-xs"
                    >
                      Setujui & Aktifkan Lembaga
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDetailAppModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Lembaga:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedApp.namaLembaga}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jenis:</span>
                <span className="font-semibold text-slate-800 capitalize">{selectedApp.jenisLembaga}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pimpinan / Mudir:</span>
                <span className="font-semibold text-slate-800">{selectedApp.namaPimpinan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kontak / WA:</span>
                <span className="font-mono text-slate-800">{selectedApp.telepon}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-lg space-y-1">
              <span className="text-blue-950 font-bold block text-xs">Calon Administrator Lembaga:</span>
              <p className="text-slate-800">Nama: <strong>{selectedApp.namaAdmin || selectedApp.namaPimpinan}</strong></p>
              <p className="text-slate-800">Email: <span className="font-mono">{selectedApp.emailAdmin || selectedApp.email}</span></p>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Alamat & Wilayah:</span>
              <p className="text-slate-800 mt-0.5">{selectedApp.alamat}, {selectedApp.kota}, {selectedApp.provinsi}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Metode Hafalan:</span>
                <span className="font-semibold text-slate-800">{selectedApp.metodeHafalan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Estimasi Santri:</span>
                <span className="font-semibold text-slate-800">{selectedApp.estimasiSantri} Santri</span>
              </div>
            </div>

            {selectedApp.catatanReview && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-950 font-bold block text-xs">Catatan Review:</span>
                <p className="text-amber-900 mt-0.5">{selectedApp.catatanReview}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal 3: Input Alasan Penolakan */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Tolak Permohonan Pendaftaran"
        subtitle="Berikan alasan yang jelas mengapa permohonan ini belum dapat disetujui."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              Konfirmasi Tolak
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Alasan penolakan akan dicatat dalam audit log dan disampaikan kepada perwakilan lembaga.
          </p>
          <textarea
            rows={3}
            required
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Contoh: Dokumen izin operasional Kemenag belum lengkap atau nomor kontak tidak dapat dihubungi."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </Modal>

      {/* Modal 4: Konfirmasi Penangguhan / Pengaktifan Lembaga */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleConfirmStatusChange}
        title={targetStatus === 'suspended' ? 'Tangguhkan Lembaga' : 'Aktifkan Kembali Lembaga'}
        message={
          targetStatus === 'suspended'
            ? `Apakah Anda yakin ingin menangguhkan akses untuk "${selectedInstitution?.nama}"? Lembaga yang ditangguhkan tidak akan dapat menginput setoran atau menjalankan aktivitas operasional baru, namun seluruh data historis tetap aman tersimpan.`
            : `Aktifkan kembali akses operasional untuk "${selectedInstitution?.nama}"? Seluruh admin dan ustaz akan dapat mengakses dashboard dan setoran kembali.`
        }
        confirmText={targetStatus === 'suspended' ? 'Tangguhkan Akses' : 'Aktifkan Lembaga'}
        variant={targetStatus === 'suspended' ? 'danger' : 'primary'}
      />
    </div>
  );
}
