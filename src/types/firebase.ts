export type DbInstitutionType = 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
export type DbInstitutionStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type DbMembershipRole = 'institution_admin' | 'teacher' | 'guardian' | 'student';
export type DbMembershipStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type DbApplicationStatus = 'pending' | 'approved' | 'rejected';
export type DbSetoranType = 'ziyadah' | 'murajaah' | 'tasmi';

export interface FirebaseInstitution {
  id: string;
  name: string;
  slug: string;
  type: DbInstitutionType;
  address?: string;
  city: string;
  province: string;
  phone?: string;
  email?: string;
  status: DbInstitutionStatus;
  subscriptionTier: 'trial' | 'standard' | 'premium' | 'enterprise';
  logoUrl?: string;
  adminName?: string;
  adminEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseInstitutionMembership {
  id: string;
  institutionId: string;
  userId: string;
  role: DbMembershipRole;
  status: DbMembershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseInstitutionApplication {
  id: string;
  applicantUserId?: string;
  institutionName: string;
  institutionType: DbInstitutionType;
  leaderName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  adminName?: string;
  adminEmail?: string;
  method: string;
  estimatedStudents: string;
  status: DbApplicationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedInstitutionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseInstitutionSettings {
  id: string;
  institutionId: string;
  targetMethod: string;
  passingGradeTajwid: number;
  passingGradeKelancaran: number;
  passingGradeMakhraj: number;
  whatsappNotificationEnabled: boolean;
  allowParentView: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseAuditLog {
  id: string;
  institutionId?: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown> | string;
  createdAt: string;
}

export interface FirebaseHalaqah {
  id: string;
  institutionId: string;
  teacherId?: string;
  name: string;
  level: string;
  schedule?: string;
  room?: string;
  createdAt: string;
}

export interface FirebaseStudent {
  id: string;
  institutionId: string;
  userId?: string;
  guardianUserId?: string;
  halaqahId?: string;
  nis: string;
  fullName: string;
  gender: 'L' | 'P';
  guardianName?: string;
  guardianPhone?: string;
  targetJuz: number;
  status: 'active' | 'leave' | 'graduated' | 'suspended';
  createdAt: string;
}

export interface FirebaseMemorizationRecord {
  id: string;
  institutionId: string;
  studentId: string;
  teacherId: string;
  type: DbSetoranType;
  juz: number;
  surahStart: string;
  ayahStart: number;
  surahEnd: string;
  ayahEnd: number;
  pagesCount: number;
  grade: string;
  scoreKelancaran: number;
  scoreTajwid: number;
  scoreMakhraj: number;
  notes?: string;
  recordedAt: string;
}
