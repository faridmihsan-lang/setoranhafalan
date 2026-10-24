-- ==============================================================================
-- SISTEM HAFALAN SANTRI DIGITAL (MULTI-TENANT & RLS DATABASE SCHEMA)
-- Compatible with Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CORE ENUMS / TYPES (Using text with CHECK constraints for maximum flexibility)
-- Roles: super_admin (global), institution_admin, teacher, guardian, student
-- Institution Status: active, trial, suspended, pending_verification
-- Setoran Type: ziyadah, murajaah, tasmi

-- ==============================================================================
-- 3. CORE MULTI-TENANT TABLES
-- ==============================================================================

-- Table: institutions (Lembaga: Pesantren, Rumah Tahfiz, Sekolah Islam, Madrasah)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pesantren', 'rumah_tahfiz', 'sekolah_islam', 'madrasah', 'halaqah')),
    address TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended', 'pending_verification')),
    subscription_tier TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'standard', 'premium', 'enterprise')),
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: profiles (Extends auth.users, holds universal identity)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: institution_memberships (Tenant-level user binding with strict roles)
CREATE TABLE IF NOT EXISTS public.institution_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('institution_admin', 'teacher', 'guardian', 'student')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_role_per_institution UNIQUE (institution_id, user_id, role)
);

-- Table: institution_applications (Public or applicant onboarding submissions)
CREATE TABLE IF NOT EXISTS public.institution_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    institution_name TEXT NOT NULL,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('pesantren', 'rumah_tahfiz', 'sekolah_islam', 'madrasah', 'halaqah')),
    leader_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    address TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'Sabaq-Sabqi-Manzil',
    estimated_students TEXT NOT NULL DEFAULT '51-200',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: institution_settings (Tenant-specific curriculum & notification configurations)
CREATE TABLE IF NOT EXISTS public.institution_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID UNIQUE NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    target_method TEXT NOT NULL DEFAULT 'Sabaq-Sabqi-Manzil',
    passing_grade_tajwid INTEGER NOT NULL DEFAULT 75,
    passing_grade_kelancaran INTEGER NOT NULL DEFAULT 80,
    passing_grade_makhraj INTEGER NOT NULL DEFAULT 75,
    whatsapp_notification_enabled BOOLEAN NOT NULL DEFAULT true,
    allow_parent_view BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: audit_logs (Tamper-evident system tracking for operations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. OPERATIONAL TAHFIZ TABLES (ALL CONTAIN institution_id)
-- ==============================================================================

-- Table: halaqahs (Study groups under an institution)
CREATE TABLE IF NOT EXISTS public.halaqahs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Menengah',
    schedule TEXT,
    room TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: students (Santri records)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guardian_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    halaqah_id UUID REFERENCES public.halaqahs(id) ON DELETE SET NULL,
    nis TEXT NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
    guardian_name TEXT,
    guardian_phone TEXT,
    target_juz INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'leave', 'graduated', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_nis_per_institution UNIQUE (institution_id, nis)
);

-- Table: memorization_records (Setoran Hafalan)
CREATE TABLE IF NOT EXISTS public.memorization_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('ziyadah', 'murajaah', 'tasmi')),
    juz INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
    surah_start TEXT NOT NULL,
    ayah_start INTEGER NOT NULL CHECK (ayah_start >= 1),
    surah_end TEXT NOT NULL,
    ayah_end INTEGER NOT NULL CHECK (ayah_end >= 1),
    pages_count NUMERIC(4,1) NOT NULL DEFAULT 1.0,
    grade TEXT NOT NULL,
    score_kelancaran INTEGER NOT NULL CHECK (score_kelancaran BETWEEN 0 AND 100),
    score_tajwid INTEGER NOT NULL CHECK (score_tajwid BETWEEN 0 AND 100),
    score_makhraj INTEGER NOT NULL CHECK (score_makhraj BETWEEN 0 AND 100),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table: student_mutqin_juz (Juz that have been tested and certified as Mutqin)
CREATE TABLE IF NOT EXISTS public.student_mutqin_juz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    juz INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
    certified_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    CONSTRAINT unique_student_mutqin_juz UNIQUE (student_id, juz)
);

-- ==============================================================================
-- 5. INDEXES FOR MULTI-TENANT QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_memberships_inst_user ON public.institution_memberships(institution_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.institution_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_students_institution ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_halaqah ON public.students(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_students_guardian ON public.students(guardian_user_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_setoran_institution ON public.memorization_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_setoran_student ON public.memorization_records(student_id);
CREATE INDEX IF NOT EXISTS idx_setoran_teacher ON public.memorization_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_halaqahs_institution ON public.halaqahs(institution_id);
CREATE INDEX IF NOT EXISTS idx_halaqahs_teacher ON public.halaqahs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_institution ON public.audit_logs(institution_id);

-- ==============================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS (ANTI-RECURSION FOR RLS)
-- ==============================================================================

-- Check if current authenticated user is a Global Super Admin
CREATE OR REPLACE FUNCTION public.auth_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Check if user is an active member of an institution
CREATE OR REPLACE FUNCTION public.auth_is_institution_member(target_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_memberships
    WHERE institution_id = target_institution_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Check if user holds a specific role in an institution
CREATE OR REPLACE FUNCTION public.auth_has_institution_role(target_institution_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_memberships
    WHERE institution_id = target_institution_id
      AND user_id = auth.uid()
      AND role = required_role
      AND status = 'active'
  );
$$;

-- Check if user is an admin of an institution (or Super Admin)
CREATE OR REPLACE FUNCTION public.auth_is_admin_or_super(target_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.auth_is_super_admin() OR public.auth_has_institution_role(target_institution_id, 'institution_admin'));
$$;

-- Check if teacher is assigned to a halaqah or directly to a student
CREATE OR REPLACE FUNCTION public.auth_is_teacher_of_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.halaqahs h ON s.halaqah_id = h.id
    WHERE s.id = target_student_id
      AND h.teacher_id = auth.uid()
  );
$$;

-- Check if current user is guardian of target student
CREATE OR REPLACE FUNCTION public.auth_is_guardian_of_student(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = target_student_id
      AND guardian_user_id = auth.uid()
  );
$$;

-- Check if current user is the student record owner
CREATE OR REPLACE FUNCTION public.auth_is_student_self(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = target_student_id
      AND user_id = auth.uid()
  );
$$;

-- ==============================================================================
-- 7. TRIGGERS: AUTOMATIC PROFILE CREATION & ANTI-SELF-ESCALATION
-- ==============================================================================

-- Auto create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_super_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    false -- Super admin CANNOT be set via registration metadata
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent users from escalating their own is_super_admin flag
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_super_admin is being altered
  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
    -- Only existing super admin can alter this flag
    IF NOT public.auth_is_super_admin() THEN
      RAISE EXCEPTION 'Otorisasi ditolak: Pengguna tidak dapat menaikkan hak akses Super Admin secara mandiri.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_protection ON public.profiles;
CREATE TRIGGER on_profile_role_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mutqin_juz ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. POLICIES: institutions
-- ------------------------------------------------------------------------------
-- Public/Members can read active institutions they belong to; super admin reads all
CREATE POLICY "Super admins can manage all institutions"
ON public.institutions FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Members can view their own institution"
ON public.institutions FOR SELECT
TO authenticated
USING (public.auth_is_institution_member(id));

-- ------------------------------------------------------------------------------
-- B. POLICIES: profiles
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.auth_is_super_admin());

CREATE POLICY "Members in same institution can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.institution_memberships my_m
    JOIN public.institution_memberships target_m ON my_m.institution_id = target_m.institution_id
    WHERE my_m.user_id = auth.uid()
      AND target_m.user_id = profiles.id
      AND my_m.status = 'active'
  )
);

CREATE POLICY "Users can update their own profile details"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- C. POLICIES: institution_memberships
-- ------------------------------------------------------------------------------
CREATE POLICY "Super admins have full access to memberships"
ON public.institution_memberships FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Users can view their own memberships"
ON public.institution_memberships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Institution admins can view all memberships in their institution"
ON public.institution_memberships FOR SELECT
TO authenticated
USING (public.auth_has_institution_role(institution_id, 'institution_admin'));

CREATE POLICY "Institution admins can manage memberships in their institution"
ON public.institution_memberships FOR INSERT
TO authenticated
WITH CHECK (public.auth_has_institution_role(institution_id, 'institution_admin'));

CREATE POLICY "Institution admins can update memberships in their institution"
ON public.institution_memberships FOR UPDATE
TO authenticated
USING (public.auth_has_institution_role(institution_id, 'institution_admin'))
WITH CHECK (public.auth_has_institution_role(institution_id, 'institution_admin'));

CREATE POLICY "Institution admins can delete memberships in their institution"
ON public.institution_memberships FOR DELETE
TO authenticated
USING (public.auth_has_institution_role(institution_id, 'institution_admin'));

-- ------------------------------------------------------------------------------
-- D. POLICIES: institution_applications
-- ------------------------------------------------------------------------------
CREATE POLICY "Super admins can manage all applications"
ON public.institution_applications FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Applicants can view their own application"
ON public.institution_applications FOR SELECT
TO authenticated
USING (applicant_user_id = auth.uid());

CREATE POLICY "Anyone authenticated or anonymous can submit an application"
ON public.institution_applications FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- E. POLICIES: halaqahs
-- ------------------------------------------------------------------------------
CREATE POLICY "Super admin and Institution admin manage halaqahs"
ON public.halaqahs FOR ALL
TO authenticated
USING (public.auth_is_admin_or_super(institution_id))
WITH CHECK (public.auth_is_admin_or_super(institution_id));

CREATE POLICY "Institution members can view halaqahs"
ON public.halaqahs FOR SELECT
TO authenticated
USING (public.auth_is_institution_member(institution_id));

-- ------------------------------------------------------------------------------
-- F. POLICIES: students
-- ------------------------------------------------------------------------------
CREATE POLICY "Institution admin manages students"
ON public.students FOR ALL
TO authenticated
USING (public.auth_is_admin_or_super(institution_id))
WITH CHECK (public.auth_is_admin_or_super(institution_id));

CREATE POLICY "Teachers can view students in their institution or halaqah"
ON public.students FOR SELECT
TO authenticated
USING (
  public.auth_has_institution_role(institution_id, 'teacher')
);

CREATE POLICY "Guardians can only view their own linked children"
ON public.students FOR SELECT
TO authenticated
USING (
  guardian_user_id = auth.uid()
);

CREATE POLICY "Students can view their own student record"
ON public.students FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- G. POLICIES: memorization_records (Setoran)
-- ------------------------------------------------------------------------------
CREATE POLICY "Institution admins can manage all setoran in institution"
ON public.memorization_records FOR ALL
TO authenticated
USING (public.auth_is_admin_or_super(institution_id))
WITH CHECK (public.auth_is_admin_or_super(institution_id));

-- Teachers can record setoran for students in their institution/halaqah
CREATE POLICY "Teachers can insert setoran"
ON public.memorization_records FOR INSERT
TO authenticated
WITH CHECK (
  public.auth_has_institution_role(institution_id, 'teacher')
  AND teacher_id = auth.uid()
);

CREATE POLICY "Teachers can view setoran in their institution"
ON public.memorization_records FOR SELECT
TO authenticated
USING (
  public.auth_has_institution_role(institution_id, 'teacher')
);

CREATE POLICY "Guardians can view setoran of their own children"
ON public.memorization_records FOR SELECT
TO authenticated
USING (
  public.auth_is_guardian_of_student(student_id)
);

CREATE POLICY "Students can view their own setoran"
ON public.memorization_records FOR SELECT
TO authenticated
USING (
  public.auth_is_student_self(student_id)
);

-- ------------------------------------------------------------------------------
-- H. POLICIES: audit_logs
-- ------------------------------------------------------------------------------
CREATE POLICY "Super admin can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.auth_is_super_admin());

CREATE POLICY "Institution admin can view their institution audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.auth_has_institution_role(institution_id, 'institution_admin'));

CREATE POLICY "System can record audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
