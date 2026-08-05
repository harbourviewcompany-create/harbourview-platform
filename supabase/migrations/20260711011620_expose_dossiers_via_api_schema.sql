-- Restore the exact production-owned body for migration 20260711011620.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.dossiers as
select
  id,
  title,
  created_at,
  country_id,
  storage_bucket,
  file_path,
  file_size_bytes,
  maturity_score,
  maturity_tier,
  page_count,
  updated_at,
  drive_file_id
from public.dossiers;

grant select on api.dossiers to authenticated, service_role;
