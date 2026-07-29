-- Clinical workflows (Slice 3)
-- Depends on: control foundation + patient core migrations.
-- Enforces consent, care-team bootstrap, audit helpers; adds calculation,
-- recommendation, prescription/dispensing, and jurisdiction authority tables.

-- ---------------------------------------------------------------------------
-- 1. Audit write helper (service_role + SECURITY DEFINER for trusted paths)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_audit_write(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_jurisdiction text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_actor_user_id uuid DEFAULT auth.uid(),
  p_actor_role text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO public.clinical_audit_log (
    actor_user_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    jurisdiction,
    metadata
  ) VALUES (
    p_actor_user_id,
    COALESCE(p_actor_role, (SELECT auth.role())),
    p_action,
    p_resource_type,
    p_resource_id,
    p_jurisdiction,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_audit_write FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_audit_write TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Active consent check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_has_active_consent(
  p_patient_id uuid,
  p_consent_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinical_consent_records c
    WHERE c.patient_id = p_patient_id
      AND c.consent_type = p_consent_type
      AND c.status = 'granted'
      AND c.effective_from <= now()
      AND (c.effective_to IS NULL OR c.effective_to > now())
  );
$$;

REVOKE ALL ON FUNCTION public.clinical_has_active_consent FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_has_active_consent TO authenticated, service_role;

-- Requires treatment + data_processing for clinical actions on a patient
CREATE OR REPLACE FUNCTION public.clinical_require_core_consent(p_patient_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.clinical_has_active_consent(p_patient_id, 'treatment') THEN
    RAISE EXCEPTION 'clinical_consent_required: treatment'
      USING ERRCODE = '42501';
  END IF;
  IF NOT public.clinical_has_active_consent(p_patient_id, 'data_processing') THEN
    RAISE EXCEPTION 'clinical_consent_required: data_processing'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_require_core_consent FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_require_core_consent TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Care-team bootstrap on patient create + audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_patient_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clinical_care_team (
    patient_id,
    user_id,
    role,
    membership_status,
    added_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'treating_clinician',
    'active',
    NEW.created_by
  )
  ON CONFLICT (patient_id, user_id, role) DO NOTHING;

  PERFORM public.clinical_audit_write(
    'patient.create',
    'clinical_patients',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'status', NEW.status,
      'created_by', NEW.created_by
    ),
    NEW.created_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_patient_after_insert ON public.clinical_patients;
CREATE TRIGGER trg_clinical_patient_after_insert
  AFTER INSERT ON public.clinical_patients
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_patient_after_insert();

-- ---------------------------------------------------------------------------
-- 4. Consent record audit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_consent_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    'consent.' || NEW.status,
    'clinical_consent_records',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'consent_type', NEW.consent_type,
      'lawful_basis', NEW.lawful_basis
    ),
    NEW.recorded_by
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_consent_after_insert ON public.clinical_consent_records;
CREATE TRIGGER trg_clinical_consent_after_insert
  AFTER INSERT ON public.clinical_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_consent_after_insert();

-- ---------------------------------------------------------------------------
-- 5. Encounter gates: consent required; audit open/close
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinical_encounter_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_encounter_before_insert ON public.clinical_encounters;
CREATE TRIGGER trg_clinical_encounter_before_insert
  BEFORE INSERT ON public.clinical_encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_encounter_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_encounter_after_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.clinical_audit_write(
      'encounter.open',
      'clinical_encounters',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'encounter_type', NEW.encounter_type
      ),
      NEW.clinician_user_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.clinical_audit_write(
      'encounter.status.' || NEW.status,
      'clinical_encounters',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'from_status', OLD.status,
        'to_status', NEW.status
      ),
      NEW.clinician_user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_encounter_after_write ON public.clinical_encounters;
CREATE TRIGGER trg_clinical_encounter_after_write
  AFTER INSERT OR UPDATE ON public.clinical_encounters
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_encounter_after_write();

-- ---------------------------------------------------------------------------
-- 6. Jurisdiction clinical authority (who may do what, where)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_jurisdiction_authority (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  clinical_role text NOT NULL
    CHECK (clinical_role IN (
      'doctor', 'pharmacist', 'nurse', 'nurse_practitioner', 'other'
    )),
  may_recommend boolean NOT NULL DEFAULT true,
  may_calculate_dose boolean NOT NULL DEFAULT true,
  may_prescribe boolean NOT NULL DEFAULT false,
  may_dispense boolean NOT NULL DEFAULT false,
  may_claim_appropriateness boolean NOT NULL DEFAULT false,
  notes text,
  evidence_version text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  UNIQUE (jurisdiction, clinical_role)
);

CREATE INDEX IF NOT EXISTS idx_clinical_jurisdiction_authority_j
  ON public.clinical_jurisdiction_authority (jurisdiction);

ALTER TABLE public.clinical_jurisdiction_authority ENABLE ROW LEVEL SECURITY;

-- Verified clinicians may read authority matrix for their work
DROP POLICY IF EXISTS clinical_jurisdiction_authority_read ON public.clinical_jurisdiction_authority;
CREATE POLICY clinical_jurisdiction_authority_read
  ON public.clinical_jurisdiction_authority
  FOR SELECT TO authenticated
  USING (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_jurisdiction_authority_service ON public.clinical_jurisdiction_authority;
CREATE POLICY clinical_jurisdiction_authority_service
  ON public.clinical_jurisdiction_authority
  FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

REVOKE ALL ON public.clinical_jurisdiction_authority FROM anon;
GRANT SELECT ON public.clinical_jurisdiction_authority TO authenticated;
GRANT ALL ON public.clinical_jurisdiction_authority TO service_role;

CREATE OR REPLACE FUNCTION public.clinical_authority_allows(
  p_jurisdiction text,
  p_clinical_role text,
  p_capability text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.clinical_jurisdiction_authority%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.clinical_jurisdiction_authority a
  WHERE a.jurisdiction = p_jurisdiction
    AND a.clinical_role = p_clinical_role
    AND a.effective_from <= now()
    AND (a.effective_to IS NULL OR a.effective_to > now())
  LIMIT 1;

  -- Fail closed: no row => deny
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_capability
    WHEN 'recommend' THEN RETURN v_row.may_recommend;
    WHEN 'calculate_dose' THEN RETURN v_row.may_calculate_dose;
    WHEN 'prescribe' THEN RETURN v_row.may_prescribe;
    WHEN 'dispense' THEN RETURN v_row.may_dispense;
    WHEN 'claim_appropriateness' THEN RETURN v_row.may_claim_appropriateness;
    ELSE RETURN false;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.clinical_authority_allows FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_authority_allows TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Dose calculations (versioned; audited)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  clinician_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  calculator_key text NOT NULL,
  algorithm_version text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit text,
  status text NOT NULL DEFAULT 'computed'
    CHECK (status IN ('computed', 'superseded', 'void')),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_clinical_calculations_patient
  ON public.clinical_calculations (patient_id, created_at DESC);

ALTER TABLE public.clinical_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_calculations_select ON public.clinical_calculations;
CREATE POLICY clinical_calculations_select
  ON public.clinical_calculations FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_calculations.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_calculations_insert ON public.clinical_calculations;
CREATE POLICY clinical_calculations_insert
  ON public.clinical_calculations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_calculations_service ON public.clinical_calculations;
CREATE POLICY clinical_calculations_service
  ON public.clinical_calculations FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_calculation_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.clinician_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.clinician_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'calculate_dose'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: calculate_dose'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_calculation_before_insert ON public.clinical_calculations;
CREATE TRIGGER trg_clinical_calculation_before_insert
  BEFORE INSERT ON public.clinical_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_calculation_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_calculation_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    'calculation.compute',
    'clinical_calculations',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'calculator_key', NEW.calculator_key,
      'algorithm_version', NEW.algorithm_version
    ),
    NEW.clinician_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_calculation_after_insert ON public.clinical_calculations;
CREATE TRIGGER trg_clinical_calculation_after_insert
  AFTER INSERT ON public.clinical_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_calculation_after_insert();

REVOKE ALL ON public.clinical_calculations FROM anon;
GRANT SELECT, INSERT ON public.clinical_calculations TO authenticated;
GRANT ALL ON public.clinical_calculations TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Personalised recommendations + appropriateness claims
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  calculation_id uuid REFERENCES public.clinical_calculations(id) ON DELETE SET NULL,
  clinician_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  recommendation_key text NOT NULL,
  evidence_version text NOT NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Explicit appropriateness claim (high risk; authority-gated)
  appropriateness_claim text
    CHECK (
      appropriateness_claim IS NULL
      OR appropriateness_claim IN (
        'appropriate',
        'appropriate_with_cautions',
        'not_appropriate',
        'insufficient_data'
      )
    ),
  appropriateness_rationale text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'withdrawn')),
  clinician_attestation_at timestamptz,
  clinician_attestation_note text
);

CREATE INDEX IF NOT EXISTS idx_clinical_recommendations_patient
  ON public.clinical_recommendations (patient_id, created_at DESC);

ALTER TABLE public.clinical_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_recommendations_select ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_select
  ON public.clinical_recommendations FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      clinician_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_recommendations.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_recommendations_insert ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_insert
  ON public.clinical_recommendations FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND clinician_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_recommendations_service ON public.clinical_recommendations;
CREATE POLICY clinical_recommendations_service
  ON public.clinical_recommendations FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_recommendation_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.clinician_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.clinician_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'recommend'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: recommend'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.appropriateness_claim IS NOT NULL THEN
    IF NOT public.clinical_authority_allows(
      NEW.jurisdiction, v_role, 'claim_appropriateness'
    ) THEN
      RAISE EXCEPTION 'clinical_authority_denied: claim_appropriateness'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.clinician_attestation_at IS NULL THEN
      NEW.clinician_attestation_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_recommendation_before_insert ON public.clinical_recommendations;
CREATE TRIGGER trg_clinical_recommendation_before_insert
  BEFORE INSERT ON public.clinical_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_recommendation_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_recommendation_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.clinical_audit_write(
    CASE
      WHEN NEW.appropriateness_claim IS NOT NULL THEN 'recommendation.with_appropriateness'
      ELSE 'recommendation.create'
    END,
    'clinical_recommendations',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'patient_id', NEW.patient_id,
      'recommendation_key', NEW.recommendation_key,
      'evidence_version', NEW.evidence_version,
      'appropriateness_claim', NEW.appropriateness_claim
    ),
    NEW.clinician_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_recommendation_after_insert ON public.clinical_recommendations;
CREATE TRIGGER trg_clinical_recommendation_after_insert
  AFTER INSERT ON public.clinical_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_recommendation_after_insert();

REVOKE ALL ON public.clinical_recommendations FROM anon;
GRANT SELECT, INSERT ON public.clinical_recommendations TO authenticated;
GRANT ALL ON public.clinical_recommendations TO service_role;

-- ---------------------------------------------------------------------------
-- 9. Prescriptions + dispensing workflow
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinical_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.clinical_patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES public.clinical_encounters(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.clinical_recommendations(id) ON DELETE SET NULL,
  prescriber_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  product_code text,
  product_name text NOT NULL,
  dose_text text NOT NULL,
  quantity text,
  directions text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'signed',
      'sent_to_pharmacy',
      'dispensed',
      'partially_dispensed',
      'cancelled',
      'expired'
    )),
  signed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_patient
  ON public.clinical_prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_prescriptions_status
  ON public.clinical_prescriptions (status)
  WHERE status NOT IN ('cancelled', 'expired', 'dispensed');

CREATE TABLE IF NOT EXISTS public.clinical_dispensing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  prescription_id uuid NOT NULL REFERENCES public.clinical_prescriptions(id) ON DELETE CASCADE,
  pharmacist_user_id uuid NOT NULL,
  jurisdiction text NOT NULL,
  quantity_dispensed text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'reversed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_clinical_dispensing_rx
  ON public.clinical_dispensing_events (prescription_id, created_at DESC);

ALTER TABLE public.clinical_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_dispensing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinical_prescriptions_select ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_select
  ON public.clinical_prescriptions FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      prescriber_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_prescriptions.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_prescriptions_insert ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_insert
  ON public.clinical_prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND prescriber_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_prescriptions_update ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_update
  ON public.clinical_prescriptions FOR UPDATE TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      prescriber_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.clinical_care_team ct
        WHERE ct.patient_id = clinical_prescriptions.patient_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
          AND ct.role IN ('pharmacist', 'treating_clinician')
      )
    )
  )
  WITH CHECK (public.is_verified_clinician());

DROP POLICY IF EXISTS clinical_prescriptions_service ON public.clinical_prescriptions;
CREATE POLICY clinical_prescriptions_service
  ON public.clinical_prescriptions FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS clinical_dispensing_select ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_select
  ON public.clinical_dispensing_events FOR SELECT TO authenticated
  USING (
    public.is_verified_clinician()
    AND (
      pharmacist_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.clinical_prescriptions rx
        JOIN public.clinical_care_team ct ON ct.patient_id = rx.patient_id
        WHERE rx.id = clinical_dispensing_events.prescription_id
          AND ct.user_id = (SELECT auth.uid())
          AND ct.membership_status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS clinical_dispensing_insert ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_insert
  ON public.clinical_dispensing_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_verified_clinician()
    AND pharmacist_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS clinical_dispensing_service ON public.clinical_dispensing_events;
CREATE POLICY clinical_dispensing_service
  ON public.clinical_dispensing_events FOR ALL TO public
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE OR REPLACE FUNCTION public.clinical_prescription_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  PERFORM public.clinical_require_core_consent(NEW.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.prescriber_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.prescriber_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'prescribe'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: prescribe'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_prescription_before_insert ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_before_insert
  BEFORE INSERT ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_prescription_after_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.clinical_audit_write(
      'prescription.' || NEW.status,
      'clinical_prescriptions',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'product_name', NEW.product_name,
        'status', NEW.status
      ),
      NEW.prescriber_user_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.updated_at := now();
    PERFORM public.clinical_audit_write(
      'prescription.status.' || NEW.status,
      'clinical_prescriptions',
      NEW.id::text,
      NEW.jurisdiction,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'from_status', OLD.status,
        'to_status', NEW.status
      ),
      (SELECT auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE UPDATE for updated_at + AFTER for audit on prescriptions
CREATE OR REPLACE FUNCTION public.clinical_prescription_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'signed' AND OLD.status = 'draft' AND NEW.signed_at IS NULL THEN
    NEW.signed_at := now();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' AND NEW.cancelled_at IS NULL THEN
    NEW.cancelled_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_prescription_before_update ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_before_update
  BEFORE UPDATE ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_before_update();

DROP TRIGGER IF EXISTS trg_clinical_prescription_after_write ON public.clinical_prescriptions;
CREATE TRIGGER trg_clinical_prescription_after_write
  AFTER INSERT OR UPDATE ON public.clinical_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_prescription_after_write();

CREATE OR REPLACE FUNCTION public.clinical_dispensing_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_rx public.clinical_prescriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_rx FROM public.clinical_prescriptions WHERE id = NEW.prescription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'clinical_prescription_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public.clinical_require_core_consent(v_rx.patient_id);

  SELECT p.clinical_role INTO v_role
  FROM public.hv_professionals p
  JOIN public.clinical_clinician_links l
    ON l.professional_id = p.id
   AND l.user_id = NEW.pharmacist_user_id
   AND l.link_status = 'active'
  WHERE p.user_id = NEW.pharmacist_user_id
    AND p.verification_status = 'verified'
    AND p.status = 'active'
  LIMIT 1;

  IF v_role IS NULL OR NOT public.clinical_authority_allows(
    NEW.jurisdiction, v_role, 'dispense'
  ) THEN
    RAISE EXCEPTION 'clinical_authority_denied: dispense'
      USING ERRCODE = '42501';
  END IF;

  IF v_rx.status NOT IN ('signed', 'sent_to_pharmacy', 'partially_dispensed') THEN
    RAISE EXCEPTION 'clinical_prescription_not_dispensable: status=%', v_rx.status
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_dispensing_before_insert ON public.clinical_dispensing_events;
CREATE TRIGGER trg_clinical_dispensing_before_insert
  BEFORE INSERT ON public.clinical_dispensing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_dispensing_before_insert();

CREATE OR REPLACE FUNCTION public.clinical_dispensing_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clinical_prescriptions
  SET status = 'dispensed',
      updated_at = now()
  WHERE id = NEW.prescription_id
    AND status IN ('signed', 'sent_to_pharmacy', 'partially_dispensed');

  PERFORM public.clinical_audit_write(
    'dispensing.completed',
    'clinical_dispensing_events',
    NEW.id::text,
    NEW.jurisdiction,
    jsonb_build_object(
      'prescription_id', NEW.prescription_id,
      'quantity_dispensed', NEW.quantity_dispensed
    ),
    NEW.pharmacist_user_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinical_dispensing_after_insert ON public.clinical_dispensing_events;
CREATE TRIGGER trg_clinical_dispensing_after_insert
  AFTER INSERT ON public.clinical_dispensing_events
  FOR EACH ROW
  EXECUTE FUNCTION public.clinical_dispensing_after_insert();

REVOKE ALL ON public.clinical_prescriptions FROM anon;
REVOKE ALL ON public.clinical_dispensing_events FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.clinical_prescriptions TO authenticated;
GRANT SELECT, INSERT ON public.clinical_dispensing_events TO authenticated;
GRANT ALL ON public.clinical_prescriptions TO service_role;
GRANT ALL ON public.clinical_dispensing_events TO service_role;

COMMENT ON TABLE public.clinical_jurisdiction_authority IS
  'Fail-closed capability matrix by jurisdiction and clinical_role.';
COMMENT ON TABLE public.clinical_calculations IS
  'Versioned dose/clinical calculations; requires consent + authority.';
COMMENT ON TABLE public.clinical_recommendations IS
  'Personalised recommendations; appropriateness claims authority-gated + attested.';
COMMENT ON TABLE public.clinical_prescriptions IS
  'Prescription workflow draft→signed→pharmacy→dispensed.';
COMMENT ON TABLE public.clinical_dispensing_events IS
  'Pharmacist dispensing events against signed prescriptions.';
