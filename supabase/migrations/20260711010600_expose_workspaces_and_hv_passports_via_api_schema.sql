-- Restore the exact production-owned body for migration 20260711010600.
-- The previous local reconciliation stub omitted the API views that the later
-- security-invoker hardening migration expects to exist.

create view api.workspaces as
select
  id,
  name,
  created_at,
  slug,
  settings,
  status,
  updated_at,
  legal_name,
  trade_name,
  org_type,
  jurisdiction_country,
  jurisdiction_region,
  verification_status,
  verified_at,
  verified_by,
  is_public
from public.workspaces;

grant select, insert, update on api.workspaces to authenticated;
grant select, insert, update on api.workspaces to service_role;

create view api.hv_passports as
select
  id,
  org_id,
  completeness_score,
  completeness_band,
  verification_level,
  export_readiness_score,
  export_readiness_band,
  import_readiness_score,
  deal_readiness_score,
  payment_readiness_signals,
  recall_exposure_flag,
  last_computed_at,
  public_snapshot,
  created_at,
  updated_at
from public.hv_passports;

grant select, insert, update on api.hv_passports to authenticated;
grant select, insert, update on api.hv_passports to service_role;
