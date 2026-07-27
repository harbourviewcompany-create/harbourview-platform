-- Clinical software control foundation (Slice 1)
-- Extends hv_professionals for verified clinician gating.
-- Adds clinical_clinician_links and immutable clinical_audit_log.
-- No patient tables, calculators, or clinical UI in this migration.
--
-- Rollback (not recommended once patient data exists later):
--   DROP TABLE IF EXISTS public.clinical_audit_log;
--   DROP TABLE IF EXISTS public.clinical_clinician_links;
--   ALTER TABLE public.hv_professionals
--     DROP COLUMN IF EXISTS licence_number,
--     DROP COLUMN IF EXISTS licence_jurisdiction,
--     DROP COLUMN IF EXISTS clinical_role,
--     DROP COLUMN IF EXISTS verified_by,
--     DROP COLUMN IF EXISTS verification_notes,
--     DROP COLUMN IF EXISTS user_id;

-- 1. Clinician verification fields on existing professionals table
ALTER TABLE public.hv_professionals
  ADD COLUMN IF NOT EXISTS licence_number text,
  ADD COLUMN IF NOT EXISTS licence_jurisdiction text,
  ADD COLUMN IF NOT EXISTS clinical_role text,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Constrain clinical_role to production enum
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

-- Link auth user (nullable until linked; unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hv_professionals_user_id
  ON public.hv_professionals (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_clinical_role
  ON public.hv_professionals (clinical_role)
  WHERE clinical_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hv_professionals_licence_jurisdiction
  ON public.hv_professionals (licence_jurisdiction)
  WHERE licence_jurisdiction IS NOT NULL;

-- 2. Explicit clinician link table (auth user ↔ professional profile)
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

-- Fail closed: users read only their own links; writes service_role only
DROP POLICY IF EXISTS clinical_clinician_links_select_own ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_select_own
  ON public.clinical_clinician_links
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS clinical_clinician_links_service_all ON public.clinical_clinician_links;
CREATE POLICY clinical_clinician_links_service_all
  ON public.clinical_clinician_links
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_clinician_links FROM anon;
GRANT SELECT ON public.clinical_clinician_links TO authenticated;
GRANT ALL ON public.clinical_clinician_links TO service_role;

-- 3. Immutable clinical audit log
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

-- No SELECT for anon/authenticated. Insert + read via service_role only.
-- Admin read paths will use a controlled security definer RPC in a later slice.
DROP POLICY IF EXISTS clinical_audit_log_service_all ON public.clinical_audit_log;
CREATE POLICY clinical_audit_log_service_all
  ON public.clinical_audit_log
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_audit_log FROM anon, authenticated;
GRANT ALL ON public.clinical_audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.clinical_audit_log_id_seq TO service_role;

COMMENT ON TABLE public.clinical_audit_log IS
  'Immutable append-only clinical access/action log. No UPDATE or DELETE from application paths.';

COMMENT ON COLUMN public.hv_professionals.clinical_role IS
  'Enum: doctor | pharmacist | nurse | nurse_practitioner | other. Drives clinical feature gating.';

COMMENT ON COLUMN public.hv_professionals.licence_number IS
  'Professional licence / registration number required for clinical verification.';

COMMENT ON COLUMN public.hv_professionals.licence_jurisdiction IS
  'Issuing jurisdiction (ISO country or subnational code) for the licence.';
