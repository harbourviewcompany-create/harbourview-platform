-- Clinical API surface for PostgREST (schema api only).
-- security_invoker views so underlying public RLS applies to the caller JWT.

CREATE OR REPLACE VIEW api.clinical_patients
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_patients;

CREATE OR REPLACE VIEW api.clinical_care_team
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_care_team;

CREATE OR REPLACE VIEW api.clinical_consent_records
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_consent_records;

CREATE OR REPLACE VIEW api.clinical_encounters
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_encounters;

CREATE OR REPLACE VIEW api.clinical_calculations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_calculations;

CREATE OR REPLACE VIEW api.clinical_recommendations
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_recommendations;

CREATE OR REPLACE VIEW api.clinical_prescriptions
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_prescriptions;

CREATE OR REPLACE VIEW api.clinical_dispensing_events
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_dispensing_events;

CREATE OR REPLACE VIEW api.clinical_jurisdiction_authority
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_jurisdiction_authority;

CREATE OR REPLACE VIEW api.clinical_clinician_links
WITH (security_invoker = true) AS
SELECT * FROM public.clinical_clinician_links;

-- Expose verification fields needed by clinical UI (not public directory)
CREATE OR REPLACE VIEW api.clinical_my_professional
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.title,
  p.credential_type,
  p.verification_status,
  p.status,
  p.licence_number,
  p.licence_jurisdiction,
  p.clinical_role,
  p.user_id,
  p.countries,
  p.specialties
FROM public.hv_professionals p
WHERE p.user_id = (SELECT auth.uid());

GRANT SELECT ON api.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_care_team TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_consent_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_encounters TO authenticated;
GRANT SELECT, INSERT ON api.clinical_calculations TO authenticated;
GRANT SELECT, INSERT ON api.clinical_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.clinical_prescriptions TO authenticated;
GRANT SELECT, INSERT ON api.clinical_dispensing_events TO authenticated;
GRANT SELECT ON api.clinical_jurisdiction_authority TO authenticated;
GRANT SELECT ON api.clinical_clinician_links TO authenticated;
GRANT SELECT ON api.clinical_my_professional TO authenticated;

GRANT ALL ON api.clinical_patients TO service_role;
GRANT ALL ON api.clinical_care_team TO service_role;
GRANT ALL ON api.clinical_consent_records TO service_role;
GRANT ALL ON api.clinical_encounters TO service_role;
GRANT ALL ON api.clinical_calculations TO service_role;
GRANT ALL ON api.clinical_recommendations TO service_role;
GRANT ALL ON api.clinical_prescriptions TO service_role;
GRANT ALL ON api.clinical_dispensing_events TO service_role;
GRANT ALL ON api.clinical_jurisdiction_authority TO service_role;
GRANT ALL ON api.clinical_clinician_links TO service_role;
GRANT ALL ON api.clinical_my_professional TO service_role;

-- Gate helper callable from app
CREATE OR REPLACE FUNCTION api.is_verified_clinician(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_verified_clinician(p_user_id);
$$;

REVOKE ALL ON FUNCTION api.is_verified_clinician(uuid) FROM public;
GRANT EXECUTE ON FUNCTION api.is_verified_clinician(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION api.clinical_has_active_consent(p_patient_id uuid, p_consent_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.clinical_has_active_consent(p_patient_id, p_consent_type);
$$;

REVOKE ALL ON FUNCTION api.clinical_has_active_consent(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_has_active_consent(uuid, text) TO authenticated, service_role;

-- Clinician self-service: request clinical verification fields on linked/owned profile
CREATE OR REPLACE FUNCTION api.clinical_request_verification(
  p_licence_number text,
  p_licence_jurisdiction text,
  p_clinical_role text,
  p_professional_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_clinical_role IS NULL OR p_clinical_role NOT IN (
    'doctor', 'pharmacist', 'nurse', 'nurse_practitioner', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid clinical_role' USING ERRCODE = '22023';
  END IF;

  IF p_licence_number IS NULL OR length(trim(p_licence_number)) < 2 THEN
    RAISE EXCEPTION 'licence_number required' USING ERRCODE = '22023';
  END IF;

  IF p_licence_jurisdiction IS NULL OR length(trim(p_licence_jurisdiction)) < 2 THEN
    RAISE EXCEPTION 'licence_jurisdiction required' USING ERRCODE = '22023';
  END IF;

  IF p_professional_id IS NOT NULL THEN
    UPDATE public.hv_professionals
    SET
      licence_number = trim(p_licence_number),
      licence_jurisdiction = upper(trim(p_licence_jurisdiction)),
      clinical_role = p_clinical_role,
      user_id = COALESCE(user_id, v_uid),
      verification_status = CASE
        WHEN verification_status = 'verified' THEN verification_status
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = p_professional_id
      AND (user_id IS NULL OR user_id = v_uid)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.hv_professionals
    SET
      licence_number = trim(p_licence_number),
      licence_jurisdiction = upper(trim(p_licence_jurisdiction)),
      clinical_role = p_clinical_role,
      user_id = COALESCE(user_id, v_uid),
      verification_status = CASE
        WHEN verification_status = 'verified' THEN verification_status
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE user_id = v_uid
    RETURNING id INTO v_id;
  END IF;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'professional profile not found for user' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.clinical_clinician_links (user_id, professional_id, link_status, linked_by)
  VALUES (v_uid, v_id, 'active', v_uid)
  ON CONFLICT (user_id, professional_id) DO UPDATE
    SET link_status = 'active';

  PERFORM public.clinical_audit_write(
    'clinician.verification_requested',
    'hv_professionals',
    v_id::text,
    upper(trim(p_licence_jurisdiction)),
    jsonb_build_object('clinical_role', p_clinical_role),
    v_uid
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION api.clinical_request_verification(text, text, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_request_verification(text, text, text, uuid) TO authenticated, service_role;

-- Admin approve (requires user_roles admin/operator)
CREATE OR REPLACE FUNCTION api.clinical_admin_verify_professional(
  p_professional_id uuid,
  p_approve boolean,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ok boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_uid AND role IN ('admin', 'operator')
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'admin or operator required' USING ERRCODE = '42501';
  END IF;

  IF p_approve THEN
    UPDATE public.hv_professionals
    SET
      verification_status = 'verified',
      status = 'active',
      verified_by = v_uid,
      verification_notes = p_notes,
      verified_at = COALESCE(verified_at, now()),
      updated_at = now()
    WHERE id = p_professional_id
      AND clinical_role IS NOT NULL
      AND licence_number IS NOT NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'professional not eligible for clinical verify' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.clinical_clinician_links (user_id, professional_id, link_status, linked_by)
    SELECT user_id, id, 'active', v_uid
    FROM public.hv_professionals
    WHERE id = p_professional_id AND user_id IS NOT NULL
    ON CONFLICT (user_id, professional_id) DO UPDATE SET link_status = 'active';

    PERFORM public.clinical_audit_write(
      'clinician.verified',
      'hv_professionals',
      p_professional_id::text,
      NULL,
      jsonb_build_object('notes', p_notes),
      v_uid,
      'admin'
    );
  ELSE
    UPDATE public.hv_professionals
    SET
      verification_status = 'rejected',
      verified_by = v_uid,
      verification_notes = p_notes,
      updated_at = now()
    WHERE id = p_professional_id;

    PERFORM public.clinical_audit_write(
      'clinician.rejected',
      'hv_professionals',
      p_professional_id::text,
      NULL,
      jsonb_build_object('notes', p_notes),
      v_uid,
      'admin'
    );
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION api.clinical_admin_verify_professional(uuid, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION api.clinical_admin_verify_professional(uuid, boolean, text) TO authenticated, service_role;
