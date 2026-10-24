-- ==============================================================================
-- SISTEM HAFALAN SANTRI DIGITAL
-- Migration: 20261024000002_institution_management_and_approval.sql
-- Focus: Multi-tenant Institution Management, Public Applications, Approval Workflow,
--        and Tenant Status Governance (pending, active, rejected, suspended).
-- ==============================================================================

-- 1. CLEAN UP & MIGRATE LEGACY STATUS VALUES ON institutions
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any existing CHECK constraints on status column safely
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.institutions'::regclass 
          AND contype = 'c' 
          AND pg_get_constraintdef(oid) LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.institutions DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Normalize existing data to match the new status enum values
UPDATE public.institutions 
SET status = 'active' 
WHERE status = 'trial' OR status IS NULL;

UPDATE public.institutions 
SET status = 'pending' 
WHERE status = 'pending_verification';

UPDATE public.institutions
SET status = 'active'
WHERE status NOT IN ('pending', 'active', 'rejected', 'suspended');

-- Enforce new CHECK constraint and default
ALTER TABLE public.institutions
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.institutions
  ADD CONSTRAINT institutions_status_check 
  CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

-- Add administrator tracking columns on institutions
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- 2. ALTER institution_applications TABLE
ALTER TABLE public.institution_applications
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_email TEXT,
  ADD COLUMN IF NOT EXISTS approved_institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inst_apps_status ON public.institution_applications(status);
CREATE INDEX IF NOT EXISTS idx_inst_apps_email ON public.institution_applications(email);
CREATE INDEX IF NOT EXISTS idx_inst_apps_approved_id ON public.institution_applications(approved_institution_id);

-- 3. AUDIT LOG HELPER (SECURITY DEFINER)
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
    -- Fallback actor to auth.uid() if not provided
    IF p_actor_id IS NULL THEN
        p_actor_id := auth.uid();
    END IF;

    -- Validate foreign key reference to profiles to prevent FK constraint violation
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

-- 4. STORED PROCEDURE: approve_institution_application (ATOMIC, SECURE, & IDEMPOTENT)
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
    -- Resolve reviewer
    v_caller_id := auth.uid();
    IF p_reviewer_id IS NULL THEN
        p_reviewer_id := v_caller_id;
    END IF;

    -- Strict Super Admin authorization check
    IF NOT public.auth_is_super_admin() THEN
        IF p_reviewer_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_reviewer_id AND is_super_admin = true
        ) THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang berhak menyetujui permohonan lembaga.';
        END IF;
    END IF;

    -- Fetch Application
    SELECT * INTO v_app FROM public.institution_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permohonan dengan ID % tidak ditemukan.', p_application_id;
    END IF;

    -- Idempotency check: If already approved, return existing institution
    IF v_app.status = 'approved' AND v_app.approved_institution_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Permohonan sudah pernah disetujui sebelumnya.',
            'institution_id', v_app.approved_institution_id,
            'already_approved', true
        );
    END IF;

    -- Check if application was already rejected
    IF v_app.status = 'rejected' THEN
        RAISE EXCEPTION 'Permohonan ini telah berstatus ditolak. Harap buat permohonan baru jika ingin mengaktifkan kembali.';
    END IF;

    -- Generate Unique Slug
    v_slug_candidate := lower(regexp_replace(v_app.institution_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug_candidate := trim(both '-' from v_slug_candidate);
    IF v_slug_candidate IS NULL OR length(v_slug_candidate) < 2 THEN
        v_slug_candidate := 'lembaga-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    -- Avoid duplicate slug
    SELECT slug INTO v_existing_slug FROM public.institutions WHERE slug = v_slug_candidate;
    IF v_existing_slug IS NOT NULL THEN
        v_slug_candidate := v_slug_candidate || '-' || substr(gen_random_uuid()::text, 1, 6);
    END IF;

    -- Insert new Institution with status 'active'
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

    -- Create Initial Institution Settings
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

    -- Check if admin profile or auth user already exists by email
    SELECT id INTO v_admin_profile_id 
    FROM auth.users 
    WHERE email = lower(COALESCE(v_app.admin_email, v_app.email));

    IF v_admin_profile_id IS NOT NULL THEN
        -- Guarantee profile exists in public.profiles to satisfy foreign key constraint
        INSERT INTO public.profiles (id, full_name, phone)
        VALUES (
            v_admin_profile_id,
            COALESCE(v_app.admin_name, v_app.leader_name, 'Admin Lembaga'),
            v_app.phone
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

        -- Bind user as institution_admin in memberships
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

    -- Update Application Status to 'approved'
    UPDATE public.institution_applications
    SET status = 'approved',
        approved_institution_id = v_institution_id,
        reviewed_by = p_reviewer_id,
        review_notes = COALESCE(p_review_notes, 'Disetujui oleh Super Admin'),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_application_id;

    -- Audit Log
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

-- 5. STORED PROCEDURE: reject_institution_application
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

    -- Verify reviewer is super admin
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

    -- Prevent rejecting an already approved and provisioned institution
    IF v_app.status = 'approved' AND v_app.approved_institution_id IS NOT NULL THEN
        RAISE EXCEPTION 'Permohonan ini sudah disetujui sebelumnya dan lembaga telah dibuat. Gunakan fitur penangguhan (suspend) pada lembaga tersebut.';
    END IF;

    -- Idempotent check
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

    -- Audit Log
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

-- 6. STORED PROCEDURE: set_institution_status (Suspend / Activate)
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

    -- Strict authorization: Only Super Admin can change institution status
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

    -- If status is already the same, return early
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

    -- Record Audit Log
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

-- 7. TRIGGER: PREVENT INSTITUTION ADMIN FROM CHANGING STATUS, SLUG, OR TIER
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_institution_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.auth_is_super_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Otorisasi ditolak: Status lembaga hanya dapat diubah oleh Super Admin melalui alur resmi.';
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

-- 8. OPERATIONAL FREEZE HELPER & RLS POLICIES FOR SUSPENDED INSTITUTIONS
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

-- (A) Reinforce Institutions Update: Only active institutions can be updated by their admin
DROP POLICY IF EXISTS "Institution admins can update their own institution" ON public.institutions;
CREATE POLICY "Institution admins can update their own institution"
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

-- (B) Reinforce Students: Suspended institutions cannot insert, update, or delete students
DROP POLICY IF EXISTS "Institution admin manages students" ON public.students;
CREATE POLICY "Institution admin manages students"
ON public.students FOR ALL
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

-- (C) Reinforce Memorization Records (Setoran): Suspended institutions cannot record new setoran
DROP POLICY IF EXISTS "Teachers can insert setoran" ON public.memorization_records;
CREATE POLICY "Teachers can insert setoran"
ON public.memorization_records FOR INSERT
TO authenticated
WITH CHECK (
    public.auth_is_super_admin()
    OR (
        public.auth_has_institution_role(institution_id, 'teacher')
        AND teacher_id = auth.uid()
        AND public.auth_is_institution_operational(institution_id)
    )
);

DROP POLICY IF EXISTS "Institution admins can manage all setoran in institution" ON public.memorization_records;
CREATE POLICY "Institution admins can manage all setoran in institution"
ON public.memorization_records FOR ALL
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

-- (D) Reinforce Halaqahs: Suspended institutions cannot modify halaqahs
DROP POLICY IF EXISTS "Super admin and Institution admin manage halaqahs" ON public.halaqahs;
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

-- 9. PERMISSIONS: GRANT EXECUTE
GRANT EXECUTE ON FUNCTION public.approve_institution_application(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_institution_application(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_institution_status(UUID, TEXT, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_audit_log(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_is_institution_operational(UUID) TO authenticated, anon, service_role;
