-- ==============================================================================
-- SISTEM HAFALAN SANTRI DIGITAL (FULL PRODUCTION SCHEMA & MIGRATIONS)
-- Run this complete script in the Supabase SQL Editor to set up:
-- 1. Multi-tenant core tables & Tahfiz operations
-- 2. Row Level Security (RLS) on all tables with operational freeze for suspended tenants
-- 3. Stored procedures for Application Approval, Rejection, and Status Governance
-- 4. Audit logging & Anti-self-escalation triggers
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE MULTI-TENANT TABLES
-- ==============================================================================

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
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
    subscription_tier TEXT NOT NULL DEFAULT 'standard' CHECK (subscription_tier IN ('trial', 'standard', 'premium', 'enterprise')),
    logo_url TEXT,
    admin_name TEXT,
    admin_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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
    admin_name TEXT,
    admin_email TEXT,
    method TEXT NOT NULL DEFAULT 'Sabaq-Sabqi-Manzil',
    estimated_students TEXT NOT NULL DEFAULT '51-200',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    approved_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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
-- 3. OPERATIONAL TAHFIZ TABLES (ALL CONTAIN institution_id)
-- ==============================================================================

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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_memberships_inst_user ON public.institution_memberships(institution_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_students_institution ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_setoran_institution ON public.memorization_records(institution_id);
CREATE INDEX IF NOT EXISTS idx_setoran_student ON public.memorization_records(student_id);
CREATE INDEX IF NOT EXISTS idx_halaqahs_institution ON public.halaqahs(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_institution ON public.audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_apps_status ON public.institution_applications(status);

-- ==============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

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

CREATE OR REPLACE FUNCTION public.auth_is_admin_or_super(target_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.auth_is_super_admin() OR public.auth_has_institution_role(target_institution_id, 'institution_admin'));
$$;

CREATE OR REPLACE FUNCTION public.auth_is_institution_operational(target_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institutions
    WHERE id = target_institution_id
      AND status = 'active'
  );
$$;

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
-- 5. AUDIT LOGGING & STORED PROCEDURES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.record_audit_log(
    p_institution_id UUID DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_action TEXT DEFAULT 'UNKNOWN_ACTION',
    p_entity TEXT DEFAULT 'system',
    p_entity_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_valid_actor_id UUID := NULL;
BEGIN
    IF p_actor_id IS NULL THEN
        p_actor_id := auth.uid();
    END IF;

    IF p_actor_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor_id) THEN
            v_valid_actor_id := p_actor_id;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
        institution_id,
        actor_id,
        action,
        entity,
        entity_id,
        details,
        created_at
    )
    VALUES (
        p_institution_id,
        v_valid_actor_id,
        COALESCE(p_action, 'SYSTEM_ACTION'),
        COALESCE(p_entity, 'general'),
        p_entity_id,
        COALESCE(p_details, '{}'::jsonb),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_institution_application(
    p_application_id UUID,
    p_reviewer_id UUID DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_app RECORD;
    v_institution_id UUID;
    v_existing_slug TEXT;
    v_slug_candidate TEXT;
    v_admin_profile_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF p_reviewer_id IS NULL THEN
        p_reviewer_id := v_caller_id;
    END IF;

    IF NOT public.auth_is_super_admin() THEN
        IF p_reviewer_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_reviewer_id AND is_super_admin = true
        ) THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak menyetujui permohonan lembaga.';
        END IF;
    END IF;

    SELECT * INTO v_app FROM public.institution_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permohonan dengan ID % tidak ditemukan.', p_application_id;
    END IF;

    IF v_app.status = 'approved' AND v_app.approved_institution_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Permohonan sudah pernah disetujui sebelumnya.',
            'institution_id', v_app.approved_institution_id,
            'already_approved', true
        );
    END IF;

    IF v_app.status = 'rejected' THEN
        RAISE EXCEPTION 'Permohonan ini telah berstatus ditolak. Harap buat permohonan baru jika ingin mengaktifkan kembali.';
    END IF;

    v_slug_candidate := lower(regexp_replace(v_app.institution_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug_candidate := trim(both '-' from v_slug_candidate);
    IF v_slug_candidate IS NULL OR length(v_slug_candidate) < 2 THEN
        v_slug_candidate := 'lembaga-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    SELECT slug INTO v_existing_slug FROM public.institutions WHERE slug = v_slug_candidate;
    IF v_existing_slug IS NOT NULL THEN
        v_slug_candidate := v_slug_candidate || '-' || substr(gen_random_uuid()::text, 1, 6);
    END IF;

    INSERT INTO public.institutions (
        name,
        slug,
        type,
        address,
        city,
        province,
        phone,
        email,
        status,
        subscription_tier,
        admin_name,
        admin_email,
        created_at,
        updated_at
    )
    VALUES (
        v_app.institution_name,
        v_slug_candidate,
        v_app.institution_type,
        v_app.address,
        v_app.city,
        v_app.province,
        v_app.phone,
        v_app.email,
        'active',
        'standard',
        COALESCE(v_app.admin_name, v_app.leader_name),
        COALESCE(v_app.admin_email, v_app.email),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_institution_id;

    INSERT INTO public.institution_settings (
        institution_id,
        target_method,
        passing_grade_tajwid,
        passing_grade_kelancaran,
        passing_grade_makhraj,
        whatsapp_notification_enabled,
        allow_parent_view
    )
    VALUES (
        v_institution_id,
        COALESCE(v_app.method, 'Sabaq-Sabqi-Manzil'),
        75,
        80,
        75,
        true,
        true
    )
    ON CONFLICT (institution_id) DO NOTHING;

    SELECT id INTO v_admin_profile_id 
    FROM auth.users 
    WHERE email = lower(COALESCE(v_app.admin_email, v_app.email));

    IF v_admin_profile_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, phone)
        VALUES (
            v_admin_profile_id,
            COALESCE(v_app.admin_name, v_app.leader_name, 'Admin Lembaga'),
            v_app.phone
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

        INSERT INTO public.institution_memberships (
            institution_id,
            user_id,
            role,
            status
        )
        VALUES (
            v_institution_id,
            v_admin_profile_id,
            'institution_admin',
            'active'
        )
        ON CONFLICT (institution_id, user_id, role) 
        DO UPDATE SET status = 'active';
    END IF;

    UPDATE public.institution_applications
    SET status = 'approved',
        approved_institution_id = v_institution_id,
        reviewed_by = p_reviewer_id,
        review_notes = COALESCE(p_review_notes, 'Disetujui oleh Super Admin'),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_application_id;

    PERFORM public.record_audit_log(
        v_institution_id,
        p_reviewer_id,
        'APPROVE_APPLICATION',
        'institutions',
        v_institution_id::text,
        jsonb_build_object(
            'application_id', p_application_id,
            'institution_name', v_app.institution_name,
            'admin_name', COALESCE(v_app.admin_name, v_app.leader_name),
            'admin_email', COALESCE(v_app.admin_email, v_app.email),
            'review_notes', p_review_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Permohonan berhasil disetujui dan lembaga telah diaktifkan.',
        'institution_id', v_institution_id,
        'already_approved', false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_institution_application(
    p_application_id UUID,
    p_reviewer_id UUID DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_app RECORD;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF p_reviewer_id IS NULL THEN
        p_reviewer_id := v_caller_id;
    END IF;

    IF NOT public.auth_is_super_admin() THEN
        IF p_reviewer_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_reviewer_id AND is_super_admin = true
        ) THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak menolak permohonan lembaga.';
        END IF;
    END IF;

    SELECT * INTO v_app FROM public.institution_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permohonan tidak ditemukan.';
    END IF;

    IF v_app.status = 'approved' AND v_app.approved_institution_id IS NOT NULL THEN
        RAISE EXCEPTION 'Permohonan ini sudah disetujui sebelumnya dan lembaga telah dibuat. Gunakan fitur penangguhan (suspend) pada lembaga tersebut.';
    END IF;

    IF v_app.status = 'rejected' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Permohonan sudah dalam status ditolak.',
            'already_rejected', true
        );
    END IF;

    UPDATE public.institution_applications
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        review_notes = COALESCE(p_rejection_reason, 'Tidak memenuhi persyaratan kualifikasi'),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_application_id;

    PERFORM public.record_audit_log(
        NULL,
        p_reviewer_id,
        'REJECT_APPLICATION',
        'institution_applications',
        p_application_id::text,
        jsonb_build_object(
            'institution_name', v_app.institution_name,
            'rejection_reason', p_rejection_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Permohonan telah ditolak.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_institution_status(
    p_institution_id UUID,
    p_new_status TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status TEXT;
    v_inst_name TEXT;
    v_action_name TEXT;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF p_actor_id IS NULL THEN
        p_actor_id := v_caller_id;
    END IF;

    IF NOT public.auth_is_super_admin() THEN
        IF p_actor_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_actor_id AND is_super_admin = true
        ) THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berwenang mengubah status atau menangguhkan lembaga.';
        END IF;
    END IF;

    IF p_new_status NOT IN ('pending', 'active', 'rejected', 'suspended') THEN
        RAISE EXCEPTION 'Status % tidak valid. Pilihan yang diizinkan: pending, active, rejected, suspended.', p_new_status;
    END IF;

    SELECT status, name INTO v_old_status, v_inst_name 
    FROM public.institutions 
    WHERE id = p_institution_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lembaga dengan ID % tidak ditemukan.', p_institution_id;
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Status lembaga sudah ' || p_new_status,
            'status', p_new_status
        );
    END IF;

    UPDATE public.institutions
    SET status = p_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_institution_id;

    IF p_new_status = 'suspended' THEN
        v_action_name := 'SUSPEND_INSTITUTION';
    ELSIF p_new_status = 'active' THEN
        v_action_name := 'ACTIVATE_INSTITUTION';
    ELSE
        v_action_name := 'CHANGE_STATUS_INSTITUTION';
    END IF;

    PERFORM public.record_audit_log(
        p_institution_id,
        p_actor_id,
        v_action_name,
        'institutions',
        p_institution_id::text,
        jsonb_build_object(
            'old_status', v_old_status,
            'new_status', p_new_status,
            'institution_name', v_inst_name,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status lembaga berhasil diubah menjadi ' || p_new_status,
        'status', p_new_status
    );
END;
$$;

-- Triggers for profile creation & role protection
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
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
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

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_institution_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.auth_is_super_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Otorisasi ditolak: Status lembaga hanya dapat diubah oleh Super Admin.';
    END IF;
    IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
      RAISE EXCEPTION 'Otorisasi ditolak: Paket langganan hanya dapat diubah oleh Super Admin.';
    END IF;
    IF NEW.slug IS DISTINCT FROM OLD.slug THEN
      RAISE EXCEPTION 'Otorisasi ditolak: Slug lembaga bersifat permanen dan tidak dapat diubah.';
    END IF;
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_institution_governance_protection ON public.institutions;
CREATE TRIGGER on_institution_governance_protection
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_institution_updates();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

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

-- Institutions policies
CREATE POLICY "Super admins manage all institutions"
ON public.institutions FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Institution members view their own institution"
ON public.institutions FOR SELECT
TO authenticated
USING (public.auth_is_institution_member(id));

CREATE POLICY "Institution admins update their own institution"
ON public.institutions FOR UPDATE
TO authenticated
USING (
    public.auth_has_institution_role(id, 'institution_admin')
    AND status != 'suspended'
)
WITH CHECK (
    public.auth_has_institution_role(id, 'institution_admin')
    AND status != 'suspended'
);

-- Applications policies
CREATE POLICY "Anyone can submit application"
ON public.institution_applications FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Applicants view their own applications"
ON public.institution_applications FOR SELECT
TO authenticated
USING (applicant_user_id = auth.uid());

CREATE POLICY "Super admins manage applications"
ON public.institution_applications FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

-- Students policies
CREATE POLICY "Super admin manages students"
ON public.students FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Institution admin manages students"
ON public.students FOR ALL
TO authenticated
USING (
    public.auth_has_institution_role(institution_id, 'institution_admin')
    AND public.auth_is_institution_operational(institution_id)
)
WITH CHECK (
    public.auth_has_institution_role(institution_id, 'institution_admin')
    AND public.auth_is_institution_operational(institution_id)
);

CREATE POLICY "Teachers and members view students"
ON public.students FOR SELECT
TO authenticated
USING (
    public.auth_has_institution_role(institution_id, 'teacher')
    OR guardian_user_id = auth.uid()
    OR user_id = auth.uid()
);

-- Setoran / Memorization Records policies
CREATE POLICY "Super admin manages setoran"
ON public.memorization_records FOR ALL
TO authenticated
USING (public.auth_is_super_admin())
WITH CHECK (public.auth_is_super_admin());

CREATE POLICY "Teachers insert setoran"
ON public.memorization_records FOR INSERT
TO authenticated
WITH CHECK (
    public.auth_has_institution_role(institution_id, 'teacher')
    AND teacher_id = auth.uid()
    AND public.auth_is_institution_operational(institution_id)
);

CREATE POLICY "Institution admins manage setoran"
ON public.memorization_records FOR ALL
TO authenticated
USING (
    public.auth_has_institution_role(institution_id, 'institution_admin')
    AND public.auth_is_institution_operational(institution_id)
)
WITH CHECK (
    public.auth_has_institution_role(institution_id, 'institution_admin')
    AND public.auth_is_institution_operational(institution_id)
);

CREATE POLICY "Members view setoran"
ON public.memorization_records FOR SELECT
TO authenticated
USING (
    public.auth_has_institution_role(institution_id, 'teacher')
    OR public.auth_is_guardian_of_student(student_id)
    OR public.auth_is_student_self(student_id)
);

-- Halaqahs policies
CREATE POLICY "Super admin and Institution admin manage halaqahs"
ON public.halaqahs FOR ALL
TO authenticated
USING (
    public.auth_is_super_admin()
    OR (
        public.auth_has_institution_role(institution_id, 'institution_admin')
        AND public.auth_is_institution_operational(institution_id)
    )
)
WITH CHECK (
    public.auth_is_super_admin()
    OR (
        public.auth_has_institution_role(institution_id, 'institution_admin')
        AND public.auth_is_institution_operational(institution_id)
    )
);

CREATE POLICY "Members view halaqahs"
ON public.halaqahs FOR SELECT
TO authenticated
USING (public.auth_is_institution_member(institution_id));

-- Audit logs policies
CREATE POLICY "Super admin views all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.auth_is_super_admin());

CREATE POLICY "Institution admin views institution audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.auth_has_institution_role(institution_id, 'institution_admin'));

-- Grants
GRANT EXECUTE ON FUNCTION public.approve_institution_application(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_institution_application(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_institution_status(UUID, TEXT, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_audit_log(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_is_institution_operational(UUID) TO authenticated, anon, service_role;
