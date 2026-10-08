
-- RECOVERY BEGIN 20260707200656_signals_digest_step2_boilerplate_quality_filter.sql
-- Step 2 of the signals-digest-pipeline ticket: a quality gate so scraped
-- page/nav boilerplate (e.g. repeated Jamaica CLA homepage chrome) can't
-- reach stage='qualified' and become digest-eligible.
--
-- Heuristic (two signals, either trips it):
--  1. A fixed list of common site-chrome / nav phrases seen in production
--     junk ("skip to main content", "frontpage |", "apply for a licence" /
--     "renew a licence" concatenated menu items, cookie/privacy banners,
--     "an agency of the ministry of", 404 pages, etc).
--  2. Structural: any repeated 3-word sequence (trigram) within the text.
--     Real prose summaries essentially never repeat a 3-word phrase;
--     concatenated nav menus and boilerplate blocks reliably do (e.g.
--     "Apply for a Licence Renew a Licence Apply for a Licence ..." repeats
--     "apply for a" / "for a licence"). Verified against known-good and
--     known-bad rows in production data before applying.
create or replace function public.is_boilerplate_signal(p_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_words text[];
  v_trigram text;
  v_seen jsonb := '{}'::jsonb;
  i int;
begin
  if p_text is null or length(trim(p_text)) = 0 then
    return false;
  end if;

  if p_text ~* '(skip to main content|frontpage\s*\||all rights reserved|cookie policy|privacy policy|terms of service|back to top|get in touch:|apply for a licen[cs]e|renew a licen[cs]e|subscribe to our newsletter|follow us on (facebook|twitter|instagram)|page not found|404 not found|an agency of the ministry of)' then
    return true;
  end if;

  v_words := array_remove(regexp_split_to_array(lower(regexp_replace(p_text, '[^[:alnum:]\s]', ' ', 'g')), '\s+'), '');
  if array_length(v_words, 1) is null or array_length(v_words, 1) < 6 then
    return false;
  end if;

  for i in 1 .. array_length(v_words, 1) - 2 loop
    v_trigram := v_words[i] || ' ' || v_words[i+1] || ' ' || v_words[i+2];
    if v_seen ? v_trigram then
      return true;
    end if;
    v_seen := v_seen || jsonb_build_object(v_trigram, true);
  end loop;

  return false;
end;
$$;

-- Retroactively catch existing mis-tagged rows: downgrade (don't delete --
-- keep audit trail) any currently-qualified boilerplate row to 'archived'
-- so it drops out of anything selecting stage='qualified' (including the
-- digest). 'archived' is the closest fit in the existing stage check
-- constraint (new/needs_review/qualified/converted_to_opportunity/
-- linked_to_counterparty/linked_to_market_pathway/archived) -- no schema
-- change made for this.
update ia_signals
set stage = 'archived',
    updated_at = now(),
    notes = coalesce(nullif(notes, ''), '') || ' [auto-archived 2026-07-07: matched boilerplate/nav-text quality filter, was incorrectly stage=qualified]'
where stage = 'qualified'
  and public.is_boilerplate_signal(summary);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707200656','signals_digest_step2_boilerplate_quality_filter','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707200656_signals_digest_step2_boilerplate_quality_filter.sql

-- RECOVERY BEGIN 20260707200900_signals_digest_step2_revert_overbroad_archival.sql
-- Repair stub: migration 20260707200900 (signals_digest_step2_revert_overbroad_archival) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707200900','signals_digest_step2_revert_overbroad_archival','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707200900_signals_digest_step2_revert_overbroad_archival.sql

-- RECOVERY BEGIN 20260707201228_signals_digest_step2_wire_boilerplate_filter.sql
-- Repair stub: migration 20260707201228 (signals_digest_step2_wire_boilerplate_filter) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707201228','signals_digest_step2_wire_boilerplate_filter','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707201228_signals_digest_step2_wire_boilerplate_filter.sql

-- RECOVERY BEGIN 20260707201400_signals_digest_step4_wire_delivery_log.sql
-- Repair stub: migration 20260707201400 (signals_digest_step4_wire_delivery_log) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707201400','signals_digest_step4_wire_delivery_log','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707201400_signals_digest_step4_wire_delivery_log.sql

-- RECOVERY BEGIN 20260707201456_signals_digest_step4_delivery_log_idempotent.sql
-- Repair stub: migration 20260707201456 (signals_digest_step4_delivery_log_idempotent) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707201456','signals_digest_step4_delivery_log_idempotent','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707201456_signals_digest_step4_delivery_log_idempotent.sql

-- RECOVERY BEGIN 20260707201659_signals_digest_step4_fix_signals_for_digest_stage_filter.sql
-- Repair stub: migration 20260707201659 (signals_digest_step4_fix_signals_for_digest_stage_filter) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707201659','signals_digest_step4_fix_signals_for_digest_stage_filter','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707201659_signals_digest_step4_fix_signals_for_digest_stage_filter.sql

-- RECOVERY BEGIN 20260707201721_signals_digest_step4_revert_redundant_fanout.sql
-- Repair stub: migration 20260707201721 (signals_digest_step4_revert_redundant_fanout) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260707201721','signals_digest_step4_revert_redundant_fanout','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260707201721_signals_digest_step4_revert_redundant_fanout.sql

-- RECOVERY BEGIN 20260708003123_weekly_wire_policy_archive_and_new_editorials.sql
-- Repair stub: migration 20260708003123 (weekly_wire_policy_archive_and_new_editorials) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708003123','weekly_wire_policy_archive_and_new_editorials','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708003123_weekly_wire_policy_archive_and_new_editorials.sql

-- RECOVERY BEGIN 20260708003136_publish_weekly_wire_batch.sql
-- Repair stub: migration 20260708003136 (publish_weekly_wire_batch) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708003136','publish_weekly_wire_batch','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708003136_publish_weekly_wire_batch.sql

-- RECOVERY BEGIN 20260708003526_add_major_market_editorial_dea_hearing.sql
-- Repair stub: migration 20260708003526 (add_major_market_editorial_dea_hearing) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708003526','add_major_market_editorial_dea_hearing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708003526_add_major_market_editorial_dea_hearing.sql

-- RECOVERY BEGIN 20260708003537_append_dea_hearing_to_digest.sql
-- Repair stub: migration 20260708003537 (append_dea_hearing_to_digest) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708003537','append_dea_hearing_to_digest','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708003537_append_dea_hearing_to_digest.sql

-- RECOVERY BEGIN 20260708003739_run_editorial_digest_v2_weekly_wire_policy.sql
-- Repair stub: migration 20260708003739 (run_editorial_digest_v2_weekly_wire_policy) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708003739','run_editorial_digest_v2_weekly_wire_policy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708003739_run_editorial_digest_v2_weekly_wire_policy.sql

-- RECOVERY BEGIN 20260708011346_expose_daily_digest_via_api_schema.sql
create view api.daily_digest as
select id, digest_date, status, headlines, editorial_headlines, markets, generated_at, updated_at
from public.daily_digest;

grant select on api.daily_digest to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708011346','expose_daily_digest_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708011346_expose_daily_digest_via_api_schema.sql

-- RECOVERY BEGIN 20260708100000_switch_embeddings_768_dim.sql
-- Switch ia_signal_embeddings from 1024-dim (BGE-M3) to 768-dim (text-embedding-004).
-- Safe: table has zero rows (HF endpoint was never configured).
-- Also drops the now-unused HF-specific model column default.

-- Drop old HNSW index (can't ALTER dimension in place)
DROP INDEX IF EXISTS idx_ia_signal_embeddings_hnsw;

-- Recreate column at 768-dim
ALTER TABLE public.ia_signal_embeddings
  DROP COLUMN embedding;

ALTER TABLE public.ia_signal_embeddings
  ADD COLUMN embedding vector(768) NOT NULL;

-- Update model default to reflect new provider
ALTER TABLE public.ia_signal_embeddings
  ALTER COLUMN model SET DEFAULT 'text-embedding-004';

-- Rebuild HNSW index at 768-dim
CREATE INDEX idx_ia_signal_embeddings_hnsw
  ON public.ia_signal_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Update ia_search_signals RPC to accept 768-dim query vector
CREATE OR REPLACE FUNCTION public.ia_search_signals(
  p_query_embedding  vector(768),
  p_match_count      integer DEFAULT 20,
  p_market           text    DEFAULT NULL,
  p_type             text    DEFAULT NULL,
  p_stage            text    DEFAULT NULL
)
RETURNS TABLE (
  signal_id         text,
  title             text,
  type              text,
  stage             text,
  market            text,
  category          text,
  confidence        integer,
  commercial_impact text,
  summary           text,
  detected_at       date,
  similarity        double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT
      s.id,
      s.title,
      s.type,
      s.stage,
      s.market,
      s.category,
      s.confidence,
      s.commercial_impact,
      s.summary,
      s.detected_at,
      (1 - (e.embedding <=> p_query_embedding))::double precision AS similarity
    FROM public.ia_signal_embeddings e
    JOIN public.ia_signals s ON s.id = e.signal_id
    WHERE (p_market IS NULL OR s.market = p_market)
      AND (p_type   IS NULL OR s.type   = p_type)
      AND (p_stage  IS NULL OR s.stage  = p_stage)
    ORDER BY e.embedding <=> p_query_embedding
    LIMIT p_match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ia_search_signals(vector, integer, text, text, text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708100000','switch_embeddings_768_dim','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708100000_switch_embeddings_768_dim.sql

-- RECOVERY BEGIN 20260708102117_grant_public_select_education_content_tables.sql
-- education_modules, education_module_sections, and education_tracks all have
-- correctly-scoped RLS policies restricting anon/authenticated to published
-- content only, but were missing the base-table GRANT that RLS depends on.
-- Without it, PostgREST returns "permission denied" for every anon/authenticated
-- request before RLS is ever evaluated, regardless of how permissive the policy
-- is. This is why the Command Centre Education tab (and likely /education/*
-- public routes) silently fell back to generic placeholder content for every
-- real visitor: getLiveEduTiles() caught the permission error and returned [].
-- Verified before this migration: zero rows in information_schema.role_table_grants
-- for these three tables + anon/authenticated. RLS itself is untouched by this
-- migration and continues to restrict rows to publication_state = 'published'.
grant select on public.education_modules to anon, authenticated;
grant select on public.education_module_sections to anon, authenticated;
grant select on public.education_tracks to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708102117','grant_public_select_education_content_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708102117_grant_public_select_education_content_tables.sql

-- RECOVERY BEGIN 20260708102159_grant_public_select_user_roles_self_scoped.sql
-- education_modules has TWO RLS policies (public-published + admin-all-via-user_roles-
-- lookup). Postgres must be able to evaluate both permissive policies for a SELECT,
-- which means the anon/authenticated role needs base SELECT privilege on user_roles
-- too, even though the public policy doesn't logically need it -- otherwise the whole
-- query fails at the privilege-check stage before RLS row-filtering ever runs.
-- Safe to grant: user_roles' own RLS policy (user_roles_self_read) already restricts
-- every role to `user_id = auth.uid()` -- an authenticated user can only ever see their
-- own single row, anon sees zero rows (no auth.uid()). No cross-user exposure.
grant select on public.user_roles to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708102159','grant_public_select_user_roles_self_scoped','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708102159_grant_public_select_user_roles_self_scoped.sql

-- RECOVERY BEGIN 20260708112000_enable_realtime_globe_tables.sql
-- Repair stub: migration 20260708112000 (enable_realtime_globe_tables) was applied directly to the
-- remote database and has no corresponding local file. This stub reconciles
-- the local migration directory with the remote
-- supabase_migrations.schema_migrations table. The schema changes from this
-- migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708112000','enable_realtime_globe_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708112000_enable_realtime_globe_tables.sql

-- RECOVERY BEGIN 20260708212112_fix_mutable_search_path_functions.sql
-- Fix mutable search_path security advisories captured from production.
-- Production contained all five functions when this snapshot was generated;
-- repository zero-state creates several API wrappers later. Harden each exact
-- signature when present without fabricating or reordering API functions.
do $pin_mutable_search_path_functions$
declare
  function_oid regprocedure;
begin
  function_oid := to_regprocedure('public.is_boilerplate_signal(text)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_regulatory_calendar(text,integer)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_field_changes_for_country(text,integer)');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_tables_missing_from_api_schema()');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;

  function_oid := to_regprocedure('api.get_functions_missing_from_api_schema()');
  if function_oid is not null then
    execute format('alter function %s set search_path = public, api', function_oid);
  end if;
end
$pin_mutable_search_path_functions$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708212112','fix_mutable_search_path_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708212112_fix_mutable_search_path_functions.sql

-- RECOVERY BEGIN 20260708214306_restore_status_history_foundation.sql
-- Production's public.status_history relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact audit table contract without replacing rows. The
-- following migration remains authoritative for its reviewed read policy.

create table if not exists public.status_history (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by text not null default 'system'::text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_history_created_at
  on public.status_history (created_at desc);
create index if not exists idx_status_history_entity
  on public.status_history (entity_type, entity_id);

alter table public.status_history enable row level security;

grant select, insert, update, delete on table public.status_history
  to anon, authenticated;
grant all privileges on table public.status_history to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214306','restore_status_history_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214306_restore_status_history_foundation.sql

-- RECOVERY BEGIN 20260708214307_restore_sources_foundation.sql
-- Production's public.sources relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact minimal production contract without replacing
-- rows. The following migration remains authoritative for its reviewed policy.

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

alter table public.sources enable row level security;

grant select, insert, update, delete on table public.sources
  to anon, authenticated;
grant all privileges on table public.sources to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214307','restore_sources_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214307_restore_sources_foundation.sql

-- RECOVERY BEGIN 20260708214309_restore_project_vault_foundation.sql
-- Production's public.project_vault relation existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- enum, trigger-function, or table creators. Restore the exact production
-- foundation without replacing existing rows. The following migration remains
-- authoritative for the four reviewed admin-only policy definitions.

do $restore_project_status$
begin
  create type public.project_status as enum (
    'complete',
    'needs_work',
    'can_be_built',
    'raw',
    'archived'
  );
exception
  when duplicate_object then null;
end
$restore_project_status$;

do $restore_project_category$
begin
  create type public.project_category as enum (
    'website',
    'app',
    'program',
    'html',
    'tool',
    'game',
    'other'
  );
exception
  when duplicate_object then null;
end
$restore_project_category$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists public.project_vault (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  original_filename text not null,
  file_path text,
  bucket text default 'project-vault'::text,
  file_type text,
  file_size_bytes bigint,
  status public.project_status default 'raw'::public.project_status,
  category public.project_category default 'other'::public.project_category,
  notes text,
  tags text[] default '{}'::text[],
  entry_point text,
  preview_url text,
  contents jsonb,
  uploaded_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_vault_category
  on public.project_vault (category);
create index if not exists idx_project_vault_status
  on public.project_vault (status);
create index if not exists idx_project_vault_uploaded_at
  on public.project_vault (uploaded_at desc);

alter table public.project_vault enable row level security;

grant select, insert, update, delete on table public.project_vault
  to anon, authenticated;
grant all privileges on table public.project_vault to service_role;

drop trigger if exists project_vault_updated_at on public.project_vault;
create trigger project_vault_updated_at
  before update on public.project_vault
  for each row execute function public.update_updated_at();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214309','restore_project_vault_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214309_restore_project_vault_foundation.sql

-- RECOVERY BEGIN 20260708214310_restore_project_control_refs_foundation.sql
-- Production's project_control_refs ledger existed before the July 8 RLS
-- initplan advisory snapshot, but repository zero-state never recorded its
-- creator. Restore the exact table, constraints, indexes, ACL and RLS state;
-- the following migration installs the three reviewed production policies.

create table if not exists public.project_control_refs (
  id uuid primary key default gen_random_uuid(),
  system text not null,
  external_type text not null,
  external_id text not null,
  external_url text,
  canonical_entity_type text not null,
  canonical_entity_id text,
  canonical_key text not null,
  authority text not null default 'reference'::text,
  write_mode text not null default 'read_only'::text,
  title text,
  status text,
  source_hash text,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_control_refs_system_check
    check (system = any (array[
      'notion'::text,
      'linear'::text,
      'airtable'::text,
      'github'::text,
      'n8n'::text,
      'vercel'::text,
      'supabase'::text,
      'google_drive'::text,
      'manual'::text,
      'other'::text
    ])),
  constraint project_control_refs_authority_check
    check (authority = any (array[
      'canonical'::text,
      'mirror'::text,
      'reference'::text,
      'proposal'::text,
      'blocked'::text
    ])),
  constraint project_control_refs_write_mode_check
    check (write_mode = any (array[
      'read_only'::text,
      'controlled_write'::text,
      'blocked'::text
    ])),
  constraint project_control_refs_system_external_unique
    unique (system, external_type, external_id),
  constraint project_control_refs_canonical_system_unique
    unique (system, canonical_entity_type, canonical_key)
);

create unique index if not exists project_control_refs_external_url_unique
  on public.project_control_refs (system, lower(external_url))
  where external_url is not null;
create index if not exists project_control_refs_system_idx
  on public.project_control_refs (system, external_type);
create index if not exists project_control_refs_canonical_idx
  on public.project_control_refs (canonical_entity_type, canonical_key);
create index if not exists project_control_refs_authority_idx
  on public.project_control_refs (authority, write_mode);

alter table public.project_control_refs enable row level security;

grant select, insert, update, delete on table public.project_control_refs
  to anon, authenticated;
grant all privileges on table public.project_control_refs to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214310','restore_project_control_refs_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214310_restore_project_control_refs_foundation.sql

-- RECOVERY BEGIN 20260708214311_restore_internal_admin_notes_foundation.sql
-- Production's private internal-admin notes relation existed out of band before
-- the July 8 RLS initplan snapshot. Restore the exact server-control contract
-- during zero-state replay without replacing or updating existing notes.

create table if not exists public.internal_admin_notes (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  note text not null,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notes_entity
  on public.internal_admin_notes(entity_type, entity_id);

alter table public.internal_admin_notes enable row level security;

comment on table public.internal_admin_notes is
  'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server/service-role paths.';

-- Match the production ACL. The immediately following July 8 snapshot installs
-- the reviewed admin/operator SELECT policy; all client writes remain denied by RLS.
grant select, insert, update, delete on table public.internal_admin_notes
  to anon, authenticated;
grant all privileges on table public.internal_admin_notes to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214311','restore_internal_admin_notes_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214311_restore_internal_admin_notes_foundation.sql

-- RECOVERY BEGIN 20260708214312_restore_hv_review_decisions_foundation.sql
-- Production's public.hv_review_decisions relation and audit trigger existed
-- before the July 8 RLS initplan advisory snapshot, but their creating DDL was
-- absent from repository zero-state history. Restore the production table and
-- the table-compatible audit behavior without replacing existing rows.

create table if not exists public.hv_review_decisions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  decision text not null,
  decision_note text,
  previous_status public.hv_review_status,
  new_status public.hv_review_status not null,
  previous_lifecycle public.hv_lifecycle_stage,
  new_lifecycle public.hv_lifecycle_stage not null,
  public_eligible_set boolean,
  public_eligible_reason text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now(),
  evidence_ids uuid[],
  linked_sources text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_hv_review_decisions_artifact
  on public.hv_review_decisions (artifact_id);
create index if not exists idx_hv_review_decisions_decided_at
  on public.hv_review_decisions (decided_at desc);
create index if not exists idx_hv_review_decisions_decided_by
  on public.hv_review_decisions (decided_by);
create index if not exists idx_hv_review_decisions_workspace
  on public.hv_review_decisions (workspace_id);

alter table public.hv_review_decisions enable row level security;

-- Preserve the live ACL boundary. The following July 8 migration installs the
-- exact reviewed workspace-isolation policy captured from production.
grant select, insert, update, delete on table public.hv_review_decisions
  to anon, authenticated;
grant all privileges on table public.hv_review_decisions to service_role;

-- The production trigger function currently references columns that are not
-- present on production's legacy audit_events table. Retain the same review
-- decision evidence in the live entity/actor/metadata audit contract so the
-- restored trigger is executable rather than reproducing that latent failure.
create or replace function public.hv_audit_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.audit_events (
    entity_type,
    entity_id,
    action,
    actor,
    actor_user_id,
    actor_org_id,
    metadata
  )
  values (
    'hv_review_decision',
    new.id,
    'review_decision.' || new.decision,
    new.decided_by::text,
    new.decided_by,
    new.workspace_id,
    jsonb_build_object(
      'artifact_id', new.artifact_id,
      'decision_note', new.decision_note,
      'previous_status', new.previous_status,
      'new_status', new.new_status,
      'previous_lifecycle', new.previous_lifecycle,
      'new_lifecycle', new.new_lifecycle,
      'public_eligible_set', new.public_eligible_set,
      'public_eligible_reason', new.public_eligible_reason,
      'evidence_ids', new.evidence_ids,
      'linked_sources', new.linked_sources
    )
  );
  return new;
end;
$function$;

drop trigger if exists trg_hv_review_decision_audit
  on public.hv_review_decisions;
create trigger trg_hv_review_decision_audit
  after insert on public.hv_review_decisions
  for each row execute function public.hv_audit_review_decision();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214312','restore_hv_review_decisions_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214312_restore_hv_review_decisions_foundation.sql

-- RECOVERY BEGIN 20260708214313_restore_hv_updated_at_function.sql
-- Production's shared Harbourview updated-at trigger function existed out of band
-- before the restored HV artifact relations. Restore its exact live definition so
-- zero-state replay can install the production triggers without reordering tables.

create or replace function public.hv_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214313','restore_hv_updated_at_function','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214313_restore_hv_updated_at_function.sql

-- RECOVERY BEGIN 20260708214314_restore_hv_relations_foundation.sql
-- Production's Harbourview relation and review-decision controls existed before
-- the July 8 RLS initplan advisory snapshot, but their creating DDL was absent
-- from repository zero-state history. Restore the exact contracts without
-- replacing rows or modifying existing relations.

do $restore_hv_relation_type$
begin
  create type public.hv_relation_type as enum (
    'references',
    'derived_from',
    'contradicts',
    'supports',
    'part_of',
    'follow_up',
    'supersedes',
    'related_to'
  );
exception
  when duplicate_object then null;
end
$restore_hv_relation_type$;

create table if not exists public.hv_relations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  from_artifact uuid not null references public.hv_artifacts(id) on delete cascade,
  to_artifact uuid not null references public.hv_artifacts(id) on delete cascade,
  relation_type public.hv_relation_type not null,
  confidence double precision,
  is_ai_suggested boolean not null default false,
  reviewed boolean not null default false,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint hv_relations_no_self check (from_artifact <> to_artifact),
  constraint hv_relations_unique unique (from_artifact, to_artifact, relation_type)
);

create index if not exists idx_hv_relations_ai
  on public.hv_relations (is_ai_suggested)
  where is_ai_suggested = true and reviewed = false;
create index if not exists idx_hv_relations_created_by
  on public.hv_relations (created_by);
create index if not exists idx_hv_relations_from
  on public.hv_relations (from_artifact);
create index if not exists idx_hv_relations_reviewed_by
  on public.hv_relations (reviewed_by);
create index if not exists idx_hv_relations_to
  on public.hv_relations (to_artifact);
create index if not exists idx_hv_relations_type
  on public.hv_relations (relation_type);
create index if not exists idx_hv_relations_workspace_id
  on public.hv_relations (workspace_id);

alter table public.hv_relations enable row level security;

create or replace function public.hv_audit_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.audit_events (entity_type, entity_id, action, actor, metadata)
  values (
    'hv_review_decision',
    new.id,
    'review_decision.' || new.decision,
    new.decided_by::text,
    jsonb_build_object(
      'artifact_id', new.artifact_id,
      'previous_status', new.previous_status,
      'new_status', new.new_status,
      'previous_lifecycle', new.previous_lifecycle,
      'new_lifecycle', new.new_lifecycle,
      'public_eligible_set', new.public_eligible_set
    )
  );
  return new;
end;
$function$;

create table if not exists public.hv_review_decisions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  decision text not null,
  decision_note text,
  previous_status public.hv_review_status,
  new_status public.hv_review_status not null,
  previous_lifecycle public.hv_lifecycle_stage,
  new_lifecycle public.hv_lifecycle_stage not null,
  public_eligible_set boolean,
  public_eligible_reason text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now(),
  evidence_ids uuid[],
  linked_sources text[],
  created_at timestamptz not null default now()
);

create index if not exists idx_hv_review_decisions_artifact
  on public.hv_review_decisions (artifact_id);
create index if not exists idx_hv_review_decisions_decided_at
  on public.hv_review_decisions (decided_at desc);
create index if not exists idx_hv_review_decisions_decided_by
  on public.hv_review_decisions (decided_by);
create index if not exists idx_hv_review_decisions_workspace
  on public.hv_review_decisions (workspace_id);

alter table public.hv_review_decisions enable row level security;

drop trigger if exists trg_hv_review_decision_audit on public.hv_review_decisions;
create trigger trg_hv_review_decision_audit
  after insert on public.hv_review_decisions
  for each row execute function public.hv_audit_review_decision();

-- Preserve the live ACL boundary. The July 8 migration installs the exact
-- reviewed workspace-isolation policies captured from production.
grant select, insert, update, delete on table public.hv_relations
  to anon, authenticated;
grant all privileges on table public.hv_relations to service_role;

grant select, insert, update, delete on table public.hv_review_decisions
  to anon, authenticated;
grant all privileges on table public.hv_review_decisions to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214314','restore_hv_relations_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214314_restore_hv_relations_foundation.sql

-- RECOVERY BEGIN 20260708214315_restore_hv_evidence_foundation.sql
-- Production's public.hv_evidence relation existed before the July 8 RLS
-- initplan advisory snapshot, but its creating DDL was absent from repository
-- zero-state history. Restore the production table contract without replacing
-- rows or changing an existing relation.

create table if not exists public.hv_evidence (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id),
  source_system text not null,
  source_id text,
  source_url text,
  captured_at timestamptz not null default now(),
  captured_by uuid references auth.users(id),
  import_batch_id uuid,
  content_hash text not null,
  mime_type text,
  file_size_bytes bigint,
  storage_path text,
  extracted_text text,
  word_count integer,
  classification public.hv_classification not null default 'internal'::public.hv_classification,
  access_classification public.hv_classification not null default 'restricted'::public.hv_classification,
  ocr_status text default 'not_required'::text,
  extraction_status text default 'pending'::text,
  requires_translation boolean default false,
  language_detected text,
  review_status public.hv_review_status not null default 'pending'::public.hv_review_status,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  redaction_status text default 'not_required'::text,
  retention_status text not null default 'active'::text,
  legal_hold boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hv_evidence_artifact
  on public.hv_evidence (artifact_id);
create index if not exists idx_hv_evidence_captured_by
  on public.hv_evidence (captured_by);
create index if not exists idx_hv_evidence_content_hash
  on public.hv_evidence (content_hash);
create index if not exists idx_hv_evidence_reviewed_by
  on public.hv_evidence (reviewed_by);
create index if not exists idx_hv_evidence_source
  on public.hv_evidence (source_system, source_id);
create index if not exists idx_hv_evidence_workspace
  on public.hv_evidence (workspace_id);

alter table public.hv_evidence enable row level security;

drop trigger if exists trg_hv_evidence_updated_at on public.hv_evidence;
create trigger trg_hv_evidence_updated_at
  before update on public.hv_evidence
  for each row execute function public.hv_set_updated_at();

-- Preserve the live ACL boundary. The following migration installs the exact
-- reviewed workspace-isolation policy captured from production.
grant select, insert, update, delete on table public.hv_evidence
  to anon, authenticated;
grant all privileges on table public.hv_evidence to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214315','restore_hv_evidence_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214315_restore_hv_evidence_foundation.sql

-- RECOVERY BEGIN 20260708214316_restore_external_sync_inbox_foundation.sql
-- Production's controlled connector-staging inbox existed out of band before the
-- 20260708214318 RLS initplan snapshot. Restore the exact durable relation during
-- zero-state replay without replacing or updating existing observations.

create table if not exists public.external_sync_inbox (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'READ_ONLY_AUDIT'
    check (mode = any (array['READ_ONLY_AUDIT','CONTROLLED_WRITE','SCHEMA_CHANGE','PRODUCTION_SMOKE']::text[])),
  system text not null
    check (system = any (array['notion','linear','airtable','github','n8n','vercel','supabase','google_drive','manual','other']::text[])),
  external_type text not null,
  external_id text not null,
  external_url text,
  operation text not null
    check (operation = any (array['observe','propose_insert','propose_update','propose_archive','propose_link','reject','apply']::text[])),
  target_table text,
  target_record_id text,
  idempotency_key text not null,
  source_hash text,
  payload jsonb not null default '{}'::jsonb,
  proposed_changes jsonb not null default '{}'::jsonb,
  duplicate_check jsonb not null default '{}'::jsonb,
  safety_check jsonb not null default '{}'::jsonb,
  status text not null default 'pending_review'
    check (status = any (array['pending_review','approved','applied','rejected','superseded','failed']::text[])),
  approval_required boolean not null default true,
  approved_by uuid,
  approved_at timestamptz,
  applied_by uuid,
  applied_at timestamptz,
  error_message text,
  created_by uuid,
  created_by_system text not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_sync_inbox_idempotency_unique unique (idempotency_key)
);

create index if not exists external_sync_inbox_status_idx
  on public.external_sync_inbox(status, created_at desc);
create index if not exists external_sync_inbox_system_idx
  on public.external_sync_inbox(system, external_type, external_id);
create index if not exists external_sync_inbox_target_idx
  on public.external_sync_inbox(target_table, target_record_id);

alter table public.external_sync_inbox enable row level security;

comment on table public.external_sync_inbox is
  'Controlled staging inbox for connector observations and proposed writes. External systems land here before touching canonical Harbourview records.';

-- Match production ACLs. The immediately following RLS snapshot installs the
-- admin/operator insert, select, and update policies; service_role retains full
-- trusted queue access.
grant select, insert, update, delete on table public.external_sync_inbox
  to anon, authenticated;
grant all privileges on table public.external_sync_inbox to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214316','restore_external_sync_inbox_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214316_restore_external_sync_inbox_foundation.sql

-- RECOVERY BEGIN 20260708214317_restore_counterparty_stubs_foundation.sql
-- Production's public.counterparty_stubs relation existed out of band before the
-- 20260708214318 RLS initplan snapshot rewrote its policy. Restore the exact
-- relation contract during zero-state replay without replacing or updating data.

create table if not exists public.counterparty_stubs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null check (char_length(display_name) > 0),
  jurisdiction_code text,
  license_number text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_counterparty_stubs_workspace
  on public.counterparty_stubs(workspace_id);

alter table public.counterparty_stubs enable row level security;

do $restore_counterparty_stubs_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.counterparty_stubs'::regclass
      and polname = 'admin_all_counterparty_stubs'
  ) then
    create policy admin_all_counterparty_stubs
      on public.counterparty_stubs
      as permissive
      for all
      to public
      using (
        (select auth.uid()) is not null
        and (select auth.role()) = 'admin'::text
      )
      with check (
        (select auth.uid()) is not null
        and (select auth.role()) = 'admin'::text
      );
  end if;
end
$restore_counterparty_stubs_policy$;

-- Match the production table ACL. The policy remains the row-access boundary;
-- service_role retains trusted maintenance access.
grant select, insert, update, delete on table public.counterparty_stubs
  to anon, authenticated;
grant all privileges on table public.counterparty_stubs to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214317','restore_counterparty_stubs_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214317_restore_counterparty_stubs_foundation.sql

-- RECOVERY BEGIN 20260708214318_fix_auth_rls_initplan_scalar_subquery_v2.sql
-- Fix auth_rls_initplan: wrap auth.uid()/auth.role() in scalar subquery
-- Source: live pg_policies query 2026-07-08

DROP POLICY IF EXISTS "admin_operator_select" ON public."audit_events";
CREATE POLICY "admin_operator_select" ON public."audit_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_canonical_admin_operator_all" ON public."canadian_operator_canonical";
CREATE POLICY "canadian_operator_canonical_admin_operator_all" ON public."canadian_operator_canonical"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_conflicts_admin_operator_all" ON public."canadian_operator_conflicts";
CREATE POLICY "canadian_operator_conflicts_admin_operator_all" ON public."canadian_operator_conflicts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_duplicate_clusters_admin_operator_all" ON public."canadian_operator_duplicate_clusters";
CREATE POLICY "canadian_operator_duplicate_clusters_admin_operator_all" ON public."canadian_operator_duplicate_clusters"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_exclusions_admin_operator_all" ON public."canadian_operator_exclusions";
CREATE POLICY "canadian_operator_exclusions_admin_operator_all" ON public."canadian_operator_exclusions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_individual_holds_admin_operator_all" ON public."canadian_operator_individual_holds";
CREATE POLICY "canadian_operator_individual_holds_admin_operator_all" ON public."canadian_operator_individual_holds"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_licence_sites_admin_operator_all" ON public."canadian_operator_licence_sites";
CREATE POLICY "canadian_operator_licence_sites_admin_operator_all" ON public."canadian_operator_licence_sites"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "canadian_operator_outreach_queue_admin_operator_all" ON public."canadian_operator_outreach_queue";
CREATE POLICY "canadian_operator_outreach_queue_admin_operator_all" ON public."canadian_operator_outreach_queue"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."candidate_review_events";
CREATE POLICY "admin_operator_select" ON public."candidate_review_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_insert" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_insert" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_read" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_read" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_pathway_progress_member_update" ON public."cc_org_pathway_progress";
CREATE POLICY "cc_org_pathway_progress_member_update" ON public."cc_org_pathway_progress"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_insert" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_insert" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_read" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_read" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_org_req_status_member_update" ON public."cc_org_requirement_status";
CREATE POLICY "cc_org_req_status_member_update" ON public."cc_org_requirement_status"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_delete" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_delete" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_insert" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_insert" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "cc_watch_rules_member_read" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_read" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watch_rules_member_update" ON public."cc_watch_rules";
CREATE POLICY "cc_watch_rules_member_update" ON public."cc_watch_rules"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_delete" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_delete" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_insert" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_insert" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((added_by = (SELECT auth.uid())) AND (org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_read" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_read" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_items_member_update" ON public."cc_watchlist_items";
CREATE POLICY "cc_watchlist_items_member_update" ON public."cc_watchlist_items"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((org_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "cc_watchlist_notifs_user_read" ON public."cc_watchlist_notifications";
CREATE POLICY "cc_watchlist_notifs_user_read" ON public."cc_watchlist_notifications"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "cc_watchlist_notifs_user_update" ON public."cc_watchlist_notifications";
CREATE POLICY "cc_watchlist_notifs_user_update" ON public."cc_watchlist_notifications"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_all_counterparty_stubs" ON public."counterparty_stubs";
CREATE POLICY "admin_all_counterparty_stubs" ON public."counterparty_stubs"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.role()) = 'admin'::text)))
  WITH CHECK ((((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.role()) = 'admin'::text)));

DROP POLICY IF EXISTS "country_intel_admin_select" ON public."country_intel";
CREATE POLICY "country_intel_admin_select" ON public."country_intel"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "country_intel_intel_tier_read" ON public."country_intel";
CREATE POLICY "country_intel_intel_tier_read" ON public."country_intel"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((review_status = 'active'::text) AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text])))))));

DROP POLICY IF EXISTS "cultivar_aliases_owner_all" ON public."cultivar_aliases";
CREATE POLICY "cultivar_aliases_owner_all" ON public."cultivar_aliases"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_aliases.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_aliases.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "cultivar_country_opportunities_owner_all" ON public."cultivar_country_opportunities";
CREATE POLICY "cultivar_country_opportunities_owner_all" ON public."cultivar_country_opportunities"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_country_opportunities.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = cultivar_country_opportunities.cultivar_id) AND ((cp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "cultivar_passports_owner_all" ON public."cultivar_passports";
CREATE POLICY "cultivar_passports_owner_all" ON public."cultivar_passports"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()))
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()));

DROP POLICY IF EXISTS "deal_room_messages_participants_insert" ON public."deal_room_messages";
CREATE POLICY "deal_room_messages_participants_insert" ON public."deal_room_messages"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.uid()) = sender_id) AND (EXISTS ( SELECT 1
   FROM deal_rooms dr
  WHERE ((dr.id = deal_room_messages.room_id) AND ((dr.initiator_id = (SELECT auth.uid())) OR (dr.counterparty_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "deal_room_messages_participants_select" ON public."deal_room_messages";
CREATE POLICY "deal_room_messages_participants_select" ON public."deal_room_messages"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM deal_rooms dr
  WHERE ((dr.id = deal_room_messages.room_id) AND ((dr.initiator_id = (SELECT auth.uid())) OR (dr.counterparty_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "deal_room_initiator_insert" ON public."deal_rooms";
CREATE POLICY "deal_room_initiator_insert" ON public."deal_rooms"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((SELECT auth.uid()) = initiator_id);

DROP POLICY IF EXISTS "deal_room_participants_select" ON public."deal_rooms";
CREATE POLICY "deal_room_participants_select" ON public."deal_rooms"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((((SELECT auth.uid()) = initiator_id) OR ((SELECT auth.uid()) = counterparty_id)));

DROP POLICY IF EXISTS "deal_room_participants_update" ON public."deal_rooms";
CREATE POLICY "deal_room_participants_update" ON public."deal_rooms"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((((SELECT auth.uid()) = initiator_id) OR ((SELECT auth.uid()) = counterparty_id)));

DROP POLICY IF EXISTS "admin_operator_select" ON public."disclosure_requests";
CREATE POLICY "admin_operator_select" ON public."disclosure_requests"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."dossiers";
CREATE POLICY "admin_operator_select" ON public."dossiers"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "education_modules_admin_select" ON public."education_modules";
CREATE POLICY "education_modules_admin_select" ON public."education_modules"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_insert" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_insert" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_select" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_select" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "external_sync_inbox_admin_operator_update" ON public."external_sync_inbox";
CREATE POLICY "external_sync_inbox_admin_operator_update" ON public."external_sync_inbox"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_access_grants_admin_owner_all" ON public."genetics_access_grants";
CREATE POLICY "genetics_access_grants_admin_owner_all" ON public."genetics_access_grants"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (grantor_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_grants.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (grantor_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_grants.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_access_grants_grantee_read" ON public."genetics_access_grants";
CREATE POLICY "genetics_access_grants_grantee_read" ON public."genetics_access_grants"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_grants.grantee_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "genetics_access_requests_owner_all" ON public."genetics_access_requests";
CREATE POLICY "genetics_access_requests_owner_all" ON public."genetics_access_requests"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_requests.requester_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_requests.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_access_requests.requester_profile_id) AND (gp.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_access_requests.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_claim_reviews_owner_read" ON public."genetics_claim_reviews";
CREATE POLICY "genetics_claim_reviews_owner_read" ON public."genetics_claim_reviews"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claim_reviews.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "genetics_claims_owner_admin_all" ON public."genetics_claims";
CREATE POLICY "genetics_claims_owner_admin_all" ON public."genetics_claims"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claims.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_claims.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_collaboration_projects_owner_all" ON public."genetics_collaboration_projects";
CREATE POLICY "genetics_collaboration_projects_owner_all" ON public."genetics_collaboration_projects"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_collaboration_projects.owner_profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_collaboration_projects.owner_profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_evidence_items_grant_read" ON public."genetics_evidence_items";
CREATE POLICY "genetics_evidence_items_grant_read" ON public."genetics_evidence_items"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM (genetics_access_grants gag
     JOIN genetics_profiles gp ON ((gp.id = gag.grantee_profile_id)))
  WHERE ((gag.cultivar_id = genetics_evidence_items.cultivar_id) AND (gp.owner_user_id = (SELECT auth.uid())) AND (gag.status = 'active'::access_grant_status) AND (gag.starts_at <= now()) AND ((gag.expires_at IS NULL) OR (gag.expires_at > now())) AND (gag.revoked_at IS NULL) AND ((genetics_evidence_items.id = ANY (gag.allowed_evidence_item_ids)) OR (genetics_evidence_items.evidence_type = ANY (gag.allowed_evidence_types)))))));

DROP POLICY IF EXISTS "genetics_evidence_items_owner_all" ON public."genetics_evidence_items";
CREATE POLICY "genetics_evidence_items_owner_all" ON public."genetics_evidence_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((created_by = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_evidence_items.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM cultivar_passports cp
  WHERE ((cp.id = genetics_evidence_items.cultivar_id) AND (cp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_profile_roles_owner_all" ON public."genetics_profile_roles";
CREATE POLICY "genetics_profile_roles_owner_all" ON public."genetics_profile_roles"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "genetics_profile_roles_owner_read" ON public."genetics_profile_roles";
CREATE POLICY "genetics_profile_roles_owner_read" ON public."genetics_profile_roles"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_profile_roles.profile_id) AND ((gp.owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer())))));

DROP POLICY IF EXISTS "genetics_profiles_owner_all" ON public."genetics_profiles";
CREATE POLICY "genetics_profiles_owner_all" ON public."genetics_profiles"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()))
  WITH CHECK (((owner_user_id = (SELECT auth.uid())) OR is_genetics_admin_or_reviewer()));

DROP POLICY IF EXISTS "genetics_project_members_member_read" ON public."genetics_project_members";
CREATE POLICY "genetics_project_members_member_read" ON public."genetics_project_members"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_project_members.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "genetics_routing_events_admin_operator_all" ON public."genetics_routing_events";
CREATE POLICY "genetics_routing_events_admin_operator_all" ON public."genetics_routing_events"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_events_analyst_read" ON public."genetics_routing_events";
CREATE POLICY "genetics_routing_events_analyst_read" ON public."genetics_routing_events"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_records_admin_operator_all" ON public."genetics_routing_records";
CREATE POLICY "genetics_routing_records_admin_operator_all" ON public."genetics_routing_records"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "genetics_routing_records_analyst_read" ON public."genetics_routing_records";
CREATE POLICY "genetics_routing_records_analyst_read" ON public."genetics_routing_records"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "genetics_service_providers_owner_all" ON public."genetics_service_providers";
CREATE POLICY "genetics_service_providers_owner_all" ON public."genetics_service_providers"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_service_providers.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((is_genetics_admin_or_reviewer() OR (EXISTS ( SELECT 1
   FROM genetics_profiles gp
  WHERE ((gp.id = genetics_service_providers.profile_id) AND (gp.owner_user_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "health_canada_raw_source_rows_admin_operator_all" ON public."health_canada_raw_source_rows";
CREATE POLICY "health_canada_raw_source_rows_admin_operator_all" ON public."health_canada_raw_source_rows"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "health_canada_source_snapshots_admin_operator_all" ON public."health_canada_source_snapshots";
CREATE POLICY "health_canada_source_snapshots_admin_operator_all" ON public."health_canada_source_snapshots"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "hv_artifacts_workspace_isolation" ON public."hv_artifacts";
CREATE POLICY "hv_artifacts_workspace_isolation" ON public."hv_artifacts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_embeddings_workspace_isolation" ON public."hv_embeddings";
CREATE POLICY "hv_embeddings_workspace_isolation" ON public."hv_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_evidence_workspace_isolation" ON public."hv_evidence";
CREATE POLICY "hv_evidence_workspace_isolation" ON public."hv_evidence"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_import_staging_admin" ON public."hv_import_staging";
CREATE POLICY "hv_import_staging_admin" ON public."hv_import_staging"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "hv_job_attempts_admin_only" ON public."hv_job_attempts";
CREATE POLICY "hv_job_attempts_admin_only" ON public."hv_job_attempts"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "hv_jobs_admin_only" ON public."hv_processing_jobs";
CREATE POLICY "hv_jobs_admin_only" ON public."hv_processing_jobs"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "hv_public_feed_admin_write" ON public."hv_public_feed";
CREATE POLICY "hv_public_feed_admin_write" ON public."hv_public_feed"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "hv_relations_workspace_isolation" ON public."hv_relations";
CREATE POLICY "hv_relations_workspace_isolation" ON public."hv_relations"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "hv_review_decisions_workspace_isolation" ON public."hv_review_decisions";
CREATE POLICY "hv_review_decisions_workspace_isolation" ON public."hv_review_decisions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((workspace_id IN ( SELECT workspace_members.workspace_id
   FROM workspace_members
  WHERE (workspace_members.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "ia_agent_tasks_admin_operator_all" ON public."ia_agent_tasks";
CREATE POLICY "ia_agent_tasks_admin_operator_all" ON public."ia_agent_tasks"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_counterparties_admin_operator_all" ON public."ia_counterparties";
CREATE POLICY "ia_counterparties_admin_operator_all" ON public."ia_counterparties"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_evidence_admin_operator_all" ON public."ia_evidence_vault";
CREATE POLICY "ia_evidence_admin_operator_all" ON public."ia_evidence_vault"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_feedback_admin_operator_all" ON public."ia_feedback_events";
CREATE POLICY "ia_feedback_admin_operator_all" ON public."ia_feedback_events"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_graph_edges_admin_operator_all" ON public."ia_graph_edges";
CREATE POLICY "ia_graph_edges_admin_operator_all" ON public."ia_graph_edges"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_graph_entities_admin_operator_all" ON public."ia_graph_entities";
CREATE POLICY "ia_graph_entities_admin_operator_all" ON public."ia_graph_entities"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_scoring_admin_operator_all" ON public."ia_scoring_records";
CREATE POLICY "ia_scoring_admin_operator_all" ON public."ia_scoring_records"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signal_embeddings_admin_operator_all" ON public."ia_signal_embeddings";
CREATE POLICY "ia_signal_embeddings_admin_operator_all" ON public."ia_signal_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signal_embeddings_intel_tier_read" ON public."ia_signal_embeddings";
CREATE POLICY "ia_signal_embeddings_intel_tier_read" ON public."ia_signal_embeddings"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signals_admin_operator_all" ON public."ia_signals";
CREATE POLICY "ia_signals_admin_operator_all" ON public."ia_signals"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_signals_intel_tier_read" ON public."ia_signals";
CREATE POLICY "ia_signals_intel_tier_read" ON public."ia_signals"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = (SELECT auth.uid())) AND (up.tier = ANY (ARRAY['intel'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_source_embeddings_admin_operator_all" ON public."ia_source_embeddings";
CREATE POLICY "ia_source_embeddings_admin_operator_all" ON public."ia_source_embeddings"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "ia_sources_admin_operator_all" ON public."ia_sources";
CREATE POLICY "ia_sources_admin_operator_all" ON public."ia_sources"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "intelligence_jobs_admin_read" ON public."intelligence_jobs";
CREATE POLICY "intelligence_jobs_admin_read" ON public."intelligence_jobs"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."internal_admin_notes";
CREATE POLICY "admin_operator_select" ON public."internal_admin_notes"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."listings";
CREATE POLICY "admin_operator_select" ON public."listings"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "Authenticated sellers can insert own candidates" ON public."marketplace_candidates";
CREATE POLICY "Authenticated sellers can insert own candidates" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((submitted_by = (SELECT auth.uid())) AND (submission_source = 'self_serve'::text)));

DROP POLICY IF EXISTS "Authenticated sellers can view own submissions" ON public."marketplace_candidates";
CREATE POLICY "Authenticated sellers can view own submissions" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((submitted_by = (SELECT auth.uid())));

DROP POLICY IF EXISTS "admin_operator_select" ON public."marketplace_candidates";
CREATE POLICY "admin_operator_select" ON public."marketplace_candidates"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."matches";
CREATE POLICY "admin_operator_select" ON public."matches"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_only" ON public."network_public_projections";
CREATE POLICY "admin_operator_only" ON public."network_public_projections"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_only" ON public."network_review_items";
CREATE POLICY "admin_operator_only" ON public."network_review_items"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "opportunities_admin_operator_read" ON public."opportunities";
CREATE POLICY "opportunities_admin_operator_read" ON public."opportunities"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_analyst_select" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_analyst_select" ON public."project_control_refs"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_insert" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_insert" ON public."project_control_refs"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "project_control_refs_admin_operator_update" ON public."project_control_refs";
CREATE POLICY "project_control_refs_admin_operator_update" ON public."project_control_refs"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "project_vault_admin_delete" ON public."project_vault";
CREATE POLICY "project_vault_admin_delete" ON public."project_vault"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_insert" ON public."project_vault";
CREATE POLICY "project_vault_admin_insert" ON public."project_vault"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_select" ON public."project_vault";
CREATE POLICY "project_vault_admin_select" ON public."project_vault"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "project_vault_admin_update" ON public."project_vault";
CREATE POLICY "project_vault_admin_update" ON public."project_vault"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DO $guard_schema_drift_alerts_policy$
BEGIN
  IF to_regclass('public.schema_drift_alerts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "schema_drift_alerts_admin_only" ON public."schema_drift_alerts"';
    EXECUTE $policy$
      CREATE POLICY "schema_drift_alerts_admin_only" ON public."schema_drift_alerts"
        AS PERMISSIVE
        FOR ALL
        TO PUBLIC
        USING ((EXISTS ( SELECT 1
         FROM user_roles
        WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::text)))))
    $policy$;
  END IF;
END
$guard_schema_drift_alerts_policy$;

DROP POLICY IF EXISTS "signal_digest_log_user_read" ON public."signal_digest_log";
CREATE POLICY "signal_digest_log_user_read" ON public."signal_digest_log"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM signal_subscriptions s
  WHERE ((s.id = signal_digest_log.subscription_id) AND (s.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "signal_subscriptions_user_self" ON public."signal_subscriptions";
CREATE POLICY "signal_subscriptions_user_self" ON public."signal_subscriptions"
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "signals_admin_operator_analyst_select" ON public."signals";
CREATE POLICY "signals_admin_operator_analyst_select" ON public."signals"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = ANY (ARRAY['admin'::text, 'operator'::text, 'analyst'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_documents";
CREATE POLICY "admin_operator_select" ON public."source_documents"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_registry";
CREATE POLICY "admin_operator_select" ON public."source_registry"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."source_snapshots";
CREATE POLICY "admin_operator_select" ON public."source_snapshots"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."sources";
CREATE POLICY "admin_operator_select" ON public."sources"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_operator_select" ON public."status_history";
CREATE POLICY "admin_operator_select" ON public."status_history"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public."subscriptions";
CREATE POLICY "Users can view own subscriptions" ON public."subscriptions"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can delete their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can insert their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can read their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can read their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON public."user_dashboard_preferences";
CREATE POLICY "Users can update their own dashboard preferences" ON public."user_dashboard_preferences"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own profile" ON public."user_profiles";
CREATE POLICY "Users can update own profile" ON public."user_profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own profile" ON public."user_profiles";
CREATE POLICY "Users can view own profile" ON public."user_profiles"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "user_profiles_service_insert" ON public."user_profiles";
CREATE POLICY "user_profiles_service_insert" ON public."user_profiles"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((SELECT auth.role()) = 'service_role'::text) OR ((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "user_roles_self_read" ON public."user_roles";
CREATE POLICY "user_roles_self_read" ON public."user_roles"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "workspace_members_admin_delete" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_delete" ON public."workspace_members"
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_admin_insert" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_insert" ON public."workspace_members"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_admin_update" ON public."workspace_members";
CREATE POLICY "workspace_members_admin_update" ON public."workspace_members"
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "workspace_members_read" ON public."workspace_members";
CREATE POLICY "workspace_members_read" ON public."workspace_members"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((((SELECT auth.uid()) = user_id) OR ((SELECT auth.role()) = 'admin'::text)));

DROP POLICY IF EXISTS "admin_operator_select" ON public."workspaces";
CREATE POLICY "admin_operator_select" ON public."workspaces"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."evidence";
CREATE POLICY "admin_all" ON "regulatory_signals"."evidence"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."publication_events";
CREATE POLICY "admin_all" ON "regulatory_signals"."publication_events"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."review_events";
CREATE POLICY "admin_all" ON "regulatory_signals"."review_events"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."signal_evidence_links";
CREATE POLICY "admin_all" ON "regulatory_signals"."signal_evidence_links"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."signals";
CREATE POLICY "admin_all" ON "regulatory_signals"."signals"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

DROP POLICY IF EXISTS "regulatory_source_check_runs_admin_operator_only" ON "regulatory_signals"."source_check_runs";
CREATE POLICY "regulatory_source_check_runs_admin_operator_only" ON "regulatory_signals"."source_check_runs"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "regulatory_source_snapshots_admin_operator_only" ON "regulatory_signals"."source_snapshots";
CREATE POLICY "regulatory_source_snapshots_admin_operator_only" ON "regulatory_signals"."source_snapshots"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = ANY (ARRAY['admin'::text, 'operator'::text]))))));

DROP POLICY IF EXISTS "admin_all" ON "regulatory_signals"."sources";
CREATE POLICY "admin_all" ON "regulatory_signals"."sources"
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (ur.role = 'admin'::text)))));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214318','fix_auth_rls_initplan_scalar_subquery_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214318_fix_auth_rls_initplan_scalar_subquery_v2.sql

-- RECOVERY BEGIN 20260708214752_backfill_medical_role_education_audience_tags.sql
-- Additive backfill: append the canonical RoleId tag to education_modules.audience
-- for rows currently only tagged with a legacy/synonym string, so getLiveEduTiles()
-- (which filters on exact audience-array containment against the canonical RoleId)
-- actually surfaces this content to doctor_prescriber / clinic_healthcare_operator /
-- patient_caregiver_education users. Nothing is removed — legacy tags stay in place
-- in case anything else still reads them.

UPDATE education_modules
SET audience = audience || ARRAY['doctor_prescriber']::text[]
WHERE 'doctor' = ANY(audience)
  AND NOT ('doctor_prescriber' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['clinic_healthcare_operator']::text[]
WHERE 'clinic' = ANY(audience)
  AND NOT ('clinic_healthcare_operator' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['patient_caregiver_education']::text[]
WHERE 'patient_general' = ANY(audience)
  AND NOT ('patient_caregiver_education' = ANY(audience));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214752','backfill_medical_role_education_audience_tags','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214752_backfill_medical_role_education_audience_tags.sql

-- RECOVERY BEGIN 20260708214926_backfill_commercial_role_education_audience_tags.sql
-- Same additive pattern as the medical role backfill: append the canonical RoleId
-- tag alongside existing legacy/synonym tags so getLiveEduTiles() actually surfaces
-- this content to the intended audience. Legacy tags are left in place.

UPDATE education_modules
SET audience = audience || ARRAY['importer']::text[]
WHERE 'buyer_importer' = ANY(audience)
  AND NOT ('importer' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['investor_operator']::text[]
WHERE 'investor' = ANY(audience)
  AND NOT ('investor_operator' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['distributor_wholesaler']::text[]
WHERE ('wholesaler_distributor' = ANY(audience) OR 'distributor' = ANY(audience))
  AND NOT ('distributor_wholesaler' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['lab_qa']::text[]
WHERE 'lab' = ANY(audience)
  AND NOT ('lab_qa' = ANY(audience));

UPDATE education_modules
SET audience = audience || ARRAY['cultivator_producer']::text[]
WHERE 'licensed_producer' = ANY(audience)
  AND NOT ('cultivator_producer' = ANY(audience));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708214926','backfill_commercial_role_education_audience_tags','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708214926_backfill_commercial_role_education_audience_tags.sql

-- RECOVERY BEGIN 20260708215028_backfill_regulator_policy_education_audience_tag.sql
UPDATE education_modules
SET audience = audience || ARRAY['government_regulator']::text[]
WHERE 'regulator_policy' = ANY(audience)
  AND NOT ('government_regulator' = ANY(audience));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708215028','backfill_regulator_policy_education_audience_tag','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708215028_backfill_regulator_policy_education_audience_tag.sql

-- RECOVERY BEGIN 20260708215138_backfill_exporter_tag_on_crossborder_modules.sql
-- Reviewed individually (not a mechanical synonym fix like the earlier backfills):
-- these 5 modules cover cross-border trade content that applies to exporters too,
-- but only had importer-side tags (or, in Health Canada's case, no trade-role tag
-- at all despite being literally titled "Export Requirements"). Additive only.

UPDATE education_modules
SET audience = audience || ARRAY['exporter']::text[]
WHERE slug IN (
  'canada-export-health-canada',
  'country-intel-tier1',
  'german-market-entry',
  'prohibition-risk-map',
  'supply-chain-intelligence'
)
AND NOT ('exporter' = ANY(audience));

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708215138','backfill_exporter_tag_on_crossborder_modules','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708215138_backfill_exporter_tag_on_crossborder_modules.sql

-- RECOVERY BEGIN 20260708215711_grant_anon_insert_buyer_requests_and_listings.sql
-- Same root cause as the supplier_profiles fix earlier: RLS policy exists for
-- anon INSERT, but the base-table GRANT was never applied, so submissions fail
-- at the permission-check layer before RLS is even evaluated.

GRANT INSERT ON public.buyer_requests TO anon;
GRANT INSERT ON public.listings TO anon;

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708215711','grant_anon_insert_buyer_requests_and_listings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708215711_grant_anon_insert_buyer_requests_and_listings.sql

-- RECOVERY BEGIN 20260708221926_backfill_source_url_outlet_editorial_headlines.sql

UPDATE daily_digest dd
SET editorial_headlines = (
  SELECT jsonb_agg(
    item || jsonb_build_object('source_url', ei.source_url, 'outlet_name', ei.outlet_name)
  )
  FROM jsonb_array_elements(dd.editorial_headlines) AS item
  JOIN editorial_items ei ON ei.id::text = item->>'item_id'
),
updated_at = now()
WHERE digest_date = current_date;

SELECT headline, source_url, outlet_name
FROM daily_digest dd, jsonb_to_recordset(dd.editorial_headlines) AS x(headline text, source_url text, outlet_name text)
WHERE dd.digest_date = current_date;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708221926','backfill_source_url_outlet_editorial_headlines','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708221926_backfill_source_url_outlet_editorial_headlines.sql

-- RECOVERY BEGIN 20260708221955_run_editorial_digest_v3_source_attribution.sql

CREATE OR REPLACE FUNCTION public.run_editorial_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault', 'extensions'
AS $function$
declare
  v_key text;
  v_items jsonb;
  v_item_ids text[];
  v_req bigint;
  v_pre text := 'You are the editor of Harbourview''s Daily Wire, a global cannabis news digest for a general audience — not a trade or industry briefing. Below is a JSON array of candidate items, each from a mainstream (non-cannabis-industry) news outlet or a government source, published within the last 7 days. Select up to 8 of the most interesting or globally significant items (fewer if fewer qualify) with a strong bias toward emerging and historically underreported cannabis markets — small or unusual jurisdictions, not the usual US/Canada/Germany/UK/Australia stories. You may include at most ONE major-market story, and only if it is genuinely globally significant this week; omit it entirely if nothing meets that bar. For each selected item, rewrite it as an original short editorial of roughly 150-250 words in Harbourview''s voice: analytical, globally-minded, measured, no hype or cannabis-culture slang, no promotional language, and no direct quotes over a few words. Ground every claim in the source material provided — do not invent facts, figures, or context not present in the input. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"headline": string (max 110 chars, your own words), "why_it_matters": string (the full ~150-250 word editorial body), "market": string (country name, or "Global"), "item_id": string (the id field from the input item you used)}. Order by editorial importance.';
begin
  if exists (select 1 from daily_digest where digest_date = current_date and editorial_headlines is not null) then
    return jsonb_build_object('ok',true,'skipped','editorial digest exists for today');
  end if;

  perform 1 from _editorial_digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    update _editorial_digest_jobs j set collected = true
    where j.digest_date = current_date and not j.collected
      and j.created_at < now() - interval '1 hour'
      and not exists (select 1 from net._http_response r where r.id = j.request_id);

    with resp as (
      select j.request_id, j.item_ids,
             (safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text') as claude_text,
             r.status_code
      from _editorial_digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, item_ids, status_code,
             safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, item_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    -- Re-attach real published_at/source_url/outlet_name from editorial_items,
    -- keyed on item_id, rather than trusting the model to echo them back.
    -- Without this, the UI has no way to show a reader where a piece
    -- actually came from, and the 7-day recency filter has no real date
    -- to work with on the next run.
    enriched as (
      select o.request_id, o.item_ids,
        (select jsonb_agg(elem || jsonb_build_object(
                  'published_at', ei.published_at,
                  'source_url', ei.source_url,
                  'outlet_name', ei.outlet_name))
         from jsonb_array_elements(o.p) as elem
         left join editorial_items ei on ei.id::text = elem->>'item_id') as p
      from ok o
    ),
    upsert as (
      insert into daily_digest (digest_date, headlines, markets, editorial_headlines, status, generated_at)
      select current_date, '[]'::jsonb, '{}', e.p, 'published', now()
      from enriched e
      on conflict (digest_date) do update
        set editorial_headlines = excluded.editorial_headlines,
            updated_at = now()
      returning id
    ),
    mark_used as (
      update editorial_items e set used_in_digest_at = now()
      from ok o
      where e.id::text = any(o.item_ids) and exists (select 1 from upsert)
      returning e.id
    ),
    done as (
      update _editorial_digest_jobs j set collected = true
      from parsed p
      where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'published', exists(select 1 from upsert),
      'items_marked', (select count(*) from mark_used))
    into v_items;

    return coalesce(v_items, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  if v_key is null then return jsonb_build_object('ok',false,'reason','anthropic_api_key not in vault'); end if;

  select jsonb_agg(jsonb_build_object(
           'id', e.id, 'headline', e.headline, 'summary', e.summary,
           'why_it_matters', e.why_it_matters, 'country', e.country,
           'outlet_name', e.outlet_name, 'tone', e.tone, 'published_at', e.published_at)),
         array_agg(e.id::text)
  into v_items, v_item_ids
  from (
    select * from editorial_items
    where stage = 'qualified' and used_in_digest_at is null
      and coalesce(published_at, created_at) > now() - interval '7 days'
    order by coalesce(published_at, created_at) desc
    limit 60
  ) e;

  if v_items is null or jsonb_array_length(v_items) < 3 then
    return jsonb_build_object('ok',true,'skipped','fewer than 3 unused editorial items published in the last 7 days',
      'available', coalesce(jsonb_array_length(v_items),0));
  end if;

  v_req := net.http_post(
    url := 'https://api.anthropic.com/v1/messages',
    headers := jsonb_build_object('x-api-key', v_key, 'anthropic-version','2023-06-01','content-type','application/json'),
    body := jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',6000,
      'messages', jsonb_build_array(jsonb_build_object('role','user','content',
        v_pre || E'\n\nITEMS:\n' || v_items::text))),
    timeout_milliseconds := 90000
  );

  insert into _editorial_digest_jobs (request_id, digest_date, item_ids)
  values (v_req, current_date, v_item_ids);

  return jsonb_build_object('ok',true,'phase','fire','request_id',v_req,'items_sent',jsonb_array_length(v_items));
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260708221955','run_editorial_digest_v3_source_attribution','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260708221955_run_editorial_digest_v3_source_attribution.sql

-- RECOVERY BEGIN 20260709000000_add_ratings_to_listings.sql
-- CONCURRENTLY removed 2026-08-05 for zero-state replay. The Supabase CLI sends
-- a migration's statements as one pipeline, and Postgres refuses CREATE INDEX
-- CONCURRENTLY there:
--   ERROR: CREATE INDEX CONCURRENTLY cannot be executed within a pipeline
--   (SQLSTATE 25001)
-- Only the keyword is dropped; every index name, table and column list below is
-- unchanged, so the resulting schema is identical. CONCURRENTLY exists to avoid
-- locking a populated table, which is meaningless against the empty database a
-- replay builds, and production already carries these indexes -- this version is
-- recorded in supabase_migrations.schema_migrations, applied there as a single
-- statement, which is why the pipeline rule never bit in production.

-- Add ratings support to unified marketplace listings
-- Aligns with review workflow and trust layer
--
-- Fixes applied on review of PR #1000:
--  1. Trigger is scoped to UPDATE OF the ratings columns (+ a WHEN guard) so
--     editing unrelated listing fields (title/price/status/etc.) no longer
--     bumps ratings_updated_at.
--  2. Trigger function pins search_path, matching the hardening already
--     applied to the sibling updated_at trigger in
--     20260501000002_set_marketplace_inquiries_updated_at_search_path.sql.
--  3. Trigger creation is idempotent (DROP IF EXISTS) like every other
--     statement in this file, so the migration can be re-run safely.
--  4. Replaced the RLS comment with an accurate note: no new policy is
--     added here because listings RLS is row-level, not column-scoped, so
--     these columns inherit existing access rules automatically.
--
-- Fixes applied on second review (this PR, #1004):
--  5. review_count is now bigint instead of integer -- avoids overflow risk
--     under real load (int tops out at ~2.1B, and this column is written by
--     automated review-ingestion paths, not just direct user action).
--  6. average_rating no longer defaults to 0.0. NULL is the correct "no
--     ratings yet" value -- 0.0 is indistinguishable from a real rock-bottom
--     rating. This is a low-risk change: every consumer already treats these
--     columns as nullable (see lib/server/listingsQuery.ts's
--     `average_rating: number | string | null` type and its
--     `average_rating.desc.nullslast` sort key, plus the `Number(x) || 0` /
--     `Number(x) > 0` defensive coercion in app/marketplace/listings/page.tsx,
--     app/dashboard/page.tsx, and app/country/[country]/role/[role]/page.tsx),
--     so no application-code changes are required. The CHECK constraint is
--     unaffected -- Postgres CHECK constraints pass automatically when the
--     expression evaluates to NULL.
--  7. The two CREATE INDEX statements that lived here were split out into
--     their own migration, 20260710160000_add_ratings_indexes_concurrently.sql,
--     so they can use CREATE INDEX without a table lock.
-- cannot run inside a transaction block, and this file also
--     contains transactional DDL (ALTER TABLE, CREATE FUNCTION, CREATE
--     TRIGGER) that must not be split across transactions -- so the indexes
--     need a dedicated file, matching the precedent already set by
--     20260622130000_add_missing_fk_indexes_jun22.sql.

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count bigint DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN IF NOT EXISTS ratings_updated_at timestamptz DEFAULT now();

-- Trigger to update timestamp only when ratings actually change
CREATE OR REPLACE FUNCTION update_ratings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ratings_updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ratings_updated ON listings;

CREATE TRIGGER trigger_ratings_updated
BEFORE UPDATE OF average_rating, review_count ON listings
FOR EACH ROW
WHEN (
  NEW.average_rating IS DISTINCT FROM OLD.average_rating
  OR NEW.review_count IS DISTINCT FROM OLD.review_count
)
EXECUTE FUNCTION update_ratings_timestamp();

-- Indexes for sorting/filtering on average_rating/review_count are created
-- in 20260710160000_add_ratings_indexes_concurrently.sql (see
-- fix #7 above) rather than here, since cannot run inside a
-- transaction block alongside this file's other DDL.

-- No new RLS policy needed: existing listings RLS policies are row-level
-- (not column-enumerated), so these new columns inherit current read/write
-- access rules automatically. Run `get_advisors` post-deploy to confirm no
-- unintended column-level exposure was introduced.
COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709000000','add_ratings_to_listings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709000000_add_ratings_to_listings.sql

-- RECOVERY BEGIN 20260709010000_expose_ratings_on_public_listings_view.sql
-- Surface the ratings columns added in 20260709000000_add_ratings_to_listings.sql
-- through the actual public read path: app/marketplace/listings/page.tsx (via
-- lib/server/listingsQuery.ts) queries public.marketplace_public_listings_v1
-- directly over the Supabase REST API, not hv_public.marketplace_listings_public
-- (a separate, unrelated view over hv_marketplace.listings).
--
-- NOTE: the live view (confirmed via pg_get_viewdef against project
-- zvxdgdkukjrrwamdpqrg) had already drifted from the definition checked in at
-- 20260601000000_marketplace_supply_engine.sql -- public.listings has no
-- subcategory, location_region, summary/public_summary or expires_at columns
-- in production, unlike what that migration file assumes. This migration
-- reproduces the *actual live* view definition verbatim, appending only the
-- two new rating columns at the end, rather than the stale one from that file.

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  NULL::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  NULL::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else NULL::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count
from listings l
where status::text = 'approved' and public_visibility = true and archived_at is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709010000','expose_ratings_on_public_listings_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709010000_expose_ratings_on_public_listings_view.sql

-- RECOVERY BEGIN 20260709024755_fix_auth_rls_initplan_service_role_policies_v3.sql

-- Fix remaining 9 RLS policies with bare auth.role() in USING/WITH CHECK expressions.
-- Wraps auth.role() in a scalar subquery so it is evaluated once per query, not per row.

DROP POLICY IF EXISTS "service_write_deal_room_messages" ON public.deal_room_messages;
CREATE POLICY "service_write_deal_room_messages" ON public.deal_room_messages
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_deal_rooms" ON public.deal_rooms;
CREATE POLICY "service_write_deal_rooms" ON public.deal_rooms
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_professionals" ON public.hv_professionals;
CREATE POLICY "service_write_professionals" ON public.hv_professionals
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "hv_public_feed_service_write" ON public.hv_public_feed;
CREATE POLICY "hv_public_feed_service_write" ON public.hv_public_feed
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_write_playbooks" ON public.jurisdiction_playbooks;
CREATE POLICY "service_write_playbooks" ON public.jurisdiction_playbooks
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "opportunities_service_write" ON public.opportunities;
CREATE POLICY "opportunities_service_write" ON public.opportunities
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "service_role_only" ON public.scraper_source_state;
CREATE POLICY "service_role_only" ON public.scraper_source_state
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role manages webhook events" ON public.stripe_webhook_events
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "prefs_service_write" ON public.user_dashboard_preferences;
CREATE POLICY "prefs_service_write" ON public.user_dashboard_preferences
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709024755','fix_auth_rls_initplan_service_role_policies_v3','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709024755_fix_auth_rls_initplan_service_role_policies_v3.sql

-- RECOVERY BEGIN 20260709031926_client_error_reports.sql
-- Client-side error capture for app/country/[country]/error.tsx and
-- app/global-error.tsx. Neither boundary currently records anything durable
-- (console.error only), so a client-side hydration crash leaves zero
-- evidence behind for the next investigation. This table is the landing
-- zone for a best-effort beacon fired from those boundaries' useEffect.
--
-- Insert-only for anon/authenticated (same shape as marketplace_inquiries):
-- visitors can report an error, nobody can read another visitor's report
-- through the client. user_id is populated from auth.uid() server-side via
-- the column default, not accepted from the client payload, so it can't be
-- spoofed by a caller hitting the API route directly.

create table if not exists public.client_error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  boundary text not null check (boundary in ('country_role', 'global')),
  route text,
  digest text,
  message text not null,
  stack text,
  user_agent text,
  viewport_width int,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  extra jsonb
);

alter table public.client_error_reports enable row level security;

revoke all on public.client_error_reports from anon;
revoke all on public.client_error_reports from authenticated;
grant insert on public.client_error_reports to anon, authenticated;

drop policy if exists "Public can report client errors" on public.client_error_reports;
create policy "Public can report client errors"
  on public.client_error_reports
  for insert
  to anon, authenticated
  with check (
    length(trim(message)) > 0
    and length(message) <= 2000
    and (stack is null or length(stack) <= 4000)
    and (route is null or length(route) <= 500)
    and (digest is null or length(digest) <= 200)
    and (user_agent is null or length(user_agent) <= 500)
    and (viewport_width is null or (viewport_width > 0 and viewport_width <= 20000))
    and (extra is null or pg_column_size(extra) <= 4000)
    and user_id is not distinct from auth.uid()
  );

create index if not exists client_error_reports_created_at_idx
  on public.client_error_reports (created_at desc);

-- PostgREST is configured to expose only the api schema (see
-- 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql for the
-- same PGRST205 "table not found in schema cache" failure mode this
-- prevents). Passthrough view + grant, no triggers needed: this is a
-- simple single-table view so Postgres's auto-updatable-view mechanism
-- handles INSERT (and the underlying table's default/RLS) transparently.

create or replace view api.client_error_reports as
select * from public.client_error_reports;

grant insert on api.client_error_reports to anon, authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709031926','client_error_reports','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709031926_client_error_reports.sql

-- RECOVERY BEGIN 20260709032305_client_error_reports_view_security_invoker.sql
-- api.client_error_reports (created in 20260710160000_client_error_reports.sql)
-- silently bypassed the base table's RLS: Postgres views default to
-- security_invoker = false, meaning permission/RLS checks run as the VIEW
-- OWNER (postgres, which owns the table and is exempt from RLS with no
-- FORCE ROW LEVEL SECURITY set), not as the actual calling role. Verified
-- live: an anon insert with a 2500-char message (policy caps at 2000) was
-- silently accepted through api.client_error_reports, while the identical
-- insert against public.client_error_reports directly was correctly
-- rejected. This also meant the user_id = auth.uid() anti-spoofing check
-- was bypassed via the view. security_invoker = true makes the view
-- evaluate RLS as the actual invoking role, closing both holes.

alter view api.client_error_reports set (security_invoker = true);

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709032305','client_error_reports_view_security_invoker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709032305_client_error_reports_view_security_invoker.sql

-- RECOVERY BEGIN 20260709085216_restore_sig_extract_jobs_foundation.sql
-- Restore the production-owned async signal extraction queue that existed
-- before provider tracking was added but was never captured in repository
-- migration history. The following migration adds the provider column.
CREATE TABLE IF NOT EXISTS public._sig_extract_jobs (
  request_id bigint PRIMARY KEY,
  snapshot_id text,
  source_name text,
  captured_url text,
  collected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709085216','restore_sig_extract_jobs_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709085216_restore_sig_extract_jobs_foundation.sql

-- RECOVERY BEGIN 20260709085217_signal_extraction_add_provider_column.sql

-- Track which LLM provider each async extraction job actually used, so the
-- circuit breaker can compute per-provider health instead of inferring it
-- from error-message text matching (fragile, and blind once we've already
-- switched away from a given provider since it stops generating new
-- error-text samples for that provider).
alter table _sig_extract_jobs add column if not exists provider text not null default 'anthropic';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709085217','signal_extraction_add_provider_column','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709085217_signal_extraction_add_provider_column.sql

-- RECOVERY BEGIN 20260709085300_signal_extraction_three_tier_fallback.sql

-- Extends the 2-tier (anthropic -> openai) circuit breaker to 3 tiers:
-- anthropic -> openai -> gemini. Replaces the old "last 20 jobs regardless
-- of provider, match Anthropic-specific error text" health check with a
-- per-provider, time-windowed, status-code-based check (works for any
-- provider's failure mode, not just Anthropic's specific error string).
--
-- Provider selection: walk anthropic -> openai -> gemini in order, pick the
-- first one that is configured (key present) and not degraded. "Degraded"
-- = that provider's own last 10 attempts in the last 2 hours have >=50%
-- non-200 responses. A provider with zero recent attempts (never tried, or
-- its last attempt aged out of the 2h window because we've been running on
-- a lower-priority fallback) counts as available -- this is what lets a
-- higher-priority provider get automatically re-probed once its bad streak
-- is old enough, without permanently pinning to whichever provider we
-- first failed over to.
create or replace function public.run_signal_extraction(p_fire_limit integer default 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1500)
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709085300','signal_extraction_three_tier_fallback','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709085300_signal_extraction_three_tier_fallback.sql

-- RECOVERY BEGIN 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql

-- Fixes two real bugs found by live-testing the gemini branch added in
-- signal_extraction_three_tier_fallback, before it ever got exercised by
-- real traffic (anthropic recovered on its own right after that migration,
-- so the 3-tier priority order never naturally reached gemini):
--
-- 1. gemini-flash-latest resolves to gemini-3.5-flash, which spends tokens
--    on internal "thinking" by default (thoughtsTokenCount) before
--    producing visible output. With maxOutputTokens=1500 shared between
--    thinking and the answer, a real request came back with
--    finishReason=MAX_TOKENS and truncated/invalid JSON -- essentially all
--    budget consumed by thinking. This task is simple structured
--    extraction, not reasoning, so thinking is disabled outright
--    (thinkingConfig.thinkingBudget=0) rather than just raising the token
--    ceiling.
-- 2. The response text can be split across multiple entries in
--    candidates[0].content.parts (observed one request with parts[0] =
--    "```json\n" and the real content in parts[1]). The old parsing only
--    read parts[0], which would have silently produced empty/garbage
--    extractions. Now concatenates all parts' text.
create or replace function public.run_signal_extraction(p_fire_limit integer default 25)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault', 'extensions'
as $function$
declare
  v_anthropic_key text;
  v_openai_key text;
  v_gemini_key text;
  v_pre text := 'You are an intelligence analyst for a B2B cannabis market-intelligence platform. From the SOURCE (which may be only a news headline/snippet), extract concrete, commercially-relevant signals — specific developments in cannabis regulation, licensing, markets, trade, M&A, taxation, or industry that a B2B operator would act on. A clear headline about a real development IS a signal. Ignore pure opinion, navigation and boilerplate. Return ONLY a JSON array (no markdown fences, no prose). Each element: {"title": string up to 120 chars, "type": one of "regulatory","market","commercial","legal","competitive", "market": full English country name or "Global", "confidence": integer 0-100, "commercial_impact": "high"|"medium"|"low", "summary": 2-4 factual sentences}. If there is no genuine signal, return [].';
  v_inserted int := 0; v_collected int := 0; v_fired int := 0;
  v_provider text := null;
  v_attempts int; v_failures int;
begin
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_anthropic_key is null and v_openai_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no anthropic_api_key, openai_api_key or gemini_api_key in vault');
  end if;

  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false
    and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id)
    and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  where coalesce(j.collected,false)=false and j.created_at < now()-interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id=j.request_id);

  with resp as (
    select j.request_id, j.snapshot_id, j.source_name, j.captured_url,
           coalesce(
             safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
             safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
             (select string_agg(part ->> 'text', '')
                from jsonb_array_elements(coalesce(safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts', '[]'::jsonb)) as part)
           ) as claude_text
    from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
    where coalesce(j.collected,false)=false and r.status_code=200
  ),
  arr as (select *, safe_to_jsonb(trim(both from regexp_replace(claude_text,'```(?:json)?','','g'))) as p from resp),
  arr2 as (select *, case when jsonb_typeof(p)='array' then p else '[]'::jsonb end as a from arr),
  cand as (
    select a.source_name, a.captured_url, a.snapshot_id, sig,
      left(coalesce(sig->>'title','Untitled signal'),300) as t,
      left(coalesce(sig->>'market','Global'),120) as mkt,
      least(100,greatest(0,coalesce((sig->>'confidence')::int,50))) as conf,
      row_number() over (partition by lower(coalesce(sig->>'title','')), lower(coalesce(sig->>'market','')) order by 1) as rn
    from arr2 a, jsonb_array_elements(a.a) as sig
    where jsonb_typeof(a.a)='array' and jsonb_array_length(a.a)>0
  ),
  ins as (
    insert into ia_signals (id,title,type,category,stage,market,confidence,commercial_impact,summary,source_id,source_name,notes)
    select 's-'||gen_random_uuid(), c.t,
      case when lower(coalesce(c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(c.sig->>'type') else 'regulatory' end,
      case when lower(coalesce(c.sig->>'category',c.sig->>'type','')) in ('regulatory','market','commercial','legal','competitive') then lower(coalesce(c.sig->>'category',c.sig->>'type')) else 'regulatory' end,
      case when c.conf >= 80 then 'qualified' else 'new' end,
      c.mkt, c.conf,
      case when lower(coalesce(c.sig->>'commercial_impact','')) in ('high','medium','low') then lower(c.sig->>'commercial_impact') else 'medium' end,
      coalesce(c.sig->>'summary',''), null, c.source_name,
      'auto-extracted (claude-haiku-4-5) from snapshot '||c.snapshot_id||coalesce(' · '||c.captured_url,'')
    from cand c
    where c.rn = 1
      and not public.is_boilerplate_signal(c.sig->>'summary')
      and not exists (
        select 1 from ia_signals x
        where lower(x.title)=lower(c.t) and lower(x.market)=lower(c.mkt)
          and x.created_at > now() - interval '45 days'
      )
    returning 1
  )
  select count(*) into v_inserted from ins;

  update source_snapshots s set processing_status='extracted', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code=200 and s.processing_status<>'extracted';
  update source_snapshots s set processing_status='failed', processed_at=now()
  from _sig_extract_jobs j join net._http_response r on r.id=j.request_id
  where s.id::text=j.snapshot_id and coalesce(j.collected,false)=false and r.status_code<>200 and s.processing_status='pending';
  update _sig_extract_jobs j set collected=true
  from net._http_response r where r.id=j.request_id and coalesce(j.collected,false)=false;
  get diagnostics v_collected = row_count;

  -- Tier 1: anthropic
  if v_anthropic_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='anthropic' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  -- Tier 2: openai
  if v_provider is null and v_openai_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='openai' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  -- Tier 3: gemini
  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _sig_extract_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    return jsonb_build_object('ok', true, 'degraded', true, 'reason', 'all_configured_llm_providers_degraded',
      'inserted', v_inserted, 'collected', v_collected, 'fired', 0, 'ran_at', now());
  end if;

  if v_provider = 'anthropic' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.anthropic.com/v1/messages',
      headers:=jsonb_build_object('x-api-key',v_anthropic_key,'anthropic-version','2023-06-01','content-type','application/json'),
      body:=jsonb_build_object('model','claude-haiku-4-5-20251001','max_tokens',1500,
        'messages',jsonb_build_array(jsonb_build_object('role','user','content',
          v_pre || E'\n\nSOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000)))),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'anthropic'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  elsif v_provider = 'openai' then
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://api.openai.com/v1/chat/completions',
      headers:=jsonb_build_object('Authorization','Bearer '||v_openai_key,'content-type','application/json'),
      body:=jsonb_build_object('model','gpt-4o-mini','max_tokens',1500,'temperature',0,
        'messages',jsonb_build_array(
          jsonb_build_object('role','system','content',v_pre),
          jsonb_build_object('role','user','content',
            E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
            || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))
        )),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'openai'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  else
    insert into _sig_extract_jobs (request_id, snapshot_id, source_name, captured_url, provider)
    select net.http_post(
      url:='https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers:=jsonb_build_object('x-goog-api-key',v_gemini_key,'content-type','application/json'),
      body:=jsonb_build_object(
        'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', v_pre))),
        'contents', jsonb_build_array(jsonb_build_object('role','user','parts',jsonb_build_array(jsonb_build_object('text',
          E'SOURCE: '||coalesce(sr.source_name,s.captured_title,'Source crawl')
          || E'\nTITLE: '||coalesce(s.captured_title,'') || E'\nTEXT:\n'||left(coalesce(s.captured_text,''),8000))))),
        'generationConfig', jsonb_build_object('temperature',0,'maxOutputTokens',1500,'thinkingConfig',jsonb_build_object('thinkingBudget',0))
      ),
      timeout_milliseconds:=60000
    ), s.id::text, coalesce(sr.source_name,s.captured_title,'Source crawl'), s.captured_url, 'gemini'
    from source_snapshots s
    left join source_registry sr on sr.id=s.source_id
    where s.processing_status='pending' and s.fetch_status='success'
      and s.id::text not in (select snapshot_id from _sig_extract_jobs)
    order by s.created_at desc limit p_fire_limit;
    get diagnostics v_fired = row_count;
  end if;

  return jsonb_build_object('ok',true,'degraded',(v_provider <> 'anthropic'),'provider',v_provider,'inserted',v_inserted,'collected',v_collected,'fired',v_fired,'ran_at',now());
end $function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709085504','signal_extraction_fix_gemini_thinking_and_parts','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709085504_signal_extraction_fix_gemini_thinking_and_parts.sql

-- RECOVERY BEGIN 20260709092127_fix_security_definer_views_api_schema.sql
-- Switch API-schema views to SECURITY INVOKER so RLS policies on underlying
-- relations are enforced for the querying user. api.daily_digest exists at
-- this chronology point. The remaining 13 views are direct-state production
-- objects whose repository creators run on 2026-07-10, so guard only those
-- not-yet-created relations and harden them explicitly in their creators.
ALTER VIEW api.daily_digest SET (security_invoker = on);

DO $guard_deferred_api_views$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY[
    'local_intel_coverage',
    'education_module_sections',
    'jurisdiction_playbooks',
    'public_signals',
    'education_modules',
    'listings',
    'local_open_questions',
    'local_evidence_coverage',
    'local_subdivisions_intel',
    'local_authorities',
    'local_operating_notes',
    'cc_pathway_templates',
    'workspace_members'
  ]
  LOOP
    IF to_regclass(format('api.%I', view_name)) IS NOT NULL THEN
      EXECUTE format('ALTER VIEW api.%I SET (security_invoker = on)', view_name);
    END IF;
  END LOOP;
END
$guard_deferred_api_views$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709092127','fix_security_definer_views_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709092127_fix_security_definer_views_api_schema.sql

-- RECOVERY BEGIN 20260709092128_fix_function_search_path_api_schema.sql
-- Fix mutable search_path on api.get_functions_missing_from_api_schema when
-- its public delegate already exists. In repository zero-state, the delegate
-- is created by 20260710140000_schema_drift_monitor_functions.sql, so defer
-- this repair until that creator while preserving direct-state production
-- behavior at this chronology point.
DO $guard_get_functions_missing_wrapper$
BEGIN
  IF to_regprocedure('public.get_functions_missing_from_api_schema()') IS NOT NULL THEN
    EXECUTE $function_sql$
      CREATE OR REPLACE FUNCTION api.get_functions_missing_from_api_schema()
        RETURNS TABLE(function_name text, arg_types text)
        LANGUAGE sql
        STABLE
        SET search_path = ''
      AS $function$
        SELECT * FROM public.get_functions_missing_from_api_schema()
      $function$
    $function_sql$;
  END IF;
END
$guard_get_functions_missing_wrapper$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709092128','fix_function_search_path_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709092128_fix_function_search_path_api_schema.sql

-- RECOVERY BEGIN 20260709092130_fix_rls_no_policy_backup_table.sql
-- country_intel_backup_20260630 is an out-of-band production snapshot.
-- When present, add the production service-role-only policy so internal backup
-- and restore operations can access it while anon/authenticated remain denied.
-- Zero-state history intentionally does not fabricate the backup relation.
do $guard_country_intel_backup_policy$
declare
  target_relation regclass := to_regclass('public.country_intel_backup_20260630');
begin
  if target_relation is not null
     and not exists (
       select 1
       from pg_policy
       where polrelid = target_relation
         and polname = 'service_role_only'
     ) then
    execute $policy$
      create policy service_role_only
        on public.country_intel_backup_20260630
        as permissive
        for all
        to public
        using ((select auth.role()) = 'service_role'::text)
    $policy$;
  end if;
end
$guard_country_intel_backup_policy$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709092130','fix_rls_no_policy_backup_table','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709092130_fix_rls_no_policy_backup_table.sql

-- RECOVERY BEGIN 20260709110857_switch_embeddings_768_dim_repair.sql
-- Repair stub: this migration's content (switch ia_signal_embeddings to
-- 768-dim for text-embedding-004) was already committed as
-- 20260708100000_switch_embeddings_768_dim.sql, but Supabase's apply
-- tooling recorded it under this timestamp (20260709110857) in the remote
-- supabase_migrations.schema_migrations ledger when it was actually
-- executed, rather than the version already present in the filename.
-- Same migration, two ledger-adjacent version numbers. This stub reconciles
-- the local migration directory with the remote ledger for this specific
-- version; the actual DDL is not repeated here since it already ran.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709110857','switch_embeddings_768_dim_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709110857_switch_embeddings_768_dim_repair.sql

-- RECOVERY BEGIN 20260709165804_add_ratings_to_listings.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709165804.
--
-- Rewriting this file cannot affect production: 20260709165804 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5.0),
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN IF NOT EXISTS ratings_updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_ratings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ratings_updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ratings_updated ON listings;

CREATE TRIGGER trigger_ratings_updated
BEFORE UPDATE OF average_rating, review_count ON listings
FOR EACH ROW
WHEN (
  NEW.average_rating IS DISTINCT FROM OLD.average_rating
  OR NEW.review_count IS DISTINCT FROM OLD.review_count
)
EXECUTE FUNCTION update_ratings_timestamp();

CREATE INDEX IF NOT EXISTS idx_listings_avg_rating ON listings(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX IF NOT EXISTS idx_listings_review_count ON listings(review_count DESC);

COMMENT ON COLUMN listings.average_rating IS 'Average user rating (0-5)';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709165804','add_ratings_to_listings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709165804_add_ratings_to_listings.sql

-- RECOVERY BEGIN 20260709165847_expose_ratings_on_public_listings_view.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709165847.
--
-- Rewriting this file cannot affect production: 20260709165847 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  NULL::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  NULL::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else NULL::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709165847','expose_ratings_on_public_listings_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709165847_expose_ratings_on_public_listings_view.sql

-- RECOVERY BEGIN 20260709170348_country_education_overlay.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the production-ledger body for
-- version 20260709170348, with one replay-safety guard immediately before the
-- duplicated policy creation. Production also records 20260707120000 with the
-- same table and policy body, and no intervening recorded migration drops that
-- policy. Dropping the exact policy IF EXISTS before recreating it preserves the
-- same final schema while allowing both recorded versions to replay in order.
--
-- Production already records 20260709170348, so this is repository-only replay
-- fidelity and cannot be pushed as a new production migration.

-- Country/module-specific education overlay. Falls back to the existing
-- generic MODULE_TOPICS lookup in MobileCommandCentre.tsx whenever no
-- published row exists for a given country_iso2 + module_key. Reuses the
-- review-status vocabulary from lib/education/types.ts so this plugs into
-- the existing claim-review gate rather than inventing a parallel one.

create table if not exists country_education_overlay (
  id            uuid primary key default gen_random_uuid(),
  country_iso2  text not null,
  module_key    text not null,
  role_id       text,
  topics        jsonb not null,
  action_label  text not null,
  source_ids    uuid[] not null default '{}',
  review_status text not null default 'review_pending',
  reviewer      text,
  last_verified_at timestamptz,
  updated_at    timestamptz not null default now(),
  constraint country_education_overlay_review_status_check
    check (review_status in (
      'verified_primary_source','verified_professional_body','verified_peer_reviewed',
      'verified_secondary_source','conflicting_sources','stale_source','jurisdiction_unclear',
      'clinical_review_required','legal_review_required','review_pending','do_not_publish'
    )),
  unique (country_iso2, module_key, role_id)
);

alter table country_education_overlay enable row level security;

drop policy if exists "public read published country overlays" on country_education_overlay;

create policy "public read published country overlays"
  on country_education_overlay for select
  using (review_status in ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source'));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709170348','country_education_overlay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709170348_country_education_overlay.sql

-- RECOVERY BEGIN 20260709200035_create_content_coverage_queue_view.sql
-- Coordination view for cross-session content research work (jurisdiction
-- playbooks, market metrics, education overlays). Ranks countries by how
-- many of the three content types are missing, then by opportunity score,
-- so any research batch (regardless of which session runs it) can just
-- query this first and pick up the next highest-value gap instead of
-- guessing or duplicating another session's work.
--
-- Not exposed via PostgREST (public schema only) -- internal tooling, not
-- consumed by the live app.

CREATE OR REPLACE VIEW public.content_coverage_queue AS
SELECT
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.opportunity_score,
  c.data_completeness,
  EXISTS (
    SELECT 1 FROM public.jurisdiction_playbooks jp
    WHERE jp.country_iso2 = c.iso_alpha2 AND jp.status = 'published'
  ) AS has_playbook,
  EXISTS (
    SELECT 1 FROM public.market_metrics mm
    WHERE mm.country_iso2 = c.iso_alpha2
  ) AS has_market_metrics,
  EXISTS (
    SELECT 1 FROM public.country_education_overlay ceo
    WHERE ceo.country_iso2 = c.iso_alpha2
  ) AS has_education_overlay,
  (
    (NOT EXISTS (SELECT 1 FROM public.jurisdiction_playbooks jp WHERE jp.country_iso2 = c.iso_alpha2 AND jp.status = 'published'))::int +
    (NOT EXISTS (SELECT 1 FROM public.market_metrics mm WHERE mm.country_iso2 = c.iso_alpha2))::int +
    (NOT EXISTS (SELECT 1 FROM public.country_education_overlay ceo WHERE ceo.country_iso2 = c.iso_alpha2))::int
  ) AS gap_count
FROM public.countries c
ORDER BY gap_count DESC, c.opportunity_score DESC NULLS LAST;

COMMENT ON VIEW public.content_coverage_queue IS
  'Coordination view for cross-session content research. Query this first before starting a research batch so concurrent sessions do not duplicate work. Not exposed via PostgREST -- internal tooling only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709200035','create_content_coverage_queue_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709200035_create_content_coverage_queue_view.sql

-- RECOVERY BEGIN 20260709211746_extend_platform_health_editorial_pipeline.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709211746.
--
-- Rewriting this file cannot affect production: 20260709211746 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


CREATE OR REPLACE FUNCTION public.get_platform_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_recent_attempts int := 0;
  v_recent_failures int := 0;
  v_editorial_recent_attempts int := 0;
  v_editorial_recent_failures int := 0;
begin
  select count(*),
         count(*) filter (where r.status_code <> 200 and (
           r.content::text ilike '%credit balance is too low%'
           or r.content::text ilike '%insufficient_quota%'
           or r.content::text ilike '%exceeded your current quota%'
         ))
    into v_recent_attempts, v_recent_failures
  from (select request_id from _sig_extract_jobs order by created_at desc limit 20) recent
  join net._http_response r on r.id = recent.request_id;

  -- Editorial digest pipeline shares the same Anthropic key and can fail
  -- independently of the trade-signal side (e.g. billing exhausted while
  -- run_daily_digest happens to have nothing new to fire on, or vice versa).
  -- _sig_extract_jobs above only covers the trade-signal side, so without
  -- this the editorial pipeline could be silently dead with no ops signal.
  select count(*),
         count(*) filter (where r.status_code <> 200 and (
           r.content::text ilike '%credit balance is too low%'
           or r.content::text ilike '%insufficient_quota%'
           or r.content::text ilike '%exceeded your current quota%'
         ))
    into v_editorial_recent_attempts, v_editorial_recent_failures
  from (select request_id from _editorial_digest_jobs order by created_at desc limit 20) recent
  join net._http_response r on r.id = recent.request_id;

  RETURN jsonb_build_object(
    'checked_at',                     NOW(),
    'listings_approved',              (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND public_visibility = true),
    'signals_total',                  (SELECT COUNT(*) FROM signals),
    'signals_reviewed',               (SELECT COUNT(*) FROM signals WHERE reviewed = true),
    'ia_signals_qualified',           (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified'),
    'source_registry_active',         (SELECT COUNT(*) FROM source_registry WHERE is_active = true AND crawl_allowed = true),
    'source_snapshots_pending',       (SELECT COUNT(*) FROM source_snapshots WHERE processing_status = 'pending'),
    'marketplace_candidates_pending', (SELECT COUNT(*) FROM marketplace_candidates WHERE status = 'needs_review'),
    'hv_public_feed_items',           (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published'),
    'countries_covered',              (SELECT COUNT(*) FROM countries),
    'jurisdiction_briefings_pub',     (SELECT COUNT(*) FROM jurisdiction_briefings WHERE status = 'published'),
    'opportunities_active',           (SELECT COUNT(*) FROM opportunities WHERE stage NOT IN ('closed', 'archived')),
    'processing_jobs_stuck',          (SELECT COUNT(*) FROM hv_processing_jobs WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour'),
    'extraction_llm_degraded',        (v_recent_attempts > 0 AND v_recent_failures::numeric / v_recent_attempts >= 0.5),
    'extraction_recent_attempts',     v_recent_attempts,
    'extraction_recent_failures',     v_recent_failures,
    'editorial_items_qualified',      (SELECT COUNT(*) FROM editorial_items WHERE stage = 'qualified'),
    'editorial_items_unused',         (SELECT COUNT(*) FROM editorial_items WHERE stage = 'qualified' AND used_in_digest_at IS NULL),
    'editorial_digest_llm_degraded',  (v_editorial_recent_attempts > 0 AND v_editorial_recent_failures::numeric / v_editorial_recent_attempts >= 0.5),
    'editorial_recent_attempts',      v_editorial_recent_attempts,
    'editorial_recent_failures',      v_editorial_recent_failures
  );
END;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709211746','extend_platform_health_editorial_pipeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709211746_extend_platform_health_editorial_pipeline.sql

-- RECOVERY BEGIN 20260709212150_replace_google_news_with_direct_feeds.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709212150.
--
-- Rewriting this file cannot affect production: 20260709212150 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- Google News RSS article links (news.google.com/rss/articles/...) reliably
-- 403 on server-side fetch (confirmed by Codex's source-engine-fetch patch),
-- so every mainstream_media source using Google News RSS would only ever
-- capture a thin stub, never full article text. Replacing with direct
-- outlet RSS feeds. Reuters and AP discontinued public RSS years ago, so
-- the global-wire tier drops to 5 verified-working feeds instead of 8.
-- Country-level tier moves from Google News search-RSS to Guardian's
-- per-country tagged feeds (world/{country}/rss) — genuine mainstream
-- international press, not industry press, and not a Google redirect.
-- These feeds are topical (not cannabis-filtered), relying on the existing
-- keyword regex pre-filter in hv_extract_signals_from_captured_text() /
-- the editorial extraction step to find cannabis-relevant items within them.

-- Global wire tier: drop dead Reuters/AP, replace with verified feeds
DELETE FROM source_registry WHERE source_name IN ('Reuters – Cannabis', 'Associated Press – Cannabis', 'Bloomberg – Cannabis');

UPDATE source_registry SET source_url = 'https://feeds.bbci.co.uk/news/world/rss.xml', adapter = 'rss', notes = 'Direct BBC World RSS feed (verified). Cannabis relevance determined by keyword pre-filter, not feed-level search.' WHERE source_name = 'BBC News – Cannabis';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/rss', adapter = 'rss', notes = 'Direct Guardian World RSS feed (verified, actively monitored).' WHERE source_name = 'The Guardian – Cannabis';
UPDATE source_registry SET source_url = 'https://www.aljazeera.com/xml/rss/all.xml', adapter = 'rss', notes = 'Direct Al Jazeera RSS feed (verified live).' WHERE source_name = 'Al Jazeera – Cannabis';
UPDATE source_registry SET source_url = 'https://rss.dw.com/rdf/rss-en-top', adapter = 'rss', notes = 'Direct DW top-stories RSS feed (verified).' WHERE source_name = 'Deutsche Welle – Cannabis';

INSERT INTO source_registry (source_name, source_url, country, region, jurisdiction, language, requires_translation, source_type, tier, adapter, crawl_cadence, publish_cadence, signal_keywords, is_active, crawl_allowed, notes)
VALUES ('France 24 – Cannabis', 'https://www.france24.com/en/rss', 'Global', 'Global', 'Global', 'en', false, 'mainstream_media', 1, 'rss', 'daily', 'continuous', ARRAY['cannabis','marijuana'], true, true, 'Direct France 24 English RSS feed (verified).');

-- Country-level tier: replace Google News RSS with Guardian per-country feeds
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/usa/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – USA';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/canada/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Canada';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/brazil/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Brazil';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/mexico/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Mexico';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/argentina/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Argentina';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/colombia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Colombia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/chile/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Chile';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/uruguay/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Uruguay';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/peru/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Peru';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/jamaica/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Jamaica';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/uk/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – UK';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/germany/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Germany';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/france/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – France';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/netherlands/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Netherlands';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/spain/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Spain';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/italy/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Italy';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/switzerland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Switzerland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/portugal/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Portugal';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/poland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Poland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/czech-republic/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Czech Republic';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/greece/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Greece';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/malta/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Malta';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/luxembourg/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Luxembourg';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ireland/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ireland';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/sweden/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Sweden';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/denmark/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Denmark';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/norway/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Norway';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ukraine/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ukraine';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/romania/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Romania';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/south-africa/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – South Africa';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/nigeria/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Nigeria';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/morocco/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Morocco';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/egypt/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Egypt';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/kenya/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Kenya';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/ghana/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Ghana';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/zimbabwe/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Zimbabwe';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/lesotho/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Lesotho';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/zambia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Zambia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/rwanda/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Rwanda';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/thailand/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Thailand';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/israel/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Israel';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/india/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – India';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/japan/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Japan';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/south-korea/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – South Korea';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/philippines/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Philippines';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/indonesia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Indonesia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/pakistan/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Pakistan';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/united-arab-emirates/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – UAE';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/saudi-arabia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Saudi Arabia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/turkey/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Turkey';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/sri-lanka/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Sri Lanka';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/vietnam/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Vietnam';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/malaysia/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Malaysia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/australia-news/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Australia';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/newzealand/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – New Zealand';
UPDATE source_registry SET source_url = 'https://www.theguardian.com/world/fiji/rss', adapter = 'rss' WHERE source_name = 'Mainstream Media – Fiji';

SELECT count(*) FILTER (WHERE adapter = 'rss') as now_direct_rss, count(*) FILTER (WHERE adapter = 'google_news_rss') as still_google_news, count(*) as total
FROM source_registry WHERE source_type = 'mainstream_media';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709212150','replace_google_news_with_direct_feeds','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709212150_replace_google_news_with_direct_feeds.sql

-- RECOVERY BEGIN 20260709215147_batch_10_playbooks_metrics_ua_gh_pk_si_v2.sql
-- Batch 10: jurisdiction_playbooks for UA, GH, PK, SI
-- market_metrics for UA, PK, SI (GH omitted -- no sourced quantitative figure found)
-- country_education_overlay: DEFERRED -- see chat response for rationale

WITH src_ua AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('CMS Expert Guides -- Cannabis Law and Legislation in Ukraine',
          'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine',
          'legal_analysis', 2, 'Ukraine', 'UA', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_gh AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('Ghana Ministry of the Interior -- Cannabis Regulatory Programme Launch',
          'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/',
          'government_official', 1, 'Ghana', 'GH', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_pk AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('LegalClarity -- Is Weed Legal in Pakistan? A Look at Current Laws',
          'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/',
          'legal_analysis', 2, 'Pakistan', 'PK', 'html_snapshot', 'active', true, true)
  RETURNING id
),
src_si AS (
  INSERT INTO source_registry (source_name, source_url, source_type, tier, country, iso, adapter, relevance_status, crawl_allowed, is_active)
  VALUES ('CMS Expert Guides -- Cannabis Law and Legislation in Slovenia',
          'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/slovenia',
          'legal_analysis', 2, 'Slovenia', 'SI', 'html_snapshot', 'active', true, true)
  RETURNING id
),
pb AS (
  INSERT INTO jurisdiction_playbooks
    (country_iso2, country_name, difficulty, typical_timeline_months, estimated_cost_range,
     legal_framework_summary, steps, key_regulators, common_pitfalls, status, confidence_label, source_id, last_reviewed)
  VALUES
  ('UA', 'Ukraine', 'high', 18,
   'No standardized public fee schedule identified; costs are dominated by mandatory facility security (24-hour police-accessible video surveillance), GACP compliance, and annual quota allocation rather than a fixed licence fee',
   'Ukraine legalized medical, industrial, and research cannabis under Law No. 3528-IX, signed February 15 2024 and effective August 16 2024, which removed cannabis resin, extracts, and tinctures from the list of dangerous substances. All activity (cultivation, processing, compounding, import/export) requires a narcotics-handling licence plus an annual government quota; until 2028 the import quota for cannabis plants/substances is zero except for scientific and specific medicinal uses, and domestic cultivation licensing conditions were still being finalized through 2025-2026, so the market currently runs on imported finished product. The Ministry of Health published a list of roughly 20 qualifying conditions (multiple sclerosis, neuropathy, chemotherapy complications, PTSD-adjacent indications, childhood epilepsy, among others) in September 2024, and the first legal prescriptions were dispensed on June 11 2026 in Vinnytsia -- nearly two years after the law took effect -- to a multiple sclerosis patient and a war-injury amputee, via electronic prescription only. For 2026, the Cabinet of Ministers approved the first-ever production/storage quota for THC-based medical cannabis substances (592,068 grams storage), a Resolution No. 1772 milestone. Only three products (all Curaleaf full-spectrum oils) were on the State Register as of January 2025. Every plant, batch, and package must carry a unique electronic identifier, and national police must have free facility access. Recreational cultivation/possession/sale remains criminal; administrative liability attaches to cultivation of up to 10 plants without intent to sell, and possession without intent to sell is decriminalized only up to 5 grams. Industrial hemp cultivation was also substantially eased under the same law but remains quota- and licence-gated, with reclassification of industrial hemp into medical cannabis prohibited.',
   '[{"step":"Confirm licensing prerequisite","detail":"Any medical-cannabis-related activity (cultivation, processing, compounding, import/export, R&D) requires a narcotics-handling licence before any quota application can be filed"},{"step":"Apply for annual quota allocation","detail":"Quotas are set annually by the Cabinet of Ministers based on Ministry of Health proposals; the import quota for cannabis plants/substances is zero until 2028 except for defined scientific/medicinal exceptions, so new entrants should plan around import-only supply in the near term"},{"step":"Meet facility and traceability requirements","detail":"Cultivation facilities must operate in closed-soil conditions with round-the-clock, police-accessible video surveillance; every plant, batch, and package requires a unique electronic identifier logged same-day in the national traceability system"},{"step":"Register products before dispensing","detail":"Finished products must be registered in the State Register of Medicinal Products (only 3 products registered as of Jan 2025, all Curaleaf); pharmacy-compounded (magistral) product is a separate authorised pathway using registered APIs"},{"step":"Monitor domestic cultivation timeline","detail":"Domestic production is not expected before 2028 per industry sources; near-term commercial entry is realistically import/distribution-focused, not cultivation-focused"}]'::jsonb,
   '["Ministry of Health of Ukraine -- programme policy and qualifying-conditions list","State Service of Ukraine on Medicines and Drugs Control -- licensing and quota enforcement","Ministry of Agrarian Policy -- cultivation-side coordination","National Police -- mandatory facility access and security compliance"]'::jsonb,
   ARRAY[
     'Assuming legalization in 2024 means an open market today -- it took until June 2026 for the first patient prescriptions to be dispensed, and domestic cultivation is not expected before 2028',
     'Treating this as a cultivation opportunity in the near term -- the zero import-quota exception structure and absence of finalized domestic cultivation licensing conditions mean the realistic near-term entry point is import/distribution of registered finished product, not growing',
     'Ignoring the traceability and security capital requirements (24-hour police-accessible surveillance, per-plant electronic identifiers) when estimating cost -- these are mandatory, not optional, and are not captured in any published flat fee'
   ],
   'published',
   'high -- corroborated across CMS Expert Guides, Ukraine''s Ministry of Health official releases (moz.gov.ua), multiple June 2026 industry-press reports on the first dispensed prescriptions, and the January 2026 CMS coverage of the 2026 THC quota resolution; timeline-to-first-patient (June 2026) is a hard confirmed data point, not an estimate',
   (SELECT id FROM src_ua), CURRENT_DATE),

  ('GH', 'Ghana', 'moderate', 9,
   'No standardized public fee schedule identified for NACOC''s 11 licence categories in available sources; budget for licensing, compliance, and security infrastructure typical of a regulated agricultural/pharmaceutical hybrid programme',
   'Ghana operates a licensed, low-THC-only cannabis framework -- not recreational legalization. The legal foundation is the Narcotics Control Commission (Amendment) Act, 2023 (Act 1100) and the Narcotics Control Commission (Cultivation and Management of Cannabis) Regulations, 2023 (L.I. 2475), which followed a 2023 parliamentary amendment after an earlier version of the law was struck down by Ghana''s Supreme Court for lacking full parliamentary debate. The Cannabis Regulatory Programme was formally launched by the Minister for the Interior in February 2026 in Accra, opening licensing for cultivation, processing, distribution, and export of cannabis varieties containing no more than 0.3% THC on a dry-weight basis, for medicinal and industrial purposes only. NACOC (Narcotics Control Commission) administers 11 licence categories; applicants must generally be 18+ and Ghanaian citizens or permanent residents (corporate applicants have equivalent local-ownership requirements), though by April 2026 the Ghana Investment Promotion Centre was actively courting diaspora Ghanaians to invest given the licence-holder citizenship/residency requirement. Recreational cannabis remains fully illegal; officials and NACOC have been explicit and repeated in messaging that this is not adult-use legalization. Simple possession for personal use was changed from a prison sentence to a fine under the underlying 2023 reform, but cultivation, sale, and distribution outside the licensed low-THC framework remain criminal.',
   '[{"step":"Confirm eligibility","detail":"Licence applicants must generally be 18+ and Ghanaian citizens or permanent residents (or meet equivalent corporate ownership tests); diaspora Ghanaians are an explicit target investor group per Ghana Investment Promotion Centre outreach"},{"step":"Select the correct licence category","detail":"NACOC lists 11 distinct licence categories spanning cultivation, processing, distribution, and export -- confirm which category matches the intended activity before applying"},{"step":"Verify THC compliance capability","detail":"All licensed cultivation must stay at or below 0.3% THC dry-weight; this is a hard regulatory ceiling enforced under L.I. 2475"},{"step":"Apply through NACOC","detail":"Licensing is administered by the Narcotics Control Commission under Act 1100 and L.I. 2475; the programme formally opened for applications in February 2026"}]'::jsonb,
   '["Narcotics Control Commission (NACOC) -- primary licensing and compliance authority","Ministry of the Interior -- programme policy owner and public-facing launch authority"]'::jsonb,
   ARRAY[
     'Confusing this with recreational/adult-use legalization -- NACOC and the Ministry of the Interior have repeatedly and explicitly stated this is not a recreational programme',
     'Assuming CBD, hemp-labelled, or wellness products can be freely imported or carried -- Ghana''s framework is licensing-based for domestic cultivation/processing, and travelers/importers should get explicit confirmation before assuming any hemp-derived product is exempt at the border',
     'Treating the February 2026 launch as proof of a mature, liquid market -- this is a newly opened licensing window; operational track record and approval-timeline data are not yet established'
   ],
   'published',
   'medium-high -- the legal framework (Act 1100, L.I. 2475) and February 2026 launch are consistently confirmed across the Ministry of the Interior''s own release, NACOC''s official site, and multiple trade-press sources; specific fee schedules and real-world approval timelines were not found and should be confirmed directly with NACOC before any commercial commitment',
   (SELECT id FROM src_gh), CURRENT_DATE),

  ('PK', 'Pakistan', 'very_high', 24,
   'No standardized public fee schedule identified; sources conflict on whether a functioning licensing authority is even operational (see confidence note), which is itself a material cost/timeline risk for market-entry planning',
   'Pakistan''s cannabis framework is a legal patchwork with materially conflicting reporting on its current operational status. The Control of Narcotic Substances Act 1997 makes cultivation, possession, sale, and distribution of cannabis illegal, punishable by up to 7 years imprisonment and fines; a September 1 2020 federal Cabinet decision approved industrial hemp cultivation and cannabis extracts for industrial and medical use under permit, with a 0.3% THC dry-weight ceiling. Some sources (LegalClarity, cannabisregulations.ai) report that a Cannabis Control and Regulatory Authority (CCRA) was established in February 2024 under a Cannabis Control and Regulatory Authority Act 2024, issuing 5-year licences with regular inspections, and that DRAP (Drug Regulatory Authority of Pakistan) separately governs any cannabis-derived product carrying therapeutic claims. Other sources (Cannigma) state industrial hemp cultivation remains illegal in practice because no implementing regulatory framework was ever finalized, and a 2021-approved Rs. 1.95 billion government development-fund allocation for medical cannabis/hemp infrastructure (greenhouses, an analytical lab, a central oversight authority) reflects planning rather than an operating industry. This is a genuine, unresolved source conflict, not a reporting error on either side -- it likely reflects a regulatory body that exists on paper with limited real-world licensing throughput. Recreational and medical cannabis for personal use remain illegal regardless of which account is accurate; CBD products are explicitly treated as illegal outside the DRAP-registered pharmaceutical channel.',
   '[{"step":"Resolve the CCRA operational-status question directly with counsel","detail":"Before any capital commitment, confirm directly with Pakistani legal counsel and DRAP/CCRA whether the Cannabis Control and Regulatory Authority is actively issuing licences -- public secondary sources conflict on this point as of this review"},{"step":"If operational, apply through CCRA","detail":"Per sources reporting an active authority, CCRA licences cover cultivation, extraction, refining, manufacturing, and sale of cannabis derivatives for medical/industrial use, issued for 5-year terms with a 0.3% THC dry-weight ceiling"},{"step":"Route any therapeutic-claim product through DRAP","detail":"Cannabis-derived products marketed with medical/therapeutic claims require DRAP Act 2012 registration regardless of CCRA cultivation licensing status"},{"step":"Do not assume personal-use or import allowances","detail":"No published personal-import exemption exists for CBD or cannabis products; Pakistan Customs and the Anti-Narcotics Force treat undocumented cannabinoid shipments as controlled-substance matters"}]'::jsonb,
   '["Cannabis Control and Regulatory Authority (CCRA) -- cultivation/processing/manufacturing licensing per some sources; operational status disputed","Drug Regulatory Authority of Pakistan (DRAP) -- pharmaceutical/therapeutic-claim product registration","Ministry of National Health Services, Regulations and Coordination -- DRAP''s parent ministry","Anti-Narcotics Force (ANF) and Pakistan Customs -- import/border enforcement"]'::jsonb,
   ARRAY[
     'Treating any single source as authoritative on whether Pakistan''s licensing authority is functionally operational -- 2025-2026 sources directly conflict on this, and this entry should be re-verified with local counsel before use in a GO decision',
     'Assuming the 2020 Cabinet decision or a 2024 CCRA Act translates into an accessible commercial pathway today -- multiple sources describe multi-year regulatory delays and an unfinished implementing framework as of the most recent available reporting',
     'Assuming CBD or hemp-labelled products are personal-use-exempt for import -- no such exemption is published; DRAP registration is required for any therapeutic claim'
   ],
   'published',
   'low-medium -- this entry is a conflicting-sources case: reputable secondary sources materially disagree on whether Pakistan''s cannabis regulatory authority is operationally issuing licences; treat all market-entry conclusions here as provisional pending direct confirmation with Pakistani counsel',
   (SELECT id FROM src_pk), CURRENT_DATE),

  ('SI', 'Slovenia', 'moderate', 12,
   'No standardized public fee schedule identified for the new open licensing system; Slovenia''s model is explicitly designed so any commercial operator meeting JAZMP/Ministry of Health criteria can obtain a licence, but published per-licence cost figures were not found',
   'Slovenia first legalized medical cannabis in a limited form in March 2017 by reclassifying cannabinoids from Schedule I to Schedule II, but in practice access via magistral prescription/import exemption through JAZMP (the Public Agency of the Republic of Slovenia for Medicinal Products and Medical Devices) was rarely used. On July 15 2025, Slovenia''s National Assembly passed a substantially more progressive Medical Cannabis Measure (50-29, with 2 abstentions), described by industry commentary as one of the most progressive medical cannabis frameworks in Europe on both commercial-operator and patient-access dimensions; it introduces an open licensing system in which any commercial operator meeting JAZMP/Ministry of Health criteria can obtain a licence, removes cannabis (plant, resin, extracts) and THC from the prohibited-substances list within a regulated medical/scientific framework, and allows prescription via ordinary MD/DMD/veterinary scripts rather than special narcotic prescription protocols, with patients issued a "cannabis card" at the pharmacy. Slovenia''s medical cannabis market was projected (per a mid-2025 industry estimate) to grow roughly 4% annually and exceed EUR 55 million by 2029. Separately, recreational personal possession remains decriminalized rather than legal: it is a misdemeanor (not a criminal offence) carrying a fine, with sources giving somewhat different fine ranges (EUR 36-179 per Wikipedia''s citation of the underlying statute; up to approximately EUR 200 per a secondary consumer-facing source) -- treat the statutory EUR 36-179 range as more authoritative pending direct verification. Industrial hemp is separately permitted for food/industrial use, but sources disagree on the THC ceiling: CMS Expert Guides cites 0.2%, while a Slovenian pharmaceutical-compliance source (Farmakem) cites 0.3% -- this discrepancy is unresolved in available sources and should be confirmed against the current Regulation on the Classification of Illicit Drugs before relying on either figure.',
   '[{"step":"Confirm licensing criteria with JAZMP","detail":"The July 2025 Medical Cannabis Measure created an open licensing system administered with JAZMP and Ministry of Health oversight; any commercial operator meeting the published criteria can apply -- confirm current criteria directly, as implementing detail was still developing at time of review"},{"step":"Distinguish medical from industrial-hemp pathways","detail":"Medical cannabis (flower, extracts, magistral preparations) is licensed under the 2025 Measure; industrial hemp (Cannabis sativa L., low-THC) is a separate Ministry of Agriculture, Forestry and Food permit track for food/industrial use -- do not conflate the two application pathways"},{"step":"Plan for pharmacy-based distribution","detail":"Patient access runs through pharmacies via ordinary medical/veterinary prescription (no special narcotic protocol required post-reform), with a patient cannabis card issued at dispensing"},{"step":"Verify the current industrial-hemp THC ceiling before cultivation planning","detail":"Available sources conflict (0.2% vs 0.3% dry-weight) -- confirm against the current Regulation on the Classification of Illicit Drugs (Official Gazette RS No. 45/14, 14/17, 64/19) before finalizing any cultivation compliance plan"}]'::jsonb,
   '["JAZMP (Javna agencija Republike Slovenije za zdravila in medicinske pripomocke) -- medical cannabis licensing and pharmaceutical oversight","Ministry of Health -- medical cannabis policy and prescription framework","Ministry of Agriculture, Forestry and Food -- industrial hemp cultivation permits"]'::jsonb,
   ARRAY[
     'Treating Slovenia as a full adult-use/recreational market -- recreational cannabis remains illegal, only decriminalized to a misdemeanor fine for personal possession; the 2025 reform is specifically a medical-cannabis and open-licensing-for-commercial-operators measure',
     'Citing a single industrial-hemp THC ceiling as settled -- available sources give both 0.2% and 0.3% dry-weight figures; confirm against the current regulation text before any cultivation compliance decision',
     'Assuming the EUR 55M-by-2029 market-size figure is a verified market-research forecast -- it traces to a single industry-press estimate published around the law''s passage, not an independently published market-research methodology'
   ],
   'published',
   'medium-high -- the 2025 Medical Cannabis Measure passage, its open-licensing structure, and the decriminalization status are corroborated across Wikipedia, CMS Expert Guides, Prohibition Partners, and multiple 2025-2026 industry-press reports; two specific numeric details (industrial hemp THC ceiling, decriminalization fine range) show unresolved source conflicts and are flagged rather than silently resolved',
   (SELECT id FROM src_si), CURRENT_DATE)
  ON CONFLICT (country_iso2) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    difficulty = EXCLUDED.difficulty,
    typical_timeline_months = EXCLUDED.typical_timeline_months,
    estimated_cost_range = EXCLUDED.estimated_cost_range,
    legal_framework_summary = EXCLUDED.legal_framework_summary,
    steps = EXCLUDED.steps,
    key_regulators = EXCLUDED.key_regulators,
    common_pitfalls = EXCLUDED.common_pitfalls,
    status = EXCLUDED.status,
    confidence_label = EXCLUDED.confidence_label,
    source_id = EXCLUDED.source_id,
    last_reviewed = EXCLUDED.last_reviewed,
    updated_at = now()
  RETURNING country_iso2
),
mm AS (
  INSERT INTO market_metrics
    (country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes)
  VALUES
  ('UA', 'estimated_eligible_patient_population', 6000000, 'people', '2026-01-01', '2026-12-31', 'point_in_time', 'estimated', 'medium',
   'Ukraine Ministry of Health (via Prohibition Partners European Medical Cannabis Legislation Map)',
   'https://prohibitionpartners.com/european-cannabis-markets/european-medical-cannabis-legislation-map/ukraine/', '2026-02-27',
   'Ministry of Health estimate of patients who could benefit from medical cannabis given war-related PTSD, chronic pain, and palliative-care needs; not a count of enrolled/prescribed patients -- only 3 patients had received legal prescriptions as of the June 2026 first-dispensing milestone'),
  ('UA', 'annual_thc_production_storage_quota_2026', 592068, 'grams', '2026-01-01', '2026-12-31', 'annual', 'observed', 'high',
   'CMS Law Now -- Ukraine Approves 2026 Quotas for Controlled Substances',
   'https://cms-lawnow.com/en/ealerts/2026/01/ukraine-approves-2026-quotas-for-controlled-substances-including-medical-cannabis-thc', '2026-01-14',
   'First-ever government-set storage quota for THC-based medical cannabis substances under Cabinet of Ministers Resolution No. 1772; covers storage only, not a production or sales volume figure'),
  ('PK', 'government_capital_allocation_medical_hemp_infrastructure', 1950000000, 'PKR', '2021-12-01', '2021-12-31', 'point_in_time', 'observed', 'medium',
   'InternationalCBC (via Propakistani reporting) -- Pakistan Is Allocating Funds For Medical Cannabis And Hemp Production',
   'https://internationalcbc.com/pakistan-is-allocating-funds-for-medical-cannabis-and-hemp-production/', '2025-06-11',
   'Departmental Development Working Party approval (Dec 2021) for greenhouses, a national analytical lab, and a central regulatory authority; this is a capital-planning allocation, not evidence of an operating commercial market, and predates the disputed 2024 CCRA establishment referenced in the jurisdiction playbook'),
  ('SI', 'projected_medical_cannabis_market_value_2029', 55000000, 'EUR', '2025-01-01', '2029-12-31', 'annual', 'forecast', 'low',
   'International Cannabis Business Conference (via internationalcbc.com) -- Slovenia''s National Assembly Approves Historic Medical Cannabis Measure',
   'https://internationalcbc.com/slovenias-national-assembly-approves-historic-medical-cannabis-measure/', '2025-07-15',
   'Single industry-press forecast figure published at the time of the law''s passage; no independently verifiable market-research methodology was found, so treat as directional rather than authoritative'),
  ('SI', 'projected_medical_cannabis_market_cagr', 4, 'percent', '2025-01-01', '2029-12-31', 'annual', 'forecast', 'low',
   'International Cannabis Business Conference (via internationalcbc.com) -- Slovenia''s National Assembly Approves Historic Medical Cannabis Measure',
   'https://internationalcbc.com/slovenias-national-assembly-approves-historic-medical-cannabis-measure/', '2025-07-15',
   'Same single-source forecast as projected_medical_cannabis_market_value_2029; provided together, not independently corroborated')
  RETURNING country_iso2
)
SELECT (SELECT count(*) FROM pb) AS playbooks_inserted, (SELECT count(*) FROM mm) AS metrics_inserted;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709215147','batch_10_playbooks_metrics_ua_gh_pk_si_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709215147_batch_10_playbooks_metrics_ua_gh_pk_si_v2.sql

-- RECOVERY BEGIN 20260709215701_grant_select_confirmed_live_tables_missing_read_access.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260709215701.
--
-- Rewriting this file cannot affect production: 20260709215701 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- All 7 tables confirmed via real application code (not just migration history)
-- to be actively queried, with RLS SELECT policies already in place for these
-- roles, but the base-table GRANT was never applied — same missing-grant root
-- cause as the earlier form-submission fixes, this time on the read side.

GRANT SELECT ON public.cannabis_operators TO anon;
GRANT SELECT ON public.cc_pathway_step_requirements TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_steps TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_templates TO anon;
GRANT SELECT ON public.clinical_education_country_readiness TO anon, authenticated;
GRANT SELECT ON public.clinical_education_modules TO anon, authenticated;
GRANT SELECT ON public.regulatory_calendar TO anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260709215701','grant_select_confirmed_live_tables_missing_read_access','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260709215701_grant_select_confirmed_live_tables_missing_read_access.sql

-- RECOVERY BEGIN 20260710022721_expose_editorial_items_api_schema.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710022721.
--
-- Rewriting this file cannot affect production: 20260710022721 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- editorial_items was created directly in the public schema and never
-- exposed to PostgREST's api schema — the only schema hv-extract's Supabase
-- client can actually see (db: { schema: "api" }). Every insert attempt
-- from the edge function has been failing with "relation does not exist"
-- since the table was created. This follows the exact same pattern as the
-- existing api.hv_import_staging view.
CREATE VIEW api.editorial_items AS
SELECT id, source_id, snapshot_id, headline, summary, why_it_matters,
       outlet_name, source_url, country, region, language, tone,
       published_at, used_in_digest_at, stage, created_at, updated_at
FROM public.editorial_items;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.editorial_items TO service_role;
GRANT SELECT ON api.editorial_items TO authenticated;
GRANT SELECT ON api.editorial_items TO anon;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710022721','expose_editorial_items_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710022721_expose_editorial_items_api_schema.sql

-- RECOVERY BEGIN 20260710081115_insert_test_snapshot_for_live_test.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- The production ledger statement for version 20260710081115 omitted the legacy
-- snapshot_hash column because production no longer depended on that earlier
-- used/surplus snapshot contract. Repository zero-state replay still carries
-- snapshot_hash NOT NULL from 20260303000000, so the deterministic value below
-- is a replay-only compatibility field.
--
-- The applied statement also referenced source UUID
-- 431f3158-b037-471c-8ae7-af55efc8ea35. Fresh read-only production metadata
-- shows that source is no longer present, and the production migration ledger
-- contains no recorded creation for it; only transient July test snapshots
-- reference the UUID. Do not invent source metadata during replay. Preserve the
-- historical test insert only when its parent source exists.
--
-- Rewriting this file cannot affect production: 20260710081115 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a repository-only
-- repair of replay fidelity.

INSERT INTO source_snapshots (
  source_id,
  snapshot_hash,
  captured_url,
  captured_title,
  captured_text,
  fetch_status,
  language_detected,
  processing_status,
  signal_candidates
)
SELECT
  source.id,
  md5('20260710081115:https://www.theguardian.com/world/2026/jul/09/thailand-cannabis-crackdown-test-simulated'),
  'https://www.theguardian.com/world/2026/jul/09/thailand-cannabis-crackdown-test-simulated',
  'TEST: Thailand tightens cannabis farm inspections amid smuggling concerns',
  'Thailand''s Ministry of Public Health on Tuesday ordered provincial health offices to conduct stricter joint inspections of licensed cannabis cultivation sites alongside police, threatening immediate suspension or revocation of licences for violations. The move follows a string of seizures traced back to Thai-grown cannabis surfacing in the United Kingdom, Germany, Indonesia and Hong Kong in recent weeks, prompting renewed political pressure on the four-year-old decriminalisation framework. Prime Minister Anutin Charnvirakul warned that the entire system could face re-criminalisation if parliament does not move stalled control legislation forward. Growers and industry analysts have pointed to a straightforward economic driver: a domestic supply glut, caused by too many licensed cultivators chasing a shrinking and price-collapsed local market, has made bulk sales to illegal export buyers increasingly attractive relative to the legal retail channel the country originally built after its landmark 2022 reform.',
  'success',
  'en',
  'pending',
  NULL
FROM public.source_registry source
WHERE source.id = '431f3158-b037-471c-8ae7-af55efc8ea35'
RETURNING id;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710081115','insert_test_snapshot_for_live_test','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710081115_insert_test_snapshot_for_live_test.sql

-- RECOVERY BEGIN 20260710081247_cleanup_test_snapshot.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710081247.
--
-- Rewriting this file cannot affect production: 20260710081247 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


DELETE FROM source_snapshots WHERE id = 'dd09abd7-428c-4359-9fef-29422955b8a5';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710081247','cleanup_test_snapshot','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710081247_cleanup_test_snapshot.sql

-- RECOVERY BEGIN 20260710081657_add_needs_review_stage_editorial_items.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710081657.
--
-- Rewriting this file cannot affect production: 20260710081657 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


ALTER TABLE editorial_items DROP CONSTRAINT IF EXISTS editorial_items_stage_check;
ALTER TABLE editorial_items ADD CONSTRAINT editorial_items_stage_check
  CHECK (stage IN ('qualified','rejected','archived','needs_review'));

-- needs_review items are raw/unprocessed — not shown in the public digest
-- feed (public read policy already scopes to stage='qualified' only), but
-- need their own index for an eventual review queue.
CREATE INDEX IF NOT EXISTS idx_editorial_items_needs_review ON editorial_items (created_at DESC) WHERE stage = 'needs_review';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710081657','add_needs_review_stage_editorial_items','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710081657_add_needs_review_stage_editorial_items.sql

-- RECOVERY BEGIN 20260710084232_batch_10_hardening_overlay_controlref.sql
-- Batch 10 hardening + close-out follow-up:
-- 1) idempotency guards so a future CI replay of the batch_10 migration file cannot duplicate rows
-- 2) crawl_allowed=false on the 4 batch_10 source_registry rows (one-off citations, not crawl targets)
-- 3) country_education_overlay draft rows for UA/GH/PK/SI, review_status='review_pending'
--    (RLS on this table already restricts public SELECT to verified_* statuses, so review_pending
--    rows are NOT publicly visible -- safe to write without a consumer-shape confirmation)
-- 4) project_control_refs log entry, authority='proposal', flagging this batch for explicit
--    human sign-off per the Dual-AI Decision Protocol (this migration does not self-authorize that)

-- 1. Idempotency guards
ALTER TABLE market_metrics
  ADD CONSTRAINT market_metrics_country_metric_period_uniq
  UNIQUE (country_iso2, metric_name, period_start, period_end);

ALTER TABLE source_registry
  ADD CONSTRAINT source_registry_source_url_uniq
  UNIQUE (source_url);

-- 2. Stop treating one-off citation sources as crawl targets
UPDATE source_registry
SET crawl_allowed = false, updated_at = now()
WHERE source_url IN (
  'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/ukraine',
  'https://www.mint.gov.gh/ghana-begins-medicinal-and-industrial-cannabis-cultivation/',
  'https://legalclarity.org/is-weed-legal-in-pakistan-a-look-at-current-laws/',
  'https://cms.law/en/int/expert-guides/cms-expert-guide-to-a-legal-roadmap-to-cannabis/slovenia'
);

-- 3. Education overlay drafts (review_pending -> not publicly visible per existing RLS policy)
INSERT INTO country_education_overlay
  (country_iso2, module_key, role_id, topics, action_label, source_ids, review_status)
VALUES
  ('UA', 'patient-access-pathways', 'patient_general',
   '["Medical cannabis has been legal in Ukraine since August 2024, but the first patient prescriptions were not dispensed until June 2026","Access currently runs entirely on imported finished product via electronic prescription -- there is no domestic retail or dispensary market","About 20 qualifying conditions are approved, including multiple sclerosis, neuropathy, chemotherapy complications, and childhood epilepsy","Only 3 products (all Curaleaf oils) were on the State Register as of January 2025"]'::jsonb,
   'Read the Ukraine jurisdiction playbook for full licensing and import detail',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='UA')],
   'review_pending'),

  ('GH', 'licence-class-guide', 'cultivator_producer',
   '["Ghana operates a licensed, low-THC-only (0.3% dry-weight ceiling) cannabis programme for medicinal and industrial use -- not recreational legalization","NACOC administers 11 distinct licence categories; applicants must be 18+ Ghanaian citizens/permanent residents or meet equivalent corporate ownership tests","The programme formally opened for applications in February-March 2026 via a fully digital NACOC portal","Diaspora Ghanaians are an explicit target investor group, per Ghana Investment Promotion Centre outreach"]'::jsonb,
   'Read the Ghana jurisdiction playbook before selecting a licence category',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='GH')],
   'review_pending'),

  ('PK', 'prohibition-risk-map', 'general',
   '["Pakistan''s cannabis framework is a genuine, unresolved source conflict -- reputable sources disagree on whether a functioning licensing authority (CCRA) is currently operational","Recreational and personal medical use remain illegal regardless of which account is accurate","No published personal-import exemption exists for CBD or cannabis products","Do not treat any single source on Pakistan as settled -- confirm directly with local counsel before any commercial decision"]'::jsonb,
   'Read the Pakistan jurisdiction playbook -- flagged conflicting_sources, verify with counsel',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='PK')],
   'review_pending'),

  ('SI', 'market-access-strategy', 'investor_operator',
   '["Slovenia passed an open medical cannabis licensing system in July 2025 -- any commercial operator meeting JAZMP/Ministry of Health criteria can apply","Recreational cannabis remains illegal, only decriminalized to a misdemeanor fine for personal possession","Industrial hemp THC ceiling is disputed across sources (0.2% vs 0.3%) -- confirm the current regulation text before any cultivation compliance decision","A single industry-press estimate projects the medical cannabis market at over EUR 55M by 2029 -- treat as directional, not verified market research"]'::jsonb,
   'Read the Slovenia jurisdiction playbook for the open-licensing criteria',
   ARRAY[(SELECT source_id FROM jurisdiction_playbooks WHERE country_iso2='SI')],
   'review_pending');

-- 4. Log this batch for explicit human sign-off (Dual-AI Decision Protocol)
INSERT INTO project_control_refs
  (id, system, external_type, external_id, external_url, canonical_entity_type, canonical_entity_id,
   canonical_key, authority, write_mode, title, status, metadata, first_seen_at, last_seen_at)
VALUES
  (gen_random_uuid(), 'manual', 'content_batch', 'batch_10_ua_gh_pk_si',
   'https://github.com/harbourviewcompany-create/harbourview-platform/blob/main/supabase/migrations/20260710170000_batch_10_playbooks_metrics_ua_gh_pk_si.sql',
   'content_batch', 'batch_10',
   'content_batch:batch_10_ua_gh_pk_si', 'proposal', 'read_only',
   'Batch 10: jurisdiction_playbooks + market_metrics for UA/GH/PK/SI -- pushed live and to main by Claude scrutiny-agent session without a prior proposal-queue step',
   'pending_review',
   jsonb_build_object(
     'countries', jsonb_build_array('UA','GH','PK','SI'),
     'tables_written', jsonb_build_array('jurisdiction_playbooks','market_metrics','source_registry','country_education_overlay'),
     'note', 'Pakistan entry has an unresolved conflicting-sources flag; all four jurisdiction_playbooks rows were set status=published directly, bypassing the documented proposal-queue -> confirmed-decision flow. Needs explicit Tyler sign-off or rollback to draft.',
     'rollback_available', true
   ),
   now(), now());

SELECT 'hardening applied' AS result;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710084232','batch_10_hardening_overlay_controlref','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710084232_batch_10_hardening_overlay_controlref.sql

-- RECOVERY BEGIN 20260710093846_expose_command_centre_and_dashboard_tables_via_api_schema.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710093846.
--
-- Rewriting this file cannot affect production: 20260710093846 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.cc_org_pathway_progress as
select id, org_id, template_id, current_step, status, started_at, completed_at, last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;
grant select on api.cc_org_pathway_progress to anon, authenticated;

create view api.cc_org_requirement_status as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes, submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;
grant select on api.cc_org_requirement_status to anon, authenticated;

create view api.cc_pathway_step_requirements as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;
grant select on api.cc_pathway_step_requirements to anon, authenticated;

create view api.cc_pathway_steps as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;
grant select on api.cc_pathway_steps to anon, authenticated;

create view api.cc_watch_rules as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;
grant select on api.cc_watch_rules to anon, authenticated;

create view api.cc_watchlist_items as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction, confidence_pct, latest_change_at, latest_change_note, next_action, watch_status, snoozed_until, created_at, updated_at
from public.cc_watchlist_items;
grant select on api.cc_watchlist_items to anon, authenticated;

create view api.cc_watchlist_notifications as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read, is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;
grant select on api.cc_watchlist_notifications to anon, authenticated;

create view api.country_education_overlay as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids, review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;
grant select on api.country_education_overlay to anon, authenticated;

create view api.education_tracks as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;
grant select on api.education_tracks to anon, authenticated;

create view api.hv_evidence_documents as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes, mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date, is_public, created_at
from public.hv_evidence_documents;
grant select on api.hv_evidence_documents to anon, authenticated;

create view api.market_metrics as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end, period_granularity, data_type, confidence_band, source_name, source_url, source_date, notes, created_at, updated_at
from public.market_metrics;
grant select on api.market_metrics to anon, authenticated;

create view api.trade_flows as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status, permit_required, permit_authority, purpose, gmp_required, gacp_required, key_requirements, notes, source_name, source_url, last_verified, confidence, created_at, updated_at
from public.trade_flows;
grant select on api.trade_flows to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710093846','expose_command_centre_and_dashboard_tables_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710093846_expose_command_centre_and_dashboard_tables_via_api_schema.sql

-- RECOVERY BEGIN 20260710094107_expose_subscriptions_and_webhook_events_via_api_schema.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710094107.
--
-- Rewriting this file cannot affect production: 20260710094107 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.subscriptions as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;
grant select on api.subscriptions to anon, authenticated, service_role;

create view api.stripe_webhook_events as
select id, type, processed_at
from public.stripe_webhook_events;
grant select on api.stripe_webhook_events to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710094107','expose_subscriptions_and_webhook_events_via_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710094107_expose_subscriptions_and_webhook_events_via_api_schema.sql

-- RECOVERY BEGIN 20260710094129_restore_hv_public_profile_snapshots_foundation.sql
-- Replay-safe restoration of the production public profile snapshot table.
--
-- The live relation predates its first registered migration-ledger consumer
-- (20260710094130), but no registered migration owns its creation. Preserve
-- the later migrations' ownership of API exposure, security_invoker repair,
-- and explicit base-table SELECT grants.

create table if not exists public.hv_public_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.workspaces(id) on delete cascade,
  snapshot_data jsonb not null default '{}'::jsonb,
  snapshot_version integer not null default 1,
  generated_at timestamptz not null default now()
);

create index if not exists idx_hv_snapshots_org
  on public.hv_public_profile_snapshots (org_id);

alter table public.hv_public_profile_snapshots enable row level security;

-- Match the live production ACL surface. Only SELECT is authorized by RLS;
-- client-role writes remain denied because no INSERT/UPDATE/DELETE policy
-- exists. service_role retains the server-side snapshot refresh capability.
grant select, insert, update, delete
  on table public.hv_public_profile_snapshots
  to anon, authenticated;
grant all privileges
  on table public.hv_public_profile_snapshots
  to service_role;

do $restore_hv_public_profile_snapshots_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_public_profile_snapshots'::regclass
      and polname = 'hv_snapshots_public_read'
  ) then
    execute $policy$
      create policy hv_snapshots_public_read
        on public.hv_public_profile_snapshots
        as permissive
        for select
        to public
        using (true)
    $policy$;
  end if;
end
$restore_hv_public_profile_snapshots_policy$;

do $restore_hv_public_profile_snapshots_comment$
begin
  if obj_description(
    'public.hv_public_profile_snapshots'::regclass,
    'pg_class'
  ) is null then
    execute $comment$
      comment on table public.hv_public_profile_snapshots is
        'Public-safe pre-computed org snapshots. Updated by Edge Function on verification/passport events only.'
    $comment$;
  end if;
end
$restore_hv_public_profile_snapshots_comment$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710094129','restore_hv_public_profile_snapshots_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710094129_restore_hv_public_profile_snapshots_foundation.sql

-- RECOVERY BEGIN 20260710094130_expose_deal_room_messages_and_passport_snapshots_via_api.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710094130.
--
-- Rewriting this file cannot affect production: 20260710094130 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

create view api.deal_room_messages as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;
grant select on api.deal_room_messages to anon, authenticated, service_role;

create view api.hv_public_profile_snapshots as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;
grant select on api.hv_public_profile_snapshots to anon, authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710094130','expose_deal_room_messages_and_passport_snapshots_via_api','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710094130_expose_deal_room_messages_and_passport_snapshots_via_api.sql

-- RECOVERY BEGIN 20260710111129_restore_github_bridge_caller_auth.sql
-- Restores caller authentication for the github-bridge edge function.
--
-- Context: vault secret `hv_github_bridge_caller_secret` was created 2026-07-06
-- to close a hole where github-bridge was deployed with verify_jwt=false and
-- zero caller auth, letting anyone on the internet invoke push_file and commit
-- arbitrary content to any branch using the server-side admin-scoped GITHUB_PAT.
-- The deployed function later regressed to a version with no key check at all.
--
-- Edge Function env secrets can't be set from here, so instead of giving the
-- function a copy of the key, we give it a verifier it can call with its
-- auto-injected service-role credentials. The secret never leaves Postgres and
-- the function never holds it.
--
-- Digest-compares rather than `=` so the comparison doesn't leak the secret
-- byte-by-byte through response timing.

create or replace function api.hv_bridge_key_matches(candidate text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  expected text;
begin
  if candidate is null or length(candidate) = 0 then
    return false;
  end if;

  select decrypted_secret
    into expected
    from vault.decrypted_secrets
   where name = 'hv_github_bridge_caller_secret';

  -- Fail closed if the secret is missing rather than silently allowing callers.
  if expected is null then
    return false;
  end if;

  return extensions.digest(candidate, 'sha256') = extensions.digest(expected, 'sha256');
end;
$fn$;

comment on function api.hv_bridge_key_matches(text) is
  'Service-role-only verifier for the github-bridge x-hv-bridge-key header. Returns true iff the candidate matches vault secret hv_github_bridge_caller_secret. Never returns the secret itself.';

-- Lock it down: only the service role (i.e. the edge function itself) may call
-- this. anon/authenticated must never be able to use it as an oracle.
revoke all on function api.hv_bridge_key_matches(text) from public;
revoke all on function api.hv_bridge_key_matches(text) from anon;
revoke all on function api.hv_bridge_key_matches(text) from authenticated;
grant execute on function api.hv_bridge_key_matches(text) to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710111129','restore_github_bridge_caller_auth','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710111129_restore_github_bridge_caller_auth.sql

-- RECOVERY BEGIN 20260710114637_add_reviewed_regulatory_tier_to_countries.sql
-- Adds an explicitly-reviewed regulatory access tier for globe colouring.
--
-- WHY A NEW COLUMN INSTEAD OF REUSING market_access_status / import_status /
-- export_status: those three columns are not sourced and contain demonstrably
-- false values. Audited 2026-07-10 against cc_jurisdiction_briefings:
--   * countries.import_status = 'active' AND export_status = 'active' for the
--     UNITED STATES, which is federally Schedule I with no lawful cross-border
--     commercial trade.
--   * market_access_status buckets the UNITED KINGDOM (lawful Schedule 2
--     medical prescription market) identically to SAUDI ARABIA (prohibited,
--     death penalty for trafficking) -- both 'restricted'.
--   * COLOMBIA, described in its own briefing as "Medical Legal - Export
--     Industry Leader", is graded 'limited', below Portugal.
--   * MALTA shows export_status = 'active'; it has personal-cultivation-only
--     legalisation and no commercial export regime.
-- 138 of 203 countries are dumped into a single 'restricted' bucket and two
-- buckets have exactly one member. Do not colour a public map from them, and
-- do not "fix" them in place -- other code may depend on their current values.
--
-- regulatory_tier is NULL by default. NULL means "not yet reviewed" and MUST
-- render as the neutral plate, never as a claim. Only rows with a non-null
-- tier make an assertion about law.
--
-- regulatory_tier_reviewed_at stays NULL until a human signs off. Nothing in
-- this migration sets it. The globe feature flag is off by default so no
-- unreviewed legal claim reaches the public before that happens.

alter table public.countries
  add column if not exists regulatory_tier text,
  add column if not exists regulatory_tier_rationale text,
  add column if not exists regulatory_tier_source text,
  add column if not exists regulatory_tier_reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'countries_regulatory_tier_check'
  ) then
    alter table public.countries
      add constraint countries_regulatory_tier_check
      check (regulatory_tier is null or regulatory_tier in (
        'legal_commercial_access',
        'medical_limited_trade',
        'domestic_only',
        'prohibited'
      ));
  end if;
end $$;

comment on column public.countries.regulatory_tier is
  'Reviewed regulatory access tier used for globe colouring. NULL = unreviewed, renders neutral. Never derive this from market_access_status/import_status/export_status - those are unsourced and contain false values (see migration 20260710_add_reviewed_regulatory_tier_to_countries).';
comment on column public.countries.regulatory_tier_reviewed_at is
  'NULL until a human has signed off on the tier. Tiers are public claims about law in a specific jurisdiction.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710114637','add_reviewed_regulatory_tier_to_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710114637_add_reviewed_regulatory_tier_to_countries.sql

-- RECOVERY BEGIN 20260710114706_seed_reviewed_regulatory_tiers_curated_set.sql
-- Seeds regulatory_tier ONLY for jurisdictions we have actually reasoned about.
-- Every other country stays NULL and renders neutral.
--
-- Tier definitions:
--   legal_commercial_access : lawful cross-border commercial trade (import
--                             and/or export) exists and operates at scale.
--   medical_limited_trade   : lawful medical access exists; cross-border
--                             commercial trade is narrow, named-patient, or
--                             pilot-scale.
--   domestic_only           : lawful domestic production/sale, but no lawful
--                             cross-border commercial route.
--   prohibited              : no lawful commercial pathway.
--
-- Rationale text below is drawn from each country's own row in
-- cc_jurisdiction_briefings.program_status. Source is recorded per-row.
-- regulatory_tier_reviewed_at is deliberately left NULL for all of these.

-- legal_commercial_access
update public.countries set
  regulatory_tier = 'legal_commercial_access',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'DE' then 'Adult-use social club framework (CanG 2024); Europe''s largest medical import market with licensed importers.'
    when 'CA' then 'Federally legal adult-use; licensed producers hold export permits.'
    when 'PT' then 'Medical legal since 2018; licensed EU-GMP cultivation for export.'
    when 'NL' then 'State-licensed medical production with established cross-border medical supply.'
    when 'AU' then 'Medical legal; licensed import and export pathways in operation.'
    when 'CO' then 'Briefing states "Medical Legal - Export Industry Leader".'
    when 'IL' then 'Medical legal; approved medical cannabis export regime.'
    when 'ZA' then 'Medical cultivation licensed; export-oriented industry.'
    when 'GR' then 'Medical legal since 2017; briefing states "Licensed Export Industry".'
    when 'MK' then 'Briefing states "Established Programme and Export Industry".'
    when 'LS' then 'Briefing states "Medical Legal; Export-Oriented Pioneer".'
    when 'MA' then 'Medical and industrial cultivation legal since 2021.'
    when 'DK' then 'Permanent medical framework post-pilot; licensed cultivation and export.'
    when 'CY' then 'Medical prescription programme since 2019; briefing states "Export Hub".'
  end
where iso_alpha2 in ('DE','CA','PT','NL','AU','CO','IL','ZA','GR','MK','LS','MA','DK','CY');

-- medical_limited_trade
update public.countries set
  regulatory_tier = 'medical_limited_trade',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'GB' then 'Medical only - Schedule 2 prescription. Lawful access, thin commercial route.'
    when 'FR' then 'Medical pilot programme (ANSM); not yet a commercial market.'
    when 'ES' then 'Prescription-only medical access; social clubs tolerated, not commercial.'
    when 'IT' then 'Prescription programme; military farm is sole domestic cultivator.'
    when 'CZ' then 'Medical legal since 2013; adult-use reform advancing but not in force.'
    when 'PL' then 'General prescription programme since 2017; supply is import-dependent.'
    when 'CH' then 'Medical legal; adult-use limited to pilot programmes.'
    when 'AT' then 'Prescription-only medical access.'
    when 'IE' then 'MCAP programme since 2019; narrow eligibility.'
    when 'HR' then 'Prescription programme since 2015.'
    when 'NO' then 'Prescription medical programme.'
    when 'BE' then 'Very limited medical access (Sativex).'
    when 'SE' then 'Very limited medical access (Sativex only).'
    when 'FI' then 'Sativex via specialist prescription only.'
    when 'RO' then 'Limited medical access (Sativex).'
    when 'BG' then 'Limited medical access (Sativex).'
    when 'SI' then 'Prescription medical programme.'
    when 'SK' then 'Named-patient access only.'
    when 'IS' then 'Limited prescription access.'
    when 'ZW' then 'Medical legal; pioneer in sub-Saharan Africa. Export regime still developing.'
    when 'JM' then 'Decriminalised; medical and sacramental use licensed. Export is nascent.'
    when 'JP' then 'Recreational prohibited; limited pharmaceutical access from 2024.'
    when 'KR' then 'Recreational prohibited; limited medical access (Epidiolex).'
  end
where iso_alpha2 in ('GB','FR','ES','IT','CZ','PL','CH','AT','IE','HR','NO','BE','SE','FI','RO','BG','SI','SK','IS','ZW','JM','JP','KR');

-- domestic_only
update public.countries set
  regulatory_tier = 'domestic_only',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = case iso_alpha2
    when 'US' then 'Federal Schedule I. State programmes vary; cross-border commercial trade remains federally unlawful.'
    when 'UY' then 'Adult-use and medical legal domestically; cross-border commercial trade remains marginal.'
    when 'MT' then 'Personal cultivation legal since 2021; no commercial trade regime.'
    when 'LU' then 'Home cultivation legal since 2023; no commercial market.'
    when 'MX' then 'Medical legal; adult-use pending full regulation. No meaningful cross-border route.'
  end
where iso_alpha2 in ('US','UY','MT','LU','MX');

-- prohibited
-- Restricted to jurisdictions whose briefing states prohibition unambiguously.
-- Included so the map can actually show contrast; without at least one
-- prohibited tier the colouring communicates nothing.
update public.countries set
  regulatory_tier = 'prohibited',
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (2026-06-22 review)',
  regulatory_tier_rationale = 'Briefing records prohibition with no lawful commercial pathway.'
where iso_alpha2 in ('SA','SG','MY','ID','AE','QA','KW','OM','BH','EG','CN','VN','PH','IR');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710114706','seed_reviewed_regulatory_tiers_curated_set','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710114706_seed_reviewed_regulatory_tiers_curated_set.sql

-- RECOVERY BEGIN 20260710114720_restore_countries_live_view_columns.sql
-- Restore production-owned country columns that predate the regulatory-tier
-- API view but were never captured in repository migration history. Existing
-- production projects are unchanged because every operation is idempotent.
DO $market_access_status_type$
BEGIN
  IF to_regtype('public.market_access_status') IS NULL THEN
    CREATE TYPE public.market_access_status AS ENUM (
      'open',
      'active',
      'regulated',
      'emerging',
      'limited',
      'restricted',
      'review-required',
      'unknown'
    );
  END IF;
END
$market_access_status_type$;

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS map_region_key text,
  ADD COLUMN IF NOT EXISTS compliance_risk_status public.market_access_status NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS education_status public.market_access_status NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS marketplace_availability_status public.market_access_status NOT NULL DEFAULT 'unknown';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710114720','restore_countries_live_view_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710114720_restore_countries_live_view_columns.sql

-- RECOVERY BEGIN 20260710114721_expose_regulatory_tier_via_api_countries_view.sql
-- Append regulatory_tier to api.countries so the globe client can read it.
-- New columns appended at the end; existing column order preserved so
-- create-or-replace succeeds and existing grants carry over.
-- Deliberately NOT exposing regulatory_tier_rationale / _source / _reviewed_at:
-- those are internal review metadata, not something the public globe needs.

create or replace view api.countries as
 SELECT id,
    country_name,
    country_slug,
    iso_alpha2,
    iso_alpha3,
    region,
    subregion,
    map_region_key,
    market_access_status,
    medical_status,
    adult_use_status,
    import_status,
    export_status,
    signals_status,
    opportunity_status,
    compliance_risk_status,
    education_status,
    marketplace_availability_status,
    public_summary,
    data_completeness,
    last_updated_label,
    created_at,
    updated_at,
    lat,
    lng,
    opportunity_categories,
    trade_roles,
    regulator_label,
    opportunity_score,
    regulatory_tier
   FROM countries;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710114721','expose_regulatory_tier_via_api_countries_view','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710114721_expose_regulatory_tier_via_api_countries_view.sql

-- RECOVERY BEGIN 20260710120000_expose_hv_processing_jobs_api_schema.sql
-- hv_processing_jobs lives in public but PostgREST only exposes api.
-- Edge functions calling this table via REST got PGRST205 "table not found".
--
-- RLS on the base table restricts to admin role only; edge functions use
-- service_role which bypasses RLS entirely, so the api view only needs
-- service_role grants -- no anon/authenticated access for a job queue.

CREATE OR REPLACE VIEW api.hv_processing_jobs AS
SELECT * FROM public.hv_processing_jobs;

REVOKE ALL ON api.hv_processing_jobs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.hv_processing_jobs TO service_role;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710120000','expose_hv_processing_jobs_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710120000_expose_hv_processing_jobs_api_schema.sql

-- RECOVERY BEGIN 20260710121500_expose_hv_artifacts_api_schema.sql
-- hv_artifacts lives in public but PostgREST only exposes api.
-- hv-score inserts into this table on every promotion; every insert was
-- failing with PGRST205, which cascaded into hv_import_staging rows being
-- marked status=error en masse (510 rows affected).

CREATE OR REPLACE VIEW api.hv_artifacts AS
SELECT * FROM public.hv_artifacts;

GRANT SELECT, INSERT, UPDATE, DELETE ON api.hv_artifacts TO service_role;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710121500','expose_hv_artifacts_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710121500_expose_hv_artifacts_api_schema.sql

-- RECOVERY BEGIN 20260710123000_expose_actively_broken_tables_api_schema.sql
-- Batch fix: 143 public tables were found missing api-schema exposure via
-- an audit query. Rather than blanket-expose all 143 (many are internal
-- job/scratch tables that should stay REST-inaccessible), this migration
-- fixes only the ones confirmed via live API logs as actively 404ing in
-- production right now.

CREATE OR REPLACE VIEW api.education_modules WITH (security_invoker = true) AS SELECT * FROM public.education_modules;
GRANT SELECT ON api.education_modules TO anon, authenticated;

CREATE OR REPLACE VIEW api.listings WITH (security_invoker = true) AS SELECT * FROM public.listings;
GRANT SELECT, INSERT ON api.listings TO anon;
GRANT SELECT ON api.listings TO authenticated;
GRANT ALL ON api.listings TO service_role;

CREATE OR REPLACE VIEW api.local_open_questions WITH (security_invoker = true) AS SELECT * FROM public.local_open_questions;
GRANT SELECT ON api.local_open_questions TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_evidence_coverage WITH (security_invoker = true) AS SELECT * FROM public.local_evidence_coverage;
GRANT SELECT ON api.local_evidence_coverage TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_subdivisions_intel WITH (security_invoker = true) AS SELECT * FROM public.local_subdivisions_intel;
GRANT SELECT ON api.local_subdivisions_intel TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_authorities WITH (security_invoker = true) AS SELECT * FROM public.local_authorities;
GRANT SELECT ON api.local_authorities TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_operating_notes WITH (security_invoker = true) AS SELECT * FROM public.local_operating_notes;
GRANT SELECT ON api.local_operating_notes TO anon, authenticated;

CREATE OR REPLACE VIEW api.local_intel_coverage WITH (security_invoker = true) AS SELECT * FROM public.local_intel_coverage;
GRANT SELECT ON api.local_intel_coverage TO anon, authenticated;

CREATE OR REPLACE VIEW api.cc_pathway_templates WITH (security_invoker = true) AS SELECT * FROM public.cc_pathway_templates;
GRANT SELECT ON api.cc_pathway_templates TO authenticated;

CREATE OR REPLACE VIEW api.workspace_members WITH (security_invoker = true) AS SELECT * FROM public.workspace_members;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.workspace_members TO anon, authenticated;

-- RPCs: existed in public but PostgREST only resolves functions in api schema.
CREATE OR REPLACE FUNCTION api.get_regulatory_calendar(p_iso2 text, p_limit integer)
RETURNS TABLE(id uuid, iso2 text, event_type text, title text, summary text, expected_date date, confidence text, source_url text, source_label text, status text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_regulatory_calendar(p_iso2, p_limit) $fn$;

CREATE OR REPLACE FUNCTION api.get_field_changes_for_country(p_iso2 text, p_limit integer)
RETURNS TABLE(id uuid, table_name text, field_name text, old_value text, new_value text, changed_at timestamptz, source_label text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_field_changes_for_country(p_iso2, p_limit) $fn$;

GRANT EXECUTE ON FUNCTION api.get_regulatory_calendar(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.get_field_changes_for_country(text, integer) TO anon, authenticated;

-- public_signals lived in regulatory_signals schema, invisible to PostgREST entirely.
CREATE OR REPLACE VIEW api.public_signals WITH (security_invoker = true) AS SELECT * FROM regulatory_signals.public_signals;
GRANT SELECT ON api.public_signals TO anon, authenticated;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710123000','expose_actively_broken_tables_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710123000_expose_actively_broken_tables_api_schema.sql

-- RECOVERY BEGIN 20260710130000_schema_drift_monitor.sql
-- Schema drift detection: catches public tables missing api-schema exposure
-- before they cause a production 404, rather than after.

CREATE TABLE IF NOT EXISTS public.schema_drift_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name text NOT NULL UNIQUE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz
);

ALTER TABLE public.schema_drift_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schema_drift_alerts_admin_only ON public.schema_drift_alerts;
CREATE POLICY schema_drift_alerts_admin_only ON public.schema_drift_alerts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.schema_drift_allowlist (
  table_name text PRIMARY KEY,
  reason text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_drift_allowlist (table_name, reason) VALUES
  ('_claude_scratch', 'scratch table, never REST-accessible'),
  ('_counterparty_enrich_jobs', 'internal job queue'),
  ('_counterparty_jobs', 'internal job queue'),
  ('_country_enrich_jobs', 'internal job queue'),
  ('_digest_jobs', 'internal job queue'),
  ('_editorial_digest_jobs', 'internal job queue'),
  ('_education_gen_jobs', 'internal job queue'),
  ('_education_regen_jobs', 'internal job queue'),
  ('_push_staging', 'internal staging table for github-bridge'),
  ('_sig_extract_jobs', 'internal job queue'),
  ('country_intel_backup_20260630', 'point-in-time backup, not for REST access'),
  ('education_module_sections_backup_20260705', 'point-in-time backup, not for REST access'),
  ('dead_letter_tasks', 'internal error queue, service_role only via direct SQL'),
  ('worker_leases', 'internal job coordination, no REST need'),
  ('llm_rate_limits', 'internal rate limiting state'),
  ('pipeline_tasks', 'internal pipeline coordination'),
  ('intelligence_jobs', 'internal job queue'),
  ('source_fetch_jobs', 'internal job queue'),
  ('source_fetch_runs', 'internal job queue'),
  ('hv_job_attempts', 'internal job tracking, paired with hv_processing_jobs'),
  ('status_history', 'internal audit trail, admin dashboard queries via service_role'),
  ('audit_events', 'internal audit trail, service_role only'),
  ('internal_admin_notes', 'admin-only notes, intentionally not REST-exposed'),
  ('project_control_refs', 'internal project scaffolding refs')
ON CONFLICT (table_name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_tables_missing_from_api_schema()
RETURNS TABLE(table_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT t.table_name
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables a WHERE a.table_schema = 'api' AND a.table_name = t.table_name)
    AND NOT EXISTS (SELECT 1 FROM public.schema_drift_allowlist al WHERE al.table_name = t.table_name)
  ORDER BY t.table_name;
$fn$;

CREATE OR REPLACE FUNCTION api.get_tables_missing_from_api_schema()
RETURNS TABLE(table_name text)
LANGUAGE sql STABLE
AS $fn$ SELECT * FROM public.get_tables_missing_from_api_schema() $fn$;

GRANT EXECUTE ON FUNCTION public.get_tables_missing_from_api_schema() TO service_role;
GRANT EXECUTE ON FUNCTION api.get_tables_missing_from_api_schema() TO service_role;

CREATE OR REPLACE VIEW api.schema_drift_alerts AS SELECT * FROM public.schema_drift_alerts;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.schema_drift_alerts TO service_role;

-- Seed the ledger with everything missing at migration time so only NEW
-- drift (created after this point) triggers an alert email.
INSERT INTO public.schema_drift_alerts (object_name, first_seen_at)
SELECT table_name, now() FROM public.get_tables_missing_from_api_schema()
ON CONFLICT (object_name) DO NOTHING;

SELECT cron.schedule(
  'schema-drift-monitor',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/schema-drift-monitor',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $cron$
);

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710130000','schema_drift_monitor','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710130000_schema_drift_monitor.sql

-- RECOVERY BEGIN 20260710140000_schema_drift_monitor_functions.sql
-- Extends schema_drift monitoring to public functions meant to be called via
-- supabase.rpc() (get_*/search_*/list_* naming) that lack an api-schema
-- wrapper. Excludes extension-owned functions (pgvector etc.) via pg_depend,
-- and excludes internal-only callers (run_*, hv_trigger_*, is_*, sync_*,
-- smoke_*) via naming filter since those are invoked by cron/service_role,
-- never by a browser client.

CREATE OR REPLACE FUNCTION public.get_functions_missing_from_api_schema()
RETURNS TABLE(function_name text, arg_types text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT p.proname, pg_get_function_identity_arguments(p.oid)
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    AND l.lanname NOT IN ('c', 'internal')
    AND pg_get_function_result(p.oid) <> 'trigger'
    AND (p.proname LIKE 'get\_%' OR p.proname LIKE 'search\_%' OR p.proname LIKE 'list\_%')
    AND NOT EXISTS (SELECT 1 FROM public.schema_drift_allowlist al WHERE al.table_name = p.proname)
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc a
      JOIN pg_namespace an ON an.oid = a.pronamespace
      WHERE an.nspname = 'api' AND a.proname = p.proname
    )
  ORDER BY p.proname;
$fn$;

CREATE OR REPLACE FUNCTION api.get_functions_missing_from_api_schema()
RETURNS TABLE(function_name text, arg_types text)
LANGUAGE sql STABLE
SET search_path = ''
AS $fn$ SELECT * FROM public.get_functions_missing_from_api_schema() $fn$;

GRANT EXECUTE ON FUNCTION public.get_functions_missing_from_api_schema() TO service_role;
GRANT EXECUTE ON FUNCTION api.get_functions_missing_from_api_schema() TO service_role;

INSERT INTO public.schema_drift_alerts (object_name, first_seen_at)
SELECT 'fn:' || function_name, now() FROM public.get_functions_missing_from_api_schema()
ON CONFLICT (object_name) DO NOTHING;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710140000','schema_drift_monitor_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710140000_schema_drift_monitor_functions.sql

-- RECOVERY BEGIN 20260710150000_expose_education_sections_and_playbooks.sql
-- Found via live API log traffic on a real country page request, not the
-- static information_schema audit -- these were actively 404ing right now.

CREATE OR REPLACE VIEW api.education_module_sections WITH (security_invoker = true) AS SELECT * FROM public.education_module_sections;
GRANT SELECT ON api.education_module_sections TO anon, authenticated;

CREATE OR REPLACE VIEW api.jurisdiction_playbooks WITH (security_invoker = true) AS SELECT * FROM public.jurisdiction_playbooks;
GRANT SELECT ON api.jurisdiction_playbooks TO anon, authenticated;

-- public_signals view existed already but was returning 406 on well-formed
-- requests with matching columns -- stale schema cache, not a real gap.
-- Force-recreate + double reload to be certain PostgREST picks it up.
DROP VIEW IF EXISTS api.public_signals;
CREATE VIEW api.public_signals WITH (security_invoker = true) AS SELECT * FROM regulatory_signals.public_signals;
GRANT SELECT ON api.public_signals TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710150000','expose_education_sections_and_playbooks','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710150000_expose_education_sections_and_playbooks.sql

-- RECOVERY BEGIN 20260710152222_fix_security_definer_view_bypass_18_views.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710152222.
--
-- Rewriting this file cannot affect production: 20260710152222 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- This exact class of bug has regressed at least 3 times already:
-- 20260622151411_fix_security_definer_views_to_invoker,
-- 20260701001549_fix_api_schema_views_rls_bypass,
-- 20260709092127_fix_security_definer_views_api_schema. It keeps coming
-- back because api.* views are created with plain
-- `CREATE OR REPLACE VIEW api.x AS SELECT * FROM public.x` and
-- CREATE OR REPLACE VIEW resets any omitted WITH (...) option back to its
-- default (security_invoker = false) -- so a later, unrelated edit to a
-- view silently reopens every RLS policy on the underlying table. Found
-- via a live audit prompted by the same bug being caught and fixed on
-- client_error_reports in 20260709032305: the security advisor currently
-- flags 18 api.* views with this property, all simple SELECT * passthroughs
-- with no legitimate reason to run as the view owner instead of the caller.
--
-- Confirmed live (get_advisors + information_schema.role_table_grants +
-- pg_policies) that every one of these 18 views grants SELECT to
-- anon/authenticated. Eight have a genuinely restrictive underlying RLS
-- policy that this bug fully bypasses -- i.e. this was an active,
-- exploitable cross-tenant/cross-user data leak, not a theoretical one:
--   - deal_room_messages: policy restricts to the two parties in a deal
--     room; bypass exposed every private deal negotiation message on the
--     platform to any authenticated OR anonymous caller.
--   - subscriptions: policy restricts to auth.uid() = user_id; bypass
--     exposed every user's Stripe customer id, tier, and billing status.
--   - hv_evidence_documents: policy restricts to org members / platform
--     staff; bypass exposed every org's compliance evidence documents,
--     including ones with is_public = false.
--   - cc_org_pathway_progress, cc_org_requirement_status, cc_watch_rules,
--     cc_watchlist_items: policy restricts to workspace members of that
--     org; bypass exposed every org's internal Command Centre compliance
--     progress, requirement status, watch rules, and watchlist.
--   - cc_watchlist_notifications: policy restricts to auth.uid() =
--     user_id; bypass exposed every user's notifications to every other
--     user.
-- The remaining 10 either had a real but lower-severity content-exposure
-- gap (unpublished/unverified rows shown as if reviewed/live:
-- country_education_overlay, editorial_items, market_metrics,
-- stripe_webhook_events -- the last of which is meant to be
-- service_role-only end to end) or no behavioral change at all because the
-- underlying table policy was already `true` for anon/authenticated
-- (countries, trade_flows, education_tracks, hv_public_profile_snapshots,
-- cc_pathway_steps, cc_pathway_step_requirements) -- those are fixed here
-- too, for lint compliance and so this list doesn't need revisiting piecemeal.
--
-- Column lists below are copied verbatim from the live
-- information_schema.views.view_definition for each view -- this migration
-- changes ONLY the security_invoker option, not any exposed column.

create or replace view api.deal_room_messages with (security_invoker = true) as
select id, room_id, sender_id, message_type, body, attachments, read_at, created_at
from public.deal_room_messages;

create or replace view api.subscriptions with (security_invoker = true) as
select id, user_id, stripe_customer_id, status, tier, price_id, current_period_start,
  current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at
from public.subscriptions;

create or replace view api.hv_evidence_documents with (security_invoker = true) as
select id, org_id, document_type, display_name, storage_path, file_hash, file_size_bytes,
  mime_type, uploaded_by, verification_status, verified_by, verified_at, expiry_date,
  is_public, created_at
from public.hv_evidence_documents;

create or replace view api.cc_org_pathway_progress with (security_invoker = true) as
select id, org_id, template_id, current_step, status, started_at, completed_at,
  last_action_at, created_at, updated_at
from public.cc_org_pathway_progress;

create or replace view api.cc_org_requirement_status with (security_invoker = true) as
select id, org_id, requirement_id, status, evidence_document_id, licence_id, notes,
  submitted_at, reviewed_at, reviewed_by, created_at, updated_at
from public.cc_org_requirement_status;

create or replace view api.cc_watch_rules with (security_invoker = true) as
select id, org_id, created_by, rule_type, keywords, is_active, created_at, updated_at
from public.cc_watch_rules;

create or replace view api.cc_watchlist_items with (security_invoker = true) as
select id, org_id, added_by, item_type, ref_id, title, subtitle, tags, jurisdiction,
  confidence_pct, latest_change_at, latest_change_note, next_action, watch_status,
  snoozed_until, created_at, updated_at
from public.cc_watchlist_items;

create or replace view api.cc_watchlist_notifications with (security_invoker = true) as
select id, user_id, org_id, watchlist_item_id, notification_type, title, body, is_read,
  is_snoozed, snoozed_until, created_at
from public.cc_watchlist_notifications;

create or replace view api.country_education_overlay with (security_invoker = true) as
select id, country_iso2, module_key, role_id, topics, action_label, source_ids,
  review_status, reviewer, last_verified_at, updated_at
from public.country_education_overlay;

create or replace view api.editorial_items with (security_invoker = true) as
select id, source_id, snapshot_id, headline, summary, why_it_matters, outlet_name,
  source_url, country, region, language, tone, published_at, used_in_digest_at, stage,
  created_at, updated_at
from public.editorial_items;

create or replace view api.market_metrics with (security_invoker = true) as
select id, country_iso2, metric_name, metric_value, metric_unit, period_start, period_end,
  period_granularity, data_type, confidence_band, source_name, source_url, source_date,
  notes, created_at, updated_at
from public.market_metrics;

create or replace view api.stripe_webhook_events with (security_invoker = true) as
select id, type, processed_at
from public.stripe_webhook_events;

create or replace view api.countries with (security_invoker = true) as
select id, country_name, country_slug, iso_alpha2, iso_alpha3, region, subregion,
  map_region_key, market_access_status, medical_status, adult_use_status, import_status,
  export_status, signals_status, opportunity_status, compliance_risk_status,
  education_status, marketplace_availability_status, public_summary, data_completeness,
  last_updated_label, created_at, updated_at, lat, lng, opportunity_categories,
  trade_roles, regulator_label, opportunity_score, regulatory_tier
from public.countries;

create or replace view api.trade_flows with (security_invoker = true) as
select id, origin_iso2, destination_iso2, flow_direction, product_category, legal_status,
  permit_required, permit_authority, purpose, gmp_required, gacp_required,
  key_requirements, notes, source_name, source_url, last_verified, confidence, created_at,
  updated_at
from public.trade_flows;

create or replace view api.education_tracks with (security_invoker = true) as
select id, slug, title, description, publication_state, created_at, updated_at
from public.education_tracks;

create or replace view api.hv_public_profile_snapshots with (security_invoker = true) as
select id, org_id, snapshot_data, snapshot_version, generated_at
from public.hv_public_profile_snapshots;

create or replace view api.cc_pathway_steps with (security_invoker = true) as
select id, template_id, step_number, title, description, unlock_condition, created_at
from public.cc_pathway_steps;

create or replace view api.cc_pathway_step_requirements with (security_invoker = true) as
select id, step_id, title, description, evidence_type, is_required, sort_order, created_at
from public.cc_pathway_step_requirements;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710152222','fix_security_definer_view_bypass_18_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710152222_fix_security_definer_view_bypass_18_views.sql

-- RECOVERY BEGIN 20260710152711_grant_select_base_tables_for_invoker_views.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260710152711.
--
-- Rewriting this file cannot affect production: 20260710152711 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Companion to 20260710190000_fix_security_definer_view_bypass_18_views:
-- flipping those views to security_invoker = true means the CALLING role's
-- own privileges now apply, not the view owner's. These base tables had
-- zero grants to anon/authenticated at all (only the SECURITY DEFINER view
-- did) -- so without this, RLS never gets a chance to evaluate; the read
-- fails at the coarser GRANT check first with a hard permission-denied,
-- breaking legitimate signed-in users' access to their own data (e.g. a
-- user's own subscription row, their own org's watchlist).
--
-- SELECT only -- this does not widen which ROWS are visible. Every table
-- below already has a real, verified-restrictive RLS SELECT policy
-- (auth.uid() = user_id, workspace membership, deal-room participancy, or
-- hv_is_org_member()) that still applies underneath this grant. This just
-- lets that policy run instead of the request being rejected outright.
--
-- anon is intentionally granted on only 3 of these: trade_flows,
-- market_metrics, hv_public_profile_snapshots are the only ones whose RLS
-- policy is actually satisfiable by an unauthenticated caller (public
-- reference data / a data_type filter with roles = public). The other 8
-- are gated on auth.uid() (directly, or transitively via workspace_members
-- / hv_is_org_member()), which is NULL for anon and can never match --
-- granting anon SELECT there would add permission surface for zero
-- capability, so those stay authenticated-only.

grant select on public.trade_flows to anon, authenticated;
grant select on public.market_metrics to anon, authenticated;
grant select on public.hv_public_profile_snapshots to anon, authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.deal_room_messages to authenticated;
grant select on public.hv_evidence_documents to authenticated;
grant select on public.cc_org_pathway_progress to authenticated;
grant select on public.cc_org_requirement_status to authenticated;
grant select on public.cc_watch_rules to authenticated;
grant select on public.cc_watchlist_items to authenticated;
grant select on public.cc_watchlist_notifications to authenticated;

-- Needed for the cc_* tables' RLS policies above: their USING clause
-- subqueries workspace_members (org_id IN (SELECT workspace_id FROM
-- workspace_members WHERE user_id = auth.uid())), which itself requires
-- SELECT on workspace_members to evaluate. workspace_members has its own
-- RLS (auth.uid() = user_id OR admin) so this grant does not let a caller
-- read any row but their own membership record.
grant select on public.workspace_members to authenticated;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710152711','grant_select_base_tables_for_invoker_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710152711_grant_select_base_tables_for_invoker_views.sql

-- RECOVERY BEGIN 20260710160000_create_public_watchlist_collections.sql
-- Backs the public /intelligence/watchlists page, which currently renders
-- static boilerplate with no live data source (content-gap audit, July 2026).
--
-- Deliberately NOT named `watchlists` -- public.watchlists already exists and
-- is unrelated internal source-monitoring config (jurisdiction/scope targets
-- consumed by the crawler via source_watchlist_links). Reusing that name
-- across schemas for a different concept is exactly what caused confusion
-- during this audit; `watchlist_collections` in the regulatory_signals
-- schema keeps the two systems unambiguous.
--
-- A "watchlist" here is a named, curated grouping of one or more
-- regulatory_signals.signals rows (e.g. "EU Novel Food Reform Watch",
-- "US State Adult-Use Rollouts"). It reuses the signals table as the
-- underlying content and review pipeline rather than introducing a second,
-- parallel content type and a second analyst-review workflow -- signals are
-- already gated by review_status / public_safe / publish_to_public, and
-- regulatory_signals.public_signals already implements exactly this pattern
-- for individual signals. This migration adds the same gate at the
-- collection level and lets a collection reference many already-reviewed
-- signals.
--
-- Verified before writing this: regulatory_signals.signals currently has
-- zero rows, so this migration ships the schema + RLS only. Nothing will
-- render on the public page until content actually exists on both sides.
-- That's a content/ops task (populating signals, then grouping them into
-- collections), not a follow-up migration.

create table if not exists regulatory_signals.watchlist_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  scope_type text not null check (scope_type in ('country', 'region', 'global', 'topic')),
  country_code text,
  region text,
  display_priority integer not null default 0,

  -- Same three-flag review gate as regulatory_signals.signals, kept
  -- independent of the underlying signals' own gate: a collection can be
  -- in draft while it references signals that are individually already
  -- public, and vice versa is blocked by the view below.
  review_status text not null default 'draft'
    check (review_status in ('draft', 'in_review', 'published', 'archived')),
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,

  published_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table regulatory_signals.watchlist_collections is
  'Named, curated groupings of regulatory_signals.signals for the public /intelligence/watchlists page. Analyst-reviewed, not auto-published.';

create trigger watchlist_collections_set_updated_at
  before update on regulatory_signals.watchlist_collections
  for each row execute function public.set_updated_at();

create index if not exists watchlist_collections_published_idx
  on regulatory_signals.watchlist_collections (display_priority)
  where review_status = 'published' and public_safe = true and publish_to_public = true;

create index if not exists watchlist_collections_country_idx
  on regulatory_signals.watchlist_collections (country_code);

-- Join table: which signals belong to which collection, and in what order.
create table if not exists regulatory_signals.watchlist_collection_signals (
  watchlist_collection_id uuid not null
    references regulatory_signals.watchlist_collections (id) on delete cascade,
  signal_id uuid not null
    references regulatory_signals.signals (id) on delete cascade,
  display_order integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (watchlist_collection_id, signal_id)
);

comment on table regulatory_signals.watchlist_collection_signals is
  'Membership: which regulatory_signals.signals rows appear in which watchlist_collections row, and in what order.';

alter table regulatory_signals.watchlist_collections enable row level security;
alter table regulatory_signals.watchlist_collection_signals enable row level security;

create policy "service role all watchlist_collections"
  on regulatory_signals.watchlist_collections
  for all
  to service_role
  using (true)
  with check (true);

create policy "service role all watchlist_collection_signals"
  on regulatory_signals.watchlist_collection_signals
  for all
  to service_role
  using (true)
  with check (true);

-- Public-safe view, same shape/intent as regulatory_signals.public_signals:
-- only fully-published, public-safe collection metadata, no internal
-- review fields (review_status, last_reviewed_at, etc. stay server-side).
create or replace view regulatory_signals.public_watchlist_collections as
select
  id,
  slug,
  title,
  description,
  scope_type,
  country_code,
  region,
  display_priority,
  published_at
from regulatory_signals.watchlist_collections
where review_status = 'published'
  and public_safe = true
  and publish_to_public = true;

-- Convenience joined view for the page: collection metadata + its member
-- signals' already-public-safe fields, in one query. Both sides of the join
-- must independently qualify as published/public-safe -- a published
-- collection does not implicitly expose an unpublished signal, and a
-- published signal does not leak through an unpublished collection.
create or replace view regulatory_signals.public_watchlist_collection_signals as
select
  wc.id as watchlist_collection_id,
  wc.slug as watchlist_slug,
  wc.title as watchlist_title,
  wcs.display_order,
  ps.id as signal_id,
  ps.slug as signal_slug,
  ps.headline,
  ps.signal_type,
  ps.confidence,
  ps.impact_level,
  ps.country_code,
  ps.country_name,
  ps.region,
  ps.jurisdiction,
  ps.regulator_name,
  ps.signal_date,
  ps.public_summary,
  ps.public_implication,
  ps.published_at as signal_published_at
from regulatory_signals.watchlist_collections wc
join regulatory_signals.watchlist_collection_signals wcs
  on wcs.watchlist_collection_id = wc.id
join regulatory_signals.public_signals ps
  on ps.id = wcs.signal_id
where wc.review_status = 'published'
  and wc.public_safe = true
  and wc.publish_to_public = true
order by wc.display_priority, wcs.display_order;

grant select on regulatory_signals.public_watchlist_collections to anon, authenticated;
grant select on regulatory_signals.public_watchlist_collection_signals to anon, authenticated;

-- Expose through the api schema, matching the current project convention
-- (see 20260710150000_expose_education_sections_and_playbooks.sql) rather
-- than granting directly on public/regulatory_signals schema objects.
create or replace view api.watchlist_collections as
  select * from regulatory_signals.public_watchlist_collections;
grant select on api.watchlist_collections to anon, authenticated;

create or replace view api.watchlist_collection_signals as
  select * from regulatory_signals.public_watchlist_collection_signals;
grant select on api.watchlist_collection_signals to anon, authenticated;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710160000','create_public_watchlist_collections','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710160000_create_public_watchlist_collections.sql

-- RECOVERY BEGIN 20260710160001_client_error_reports_view_security_invoker.sql
-- api.client_error_reports (created in 20260710160000_client_error_reports.sql)
-- silently bypassed the base table's RLS: Postgres views default to
-- security_invoker = false, meaning permission/RLS checks run as the VIEW
-- OWNER (postgres, which owns the table and is exempt from RLS with no
-- FORCE ROW LEVEL SECURITY set), not as the actual calling role. Verified
-- live: an anon insert with a 2500-char message (policy caps at 2000) was
-- silently accepted through api.client_error_reports, while the identical
-- insert against public.client_error_reports directly was correctly
-- rejected. This also meant the user_id = auth.uid() anti-spoofing check
-- was bypassed via the view. security_invoker = true makes the view
-- evaluate RLS as the actual invoking role, closing both holes.
--
-- 20260710160000 now sets this option directly in its own CREATE OR REPLACE
-- VIEW statement, so on a fresh apply this ALTER is redundant (a no-op re-
-- assertion of an already-true option). Left in place — deleting it would
-- misrepresent what actually happened on the shared project this session:
-- this file is the real order of discovery, and re-running it is harmless.

alter view api.client_error_reports set (security_invoker = true);

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710160001','client_error_reports_view_security_invoker','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710160001_client_error_reports_view_security_invoker.sql

-- RECOVERY BEGIN 20260710165831_classify_all_countries_regulatory_tier_from_briefings.sql
-- Classifies EVERY country with briefing text (195) into a regulatory_tier,
-- derived deterministically from cc_jurisdiction_briefings.program_status.
-- Supersedes the earlier 56-country curated seed. This is a global product;
-- every jurisdiction with source text gets a tier.
--
-- Ordering matters. Exclusions run before affirmations so that:
--   * "Export Licensing Under Discussion" (Kenya) and "Reform Under
--     Consideration" (Nigeria/Ghana) are NOT read as active regimes.
--   * "No Medical Programme" (Albania, Andorra, Bosnia, Kosovo, Moldova,
--     Türkiye) is NOT read as a medical market.
-- The affirmative "export/industrial legal" signal separates commercial-access
-- markets from medical-only ones.
--
-- rationale stores the source program_status verbatim so every classification
-- is auditable. reviewed_at stays NULL — a human signs off before the flag
-- goes on.

update public.countries c set
  regulatory_tier = t.tier,
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (auto-classified 2026-07-10, pending review)',
  regulatory_tier_rationale = 'Derived from briefing: "' || t.program_status || '"',
  regulatory_tier_reviewed_at = null
from (
  select b.country_iso2, b.program_status,
    case
      when b.program_status ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented)'
           and b.program_status !~* 'export licensing under (discussion|consideration|review)'
        then 'legal_commercial_access'
      when b.program_status ~* 'industrial (cultivation licensed|legal)'
        then 'legal_commercial_access'
      when b.program_status ~* 'adult-use legal — federal'
        then 'legal_commercial_access'
      when b.program_status ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail'
        then 'domestic_only'
      when b.program_status ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
           and b.program_status !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
        then 'medical_limited_trade'
      else 'prohibited'
    end as tier
  from public.cc_jurisdiction_briefings b
  where b.jurisdiction_type='country' and coalesce(b.program_status,'')<>''
) t
where c.iso_alpha2 = t.country_iso2;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710165831','classify_all_countries_regulatory_tier_from_briefings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710165831_classify_all_countries_regulatory_tier_from_briefings.sql

-- RECOVERY BEGIN 20260710165848_classify_remaining_8_countries_without_briefings.sql
-- The 8 countries with no cc_jurisdiction_briefings row. Classified from
-- well-established legal status so the globe has no blank plates. Source noted
-- as manual rather than briefing-derived; still pending human review.

update public.countries set
  regulatory_tier = t.tier,
  regulatory_tier_source = 'manual (no briefing row; 2026-07-10, pending review)',
  regulatory_tier_rationale = t.rationale,
  regulatory_tier_reviewed_at = null
from (values
  ('RU', 'prohibited',            'Cannabis prohibited; strict criminal enforcement. No medical programme.'),
  ('PR', 'domestic_only',         'US territory with its own medical cannabis programme; federal Schedule I blocks cross-border commercial trade.'),
  ('FK', 'prohibited',            'UK Overseas Territory; no domestic cannabis regime.'),
  ('VA', 'prohibited',            'Vatican City; no cannabis market.'),
  ('FM', 'prohibited',            'Federated States of Micronesia; cannabis prohibited.'),
  ('SC', 'prohibited',            'Seychelles; cannabis prohibited.'),
  ('TO', 'prohibited',            'Tonga; cannabis prohibited.'),
  ('EH', 'prohibited',            'Western Sahara; disputed territory, no lawful cannabis regime.')
) as t(iso, tier, rationale)
where public.countries.iso_alpha2 = t.iso;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260710165848','classify_remaining_8_countries_without_briefings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260710165848_classify_remaining_8_countries_without_briefings.sql
