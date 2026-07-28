-- Clinical control foundation (Slice 1)
-- Extends hv_professionals for clinical gating; adds clinician links + immutable audit log.
-- No patient data, calculators, or clinical UI in this migration.
-- clinical_role enum drives feature gating (prescribing authority checks come in later slices).

-- ---------------------------------------------------------------------------
-- 1. Clinician verification fields on existing professionals directory
-- ---------------------------------------------------------------------------
ALTER TABLE public.hv_professionals
  ADD COLUMN IF NOT EXISTS licence_number text,
  ADD COLUMN IF NOT EXISTS licence_jurisdiction text,
  ADD COLUMN IF NOT EXISTS clinical_role text,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Constrained clinical_role values (CHECK rather than Postgres ENUM for easier evolution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hv_professionals_clinical_role_check'
  ) THEN
    ALTER TABLE public.hv_professionals
      ADD CONSTRAINT hv_professionals_clinical_role_check
      CHECK (
        clinical_role IS NULL
        OR clinical_role IN (
          'doctor',
          'pharmacist',
          'nurse',
          'nurse_practitioner',
          'other'
        )
      );
  END IF;
END $$;

-- One auth user → at most one professional profile (partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hv_professionals_user_id
  ON public.hv_professionals (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_clinical_role
  ON public.hv_professionals (clinical_role)
  WHERE clinical_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_licence_jurisdiction
  ON public.hv_professionals (licence_jurisdiction)
  WHERE licence_jurisdiction IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Explicit clinician link table (auth user ↔ professional profile)
-- Supports future multi-profile / clinic models without breaking the unique user_id index.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_clinician_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.hv_professionals(id) ON DELETE CASCADE,
  link_status text NOT NULL DEFAULT 'active'
    CHECK (link_status IN ('active', 'suspended', 'revoked')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  linked_by uuid,
  UNIQUE (user_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_clinical_clinician_links_user
  ON public.clinical_clinician_links (user_id)
  WHERE link_status = 'active';

CREATE INDEX IF NOT EXISTS idx_clinical_clinician_links_professional
  ON public.clinical_clinician_links (professional_id);

ALTER TABLE public.clinical_clinician_links ENABLE ROW LEVEL SECURITY;

-- Users may read their own active links only
DROP POLICY IF EXISTS clinical_clinician_links_self_read ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_self_read
  ON public.clinical_clinician_links
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND link_status = 'active'
  );

-- Writes are service_role / admin only
DROP POLICY IF EXISTS clinical_clinician_links_service_write ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_service_write
  ON public.clinical_clinician_links
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_clinician_links FROM anon;
GRANT SELECT ON public.clinical_clinician_links TO authenticated;
GRANT ALL ON public.clinical_clinician_links TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Immutable clinical audit log
-- Append-only. No UPDATE/DELETE policies. No public SELECT.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  jurisdiction text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent_hash text
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_occurred
  ON public.clinical_audit_log (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_actor
  ON public.clinical_audit_log (actor_user_id)
  WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_resource
  ON public.clinical_audit_log (resource_type, resource_id);

ALTER TABLE public.clinical_audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT for anon/authenticated. Service role only for insert + admin read path later.
DROP POLICY IF EXISTS clinical_audit_log_service_all ON public.clinical_audit_log;
CREATE POLICY clinical_audit_log_service_all
  ON public.clinical_audit_log
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_audit_log FROM anon, authenticated;
GRANT ALL ON public.clinical_audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.clinical_audit_log_id_seq TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Helper: is verified clinician (security definer, pinned search_path)
-- Used by future clinical RLS policies. Returns false if not verified.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_verified_clinician(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hv_professionals p
    JOIN public.clinical_clinician_links l
      ON l.professional_id = p.id
     AND l.user_id = p_user_id
     AND l.link_status = 'active'
    WHERE p.user_id = p_user_id
      AND p.verification_status = 'verified'
      AND p.status = 'active'
      AND p.clinical_role IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_clinician(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_verified_clinician(uuid) TO authenticated, service_role;

COMMENT ON TABLE public.clinical_clinician_links IS
  'Links auth.users to verified hv_professionals profiles for clinical feature gating.';
COMMENT ON TABLE public.clinical_audit_log IS
  'Immutable append-only audit log for all clinical-domain actions. No public read.';
COMMENT ON COLUMN public.hv_professionals.clinical_role IS
  'Constrained role for clinical gating: doctor | pharmacist | nurse | nurse_practitioner | other';
COMMENT ON COLUMN public.hv_professionals.licence_number IS
  'Professional licence / registration number reviewed during admin verification.';
COMMENT ON COLUMN public.hv_professionals.licence_jurisdiction IS
  'Issuing jurisdiction code (ISO country or subnational) for the licence.';
