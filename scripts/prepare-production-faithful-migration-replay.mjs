#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'
const EQUIVALENCE_FILE = 'supabase/release-controls/migration-live-version-equivalences.json'
const MIGRATIONS_DIR = 'supabase/migrations'
const EXCLUDED_SUFFIX = '.replay-excluded'

// Production can contain out-of-band drift or duplicate registrations that a
// later migration repairs/replays even though a repository zero-state replay
// already contains the intended post-state from earlier checked-in history.
// Skip only explicitly evidenced files. This is a temporary replay-only
// exclusion; checked-in history and the production migration ledger are not
// changed.
const REPLAY_ZERO_STATE_SKIPS = [
  '20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql',
  '20260714224152_create_intel_eval_set_stage0.sql',
  '20260714225601_expose_intel_eval_set_via_api_schema.sql',
  '20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql',
  // Production recorded job IDs 47/48, but replay-created pg_cron IDs are
  // database-local. The immediately-following 20260722185015 migration resolves
  // the same two jobs by name and applies the same active=true state.
  '20260722182917_enable_hv_quality_pipeline_and_promote_crons.sql',
]

// A recorded reconstruction/reconciliation can have a timestamp later than the
// first historical migration that explicitly depends on the state it restores.
// Relocate only an exact evidenced file inside the zero-state workspace; the
// checked-in file and production migration ledger remain unchanged.
const REPLAY_RELOCATIONS = [
  {
    source: '20260701230000_corridor_intelligence_tables_stub.sql',
    destination: '20260701180750_replay_corridor_intelligence_tables_stub.sql',
    before: '20260701180751_remote_applied_repair.sql',
  },
  {
    source: '20260730220050_reconcile_listings_production_columns.sql',
    destination: '20260730211140_replay_reconcile_listings_production_columns.sql',
    before: '20260730211147_create_supply_catalog_public_view.sql',
  },
  {
    source: '20260819100621_clinical_evidence_spine_reconcile.sql',
    destination: '20260818212759_replay_clinical_evidence_spine_reconcile.sql',
    before: '20260818212800_clinical_prescriber_governance_preflight.sql',
  },
  {
    source: '20260821120000_talent_job_board.sql',
    destination: '20260820235959_replay_talent_job_board.sql',
    before: '20260821000000_performance_advisor_fixes.sql',
  },
]

// Supabase's migration ledger keys on the fourteen-digit version, so independent
// checked-in files with the same version cannot all replay. Keep every body and
// move only the later-sorted member of each exact collision to an unused adjacent
// version in the temporary workspace. No source file or production-ledger row is
// renamed.
const REPLAY_VERSION_COLLISION_RENAMES = [
  {
    source: '20260813010000_extend_supply_catalog_equipment_to_australia.sql',
    sibling: '20260813010000_baseline_capture_pipeline_task_queue.sql',
    destination: '20260813010001_replay_extend_supply_catalog_equipment_to_australia.sql',
    before: '20260813020000_baseline_capture_reporting_and_triggers.sql',
  },
  {
    source: '20260820120000_heatmap_conflict_freeze_seed.sql',
    sibling: '20260820120000_clinical_pilot_local_authorities_au_gb_br.sql',
    destination: '20260820120001_replay_heatmap_conflict_freeze_seed.sql',
    before: '20260820130000_hv_pipeline_optimization.sql',
  },
]

// Production had these named RLS policies before the reconstructed 20260719083306
// ALTER POLICY migration ran. Current repository history rebuilds the tables but
// not the policy identities, so zero-state replay cannot execute the recorded
// ALTER POLICY statements. Materialize only the missing identities in the replay
// workspace, fail closed with USING (false), and let the immediately-following
// production-recorded migration replace both predicates. No checked-in migration
// or production ledger entry is changed.
const REPLAY_SYNTHETIC_FOUNDATIONS = [
  {
    destination: '20260923000959_replay_jurisdiction_data_depth_evidence.sql',
    before: '20260923001000_full_depth_dynamic_evaluator.sql',
    required: [
      '20260923001000_full_depth_dynamic_evaluator.sql',
      '20260923131000_authoritative_full_depth_evidence_store.sql',
    ],
    content: `-- Replay-only reconstruction of the authoritative depth evidence relation.
-- The recorded dynamic evaluator queries this table before the repository's
-- canonical table migration at 20260923131000. Production already had the
-- relation at evaluator time. Materialize the canonical table shape only in
-- the temporary replay workspace; the later migration remains authoritative
-- for indexes, RLS, grants and the evidence-gate view.
create table if not exists public.jurisdiction_data_depth_evidence (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key) on update cascade on delete cascade,
  evidence_kind text not null check (evidence_kind in ('authority_rule','authority_statement','structural_fact','verified_research')),
  applicability text not null check (applicability in ('applicable','not_applicable')),
  evidence_payload jsonb not null,
  evidence_quote text not null,
  source_registry_id uuid not null references public.source_registry(id) on delete restrict,
  source_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  source_url text not null,
  effective_from date,
  effective_to date,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace view public.v_jurisdiction_verified_snapshot_gate
with (security_invoker = on) as
select
  ss.id snapshot_id,
  ss.source_id,
  ss.raw_html_hash snapshot_hash,
  ss.captured_at fetched_at,
  ss.fetch_status,
  sr.source_url registered_source_url,
  case
    when ss.id is null then false
    when lower(ss.raw_html_hash) !~ '^[0-9a-f]{64}$' then false
    when ss.captured_at is null then false
    when ss.fetch_status <> 'success' then false
    when ss.captured_text is null or length(ss.captured_text)=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;
`,
  },
  {
    destination: '20260922189959_replay_gt_market_access_evidence.sql',
    before: '20260922190000_primary_gt_enrichment.sql',
    required: [
      '20260922190000_primary_gt_enrichment.sql',
    ],
    content: `-- Replay-only reconstruction of the Guatemala evidence parent that existed
-- before the recorded 20260922190000 claim insert ran in production.
--
-- The production migration updates this legacy evidence identity before writing
-- an FK-backed claim. Repository zero-state has no earlier creator for that row,
-- so materialize only the missing parent in the temporary replay workspace.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('hv-mkt-complete-gt-20260913','GT','prohibited',
 'Replay parent for the production Guatemala primary-source enrichment migration.',
 'Congress of the Republic of Guatemala / Ministry of Public Health',
 'https://www.congreso.gob.gt/detalle_pdf/decretos/1217',
 date '1992-09-23',now(),now()+interval '180 days',true)
on conflict (evidence_key) do nothing;
`,
  },
  {
    destination: '20260922111959_replay_fo_gl_market_access_evidence.sql',
    before: '20260922112000_depth_primary_reconciliation_fo_gl_territories.sql',
    required: [
      '20260922112000_depth_primary_reconciliation_fo_gl_territories.sql',
      '20260926032000_repair_fo_gl_regulatory_evidence_fk.sql',
    ],
    content: `-- Replay-only reconstruction of the FO/GL evidence parents that existed
-- before the recorded 20260922112000 claim insert ran in production.
--
-- The canonical repository history contains the forward repair at
-- 20260926032000, but a zero-state replay reaches the FK-dependent claims first.
-- Materialize only the missing parent rows in the temporary replay workspace;
-- checked-in migration bodies and the production ledger remain immutable.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('hv-mkt-complete-fo-20260913','FO','medical_limited_trade',
 'Faroe Islands Regulation No. 495 of 26 May 2026 lists cannabis in the controlled-substance schedules; authorized activity is within the medical/scientific framework and no general adult-use retail pathway is established by the cited instrument.',
 'Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances',
 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer',
 date '2026-05-26',now(),now()+interval '1 year',true),
('hv-mkt-complete-gl-20260913','GL','medical_limited_trade',
 'Greenland controlled-substance law places cannabis within an authorization-based medical/scientific framework; no general adult-use commercial retail pathway is established by the cited framework.',
 'Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances',
 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',
 null,now(),now()+interval '1 year',true)
on conflict (evidence_key) do nothing;
`,
  },
  {
    destination: '20260922104459_replay_jurisdiction_data_depth_tasks.sql',
    before: '20260922104500_primary_us_jurisdiction_depth_enrichment.sql',
    required: [
      '20260922101323_jurisdiction_data_depth_v1.sql',
      '20260922104500_primary_us_jurisdiction_depth_enrichment.sql',
    ],
    content: `-- Replay-only foundation for the production jurisdiction data-depth task queue.
--
-- The repository contains consumers of this task table but no canonical CREATE TABLE
-- migration. The temporary table carries the columns exercised by the recovered
-- migrations. It is never a production migration or migration-ledger entry.
create table if not exists public.jurisdiction_data_depth_tasks (
  id bigint generated by default as identity primary key,
  jurisdiction_key text not null,
  dimension_key text not null,
  jurisdiction_level text,
  status text not null default 'open',
  priority integer not null default 0,
  evidence_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
`,
  },
  {
    destination: '20260921004055_replay_claude_push_staging.sql',
    before: '20260921004056_harden_internal_tables_and_rules_repair_rpc.sql',
    required: [
      '20260723183914_lock_down_21_anon_exposed_public_tables.sql',
      '20260921004056_harden_internal_tables_and_rules_repair_rpc.sql',
    ],
    content: `-- Replay-only relation foundation for the production _claude_push_staging table.
--
-- The production table is referenced by the recovered security-hardening migration,
-- but no canonical CREATE TABLE migration exists in the repository history. The
-- temporary relation is intentionally minimal because this replay only requires
-- the relation to exist for RLS/grant hardening. It is never a production migration
-- or migration-ledger entry.
create table if not exists public._claude_push_staging (
  id bigint generated by default as identity primary key
);
`,
  },
  {
    destination: '20260920204959_replay_gemini_embedding_column.sql',
    before: '20260920205000_optimize_gemini_embedding_queue_scan.sql',
    required: [
      '20260617191632_signals_embedding_1024.sql',
      '20260920205000_optimize_gemini_embedding_queue_scan.sql',
    ],
    content: `-- Replay-only reconstruction of the production Gemini embedding column.
--
-- Production has a 1024-dimensional Gemini embedding column on public.signals,
-- but the recovered repository migration history contains consumers of that
-- column without a canonical CREATE/ALTER COLUMN migration. This foundation
-- exists only in the temporary production-faithful replay workspace so later
-- historical migrations can execute. It is never a production migration or
-- migration-ledger entry.
alter table public.signals
  a then false
    when ss.captured_at is null then false
    when ss.fetch_status <> 'success' then false
    when ss.captured_text is null or length(ss.captured_text)=0 then false
    when sr.id is null or sr.source_url is null then false
    else true
  end qualifying_snapshot
from public.source_snapshots ss
left join public.source_registry sr on sr.id=ss.source_id;
`,
  },
  {
    destination: '20260922189959_replay_gt_market_access_evidence.sql',
    before: '20260922190000_primary_gt_enrichment.sql',
    required: [
      '20260922190000_primary_gt_enrichment.sql',
    ],
    content: `-- Replay-only reconstruction of the Guatemala evidence parent that existed
-- before the recorded 20260922190000 claim insert ran in production.
--
-- The production migration updates this legacy evidence identity before writing
-- an FK-backed claim. Repository zero-state has no earlier creator for that row,
-- so materialize only the missing parent in the temporary replay workspace.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('hv-mkt-complete-gt-20260913','GT','prohibited',
 'Replay parent for the production Guatemala primary-source enrichment migration.',
 'Congress of the Republic of Guatemala / Ministry of Public Health',
 'https://www.congreso.gob.gt/detalle_pdf/decretos/1217',
 date '1992-09-23',now(),now()+interval '180 days',true)
on conflict (evidence_key) do nothing;
`,
  },
  {
    destination: '20260922111959_replay_fo_gl_market_access_evidence.sql',
    before: '20260922112000_depth_primary_reconciliation_fo_gl_territories.sql',
    required: [
      '20260922112000_depth_primary_reconciliation_fo_gl_territories.sql',
      '20260926032000_repair_fo_gl_regulatory_evidence_fk.sql',
    ],
    content: `-- Replay-only reconstruction of the FO/GL evidence parents that existed
-- before the recorded 20260922112000 claim insert ran in production.
--
-- The canonical repository history contains the forward repair at
-- 20260926032000, but a zero-state replay reaches the FK-dependent claims first.
-- Materialize only the missing parent rows in the temporary replay workspace;
-- checked-in migration bodies and the production ledger remain immutable.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,active)
values
('hv-mkt-complete-fo-20260913','FO','medical_limited_trade',
 'Faroe Islands Regulation No. 495 of 26 May 2026 lists cannabis in the controlled-substance schedules; authorized activity is within the medical/scientific framework and no general adult-use retail pathway is established by the cited instrument.',
 'Lógasavn / Faroe Islands — Regulation No. 495 of 26 May 2026 on controlled substances',
 'https://www.logir.fo/Bekendtgorelse/495-af-26-05-2026-for-Faeroerne-om-euforiserende-stoffer',
 date '2026-05-26',now(),now()+interval '1 year',true),
('hv-mkt-complete-gl-20260913','GL','medical_limited_trade',
 'Greenland controlled-substance law places cannabis within an authorization-based medical/scientific framework; no general adult-use commercial retail pathway is established by the cited framework.',
 'Greenland Self-Government — Regulation No. 61 of 22 August 2025 on controlled substances',
 'https://nalunaarutit.gl/groenlandsk-lovgivning/2025/selvstyrets-bekendtgørelse-nr-61-af-01_09_2025?sc_lang=da',
 null,now(),now()+interval '1 year',true)
on conflict (evidence_key) do nothing;
`,
  },
  {
    destination: '20260922104459_replay_jurisdiction_data_depth_tasks.sql',
    before: '20260922104500_primary_us_jurisdiction_depth_enrichment.sql',
    required: [
      '20260922101323_jurisdiction_data_depth_v1.sql',
      '20260922104500_primary_us_jurisdiction_depth_enrichment.sql',
    ],
    content: `-- Replay-only foundation for the production jurisdiction data-depth task queue.
--
-- The repository contains consumers of this task table but no canonical CREATE TABLE
-- migration. The temporary table carries the columns exercised by the recovered
-- migrations. It is never a production migration or migration-ledger entry.
create table if not exists public.jurisdiction_data_depth_tasks (
  id bigint generated by default as identity primary key,
  jurisdiction_key text not null,
  dimension_key text not null,
  jurisdiction_level text,
  status text not null default 'open',
  priority integer not null default 0,
  evidence_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
`,
  },
  {
    destination: '20260921004055_replay_claude_push_staging.sql',
    before: '20260921004056_harden_internal_tables_and_rules_repair_rpc.sql',
    required: [
      '20260723183914_lock_down_21_anon_exposed_public_tables.sql',
      '20260921004056_harden_internal_tables_and_rules_repair_rpc.sql',
    ],
    content: `-- Replay-only relation foundation for the production _claude_push_staging table.
--
-- The production table is referenced by the recovered security-hardening migration,
-- but no canonical CREATE TABLE migration exists in the repository history. The
-- temporary relation is intentionally minimal because this replay only requires
-- the relation to exist for RLS/grant hardening. It is never a production migration
-- or migration-ledger entry.
create table if not exists public._claude_push_staging (
  id bigint generated by default as identity primary key
);
`,
  },
  {
    destination: '20260920204959_replay_gemini_embedding_column.sql',
    before: '20260920205000_optimize_gemini_embedding_queue_scan.sql',
    required: [
      '20260617191632_signals_embedding_1024.sql',
      '20260920205000_optimize_gemini_embedding_queue_scan.sql',
    ],
    content: `-- Replay-only reconstruction of the production Gemini embedding column.
--
-- Production has a 1024-dimensional Gemini embedding column on public.signals,
-- but the recovered repository migration history contains consumers of that
-- column without a canonical CREATE/ALTER COLUMN migration. This foundation
-- exists only in the temporary production-faithful replay workspace so later
-- historical migrations can execute. It is never a production migration or
-- migration-ledger entry.
alter table public.signals
  add column if not exists embedding_gemini_1024 vector(1024);
`,
  },
  {
    destination: '20260830135959_replay_colombia_country_briefing.sql',
    before: '20260830140000_full_regulatory_tier_coverage.sql',
    required: [
      '20260613210556_create_cc_jurisdiction_briefings.sql',
      '20260830140000_full_regulatory_tier_coverage.sql',
    ],
    content: `-- Replay-only reconstruction of Colombia's country briefing, verbatim from production.
--
-- public.cc_jurisdiction_briefings holds 302 rows in production and only 242
-- after a zero-state repository replay (verified 2026-09-06 against project
-- zvxdgdkukjrrwamdpqrg). Colombia is one of the sixty with no repository INSERT
-- anywhere in migration history: the bulk americas seeds
-- (20260621233459 / 233543 / 233640 / 233743) cover AR BB BO BR BZ CL CR CU DM
-- DO EC GD GT GY HT SV HN JM KN MX NI PA PE PY AG BS LC SR TT US UY VC VE and
-- skip CO, while 20260623100137_seed_content_depth_updates only UPDATEs a CO row
-- it assumes already exists.
--
-- 20260830140000_full_regulatory_tier_coverage then asserts that CO's stored
-- regulatory_tier equals api.derive_regulatory_tier(api.briefing_text_for_iso('CO')).
-- With no briefing row that derives NULL, so the assertion fails on replay while
-- passing in production. The text below is production's own row, read back
-- unchanged; it derives legal_commercial_access, matching the stored tier.
--
-- This file exists only in the temporary production-faithful replay workspace and
-- is never a production migration or a migration-ledger entry. The underlying gap
-- -- sixty briefings live in production with no repository record -- is NOT fixed
-- by this file and is tracked separately.

insert into public.cc_jurisdiction_briefings (
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  data_source_summary,
  verification_summary,
  update_cadence,
  coverage_summary,
  last_reviewed_date, watch_regions, change_notes, review_state
)
select
  $hvco$colombia$hvco$,
  $hvco$country$hvco$,
  $hvco$CO$hvco$,
  $hvco$Medical Legal — Export Industry Leader$hvco$,
  $hvco$Colombia was the first country in Latin America to establish a comprehensive regulated medical cannabis framework. Law 1787 of 2016 legalised medical cannabis, and Decree 631 of 2020 created the export licensing framework that has made Colombia a significant global medical cannabis producer. Colombia benefits from ideal growing conditions (tropical climate, near-equatorial light cycles, low-cost labour), making it one of the lowest-cost producers globally. Domestic adult-use remains legally ambiguous — the Constitutional Court decriminalised personal possession (up to 20g) in 1994 (Sentence C-221/94), but selling, buying, and public use remain prohibited. A 2023 bill to legalise adult-use cannabis passed the Senate but not the House; the Petro government has expressed support for adult-use legalisation.$hvco$,
  $hvco$Colombian medical cannabis patients access products through licensed pharmacies and medical dispensaries authorised under the Law 1787 framework. The Ministry of Health (MinSalud) administers patient access. Products include standardised oils, capsules, and dried flower. Domestic medical cannabis is very affordably priced given Colombia's low production costs. Patient registration is managed through the INVIMA regulatory framework.$hvco$,
  $hvco$Colombian physicians may recommend medical cannabis for qualified patients under the Law 1787 framework. INVIMA oversees product approvals. The Colombian Medical Federation has engaged with cannabis prescribing guidelines. No specialist-only restriction exists at the national level.$hvco$,
  $hvco$Colombia is primarily an export market for medical cannabis. Over 1,000 cultivation and production licences have been issued. Major Colombian cannabis companies include Clever Leaves, Khiron Life Sciences, Flora Growth, and PharmaLeaf Colombia. Export destinations include Germany, the UK, Australia, Brazil, and Mexico. Colombia's cost advantage (production cost as low as $0.10–0.30/gram dried flower) makes it highly competitive globally.$hvco$,
  $hvco$Colombia's Petro government (2022–2026) has been the most cannabis-supportive in the country's history. Adult-use legalisation faces legislative obstacles from conservative parties. If it passes, Colombia would become the first country in South America to fully legalise cannabis. The export framework is stable and well-regarded by importing countries' regulators.$hvco$,
  $hvco$INVIMA — invima.gov.co; Colombian Ministry of Justice; Agencia Nacional de Licencias Ambientales$hvco$,
  $hvco$Colombia Ministry of Justice cannabis policy data; INVIMA licensing registry; Colombia Ministerio de Salud y Protección Social publications; Clever Leaves/Khiron investor disclosures; EMCDDA Colombia country data$hvco$,
  $hvco$Current as of Q2 2026; verified against INVIMA and Colombian government official publications$hvco$,
  $hvco$Quarterly$hvco$,
  $hvco$National; 1,000+ licences issued; world's largest medical cannabis exporter by volume; growing domestic market$hvco$,
  date '2026-06-22', '[]'::jsonb, '[]'::jsonb, 'reviewed'
where not exists (
  select 1 from public.cc_jurisdiction_briefings
  where country_iso2 = 'CO' and jurisdiction_type = 'country'
);
`,
  },
  {
    destination: '20260719140825_replay_pg_trgm_extension.sql',
    before: '20260719140826_stage4_dedup_near_duplicate_signals.sql',
    required: [
      '20260719140826_stage4_dedup_near_duplicate_signals.sql',
    ],
    content: `-- Replay-only restoration of production's pg_trgm prerequisite.\n-- The immediately-following reconstructed migration calls similarity(text, text),\n-- but no recorded repository migration installs pg_trgm. This file exists only in\n-- the temporary production-faithful replay workspace and is never a production\n-- migration or migration-ledger entry.\n\ncreate schema if not exists extensions;\ncreate extension if not exists pg_trgm with schema extensions;\n`,
  },
  {
    destination: '20260719083305_replay_education_policy_identities.sql',
    before: '20260719083306_enforce_clinical_signoff_gate_in_rls.sql',
    required: [
      '20260719083250_add_clinical_signoff_gate_to_education_modules.sql',
      '20260719083306_enforce_clinical_signoff_gate_in_rls.sql',
    ],
    content: `-- Replay-only fail-closed reconstruction of policy identities that existed in production\n-- before 20260719083306. The next migration immediately replaces both USING clauses\n-- with the exact production-recorded predicates. This file exists only in the temporary\n-- production-faithful replay workspace and is never a production migration.\n\ndo $replay_policy_identity$\nbegin\n  if not exists (\n    select 1\n    from pg_policies\n    where schemaname = 'public'\n      and tablename = 'education_modules'\n      and policyname = 'education_modules_public_select'\n  ) then\n    create policy \"education_modules_public_select\"\n      on public.education_modules\n      for select\n      using (false);\n  end if;\n\n  if not exists (\n    select 1\n    from pg_policies\n    where schemaname = 'public'\n      and tablename = 'education_module_sections'\n      and policyname = 'public read sections of published modules'\n  ) then\n    create policy \"public read sections of published modules\"\n      on public.education_module_sections\n      for select\n      using (false);\n  end if;\nend\n$replay_policy_identity$;\n`,
  },
]

// Exact historical statements can depend on production-local relations or a
// catalog shape that differs from the repository's reconstructed zero state.
// Patch only the temporary replay copy with a type/absence-correct equivalent;
// checked migrations and the production ledger stay unchanged.
const REPLAY_CONTENT_PATCHES = [
  {
    file: '20260922120000_primary_tv_va_source_enrichment.sql',
    anchor: "values('39d4e117-d0ae-4669-8f0c-b631afee0ef1','TV','depth-v1-tv'",
    replacement: "values((select id from public.countries where iso_alpha2='TV' limit 1),'TV','depth-v1-tv'",
  },
  {
    file: '20260922121000_primary_ca_ke_regulatory_enrichment.sql',
    anchor: "values('a2c3726a-12a5-40c6-a640-65a735c579ac','CA','depth-v1-ca'",
    replacement: "values((select id from public.countries where iso_alpha2='CA' limit 1),'CA','depth-v1-ca'",
  },
  {
    file: '20260922121000_primary_ca_ke_regulatory_enrichment.sql',
    anchor: "values('8ff64be8-1f33-42b5-9ba7-7cdd13c6fe6a','KE','depth-v1-ke'",
    replacement: "values((select id from public.countries where iso_alpha2='KE' limit 1),'KE','depth-v1-ke'",
  },
  {
    file: '20260923061000_primary_lv_law_2026_enrichment.sql',
    anchor: "select 'a4e3067f-de8f-40a8-9633-24271c893c51','LV','depth-v1-lv-industrial-hemp'",
    replacement: "select (select id from public.countries where iso_alpha2='LV' limit 1),'LV','depth-v1-lv-industrial-hemp'",
  },
  {
    file: '20260923072000_primary_mc_cannabis_control_enrichment.sql',
    anchor: "select '1a237176-7a4f-43ba-9d94-ea63b9ad3382','MC','depth-v1-mc-authorized-non-narcotic-cannabis'",
    replacement: "select (select id from public.countries where iso_alpha2='MC' limit 1),'MC','depth-v1-mc-authorized-non-narcotic-cannabis'",
  },
  {
    file: '20260925081500_primary_vu_hemp_medical_enrichment.sql',
    anchor: "select '58526c26-b97d-410d-aa39-3e1a3b6e66b0','VU','depth-v1-vu-medical-hemp'",
    replacement: "select (select id from public.countries where iso_alpha2='VU' limit 1),'VU','depth-v1-vu-medical-hemp'",
  },
  {
    file: '20260925090000_primary_ml_law83_14_enrichment.sql',
    anchor: "select 'ee9ec5dd-845e-41ae-b088-98a84f667a74','ML','depth-v1-ml-authorized-research'",
    replacement: "select (select id from public.countries where iso_alpha2='ML' limit 1),'ML','depth-v1-ml-authorized-research'",
  },
  {
    file: '20260922233000_full_depth_dimension_state_matrix.sql',
    anchor: `select
  s.jurisdiction_key,
  c.country_name,
  s.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  s.applicability,
  s.status,
  s.blocker_reason,
  s.evidence_count,
  s.primary_source_count,
  s.latest_verified_at,
  s.freshness_deadline,
  s.confidence,
  s.evidence_basis,
  s.parent_jurisdiction_key,
  s.last_evaluated_at,
  s.contract_version
from public.jurisdiction_data_depth_dimension_state s`,
    replacement: `select
  s.jurisdiction_key,
  c.country_name,
  s.dimension_key,
  d.display_name,
  d.layer,
  d.required_for_regulatory_publication,
  d.requires_primary_source,
  s.status,
  case
    when s.evidence_count > 0 then 'evidence_present'
    when s.applicability = 'not_applicable' then 'not_applicable'
    else 'not_yet_measured'
  end as evidence_state,
  s.contract_version,
  s.applicability,
  s.blocker_reason,
  s.evidence_count,
  s.primary_source_count,
  s.latest_verified_at,
  s.freshness_deadline,
  s.confidence,
  s.evidence_basis,
  s.parent_jurisdiction_key,
  s.last_evaluated_at
from public.jurisdiction_data_depth_dimension_state s`,
  },
  {
    file: '20260922233000_full_depth_dimension_state_matrix.sql',
    anchor: `select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(
    100.0 * count(*) filter (where status='complete')
    / nullif(count(*) filter (where applicability <> 'unknown'),0), 2
  ) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or (applicability='not_applicable' and status='complete')
    or (applicability='applicable' and status='complete')
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_contract`,
    replacement: `select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where status='complete') complete_dimensions,
  count(*) filter (where status='missing') missing_dimensions,
  count(*) filter (where status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where status='unmeasured') unmeasured_dimensions,
  round(
    100.0 * count(*) filter (where status='complete')
    / nullif(count(*) filter (where applicability <> 'unknown'),0), 2
  ) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or (applicability='not_applicable' and status='complete')
    or (applicability='applicable' and status='complete')
  ) as regulatory_publication_ready,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions
from public.v_jurisdiction_data_depth_contract`,
  },
  {
    file: '20260922240000_full_depth_structured_backing_models.sql',
    anchor: "  c.jurisdiction_level,\n  case",
    replacement: "  'national',\n  case",
  },
  {
    file: '20260922234500_full_depth_dimension_source_registry.sql',
    anchor: "('import','2026-09-22.v1','partial','public.regulatory_market_access_claims'",
    replacement: "('import','2026-09-22.v1','table','public.regulatory_market_access_claims'",
  },
  {
    file: '20260922234500_full_depth_dimension_source_registry.sql',
    anchor: "('export','2026-09-22.v1','partial','public.regulatory_market_access_claims'",
    replacement: "('export','2026-09-22.v1','table','public.regulatory_market_access_claims'",
  },
  {
    file: '20260922234500_full_depth_dimension_source_registry.sql',
    anchor: "('regulator','2026-09-22.v1','partial','public.regulatory_pathways + public.source_registry'",
    replacement: "('regulator','2026-09-22.v1','derived','public.regulatory_pathways + public.source_registry'",
  },
  {
    file: '20260922234500_full_depth_dimension_source_registry.sql',
    anchor: "('opportunities','2026-09-22.v1','partial','public.countries + intelligence/network data'",
    replacement: "('opportunities','2026-09-22.v1','derived','public.countries + intelligence/network data'",
  },
  {
    file: '20260922233000_full_depth_dimension_state_matrix.sql',
    anchor: `  ) as full_depth_ready;`,
    replacement: `  ) as full_depth_ready
from public.v_jurisdiction_data_depth_contract;`,
  },
  {
    file: '20260923001000_full_depth_dynamic_evaluator.sql',
    anchor: "  select s.*, c.country_name, c.jurisdiction_level,\n         d.required_for_regulatory_publication, d.requires_primary_source, d.freshness_days",
    replacement: "  select s.*, c.country_name, 'national'::text as jurisdiction_level,\n         d.required_for_regulatory_publication, d.requires_primary_source, d.freshness_days",
  },
  {
    file: '20260923001000_full_depth_dynamic_evaluator.sql',
    anchor: `select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where evaluated_status='complete') complete_dimensions,
  count(*) filter (where evaluated_status='missing') missing_dimensions,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_dimensions,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions,
  round(100.0 * count(*) filter (where evaluated_status='complete') /
    nullif(count(*) filter (where applicability <> 'unknown'),0),2) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or evaluated_status='complete'
  ) as regulatory_publication_ready
from public.v_jurisdiction_data_depth_evaluator`,
    replacement: `select
  jurisdiction_key,
  max(country_name) country_name,
  count(*) total_contract_dimensions,
  count(*) filter (where evaluated_status='complete') complete_dimensions,
  count(*) filter (where evaluated_status='missing') missing_dimensions,
  count(*) filter (where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
  count(*) filter (where evaluated_status='unmeasured') unmeasured_dimensions,
  round(100.0 * count(*) filter (where evaluated_status='complete') /
    nullif(count(*) filter (where applicability <> 'unknown'),0),2) contract_depth_pct,
  bool_and(
    not required_for_regulatory_publication
    or evaluated_status='complete'
  ) as regulatory_publication_ready,
  count(*) filter (where applicability='unknown') unknown_applicability_dimensions,
  count(*) filter (where applicability='not_applicable') not_applicable_dimensions
from public.v_jurisdiction_data_depth_evaluator`,
  },
  {
    file: '20260923034000_evidence_architecture_hardening_003.sql',
    anchor: `select jurisdiction_key,max(country_name) country_name,count(*) total_contract_dimensions,
 count(*) filter(where evaluated_status='complete') complete_dimensions,
 count(*) filter(where evaluated_status='missing') missing_dimensions,
 count(*) filter(where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
 count(*) filter(where evaluated_status='unmeasured') unmeasured_dimensions,
 count(*) filter(where applicability='unknown') unknown_applicability_dimensions,
 count(*) filter(where applicability='not_applicable') not_applicable_dimensions,
 round(100.0*count(*) filter(where evaluated_status='complete')/nullif(count(*) filter(where applicability<>'unknown'),0),2) contract_depth_pct,
 bool_and(not required_for_regulatory_publication or evaluated_status='complete') regulatory_publication_ready
from public.v_jurisdiction_data_depth_evaluator group by jurisdiction_key;`,
    replacement: `select jurisdiction_key,max(country_name) country_name,count(*) total_contract_dimensions,
 count(*) filter(where evaluated_status='complete') complete_dimensions,
 count(*) filter(where evaluated_status='missing') missing_dimensions,
 count(*) filter(where evaluated_status in ('blocked','stale','conflict')) blocked_dimensions,
 count(*) filter(where evaluated_status='unmeasured') unmeasured_dimensions,
 round(100.0*count(*) filter(where evaluated_status='complete')/nullif(count(*) filter(where applicability<>'unknown'),0),2) contract_depth_pct,
 bool_and(not required_for_regulatory_publication or evaluated_status='complete') regulatory_publication_ready,
 count(*) filter(where applicability='unknown') unknown_applicability_dimensions,
 count(*) filter(where applicability='not_applicable') not_applicable_dimensions
from public.v_jurisdiction_data_depth_evaluator group by jurisdiction_key;`,
  },
  {
    file: '20260922233000_full_depth_dimension_state_matrix.sql',
    anchor: "from public.jurisdiction_data_depth_dimensions d\njoin public.v_jurisdiction_data_depth v\n  on v.jurisdiction_key = s.jurisdiction_key\nwhere d.dimension_key = s.dimension_key",
    replacement: "from public.jurisdiction_data_depth_dimensions d,\n     public.v_jurisdiction_data_depth v\nwhere v.jurisdiction_key = s.jurisdiction_key\n  and d.dimension_key = s.dimension_key",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "select\n  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',\n  pf.id,\n  'permitted',\n  '{\"experiment_phase\":true,\"source\":\"designated_growers\"}'::jsonb,",
    replacement: "select\n  (select id from public.regulatory_pathways where slug='nl-experiment' limit 1),\n  pf.id,\n  'permitted',\n  '{\"experiment_phase\":true,\"source\":\"designated_growers\"}'::jsonb,",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "where pf.slug='dried_flower'\nand not exists (\n  select 1 from public.pathway_format_rules r\n  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id\n);",
    replacement: "where pf.slug='dried_flower'\nand not exists (\n  select 1 from public.pathway_format_rules r\n  where r.pathway_id=(select id from public.regulatory_pathways where slug='nl-experiment' limit 1) and r.format_id=pf.id\n);",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "select\n  '01fdfa6a-1295-4f84-8ade-dbabf9b245be',\n  pf.id,\n  'permitted',\n  '{\"experiment_phase\":true,\"raw_cannabis_only\":true,\"concentrates_prohibited\":true,\"made_and_packaged_by_grower\":true}'::jsonb,",
    replacement: "select\n  (select id from public.regulatory_pathways where slug='nl-experiment' limit 1),\n  pf.id,\n  'permitted',\n  '{\"experiment_phase\":true,\"raw_cannabis_only\":true,\"concentrates_prohibited\":true,\"made_and_packaged_by_grower\":true}'::jsonb,",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "where pf.slug='edibles'\nand not exists (\n  select 1 from public.pathway_format_rules r\n  where r.pathway_id='01fdfa6a-1295-4f84-8ade-dbabf9b245be' and r.format_id=pf.id\n);",
    replacement: "where pf.slug='edibles'\nand not exists (\n  select 1 from public.pathway_format_rules r\n  where r.pathway_id=(select id from public.regulatory_pathways where slug='nl-experiment' limit 1) and r.format_id=pf.id\n);",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "  'verified',now(),'2025-04-07',\n  'Products and packaging must meet experiment requirements; THC/CBD information and required labeling apply.'",
    replacement: "  'needs_review',null,'2025-04-07',\n  'Products and packaging must meet experiment requirements; THC/CBD information and required labeling apply.'",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "  'verified',now(),'2025-04-07',\n  'Edibles must be made and packaged by designated growers under the experiment requirements.'",
    replacement: "  'needs_review',null,'2025-04-07',\n  'Edibles must be made and packaged by designated growers under the experiment requirements.'",
  },
  {
    file: '20260922165000_primary_netherlands_format_rules.sql',
    anchor: "update public.jurisdiction_dimension_coverage\nset status='verified_populated'",
    replacement: `-- Zero-state replay reconciliation: production already had these format-rule
-- identities/citations when this migration ran, so the verified inserts above
-- were skipped there. A repository replay creates the rows here; attach the
-- cited Government.nl source first, then cross the verification trigger.
insert into public.regulatory_citations(
  entity_type,entity_id,instrument,article,source_type,citation_url,published_date,accessed_date,excerpt
)
select
  'rule',r.id,'Controlled Cannabis Supply Chain Experiment — product rules',null,'regulator',
  r.source_urls[1],'2025-04-07',current_date,
  'Government.nl states the product and packaging rules applicable during the controlled cannabis supply-chain experiment.'
from public.pathway_format_rules r
join public.product_formats pf on pf.id=r.format_id
join public.regulatory_pathways p on p.id=r.pathway_id
where p.slug='nl-experiment'
  and pf.slug in ('dried_flower','edibles')
  and not exists (
    select 1 from public.regulatory_citations c
    where c.entity_type='rule' and c.entity_id=r.id and c.citation_url=r.source_urls[1]
  );

update public.pathway_format_rules r
set verification='verified',last_verified_at=now(),updated_at=now()
from public.product_formats pf, public.regulatory_pathways p
where r.format_id=pf.id
  and p.id=r.pathway_id
  and p.slug='nl-experiment'
  and pf.slug in ('dried_flower','edibles');

update public.jurisdiction_dimension_coverage
set status='verified_populated'`,
  },
  {
    file: '20260922123500_record_kp_primary_source_block.sql',
    anchor: "where jurisdiction_key='KP'\nand not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='KP' and dimension_key='verified_regulatory_evidence' and status='blocked');",
    replacement: "where jurisdiction_key='KP'\nand not exists(select 1 from public.jurisdiction_data_depth_tasks where jurisdiction_key='KP' and dimension_key='verified_regulatory_evidence' and status='blocked')\non conflict (jurisdiction_key,dimension_key) do update set\n  jurisdiction_level=excluded.jurisdiction_level,\n  status='blocked',\n  priority=excluded.priority,\n  evidence_required=excluded.evidence_required,\n  notes=excluded.notes,\n  updated_at=now();",
  },
  {
    file: '20260918000156_add_legal_data_hunter_mcp_bridge_source.sql',
    anchor: "   'mcp_bridge', 'legal_database', array['regulatory'], false, false, 'not_applicable',",
    replacement: "   'mcp_bridge', 'legal_database', array['regulatory'], false, false, 'quarantined',",
  },
  {
    file: '20260916100000_security_boundary_hardening.sql',
    anchor: "    select schemaname, tablename, policyname, qual, with_check from pg_policies\n    where schemaname in ('public','api','signals','regulatory_signals','storage')\n      and (coalesce(qual,'') ~ '(^|[^A-Za-z_])auth\\\\.uid\\\\(\\\\)'\n        or coalesce(with_check,'') ~ '(^|[^A-Za-z_])auth\\\\.uid\\\\(\\\\)')\n      and (coalesce(qual,'') !~ '\\\\( SELECT auth\\\\.uid\\\\(\\\\)'\n        or coalesce(with_check,'') !~ '\\\\( SELECT auth\\\\.uid\\\\(\\\\)')\n",
    replacement: "    select schemaname, tablename, policyname, qual, with_check from pg_policies\n    where schemaname in ('public','api','signals','regulatory_signals','storage')\n      and (coalesce(qual,'') ~ '(^|[^A-Za-z_])auth\\.uid\\(\\)'\n        or coalesce(with_check,'') ~ '(^|[^A-Za-z_])auth\\.uid\\(\\)')\n      and (coalesce(qual,'') !~ '\\( SELECT auth\\.uid\\(\\)'\n        or coalesce(with_check,'') !~ '\\( SELECT auth\\.uid\\(\\)')\n",
  },
  {
    file: '20260916100000_security_boundary_hardening.sql',
    anchor: "and has_function_privilege(p.oid,'public','execute')",
    replacement: "and has_function_privilege('public', p.oid, 'execute')",
  },



  {
    file: '20260901022725_pin_search_path_on_mutable_functions.sql',
    anchor: `alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = 'public';`,
    replacement: `-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260901022725$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260901022725$;`,
  },
  {
    file: '20260901022725_pin_search_path_on_mutable_functions.sql',
    anchor: `alter function public.hv_local_classify_gate(vector) set search_path = 'public';`,
    replacement: `-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260901022725$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public'';';
  end if;
end
$replay_hv_local_classify_gate_20260901022725$;`,
  },
  {
    file: '20260902021703_fix_search_path_regression_missing_extensions_schema.sql',
    anchor: `alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = 'public, extensions';`,
    replacement: `-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260902021703$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260902021703$;`,
  },
  {
    file: '20260902021703_fix_search_path_regression_missing_extensions_schema.sql',
    anchor: `alter function public.hv_local_classify_gate(vector) set search_path = 'public, extensions';`,
    replacement: `-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260902021703$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_local_classify_gate_20260902021703$;`,
  },
  {
    file: '20260902021818_fix_search_path_quoting_regression.sql',
    anchor: `alter function public.hv_gemini_embed_backfill_tick(integer) set search_path to public, extensions;`,
    replacement: `-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260902021818$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path to public, extensions;';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260902021818$;`,
  },
  {
    file: '20260902021818_fix_search_path_quoting_regression.sql',
    anchor: `alter function public.hv_local_classify_gate(vector) set search_path to public, extensions;`,
    replacement: `-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260902021818$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path to public, extensions;';
  end if;
end
$replay_hv_local_classify_gate_20260902021818$;`,
  },
  {
    file: '20260901021633_document_medical_only_reclassification_via_rpc.sql',
    anchor: `WHERE market_access_status IS DISTINCT FROM (CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status);`,
    replacement: `-- Zero-state replay: production types countries.market_access_status as the enum
-- public.market_access_status, but repository history types it text. The earliest
-- creator, 20260604000000_countries_public_table_v1.sql, predates the enum (not
-- created until 20260710114720), and whatever migration converted the column in
-- production was applied out of band with no repository file. Against a text
-- column the original enum-cast comparison raises
-- "operator does not exist: text = market_access_status".
--
-- Comparing as text is equivalent under both column shapes, because enum labels
-- map one-to-one onto their text spellings. Verified live 2026-09-06 against
-- project zvxdgdkukjrrwamdpqrg: both predicates select the same 23 rows. The SET
-- clause above is deliberately untouched -- assigning the enum-cast value
-- resolves through an assignment cast under either shape.
WHERE market_access_status::text IS DISTINCT FROM (CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END);`,
  },
  {
    file: '20260822134600_reconcile_legacy_heatmap_territory_rows.sql',
    anchor: `do $reconcile_legacy_heatmap_territories$
declare
  v_total integer;
  v_legacy integer;
begin
  select count(*) into v_total from public.countries;

  select count(*) into v_legacy
  from public.countries
  where (iso_alpha2, iso_alpha3, country_slug) in (
    ('AS','ASM','american-samoa'),
    ('GU','GUM','guam'),
    ('MP','MNP','northern-mariana-islands'),
    ('VI','VIR','united-states-virgin-islands'),
    ('NC','NCL','new-caledonia'),
    ('PF','PYF','french-polynesia')
  );

  if v_total = 297 and v_legacy = 6 then
    delete from public.countries
    where (iso_alpha2, iso_alpha3, country_slug) in (
      ('AS','ASM','american-samoa'),
      ('GU','GUM','guam'),
      ('MP','MNP','northern-mariana-islands'),
      ('VI','VIR','united-states-virgin-islands'),
      ('NC','NCL','new-caledonia'),
      ('PF','PYF','french-polynesia')
    );

    if (select count(*) from public.countries) <> 291 then
      raise exception 'Legacy heatmap reconciliation expected 291 rows after deleting six exact seed rows';
    end if;
  elsif v_total = 291 and v_legacy = 0 then
    -- Canonical production state: deliberately no-op.
    null;
  else
    raise exception 'Unexpected heatmap reconciliation state: total=%, exact_legacy_rows=%', v_total, v_legacy;
  end if;
end
$reconcile_legacy_heatmap_territories$;`,
    replacement: `do $reconcile_legacy_heatmap_territories$
declare
  v_total integer;
  v_removed integer;
  -- ISO codes present in a zero-state repository replay that canonical
  -- production does not carry. Verified live 2026-09-06 against
  -- public.countries on project zvxdgdkukjrrwamdpqrg: production holds 291 rows
  -- and none of these eighteen codes appear among them.
  --
  -- Six are the legacy territory rows this migration was originally written for
  -- (AS, GU, MP, VI, NC, PF), inserted by
  -- 20260822134500_live_regulatory_heatmap_all_jurisdictions. The other twelve
  -- are canonical territory identity rows added by
  -- 20260613170000_canonical_country_reference_repair, which post-dates the
  -- original reconciliation and pushed replay from 297 rows to 309.
  v_replay_only constant text[] := array[
    'AS', 'AW', 'AX', 'CW', 'GG', 'GI', 'GS', 'GU', 'HM',
    'IM', 'JE', 'MO', 'MP', 'NC', 'PF', 'SX', 'TF', 'VI'
  ];
begin
  select count(*) into v_total from public.countries;

  if v_total = 291 then
    -- Canonical production state: deliberately no-op.
    return;
  end if;

  -- Match on iso_alpha2 alone rather than the exact (iso_alpha2, iso_alpha3,
  -- country_slug) tuple the original used. That tuple match silently degraded:
  -- 20260609000000 seeds VI as 'us-virgin-islands', not the
  -- 'united-states-virgin-islands' slug the tuple named, so it found five of six.
  -- Rows in these three tables reference the replay-only territories by ISO
  -- code and block the delete on a foreign key. Production carries none of them
  -- (verified live 2026-09-06: zero rows in all three for these eighteen codes),
  -- which is expected -- it has no such country rows to reference. Any OTHER
  -- dependent table is deliberately not swept here: a new foreign-key violation
  -- should surface loudly rather than be silently deleted through.
  delete from public.jurisdiction_crossref where countries_iso2 = any (v_replay_only);
  delete from public.jurisdiction_playbooks_research_queue where country_code = any (v_replay_only);
  delete from public.local_intel_coverage where country_code = any (v_replay_only);

  delete from public.countries where iso_alpha2 = any (v_replay_only);
  get diagnostics v_removed = row_count;

  if (select count(*) from public.countries) <> 291 then
    raise exception
      'Legacy heatmap reconciliation expected 291 rows; started at %, removed % replay-only territory row(s), left %',
      v_total, v_removed, (select count(*) from public.countries);
  end if;
end
$reconcile_legacy_heatmap_territories$;`,
  },
  {
    file: '20260822000000_service_role_policy_scoping.sql',
    anchor: `ALTER POLICY "service role full access" ON job_search.opportunities TO service_role USING (true);`,
    replacement: `-- Zero-state replay: job_search.opportunities exists only in production; no
-- repository migration creates it (20260729230849 creates the job_search schema
-- and its eight tables, and this is not one of them). Re-scoping a policy on an
-- absent table is a no-op, so guarding on existence cannot change access: there
-- is no table to expose. Against production, where the table and policy both
-- exist, the ALTER runs exactly as before.
do $replay_job_search_opportunities$
begin
  if to_regclass('job_search.opportunities') is not null then
    execute 'ALTER POLICY "service role full access" ON job_search.opportunities TO service_role USING (true)';
  end if;
end
$replay_job_search_opportunities$;`,
  },
  {
    file: '20260822000000_service_role_policy_scoping.sql',
    anchor: `ALTER POLICY service_role_only ON public.country_intel_backup_20260630 TO service_role USING (true);`,
    replacement: `-- Zero-state replay: country_intel_backup_20260630 is a one-off dated backup
-- table (20260821000000's own header calls it out as such) created out of band in
-- production; no repository migration creates it. Same reasoning as above -- a
-- policy re-scope on an absent table is a no-op and cannot widen access.
do $replay_country_intel_backup$
begin
  if to_regclass('public.country_intel_backup_20260630') is not null then
    execute 'ALTER POLICY service_role_only ON public.country_intel_backup_20260630 TO service_role USING (true)';
  end if;
end
$replay_country_intel_backup$;`,
  },
  {
    file: '20260818213000_clinical_prescriber_os_reconciliation.sql',
    anchor: `create index if not exists clinical_evidence_claim_record_idx
  on public.clinical_evidence_claims (evidence_record_id, status);`,
    replacement: `-- Replay-only reconciliation of the legacy Clinical Evidence OS and
-- Prescriber OS concept contracts. CREATE TABLE IF NOT EXISTS cannot add the
-- lifecycle columns used by the policies below. Preserve the earlier review
-- gate when mapping its existing rows: only published concepts/aliases become
-- active in the later lifecycle vocabulary.
alter table public.clinical_concepts
  add column if not exists status text not null default 'active'
    check (status in ('active','superseded','retired')),
  add column if not exists superseded_by_id uuid
    references public.clinical_concepts(id) on delete set null;

update public.clinical_concepts
set status = case when review_status = 'published' then 'active' else 'retired' end;

alter table public.clinical_concept_aliases
  add column if not exists status text not null default 'active'
    check (status in ('active','retired'));

update public.clinical_concept_aliases
set status = case when review_status = 'published' then 'active' else 'retired' end;

-- Replay-only reconciliation of the two checked-in claim contracts. The
-- earlier operating-system migration creates the legacy columns but explicitly
-- seeds no rows; this later migration says it is additive yet CREATE TABLE IF
-- NOT EXISTS alone cannot add the Prescriber OS columns used below.
alter table public.clinical_evidence_claims
  add column if not exists concept_id uuid references public.clinical_concepts(id) on delete set null,
  add column if not exists claim_text text not null,
  add column if not exists population text,
  add column if not exists intervention text,
  add column if not exists comparator text,
  add column if not exists outcome text,
  add column if not exists timeframe text,
  add column if not exists direction text not null default 'uncertain'
    check (direction in ('benefit','harm','neutral','uncertain')),
  add column if not exists effect_measure text,
  add column if not exists effect_value numeric,
  add column if not exists effect_unit text,
  add column if not exists ci_lower numeric,
  add column if not exists ci_upper numeric,
  add column if not exists absolute_effect text,
  add column if not exists relative_effect text,
  add column if not exists clinically_important_difference text,
  add column if not exists certainty text not null default 'ungraded'
    check (certainty in ('high','moderate','low','very-low','ungraded','conflicted')),
  add column if not exists applicability text,
  add column if not exists publication_family_id text,
  add column if not exists independence_group_id text,
  add column if not exists status text not null default 'review-required'
    check (status in ('current','superseded','retracted','review-required')),
  add column if not exists superseded_by_id uuid
    references public.clinical_evidence_claims(id) on delete set null,
  add column if not exists primary_source_url text not null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

-- The newer contract replaces these legacy mandatory inputs. Zero-state has no
-- claim rows, so this changes no data and lets future Prescriber OS writes use
-- the later authoritative fields.
alter table public.clinical_evidence_claims
  alter column claim_key drop not null,
  alter column claim_kind drop not null,
  alter column statement drop not null,
  alter column verified_at drop not null,
  alter column source_locator set not null;

do $replay_claim_contract$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_claims'::regclass
      and conname = 'clinical_evidence_claim_source_https'
  ) then
    alter table public.clinical_evidence_claims
      add constraint clinical_evidence_claim_source_https
      check (primary_source_url ~ '^https://');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.clinical_evidence_claims'::regclass
      and conname = 'clinical_evidence_claim_locator_nonempty'
  ) then
    alter table public.clinical_evidence_claims
      add constraint clinical_evidence_claim_locator_nonempty
      check (length(btrim(source_locator)) > 0);
  end if;
end
$replay_claim_contract$;

create index if not exists clinical_evidence_claim_record_idx
  on public.clinical_evidence_claims (evidence_record_id, status);`,
  },
]

function migrationVersion(file) {
  const match = /^(\d{14})_.+\.sql$/.exec(file)
  return match?.[1] ?? null
}

export function planReplayExclusions({ decisions, migrationFiles }) {
  const filesByVersion = new Map()
  for (const file of migrationFiles) {
    const version = migrationVersion(file)
    if (!version) continue
    const existing = filesByVersion.get(version) ?? []
    existing.push(file)
    filesByVersion.set(version, existing)
  }

  const exclusions = []
  for (const decision of decisions.repository_only_decisions ?? []) {
    if (decision.reason_code !== 'exact_live_name_different_version') continue
    if (!Array.isArray(decision.live_equivalent_versions) || decision.live_equivalent_versions.length === 0) continue

    const sourceFiles = filesByVersion.get(decision.version) ?? []
    if (sourceFiles.length !== 1 || sourceFiles[0] !== decision.file) continue

    const repositoryEquivalentVersions = decision.live_equivalent_versions.filter(
      (version) => (filesByVersion.get(version) ?? []).length === 1,
    )
    if (repositoryEquivalentVersions.length === 0) continue

    exclusions.push({
      version: decision.version,
      file: decision.file,
      live_equivalent_versions: decision.live_equivalent_versions,
      repository_equivalent_versions: repositoryEquivalentVersions,
      reason_code: decision.reason_code,
    })
  }

  return exclusions.sort((a, b) => a.version.localeCompare(b.version))
}

export function planReplayLiveVersionShadows({ decisions, migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  const decisionsByLiveVersion = new Map()
  for (const decision of decisions.equivalences ?? []) {
    if (!/^\d{14}$/.test(decision.live_version ?? '')) continue
    if (!/^\d{14}$/.test(decision.repository_version ?? '')) continue
    if (typeof decision.file !== 'string') continue
    decisionsByLiveVersion.set(decision.live_version, decision)
  }

  const shadows = []
  for (const [liveVersion, decision] of decisionsByLiveVersion) {
    const liveFiles = migrationFiles.filter((file) => migrationVersion(file) === liveVersion)
    if (liveFiles.length !== 1) continue
    if (liveFiles[0] === decision.file) continue
    if (!fileSet.has(decision.file)) continue
    shadows.push({
      version: liveVersion,
      file: liveFiles[0],
      canonical_file: decision.file,
      canonical_version: decision.repository_version,
      reason_code: 'live_version_shadow_of_canonical_equivalence',
    })
  }
  return shadows.sort((a, b) => a.version.localeCompare(b.version))
}

export function planReplayZeroStateSkips({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_ZERO_STATE_SKIPS.filter((file) => fileSet.has(file))
}

export function planReplayRelocations({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_RELOCATIONS.filter((item) => {
    if (!fileSet.has(item.source) || fileSet.has(item.destination) || !fileSet.has(item.before)) return false
    const sourceVersion = migrationVersion(item.source)
    const destinationVersion = migrationVersion(item.destination)
    const beforeVersion = migrationVersion(item.before)
    return Boolean(
      sourceVersion &&
        destinationVersion &&
        beforeVersion &&
        sourceVersion > beforeVersion &&
        destinationVersion < beforeVersion,
    )
  })
}

export function planReplayVersionCollisionRenames({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_VERSION_COLLISION_RENAMES.filter((item) => {
    if (
      !fileSet.has(item.source) ||
      !fileSet.has(item.sibling) ||
      !fileSet.has(item.before) ||
      fileSet.has(item.destination)
    ) return false

    const sourceVersion = migrationVersion(item.source)
    const siblingVersion = migrationVersion(item.sibling)
    const destinationVersion = migrationVersion(item.destination)
    const beforeVersion = migrationVersion(item.before)
    const collisionFiles = migrationFiles.filter(
      (file) => migrationVersion(file) === sourceVersion,
    )
    return Boolean(
      sourceVersion &&
        sourceVersion === siblingVersion &&
        destinationVersion &&
        beforeVersion &&
        sourceVersion < destinationVersion &&
        destinationVersion < beforeVersion &&
        collisionFiles.length === 2 &&
        collisionFiles.includes(item.source) &&
        collisionFiles.includes(item.sibling),
    )
  })
}

export function planReplaySyntheticFoundations({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  const seenDestinations = new Set()
  return REPLAY_SYNTHETIC_FOUNDATIONS.filter((item) => {
    if (seenDestinations.has(item.destination)) return false
    if (fileSet.has(item.destination) || !fileSet.has(item.before)) return false
    if (!item.required.every((file) => fileSet.has(file))) return false
    const destinationVersion = migrationVersion(item.destination)
    const beforeVersion = migrationVersion(item.before)
    const eligible = Boolean(destinationVersion && beforeVersion && destinationVersion < beforeVersion)
    if (eligible) seenDestinations.add(item.destination)
    return eligible
  })
}

export function planReplayContentPatches({ migrationFiles }) {
  const fileSet = new Set(migrationFiles)
  return REPLAY_CONTENT_PATCHES.filter((item) => fileSet.has(item.file))
}

export function runReplayPreparation({ repositoryRoot = process.cwd(), apply = false } = {}) {
  const decisions = JSON.parse(fs.readFileSync(path.join(repositoryRoot, DECISIONS_FILE), 'utf8'))
  const equivalences = JSON.parse(fs.readFileSync(path.join(repositoryRoot, EQUIVALENCE_FILE), 'utf8'))
  const migrationDirectory = path.join(repositoryRoot, MIGRATIONS_DIR)
  const migrationFiles = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql'))
  const exclusions = planReplayExclusions({ decisions, migrationFiles })
  const zeroStateSkips = planReplayZeroStateSkips({ migrationFiles })
  const liveVersionShadows = planReplayLiveVersionShadows({ decisions: equivalences, migrationFiles })
  const relocations = planReplayRelocations({ migrationFiles })
  const versionCollisionRenames = planReplayVersionCollisionRenames({ migrationFiles })
  const syntheticFoundations = planReplaySyntheticFoundations({ migrationFiles })
  const contentPatches = planReplayContentPatches({ migrationFiles })

  if (apply) {
    for (const item of exclusions) {
      const source = path.join(migrationDirectory, item.file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay exclusion source disappeared: ${item.file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay exclusion destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
    for (const shadow of liveVersionShadows) {
      const source = path.join(migrationDirectory, shadow.file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay live-version shadow source disappeared: ${shadow.file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay live-version shadow destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
    for (const file of zeroStateSkips) {
      const source = path.join(migrationDirectory, file)
      const destination = `${source}${EXCLUDED_SUFFIX}`
      if (!fs.existsSync(source)) throw new Error(`Replay zero-state skip source disappeared: ${file}`)
      if (fs.existsSync(destination)) throw new Error(`Replay zero-state skip destination already exists: ${path.basename(destination)}`)
      fs.renameSync(source, destination)
    }
    for (const item of relocations) {
      const source = path.join(migrationDirectory, item.source)
      const destination = path.join(migrationDirectory, item.destination)
      if (!fs.existsSync(source)) throw new Error(`Replay relocation source disappeared: ${item.source}`)
      if (fs.existsSync(destination)) throw new Error(`Replay relocation destination already exists: ${item.destination}`)
      fs.renameSync(source, destination)
    }
    for (const item of versionCollisionRenames) {
      const source = path.join(migrationDirectory, item.source)
      const destination = path.join(migrationDirectory, item.destination)
      if (!fs.existsSync(source)) throw new Error(`Replay version-collision source disappeared: ${item.source}`)
      if (fs.existsSync(destination)) throw new Error(`Replay version-collision destination already exists: ${item.destination}`)
      fs.renameSync(source, destination)
    }
    for (const item of syntheticFoundations) {
      const destination = path.join(migrationDirectory, item.destination)
      if (fs.existsSync(destination)) throw new Error(`Replay synthetic foundation already exists: ${item.destination}`)
      if (!fs.existsSync(path.join(migrationDirectory, item.before))) {
        throw new Error(`Replay synthetic foundation boundary disappeared: ${item.before}`)
      }
      fs.writeFileSync(destination, item.content, 'utf8')
    }
    for (const item of contentPatches) {
      const target = path.join(migrationDirectory, item.file)
      const original = fs.readFileSync(target, 'utf8')
      const first = original.indexOf(item.anchor)
      const last = original.lastIndexOf(item.anchor)
      if (first === -1 || first !== last) {
        throw new Error(`Replay content patch anchor mismatch: ${item.file}`)
      }
      fs.writeFileSync(target, original.replace(item.anchor, item.replacement), 'utf8')
    }
  }

  return {
    exclusions,
    zeroStateSkips,
    liveVersionShadows,
    relocations,
    versionCollisionRenames,
    syntheticFoundations,
    contentPatches,
  }
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirect) {
  try {
    const apply = process.argv.includes('--apply')
    const {
      exclusions,
      zeroStateSkips,
      liveVersionShadows,
      relocations,
      versionCollisionRenames,
      syntheticFoundations,
      contentPatches,
    } = runReplayPreparation({ apply })
    if (exclusions.length === 0) {
      console.log('Production-faithful replay: no version-alias duplicate files require exclusion.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${exclusions.length} repository-version alias file(s):`)
      for (const item of exclusions) {
        console.log(`- ${item.file} -> live/repository equivalent ${item.repository_equivalent_versions.join(', ')}`)
      }
    }
    if (liveVersionShadows.length === 0) {
      console.log('Production-faithful replay: no local files shadow a production live-version equivalence.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${liveVersionShadows.length} local live-version shadow file(s):`)
      for (const item of liveVersionShadows) console.log(`- ${item.file} -> canonical ${item.canonical_file} (${item.canonical_version})`)
    }
    if (zeroStateSkips.length === 0) {
      console.log('Production-faithful replay: no zero-state-inapplicable historical repair/duplicate files require exclusion.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'excluded' : 'would exclude'} ${zeroStateSkips.length} zero-state-inapplicable historical repair/duplicate file(s):`)
      for (const file of zeroStateSkips) console.log(`- ${file}`)
    }
    if (relocations.length === 0) {
      console.log('Production-faithful replay: no reconstruction/reconciliation files require earlier replay ordering.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'relocated' : 'would relocate'} ${relocations.length} reconstruction/reconciliation file(s):`)
      for (const item of relocations) {
        console.log(`- ${item.source} -> ${item.destination} before ${item.before}`)
      }
    }
    if (versionCollisionRenames.length === 0) {
      console.log('Production-faithful replay: no duplicate migration versions require temporary disambiguation.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'disambiguated' : 'would disambiguate'} ${versionCollisionRenames.length} duplicate migration version(s):`)
      for (const item of versionCollisionRenames) {
        console.log(`- ${item.source} -> ${item.destination}; sibling ${item.sibling}`)
      }
    }
    if (syntheticFoundations.length === 0) {
      console.log('Production-faithful replay: no replay-only synthetic foundations are required.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'materialized' : 'would materialize'} ${syntheticFoundations.length} replay-only synthetic foundation(s):`)
      for (const item of syntheticFoundations) {
        console.log(`- ${item.destination} before ${item.before}`)
      }
    }
    if (contentPatches.length === 0) {
      console.log('Production-faithful replay: no zero-state-only SQL corrections are required.')
    } else {
      console.log(`Production-faithful replay: ${apply ? 'corrected' : 'would correct'} ${contentPatches.length} migration(s) for zero-state-only catalog differences:`)
      for (const item of contentPatches) console.log(`- ${item.file}`)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
