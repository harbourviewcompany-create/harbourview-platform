-- Clinical Prescriber OS — expose public tables through the `api` schema.
--
-- Production PostgREST only exposes schema `api` (see lib/supabase/env.ts
-- SUPABASE_DB_SCHEMA). Tables physically live in `public`. Without matching
-- `api.*` views, supabase-js reports:
--   Could not find the table 'api.clinical_safety_rules' in the schema cache
-- (and the same for regimen, monitoring, guideline tables).
--
-- This migration is additive and idempotent. It does not invent clinical claims.
-- Prerequisite: public.clinical_* objects from 20260818213000 (and monitoring
-- from 20260818210936) must already exist, or create-view will fail closed.

create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helper: drop + recreate view so column drift from later public alters is OK
-- ---------------------------------------------------------------------------

-- Safety rules
drop view if exists api.clinical_safety_rules cascade;
create view api.clinical_safety_rules
with (security_invoker = true)
as
select *
from public.clinical_safety_rules;

grant select on api.clinical_safety_rules to authenticated, service_role;
revoke all on api.clinical_safety_rules from anon;

-- Regimen protocols
drop view if exists api.clinical_regimen_protocols cascade;
create view api.clinical_regimen_protocols
with (security_invoker = true)
as
select *
from public.clinical_regimen_protocols;

grant select on api.clinical_regimen_protocols to authenticated, service_role;
revoke all on api.clinical_regimen_protocols from anon;

-- Monitoring protocols (table may pre-exist from 20260818210936)
drop view if exists api.clinical_monitoring_protocols cascade;
create view api.clinical_monitoring_protocols
with (security_invoker = true)
as
select *
from public.clinical_monitoring_protocols;

grant select on api.clinical_monitoring_protocols to authenticated, service_role;
-- Match historical public grant for published monitoring where intentional:
grant select on api.clinical_monitoring_protocols to anon;

-- Guideline recommendations
drop view if exists api.clinical_guideline_recommendations cascade;
create view api.clinical_guideline_recommendations
with (security_invoker = true)
as
select *
from public.clinical_guideline_recommendations;

grant select on api.clinical_guideline_recommendations to authenticated, service_role;
revoke all on api.clinical_guideline_recommendations from anon;

-- Core evidence + interactions + formulary surfaces used by workspace / ask
drop view if exists api.clinical_evidence_records cascade;
create view api.clinical_evidence_records
with (security_invoker = true)
as
select *
from public.clinical_evidence_records;

grant select on api.clinical_evidence_records to anon, authenticated, service_role;

drop view if exists api.clinical_evidence_change_events cascade;
create view api.clinical_evidence_change_events
with (security_invoker = true)
as
select *
from public.clinical_evidence_change_events;

grant select on api.clinical_evidence_change_events to anon, authenticated, service_role;

drop view if exists api.clinical_condition_terms cascade;
create view api.clinical_condition_terms
with (security_invoker = true)
as
select *
from public.clinical_condition_terms;

grant select on api.clinical_condition_terms to anon, authenticated, service_role;

drop view if exists api.clinical_medication_interactions cascade;
create view api.clinical_medication_interactions
with (security_invoker = true)
as
select *
from public.clinical_medication_interactions;

grant select on api.clinical_medication_interactions to authenticated, service_role;

drop view if exists api.clinical_formulary_products cascade;
create view api.clinical_formulary_products
with (security_invoker = true)
as
select *
from public.clinical_formulary_products;

grant select on api.clinical_formulary_products to anon, authenticated, service_role;

drop view if exists api.clinical_formulary_skus cascade;
create view api.clinical_formulary_skus
with (security_invoker = true)
as
select *
from public.clinical_formulary_skus;

grant select on api.clinical_formulary_skus to anon, authenticated, service_role;

-- Concepts (Evidence OS) when present
do $block$
begin
  if to_regclass('public.clinical_concepts') is not null then
    execute 'drop view if exists api.clinical_concepts cascade';
    execute $v$
      create view api.clinical_concepts
      with (security_invoker = true)
      as select * from public.clinical_concepts
    $v$;
    execute 'grant select on api.clinical_concepts to authenticated, service_role';
  end if;

  if to_regclass('public.clinical_concept_aliases') is not null then
    execute 'drop view if exists api.clinical_concept_aliases cascade';
    execute $v$
      create view api.clinical_concept_aliases
      with (security_invoker = true)
      as select * from public.clinical_concept_aliases
    $v$;
    execute 'grant select on api.clinical_concept_aliases to authenticated, service_role';
  end if;
end
$block$;

comment on view api.clinical_safety_rules is
  'API projection of public.clinical_safety_rules (security_invoker; RLS applies).';
comment on view api.clinical_regimen_protocols is
  'API projection of public.clinical_regimen_protocols (security_invoker; RLS applies).';
comment on view api.clinical_monitoring_protocols is
  'API projection of public.clinical_monitoring_protocols (security_invoker; RLS applies).';
comment on view api.clinical_guideline_recommendations is
  'API projection of public.clinical_guideline_recommendations (security_invoker; RLS applies).';
