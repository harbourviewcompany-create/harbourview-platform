-- Exposes regulatory_pathways + pathway_format_rules (the per-country,
-- per-product-format legal-viability data -- legal basis, qualifying
-- conditions, THC/CBD limits, possession limits per format) through the api
-- schema for the first time, gated on the intel/operator tier.
--
-- Both tables previously had a fully public read policy (`using (true)` for
-- anon + authenticated) -- reasonable while nothing consumed them, but not
-- the intended access level now that this is the paid-tier product surface.
-- product_formats (the 17-row format taxonomy: flower/extract/oil/edible/
-- etc.) is deliberately left public -- it's a reference list, not the
-- proprietary analysis; gating it would just be friction with no
-- commercial purpose.
--
-- Applied directly first given this touches the current subscription/RLS
-- boundary; this commits the matching file. Tested: policy content and view
-- reloptions confirmed directly against pg_policies/pg_class before writing
-- this file, not just asserted.

drop policy if exists regulatory_pathways_public_read on public.regulatory_pathways;
create policy regulatory_pathways_tier_read on public.regulatory_pathways
  for select
  using (public.current_user_tier() in ('intel','operator'));

drop policy if exists pathway_format_rules_public_read on public.pathway_format_rules;
create policy pathway_format_rules_tier_read on public.pathway_format_rules
  for select
  using (public.current_user_tier() in ('intel','operator'));

-- anon can never pass current_user_tier() (no auth.uid()), so it could never
-- read a row even with the grant -- revoked anyway so the grant list
-- reflects actual intent, not just what RLS happens to block.
revoke select on public.regulatory_pathways from anon;
revoke select on public.pathway_format_rules from anon;
grant select on public.regulatory_pathways to authenticated;
grant select on public.pathway_format_rules to authenticated;

create or replace view api.regulatory_pathways
with (security_invoker = true) as
select id, iso_alpha2, name, pathway_type, status, legal_basis, regulator,
       effective_date, sunset_date, qualifying_conditions, prescriber_scope,
       min_age, reimbursement, summary, verification, last_verified_at
from public.regulatory_pathways;

create or replace view api.pathway_format_rules
with (security_invoker = true) as
select id, pathway_id, format_id, status, thc_limit, cbd_limit, conditions,
       notes, possession_limit, unit_dose_limit, packaging_labelling,
       verification, last_verified_at, effective_date
from public.pathway_format_rules;

grant select on api.regulatory_pathways to authenticated;
grant select on api.pathway_format_rules to authenticated;

-- product_formats had no api exposure at all yet (found via
-- get_tables_missing_from_api_schema) -- needed so the format picker can
-- query it through the same client. Public, matching its role as a
-- reference taxonomy rather than gated intelligence.
create or replace view api.product_formats
with (security_invoker = true) as
select id, slug, name, category, description, sort_order
from public.product_formats;

grant select on api.product_formats to anon, authenticated;

-- security_invoker = true is set explicitly above rather than relying solely
-- on the enforce_api_view_security_invoker_trigger event trigger from
-- 20260713070355 -- belt and suspenders, since RLS enforcement is the entire
-- point of this migration.
