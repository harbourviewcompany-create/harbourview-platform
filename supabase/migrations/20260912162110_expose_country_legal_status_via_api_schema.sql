-- Production reconciliation: this migration was already applied in Supabase
-- under version 20260912162110. The artifact is restored here verbatim from
-- the production migration ledger so repository and production state agree.

create or replace view api.country_cannabis_legal_status_v1
with (security_invoker = on) as
select iso2, country_name, legal_status, notes, last_reviewed
from public.country_cannabis_legal_status;

grant select on api.country_cannabis_legal_status_v1 to anon, authenticated;
