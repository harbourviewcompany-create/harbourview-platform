-- Restore the exact production-owned body for migration 20260711012305.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.hv_claims as
select
  id,
  org_id,
  claim_type,
  claim_text,
  evidence_document_id,
  status,
  is_public,
  created_at,
  updated_at
from public.hv_claims;

grant select, insert, update on api.hv_claims to authenticated, service_role;
