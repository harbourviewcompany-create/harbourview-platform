-- Restore the exact production-owned body for migration 20260711010651.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

create view api.hv_facilities as
select
  id,
  org_id,
  name,
  facility_type,
  country,
  region,
  gmp_certified,
  gacp_certified,
  certification_evidence_id,
  status,
  created_at
from public.hv_facilities;

grant select, insert, update on api.hv_facilities to authenticated, service_role;

create view api.hv_licences as
select
  id,
  org_id,
  licence_number,
  issuing_authority,
  jurisdiction_country,
  jurisdiction_region,
  licence_type,
  permitted_activities,
  issued_at,
  expires_at,
  status,
  evidence_document_id,
  verified,
  verified_at,
  verified_by,
  created_at,
  updated_at
from public.hv_licences;

grant select, insert, update on api.hv_licences to authenticated, service_role;

create view api.hv_passport_scores as
select
  id,
  passport_id,
  dimension,
  score,
  max_score,
  confidence,
  evidence_count,
  flags,
  computed_at
from public.hv_passport_scores;

grant select, insert, update on api.hv_passport_scores to authenticated, service_role;
