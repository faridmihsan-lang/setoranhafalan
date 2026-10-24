import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { Lembaga, InstitutionApplication, InstitutionStatus } from '../types';
import { MOCK_LEMBAGA_LIST, MOCK_APPLICATIONS_LIST, MOCK_AUDIT_LOG_LIST } from '../lib/mockData';

export interface CreateInstitutionInput {
  nama: string;
  jenis: 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
  alamat: string;
  kota: string;
  provinsi: string;
  nomorTelepon: string;
  email: string;
  adminName: string;
  adminEmail: string;
  metodeHafalan: 'Utsmani' | 'Indo-Pak' | 'Sabaq-Sabqi-Manzil' | 'Talaqqi Kemenag';
  status?: InstitutionStatus;
  logoUrl?: string;
}

export interface PublicApplicationInput {
  namaLembaga: string;
  jenisLembaga: 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
  namaPimpinan: string;
  email: string;
  telepon: string;
  alamat: string;
  kota: string;
  provinsi: string;
  namaAdmin: string;
  emailAdmin: string;
  metodeHafalan: string;
  estimasiSantri: string;
}

export interface AuditLogItem {
  id: string;
  aksi: string;
  entity: string;
  target: string;
  actorName: string;
  waktu: string;
  detail: string;
}

// Stateful cache synchronized with Firebase
let localInstitutions: Lembaga[] = [...MOCK_LEMBAGA_LIST];
let localApplications: InstitutionApplication[] = [...MOCK_APPLICATIONS_LIST];
let localAuditLogs: AuditLogItem[] = [...MOCK_AUDIT_LOG_LIST];

export class InstitutionService {
  /**
   * Fetch list of institutions from Firestore
   */
  static async getInstitutions(statusFilter?: string, search?: string): Promise<Lembaga[]> {
    if (isFirebaseConfigured) {
      try {
        const instCol = collection(db, 'institutions');
        let q = query(instCol, orderBy('createdAt', 'desc'));

        if (statusFilter && statusFilter !== 'all') {
          q = query(instCol, where('status', '==', statusFilter));
        }

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const list: Lembaga[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              nama: d.name || 'Lembaga Tanpa Nama',
              slug: d.slug || docSnap.id,
              jenis: d.type || 'pesantren',
              alamat: d.address || '',
              kota: d.city || '',
              provinsi: d.province || '',
              nomorTelepon: d.phone || '',
              email: d.email || '',
              status: d.status || 'active',
              statusLangganan: d.status === 'active' ? 'aktif' : 'kedaluwarsa',
              adminName: d.adminName || 'Admin Lembaga',
              adminEmail: d.adminEmail || d.email || '',
              totalSantri: d.totalSantri || 0,
              totalUstaz: d.totalUstaz || 0,
              tanggalBergabung: d.createdAt ? d.createdAt.split('T')[0] : '',
              metodeHafalan: d.method || 'Sabaq-Sabqi-Manzil',
              logoUrl: d.logoUrl
            });
          });

          if (list.length > 0) {
            localInstitutions = list;
          }
        }
      } catch (err) {
        console.warn('Firestore getInstitutions fallback to stateful memory:', err);
      }
    }

    return localInstitutions.filter((item) => {
      const matchStatus = !statusFilter || statusFilter === 'all' || item.status === statusFilter;
      const matchSearch =
        !search ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        item.kota.toLowerCase().includes(search.toLowerCase()) ||
        (item.adminName && item.adminName.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }

  /**
   * Fetch applications list from Firestore
   */
  static async getApplications(statusFilter?: string): Promise<InstitutionApplication[]> {
    if (isFirebaseConfigured) {
      try {
        const appsCol = collection(db, 'institution_applications');
        let q = query(appsCol, orderBy('createdAt', 'desc'));

        if (statusFilter && statusFilter !== 'all') {
          q = query(appsCol, where('status', '==', statusFilter));
        }

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const list: InstitutionApplication[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              namaLembaga: d.institutionName,
              jenisLembaga: d.institutionType,
              namaPimpinan: d.leaderName,
              email: d.email,
              telepon: d.phone,
              alamat: d.address,
              kota: d.city,
              provinsi: d.province,
              namaAdmin: d.adminName || d.leaderName,
              emailAdmin: d.adminEmail || d.email,
              metodeHafalan: d.method || 'Sabaq-Sabqi-Manzil',
              estimasiSantri: d.estimatedStudents || '51-200',
              status: d.status || 'pending',
              catatanReview: d.reviewNotes,
              tanggalPengajuan: d.createdAt ? d.createdAt.slice(0, 16).replace('T', ' ') : '',
              approvedInstitutionId: d.approvedInstitutionId
            });
          });

          if (list.length > 0) {
            localApplications = list;
          }
        }
      } catch (err) {
        console.warn('Firestore getApplications fallback:', err);
      }
    }

    return localApplications.filter((app) => {
      if (!statusFilter || statusFilter === 'all') return true;
      return app.status === statusFilter;
    });
  }

  /**
   * Direct Institution Creation by Super Admin
   */
  static async createInstitutionDirect(
    input: CreateInstitutionInput,
    actorId?: string,
    actorName?: string
  ): Promise<{ success: boolean; data?: Lembaga; error?: string }> {
    const slug = input.nama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newId = `inst-${Date.now()}`;
    const newInst: Lembaga = {
      id: newId,
      nama: input.nama,
      slug: slug || `lembaga-${Date.now()}`,
      jenis: input.jenis,
      alamat: input.alamat,
      kota: input.kota,
      provinsi: input.provinsi,
      nomorTelepon: input.nomorTelepon,
      email: input.email,
      status: input.status || 'active',
      statusLangganan: input.status === 'suspended' ? 'kedaluwarsa' : 'aktif',
      adminName: input.adminName,
      adminEmail: input.adminEmail,
      totalSantri: 0,
      totalUstaz: 0,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      metodeHafalan: input.metodeHafalan,
      logoUrl: input.logoUrl
    };

    if (isFirebaseConfigured) {
      try {
        const instRef = doc(db, 'institutions', newId);
        await setDoc(instRef, {
          name: input.nama,
          slug: newInst.slug,
          type: input.jenis,
          address: input.alamat,
          city: input.kota,
          province: input.provinsi,
          phone: input.nomorTelepon,
          email: input.email,
          adminName: input.adminName,
          adminEmail: input.adminEmail,
          status: input.status || 'active',
          subscriptionTier: 'standard',
          logoUrl: input.logoUrl || '',
          method: input.metodeHafalan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Set settings subcollection
        await setDoc(doc(db, 'institutions', newId, 'settings', 'general'), {
          institutionId: newId,
          targetMethod: input.metodeHafalan,
          passingGradeTajwid: 75,
          passingGradeKelancaran: 80,
          passingGradeMakhraj: 75,
          createdAt: new Date().toISOString()
        });

        // Record Audit Log
        await setDoc(doc(db, 'audit_logs', `aud-${Date.now()}`), {
          institutionId: newId,
          actorId: actorId || 'super-admin',
          action: 'CREATE_INSTITUTION',
          entity: 'institutions',
          entityId: newId,
          details: { name: input.nama, admin: input.adminName },
          createdAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore createInstitutionDirect error:', err);
      }
    }

    localInstitutions = [newInst, ...localInstitutions];

    localAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      aksi: 'CREATE_INSTITUTION',
      entity: 'institutions',
      target: newInst.nama,
      actorName: actorName || 'Super Admin',
      waktu: 'Baru saja',
      detail: `Lembaga dibuat langsung oleh Super Admin dengan administrator utama: ${input.adminName}`
    });

    return { success: true, data: newInst };
  }

  /**
   * Submit Public Self-Registration Application (status pending)
   */
  static async submitPublicApplication(
    input: PublicApplicationInput
  ): Promise<{ success: boolean; data?: InstitutionApplication; error?: string }> {
    const existing = localApplications.find(
      (a) =>
        a.status === 'pending' &&
        (a.email.toLowerCase() === input.email.toLowerCase() ||
          a.emailAdmin?.toLowerCase() === input.emailAdmin.toLowerCase())
    );

    if (existing) {
      return {
        success: false,
        error: `Permohonan pendaftaran untuk email ${input.email} sudah pernah diajukan dan sedang dalam antrean verifikasi.`
      };
    }

    const appId = `app-${Date.now()}`;
    const newApp: InstitutionApplication = {
      id: appId,
      namaLembaga: input.namaLembaga,
      jenisLembaga: input.jenisLembaga,
      namaPimpinan: input.namaPimpinan,
      email: input.email,
      telepon: input.telepon,
      alamat: input.alamat,
      kota: input.kota,
      provinsi: input.provinsi,
      namaAdmin: input.namaAdmin,
      emailAdmin: input.emailAdmin,
      metodeHafalan: input.metodeHafalan,
      estimasiSantri: input.estimasiSantri,
      status: 'pending',
      tanggalPengajuan: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    if (isFirebaseConfigured) {
      try {
        const appRef = doc(db, 'institution_applications', appId);
        await setDoc(appRef, {
          institutionName: input.namaLembaga,
          institutionType: input.jenisLembaga,
          leaderName: input.namaPimpinan,
          email: input.email,
          phone: input.telepon,
          address: input.alamat,
          city: input.kota,
          province: input.provinsi,
          adminName: input.namaAdmin,
          adminEmail: input.emailAdmin,
          method: input.metodeHafalan,
          estimatedStudents: input.estimasiSantri,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore submitPublicApplication error:', err);
      }
    }

    localApplications = [newApp, ...localApplications];
    return { success: true, data: newApp };
  }

  /**
   * Super Admin approves an institution application (Idempotent)
   */
  static async approveApplication(
    applicationId: string,
    reviewerId?: string,
    reviewerName?: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; institutionId?: string; message?: string; error?: string }> {
    const app = localApplications.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, error: 'Permohonan tidak ditemukan.' };
    }

    // Idempotency: If already approved, return previous institution
    if (app.status === 'approved' && app.approvedInstitutionId) {
      return {
        success: true,
        institutionId: app.approvedInstitutionId,
        message: 'Permohonan sudah pernah disetujui sebelumnya (idempoten).'
      };
    }

    const instId = `inst-${Date.now()}`;
    const slug = app.namaLembaga
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newInst: Lembaga = {
      id: instId,
      nama: app.namaLembaga,
      slug: slug || `lembaga-${Date.now()}`,
      jenis: app.jenisLembaga,
      alamat: app.alamat,
      kota: app.kota,
      provinsi: app.provinsi,
      nomorTelepon: app.telepon,
      email: app.email,
      status: 'active',
      statusLangganan: 'aktif',
      adminName: app.namaAdmin || app.namaPimpinan,
      adminEmail: app.emailAdmin || app.email,
      totalSantri: 0,
      totalUstaz: 0,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      metodeHafalan: (app.metodeHafalan as any) || 'Sabaq-Sabqi-Manzil'
    };

    if (isFirebaseConfigured) {
      try {
        // 1. Create Institution document
        await setDoc(doc(db, 'institutions', instId), {
          name: app.namaLembaga,
          slug: newInst.slug,
          type: app.jenisLembaga,
          address: app.alamat,
          city: app.kota,
          province: app.provinsi,
          phone: app.telepon,
          email: app.email,
          adminName: app.namaAdmin || app.namaPimpinan,
          adminEmail: app.emailAdmin || app.email,
          status: 'active',
          subscriptionTier: 'standard',
          method: app.metodeHafalan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // 2. Initial curriculum settings
        await setDoc(doc(db, 'institutions', instId, 'settings', 'general'), {
          institutionId: instId,
          targetMethod: app.metodeHafalan,
          passingGradeTajwid: 75,
          passingGradeKelancaran: 80,
          passingGradeMakhraj: 75,
          createdAt: new Date().toISOString()
        });

        // 3. Update application status
        await updateDoc(doc(db, 'institution_applications', applicationId), {
          status: 'approved',
          approvedInstitutionId: instId,
          reviewedBy: reviewerId || 'super-admin',
          reviewNotes: reviewNotes || 'Disetujui oleh Super Admin',
          updatedAt: new Date().toISOString()
        });

        // 4. Audit Log
        await setDoc(doc(db, 'audit_logs', `aud-${Date.now()}`), {
          institutionId: instId,
          actorId: reviewerId || 'super-admin',
          action: 'APPROVE_APPLICATION',
          entity: 'institutions',
          entityId: instId,
          details: {
            applicationId,
            institutionName: app.namaLembaga,
            reviewNotes
          },
          createdAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore approveApplication error:', err);
      }
    }

    localInstitutions = [newInst, ...localInstitutions];

    app.status = 'approved';
    app.approvedInstitutionId = newInst.id;
    app.catatanReview = reviewNotes || 'Disetujui oleh Super Admin.';

    localAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      aksi: 'APPROVE_APPLICATION',
      entity: 'institutions',
      target: app.namaLembaga,
      actorName: reviewerName || 'Super Admin',
      waktu: 'Baru saja',
      detail: `Permohonan pendaftaran disetujui. Lembaga ${app.namaLembaga} aktif di Firebase dan siap digunakan.`
    });

    return {
      success: true,
      institutionId: newInst.id,
      message: 'Permohonan berhasil disetujui dan lembaga telah diaktifkan di Firebase Firestore.'
    };
  }

  /**
   * Super Admin rejects an institution application
   */
  static async rejectApplication(
    applicationId: string,
    reviewerId?: string,
    reviewerName?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const app = localApplications.find((a) => a.id === applicationId);
    if (!app) {
      return { success: false, error: 'Permohonan tidak ditemukan.' };
    }

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'institution_applications', applicationId), {
          status: 'rejected',
          reviewedBy: reviewerId || 'super-admin',
          reviewNotes: rejectionReason || 'Dokumen belum memenuhi kualifikasi.',
          updatedAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'audit_logs', `aud-${Date.now()}`), {
          actorId: reviewerId || 'super-admin',
          action: 'REJECT_APPLICATION',
          entity: 'institution_applications',
          entityId: applicationId,
          details: { rejectionReason },
          createdAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore rejectApplication error:', err);
      }
    }

    app.status = 'rejected';
    app.catatanReview = rejectionReason || 'Permohonan ditolak oleh Super Admin.';

    localAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      aksi: 'REJECT_APPLICATION',
      entity: 'institution_applications',
      target: app.namaLembaga,
      actorName: reviewerName || 'Super Admin',
      waktu: 'Baru saja',
      detail: `Permohonan ditolak. Alasan: "${rejectionReason || 'Tidak memenuhi kualifikasi'}"`
    });

    return {
      success: true,
      message: 'Permohonan pendaftaran lembaga telah ditolak.'
    };
  }

  /**
   * Update institution status (active, suspended, pending, rejected)
   */
  static async updateInstitutionStatus(
    institutionId: string,
    newStatus: InstitutionStatus,
    actorId?: string,
    actorName?: string,
    reason?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const inst = localInstitutions.find((i) => i.id === institutionId);
    if (!inst) {
      return { success: false, error: 'Lembaga tidak ditemukan.' };
    }

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'institutions', institutionId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'audit_logs', `aud-${Date.now()}`), {
          institutionId,
          actorId: actorId || 'super-admin',
          action: newStatus === 'suspended' ? 'SUSPEND_INSTITUTION' : 'ACTIVATE_INSTITUTION',
          entity: 'institutions',
          entityId: institutionId,
          details: { newStatus, reason },
          createdAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore updateInstitutionStatus error:', err);
      }
    }

    const oldStatus = inst.status;
    inst.status = newStatus;
    inst.statusLangganan = newStatus === 'active' ? 'aktif' : 'kedaluwarsa';

    const actionName =
      newStatus === 'suspended'
        ? 'SUSPEND_INSTITUTION'
        : newStatus === 'active'
        ? 'ACTIVATE_INSTITUTION'
        : 'CHANGE_STATUS_INSTITUTION';

    localAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      aksi: actionName,
      entity: 'institutions',
      target: inst.nama,
      actorName: actorName || 'Super Admin',
      waktu: 'Baru saja',
      detail: `Perubahan status lembaga dari ${oldStatus} menjadi ${newStatus}. Alasan: ${reason || 'Instruksi manajemen'}`
    });

    return {
      success: true,
      message: `Status lembaga ${inst.nama} kini telah diubah menjadi ${newStatus.toUpperCase()}.`
    };
  }

  /**
   * Update institution profile details
   */
  static async updateInstitutionProfile(
    institutionId: string,
    updates: Partial<Lembaga>,
    actorName?: string
  ): Promise<{ success: boolean; data?: Lembaga; error?: string }> {
    const instIndex = localInstitutions.findIndex((i) => i.id === institutionId);
    if (instIndex === -1) {
      return { success: false, error: 'Lembaga tidak ditemukan.' };
    }

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'institutions', institutionId), {
          name: updates.nama,
          address: updates.alamat,
          city: updates.kota,
          province: updates.provinsi,
          phone: updates.nomorTelepon,
          email: updates.email,
          type: updates.jenis,
          logoUrl: updates.logoUrl || '',
          updatedAt: new Date().toISOString()
        });
      } catch (err: unknown) {
        console.warn('Firestore updateInstitutionProfile error:', err);
      }
    }

    localInstitutions[instIndex] = {
      ...localInstitutions[instIndex],
      ...updates
    };

    localAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      aksi: 'UPDATE_INSTITUTION_PROFILE',
      entity: 'institutions',
      target: localInstitutions[instIndex].nama,
      actorName: actorName || 'Admin Lembaga',
      waktu: 'Baru saja',
      detail: 'Pembaruan profil identitas, alamat, atau logo lembaga di Firebase Firestore.'
    });

    return { success: true, data: localInstitutions[instIndex] };
  }

  /**
   * Fetch Audit Logs from Firestore
   */
  static async getAuditLogs(): Promise<AuditLogItem[]> {
    if (isFirebaseConfigured) {
      try {
        const logsCol = collection(db, 'audit_logs');
        const q = query(logsCol, orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const list: AuditLogItem[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              aksi: d.action || 'SISTEM',
              entity: d.entity || 'Umum',
              target: d.entityId || 'Sistem',
              actorName: d.actorId ? 'Pengguna Terverifikasi' : 'Super Admin',
              waktu: d.createdAt ? d.createdAt.slice(0, 16).replace('T', ' ') : 'Baru saja',
              detail: typeof d.details === 'string' ? d.details : JSON.stringify(d.details)
            });
          });

          if (list.length > 0) {
            return list;
          }
        }
      } catch (err) {
        console.warn('Firestore getAuditLogs fallback:', err);
      }
    }

    return localAuditLogs;
  }
}
