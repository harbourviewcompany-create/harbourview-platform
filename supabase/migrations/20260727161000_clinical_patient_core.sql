-- Clinical patient core (Slice 2)
-- Depends on: 20260727160000_clinical_control_foundation.sql
-- Restricted clinical data. No public API exposure. Harbourview is data controller.
-- Tables created first; RLS policies second (avoids forward table references).

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  jurisdiction text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  given_name text NOT NULL,
  family_name text NOT NULL,
  date_of_birth date,
  sex_at_birth text
    CHECK (sex_at_birth IS NULL OR sex_at_birth IN ('female', 'male', 'intersex', 'unknown', 'unspecified')),
  external_mrn text,
  notes_internal text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_patients_jurisdiction
  ON public.clinical_patients (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_clinical_patients_created_by
  ON public.clinical_patients (created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_patients_name
  ON public.clinical_patients (family_name, given_name);

CREATE TABLE IF NOT EXISTS public.clinical_care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  professional_id uuid REFERENCES public.hv_professionals(id) ON DELETE SET NULL,
  role text NOT NULL
    CHECK (role IN ('treating_clinician', 'pharmacist', 'nurse', 'care_coordinator', 'consultant', 'other')),
  membership_status text NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'ended', 'revoked')),
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid,
  ended_at timestamptz,
  UNIQUE (patient_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_clinical_care_team_patient
  ON public.clinical_care_team (patient_id)
  WHERE membership_status = 'active';
CREATE INDEX IF NOT EXISTS idx_clinical_care_team_user
  ON public.clinical_care_team (user_id)
  WHERE membership_status = 'active';

CREATE TABLE IF NOT EXISTS public.clinical_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL,
  jurisdiction text NOT NULL,
  consent_type text NOT NULL
    CHECK (consent_type IN (
      'treatment',
      'data_processing',
      'sharing_with_care_team',
      'research_optional',
      'marketing_optional'
    )),
  lawful_basis text NOT NULL
    CHECK (lawful_basis IN (
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    )),
  status text NOT NULL DEFAULT 'granted'
    CHECK (status IN ('granted', 'withdrawn', 'expired')),
  method text
    CHECK (method IS NULL OR method IN ('written', 'verbal', 'electronic', 'implied_documented')),
  version_label text,
  notes text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_consent_patient
  ON public.clinical_consent_records (patient_id, consent_type)
  WHERE status = 'granted';

CREATE TABLE IF NOT EXISTS public.clinical_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  clinician_user_id uuid NOT NULL,
  professional_id uuid REFERENCES public.hv_professionals(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  jurisdiction text NOT NULL,
  encounter_type text NOT NULL DEFAULT 'consultation'
    CHECK (encounter_type IN (
      'consultation',
      'follow_up',
      'dispensing',
      'review',
      'telehealth',
      'other'
    )),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  chief_complaint text,
  clinical_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_encounters_patient
  ON public.clinical_encounters (patient_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_encounters_clinician
  ON public.clinical_encounters (clinician_user_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS enable + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.clinical_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_care_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_encounters ENABLE ROW LEVEL SECURITY;

-- patients
DROP POLICY IF EXISTS clinical_patients_clinician_select ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_select
  ON public.clinical_patients FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_patients.id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_patients_clinician_insert ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_insert
  ON public.clinical_patients FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_patients_clinician_update ON public.clinical_patients;
CREATE POLICY clinical_patients_clinician_update
  ON public.clinical_patients FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      created_by = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_patients.id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
          AND ct.role IN ('treating_clinician', 'care_coordinator')
      )
    )
  )
  WITH CHECK (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_patients_service ON public.clinical_patients;
CREATE POLICY clinical_patients_service
  ON public.clinical_patients FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- care team
DROP POLICY IF EXISTS clinical_care_team_clinician_select ON public.clinical_care_team;
CREATE POLICY clinical_care_team_clinician_select
  ON public.clinical_care_team FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_patients p
        WHERE p.id = clinical_care_team.patient_id
          AND p.created_by = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS clinical_care_team_clinician_insert ON public.clinical_care_team;
CREATE POLICY clinical_care_team_clinician_insert
  ON public.clinical_care_team FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct2
            WHERE ct2.patient_id = p.id
              AND ct2.user_id = (SELECT auth.uid())
              AND ct2.membership_status = 'active'
              AND ct2.role IN ('treating_clinician', 'care_coordinator')
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_care_team_service ON public.clinical_care_team;
CREATE POLICY clinical_care_team_service
  ON public.clinical_care_team FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- consent
DROP POLICY IF EXISTS clinical_consent_clinician_select ON public.clinical_consent_records;
CREATE POLICY clinical_consent_clinician_select
  ON public.clinical_consent_records FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = clinical_consent_records.patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_consent_clinician_insert ON public.clinical_consent_records;
CREATE POLICY clinical_consent_clinician_insert
  ON public.clinical_consent_records FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND recorded_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_consent_service ON public.clinical_consent_records;
CREATE POLICY clinical_consent_service
  ON public.clinical_consent_records FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- encounters
DROP POLICY IF EXISTS clinical_encounters_clinician_select ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_select
  ON public.clinical_encounters FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_encounters.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_encounters_clinician_insert ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_insert
  ON public.clinical_encounters FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.clinical_patients p
      WHERE p.id = patient_id
        AND (
          p.created_by = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.clinical_care_team ct
            WHERE ct.patient_id = p.id
              AND ct.user_id = (SELECT auth.uid())
              AND ct.membership_status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS clinical_encounters_clinician_update ON public.clinical_encounters;
CREATE POLICY clinical_encounters_clinician_update
  ON public.clinical_encounters FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_encounters_service ON public.clinical_encounters;
CREATE POLICY clinical_encounters_service
  ON public.clinical_encounters FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.clinical_patients FROM anon;
REVOKE ALL ON public.clinical_care_team FROM anon;
REVOKE ALL ON public.clinical_consent_records FROM anon;
REVOKE ALL ON public.clinical_encounters FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_care_team TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinical_encounters TO authenticated;

GRANT ALL ON public.clinical_patients TO service_role;
GRANT ALL ON public.clinical_care_team TO service_role;
GRANT ALL ON public.clinical_consent_records TO service_role;
GRANT ALL ON public.clinical_encounters TO service_role;

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_patients_updated_at ON public.clinical_patients;
CREATE TRIGGER trg_clinical_patients_updated_at
  BEFORE UPDATE ON public.clinical_patients
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_set_updated_at();

COMMENT ON TABLE public.clinical_patients IS
  'Identifiable patient records. Restricted. Harbourview is controller. Consent required before create.';
COMMENT ON TABLE public.clinical_consent_records IS
  'Lawful basis and consent history per patient.';
COMMENT ON TABLE public.clinical_encounters IS
  'Clinical encounters linked to patients and treating clinicians.';
COMMENT ON TABLE public.clinical_care_team IS
  'Care team membership gating patient access beyond the creating clinician.';
