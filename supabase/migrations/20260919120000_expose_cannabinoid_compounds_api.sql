-- Exposes public.cannabinoid_compounds (added by the Legal/Research MCP pipeline
-- session on 2026-09-19) to PostgREST via the api schema, matching the
-- SUPABASE_DB_SCHEMA='api' convention (PostgREST only exposes the api schema on
-- this project -- see lib/supabase/env.ts and prior EVIDENCE_LOG entries).
--
-- Read-only, public-safe reference fields only: excludes internal bookkeeping
-- (source_refs jsonb payload) that isn't meant for the public research page.
-- Grants SELECT to anon/authenticated because this powers a PUBLIC intelligence
-- page (app/intelligence/cannabinoid-research), not an admin surface -- unlike
-- api.intel_eval_labeling, which is service_role-only.

create or replace view api.cannabinoid_compounds as
select
  id,
  chembl_id,
  pref_name,
  max_phase,
  first_approval,
  is_natural_product,
  is_approved_drug,
  therapeutic_flag,
  molecular_formula,
  synonyms,
  atc_codes,
  regulatory_notes,
  fetched_at,
  updated_at
from public.cannabinoid_compounds;

grant select on api.cannabinoid_compounds to anon, authenticated;

comment on view api.cannabinoid_compounds is
  'Public-safe projection of public.cannabinoid_compounds for the /intelligence/cannabinoid-research page. Rollback: drop view api.cannabinoid_compounds.';
