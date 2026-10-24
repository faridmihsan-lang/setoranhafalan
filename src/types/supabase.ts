export type DbInstitutionType = 'pesantren' | 'rumah_tahfiz' | 'sekolah_islam' | 'madrasah' | 'halaqah';
export type DbInstitutionStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type DbMembershipRole = 'institution_admin' | 'teacher' | 'guardian' | 'student';
export type DbMembershipStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type DbApplicationStatus = 'pending' | 'approved' | 'rejected';
export type DbSetoranType = 'ziyadah' | 'murajaah' | 'tasmi';

export interface DbInstitution {
  id: string;
  name: string;
  slug: string;
  type: DbInstitutionType;
  address?: string | null;
  city: string;
  province: string;
  phone?: string | null;
  email?: string | null;
  status: DbInstitutionStatus;
  subscription_tier: 'trial' | 'standard' | 'premium' | 'enterprise';
  logo_url?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbInstitutionMembership {
  id: string;
  institution_id: string;
  user_id: string;
  role: DbMembershipRole;
  status: DbMembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface DbInstitutionApplication {
  id: string;
  applicant_user_id?: string | null;
  institution_name: string;
  institution_type: DbInstitutionType;
  leader_name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  admin_name?: string | null;
  admin_email?: string | null;
  method: string;
  estimated_students: string;
  status: DbApplicationStatus;
  reviewed_by?: string | null;
  review_notes?: string | null;
  approved_institution_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInstitutionSettings {
  id: string;
  institution_id: string;
  target_method: string;
  passing_grade_tajwid: number;
  passing_grade_kelancaran: number;
  passing_grade_makhraj: number;
  whatsapp_notification_enabled: boolean;
  allow_parent_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  institution_id?: string | null;
  actor_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface DbHalaqah {
  id: string;
  institution_id: string;
  teacher_id?: string | null;
  name: string;
  level: string;
  schedule?: string | null;
  room?: string | null;
  created_at: string;
}

export interface DbStudent {
  id: string;
  institution_id: string;
  user_id?: string | null;
  guardian_user_id?: string | null;
  halaqah_id?: string | null;
  nis: string;
  full_name: string;
  gender: 'L' | 'P';
  guardian_name?: string | null;
  guardian_phone?: string | null;
  target_juz: number;
  status: 'active' | 'leave' | 'graduated' | 'suspended';
  created_at: string;
}

export interface DbMemorizationRecord {
  id: string;
  institution_id: string;
  student_id: string;
  teacher_id: string;
  type: DbSetoranType;
  juz: number;
  surah_start: string;
  ayah_start: number;
  surah_end: string;
  ayah_end: number;
  pages_count: number;
  grade: string;
  score_kelancaran: number;
  score_tajwid: number;
  score_makhraj: number;
  notes?: string | null;
  recorded_at: string;
}
