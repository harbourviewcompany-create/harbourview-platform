-- Restore the exact production-owned body for migration 20260711011701.
-- The previous local reconciliation stub omitted the API view that the later
-- security-invoker hardening migration expects to exist.

create view api.user_dashboard_preferences as
select
  id,
  user_id,
  country_iso2,
  role_id,
  heatmap_layer,
  created_at,
  updated_at
from public.user_dashboard_preferences;

grant select, insert, update, delete on api.user_dashboard_preferences to authenticated;
grant select, insert, update, delete on api.user_dashboard_preferences to service_role;
