-- Ledger-exact production reconciliation for 20260916171025.
-- Scope consent checks to the verified clinician's active care-team context.
-- This prevents arbitrary authenticated users from probing patient consent state by UUID.

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
  SELECT
    public.is_verified_clinician()
    AND EXISTS (
      SELECT 1
      FROM public.clinical_care_team ct
      WHERE ct.patient_id = p_patient_id
        AND ct.user_id = auth.uid()
        AND ct.membership_status = 'active'
        AND ct.role IN ('treating_clinician', 'pharmacist', 'care_coordinator')
    )
    AND EXISTS (
      SELECT 1
      FROM public.clinical_consent_records c
      WHERE c.patient_id = p_patient_id
        AND c.consent_type = p_consent_type
        AND c.status = 'granted'
        AND c.effective_from <= now()
        AND (c.effective_to IS NULL OR c.effective_to > now())
    );
$$;

REVOKE ALL ON FUNCTION public.clinical_has_active_consent(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_has_active_consent(uuid, text) TO authenticated, service_role;

-- This helper is consumed by trusted write paths/triggers; it is not a client RPC.
REVOKE ALL ON FUNCTION public.clinical_require_core_consent(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.clinical_require_core_consent(uuid) TO service_role;
