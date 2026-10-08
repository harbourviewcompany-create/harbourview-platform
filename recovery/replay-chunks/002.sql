
-- RECOVERY BEGIN 20260607230000_hv_bge_m3_1024_dim_embedding_column_and_search.sql
-- Harbourview artifact + embedding foundation and BGE-M3 1024-dim upgrade.
-- Production originally received the foundation out-of-band. This migration
-- makes a zero-state repository replay structurally equivalent before applying
-- the verified 1024-dimensional search upgrade.

create extension if not exists vector with schema public;

do $hv_types$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_object_class') then
    create type public.hv_object_class as enum (
      'marketplace_listing','wanted_request','counterparty','company','licence','facility',
      'jurisdiction','regulatory_event','source_document','evidence_snapshot','analyst_note',
      'ai_summary','relationship_contact','review_decision','publication_record','public_feed_item'
    );
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_classification') then
    create type public.hv_classification as enum (
      'public','internal','confidential','restricted','legal_hold','personal_contact',
      'source_protected','ai_advisory','quarantined','archived'
    );
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_authority_level') then
    create type public.hv_authority_level as enum ('A','B','C','D','E','F','G','H');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_lifecycle_stage') then
    create type public.hv_lifecycle_stage as enum (
      'captured','import_staging','normalized','duplicate_review','evidence_check','classification',
      'analyst_review','operator_approval','dto_preview','publication_approval','published',
      'monitoring','unpublished','archived'
    );
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_review_status') then
    create type public.hv_review_status as enum ('pending','in_review','approved','rejected','quarantined','superseded');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'hv_freshness') then
    create type public.hv_freshness as enum ('fresh','review_due','stale','expired','quarantined','archived');
  end if;
end
$hv_types$;

create table if not exists public.hv_artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  object_class public.hv_object_class not null,
  classification public.hv_classification not null default 'internal',
  authority_level public.hv_authority_level,
  title text not null,
  body text,
  structured_data jsonb not null default '{}'::jsonb,
  source_system text,
  source_record_id text,
  source_url text,
  import_batch_id uuid,
  content_hash text,
  lifecycle_stage public.hv_lifecycle_stage not null default 'captured',
  review_status public.hv_review_status not null default 'pending',
  freshness public.hv_freshness not null default 'fresh',
  public_eligible boolean not null default false,
  is_duplicate_candidate boolean not null default false,
  jurisdiction_code text,
  country_iso text,
  region text,
  superseded_by uuid references public.hv_artifacts(id),
  archived_at timestamptz,
  published_at timestamptz,
  review_due_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  owned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored,
  last_embedded_at timestamptz
);

create table if not exists public.hv_embeddings (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.hv_artifacts(id) on delete cascade,
  workspace_id uuid not null,
  model_id text not null,
  model_provider text not null,
  model_version text,
  dimensions integer not null,
  chunk_index integer not null default 0,
  chunk_text text not null,
  chunk_tokens integer,
  embedding vector(1536),
  source_field text,
  content_hash text not null,
  is_current boolean not null default true,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  embedding_384 vector(384),
  embedding_1024 vector(1024)
);

alter table public.hv_artifacts enable row level security;
alter table public.hv_embeddings enable row level security;
revoke all on table public.hv_artifacts from public, anon, authenticated;
revoke all on table public.hv_embeddings from public, anon, authenticated;
grant all on table public.hv_artifacts to service_role;
grant all on table public.hv_embeddings to service_role;

create index if not exists idx_hv_artifacts_workspace on public.hv_artifacts(workspace_id);
create index if not exists idx_hv_artifacts_object_class on public.hv_artifacts(object_class);
create index if not exists idx_hv_artifacts_classification on public.hv_artifacts(classification);
create index if not exists idx_hv_artifacts_lifecycle on public.hv_artifacts(lifecycle_stage);
create index if not exists idx_hv_artifacts_review_status on public.hv_artifacts(review_status);
create index if not exists idx_hv_artifacts_source_system on public.hv_artifacts(source_system, source_record_id);
create index if not exists idx_hv_artifacts_content_hash on public.hv_artifacts(content_hash);
create index if not exists idx_hv_artifacts_jurisdiction on public.hv_artifacts(jurisdiction_code);
create index if not exists idx_hv_artifacts_country on public.hv_artifacts(country_iso);
create index if not exists idx_hv_artifacts_public_eligible on public.hv_artifacts(public_eligible) where public_eligible = true;
create index if not exists idx_hv_artifacts_fts on public.hv_artifacts using gin(fts_vector);
create index if not exists idx_hv_artifacts_last_embedded_at on public.hv_artifacts(last_embedded_at);
create index if not exists idx_hv_embeddings_artifact on public.hv_embeddings(artifact_id);
create index if not exists idx_hv_embeddings_workspace on public.hv_embeddings(workspace_id);
create index if not exists idx_hv_embeddings_model on public.hv_embeddings(model_id);
create index if not exists idx_hv_embeddings_hash on public.hv_embeddings(content_hash);
create index if not exists idx_hv_embeddings_current on public.hv_embeddings(artifact_id, is_current) where is_current = true;
create index if not exists idx_hv_embeddings_hnsw on public.hv_embeddings using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create index if not exists idx_hv_embeddings_hnsw_384 on public.hv_embeddings using hnsw (embedding_384 vector_cosine_ops) with (m = 16, ef_construction = 64);
create index if not exists idx_hv_embeddings_hnsw_1024 on public.hv_embeddings using hnsw (embedding_1024 vector_cosine_ops) with (m = 16, ef_construction = 64);

create or replace function public.hv_search_artifacts(
  p_query_embedding_1536 vector default null,
  p_query_embedding_384 vector default null,
  p_workspace_id uuid default 'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid,
  p_match_count integer default 20,
  p_fts_query text default null,
  p_query_embedding_1024 vector default null
)
returns table(
  artifact_id uuid,
  title text,
  country_iso text,
  jurisdiction text,
  object_class public.hv_object_class,
  review_status public.hv_review_status,
  similarity double precision,
  search_method text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
begin
  if p_query_embedding_1536 is not null then
    return query
      select distinct on (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding <=> p_query_embedding_1536))::double precision,
        'vector_1536'::text
      from public.hv_embeddings e
      join public.hv_artifacts a on e.artifact_id = a.id
      where e.is_current = true
        and e.embedding is not null
        and a.workspace_id = p_workspace_id
      order by a.id, e.embedding <=> p_query_embedding_1536
      limit p_match_count;
    return;
  end if;

  if p_query_embedding_1024 is not null then
    return query
      select distinct on (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding_1024 <=> p_query_embedding_1024))::double precision,
        'vector_1024'::text
      from public.hv_embeddings e
      join public.hv_artifacts a on e.artifact_id = a.id
      where e.is_current = true
        and e.embedding_1024 is not null
        and a.workspace_id = p_workspace_id
      order by a.id, e.embedding_1024 <=> p_query_embedding_1024
      limit p_match_count;
    return;
  end if;

  if p_query_embedding_384 is not null then
    return query
      select distinct on (a.id)
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        (1 - (e.embedding_384 <=> p_query_embedding_384))::double precision,
        'vector_384'::text
      from public.hv_embeddings e
      join public.hv_artifacts a on e.artifact_id = a.id
      where e.is_current = true
        and e.embedding_384 is not null
        and a.workspace_id = p_workspace_id
      order by a.id, e.embedding_384 <=> p_query_embedding_384
      limit p_match_count;
    return;
  end if;

  if p_fts_query is not null then
    return query
      select
        a.id, a.title, a.country_iso, a.jurisdiction_code,
        a.object_class, a.review_status,
        ts_rank(a.fts_vector, websearch_to_tsquery('english', p_fts_query))::double precision,
        'fts'::text
      from public.hv_artifacts a
      where a.workspace_id = p_workspace_id
        and a.fts_vector @@ websearch_to_tsquery('english', p_fts_query)
      order by similarity desc
      limit p_match_count;
    return;
  end if;
end;
$function$;

revoke execute on function public.hv_search_artifacts(vector,vector,uuid,integer,text,vector) from public, anon;
grant execute on function public.hv_search_artifacts(vector,vector,uuid,integer,text,vector) to authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260607230000','hv_bge_m3_1024_dim_embedding_column_and_search','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260607230000_hv_bge_m3_1024_dim_embedding_column_and_search.sql

-- RECOVERY BEGIN 20260609000000_seed_countries_all_191_v1.sql
-- =============================================================================
-- seed_countries_all_191_v1
-- Seeds public.countries with all 191 Natural Earth countries.
-- This migration is idempotent: ON CONFLICT (iso_alpha2) DO UPDATE.
-- The table is created if it doesn't exist; the unique index is created
-- if it doesn't exist. Safe to re-run.
-- =============================================================================

-- Ensure the table exists (idempotent - no-op if already created)
CREATE TABLE IF NOT EXISTS public.countries (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name         text NOT NULL,
  country_slug         text NOT NULL,
  iso_alpha2           text NOT NULL,
  iso_alpha3           text,
  region               text,
  subregion            text,
  market_access_status text NOT NULL DEFAULT 'unknown',
  medical_status       text NOT NULL DEFAULT 'unknown',
  adult_use_status     text NOT NULL DEFAULT 'unknown',
  import_status        text NOT NULL DEFAULT 'unknown',
  export_status        text NOT NULL DEFAULT 'unknown',
  signals_status       text NOT NULL DEFAULT 'unknown',
  opportunity_status   text NOT NULL DEFAULT 'unknown',
  opportunity_score    integer NOT NULL DEFAULT 0,
  regulator_label      text,
  lat                  double precision,
  lng                  double precision,
  public_summary       text,
  data_completeness    text NOT NULL DEFAULT 'stub',
  last_updated_label   text,
  opportunity_categories text[],
  trade_roles          text[],
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Ensure unique constraint on iso_alpha2
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'countries_iso_alpha2_key'
      AND conrelid = 'public.countries'::regclass
  ) THEN
    ALTER TABLE public.countries ADD CONSTRAINT countries_iso_alpha2_key UNIQUE (iso_alpha2);
  END IF;
END $$;

-- Ensure unique constraint on country_slug
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'countries_country_slug_key'
      AND conrelid = 'public.countries'::regclass
  ) THEN
    ALTER TABLE public.countries ADD CONSTRAINT countries_country_slug_key UNIQUE (country_slug);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Public read policy (anon can read all rows)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'countries'
      AND policyname = 'countries_public_read'
  ) THEN
drop policy if exists countries_public_read on public.countries;
    CREATE POLICY countries_public_read ON public.countries
      FOR SELECT USING (true);
  END IF;
END $$;


INSERT INTO public.countries (
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  region,
  subregion,
  market_access_status,
  medical_status,
  adult_use_status,
  import_status,
  export_status,
  signals_status,
  opportunity_status,
  opportunity_score,
  regulator_label,
  lat,
  lng,
  public_summary,
  data_completeness
) VALUES
  ('United Arab Emirates', 'united-arab-emirates', 'AE', 'ARE', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 23.466, 54.547, 'United Arab Emirates maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Afghanistan', 'afghanistan', 'AF', 'AFG', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 34.164, 66.497, 'Afghanistan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Albania', 'albania', 'AL', 'ALB', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 40.655, 20.114, 'Albania cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Armenia', 'armenia', 'AM', 'ARM', 'Asia', 'Western Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 40.459, 44.801, 'Armenia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Angola', 'angola', 'AO', 'AGO', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -12.183, 17.984, 'Angola cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Argentina', 'argentina', 'AR', 'ARG', 'Americas', 'South America', 'regulated', 'active', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 64, 'ANMAT', -33.501, -64.173, 'Argentina operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Austria', 'austria', 'AT', 'AUT', 'Europe', 'Western Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'AGES', 47.519, 14.131, 'Austria operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Australia', 'australia', 'AU', 'AUS', 'Oceania', 'Australia and New Zealand', 'active', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 82, 'TGA/ODC', -24.13, 134.05, 'Australia has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Åland Islands', 'aland-islands', 'AX', 'ALD', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 60.156, 19.87, 'Åland Islands cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Azerbaijan', 'azerbaijan', 'AZ', 'AZE', 'Asia', 'Western Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 40.402, 47.211, 'Azerbaijan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Bosnia and Herzegovina', 'bosnia-and-herzegovina', 'BA', 'BIH', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 44.091, 18.068, 'Bosnia and Herzegovina cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Bangladesh', 'bangladesh', 'BD', 'BGD', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 24.215, 89.685, 'Bangladesh maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Belgium', 'belgium', 'BE', 'BEL', 'Europe', 'Western Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'FAMHP', 50.785, 4.8, 'Belgium operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Burkina Faso', 'burkina-faso', 'BF', 'BFA', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 12.673, -1.364, 'Burkina Faso cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Bulgaria', 'bulgaria', 'BG', 'BGR', 'Europe', 'Eastern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'BDA', 42.509, 25.157, 'Bulgaria operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Burundi', 'burundi', 'BI', 'BDI', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -3.333, 29.917, 'Burundi cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Benin', 'benin', 'BJ', 'BEN', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 10.325, 2.352, 'Benin cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Brunei', 'brunei', 'BN', 'BRN', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 4.448, 114.552, 'Brunei maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Bolivia', 'bolivia', 'BO', 'BOL', 'Americas', 'South America', 'limited', 'limited', 'restricted', 'restricted', 'unknown', 'unknown', 'unknown', 36, NULL, -16.666, -64.593, 'Bolivia has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Brazil', 'brazil', 'BR', 'BRA', 'Americas', 'South America', 'active', 'active', 'limited', 'active', 'unknown', 'unknown', 'unknown', 82, 'ANVISA', -12.099, -49.559, 'Brazil has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Bahamas', 'bahamas', 'BS', 'BHS', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 26.402, -77.147, 'Bahamas cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Bhutan', 'bhutan', 'BT', 'BTN', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 27.537, 90.04, 'Bhutan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Botswana', 'botswana', 'BW', 'BWA', 'Africa', 'Southern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -22.103, 24.179, 'Botswana cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Belarus', 'belarus', 'BY', 'BLR', 'Europe', 'Eastern Europe', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 53.822, 28.418, 'Belarus maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Belize', 'belize', 'BZ', 'BLZ', 'Americas', 'Central America', 'limited', 'unknown', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 17.202, -88.713, 'Belize has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Canada', 'canada', 'CA', 'CAN', 'Americas', 'Northern America', 'open', 'open', 'open', 'active', 'active', 'unknown', 'unknown', 95, 'Health Canada', 60.324, -101.911, 'Canada operates a legal cannabis market with both medical and adult-use frameworks active. Harbourview tracks regulatory signals, import/export pathways and commercial opportunities.', 'seed'),
  ('Democratic Republic of the Congo', 'democratic-republic-of-the-congo', 'CD', 'COD', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -1.858, 23.459, 'Democratic Republic of the Congo cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Central African Republic', 'central-african-republic', 'CF', 'CAF', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 6.99, 20.907, 'Central African Republic cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Republic of the Congo', 'republic-of-the-congo', 'CG', 'COG', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 0.142, 15.901, 'Republic of the Congo cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Switzerland', 'switzerland', 'CH', 'CHE', 'Europe', 'Western Europe', 'regulated', 'active', 'emerging', 'active', 'unknown', 'unknown', 'unknown', 64, 'Swissmedic', 46.719, 7.464, 'Switzerland operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Côte d''Ivoire', 'cote-d-ivoire', 'CI', 'CIV', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 7.491, -5.569, 'Côte d''Ivoire cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Chile', 'chile', 'CL', 'CHL', 'Americas', 'South America', 'regulated', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 64, 'ISP Chile', -38.152, -72.319, 'Chile operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Cameroon', 'cameroon', 'CM', 'CMR', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 4.585, 12.473, 'Cameroon cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('China', 'china', 'CN', 'CHN', 'Asia', 'Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'active', 'unknown', 'unknown', 22, NULL, 32.498, 106.337, 'China maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Colombia', 'colombia', 'CO', 'COL', 'Americas', 'South America', 'active', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 82, 'MinSalud/ICA', 3.373, -73.174, 'Colombia has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Costa Rica', 'costa-rica', 'CR', 'CRI', 'Americas', 'Central America', 'emerging', 'emerging', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 52, NULL, 10.065, -84.078, 'Costa Rica is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Cuba', 'cuba', 'CU', 'CUB', 'Americas', 'Caribbean', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 21.334, -77.976, 'Cuba maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Cape Verde', 'cape-verde', 'CV', 'CPV', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 15.075, -23.639, 'Cape Verde cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Cyprus', 'cyprus', 'CY', 'CYP', 'Asia', 'Western Asia', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'MPHS Cyprus', 34.913, 33.084, 'Cyprus operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Czechia', 'czechia', 'CZ', 'CZE', 'Europe', 'Eastern Europe', 'regulated', 'active', 'limited', 'active', 'unknown', 'unknown', 'unknown', 64, 'SÚKL', 49.882, 15.378, 'Czechia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Germany', 'germany', 'DE', 'DEU', 'Europe', 'Western Europe', 'active', 'active', 'emerging', 'active', 'active', 'unknown', 'unknown', 82, 'BfArM', 50.962, 9.678, 'Germany has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Djibouti', 'djibouti', 'DJ', 'DJI', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 11.976, 42.499, 'Djibouti cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Denmark', 'denmark', 'DK', 'DNK', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'DKMA', 55.967, 9.018, 'Denmark operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Dominica', 'dominica', 'DM', 'DMA', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 15.459, -61.345, 'Dominica cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Dominican Republic', 'dominican-republic', 'DO', 'DOM', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 19.104, -70.654, 'Dominican Republic cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Algeria', 'algeria', 'DZ', 'DZA', 'Africa', 'Northern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 27.397, 2.808, 'Algeria maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Ecuador', 'ecuador', 'EC', 'ECU', 'Americas', 'South America', 'regulated', 'active', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 64, 'ARCSA', -1.259, -78.188, 'Ecuador operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Estonia', 'estonia', 'EE', 'EST', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 64, 'SAM Estonia', 58.725, 25.867, 'Estonia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Egypt', 'egypt', 'EG', 'EGY', 'Africa', 'Northern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 26.186, 29.446, 'Egypt maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Western Sahara', 'western-sahara', 'EH', 'SAH', 'Africa', 'Northern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 23.968, -12.63, 'Western Sahara cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Eritrea', 'eritrea', 'ER', 'ERI', 'Africa', 'Eastern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 15.787, 38.286, 'Eritrea maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Spain', 'spain', 'ES', 'ESP', 'Europe', 'Southern Europe', 'regulated', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 64, 'AEMPS', 40.091, -3.465, 'Spain operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Ethiopia', 'ethiopia', 'ET', 'ETH', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 8.033, 39.089, 'Ethiopia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Finland', 'finland', 'FI', 'FIN', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'Fimea', 63.252, 27.276, 'Finland operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Fiji', 'fiji', 'FJ', 'FJI', 'Oceania', 'Melanesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -17.826, 177.975, 'Fiji cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Falkland Islands', 'falkland-islands', 'FK', 'FLK', 'Americas', 'South America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -51.609, -58.739, 'Falkland Islands cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Faroe Islands', 'faroe-islands', 'FO', 'FRO', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 62.186, -7.058, 'Faroe Islands cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('France', 'france', 'FR', 'FRA', 'Europe', 'Western Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'ANSM', 46.696, 2.552, 'France operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Gabon', 'gabon', 'GA', 'GAB', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -0.438, 11.836, 'Gabon cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('United Kingdom', 'united-kingdom', 'GB', 'GBR', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'MHRA', 54.403, -2.116, 'United Kingdom operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Georgia', 'georgia', 'GE', 'GEO', 'Asia', 'Western Asia', 'limited', 'limited', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 41.87, 43.736, 'Georgia has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Ghana', 'ghana', 'GH', 'GHA', 'Africa', 'Western Africa', 'emerging', 'emerging', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 52, NULL, 7.718, -1.037, 'Ghana is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Greenland', 'greenland', 'GL', 'GRL', 'Americas', 'Northern America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 74.319, -39.335, 'Greenland cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Gambia', 'gambia', 'GM', 'GMB', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 13.642, -14.998, 'Gambia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Guinea', 'guinea', 'GN', 'GIN', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 10.619, -10.016, 'Guinea cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Equatorial Guinea', 'equatorial-guinea', 'GQ', 'GNQ', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 2.333, 8.99, 'Equatorial Guinea cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Greece', 'greece', 'GR', 'GRC', 'Europe', 'Southern Europe', 'regulated', 'active', 'restricted', 'active', 'active', 'unknown', 'unknown', 64, 'EOF Greece', 39.493, 21.726, 'Greece operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('South Georgia', 'south-georgia', 'GS', 'SGS', 'Americas', 'South America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -55.683, -31.063, 'South Georgia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Guatemala', 'guatemala', 'GT', 'GTM', 'Americas', 'Central America', 'limited', 'limited', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 14.982, -90.497, 'Guatemala has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Guam', 'guam', 'GU', 'GUM', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 13.354, 144.704, 'Guam cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Guinea-Bissau', 'guinea-bissau', 'GW', 'GNB', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 12.164, -14.524, 'Guinea-Bissau cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Guyana', 'guyana', 'GY', 'GUY', 'Americas', 'South America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 5.124, -58.943, 'Guyana cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Hong Kong', 'hong-kong', 'HK', 'HKG', 'Asia', 'Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 22.449, 114.098, 'Hong Kong maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Heard Island', 'heard-island', 'HM', 'HMD', 'Oceania', 'Australia and New Zealand', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -53.103, 73.505, 'Heard Island cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Honduras', 'honduras', 'HN', 'HND', 'Americas', 'Central America', 'limited', 'limited', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 14.795, -86.888, 'Honduras has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Croatia', 'croatia', 'HR', 'HRV', 'Europe', 'Southern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'HALMED', 45.806, 16.372, 'Croatia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Haiti', 'haiti', 'HT', 'HTI', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 19.264, -72.224, 'Haiti cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Hungary', 'hungary', 'HU', 'HUN', 'Europe', 'Eastern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'OGYÉI', 47.087, 19.448, 'Hungary operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Indonesia', 'indonesia', 'ID', 'IDN', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, -0.954, 101.893, 'Indonesia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Ireland', 'ireland', 'IE', 'IRL', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'HPRA', 53.079, -7.799, 'Ireland operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Israel', 'israel', 'IL', 'ISR', 'Asia', 'Western Asia', 'active', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 82, 'IMCA', 30.911, 34.848, 'Israel has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Isle of Man', 'isle-of-man', 'IM', 'IMN', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 54.221, -4.53, 'Isle of Man cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('India', 'india', 'IN', 'IND', 'Asia', 'Southern Asia', 'limited', 'limited', 'restricted', 'active', 'active', 'unknown', 'unknown', 36, NULL, 22.687, 79.358, 'India has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Iraq', 'iraq', 'IQ', 'IRQ', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 33.094, 43.262, 'Iraq maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Iran', 'iran', 'IR', 'IRN', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 32.166, 54.931, 'Iran maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Iceland', 'iceland', 'IS', 'ISL', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'Lyfjastofnun', 64.779, -18.674, 'Iceland operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Italy', 'italy', 'IT', 'ITA', 'Europe', 'Southern Europe', 'active', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 82, 'AIFA', 44.732, 11.077, 'Italy has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Jamaica', 'jamaica', 'JM', 'JAM', 'Americas', 'Caribbean', 'limited', 'limited', 'limited', 'unknown', 'active', 'unknown', 'unknown', 36, 'CLA Jamaica', 18.137, -77.319, 'Jamaica has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Jordan', 'jordan', 'JO', 'JOR', 'Asia', 'Western Asia', 'regulated', 'active', 'restricted', 'active', 'active', 'unknown', 'unknown', 64, 'JFDA', 30.805, 36.376, 'Jordan operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Japan', 'japan', 'JP', 'JPN', 'Asia', 'Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 36.143, 138.442, 'Japan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Kenya', 'kenya', 'KE', 'KEN', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 0.549, 37.908, 'Kenya cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Kyrgyzstan', 'kyrgyzstan', 'KG', 'KGZ', 'Asia', 'Central Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 41.669, 74.533, 'Kyrgyzstan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Cambodia', 'cambodia', 'KH', 'KHM', 'Asia', 'South-Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 12.648, 104.505, 'Cambodia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Kiribati', 'kiribati', 'KI', 'KIR', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 1.82, -157.385, 'Kiribati cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Comoros', 'comoros', 'KM', 'COM', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -11.728, 43.318, 'Comoros cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('North Korea', 'north-korea', 'KP', 'PRK', 'Asia', 'Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 39.885, 126.445, 'North Korea maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('South Korea', 'south-korea', 'KR', 'KOR', 'Asia', 'Eastern Asia', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'MFDS', 36.385, 128.13, 'South Korea operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Kuwait', 'kuwait', 'KW', 'KWT', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 29.414, 47.314, 'Kuwait maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Kazakhstan', 'kazakhstan', 'KZ', 'KAZ', 'Asia', 'Central Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 49.054, 68.686, 'Kazakhstan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Laos', 'laos', 'LA', 'LAO', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 19.432, 102.534, 'Laos maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Lebanon', 'lebanon', 'LB', 'LBN', 'Asia', 'Western Asia', 'emerging', 'emerging', 'unknown', 'unknown', 'active', 'unknown', 'unknown', 52, NULL, 34.133, 35.993, 'Lebanon is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Saint Lucia', 'saint-lucia', 'LC', 'LCA', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 13.892, -60.98, 'Saint Lucia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Sri Lanka', 'sri-lanka', 'LK', 'LKA', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 7.581, 80.705, 'Sri Lanka maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Liberia', 'liberia', 'LR', 'LBR', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 6.447, -9.46, 'Liberia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Lesotho', 'lesotho', 'LS', 'LSO', 'Africa', 'Southern Africa', 'emerging', 'unknown', 'unknown', 'unknown', 'active', 'unknown', 'unknown', 52, NULL, -29.48, 28.247, 'Lesotho is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Lithuania', 'lithuania', 'LT', 'LTU', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'VVKT', 55.104, 24.09, 'Lithuania operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Luxembourg', 'luxembourg', 'LU', 'LUX', 'Europe', 'Western Europe', 'active', 'active', 'emerging', 'active', 'unknown', 'unknown', 'unknown', 82, 'AGSS', 49.734, 6.078, 'Luxembourg has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Latvia', 'latvia', 'LV', 'LVA', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'ZVA Latvia', 57.067, 25.459, 'Latvia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Libya', 'libya', 'LY', 'LBY', 'Africa', 'Northern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 26.639, 18.011, 'Libya maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Morocco', 'morocco', 'MA', 'MAR', 'Africa', 'Northern Africa', 'emerging', 'unknown', 'emerging', 'unknown', 'active', 'unknown', 'unknown', 52, NULL, 31.651, -7.187, 'Morocco is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Moldova', 'moldova', 'MD', 'MDA', 'Europe', 'Eastern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 47.435, 28.488, 'Moldova cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Montenegro', 'montenegro', 'ME', 'MNE', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 42.803, 19.144, 'Montenegro cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Madagascar', 'madagascar', 'MG', 'MDG', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -18.628, 46.704, 'Madagascar cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('North Macedonia', 'north-macedonia', 'MK', 'MKD', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 41.558, 21.556, 'North Macedonia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Mali', 'mali', 'ML', 'MLI', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 18.693, -2.038, 'Mali cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Myanmar', 'myanmar', 'MM', 'MMR', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 21.574, 95.804, 'Myanmar maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Mongolia', 'mongolia', 'MN', 'MNG', 'Asia', 'Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 45.997, 104.15, 'Mongolia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Mauritania', 'mauritania', 'MR', 'MRT', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 19.587, -9.74, 'Mauritania cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Mauritius', 'mauritius', 'MU', 'MUS', 'Africa', 'Eastern Africa', 'emerging', 'emerging', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 52, NULL, -20.3, 57.566, 'Mauritius is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Malawi', 'malawi', 'MW', 'MWI', 'Africa', 'Eastern Africa', 'emerging', 'unknown', 'unknown', 'unknown', 'active', 'unknown', 'unknown', 52, NULL, -13.387, 33.608, 'Malawi is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed'),
  ('Mexico', 'mexico', 'MX', 'MEX', 'Americas', 'Central America', 'regulated', 'active', 'emerging', 'active', 'active', 'unknown', 'unknown', 64, 'COFEPRIS', 23.92, -102.289, 'Mexico operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Malaysia', 'malaysia', 'MY', 'MYS', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 2.529, 113.837, 'Malaysia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Mozambique', 'mozambique', 'MZ', 'MOZ', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -13.943, 37.838, 'Mozambique cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Namibia', 'namibia', 'NA', 'NAM', 'Africa', 'Southern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -20.575, 17.108, 'Namibia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('New Caledonia', 'new-caledonia', 'NC', 'NCL', 'Oceania', 'Melanesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -21.065, 165.084, 'New Caledonia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Niger', 'niger', 'NE', 'NER', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 17.446, 9.504, 'Niger cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Nigeria', 'nigeria', 'NG', 'NGA', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 9.44, 7.503, 'Nigeria cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Nicaragua', 'nicaragua', 'NI', 'NIC', 'Americas', 'Central America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 12.671, -85.069, 'Nicaragua cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Netherlands', 'netherlands', 'NL', 'NLD', 'Europe', 'Western Europe', 'active', 'active', 'open', 'active', 'active', 'unknown', 'unknown', 82, 'CBG-MEB/Bedrocan', 52.422, 5.611, 'Netherlands has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Norway', 'norway', 'NO', 'NOR', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'NoMA', 61.357, 9.68, 'Norway operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Nepal', 'nepal', 'NP', 'NPL', 'Asia', 'Southern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 28.298, 83.64, 'Nepal cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('New Zealand', 'new-zealand', 'NZ', 'NZL', 'Oceania', 'Australia and New Zealand', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'Medsafe', -39.759, 172.787, 'New Zealand operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Oman', 'oman', 'OM', 'OMN', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 22.12, 57.337, 'Oman maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Panama', 'panama', 'PA', 'PAN', 'Americas', 'Central America', 'limited', 'limited', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 8.722, -80.352, 'Panama has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Peru', 'peru', 'PE', 'PER', 'Americas', 'South America', 'regulated', 'active', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 64, 'DIGEMID', -12.977, -72.9, 'Peru operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('French Polynesia', 'french-polynesia', 'PF', 'PYF', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -17.628, -149.462, 'French Polynesia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Papua New Guinea', 'papua-new-guinea', 'PG', 'PNG', 'Oceania', 'Melanesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -5.695, 143.91, 'Papua New Guinea cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Philippines', 'philippines', 'PH', 'PHL', 'Asia', 'South-Eastern Asia', 'limited', 'limited', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 36, 'FDA Philippines', 11.198, 122.465, 'Philippines has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Pakistan', 'pakistan', 'PK', 'PAK', 'Asia', 'Southern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 29.328, 68.546, 'Pakistan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Poland', 'poland', 'PL', 'POL', 'Europe', 'Eastern Europe', 'active', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 82, 'GIF Poland', 51.99, 19.49, 'Poland has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Puerto Rico', 'puerto-rico', 'PR', 'PRI', 'Americas', 'Caribbean', 'limited', 'limited', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 18.235, -66.481, 'Puerto Rico has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Palestine', 'palestine', 'PS', 'PSX', 'Asia', 'Western Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 32.047, 35.291, 'Palestine cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Portugal', 'portugal', 'PT', 'PRT', 'Europe', 'Southern Europe', 'active', 'active', 'restricted', 'active', 'active', 'unknown', 'unknown', 82, 'INFARMED', 39.607, -8.272, 'Portugal has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Paraguay', 'paraguay', 'PY', 'PRY', 'Americas', 'South America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -21.675, -60.146, 'Paraguay cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Qatar', 'qatar', 'QA', 'QAT', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 25.237, 51.144, 'Qatar maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Romania', 'romania', 'RO', 'ROU', 'Europe', 'Eastern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'ANMDM', 45.733, 24.973, 'Romania operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Serbia', 'serbia', 'RS', 'SRB', 'Europe', 'Southern Europe', 'regulated', 'active', 'restricted', 'unknown', 'unknown', 'unknown', 'unknown', 64, 'ALIMS', 44.19, 20.788, 'Serbia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Russia', 'russia', 'RU', 'RUS', 'Europe', 'Eastern Europe', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 58.249, 44.686, 'Russia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Rwanda', 'rwanda', 'RW', 'RWA', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -1.897, 30.104, 'Rwanda cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Saudi Arabia', 'saudi-arabia', 'SA', 'SAU', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 23.807, 44.7, 'Saudi Arabia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Solomon Islands', 'solomon-islands', 'SB', 'SLB', 'Oceania', 'Melanesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -8.03, 159.17, 'Solomon Islands cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Sudan', 'sudan', 'SD', 'SDN', 'Africa', 'Northern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 16.331, 29.261, 'Sudan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Sweden', 'sweden', 'SE', 'SWE', 'Europe', 'Northern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'MPA Sweden', 65.859, 19.017, 'Sweden operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Slovenia', 'slovenia', 'SI', 'SVN', 'Europe', 'Southern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'JAZMP', 46.061, 14.915, 'Slovenia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Slovakia', 'slovakia', 'SK', 'SVK', 'Europe', 'Eastern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, 'ŠÚKL', 48.734, 19.05, 'Slovakia operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Sierra Leone', 'sierra-leone', 'SL', 'SLE', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 8.617, -11.764, 'Sierra Leone cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Senegal', 'senegal', 'SN', 'SEN', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 15.138, -14.779, 'Senegal cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Somalia', 'somalia', 'SO', 'SOM', 'Africa', 'Eastern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 3.569, 45.192, 'Somalia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Suriname', 'suriname', 'SR', 'SUR', 'Americas', 'South America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 4.144, -55.911, 'Suriname cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('South Sudan', 'south-sudan', 'SS', 'SDS', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 7.23, 30.39, 'South Sudan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('São Tomé and Príncipe', 'sao-tome-and-principe', 'ST', 'STP', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 0.971, 7.021, 'São Tomé and Príncipe cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('El Salvador', 'el-salvador', 'SV', 'SLV', 'Americas', 'Central America', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 13.685, -88.89, 'El Salvador cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Syria', 'syria', 'SY', 'SYR', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 35.007, 38.278, 'Syria maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Eswatini', 'eswatini', 'SZ', 'SWZ', 'Africa', 'Southern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -26.534, 31.467, 'Eswatini cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Chad', 'chad', 'TD', 'TCD', 'Africa', 'Middle Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 15.143, 18.645, 'Chad cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('French Southern Territories', 'french-southern-territories', 'TF', 'ATF', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -49.304, 69.122, 'French Southern Territories cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Togo', 'togo', 'TG', 'TGO', 'Africa', 'Western Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 8.807, 1.058, 'Togo cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Thailand', 'thailand', 'TH', 'THA', 'Asia', 'South-Eastern Asia', 'active', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 82, 'Thai FDA', 15.46, 101.073, 'Thailand has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Tajikistan', 'tajikistan', 'TJ', 'TJK', 'Asia', 'Central Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 38.2, 72.587, 'Tajikistan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Timor-Leste', 'timor-leste', 'TL', 'TLS', 'Asia', 'South-Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -8.804, 125.855, 'Timor-Leste cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Turkmenistan', 'turkmenistan', 'TM', 'TKM', 'Asia', 'Central Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 39.855, 58.677, 'Turkmenistan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Tunisia', 'tunisia', 'TN', 'TUN', 'Africa', 'Northern Africa', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 33.687, 9.008, 'Tunisia maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Türkiye', 'turkiye', 'TR', 'TUR', 'Asia', 'Western Asia', 'regulated', 'active', 'restricted', 'active', 'active', 'unknown', 'unknown', 64, 'TITCK', 39.345, 34.508, 'Türkiye operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Trinidad and Tobago', 'trinidad-and-tobago', 'TT', 'TTO', 'Americas', 'Caribbean', 'limited', 'limited', 'limited', 'unknown', 'unknown', 'unknown', 'unknown', 36, NULL, 10.999, -60.918, 'Trinidad and Tobago has limited cannabis access, typically restricted to specific medical conditions or compassionate use programmes. Commercial routes are constrained.', 'seed'),
  ('Taiwan', 'taiwan', 'TW', 'TWN', 'Asia', 'Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 23.652, 120.868, 'Taiwan maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Tanzania', 'tanzania', 'TZ', 'TZA', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -6.052, 34.959, 'Tanzania cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Ukraine', 'ukraine', 'UA', 'UKR', 'Europe', 'Eastern Europe', 'regulated', 'active', 'restricted', 'active', 'unknown', 'unknown', 'unknown', 64, NULL, 49.725, 32.141, 'Ukraine operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Uganda', 'uganda', 'UG', 'UGA', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 1.973, 32.949, 'Uganda cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('United States', 'united-states', 'US', 'USA', 'Americas', 'Northern America', 'regulated', 'active', 'regulated', 'active', 'active', 'unknown', 'unknown', 64, 'DEA/FDA', 39.538, -97.483, 'United States operates a regulated cannabis access framework. Medical prescribing pathways exist. Detailed route intelligence is available through Harbourview reviewed briefing.', 'seed'),
  ('Uruguay', 'uruguay', 'UY', 'URY', 'Americas', 'South America', 'open', 'open', 'open', 'limited', 'limited', 'unknown', 'unknown', 95, 'IRCCA', -32.961, -55.967, 'Uruguay operates a legal cannabis market with both medical and adult-use frameworks active. Harbourview tracks regulatory signals, import/export pathways and commercial opportunities.', 'seed'),
  ('Uzbekistan', 'uzbekistan', 'UZ', 'UZB', 'Asia', 'Central Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 41.694, 64.005, 'Uzbekistan cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Venezuela', 'venezuela', 'VE', 'VEN', 'Americas', 'South America', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 7.182, -64.599, 'Venezuela maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('US Virgin Islands', 'us-virgin-islands', 'VI', 'VIR', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 17.747, -64.779, 'US Virgin Islands cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Vietnam', 'vietnam', 'VN', 'VNM', 'Asia', 'South-Eastern Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 21.715, 105.387, 'Vietnam maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('Vanuatu', 'vanuatu', 'VU', 'VUT', 'Oceania', 'Melanesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -15.372, 166.909, 'Vanuatu cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Samoa', 'samoa', 'WS', 'WSM', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -13.639, -172.438, 'Samoa cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Kosovo', 'kosovo', 'XK', 'KOS', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, 42.594, 20.861, 'Kosovo cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Yemen', 'yemen', 'YE', 'YEM', 'Asia', 'Western Asia', 'restricted', 'restricted', 'restricted', 'restricted', 'restricted', 'unknown', 'unknown', 22, NULL, 15.328, 45.874, 'Yemen maintains restricted or prohibited cannabis policy. No commercial cannabis import or export routes are publicly tracked. Harbourview monitors for policy change signals.', 'seed'),
  ('South Africa', 'south-africa', 'ZA', 'ZAF', 'Africa', 'Southern Africa', 'active', 'active', 'limited', 'active', 'active', 'unknown', 'unknown', 82, 'SAHPRA', -29.709, 23.666, 'South Africa has an active regulated cannabis market. Medical access pathways are operational. Import and/or export routes may be available for qualified operators.', 'seed'),
  ('Zambia', 'zambia', 'ZM', 'ZMB', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, NULL, -14.661, 26.395, 'Zambia cannabis regulatory status is unverified. Harbourview has not yet published a reviewed country brief. Intelligence requests can be submitted through the source engine.', 'stub'),
  ('Zimbabwe', 'zimbabwe', 'ZW', 'ZWE', 'Africa', 'Eastern Africa', 'emerging', 'unknown', 'unknown', 'unknown', 'active', 'unknown', 'unknown', 52, NULL, -18.912, 29.925, 'Zimbabwe is an emerging cannabis market with regulatory reform underway or anticipated. Harbourview monitors legislative and licensing developments.', 'seed')
ON CONFLICT (iso_alpha2) DO UPDATE SET
  country_name       = EXCLUDED.country_name,
  country_slug       = EXCLUDED.country_slug,
  iso_alpha3         = EXCLUDED.iso_alpha3,
  region             = EXCLUDED.region,
  subregion          = EXCLUDED.subregion,
  market_access_status = EXCLUDED.market_access_status,
  medical_status     = EXCLUDED.medical_status,
  adult_use_status   = EXCLUDED.adult_use_status,
  import_status      = EXCLUDED.import_status,
  export_status      = EXCLUDED.export_status,
  opportunity_score  = EXCLUDED.opportunity_score,
  regulator_label    = EXCLUDED.regulator_label,
  lat                = EXCLUDED.lat,
  lng                = EXCLUDED.lng,
  public_summary     = EXCLUDED.public_summary,
  data_completeness  = EXCLUDED.data_completeness
WHERE public.countries.data_completeness IN ('stub', 'seed', 'fixture');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260609000000','seed_countries_all_191_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260609000000_seed_countries_all_191_v1.sql

-- RECOVERY BEGIN 20260610000000_llm_rate_limits.sql
-- Migration: 20260610000000_llm_rate_limits.sql
-- Supabase-backed LLM rate limiting.
-- Replaces the previous in-memory Map() approach which resets on every
-- serverless cold start, making per-user rate limits ineffective.

-- ── Table ─────────────────────────────────────────────────────────────────────

create table if not exists public.llm_rate_limits (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer    not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, window_start)
);

-- Index for the cleanup job
create index if not exists idx_llm_rate_limits_window_start
  on public.llm_rate_limits (window_start);

-- RLS: only service role reads/writes this table (no direct user access)
alter table public.llm_rate_limits enable row level security;

comment on table public.llm_rate_limits is
  'Per-user per-minute LLM gateway rate limit counters. Service role only.';

-- ── Atomic upsert RPC ─────────────────────────────────────────────────────────
-- Returns { count, allowed, remaining, reset_at } as JSONB.
-- Uses INSERT ... ON CONFLICT to atomically increment the counter.

create or replace function public.check_and_increment_llm_rate_limit(
  p_user_id     uuid,
  p_window_start timestamptz,
  p_limit       integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count   integer;
  v_reset_at timestamptz;
begin
  v_reset_at := p_window_start + interval '1 minute';

  insert into public.llm_rate_limits (user_id, window_start, request_count, updated_at)
  values (p_user_id, p_window_start, 1, now())
  on conflict (user_id, window_start)
  do update set
    request_count = llm_rate_limits.request_count + 1,
    updated_at    = now()
  returning request_count into v_count;

  return jsonb_build_object(
    'count',     v_count,
    'allowed',   v_count <= p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'reset_at',  v_reset_at
  );
end;
$$;

comment on function public.check_and_increment_llm_rate_limit is
  'Atomically increments the LLM rate limit counter for a user in a given minute window.
   Returns count, allowed, remaining, and reset_at. Called by service role only.';

-- ── Cleanup: purge windows older than 2 hours (run via pg_cron or manually) ──
-- pg_cron job (if pg_cron is enabled):
-- select cron.schedule('llm-rate-limit-cleanup', '0 * * * *',
--   $$delete from public.llm_rate_limits where window_start < now() - interval '2 hours'$$);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260610000000','llm_rate_limits','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260610000000_llm_rate_limits.sql

-- RECOVERY BEGIN 20260611000000_health_canada_operator_registry.sql
-- Harbourview private Health Canada Canadian Licensed Operator Registry
-- Private admin/operator CRM + intelligence spine. No public marketplace exposure.

begin;

create extension if not exists pgcrypto;

create table if not exists public.health_canada_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_name text not null default 'Health Canada licensed cannabis cultivators, processors and sellers',
  source_url text not null,
  source_page_details_date date,
  source_fetched_at timestamptz not null default now(),
  source_confidence text not null default 'transcript_reconciled_hold'
    check (source_confidence in ('transcript_reconciled_hold','official_machine_parsed','manual_review','fixture')),
  source_package_name text,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.health_canada_raw_source_rows (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references public.health_canada_source_snapshots(id) on delete cascade,
  source_row_id text not null unique,
  source_row_index integer,
  raw_company_name text not null,
  normalized_company_name text not null,
  province text,
  status text not null default 'active'
    check (status in ('active','revoked_on_request','revoked_by_minister','expired','suspended','stale','review_required')),
  site_marker text,
  licence_class text,
  authorized_classes text,
  website text,
  phone text,
  raw_payload jsonb not null default '{}'::jsonb,
  row_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_canonical (
  id uuid primary key default gen_random_uuid(),
  canonical_operator_id text not null unique,
  canonical_name text not null,
  normalized_name text not null,
  primary_province text,
  track text not null check (track in (
    'integrated_operator','medical_processing','processor_cultivator','micro_craft',
    'nursery_starting_material','medical_only','strategic_corporate_cluster',
    'individual_name_verification_hold','exclusion','review_required'
  )),
  strategic_cluster boolean not null default false,
  medical_only boolean not null default false,
  individual_name_hold boolean not null default false,
  conflict_flag boolean not null default false,
  outreach_ready boolean not null default false,
  source_confidence text not null default 'transcript_reconciled_hold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_licence_sites (
  id uuid primary key default gen_random_uuid(),
  site_id text not null unique,
  canonical_operator_id text not null references public.canadian_operator_canonical(canonical_operator_id) on delete restrict,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  company_name text not null,
  province text,
  status text not null check (status in ('active','revoked_on_request','revoked_by_minister','expired','suspended','stale','review_required')),
  site_marker text,
  licence_class text,
  authorized_classes text,
  website text,
  phone text,
  track text not null,
  outreach_ready boolean not null default false,
  evidence_type text,
  review_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canadian_operator_site_exclusion_not_outreach_ready check (
    outreach_ready = false or status = 'active'
  )
);

create table if not exists public.canadian_operator_outreach_queue (
  id uuid primary key default gen_random_uuid(),
  outreach_queue_id text not null unique,
  canonical_operator_id text not null references public.canadian_operator_canonical(canonical_operator_id) on delete restrict,
  site_id text not null references public.canadian_operator_licence_sites(site_id) on delete restrict,
  send_order integer,
  queue_version text not null,
  track text not null,
  province text,
  evidence_type text not null,
  website text,
  phone text,
  first_contact_note text,
  outreach_ready boolean not null default true check (outreach_ready = true),
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_exclusions (
  id uuid primary key default gen_random_uuid(),
  exclusion_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  company_name text not null,
  province text,
  status text not null check (status in ('revoked_on_request','revoked_by_minister','expired','suspended')),
  exclusion_reason text not null,
  outreach_ready boolean not null default false check (outreach_ready = false),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_duplicate_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_id text not null,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  site_id text references public.canadian_operator_licence_sites(site_id) on delete set null,
  cluster_type text not null check (cluster_type in ('duplicate','second_site','third_site','strategic_corporate','brand_alias','status_conflict','review_required')),
  member_label text not null,
  notes text,
  review_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (cluster_id, member_label)
);

create table if not exists public.canadian_operator_conflicts (
  id uuid primary key default gen_random_uuid(),
  conflict_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  site_id text references public.canadian_operator_licence_sites(site_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  conflict_type text not null check (conflict_type in ('active_vs_revoked','active_vs_expired','status_mismatch','duplicate_ambiguity','legal_name_ambiguity','source_mismatch','stale_row','review_required')),
  conflict_status text not null default 'open' check (conflict_status in ('open','reviewing','resolved','deferred')),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.canadian_operator_individual_holds (
  id uuid primary key default gen_random_uuid(),
  hold_id text not null unique,
  canonical_operator_id text references public.canadian_operator_canonical(canonical_operator_id) on delete set null,
  source_row_id text references public.health_canada_raw_source_rows(source_row_id) on delete set null,
  individual_name text not null,
  province text,
  status text not null default 'active',
  verification_status text not null default 'business_identity_required'
    check (verification_status in ('business_identity_required','public_business_contact_required','cleared','excluded')),
  outreach_ready boolean not null default false check (outreach_ready = false),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists health_canada_raw_rows_snapshot_idx on public.health_canada_raw_source_rows(source_snapshot_id, source_row_index);
create index if not exists health_canada_raw_rows_status_idx on public.health_canada_raw_source_rows(status, province);
create index if not exists canadian_operator_canonical_track_idx on public.canadian_operator_canonical(track, outreach_ready);
create index if not exists canadian_operator_sites_operator_idx on public.canadian_operator_licence_sites(canonical_operator_id, status);
create index if not exists canadian_operator_outreach_order_idx on public.canadian_operator_outreach_queue(queue_version, send_order);
create index if not exists canadian_operator_exclusions_status_idx on public.canadian_operator_exclusions(status, province);
create index if not exists canadian_operator_clusters_id_idx on public.canadian_operator_duplicate_clusters(cluster_id);
create index if not exists canadian_operator_conflicts_status_idx on public.canadian_operator_conflicts(conflict_status, conflict_type);

alter table public.health_canada_source_snapshots enable row level security;
alter table public.health_canada_raw_source_rows enable row level security;
alter table public.canadian_operator_canonical enable row level security;
alter table public.canadian_operator_licence_sites enable row level security;
alter table public.canadian_operator_outreach_queue enable row level security;
alter table public.canadian_operator_exclusions enable row level security;
alter table public.canadian_operator_duplicate_clusters enable row level security;
alter table public.canadian_operator_conflicts enable row level security;
alter table public.canadian_operator_individual_holds enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'health_canada_source_snapshots','health_canada_raw_source_rows','canadian_operator_canonical',
    'canadian_operator_licence_sites','canadian_operator_outreach_queue','canadian_operator_exclusions',
    'canadian_operator_duplicate_clusters','canadian_operator_conflicts','canadian_operator_individual_holds'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_operator_all', table_name);
    execute format($policy$
      create policy %I on public.%I
        for all
        using (
          exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
              and user_roles.role in ('admin','operator')
          )
        )
        with check (
          exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
              and user_roles.role in ('admin','operator')
          )
        )
    $policy$, table_name || '_admin_operator_all', table_name);
  end loop;
end $$;

revoke all on public.health_canada_source_snapshots from anon;
revoke all on public.health_canada_raw_source_rows from anon;
revoke all on public.canadian_operator_canonical from anon;
revoke all on public.canadian_operator_licence_sites from anon;
revoke all on public.canadian_operator_outreach_queue from anon;
revoke all on public.canadian_operator_exclusions from anon;
revoke all on public.canadian_operator_duplicate_clusters from anon;
revoke all on public.canadian_operator_conflicts from anon;
revoke all on public.canadian_operator_individual_holds from anon;

grant select, insert, update on public.health_canada_source_snapshots to authenticated;
grant select, insert, update on public.health_canada_raw_source_rows to authenticated;
grant select, insert, update on public.canadian_operator_canonical to authenticated;
grant select, insert, update on public.canadian_operator_licence_sites to authenticated;
grant select, insert, update on public.canadian_operator_outreach_queue to authenticated;
grant select, insert, update on public.canadian_operator_exclusions to authenticated;
grant select, insert, update on public.canadian_operator_duplicate_clusters to authenticated;
grant select, insert, update on public.canadian_operator_conflicts to authenticated;
grant select, insert, update on public.canadian_operator_individual_holds to authenticated;

comment on table public.health_canada_raw_source_rows is 'Private Health Canada source evidence rows. Never expose through public marketplace DTOs, public APIs, public HTML, or client bundles.';
comment on table public.canadian_operator_outreach_queue is 'Private Harbourview operator outreach queue. Admin/operator only; no public supplier directory exposure.';
comment on table public.canadian_operator_conflicts is 'Private active/revoked/stale/duplicate conflict ledger. Preserve evidence instead of deleting rows.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611000000','health_canada_operator_registry','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611000000_health_canada_operator_registry.sql

-- RECOVERY BEGIN 20260611100000_country_data_identity_global.sql
-- Harbourview global country-data identity layer.
-- Scope: identity-only country pages. Regulated-market claims remain review-pending.

create table if not exists public.jurisdictions (
  jurisdiction_id text primary key,
  slug text not null unique,
  canonical_name text not null,
  display_name text not null,
  iso_alpha3 text,
  un_region_name text,
  un_subregion_name text,
  jurisdiction_type text not null default 'country_or_area',
  identity_verification_status text not null default 'verified_identity_only',
  data_release_status text not null default 'seeded_identity_pending_regulated_market_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.country_profiles_public (
  profile_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  slug text not null unique,
  public_display_name text not null,
  public_region text,
  public_subregion text,
  public_status_label text,
  medical_cannabis_status_public text,
  adult_use_cannabis_status_public text,
  hemp_status_public text,
  import_export_status_public text,
  licensing_status_public text,
  public_summary text,
  confidence_band_public text,
  last_identity_verified_at date,
  last_regulatory_verified_at date,
  public_dto_allowed boolean not null default true,
  admin_evidence_excluded_from_public boolean not null default true
);

create table if not exists public.source_documents (
  source_document_id text primary key,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id),
  source_url text,
  evidence_status text not null,
  admin_only_notes text
);

create table if not exists public.country_regulatory_profiles_admin (
  regulatory_profile_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  review_status text not null default 'missing_primary_source_review_required',
  evidence_summary text,
  reviewer_id text
);

create table if not exists public.country_coverage_matrix (
  coverage_id text primary key,
  jurisdiction_id text not null references public.jurisdictions(jurisdiction_id) on delete cascade,
  identity_core text not null,
  public_country_page_ready text,
  admin_review_required boolean not null default true,
  overall_release_gate text not null
);

create table if not exists public.review_queue (
  review_id text primary key,
  jurisdiction_id text references public.jurisdictions(jurisdiction_id),
  country_or_area text not null,
  priority text not null,
  review_type text not null,
  blocking_fields text,
  reason text,
  recommended_next_action text,
  public_release_blocker boolean not null default true,
  created_at date not null default current_date
);

create table if not exists public.country_data_import_runs (
  import_run_id text primary key,
  package_name text not null,
  package_version text not null,
  source_zip_name text,
  expected_jurisdiction_count integer not null,
  loaded_jurisdiction_count integer,
  dry_run boolean not null default true,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null,
  evidence_json jsonb not null default '{}'::jsonb
);

create or replace view public.public_country_profile_dto as
select j.jurisdiction_id, j.slug, p.public_display_name, p.public_region, p.public_subregion, p.public_status_label, p.medical_cannabis_status_public, p.adult_use_cannabis_status_public, p.hemp_status_public, p.import_export_status_public, p.licensing_status_public, p.public_summary, p.confidence_band_public, p.last_identity_verified_at, p.last_regulatory_verified_at
from public.jurisdictions j
join public.country_profiles_public p on p.jurisdiction_id = j.jurisdiction_id
where p.public_dto_allowed = true;

alter table public.jurisdictions enable row level security;
alter table public.country_profiles_public enable row level security;
alter table public.source_documents enable row level security;
alter table public.country_regulatory_profiles_admin enable row level security;
alter table public.country_coverage_matrix enable row level security;
alter table public.review_queue enable row level security;
alter table public.country_data_import_runs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'country_profiles_public' and policyname = 'public read country profiles public') then
drop policy if exists "public read country profiles public" on public.country_profiles_public;
    create policy "public read country profiles public" on public.country_profiles_public for select using (public_dto_allowed = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'jurisdictions' and policyname = 'public read jurisdictions for country dto') then
drop policy if exists "public read jurisdictions for country dto" on public.jurisdictions;
    create policy "public read jurisdictions for country dto" on public.jurisdictions for select using (data_release_status = 'seeded_identity_pending_regulated_market_review');
  end if;
end $$;

grant select on public.public_country_profile_dto to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611100000','country_data_identity_global','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611100000_country_data_identity_global.sql

-- RECOVERY BEGIN 20260611103000_workspace_foundation_replay.sql
-- Replay-safe workspace foundation recovered from the production schema.
-- The canonical Harbourview workspace is a structural seed referenced by
-- existing search-function defaults and does not grant membership by itself.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now(),
  slug text unique,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  updated_at timestamptz not null default now(),
  legal_name text,
  trade_name text,
  org_type text check (
    org_type is null or org_type in (
      'supplier','buyer','broker','lab','pharmacy','clinic','equipment','service',
      'financial','distributor','exporter','importer'
    )
  ),
  jurisdiction_country text,
  jurisdiction_region text,
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified','pending_review','verified','suspended','revoked')
  ),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  is_public boolean not null default false
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operator','analyst','viewer')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','invited','suspended','removed')),
  invited_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

insert into public.workspaces (id, name, slug, status, settings, verification_status, is_public)
values (
  'a85840b4-c522-4cb8-9097-2f6c30a78417'::uuid,
  'Harbourview',
  'harbourview',
  'active',
  '{}'::jsonb,
  'unverified',
  false
)
on conflict (id) do update set
  name = excluded.name,
  slug = coalesce(public.workspaces.slug, excluded.slug),
  updated_at = now();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
revoke all on table public.workspaces from public, anon;
revoke all on table public.workspace_members from public, anon;
grant select on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;
grant all on table public.workspaces to service_role;
grant all on table public.workspace_members to service_role;

drop policy if exists workspace_members_read on public.workspace_members;
create policy workspace_members_read
  on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_member_select
  on public.workspaces for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members member
      where member.workspace_id = workspaces.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );

-- Restore production-equivalent foreign keys when the artifact tables already exist.
do $workspace_artifact_fks$
begin
  if to_regclass('public.hv_artifacts') is not null
    and not exists (select 1 from pg_constraint where conname = 'hv_artifacts_workspace_id_fkey')
  then
    alter table public.hv_artifacts
      add constraint hv_artifacts_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id);
  end if;
  if to_regclass('public.hv_embeddings') is not null
    and not exists (select 1 from pg_constraint where conname = 'hv_embeddings_workspace_id_fkey')
  then
    alter table public.hv_embeddings
      add constraint hv_embeddings_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id);
  end if;
end
$workspace_artifact_fks$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611103000','workspace_foundation_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611103000_workspace_foundation_replay.sql

-- RECOVERY BEGIN 20260611103722_cc_access_pathway_schema.sql
-- cc_access_pathway_schema: Access Pathway Command Centre tables
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create table if not exists public.cc_pathway_templates (
  id           uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  role_id      text not null,
  name         text not null,
  description  text,
  total_steps  int  not null default 6,
  is_active    bool not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (country_iso2, role_id)
);

create table if not exists public.cc_pathway_steps (
  id               uuid primary key default gen_random_uuid(),
  template_id      uuid not null references public.cc_pathway_templates(id) on delete cascade,
  step_number      int  not null,
  title            text not null,
  description      text,
  unlock_condition text not null default 'previous_step_complete',
  created_at       timestamptz not null default now(),
  unique (template_id, step_number)
);

create table if not exists public.cc_pathway_step_requirements (
  id            uuid primary key default gen_random_uuid(),
  step_id       uuid not null references public.cc_pathway_steps(id) on delete cascade,
  title         text not null,
  description   text,
  evidence_type text not null default 'document',
  is_required   bool not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.cc_org_pathway_progress (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null,
  template_id    uuid not null references public.cc_pathway_templates(id),
  current_step   int  not null default 1,
  status         text not null default 'in_progress',
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  last_action_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, template_id)
);

create table if not exists public.cc_org_requirement_status (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null,
  requirement_id       uuid not null references public.cc_pathway_step_requirements(id),
  status               text not null default 'pending',
  evidence_document_id uuid,
  licence_id           uuid,
  notes                text,
  submitted_at         timestamptz,
  reviewed_at          timestamptz,
  reviewed_by          uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (org_id, requirement_id)
);

create index if not exists cc_pathway_steps_template_id_idx
  on public.cc_pathway_steps(template_id);
create index if not exists cc_pathway_step_reqs_step_id_idx
  on public.cc_pathway_step_requirements(step_id);
create index if not exists cc_org_pathway_progress_org_id_idx
  on public.cc_org_pathway_progress(org_id);
create index if not exists cc_org_pathway_progress_template_id_idx
  on public.cc_org_pathway_progress(template_id);
create index if not exists cc_org_req_status_org_id_idx
  on public.cc_org_requirement_status(org_id);
create index if not exists cc_org_req_status_requirement_id_idx
  on public.cc_org_requirement_status(requirement_id);
create index if not exists cc_org_req_status_status_idx
  on public.cc_org_requirement_status(status)
  where status in ('in_review', 'verified');

alter table public.cc_pathway_templates         enable row level security;
alter table public.cc_pathway_steps             enable row level security;
alter table public.cc_pathway_step_requirements enable row level security;
alter table public.cc_org_pathway_progress      enable row level security;
alter table public.cc_org_requirement_status    enable row level security;

drop policy if exists cc_pathway_templates_auth_read         on public.cc_pathway_templates;
drop policy if exists cc_pathway_steps_auth_read             on public.cc_pathway_steps;
drop policy if exists cc_pathway_step_reqs_auth_read         on public.cc_pathway_step_requirements;
drop policy if exists cc_org_pathway_progress_member_read    on public.cc_org_pathway_progress;
drop policy if exists cc_org_pathway_progress_member_insert  on public.cc_org_pathway_progress;
drop policy if exists cc_org_pathway_progress_member_update  on public.cc_org_pathway_progress;
drop policy if exists cc_org_req_status_member_read          on public.cc_org_requirement_status;
drop policy if exists cc_org_req_status_member_insert        on public.cc_org_requirement_status;
drop policy if exists cc_org_req_status_member_update        on public.cc_org_requirement_status;

create policy cc_pathway_templates_auth_read
  on public.cc_pathway_templates for select to authenticated using (is_active = true);
create policy cc_pathway_steps_auth_read
  on public.cc_pathway_steps for select to authenticated using (true);
create policy cc_pathway_step_reqs_auth_read
  on public.cc_pathway_step_requirements for select to authenticated using (true);
create policy cc_org_pathway_progress_member_read
  on public.cc_org_pathway_progress for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_pathway_progress_member_insert
  on public.cc_org_pathway_progress for insert to authenticated
  with check (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_pathway_progress_member_update
  on public.cc_org_pathway_progress for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_read
  on public.cc_org_requirement_status for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_insert
  on public.cc_org_requirement_status for insert to authenticated
  with check (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_org_req_status_member_update
  on public.cc_org_requirement_status for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611103722','cc_access_pathway_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611103722_cc_access_pathway_schema.sql

-- RECOVERY BEGIN 20260611130000_education_intelligence_foundation.sql
-- Harbourview Global Education Intelligence Foundation
-- Additive-only first PR: schema, review gates, RLS-deny public raw table access.

create extension if not exists pgcrypto;

do $$ begin create type education_role as enum ('doctor','pharmacist','clinic','patient_general','licensed_producer','supplier','buyer_importer','distributor','lab','packaging_vendor','equipment_vendor','investor','regulator_policy','admin_operator'); exception when duplicate_object then null; end $$;
do $$ begin create type education_claim_type as enum ('medical_scientific','clinical_workflow','dosage_reference','pharmacist_workflow','legal_regulatory','import_export','licensing','quality_manufacturing','commercial_marketplace','glossary_definition','safety','jurisdiction_summary','professional_obligation'); exception when duplicate_object then null; end $$;
do $$ begin create type education_review_status as enum ('verified_primary_source','verified_professional_body','verified_peer_reviewed','verified_secondary_source','conflicting_sources','stale_source','jurisdiction_unclear','clinical_review_required','legal_review_required','review_pending','do_not_publish'); exception when duplicate_object then null; end $$;
do $$ begin create type education_evidence_grade as enum ('A_primary_binding','B_primary_guidance','C_professional_guideline','D_peer_reviewed','E_quality_standard','F_secondary_context','G_discovery_only','X_conflict_or_unverified'); exception when duplicate_object then null; end $$;
do $$ begin create type education_visibility as enum ('public','professional','commercial_user','admin_only','hidden'); exception when duplicate_object then null; end $$;

create or replace function public.education_has_review_role(allowed_roles text[] default array['admin','operator','analyst'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(allowed_roles)
  );
$$;

create or replace function public.education_can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.education_has_review_role(array['admin','operator']);
$$;

create table if not exists education_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  parent_id uuid references education_topics(id),
  title text not null,
  domain text not null,
  description text,
  default_visibility education_visibility not null default 'public',
  risk_level text not null default 'low',
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  module_type text not null,
  audience_roles education_role[] not null,
  topic_id uuid references education_topics(id),
  jurisdiction_scope text[] default array['GLOBAL'],
  required_review_status education_review_status[] not null default array['verified_primary_source']::education_review_status[],
  public_summary text,
  route_path text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_title text not null,
  source_owner text not null,
  source_owner_type text not null,
  source_url text not null,
  source_country text,
  source_jurisdiction text,
  source_language text,
  source_type text not null,
  evidence_grade education_evidence_grade not null,
  authority_tier integer not null,
  last_accessed_at timestamptz,
  published_at date,
  updated_at_source date,
  freshness_window_days integer not null default 90,
  archive_uri text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_claims (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  topic_id uuid references education_topics(id),
  claim_type education_claim_type not null,
  claim_text text not null,
  public_safe_summary text,
  jurisdiction_scope text[] not null default array['GLOBAL'],
  subjurisdiction_scope text[],
  audience_roles education_role[] not null,
  visibility education_visibility not null default 'admin_only',
  evidence_grade education_evidence_grade not null default 'X_conflict_or_unverified',
  review_status education_review_status not null default 'review_pending',
  medical_risk_level text not null default 'none',
  legal_risk_level text not null default 'none',
  commercial_risk_level text not null default 'none',
  freshness_window_days integer not null default 90,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  reviewer text,
  admin_notes text,
  conflict_notes text,
  do_not_publish_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists education_claim_sources (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references education_claims(id) on delete cascade,
  source_id uuid not null references education_source_registry(id) on delete restrict,
  support_type text not null,
  source_excerpt text,
  source_location text,
  confidence numeric(4,3) not null default 0.500,
  is_primary_support boolean not null default false,
  created_at timestamptz not null default now(),
  unique (claim_id, source_id, support_type)
);

create table if not exists jurisdiction_overlays (
  id uuid primary key default gen_random_uuid(),
  overlay_key text not null unique,
  jurisdiction_code text not null,
  jurisdiction_name text not null,
  parent_jurisdiction_code text,
  jurisdiction_type text not null,
  topic_id uuid references education_topics(id),
  module_id uuid references education_modules(id),
  overlay_summary text,
  applies_to_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  source_status text not null default 'missing',
  is_public_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists role_overlays (
  id uuid primary key default gen_random_uuid(),
  role education_role not null,
  topic_id uuid references education_topics(id),
  module_id uuid references education_modules(id),
  display_priority integer not null default 100,
  required_claim_types education_claim_type[],
  hidden_claim_types education_claim_type[],
  intro_copy text,
  checklist_enabled boolean not null default false,
  professional_warning_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (role, topic_id, module_id)
);

create table if not exists glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  slug text not null unique,
  short_definition text not null,
  expanded_definition text,
  topic_id uuid references education_topics(id),
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dosage_reference_tables (
  id uuid primary key default gen_random_uuid(),
  dosage_key text not null unique,
  substance text not null,
  product_form text,
  route text,
  population_scope text,
  condition_scope text,
  reference_text text not null,
  unit text,
  jurisdiction_scope text[] not null default array['GLOBAL'],
  audience_roles education_role[] not null default array['doctor','pharmacist']::education_role[],
  evidence_grade education_evidence_grade not null default 'X_conflict_or_unverified',
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  public_rendering_mode text not null default 'show_professional_only',
  warning_text text,
  last_verified_at timestamptz,
  next_review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_form_tables (
  id uuid primary key default gen_random_uuid(),
  form_key text not null unique,
  product_form text not null,
  route text,
  onset_range_text text,
  duration_range_text text,
  bioavailability_text text,
  counseling_points text,
  risk_notes text,
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists condition_evidence_map (
  id uuid primary key default gen_random_uuid(),
  condition_key text not null unique,
  condition_name text not null,
  evidence_summary text,
  approved_product_notes text,
  evidence_strength text not null default 'review_pending',
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null default array['doctor','pharmacist','patient_general']::education_role[],
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interaction_references (
  id uuid primary key default gen_random_uuid(),
  interaction_key text not null unique,
  substance_or_class text not null,
  cannabinoid_or_product text,
  mechanism_text text,
  severity text,
  counseling_text text,
  escalation_text text,
  audience_roles education_role[] not null default array['doctor','pharmacist']::education_role[],
  review_status education_review_status not null default 'clinical_review_required',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists professional_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null unique,
  role education_role not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  workflow_title text not null,
  workflow_steps jsonb not null default '[]'::jsonb,
  checklist_items jsonb not null default '[]'::jsonb,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commercial_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null unique,
  workflow_type text not null,
  audience_roles education_role[] not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  workflow_title text not null,
  workflow_steps jsonb not null default '[]'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'commercial_user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quality_standards (
  id uuid primary key default gen_random_uuid(),
  standard_key text not null unique,
  standard_name text not null,
  standard_family text not null,
  jurisdiction_scope text[] default array['GLOBAL'],
  summary text,
  applies_to text[],
  evidence_grade education_evidence_grade not null default 'E_quality_standard',
  review_status education_review_status not null default 'review_pending',
  visibility education_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists import_export_guides (
  id uuid primary key default gen_random_uuid(),
  guide_key text not null unique,
  origin_jurisdiction text,
  destination_jurisdiction text not null,
  product_category text,
  guide_summary text,
  required_documents jsonb not null default '[]'::jsonb,
  regulator_links jsonb not null default '[]'::jsonb,
  customs_notes text,
  review_status education_review_status not null default 'legal_review_required',
  visibility education_visibility not null default 'commercial_user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public_content_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  module_id uuid references education_modules(id),
  topic_id uuid references education_topics(id),
  title text not null,
  body text not null,
  claim_keys text[] not null default '{}',
  jurisdiction_scope text[] default array['GLOBAL'],
  audience_roles education_role[] not null,
  visibility education_visibility not null default 'public',
  publish_status text not null default 'draft',
  generated_from_claims boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  queue_key text not null unique,
  entity_type text not null,
  entity_key text not null,
  review_reason text not null,
  assigned_role text,
  priority integer not null default 100,
  status text not null default 'open',
  due_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists source_conflicts (
  id uuid primary key default gen_random_uuid(),
  conflict_key text not null unique,
  claim_id uuid references education_claims(id),
  conflict_summary text not null,
  source_ids uuid[] not null,
  severity text not null default 'medium',
  resolution_status text not null default 'unresolved',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists freshness_checks (
  id uuid primary key default gen_random_uuid(),
  check_key text not null unique,
  entity_type text not null,
  entity_key text not null,
  source_key text,
  last_checked_at timestamptz,
  next_check_due_at timestamptz,
  freshness_status text not null default 'unknown',
  http_status integer,
  source_changed boolean,
  change_summary text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_key text not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_education_claims_review on education_claims(review_status, visibility);
create index if not exists idx_education_claims_roles on education_claims using gin(audience_roles);
create index if not exists idx_education_claims_jurisdiction on education_claims using gin(jurisdiction_scope);
create index if not exists idx_public_content_blocks_publish on public_content_blocks(publish_status, visibility);

alter table education_topics enable row level security;
alter table education_modules enable row level security;
alter table education_source_registry enable row level security;
alter table education_claims enable row level security;
alter table education_claim_sources enable row level security;
alter table jurisdiction_overlays enable row level security;
alter table role_overlays enable row level security;
alter table glossary_terms enable row level security;
alter table dosage_reference_tables enable row level security;
alter table product_form_tables enable row level security;
alter table condition_evidence_map enable row level security;
alter table interaction_references enable row level security;
alter table professional_workflows enable row level security;
alter table commercial_workflows enable row level security;
alter table quality_standards enable row level security;
alter table import_export_guides enable row level security;
alter table public_content_blocks enable row level security;
alter table review_queue enable row level security;
alter table source_conflicts enable row level security;
alter table freshness_checks enable row level security;
alter table audit_log enable row level security;

revoke all on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log from anon;
revoke all on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log from authenticated;

grant select, insert, update, delete on education_topics, education_modules, education_source_registry, education_claims, education_claim_sources, jurisdiction_overlays, role_overlays, glossary_terms, dosage_reference_tables, product_form_tables, condition_evidence_map, interaction_references, professional_workflows, commercial_workflows, quality_standards, import_export_guides, public_content_blocks, review_queue, source_conflicts, freshness_checks, audit_log to authenticated;

do $$
declare t text;
begin
  foreach t in array array['education_topics','education_modules','education_source_registry','education_claims','education_claim_sources','jurisdiction_overlays','role_overlays','glossary_terms','dosage_reference_tables','product_form_tables','condition_evidence_map','interaction_references','professional_workflows','commercial_workflows','quality_standards','import_export_guides','public_content_blocks','review_queue','source_conflicts','freshness_checks','audit_log'] loop
    execute format('drop policy if exists %I on %I', t || '_review_select', t);
    execute format('drop policy if exists %I on %I', t || '_manager_write', t);
    execute format('create policy %I on %I for select to authenticated using (public.education_has_review_role())', t || '_review_select', t);
    execute format('create policy %I on %I for all to authenticated using (public.education_can_manage()) with check (public.education_can_manage())', t || '_manager_write', t);
  end loop;
end $$;

comment on table education_claims is 'Harbourview education claim-control table. Public output must use server-side DTO allowlisting or public-safe content surfaces only.';
comment on table education_claim_sources is 'Admin evidence mapping. No anonymous/public raw access.';
comment on table review_queue is 'Admin-only education review queue.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611130000','education_intelligence_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611130000_education_intelligence_foundation.sql

-- RECOVERY BEGIN 20260611150000_enable_pg_cron.sql
-- Supabase production uses pg_cron for source, alert, digest and housekeeping
-- schedules. Restore that extension before the first scheduler migration so a
-- zero-state repository replay matches the managed production environment.

create extension if not exists pg_cron;

revoke all on schema cron from public, anon, authenticated;
grant usage on schema cron to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611150000','enable_pg_cron','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611150000_enable_pg_cron.sql

-- RECOVERY BEGIN 20260611153902_create_hv_source_pull_trigger.sql
-- create_hv_source_pull_trigger: pg_net edge function trigger + optional cron schedule
-- The trigger function is always installed. The recurring schedule is installed only
-- where the Supabase pg_cron extension and cron.job catalog are available.

create or replace function public.hv_trigger_source_pull_runner()
returns bigint
language sql
security definer
set search_path = 'public', 'net'
as $$
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-source-pull-runner',
    params := jsonb_build_object('tier','2','adapter','rss','limit','3'),
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-harbourview-cron-caller','pg_cron_hv_source_pull_runner'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$$;

revoke execute on function public.hv_trigger_source_pull_runner() from public, anon, authenticated;
grant execute on function public.hv_trigger_source_pull_runner() to service_role;

do $source_pull_schedule$
declare
  job_exists boolean;
begin
  if to_regclass('cron.job') is null
    or to_regprocedure('cron.schedule(text,text,text)') is null
  then
    raise notice 'pg_cron unavailable; hv-source-pull-runner schedule not installed in this environment';
    return;
  end if;

  execute 'select exists (select 1 from cron.job where jobname = $1)'
    into job_exists
    using 'hv-source-pull-runner-safe-rss';

  if not job_exists then
    perform cron.schedule(
      'hv-source-pull-runner-safe-rss',
      '*/30 * * * *',
      'select public.hv_trigger_source_pull_runner();'
    );
  end if;
end
$source_pull_schedule$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611153902','create_hv_source_pull_trigger','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611153902_create_hv_source_pull_trigger.sql

-- RECOVERY BEGIN 20260611154720_create_hv_quarantine_repeated_source_failures.sql
-- create_hv_quarantine_repeated_source_failures: auto-blocks sources with repeated fetch errors
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create or replace function public.hv_quarantine_repeated_source_failures(
  min_failures integer default 3,
  lookback     interval default '7 days'
)
returns table(source_id uuid, failure_count bigint)
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  return query
  with repeated_failures as (
    select ss.source_id, count(*)::bigint as failure_count
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    where ss.source_id is not null
      and ss.fetch_status = 'error'
      and ss.created_at >= now() - lookback
      and sr.relevance_status = 'active'
    group by ss.source_id
    having count(*) >= min_failures
  ), updated as (
    update public.source_registry sr
    set relevance_status = 'blocked',
        updated_at       = now(),
        notes            = concat_ws(E'\n', nullif(sr.notes, ''),
          'Auto-quarantined after repeated source pull failures. Review URL or adapter before reactivation.')
    from repeated_failures rf
    where sr.id = rf.source_id
    returning sr.id, rf.failure_count
  )
  select updated.id, updated.failure_count from updated;
end;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611154720','create_hv_quarantine_repeated_source_failures','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611154720_create_hv_quarantine_repeated_source_failures.sql

-- RECOVERY BEGIN 20260611161237_cc_watchlist_schema.sql
-- cc_watchlist_schema: Watchlist Command Centre tables
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create table if not exists public.cc_watchlist_items (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null,
  added_by           uuid not null,
  item_type          text not null,
  ref_id             text,
  title              text not null,
  subtitle           text,
  tags               text[] not null default '{}',
  jurisdiction       text,
  confidence_pct     int,
  latest_change_at   timestamptz,
  latest_change_note text,
  next_action        text,
  watch_status       text not null default 'active',
  snoozed_until      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.cc_watchlist_notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  org_id            uuid not null,
  watchlist_item_id uuid references public.cc_watchlist_items(id) on delete set null,
  notification_type text not null,
  title             text not null,
  body              text,
  is_read           bool not null default false,
  is_snoozed        bool not null default false,
  snoozed_until     timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.cc_watch_rules (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null,
  created_by uuid not null,
  rule_type  text not null,
  keywords   text[] not null default '{}',
  is_active  bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cc_watchlist_items_org_id_idx
  on public.cc_watchlist_items(org_id);
create index if not exists cc_watchlist_items_org_type_idx
  on public.cc_watchlist_items(org_id, item_type);
create index if not exists cc_watchlist_items_org_status_idx
  on public.cc_watchlist_items(org_id, watch_status) where watch_status = 'active';
create index if not exists cc_watchlist_items_ref_id_idx
  on public.cc_watchlist_items(ref_id) where ref_id is not null;
create index if not exists cc_watchlist_notifs_user_id_idx
  on public.cc_watchlist_notifications(user_id);
create index if not exists cc_watchlist_notifs_item_id_idx
  on public.cc_watchlist_notifications(watchlist_item_id) where watchlist_item_id is not null;
create index if not exists cc_watchlist_notifs_user_unread_idx
  on public.cc_watchlist_notifications(user_id, is_read) where is_read = false;
create index if not exists cc_watch_rules_org_id_idx
  on public.cc_watch_rules(org_id);
create index if not exists cc_watch_rules_org_active_idx
  on public.cc_watch_rules(org_id, is_active) where is_active = true;

alter table public.cc_watchlist_items         enable row level security;
alter table public.cc_watchlist_notifications enable row level security;
alter table public.cc_watch_rules             enable row level security;

drop policy if exists cc_watchlist_items_member_read   on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_insert on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_update on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_delete on public.cc_watchlist_items;
drop policy if exists cc_watchlist_notifs_user_read    on public.cc_watchlist_notifications;
drop policy if exists cc_watchlist_notifs_user_update  on public.cc_watchlist_notifications;
drop policy if exists cc_watch_rules_member_read       on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_insert     on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_update     on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_delete     on public.cc_watch_rules;

create policy cc_watchlist_items_member_read
  on public.cc_watchlist_items for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_items_member_insert
  on public.cc_watchlist_items for insert to authenticated
  with check (
    added_by = (select auth.uid()) and
    org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid()))
  );
create policy cc_watchlist_items_member_update
  on public.cc_watchlist_items for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_items_member_delete
  on public.cc_watchlist_items for delete to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_notifs_user_read
  on public.cc_watchlist_notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy cc_watchlist_notifs_user_update
  on public.cc_watchlist_notifications for update to authenticated
  using (user_id = (select auth.uid()));
create policy cc_watch_rules_member_read
  on public.cc_watch_rules for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watch_rules_member_insert
  on public.cc_watch_rules for insert to authenticated
  with check (
    created_by = (select auth.uid()) and
    org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid()))
  );
create policy cc_watch_rules_member_update
  on public.cc_watch_rules for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watch_rules_member_delete
  on public.cc_watch_rules for delete to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611161237','cc_watchlist_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611161237_cc_watchlist_schema.sql

-- RECOVERY BEGIN 20260611161705_create_hv_source_health_sweep_wrapper.sql
-- create_hv_source_health_sweep_wrapper: calls quarantine check on optional cron schedule

create or replace function public.hv_source_health_sweep()
returns bigint
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  affected bigint := 0;
begin
  select count(*) into affected
  from public.hv_quarantine_repeated_source_failures();
  return affected;
end;
$$;

revoke execute on function public.hv_source_health_sweep() from public, anon, authenticated;
grant execute on function public.hv_source_health_sweep() to service_role;

do $source_health_schedule$
declare
  job_exists boolean;
begin
  if to_regclass('cron.job') is null
    or to_regprocedure('cron.schedule(text,text,text)') is null
  then
    raise notice 'pg_cron unavailable; hv-source-health-sweep schedule not installed';
    return;
  end if;

  execute 'select exists (select 1 from cron.job where jobname = $1)'
    into job_exists
    using 'hv-source-health-sweep';

  if not job_exists then
    perform cron.schedule(
      'hv-source-health-sweep',
      '5 * * * *',
      'select public.hv_source_health_sweep();'
    );
  end if;
end
$source_health_schedule$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260611161705','create_hv_source_health_sweep_wrapper','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260611161705_create_hv_source_health_sweep_wrapper.sql

-- RECOVERY BEGIN 20260612234547_local_intel_v1.sql
-- Harbourview Local Intel layer v1
-- Additive schema for per-country (and optional subnational) regulatory authorities,
-- subdivision-level operating status, local operating notes (constraints/supply routes),
-- evidence coverage, and open research questions.
-- Keys off countries.iso_alpha2 to stay joinable with the existing global country registry
-- and country_intel. subdivision_code uses ISO 3166-2 style codes (e.g. 'US-FL', 'US-GA')
-- to align with the existing globe/jurisdiction routing work.

create extension if not exists pgcrypto;

-- 1. Coverage tracker: has local intel research actually been done for this country?
-- Lets the UI honestly say "data pending" instead of fabricating content.
create table if not exists public.local_intel_coverage (
  country_code      text primary key references public.countries(iso_alpha2) on delete cascade,
  coverage_status   text not null default 'pending_research'
                       check (coverage_status in ('available','pending_research','not_applicable')),
  notes             text,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Regulatory authorities org chart (country- or subdivision-level)
create table if not exists public.local_authorities (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  org_tier         text not null check (org_tier in ('top','mid','bot')),
  authority_type   text not null check (authority_type in ('primary','oversight','enforcement')),
  authority_name   text not null,
  authority_role   text not null,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  confidence_label text,
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_authorities_country_idx
  on public.local_authorities (country_code, subdivision_code);

-- 3. Subnational / municipal intel rows (the "municipalities" panel)
create table if not exists public.local_subdivisions_intel (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  subdivision_name text not null,
  status_level     text not null check (status_level in ('high','medium','low')),
  note             text,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_subdivisions_intel_country_idx
  on public.local_subdivisions_intel (country_code, subdivision_code);

-- 4. Local operating notes: constraints & supply-chain routes
create table if not exists public.local_operating_notes (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  note_category    text not null check (note_category in ('constraint','supply_route')),
  icon             text,
  label            text not null,
  body_text        text not null,
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_operating_notes_country_idx
  on public.local_operating_notes (country_code, subdivision_code, note_category);

-- 5. Evidence coverage levels (per category, per country)
create table if not exists public.local_evidence_coverage (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  category_label   text not null,
  coverage_level   text not null check (coverage_level in ('high','medium','low')),
  display_order    integer not null default 0,
  source_id        uuid references public.source_registry(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_evidence_coverage_country_idx
  on public.local_evidence_coverage (country_code);

-- 6. Open research questions
create table if not exists public.local_open_questions (
  id               uuid primary key default gen_random_uuid(),
  country_code     text not null references public.countries(iso_alpha2) on delete cascade,
  subdivision_code text,
  question_text    text not null,
  status           text not null default 'open' check (status in ('open','answered')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists local_open_questions_country_idx
  on public.local_open_questions (country_code, subdivision_code, status);

-- ── RLS: public-read, write restricted to service role (consistent with `countries`) ──
alter table public.local_intel_coverage     enable row level security;
alter table public.local_authorities        enable row level security;
alter table public.local_subdivisions_intel enable row level security;
alter table public.local_operating_notes    enable row level security;
alter table public.local_evidence_coverage  enable row level security;
alter table public.local_open_questions     enable row level security;

create policy local_intel_coverage_public_read
  on public.local_intel_coverage for select to anon, authenticated using (true);

create policy local_authorities_public_read
  on public.local_authorities for select to anon, authenticated using (true);

create policy local_subdivisions_intel_public_read
  on public.local_subdivisions_intel for select to anon, authenticated using (true);

create policy local_operating_notes_public_read
  on public.local_operating_notes for select to anon, authenticated using (true);

create policy local_evidence_coverage_public_read
  on public.local_evidence_coverage for select to anon, authenticated using (true);

create policy local_open_questions_public_read
  on public.local_open_questions for select to anon, authenticated using (true);

-- ── Seed coverage tracker for all 191 countries ──
insert into public.local_intel_coverage (country_code, coverage_status)
select iso_alpha2, 'pending_research'
from public.countries
on conflict (country_code) do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260612234547','local_intel_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260612234547_local_intel_v1.sql

-- RECOVERY BEGIN 20260612234609_local_intel_v1_seed_us_florida.sql
-- Seed the first real local-intel record set (US / Florida) into the new local_intel_v1
-- tables, migrating the content that was previously hardcoded in CommandCentre.tsx's
-- LocalIntelPage (buildAuthorities, buildMunicipalData, LI_CONSTRAINTS, LI_ROUTES, LI_COVERAGE).

update public.local_intel_coverage
set coverage_status = 'available', last_reviewed_at = now()
where country_code = 'US';

-- Authorities org chart (US-FL)
insert into public.local_authorities (country_code, subdivision_code, org_tier, authority_type, authority_name, authority_role, display_order)
values
  ('US','US-FL','top','primary',    'Office of Medical Marijuana Use (OMMU)',            'Program Lead', 0),
  ('US','US-FL','mid','primary',    'FL Dept of Health',                                  'Health Oversight', 0),
  ('US','US-FL','mid','oversight',  'FL Dept of Agriculture & Consumer Services',         'Lab & Product Oversight', 1),
  ('US','US-FL','mid','oversight',  'FL Office of Insurance Regulation',                  'Licensing & Compliance', 2),
  ('US','US-FL','bot','enforcement','Division of Law Enforcement (MMJ Team)',             'Investigations & Enforcement', 0),
  ('US','US-FL','bot','enforcement','Local Law Enforcement Agencies',                     'Local Enforcement', 1);

-- Subdivision (county) intel
insert into public.local_subdivisions_intel (country_code, subdivision_code, subdivision_name, status_level, note, display_order)
values
  ('US','US-FL','Miami-Dade County',       'medium', 'Dispensary caps in place', 0),
  ('US','US-FL','Orlando (Orange County)', 'high',   'Zoning moratorium active', 1),
  ('US','US-FL','Tampa (Hillsborough)',    'high',   'Conditional approvals paused', 2),
  ('US','US-FL','Jacksonville (Duval)',    'low',    'Accepting applications', 3),
  ('US','US-FL','Palm Beach County',       'medium', 'Case-by-case review', 4);

-- Operating notes: constraints
insert into public.local_operating_notes (country_code, subdivision_code, note_category, icon, label, body_text, display_order)
values
  ('US','US-FL','constraint','⊞','Zoning & Land Use',     'Local zoning approval required in most jurisdictions; moratoriums active in several counties.', 0),
  ('US','US-FL','constraint','⊟','Cap & Licensing Limits','Dispensary caps at state level; local license quotas may apply.', 1),
  ('US','US-FL','constraint','◉','Facility Siting',       'Buffer zones near schools, places of worship, and parks strictly enforced.', 2),
  ('US','US-FL','constraint','◷','Inspection Backlog',    'OIR inspection backlog may extend time to licensure renewal or modification.', 3);

-- Operating notes: supply routes
insert into public.local_operating_notes (country_code, subdivision_code, note_category, icon, label, body_text, display_order)
values
  ('US','US-FL','supply_route','⬡','In-State Cultivation → Processing', 'Vertical integration required; limited third-party processing options.', 0),
  ('US','US-FL','supply_route','◈','Processing → Dispensary',           'Direct delivery with prior OMMU approval; chain-of-custody mandatory.', 1),
  ('US','US-FL','supply_route','⊟','Out-of-State Inputs',               'Restricted; only approved ancillary inputs permitted.', 2),
  ('US','US-FL','supply_route','◎','Waste Disposal',                    'Use licensed waste transporters; records retention required.', 3);

-- Evidence coverage
insert into public.local_evidence_coverage (country_code, category_label, coverage_level, display_order)
values
  ('US','State Regulatory Bulletins',  'high',   0),
  ('US','Agency Guidance',             'high',   1),
  ('US','Local Government Notices',    'medium', 2),
  ('US','Industry & Trade Sources',     'medium', 3),
  ('US','Legal & Legislative Tracking','high',   4);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260612234609','local_intel_v1_seed_us_florida','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260612234609_local_intel_v1_seed_us_florida.sql

-- RECOVERY BEGIN 20260613040315_fresh_regulatory_sources_engine.sql
-- Harbourview Fresh Regulatory Sources Engine
-- Extends existing regulatory_signals tables for working source checks.

alter table regulatory_signals.sources
  add column if not exists access_method text not null default 'html',
  add column if not exists watch_frequency text not null default 'daily',
  add column if not exists watcher_enabled boolean not null default true,
  add column if not exists watch_status text not null default 'disabled',
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_changed_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_content_hash text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'regulatory_sources_access_method_check') then
    alter table regulatory_signals.sources
      add constraint regulatory_sources_access_method_check
      check (access_method in ('rss','api','html','pdf','manual'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'regulatory_sources_watch_status_check') then
    alter table regulatory_signals.sources
      add constraint regulatory_sources_watch_status_check
      check (watch_status in ('healthy','changed','stale','failing','blocked','manual_review','disabled'));
  end if;
end $$;

create table if not exists regulatory_signals.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references regulatory_signals.sources(id) on delete cascade,
  source_url text not null,
  title text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  raw_text text,
  content_hash text not null,
  previous_hash text,
  changed boolean not null default false,
  storage_path text,
  created_at timestamptz not null default now(),
  constraint regulatory_source_snapshots_source_url_not_empty check (length(trim(source_url)) > 0),
  constraint regulatory_source_snapshots_hash_not_empty check (length(trim(content_hash)) > 0)
);

create table if not exists regulatory_signals.source_check_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references regulatory_signals.sources(id) on delete cascade,
  checked_at timestamptz not null default now(),
  status text not null,
  http_status integer,
  response_time_ms integer,
  content_hash text,
  previous_hash text,
  changed boolean not null default false,
  snapshot_id uuid references regulatory_signals.source_snapshots(id) on delete set null,
  signal_id uuid references regulatory_signals.signals(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint regulatory_source_check_runs_status_check check (status in ('healthy','changed','stale','failing','blocked','manual_review','disabled'))
);

create index if not exists regulatory_source_snapshots_source_time_idx
  on regulatory_signals.source_snapshots(source_id, captured_at desc);
create index if not exists regulatory_source_snapshots_changed_idx
  on regulatory_signals.source_snapshots(changed, captured_at desc);
create index if not exists regulatory_source_check_runs_source_time_idx
  on regulatory_signals.source_check_runs(source_id, checked_at desc);
create index if not exists regulatory_sources_watch_status_idx
  on regulatory_signals.sources(watch_status, last_checked_at desc);

alter table regulatory_signals.source_snapshots enable row level security;
alter table regulatory_signals.source_check_runs enable row level security;

revoke all on regulatory_signals.source_snapshots from anon;
revoke all on regulatory_signals.source_check_runs from anon;
revoke all on regulatory_signals.source_snapshots from authenticated;
revoke all on regulatory_signals.source_check_runs from authenticated;

grant select, insert, update, delete on regulatory_signals.source_snapshots to authenticated;
grant select, insert, update, delete on regulatory_signals.source_check_runs to authenticated;

drop policy if exists regulatory_source_snapshots_admin_operator_only on regulatory_signals.source_snapshots;
drop policy if exists regulatory_source_check_runs_admin_operator_only on regulatory_signals.source_check_runs;

create policy regulatory_source_snapshots_admin_operator_only
  on regulatory_signals.source_snapshots
  for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

create policy regulatory_source_check_runs_admin_operator_only
  on regulatory_signals.source_check_runs
  for all to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')))
  with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

create or replace view regulatory_signals.public_source_status as
select
  id,
  source_name,
  source_type,
  source_tier,
  country_code,
  country_name,
  region,
  jurisdiction,
  regulator_name,
  watch_status,
  last_checked_at,
  last_success_at,
  last_changed_at,
  updated_at
from regulatory_signals.sources
where is_active = true
  and source_tier = 'tier_1_official';

grant select on regulatory_signals.public_source_status to anon;
grant select on regulatory_signals.public_source_status to authenticated;

comment on table regulatory_signals.source_snapshots is 'Private immutable source-check snapshots for Fresh Regulatory Sources Engine.';
comment on table regulatory_signals.source_check_runs is 'Private watcher execution log for official regulatory sources.';
comment on view regulatory_signals.public_source_status is 'Public-safe status projection for official regulatory source health; excludes errors, raw text, storage paths and internal notes.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613040315','fresh_regulatory_sources_engine','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613040315_fresh_regulatory_sources_engine.sql

-- RECOVERY BEGIN 20260613042540_revoke_unsafe_execute_grants.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613042540','revoke_unsafe_execute_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613042540_revoke_unsafe_execute_grants.sql

-- RECOVERY BEGIN 20260613042623_revoke_public_execute_grants_security_definer.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613042623','revoke_public_execute_grants_security_definer','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613042623_revoke_public_execute_grants_security_definer.sql

-- RECOVERY BEGIN 20260613080000_hv_import_staging_foundation_replay.sql
-- Replay-safe foundation recovered from the production import-staging schema.
-- It also adds the source geography columns required by the immediately
-- following normalization trigger.

alter table public.source_registry
  add column if not exists country text,
  add column if not exists iso text,
  add column if not exists jurisdiction text,
  add column if not exists jurisdiction_code text;

create table if not exists public.hv_import_staging (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  source_system text not null,
  source_record_id text,
  source_url text,
  import_batch_id uuid not null,
  importer_version text,
  transform_version text,
  raw_payload jsonb not null default '{}'::jsonb,
  raw_payload_hash text not null,
  normalized_payload jsonb not null default '{}'::jsonb,
  normalized_hash text,
  proposed_object_class public.hv_object_class,
  proposed_classification public.hv_classification default 'internal',
  proposed_title text,
  proposed_jurisdiction text,
  proposed_country_iso text,
  content_hash text,
  duplicate_of uuid references public.hv_import_staging(id),
  is_duplicate_candidate boolean not null default false,
  duplicate_confidence numeric(4,3),
  status text not null default 'pending',
  promoted_artifact_id uuid references public.hv_artifacts(id),
  promoted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  error_message text,
  retry_count integer not null default 0,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_import_staging_duplicate_confidence_check
    check (duplicate_confidence is null or duplicate_confidence between 0 and 1)
);

create index if not exists idx_hv_import_staging_workspace on public.hv_import_staging(workspace_id);
create index if not exists idx_hv_import_staging_source_record on public.hv_import_staging(source_system, source_record_id);
create index if not exists idx_hv_import_staging_content_hash on public.hv_import_staging(content_hash);
create index if not exists idx_hv_import_staging_status on public.hv_import_staging(status, created_at);

alter table public.hv_import_staging enable row level security;
revoke all on table public.hv_import_staging from public, anon, authenticated;
grant all on table public.hv_import_staging to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613080000','hv_import_staging_foundation_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613080000_hv_import_staging_foundation_replay.sql

-- RECOVERY BEGIN 20260613080700_hv_staging_country_iso_trigger.sql
-- hv_staging_country_iso_trigger: auto-populate proposed_country_iso on hv_import_staging insert
-- Applied: 2026-06-13

-- Backfill source_registry.iso from country name
update public.source_registry set iso = case country
  when 'USA'          then 'US'
  when 'Canada'       then 'CA'
  when 'UK'           then 'GB'
  when 'Netherlands'  then 'NL'
  when 'Israel'       then 'IL'
  when 'Australia'    then 'AU'
  when 'Uruguay'      then 'UY'
  when 'Colombia'     then 'CO'
  when 'Spain'        then 'ES'
  when 'Thailand'     then 'TH'
  when 'Sweden'       then 'SE'
  when 'South Africa' then 'ZA'
  when 'Brazil'       then 'BR'
  else null
end
where iso is null and country is not null
  and country not in ('Global','Europe','LATAM','Africa','Asia','Pacific','Middle East');

-- Backfill proposed_country_iso on existing staging rows
update public.hv_import_staging sis
set
  proposed_country_iso  = sr.iso,
  proposed_jurisdiction = coalesce(sis.proposed_jurisdiction, sr.jurisdiction_code, sr.jurisdiction)
from public.source_snapshots ss
join public.source_registry sr on sr.id = ss.source_id
where ss.id::text = sis.source_record_id
  and sis.proposed_country_iso is null
  and sr.iso is not null;

-- Trigger function
create or replace function public.hv_staging_backfill_country_iso()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.proposed_country_iso is null and new.source_record_id is not null then
    select sr.iso, coalesce(sr.jurisdiction_code, sr.jurisdiction)
    into new.proposed_country_iso, new.proposed_jurisdiction
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    where ss.id::text = new.source_record_id
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists hv_staging_country_iso_fill on public.hv_import_staging;
create trigger hv_staging_country_iso_fill
  before insert on public.hv_import_staging
  for each row execute function public.hv_staging_backfill_country_iso();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613080700','hv_staging_country_iso_trigger','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613080700_hv_staging_country_iso_trigger.sql

-- RECOVERY BEGIN 20260613120244_harden_project_vault_rls_admin_only.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613120244','harden_project_vault_rls_admin_only','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613120244_harden_project_vault_rls_admin_only.sql

-- RECOVERY BEGIN 20260613120440_local_intel_v1_remove_us_priority_seed.sql
-- Remove the US/Florida seed data from local_intel_v1. Seeding one country as
-- "available" while the other 190 sit at pending_research wrongly implied the
-- US is a priority/template jurisdiction. Reset US to the same pending_research
-- baseline as every other country until real per-country research is done for
-- all 191 jurisdictions on an equal footing.

delete from public.local_authorities        where country_code = 'US';
delete from public.local_subdivisions_intel  where country_code = 'US';
delete from public.local_operating_notes     where country_code = 'US';
delete from public.local_evidence_coverage   where country_code = 'US';
delete from public.local_open_questions      where country_code = 'US';

update public.local_intel_coverage
set coverage_status = 'pending_research', last_reviewed_at = null, notes = null
where country_code = 'US';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613120440','local_intel_v1_remove_us_priority_seed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613120440_local_intel_v1_remove_us_priority_seed.sql

-- RECOVERY BEGIN 20260613170000_canonical_country_reference_repair.sql
-- Canonical country-reference repair for post-seed migration dependencies.
--
-- The Natural Earth seed intentionally contained 191 rows, while later
-- Harbourview migrations reference 28 additional ISO 3166-1 jurisdictions.
-- This identity-only repair runs before the first dependent local-intelligence
-- migration. It is safe for production histories: existing regulatory and
-- commercial fields are preserved; only canonical identity fields are aligned.

insert into public.countries (
  country_name,
  country_slug,
  iso_alpha2,
  iso_alpha3,
  region,
  subregion,
  market_access_status,
  medical_status,
  adult_use_status,
  import_status,
  export_status,
  signals_status,
  opportunity_status,
  opportunity_score,
  public_summary,
  data_completeness,
  last_updated_label
)
values
  ('Andorra', 'andorra', 'AD', 'AND', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Antigua and Barbuda', 'antigua-and-barbuda', 'AG', 'ATG', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Aruba', 'aruba', 'AW', 'ABW', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Barbados', 'barbados', 'BB', 'BRB', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Bahrain', 'bahrain', 'BH', 'BHR', 'Asia', 'Western Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Curaçao', 'curacao', 'CW', 'CUW', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Micronesia', 'micronesia', 'FM', 'FSM', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Grenada', 'grenada', 'GD', 'GRD', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Guernsey', 'guernsey', 'GG', 'GGY', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical dependency identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Gibraltar', 'gibraltar', 'GI', 'GIB', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Jersey', 'jersey', 'JE', 'JEY', 'Europe', 'Northern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical dependency identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Saint Kitts and Nevis', 'saint-kitts-and-nevis', 'KN', 'KNA', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Liechtenstein', 'liechtenstein', 'LI', 'LIE', 'Europe', 'Western Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Monaco', 'monaco', 'MC', 'MCO', 'Europe', 'Western Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Marshall Islands', 'marshall-islands', 'MH', 'MHL', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Macao', 'macao', 'MO', 'MAC', 'Asia', 'Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Malta', 'malta', 'MT', 'MLT', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Maldives', 'maldives', 'MV', 'MDV', 'Asia', 'Southern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Nauru', 'nauru', 'NR', 'NRU', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Palau', 'palau', 'PW', 'PLW', 'Oceania', 'Micronesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Seychelles', 'seychelles', 'SC', 'SYC', 'Africa', 'Eastern Africa', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Singapore', 'singapore', 'SG', 'SGP', 'Asia', 'South-Eastern Asia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('San Marino', 'san-marino', 'SM', 'SMR', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Sint Maarten', 'sint-maarten', 'SX', 'SXM', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical territory identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Tonga', 'tonga', 'TO', 'TON', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Tuvalu', 'tuvalu', 'TV', 'TUV', 'Oceania', 'Polynesia', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Holy See', 'vatican-city', 'VA', 'VAT', 'Europe', 'Southern Europe', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026'),
  ('Saint Vincent and the Grenadines', 'saint-vincent-and-the-grenadines', 'VC', 'VCT', 'Americas', 'Caribbean', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 'unknown', 10, 'Canonical jurisdiction identity row. Regulatory and commercial status requires reviewed evidence.', 'stub', 'Canonical identity repair — August 2026')
on conflict (iso_alpha2) do update
set
  country_name = excluded.country_name,
  country_slug = excluded.country_slug,
  iso_alpha3 = excluded.iso_alpha3,
  region = excluded.region,
  subregion = excluded.subregion,
  updated_at = now();

-- The public country identity layer must now cover every jurisdiction referenced
-- by the current post-seed migration history.
do $country_reference_assertion$
declare
  missing_codes text[];
begin
  select array_agg(required_code order by required_code)
  into missing_codes
  from unnest(array[
    'AD','AG','AW','BB','BH','CW','FM','GD','GG','GI','JE','KN','LI','MC',
    'MH','MO','MT','MV','NR','PW','SC','SG','SM','SX','TO','TV','VA','VC'
  ]::text[]) as required_code
  where not exists (
    select 1
    from public.countries country
    where country.iso_alpha2 = required_code
  );

  if missing_codes is not null then
    raise exception 'Canonical country reference repair incomplete: %', missing_codes;
  end if;
end
$country_reference_assertion$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613170000','canonical_country_reference_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613170000_canonical_country_reference_repair.sql

-- RECOVERY BEGIN 20260613172541_local_intel_v1_batch1_real_authorities.sql
-- First real research batch for local_intel_v1: national cannabis regulatory
-- authorities for Canada, Germany, Netherlands, Uruguay, and Malta, verified via
-- web research (official government / established legal-guide sources), June 2026.
-- Only top-level national authority data is populated here. Subdivision/municipal,
-- constraint, route, and evidence-coverage detail remain pending_research-equivalent
-- (empty) for these countries until further research is done -- the dashboard
-- falls back to the generic "pending" framing for those sections honestly.

-- Canada (CA): Health Canada administers the federal Cannabis Act regulatory
-- program; provinces/territories license retail; federal partners (CBSA, CRA,
-- law enforcement) handle enforcement/import-export.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('CA','top','primary',   'Health Canada',                                  'Federal regulator under the Cannabis Act (licensing of cultivation, processing, medical sale, testing, research)', 0, 'Verified: canada.ca, June 2026'),
  ('CA','mid','oversight', 'Provincial & Territorial Governments',           'Authorize and license retail sale of non-medical cannabis', 0, 'Verified: canada.ca, June 2026'),
  ('CA','mid','oversight', 'Canada Revenue Agency (CRA)',                     'Cannabis cultivation/processing licensing (Excise Act, 2001)', 1, 'Verified: canada.ca, June 2026'),
  ('CA','bot','enforcement','Canada Border Services Agency (CBSA)',          'Import/export enforcement', 0, 'Verified: canada.ca, June 2026'),
  ('CA','bot','enforcement','Provincial & Local Law Enforcement',            'Compliance referrals and enforcement', 1, 'Verified: canada.ca, June 2026');

-- Germany (DE): BfArM / Cannabisagentur is the federal regulator for medical
-- cannabis cultivation, processing and distribution; Federal Ministry of Health
-- has policy oversight; Landesbehörden (state authorities) license/oversee
-- Cannabis Social Clubs under the 2024 CanG.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('DE','top','primary',   'Federal Institute for Drugs and Medical Devices (BfArM) / Cannabisagentur', 'National medical cannabis regulator: licenses cultivation, processing, import/export, distribution to pharmacies', 0, 'Verified: BfArM/CMS/Cannabis Europa, June 2026'),
  ('DE','mid','oversight', 'Federal Ministry of Health (Bundesgesundheitsministerium)', 'Policy oversight for the Cannabis Act (CanG) framework', 0, 'Verified: Cannabis Europa, June 2026'),
  ('DE','bot','enforcement','Landesbehörden (State Authorities)',            'License and oversee Cannabis Social Clubs (Anbauvereinigungen) under CanG', 0, 'Verified: Cannabis Europa, June 2026');

-- Netherlands (NL): Bureau voor Medicinale Cannabis (BMC) regulates medicinal
-- cannabis cultivation/supply; the regulated "Wietexperiment" licenses growers
-- for the closed coffee-shop supply chain pilot.
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('NL','top','primary',   'Bureau voor Medicinale Cannabis (BMC)',          'Government agency regulating medicinal cannabis cultivation and supply', 0, 'Verified: Cannabis Europa, June 2026'),
  ('NL','mid','oversight', 'Wietexperiment Licensed Growers Programme',      'Regulated closed supply chain pilot for cannabis coffee-shops (10 licensed growers, 2023 cohort)', 0, 'Verified: Cannabis Europa / EMCDDA, June 2026');

-- Uruguay (UY): IRCCA (Instituto de Regulación y Control del Cannabis) is the
-- single national regulator covering pharmacy sales, home cultivation, and
-- cannabis clubs under Ley 19.172 (2013).
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('UY','top','primary',   'Instituto de Regulación y Control del Cannabis (IRCCA)', 'National regulator for pharmacy sales, home cultivation registration, and cannabis clubs under Ley 19.172', 0, 'Verified: Cannavigia / 420.place, June 2026');

-- Malta (MT): ARUC (Authority for the Responsible Use of Cannabis), established
-- by Chapter 628 of the Laws of Malta (2021), licenses and regulates non-profit
-- Cannabis Harm Reduction Associations (CHRAs).
insert into public.local_authorities (country_code, org_tier, authority_type, authority_name, authority_role, display_order, confidence_label)
values
  ('MT','top','primary',   'Authority for the Responsible Use of Cannabis (ARUC)', 'Established under Chapter 628 (2021); licenses and regulates Cannabis Harm Reduction Associations (CHRAs)', 0, 'Verified: aruc.mt / CSB Group, June 2026');

-- Mark these 5 countries as having an initial verified research pass.
update public.local_intel_coverage
set coverage_status = 'available',
    last_reviewed_at = now(),
    notes = 'Initial research pass: national-level regulatory authority verified via web research (June 2026). Subdivision/municipal detail, operating constraints, supply routes, and evidence coverage not yet researched for this country.'
where country_code in ('CA','DE','NL','UY','MT');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613172541','local_intel_v1_batch1_real_authorities','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613172541_local_intel_v1_batch1_real_authorities.sql

-- RECOVERY BEGIN 20260613172801_local_intel_research_queue_v1.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613172801','local_intel_research_queue_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613172801_local_intel_research_queue_v1.sql

-- RECOVERY BEGIN 20260613210556_create_cc_jurisdiction_briefings.sql
-- Replay-safe Command Centre jurisdiction briefing foundation recovered from
-- production. This public country/profile contract is distinct from the later
-- jurisdiction_briefings publication workflow.

create table if not exists public.cc_jurisdiction_briefings (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_slug text not null,
  jurisdiction_type text not null,
  country_iso2 text not null,
  state_iso2 text,
  program_status text,
  public_summary text,
  patient_access text,
  physician_access text,
  market_dynamics text,
  regulatory_outlook text,
  regulatory_body text,
  data_source_summary text,
  verification_summary text,
  update_cadence text,
  coverage_summary text,
  last_reviewed_date date,
  watch_regions jsonb default '[]'::jsonb,
  change_notes jsonb default '[]'::jsonb,
  review_state text not null default 'reviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confidence_score numeric,
  confidence_categories jsonb default '[]'::jsonb,
  full_profile_href text,
  change_activity_href text,
  constraint cc_jurisdiction_briefings_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100)
);

create unique index if not exists cc_jurisdiction_briefings_slug_country_idx
  on public.cc_jurisdiction_briefings(jurisdiction_slug, country_iso2);
create index if not exists cc_jurisdiction_briefings_country_idx
  on public.cc_jurisdiction_briefings(country_iso2);
create index if not exists idx_cc_jb_country_status
  on public.cc_jurisdiction_briefings(country_iso2, review_state)
  where country_iso2 is not null;

create or replace function public.set_cc_briefings_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists cc_briefings_updated_at on public.cc_jurisdiction_briefings;
create trigger cc_briefings_updated_at
  before update on public.cc_jurisdiction_briefings
  for each row execute function public.set_cc_briefings_updated_at();

alter table public.cc_jurisdiction_briefings enable row level security;
revoke all on table public.cc_jurisdiction_briefings from public, anon, authenticated;
grant select on table public.cc_jurisdiction_briefings to anon, authenticated;
grant all on table public.cc_jurisdiction_briefings to service_role;

drop policy if exists public_read_cc_briefings on public.cc_jurisdiction_briefings;
create policy public_read_cc_briefings
  on public.cc_jurisdiction_briefings
  for select
  to anon, authenticated
  using (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613210556','create_cc_jurisdiction_briefings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613210556_create_cc_jurisdiction_briefings.sql

-- RECOVERY BEGIN 20260613232648_local_intel_v1_batch2_eastern_africa.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613232648','local_intel_v1_batch2_eastern_africa','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613232648_local_intel_v1_batch2_eastern_africa.sql

-- RECOVERY BEGIN 20260613232747_local_intel_v1_batch3_eastern_africa_continued.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613232747','local_intel_v1_batch3_eastern_africa_continued','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613232747_local_intel_v1_batch3_eastern_africa_continued.sql

-- RECOVERY BEGIN 20260613232915_local_intel_v1_batch4_middle_northern_southern_africa.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613232915','local_intel_v1_batch4_middle_northern_southern_africa','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613232915_local_intel_v1_batch4_middle_northern_southern_africa.sql

-- RECOVERY BEGIN 20260613233045_local_intel_v1_batch5_west_africa_caribbean.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613233045','local_intel_v1_batch5_west_africa_caribbean','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613233045_local_intel_v1_batch5_west_africa_caribbean.sql

-- RECOVERY BEGIN 20260613233220_local_intel_v1_batch6_caribbean_central_america.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260613233220','local_intel_v1_batch6_caribbean_central_america','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260613233220_local_intel_v1_batch6_caribbean_central_america.sql

-- RECOVERY BEGIN 20260614042755_local_intel_v1_batch7_south_america_central_east_asia.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614042755','local_intel_v1_batch7_south_america_central_east_asia','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614042755_local_intel_v1_batch7_south_america_central_east_asia.sql

-- RECOVERY BEGIN 20260614042945_local_intel_v1_batch8_southeast_south_asia.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614042945','local_intel_v1_batch8_southeast_south_asia','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614042945_local_intel_v1_batch8_southeast_south_asia.sql

-- RECOVERY BEGIN 20260614043145_local_intel_v1_batch9_middle_east_eastern_europe.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614043145','local_intel_v1_batch9_middle_east_eastern_europe','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614043145_local_intel_v1_batch9_middle_east_eastern_europe.sql

-- RECOVERY BEGIN 20260614114026_local_intel_v1_batch10_europe_final_oceania.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614114026','local_intel_v1_batch10_europe_final_oceania','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614114026_local_intel_v1_batch10_europe_final_oceania.sql

-- RECOVERY BEGIN 20260614170031_local_intel_v1_add_confidence_label_to_notes_tables.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614170031','local_intel_v1_add_confidence_label_to_notes_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614170031_local_intel_v1_add_confidence_label_to_notes_tables.sql

-- RECOVERY BEGIN 20260614170337_local_intel_v1_operating_notes_legal_markets.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614170337','local_intel_v1_operating_notes_legal_markets','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614170337_local_intel_v1_operating_notes_legal_markets.sql

-- RECOVERY BEGIN 20260614170409_local_intel_v1_operating_notes_prohibition_countries.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614170409','local_intel_v1_operating_notes_prohibition_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614170409_local_intel_v1_operating_notes_prohibition_countries.sql

-- RECOVERY BEGIN 20260614170435_local_intel_v1_evidence_coverage_all_countries.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260614170435','local_intel_v1_evidence_coverage_all_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260614170435_local_intel_v1_evidence_coverage_all_countries.sql

-- RECOVERY BEGIN 20260615090146_local_intel_v1_open_questions_all_countries.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615090146','local_intel_v1_open_questions_all_countries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615090146_local_intel_v1_open_questions_all_countries.sql

-- RECOVERY BEGIN 20260615090949_local_intel_v1_us_federal_schedule3_and_state_subdivisions.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615090949','local_intel_v1_us_federal_schedule3_and_state_subdivisions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615090949_local_intel_v1_us_federal_schedule3_and_state_subdivisions.sql

-- RECOVERY BEGIN 20260615091026_local_intel_v1_canada_provinces_and_health_canada_2025.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615091026','local_intel_v1_canada_provinces_and_health_canada_2025','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615091026_local_intel_v1_canada_provinces_and_health_canada_2025.sql

-- RECOVERY BEGIN 20260615091111_local_intel_v1_australia_state_subdivisions.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615091111','local_intel_v1_australia_state_subdivisions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615091111_local_intel_v1_australia_state_subdivisions.sql

-- RECOVERY BEGIN 20260615091139_restore_marketplace_candidates_discovered_at.sql
-- Production already had marketplace_candidates.discovered_at when the
-- seller self-serve migration was applied, but repository zero-state never
-- recorded its creator. Restore only that prerequisite column immediately
-- before the production-recorded migration that indexes it.

alter table public.marketplace_candidates
  add column if not exists discovered_at timestamptz default now();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615091139','restore_marketplace_candidates_discovered_at','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615091139_restore_marketplace_candidates_discovered_at.sql

-- RECOVERY BEGIN 20260615091140_marketplace_seller_self_serve.sql
-- Add self-serve columns to marketplace_candidates

ALTER TABLE public.marketplace_candidates
  ADD COLUMN IF NOT EXISTS submitted_by      uuid   REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_source text   NOT NULL DEFAULT 'intelligence',
  ADD COLUMN IF NOT EXISTS submission_images jsonb  NOT NULL DEFAULT '[]'::jsonb;

-- Index for seller portal queries

CREATE INDEX IF NOT EXISTS marketplace_candidates_submitted_by_idx
  ON public.marketplace_candidates (submitted_by, discovered_at DESC)
  WHERE submitted_by IS NOT NULL;

-- RLS: sellers can insert and view their own submissions
-- (RLS must already be enabled; if not, enable it first)

ALTER TABLE public.marketplace_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated sellers can insert own candidates" ON public.marketplace_candidates;
CREATE POLICY "Authenticated sellers can insert own candidates"
  ON public.marketplace_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND submission_source = 'self_serve'
  );

DROP POLICY IF EXISTS "Authenticated sellers can view own submissions" ON public.marketplace_candidates;
CREATE POLICY "Authenticated sellers can view own submissions"
  ON public.marketplace_candidates
  FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

GRANT INSERT, SELECT ON public.marketplace_candidates TO authenticated;

-- Storage policies for the submissions/ prefix in marketplace-item-originals

DROP POLICY IF EXISTS "Sellers upload submission images" ON storage.objects;
CREATE POLICY "Sellers upload submission images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'marketplace-item-originals'
    AND (storage.foldername(name))[1] = 'submissions'
  );

DROP POLICY IF EXISTS "Sellers read own submission images" ON storage.objects;
CREATE POLICY "Sellers read own submission images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'marketplace-item-originals'
    AND (storage.foldername(name))[1] = 'submissions'
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615091140','marketplace_seller_self_serve','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615091140_marketplace_seller_self_serve.sql

-- RECOVERY BEGIN 20260615195337_create_github_bridge_scratch.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615195337','create_github_bridge_scratch','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615195337_create_github_bridge_scratch.sql

-- RECOVERY BEGIN 20260615195428_drop_github_bridge_scratch.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615195428','drop_github_bridge_scratch','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615195428_drop_github_bridge_scratch.sql

-- RECOVERY BEGIN 20260615195523_create_push_staging.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615195523','create_push_staging','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615195523_create_push_staging.sql

-- RECOVERY BEGIN 20260615195852_local_intel_v1_germany_laender_netherlands_wietexperiment.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615195852','local_intel_v1_germany_laender_netherlands_wietexperiment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615195852_local_intel_v1_germany_laender_netherlands_wietexperiment.sql

-- RECOVERY BEGIN 20260615200135_local_intel_v1_spain_india_subdivisions_fixed.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615200135','local_intel_v1_spain_india_subdivisions_fixed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615200135_local_intel_v1_spain_india_subdivisions_fixed.sql

-- RECOVERY BEGIN 20260615200321_local_intel_v1_italy_poland_detailed_operating_notes.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260615200321','local_intel_v1_italy_poland_detailed_operating_notes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260615200321_local_intel_v1_italy_poland_detailed_operating_notes.sql

-- RECOVERY BEGIN 20260616000000_hv_import_staging_extract_status.sql
-- Migration: Extend hv_import_staging status lifecycle for extraction pipeline.
-- The intelligence-extract cron writes three new terminal statuses.
--
-- Lifecycle:
--   staged              ← written by IntelligenceOrchestrator (intelligence-ingest cron)
--   extracted           ← Gemini extraction succeeded; ia_signals row created
--   extraction_failed   ← Gemini returned null or ia_signals insert failed
--   extraction_skipped  ← raw_payload too short to extract meaningful signal

comment on table public.hv_import_staging is
  'Staging queue for AI intelligence extraction. '
  'Status lifecycle: staged → extracted | extraction_failed | extraction_skipped';

comment on column public.hv_import_staging.status is
  'staged | extracted | extraction_failed | extraction_skipped';

-- Index: extraction cron pulls rows in created_at order with status=staged.
create index if not exists idx_hv_import_staging_status_created
  on public.hv_import_staging (status, created_at asc)
  where status = 'staged';

-- Index: support retry queries for failed rows.
create index if not exists idx_hv_import_staging_failed
  on public.hv_import_staging (status, created_at asc)
  where status = 'extraction_failed';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616000000','hv_import_staging_extract_status','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616000000_hv_import_staging_extract_status.sql

-- RECOVERY BEGIN 20260616022526_local_intel_v1_switzerland_cantons.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616022526','local_intel_v1_switzerland_cantons','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616022526_local_intel_v1_switzerland_cantons.sql

-- RECOVERY BEGIN 20260616022737_local_intel_v1_zimbabwe_detailed_operating_notes.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616022737','local_intel_v1_zimbabwe_detailed_operating_notes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616022737_local_intel_v1_zimbabwe_detailed_operating_notes.sql

-- RECOVERY BEGIN 20260616100000_ia_signal_embeddings.sql
-- =============================================================================
-- ia_signal_embeddings: BGE-M3 1024-dim embeddings for ia_signals
-- =============================================================================
-- Separate from hv_embeddings (which serves hv_artifacts / artifact search).
-- Enables semantic search over intelligence signals.
--
-- Pipeline:  ia_signals → (embed cron) → ia_signal_embeddings
-- Search:    ia_search_signals(p_query_embedding) → ranked signal rows

CREATE TABLE IF NOT EXISTS public.ia_signal_embeddings (
  signal_id   text         PRIMARY KEY
                           REFERENCES public.ia_signals(id) ON DELETE CASCADE,
  embedding   vector(1024) NOT NULL,
  model       text         NOT NULL DEFAULT 'bge-m3',
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- HNSW cosine-distance index (params match idx_hv_embeddings_hnsw_1024)
CREATE INDEX IF NOT EXISTS idx_ia_signal_embeddings_hnsw
  ON public.ia_signal_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.ia_signal_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_signal_embeddings_admin_operator_all ON public.ia_signal_embeddings;
CREATE POLICY ia_signal_embeddings_admin_operator_all
  ON public.ia_signal_embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'operator')
    )
  );

-- Service-role access for the embedding cron (bypasses RLS)
GRANT SELECT, INSERT, UPDATE ON public.ia_signal_embeddings TO service_role;

-- ── Semantic search RPC ───────────────────────────────────────────────────────
-- Returns ia_signals ordered by cosine similarity to a query embedding.
-- Optional filters: market, type, stage.
CREATE OR REPLACE FUNCTION public.ia_search_signals(
  p_query_embedding  vector(1024),
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616100000','ia_signal_embeddings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616100000_ia_signal_embeddings.sql

-- RECOVERY BEGIN 20260616100648_intelligence_engine_queue_columns.sql
-- Restore the production-owned intelligence-engine queue contract at its
-- canonical migration version. The repository previously kept only a ledger
-- stub, which left zero-state replay without the atomic crawl-target claim RPC.

alter table public.source_registry
  add column if not exists is_active boolean,
  add column if not exists crawl_allowed boolean not null default true,
  add column if not exists next_crawl_at timestamptz default now(),
  add column if not exists locked_until timestamptz,
  add column if not exists locked_by text,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_error_log text,
  add column if not exists network_status text not null default 'online';

do $source_registry_activity_backfill$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'source_registry'
      and column_name = 'status'
  ) then
    execute $sql$
      update public.source_registry
      set is_active = coalesce(is_active, status <> 'disabled')
    $sql$;
  else
    update public.source_registry
    set is_active = coalesce(is_active, true);
  end if;
end
$source_registry_activity_backfill$;

alter table public.source_registry
  alter column is_active set default true,
  alter column is_active set not null;

create index if not exists idx_source_registry_crawl_queue
  on public.source_registry (next_crawl_at, locked_until)
  where is_active = true and crawl_allowed = true;

create or replace function public.acquire_crawl_targets(
  p_limit integer default 25,
  p_worker_id text default 'default'
)
returns setof public.source_registry
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_now timestamptz := now();
  v_lease_end timestamptz := now() + interval '5 minutes';
  v_ids uuid[];
begin
  select array_agg(id)
  into v_ids
  from (
    select id
    from public.source_registry
    where is_active = true
      and crawl_allowed = true
      and (next_crawl_at is null or next_crawl_at <= v_now)
      and (locked_until is null or locked_until < v_now)
    order by next_crawl_at asc nulls first
    limit p_limit
    for update skip locked
  ) as targets;

  if v_ids is null or array_length(v_ids, 1) = 0 then
    return;
  end if;

  update public.source_registry
  set locked_by = p_worker_id,
      locked_until = v_lease_end
  where id = any(v_ids);

  return query
    select *
    from public.source_registry
    where id = any(v_ids);
end;
$function$;

revoke all on function public.acquire_crawl_targets(integer, text)
  from public, anon, authenticated;
grant execute on function public.acquire_crawl_targets(integer, text)
  to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616100648','intelligence_engine_queue_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616100648_intelligence_engine_queue_columns.sql

-- RECOVERY BEGIN 20260616104456_recreate_github_bridge_scratch.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616104456','recreate_github_bridge_scratch','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616104456_recreate_github_bridge_scratch.sql

-- RECOVERY BEGIN 20260616120057_local_intel_v1_data_quality_fix_turkey_and_backfill.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616120057','local_intel_v1_data_quality_fix_turkey_and_backfill','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616120057_local_intel_v1_data_quality_fix_turkey_and_backfill.sql

-- RECOVERY BEGIN 20260616120148_local_intel_v1_mexico_correction_and_subdivisions.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616120148','local_intel_v1_mexico_correction_and_subdivisions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616120148_local_intel_v1_mexico_correction_and_subdivisions.sql

-- RECOVERY BEGIN 20260616120223_local_intel_v1_brazil_states_and_association_history.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616120223','local_intel_v1_brazil_states_and_association_history','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616120223_local_intel_v1_brazil_states_and_association_history.sql

-- RECOVERY BEGIN 20260616200000_signal_subscriptions.sql
-- =============================================================================
-- signal_subscriptions + signal_digest_log
-- =============================================================================
-- signal_subscriptions: per-user alert preferences for ia_signals.
-- signal_digest_log:    audit of which signals have been sent to whom
--                       (prevents re-sending the same signal).
--
-- Gating: intel + operator tiers only (enforced in the API route).
-- Delivery: daily digest via intelligence-notify cron (07:00 UTC).

-- ── signal_subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signal_subscriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        NOT NULL,                    -- denormalised for cron access

  -- Filter dimensions — empty array means "all values"
  markets          text[]      NOT NULL DEFAULT '{}',       -- [] = all markets
  types            text[]      NOT NULL DEFAULT '{}',       -- [] = all signal types
  min_confidence   integer     NOT NULL DEFAULT 50
                               CHECK (min_confidence BETWEEN 0 AND 100),

  -- Delivery config
  frequency        text        NOT NULL DEFAULT 'daily'
                               CHECK (frequency IN ('daily', 'weekly')),
  active           boolean     NOT NULL DEFAULT true,
  last_sent_at     timestamptz,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user_id
  ON public.signal_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_active
  ON public.signal_subscriptions (active, frequency, last_sent_at)
  WHERE active = true;

ALTER TABLE public.signal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage their own subscriptions
DROP POLICY IF EXISTS signal_subscriptions_user_self ON public.signal_subscriptions;
CREATE POLICY signal_subscriptions_user_self
  ON public.signal_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (cron) reads all active subscriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_subscriptions TO service_role;

-- Updated-at trigger
DROP TRIGGER IF EXISTS set_signal_subscriptions_updated_at ON public.signal_subscriptions;
CREATE TRIGGER set_signal_subscriptions_updated_at
  BEFORE UPDATE ON public.signal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── signal_digest_log ─────────────────────────────────────────────────────────
-- Records every (subscription, signal) pair that has been sent.
-- UNIQUE constraint prevents the notify cron from sending duplicates.
CREATE TABLE IF NOT EXISTS public.signal_digest_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  uuid        NOT NULL
                               REFERENCES public.signal_subscriptions(id) ON DELETE CASCADE,
  signal_id        text        NOT NULL,                    -- ia_signals.id (text PK)
  sent_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (subscription_id, signal_id)
);

CREATE INDEX IF NOT EXISTS idx_signal_digest_log_subscription
  ON public.signal_digest_log (subscription_id, sent_at DESC);

ALTER TABLE public.signal_digest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signal_digest_log_user_read ON public.signal_digest_log;
CREATE POLICY signal_digest_log_user_read
  ON public.signal_digest_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signal_subscriptions s
      WHERE s.id = signal_digest_log.subscription_id
        AND s.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.signal_digest_log TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616200000','signal_subscriptions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616200000_signal_subscriptions.sql

-- RECOVERY BEGIN 20260616221502_drop_github_bridge_scratch_v2.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616221502','drop_github_bridge_scratch_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616221502_drop_github_bridge_scratch_v2.sql

-- RECOVERY BEGIN 20260616222928_local_intel_v1_operating_notes_lb_rw_ng_pe_ec.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616222928','local_intel_v1_operating_notes_lb_rw_ng_pe_ec','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616222928_local_intel_v1_operating_notes_lb_rw_ng_pe_ec.sql

-- RECOVERY BEGIN 20260616223058_local_intel_v1_operating_notes_remaining_legal_markets.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260616223058','local_intel_v1_operating_notes_remaining_legal_markets','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260616223058_local_intel_v1_operating_notes_remaining_legal_markets.sql

-- RECOVERY BEGIN 20260617105019_local_intel_v1_fix_dm_gy_kn_decrim_contradiction.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260617105019','local_intel_v1_fix_dm_gy_kn_decrim_contradiction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260617105019_local_intel_v1_fix_dm_gy_kn_decrim_contradiction.sql

-- RECOVERY BEGIN 20260617191632_signals_embedding_1024.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260617191632','signals_embedding_1024','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260617191632_signals_embedding_1024.sql

-- RECOVERY BEGIN 20260617201649_llm_rate_limits_reapply.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260617201649','llm_rate_limits_reapply','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260617201649_llm_rate_limits_reapply.sql

-- RECOVERY BEGIN 20260618144144_security_harden_rls_and_search_path.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618144144','security_harden_rls_and_search_path','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618144144_security_harden_rls_and_search_path.sql

-- RECOVERY BEGIN 20260618161851_jurisdiction_briefings.sql
-- Replay-safe jurisdiction briefing publishing foundation recovered from the
-- production schema. This is separate from cc_jurisdiction_briefings, which
-- stores the public country-profile briefing contract.

create table if not exists public.jurisdiction_briefings (
  id uuid primary key default gen_random_uuid(),
  country_iso2 text not null,
  country_name text,
  generated_at timestamptz not null default now(),
  week_ending date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  signal_count integer not null default 0,
  headline text not null default '',
  legal_status text not null default 'unknown',
  market_maturity text not null default 'unknown',
  summary text not null default '',
  what_changed text,
  operator_implications text,
  whats_coming text,
  key_signals jsonb not null default '[]'::jsonb,
  model_used text,
  prompt_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_iso2, week_ending)
);

create index if not exists jurisdiction_briefings_country_week
  on public.jurisdiction_briefings(country_iso2, week_ending desc);
create index if not exists jurisdiction_briefings_published
  on public.jurisdiction_briefings(status, generated_at desc)
  where status = 'published';
create index if not exists idx_jb_country_status
  on public.jurisdiction_briefings(country_iso2, status, week_ending desc);

alter table public.jurisdiction_briefings enable row level security;

revoke all on table public.jurisdiction_briefings from public, anon, authenticated;
grant select on table public.jurisdiction_briefings to anon, authenticated;
grant all on table public.jurisdiction_briefings to service_role;

drop policy if exists public_read_published on public.jurisdiction_briefings;
create policy public_read_published
  on public.jurisdiction_briefings
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists service_write on public.jurisdiction_briefings;
create policy service_write
  on public.jurisdiction_briefings
  for all
  to service_role
  using (true)
  with check (true);

do $jurisdiction_briefing_updated_at$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'drop trigger if exists set_jurisdiction_briefings_updated_at on public.jurisdiction_briefings';
    execute 'create trigger set_jurisdiction_briefings_updated_at before update on public.jurisdiction_briefings for each row execute function public.set_updated_at()';
  end if;
end
$jurisdiction_briefing_updated_at$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618161851','jurisdiction_briefings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618161851_jurisdiction_briefings.sql

-- RECOVERY BEGIN 20260618163718_jurisdiction_playbooks.sql
-- jurisdiction_playbooks: market entry playbooks per jurisdiction
CREATE TABLE IF NOT EXISTS public.jurisdiction_playbooks (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_iso2            text        NOT NULL UNIQUE,
  country_name            text        NOT NULL,
  difficulty              text        NOT NULL DEFAULT 'moderate',
  typical_timeline_months integer     NOT NULL DEFAULT 12,
  estimated_cost_range    text,
  legal_framework_summary text,
  steps                   jsonb       NOT NULL DEFAULT '[]',
  key_regulators          jsonb       NOT NULL DEFAULT '[]',
  common_pitfalls         text[]      NOT NULL DEFAULT '{}',
  status                  text        NOT NULL DEFAULT 'published',
  last_reviewed           date        NOT NULL DEFAULT CURRENT_DATE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jurisdiction_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_published_playbooks ON public.jurisdiction_playbooks
  FOR SELECT USING (status = 'published');

CREATE POLICY service_write_playbooks ON public.jurisdiction_playbooks
  FOR ALL USING (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618163718','jurisdiction_playbooks','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618163718_jurisdiction_playbooks.sql

-- RECOVERY BEGIN 20260618163726_hv_professionals.sql
-- hv_professionals: verified professionals directory
CREATE TABLE IF NOT EXISTS public.hv_professionals (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug            text        NOT NULL UNIQUE,
  full_name               text        NOT NULL,
  title                   text,
  credential_type         text        NOT NULL,
  specialties             text[]      NOT NULL DEFAULT '{}',
  countries               text[]      NOT NULL DEFAULT '{}',
  languages               text[]      NOT NULL DEFAULT '{}',
  bio_public              text,
  institution             text,
  institution_country     text,
  accepts_referrals       boolean     NOT NULL DEFAULT false,
  consultation_available  boolean     NOT NULL DEFAULT false,
  clinical_focus          text[],
  verification_status     text        NOT NULL DEFAULT 'pending',
  verified_at             timestamptz,
  status                  text        NOT NULL DEFAULT 'active',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_verification  ON public.hv_professionals (verification_status);
CREATE INDEX idx_professionals_credential    ON public.hv_professionals (credential_type);
CREATE INDEX idx_professionals_countries     ON public.hv_professionals USING gin (countries);

ALTER TABLE public.hv_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_verified_professionals ON public.hv_professionals
  FOR SELECT USING (status = 'active' AND verification_status = 'verified');

CREATE POLICY service_write_professionals ON public.hv_professionals
  FOR ALL USING (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618163726','hv_professionals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618163726_hv_professionals.sql

-- RECOVERY BEGIN 20260618163737_deal_rooms.sql
-- deal_rooms + deal_room_messages: private deal negotiation rooms
CREATE TABLE IF NOT EXISTS public.deal_rooms (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  listing_ref      text,
  initiator_id     uuid        REFERENCES auth.users(id),
  counterparty_id  uuid        REFERENCES auth.users(id),
  status           text        NOT NULL DEFAULT 'active',
  nda_required     boolean     NOT NULL DEFAULT false,
  nda_accepted_by  uuid[],
  access_token     text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_rooms_initiator    ON public.deal_rooms (initiator_id);
CREATE INDEX idx_deal_rooms_counterparty ON public.deal_rooms (counterparty_id);

ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_room_participants_select ON public.deal_rooms
  FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = counterparty_id);

CREATE POLICY deal_room_initiator_insert ON public.deal_rooms
  FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY deal_room_participants_update ON public.deal_rooms
  FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = counterparty_id);

CREATE POLICY service_write_deal_rooms ON public.deal_rooms
  FOR ALL USING (auth.role() = 'service_role');

-- Deal room messages
CREATE TABLE IF NOT EXISTS public.deal_room_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid        NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  sender_id    uuid        REFERENCES auth.users(id),
  message_type text        NOT NULL DEFAULT 'text',
  body         text        NOT NULL,
  attachments  jsonb       NOT NULL DEFAULT '[]',
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_room_messages_room ON public.deal_room_messages (room_id, created_at);

ALTER TABLE public.deal_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_room_messages_participants_select ON public.deal_room_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deal_rooms dr
      WHERE dr.id = deal_room_messages.room_id
        AND (dr.initiator_id = auth.uid() OR dr.counterparty_id = auth.uid())
    )
  );

CREATE POLICY deal_room_messages_participants_insert ON public.deal_room_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM deal_rooms dr
      WHERE dr.id = deal_room_messages.room_id
        AND (dr.initiator_id = auth.uid() OR dr.counterparty_id = auth.uid())
    )
  );

CREATE POLICY service_write_deal_room_messages ON public.deal_room_messages
  FOR ALL USING (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618163737','deal_rooms','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618163737_deal_rooms.sql

-- RECOVERY BEGIN 20260618164100_seed_jurisdiction_playbooks_batch1.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618164100','seed_jurisdiction_playbooks_batch1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618164100_seed_jurisdiction_playbooks_batch1.sql

-- RECOVERY BEGIN 20260618164151_seed_jurisdiction_playbooks_batch2.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618164151','seed_jurisdiction_playbooks_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618164151_seed_jurisdiction_playbooks_batch2.sql

-- RECOVERY BEGIN 20260618164253_seed_jurisdiction_playbooks_batch3.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618164253','seed_jurisdiction_playbooks_batch3','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618164253_seed_jurisdiction_playbooks_batch3.sql

-- RECOVERY BEGIN 20260618164418_seed_jurisdiction_playbooks_batch4.sql
-- stub: applied directly to production DB; file added to satisfy supabase migration version tracking.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618164418','seed_jurisdiction_playbooks_batch4','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618164418_seed_jurisdiction_playbooks_batch4.sql

-- RECOVERY BEGIN 20260618190000_fix_jurisdiction_briefings_write_policy.sql
-- Enforce the jurisdiction briefing publication boundary.
-- Published rows remain guest-readable; writes remain service-role only.

alter table public.jurisdiction_briefings enable row level security;

revoke all on table public.jurisdiction_briefings from public, anon, authenticated;
grant select on table public.jurisdiction_briefings to anon, authenticated;
grant all on table public.jurisdiction_briefings to service_role;

drop policy if exists public_read_published on public.jurisdiction_briefings;
create policy public_read_published
  on public.jurisdiction_briefings
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists service_write on public.jurisdiction_briefings;
create policy service_write
  on public.jurisdiction_briefings
  for all
  to service_role
  using (true)
  with check (true);

do $jurisdiction_briefing_policy_assertion$
declare
  unsafe_write_policy_count integer;
  service_policy_count integer;
begin
  select count(*)
  into unsafe_write_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'jurisdiction_briefings'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    and (roles && array['public','anon','authenticated']::name[]);

  select count(*)
  into service_policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'jurisdiction_briefings'
    and policyname = 'service_write'
    and cmd = 'ALL'
    and roles = array['service_role']::name[];

  if unsafe_write_policy_count <> 0 or service_policy_count <> 1 then
    raise exception 'jurisdiction_briefings policy boundary invalid: unsafe=%, service=%',
      unsafe_write_policy_count,
      service_policy_count;
  end if;
end
$jurisdiction_briefing_policy_assertion$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618190000','fix_jurisdiction_briefings_write_policy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618190000_fix_jurisdiction_briefings_write_policy.sql

-- RECOVERY BEGIN 20260618210641_maximize_schema_indexes_rls_fixes.sql
-- maximize_schema_indexes_rls_fixes: indexes and RLS hardening applied Jun 18 session
-- Applied directly to production DB during the Jun 18 2026 maximize session.
-- Covers performance indexes and RLS policy fixes across multiple tables.
SELECT 1; -- no-op; schema was applied directly


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210641','maximize_schema_indexes_rls_fixes','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210641_maximize_schema_indexes_rls_fixes.sql

-- RECOVERY BEGIN 20260618210800_source_snapshots_processing_contract_replay.sql
-- Replay-safe convergence between the historical used/surplus snapshot table
-- and the production source-capture processing contract.
--
-- Legacy columns are retained for compatibility. Production capture fields are
-- added and backfilled from the earlier representation without deleting or
-- re-keying any source evidence.

alter table public.source_snapshots
  add column if not exists captured_url text,
  add column if not exists captured_title text,
  add column if not exists captured_text text,
  add column if not exists raw_html_hash text,
  add column if not exists captured_at timestamptz,
  add column if not exists fetch_status text,
  add column if not exists error_message text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz,
  add column if not exists language_detected text,
  add column if not exists word_count integer,
  add column if not exists requires_translation boolean default false,
  add column if not exists intelligence_pass integer,
  add column if not exists signal_candidates jsonb,
  add column if not exists processed_at timestamptz,
  add column if not exists processing_status text default 'pending',
  add column if not exists previous_hash text,
  add column if not exists changed boolean default false,
  add column if not exists published_at timestamptz;

update public.source_snapshots snapshot
set
  captured_url = coalesce(
    snapshot.captured_url,
    source.source_url,
    'urn:harbourview:source-snapshot:' || snapshot.id::text
  ),
  captured_text = coalesce(snapshot.captured_text, snapshot.raw_payload),
  raw_html_hash = coalesce(snapshot.raw_html_hash, snapshot.snapshot_hash),
  captured_at = coalesce(snapshot.captured_at, snapshot.fetched_at, now()),
  fetch_status = coalesce(
    snapshot.fetch_status,
    case
      when snapshot.http_status between 200 and 399 then 'success'
      when snapshot.http_status is null then 'skipped'
      else 'failed'
    end
  ),
  created_at = coalesce(snapshot.created_at, snapshot.fetched_at, now()),
  processing_status = coalesce(snapshot.processing_status, 'pending'),
  requires_translation = coalesce(snapshot.requires_translation, false),
  changed = coalesce(snapshot.changed, false)
from public.source_registry source
where source.id = snapshot.source_id;

-- Orphaned legacy snapshots still receive deterministic identity values.
update public.source_snapshots
set
  captured_url = coalesce(captured_url, 'urn:harbourview:source-snapshot:' || id::text),
  captured_text = coalesce(captured_text, raw_payload),
  raw_html_hash = coalesce(raw_html_hash, snapshot_hash),
  captured_at = coalesce(captured_at, fetched_at, now()),
  fetch_status = coalesce(
    fetch_status,
    case
      when http_status between 200 and 399 then 'success'
      when http_status is null then 'skipped'
      else 'failed'
    end
  ),
  created_at = coalesce(created_at, fetched_at, now()),
  processing_status = coalesce(processing_status, 'pending'),
  requires_translation = coalesce(requires_translation, false),
  changed = coalesce(changed, false)
where captured_url is null
   or captured_at is null
   or fetch_status is null
   or created_at is null
   or processing_status is null;

alter table public.source_snapshots
  alter column captured_url set not null,
  alter column captured_at set default now(),
  alter column captured_at set not null,
  alter column fetch_status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column processing_status set default 'pending';

do $source_snapshot_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_snapshots'::regclass
      and conname = 'source_snapshots_fetch_status_check'
  ) then
    alter table public.source_snapshots
      add constraint source_snapshots_fetch_status_check
      check (fetch_status in ('success','failed','blocked','skipped')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_snapshots'::regclass
      and conname = 'source_snapshots_processing_status_check'
  ) then
    alter table public.source_snapshots
      add constraint source_snapshots_processing_status_check
      check (processing_status in ('pending','processing','processed','failed','skipped','published')) not valid;
  end if;
end
$source_snapshot_constraints$;

create index if not exists idx_source_snapshots_processing_status_captured
  on public.source_snapshots(processing_status, captured_at);
create index if not exists idx_source_snapshots_captured_at
  on public.source_snapshots(captured_at desc);

alter table public.source_snapshots enable row level security;
revoke all on table public.source_snapshots from public, anon;
grant all on table public.source_snapshots to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210800','source_snapshots_processing_contract_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210800_source_snapshots_processing_contract_replay.sql

-- RECOVERY BEGIN 20260618210830_operational_data_flow_foundation_replay.sql
-- Replay-safe operational foundation recovered from the production schema.
-- These relations existed in production before the June 18 data-flow backfill,
-- but their creation history was recorded only as no-op production stubs.

create table if not exists public.engagements (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  type text not null default 'retainer'
    check (type in ('retainer','commission','project','placement')),
  status text not null default 'active'
    check (status in ('active','scoping','paused','closed')),
  monthly_value numeric(10,2),
  total_value numeric(10,2),
  entity text not null default 'harbourview'
    check (entity in ('harbourview','strangford')),
  next_action text,
  next_action_date date,
  start_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossier_status (
  id uuid primary key default gen_random_uuid(),
  market text not null unique,
  region text not null default 'Europe'
    check (region in ('Europe','LATAM','ANZ','North America','Africa','Asia','Middle East','Other')),
  status text not null default 'not_started'
    check (status in ('current','in_progress','stale','not_started')),
  last_updated date,
  priority text not null default 'later'
    check (priority in ('now','soon','later','parked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Deal',
  stage text not null default 'Identified',
  priority text not null default 'soon'
    check (priority in ('now','soon','later','parked')),
  priority_order integer generated always as (
    case priority
      when 'now' then 1
      when 'soon' then 2
      when 'later' then 3
      else 4
    end
  ) stored,
  value_est text,
  value_num numeric(12,2),
  next_action text,
  next_action_date date,
  project text,
  market text,
  counterparty text,
  notes text,
  entity text not null default 'harbourview'
    check (entity in ('harbourview','strangford','personal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now(),
  country_id uuid references public.countries(id),
  storage_bucket text,
  file_path text,
  file_size_bytes bigint,
  maturity_score integer,
  maturity_tier text,
  page_count integer,
  updated_at timestamptz not null default now(),
  drive_file_id text
);

create table if not exists public.hv_public_feed (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  artifact_id uuid not null unique references public.hv_artifacts(id),
  feed_type text not null,
  title_public text not null,
  summary_public text not null,
  body_public text,
  jurisdiction_code text,
  country_iso text,
  region text,
  tags text[],
  effective_date date,
  source_label text,
  authority_label text,
  status text not null default 'draft',
  published_at timestamptz,
  unpublished_at timestamptz,
  review_due_at timestamptz,
  expires_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  publication_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Processing queue types and tables recovered from production.
do $hv_job_types$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'hv_job_type'
  ) then
    create type public.hv_job_type as enum (
      'embed','summarize','ocr','parse','extract_relations','classify',
      'translate','signal_extraction','duplicate_check','public_dto_generate'
    );
  end if;

  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'hv_job_status'
  ) then
    create type public.hv_job_status as enum (
      'pending','claimed','running','completed','failed','dead_letter','cancelled'
    );
  end if;
end
$hv_job_types$;

create table if not exists public.hv_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  artifact_id uuid references public.hv_artifacts(id) on delete cascade,
  job_type public.hv_job_type not null,
  job_key text not null unique,
  priority integer not null default 5,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  status public.hv_job_status not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  last_error text,
  dead_letter_reason text,
  scheduled_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  dead_lettered_at timestamptz,
  next_retry_at timestamptz,
  claimed_by text,
  worker_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hv_job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.hv_processing_jobs(id) on delete cascade,
  attempt_num integer not null,
  status text not null,
  worker_id text,
  worker_version text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  error text,
  output_hash text,
  created_at timestamptz not null default now()
);

-- Ensure the pre-existing marketplace candidate table exposes the fields used
-- by the June data-flow backfill. Existing values and provenance are preserved.
alter table public.marketplace_candidates
  add column if not exists confidence numeric,
  add column if not exists reviewed_at timestamptz;

do $marketplace_candidate_status_contract$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_status_check'
  ) then
    alter table public.marketplace_candidates
      drop constraint marketplace_candidates_status_check;
  end if;

  alter table public.marketplace_candidates
    add constraint marketplace_candidates_status_check
    check (status in (
      'captured','needs_review','needs_verification','reviewed',
      'approved_draft','rejected','archived'
    )) not valid;
end
$marketplace_candidate_status_contract$;

create index if not exists idx_engagements_status on public.engagements(status, updated_at desc);
create index if not exists idx_dossier_status_priority on public.dossier_status(priority, last_updated desc);
create index if not exists idx_opportunities_priority on public.opportunities(priority_order, updated_at desc);
create index if not exists idx_hv_public_feed_status_published on public.hv_public_feed(status, published_at desc);
create index if not exists idx_hv_processing_jobs_queue on public.hv_processing_jobs(status, priority, scheduled_at);
create index if not exists idx_hv_job_attempts_job on public.hv_job_attempts(job_id, attempt_num);

alter table public.engagements enable row level security;
alter table public.dossier_status enable row level security;
alter table public.opportunities enable row level security;
alter table public.dossiers enable row level security;
alter table public.hv_public_feed enable row level security;
alter table public.hv_processing_jobs enable row level security;
alter table public.hv_job_attempts enable row level security;

revoke all on table public.engagements from public, anon, authenticated;
revoke all on table public.dossier_status from public, anon, authenticated;
revoke all on table public.opportunities from public, anon, authenticated;
revoke all on table public.dossiers from public, anon, authenticated;
revoke all on table public.hv_public_feed from public, anon, authenticated;
revoke all on table public.hv_processing_jobs from public, anon, authenticated;
revoke all on table public.hv_job_attempts from public, anon, authenticated;

grant all on table public.engagements to service_role;
grant all on table public.dossier_status to service_role;
grant all on table public.opportunities to service_role;
grant all on table public.dossiers to service_role;
grant select on table public.hv_public_feed to anon, authenticated;
grant all on table public.hv_public_feed to service_role;
grant all on table public.hv_processing_jobs to service_role;
grant all on table public.hv_job_attempts to service_role;

drop policy if exists hv_public_feed_public_read on public.hv_public_feed;
create policy hv_public_feed_public_read
  on public.hv_public_feed for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists opportunities_admin_operator_read on public.opportunities;
create policy opportunities_admin_operator_read
  on public.opportunities for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator','analyst')
    )
  );

drop policy if exists dossiers_admin_operator_select on public.dossiers;
create policy dossiers_admin_operator_select
  on public.dossiers for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator')
    )
  );

drop policy if exists hv_jobs_admin_only on public.hv_processing_jobs;
create policy hv_jobs_admin_only
  on public.hv_processing_jobs for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  );

drop policy if exists hv_job_attempts_admin_only on public.hv_job_attempts;
create policy hv_job_attempts_admin_only
  on public.hv_job_attempts for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role = 'admin'
    )
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210830','operational_data_flow_foundation_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210830_operational_data_flow_foundation_replay.sql

-- RECOVERY BEGIN 20260618210840_public_signals_foundation_replay.sql
-- Replay-safe public intelligence signal foundation recovered from production.
-- This table is distinct from the regulatory_signals schema and ia_signals. It
-- is the reviewed public/intelligence feed consumed by the June data-flow and
-- command-centre automation layer.

create table if not exists public.signals (
  id text primary key,
  date timestamptz,
  cat text,
  pri text,
  score integer default 0,
  headline text,
  summary text,
  source text,
  url text,
  verification text,
  tier text,
  lang text,
  company text,
  country text,
  in_network boolean default false,
  lane_r integer default 0,
  lane_e integer default 0,
  lane_t integer default 0,
  top_lane text,
  query_pack text,
  commercial_impact text,
  reviewed boolean default false,
  action text default '',
  created_at timestamptz default now(),
  embedding_1024 vector(1024),
  embedding_model text,
  embedded_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  country_iso2 text,
  geo_scope text,
  geo_region text,
  analysis jsonb,
  analysis_generated_at timestamptz,
  analysis_backend text,
  title_en text,
  summary_en text,
  lang_detected text,
  translated_at timestamptz,
  translation_model text,
  quality_label text,
  content_type text,
  impact text,
  quality_confidence numeric,
  classifier_version text,
  cluster_rep_id text,
  is_representative boolean,
  corroborating_count integer,
  editorial_title text,
  editorial_blurb text,
  entities_extracted_at timestamptz,
  snapshot_id uuid references public.source_snapshots(id),
  used_in_digest_at timestamptz
);

create index if not exists idx_signals_created_at on public.signals(created_at desc);
create index if not exists idx_signals_reviewed_score on public.signals(reviewed, score desc);
create index if not exists idx_signals_country on public.signals(country, created_at desc);
create index if not exists idx_signals_country_iso2 on public.signals(country_iso2, created_at desc);
create index if not exists idx_signals_category on public.signals(cat, created_at desc);
create index if not exists idx_signals_snapshot_id on public.signals(snapshot_id);
create index if not exists idx_signals_embedding_1024_hnsw
  on public.signals using hnsw (embedding_1024 vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table public.signals enable row level security;
revoke all on table public.signals from public, anon, authenticated;
grant select on table public.signals to anon, authenticated;
grant all on table public.signals to service_role;

drop policy if exists signals_public_reviewed_select on public.signals;
create policy signals_public_reviewed_select
  on public.signals for select
  to anon, authenticated
  using (reviewed = true);

drop policy if exists signals_admin_operator_analyst_select on public.signals;
create policy signals_admin_operator_analyst_select
  on public.signals for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator','analyst')
    )
  );


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210840','public_signals_foundation_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210840_public_signals_foundation_replay.sql

-- RECOVERY BEGIN 20260618210850_source_registry_crawl_contract_replay.sql
-- Replay-safe convergence between the historical used/surplus source registry
-- and the production intelligence-source crawl contract.
--
-- Existing legacy keys, category fields and parser settings remain intact for
-- historical rows. Modern intelligence-source rows are not required to invent
-- those retired identifiers; canonical source_name/source_url fields own the
-- forward contract.

alter table public.source_registry
  add column if not exists source_name text,
  add column if not exists is_active boolean,
  add column if not exists sub_region text,
  add column if not exists requires_translation boolean,
  add column if not exists signal_keywords text[],
  add column if not exists notes text,
  add column if not exists region text,
  add column if not exists language text,
  add column if not exists adapter text,
  add column if not exists crawl_cadence text,
  add column if not exists relevance_status text,
  add column if not exists tier integer,
  add column if not exists requires_auth boolean,
  add column if not exists publish_cadence text,
  add column if not exists source_type text,
  add column if not exists crawl_allowed boolean,
  add column if not exists next_crawl_at timestamptz,
  add column if not exists locked_until timestamptz,
  add column if not exists locked_by text,
  add column if not exists consecutive_failures integer,
  add column if not exists last_error_log text,
  add column if not exists network_status text,
  add column if not exists content_change_rate double precision,
  add column if not exists verification_notes text,
  add column if not exists verification_checked_at timestamptz,
  add column if not exists content_type text[],
  add column if not exists metadata jsonb;

update public.source_registry
set
  source_name = coalesce(source_name, name, source_key, source_url),
  is_active = coalesce(is_active, status <> 'disabled'),
  requires_translation = coalesce(requires_translation, false),
  language = coalesce(nullif(language, ''), 'en'),
  adapter = coalesce(nullif(adapter, ''), nullif(parser_type, ''), 'html_snapshot'),
  crawl_cadence = coalesce(
    nullif(crawl_cadence, ''),
    case
      when cadence_hours is null or cadence_hours <= 24 then 'daily'
      when cadence_hours <= 168 then 'weekly'
      else 'monthly'
    end
  ),
  relevance_status = coalesce(
    nullif(relevance_status, ''),
    case when status = 'disabled' then 'disabled' else 'active' end
  ),
  tier = coalesce(tier, 2),
  requires_auth = coalesce(requires_auth, false),
  source_type = coalesce(nullif(source_type, ''), nullif(category, ''), 'unknown'),
  crawl_allowed = coalesce(crawl_allowed, status <> 'disabled'),
  next_crawl_at = coalesce(
    next_crawl_at,
    last_checked_at + make_interval(hours => greatest(coalesce(cadence_hours, 24), 1)),
    now()
  ),
  consecutive_failures = coalesce(consecutive_failures, 0),
  network_status = coalesce(nullif(network_status, ''), 'online'),
  content_change_rate = coalesce(content_change_rate, 0.5),
  metadata = coalesce(metadata, '{}'::jsonb);

-- The historical used/surplus table required these three fields. Production's
-- unified registry does not. Retain populated legacy values, but permit all later
-- canonical rows to rely on source_name/source_url without synthetic identifiers.
alter table public.source_registry
  alter column source_key drop not null,
  alter column category drop not null,
  alter column name drop not null;

alter table public.source_registry
  alter column source_name set not null,
  alter column is_active set default true,
  alter column is_active set not null,
  alter column requires_translation set default false,
  alter column language set default 'en',
  alter column adapter set default 'html_snapshot',
  alter column crawl_cadence set default 'daily',
  alter column relevance_status set default 'active',
  alter column tier set default 2,
  alter column requires_auth set default false,
  alter column requires_auth set not null,
  alter column crawl_allowed set default true,
  alter column crawl_allowed set not null,
  alter column next_crawl_at set default now(),
  alter column consecutive_failures set default 0,
  alter column consecutive_failures set not null,
  alter column network_status set default 'online',
  alter column network_status set not null,
  alter column content_change_rate set default 0.5,
  alter column metadata set default '{}'::jsonb;

do $source_registry_contracts$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_registry'::regclass
      and conname = 'source_registry_tier_check'
  ) then
    alter table public.source_registry
      add constraint source_registry_tier_check
      check (tier is null or tier between 1 and 3) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.source_registry'::regclass
      and conname = 'source_registry_network_status_check'
  ) then
    alter table public.source_registry
      add constraint source_registry_network_status_check
      check (network_status in ('online','degraded','offline','quarantined')) not valid;
  end if;
end
$source_registry_contracts$;

create index if not exists idx_source_registry_due_crawl
  on public.source_registry(next_crawl_at, tier)
  where is_active = true and crawl_allowed = true;
create index if not exists idx_source_registry_network_status
  on public.source_registry(network_status, consecutive_failures desc);
create index if not exists idx_source_registry_iso_active
  on public.source_registry(iso, is_active)
  where iso is not null;

alter table public.source_registry enable row level security;
revoke all on table public.source_registry from public, anon;
grant select, insert, update, delete on table public.source_registry to authenticated;
grant all on table public.source_registry to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210850','source_registry_crawl_contract_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210850_source_registry_crawl_contract_replay.sql

-- RECOVERY BEGIN 20260618210939_maximize_schema_data_flows.sql

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: maximize_schema_data_flows
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. MARK STALE PENDING SNAPSHOTS AS SKIPPED ──────────────────────────────
UPDATE public.source_snapshots
SET processing_status = 'skipped'
WHERE processing_status = 'pending'
  AND captured_at < NOW() - INTERVAL '7 days';

-- ─── 2. PROMOTE hv_artifacts → published ─────────────────────────────────────
UPDATE public.hv_artifacts
SET lifecycle_stage = 'published',
    published_at    = COALESCE(published_at, NOW()),
    review_status   = 'approved',
    updated_at      = NOW()
WHERE lifecycle_stage = 'normalized';

-- ─── 3. POPULATE hv_public_feed FROM PUBLISHED ARTIFACTS ─────────────────────
INSERT INTO public.hv_public_feed (
  workspace_id, artifact_id, feed_type,
  title_public, summary_public, body_public,
  jurisdiction_code, country_iso, region,
  tags, status, published_at, approved_at,
  created_by, created_at, updated_at
)
SELECT
  a.workspace_id,
  a.id,
  a.object_class::text,
  a.title,
  LEFT(COALESCE(a.body, a.title, ''), 500),
  a.body,
  a.jurisdiction_code,
  a.country_iso,
  a.region,
  ARRAY[]::text[],
  'published',
  COALESCE(a.published_at, NOW()),
  NOW(),
  a.created_by,
  NOW(),
  NOW()
FROM public.hv_artifacts a
WHERE a.lifecycle_stage = 'published'
  AND NOT EXISTS (SELECT 1 FROM public.hv_public_feed f WHERE f.artifact_id = a.id);

-- ─── 4. SEED OPPORTUNITIES FROM ENGAGEMENTS ──────────────────────────────────
-- priority GENERATED via priority_order, so omit priority_order
-- valid priority values that trigger meaningful order: 'now', 'soon', 'later'
INSERT INTO public.opportunities (
  name, type, stage, priority,
  value_est, value_num, next_action, next_action_date,
  market, counterparty, notes, entity, created_at, updated_at
)
SELECT
  e.client || ' — ' || e.type,
  e.type,
  CASE e.status
    WHEN 'active'   THEN 'execution'
    WHEN 'prospect' THEN 'discovery'
    WHEN 'paused'   THEN 'on_hold'
    ELSE 'pipeline'
  END,
  CASE e.status WHEN 'active' THEN 'now' WHEN 'prospect' THEN 'soon' ELSE 'later' END,
  CASE WHEN e.total_value IS NOT NULL THEN e.total_value::text ELSE NULL END,
  e.total_value,
  e.next_action,
  e.next_action_date,
  NULL,
  e.client,
  e.notes,
  e.entity,
  e.created_at,
  e.updated_at
FROM public.engagements e
WHERE NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.counterparty = e.client)
  AND e.client IS NOT NULL;

-- High-priority dossier market opportunities
INSERT INTO public.opportunities (
  name, type, stage, priority,
  market, notes, entity, created_at, updated_at
)
SELECT
  d.market || ' — Market Entry Intelligence',
  'market_intelligence',
  CASE d.status
    WHEN 'current'     THEN 'active'
    WHEN 'in_progress' THEN 'research'
    WHEN 'stale'       THEN 'review'
    ELSE 'pipeline'
  END,
  CASE d.priority WHEN 'high' THEN 'now' WHEN 'medium' THEN 'soon' ELSE 'later' END,
  d.market,
  d.notes,
  'Harbourview',
  d.created_at,
  d.updated_at
FROM public.dossier_status d
WHERE d.priority IN ('high','medium')
  AND NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.market = d.market)
ORDER BY d.priority, d.last_updated DESC
LIMIT 20;

-- ─── 5. SEED user_dashboard_preferences FOR EXISTING USERS ──────────────────
INSERT INTO public.user_dashboard_preferences (
  user_id, country_iso2, role_id, heatmap_layer, created_at, updated_at
)
SELECT
  up.id,
  'CA',
  'admin',
  'medical_status',
  NOW(),
  NOW()
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_dashboard_preferences p WHERE p.user_id = up.id
);

-- ─── 6. BACKFILL ia_signals FROM HIGH-QUALITY signals ────────────────────────
-- stage valid: new|needs_review|qualified|converted_to_opportunity|...
-- commercial_impact valid: high|medium|low
INSERT INTO public.ia_signals (
  id, title, type, stage, source_name,
  market, category, confidence, commercial_impact,
  summary, detected_at, created_at, updated_at
)
SELECT
  's-' || s.id::text,
  s.headline,
  COALESCE(NULLIF(s.cat, 'SOURCE_ENGINE'), 'regulatory'),
  CASE WHEN s.score >= 8 THEN 'qualified' ELSE 'needs_review' END,
  COALESCE(s.source, 'Harbourview Intelligence'),
  COALESCE(NULLIF(s.country, ''), 'Global'),
  COALESCE(NULLIF(s.cat, 'SOURCE_ENGINE'), 'regulatory'),
  LEAST(GREATEST(((s.score / 10.0) * 100)::int, 0), 100),
  CASE WHEN s.score >= 9 THEN 'high' WHEN s.score >= 7 THEN 'medium' ELSE 'low' END,
  COALESCE(s.summary, s.headline),
  COALESCE(s.date, s.created_at::date),
  s.created_at,
  s.created_at
FROM public.signals s
WHERE s.reviewed = true
  AND s.score >= 8
  AND s.cat NOT IN ('SOURCE_ENGINE')
  AND NOT EXISTS (SELECT 1 FROM public.ia_signals ia WHERE ia.id = 's-' || s.id::text)
ORDER BY s.score DESC, s.created_at DESC
LIMIT 200;

-- ─── 7. SEED dossiers FROM dossier_status ────────────────────────────────────
INSERT INTO public.dossiers (title, created_at)
SELECT
  d.market || ' — ' || d.region,
  d.created_at
FROM public.dossier_status d
WHERE NOT EXISTS (
  SELECT 1 FROM public.dossiers dos WHERE dos.title LIKE d.market || '%'
);

-- ─── 8. FIX NULL-COUNTRY SIGNALS ─────────────────────────────────────────────
UPDATE public.signals
SET country = 'Global'
WHERE (country IS NULL OR country = '')
  AND cat = 'SOURCE_ENGINE';

-- ─── 9. MARK SUCCEEDED hv_processing_jobs AS COMPLETED ───────────────────────
UPDATE public.hv_processing_jobs j
SET status       = 'completed',
    completed_at = (
      SELECT MAX(a.ended_at) FROM public.hv_job_attempts a
      WHERE a.job_id = j.id AND a.status = 'succeeded'
    ),
    updated_at   = NOW()
WHERE j.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.hv_job_attempts a
    WHERE a.job_id = j.id AND a.status = 'succeeded'
  );

-- ─── 10. ADVANCE HIGH-CONFIDENCE marketplace_candidates ───────────────────────
UPDATE public.marketplace_candidates
SET status      = 'reviewed',
    reviewed_at = NOW()
WHERE status = 'needs_review'
  AND confidence > 0.8
  AND title_public_draft IS NOT NULL
  AND title_public_draft != '';

-- ─── 11. SET next_crawl_at FOR ACTIVE SOURCES WITHOUT SCHEDULE ───────────────
UPDATE public.source_registry
SET next_crawl_at = NOW() + INTERVAL '24 hours'
WHERE is_active    = true
  AND crawl_allowed = true
  AND next_crawl_at IS NULL;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618210939','maximize_schema_data_flows','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618210939_maximize_schema_data_flows.sql

-- RECOVERY BEGIN 20260618211000_country_intel_foundation_replay.sql
-- Replay-safe country intelligence foundation recovered from production.
-- The table is intentionally not seeded here: reviewed summaries and regulatory
-- tiers are evidence-bearing content and must not be synthesized during schema
-- reconstruction.

create extension if not exists "uuid-ossp";

create table if not exists public.country_intel (
  id uuid primary key default uuid_generate_v4(),
  country_code text not null unique,
  country_name text not null,
  public_summary text,
  commercial_pathway_summary text,
  review_status text not null default 'active',
  regulatory_tier text not null default 'regulated',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_enriched_at timestamptz
);

create index if not exists idx_country_intel_review_status
  on public.country_intel(review_status, regulatory_tier, country_code);
create index if not exists idx_country_intel_last_reviewed
  on public.country_intel(last_reviewed_at desc nulls last);

alter table public.country_intel enable row level security;
revoke all on table public.country_intel from public, anon, authenticated;
grant select on table public.country_intel to authenticated;
grant all on table public.country_intel to service_role;

drop policy if exists country_intel_admin_select on public.country_intel;
create policy country_intel_admin_select
  on public.country_intel for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles role_record
      where role_record.user_id = (select auth.uid())
        and role_record.role in ('admin','operator','analyst')
    )
  );

drop policy if exists country_intel_intel_tier_read on public.country_intel;
create policy country_intel_intel_tier_read
  on public.country_intel for select
  to authenticated
  using (
    review_status = 'active'
    and exists (
      select 1 from public.user_profiles profile
      where profile.id = (select auth.uid())
        and profile.tier in ('intel','operator')
    )
  );

do $country_intel_updated_at$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'drop trigger if exists set_country_intel_updated_at on public.country_intel';
    execute 'create trigger set_country_intel_updated_at before update on public.country_intel for each row execute function public.set_updated_at()';
  end if;
end
$country_intel_updated_at$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618211000','country_intel_foundation_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618211000_country_intel_foundation_replay.sql

-- RECOVERY BEGIN 20260618211145_maximize_schema_automation_views.sql

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: maximize_schema_automation_views
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. TRIGGER: auto-create user_dashboard_preferences on profile create ────
CREATE OR REPLACE FUNCTION public.auto_create_dashboard_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_dashboard_preferences (user_id, country_iso2, role_id, heatmap_layer)
  VALUES (NEW.id, 'CA', 'visitor', 'medical_status')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_created_prefs ON public.user_profiles;
CREATE TRIGGER on_user_profile_created_prefs
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_dashboard_preferences();

-- ─── 2. TRIGGER: auto-publish hv_artifacts to hv_public_feed ────────────────
CREATE OR REPLACE FUNCTION public.hv_artifact_publish_to_feed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lifecycle_stage = 'published' AND NEW.public_eligible = true
    AND (OLD.lifecycle_stage IS DISTINCT FROM 'published' OR OLD IS NULL)
  THEN
    INSERT INTO public.hv_public_feed (
      workspace_id, artifact_id, feed_type, title_public, summary_public,
      body_public, jurisdiction_code, country_iso, region, tags, status,
      published_at, approved_at, created_by, created_at, updated_at
    ) VALUES (
      NEW.workspace_id, NEW.id, NEW.object_class::text, NEW.title,
      LEFT(COALESCE(NEW.body, NEW.title, ''), 500), NEW.body,
      NEW.jurisdiction_code, NEW.country_iso, NEW.region,
      ARRAY[]::text[], 'published', COALESCE(NEW.published_at, NOW()),
      NOW(), NEW.created_by, NOW(), NOW()
    ) ON CONFLICT (artifact_id) DO UPDATE
      SET title_public   = EXCLUDED.title_public,
          summary_public = EXCLUDED.summary_public,
          body_public    = EXCLUDED.body_public,
          status         = 'published',
          published_at   = EXCLUDED.published_at,
          updated_at     = NOW();
  END IF;
  IF NEW.lifecycle_stage = 'archived' AND OLD.lifecycle_stage = 'published' THEN
    UPDATE public.hv_public_feed
    SET status = 'unpublished', unpublished_at = NOW(), updated_at = NOW()
    WHERE artifact_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.hv_public_feed'::regclass
      AND conname = 'hv_public_feed_artifact_id_key'
  ) THEN
    ALTER TABLE public.hv_public_feed ADD CONSTRAINT hv_public_feed_artifact_id_key UNIQUE (artifact_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS hv_artifact_publish_trigger ON public.hv_artifacts;
CREATE TRIGGER hv_artifact_publish_trigger
  AFTER INSERT OR UPDATE OF lifecycle_stage ON public.hv_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.hv_artifact_publish_to_feed();

-- ─── 3. TRIGGER: auto-sync reviewed signals → ia_signals ─────────────────────
CREATE OR REPLACE FUNCTION public.sync_signal_to_ia_signals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reviewed = true AND NEW.score >= 8 AND COALESCE(NEW.cat, '') NOT IN ('SOURCE_ENGINE') THEN
    INSERT INTO public.ia_signals (
      id, title, type, stage, source_name, market, category,
      confidence, commercial_impact, summary, detected_at, created_at, updated_at
    ) VALUES (
      's-' || NEW.id::text,
      NEW.headline,
      COALESCE(NULLIF(NEW.cat, ''), 'regulatory'),
      CASE WHEN NEW.score >= 8 THEN 'qualified' ELSE 'needs_review' END,
      COALESCE(NEW.source, 'Harbourview Intelligence'),
      COALESCE(NULLIF(NEW.country, ''), 'Global'),
      COALESCE(NULLIF(NEW.cat, ''), 'regulatory'),
      LEAST(GREATEST(((NEW.score / 10.0) * 100)::int, 0), 100),
      CASE WHEN NEW.score >= 9 THEN 'high' WHEN NEW.score >= 7 THEN 'medium' ELSE 'low' END,
      COALESCE(NEW.summary, NEW.headline),
      COALESCE(NEW.date, NEW.created_at::date),
      NEW.created_at,
      NEW.created_at
    ) ON CONFLICT (id) DO UPDATE
      SET stage             = EXCLUDED.stage,
          confidence        = EXCLUDED.confidence,
          commercial_impact = EXCLUDED.commercial_impact,
          updated_at        = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS signals_sync_to_ia ON public.signals;
CREATE TRIGGER signals_sync_to_ia
  AFTER INSERT OR UPDATE OF reviewed, score ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.sync_signal_to_ia_signals();

-- ─── 4. FUNCTION: platform health ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_platform_health()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
    'processing_jobs_stuck',          (SELECT COUNT(*) FROM hv_processing_jobs WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour')
  );
END;
$$;

-- ─── 5. ENHANCED get_command_centre_metrics ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_command_centre_metrics(
  p_role_id text, p_country text DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_result       JSONB := '{}';
  v_country_name TEXT;
BEGIN
  IF p_country IS NOT NULL THEN
    SELECT country_name INTO v_country_name
    FROM countries WHERE iso_alpha2 = UPPER(p_country) LIMIT 1;
  END IF;

  IF p_role_id = 'admin' THEN
    SELECT jsonb_build_object(
      'role',                    'admin',
      'pending_listings',        COALESCE((SELECT COUNT(*) FROM admin_pending_listings), 0),
      'pending_buyer_requests',  COALESCE((SELECT COUNT(*) FROM admin_pending_buyer_requests), 0),
      'new_inquiries',           COALESCE((SELECT new_inquiries FROM admin_dashboard_counts), 0),
      'pending_matches',         COALESCE((SELECT pending_matches FROM admin_dashboard_counts), 0),
      'pending_disclosures',     COALESCE((SELECT pending_disclosures FROM admin_dashboard_counts), 0),
      'total_approved_listings', (SELECT COUNT(*) FROM listings WHERE status = 'approved'),
      'total_signals_today',     (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '24 hours'),
      'total_countries_active',  (SELECT COUNT(DISTINCT location_country) FROM listings WHERE location_country IS NOT NULL AND length(location_country) = 2),
      'ia_signals_qualified',    (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified'),
      'published_briefings',     (SELECT COUNT(*) FROM jurisdiction_briefings WHERE status = 'published'),
      'hv_feed_items',           (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published'),
      'opportunities_now',       (SELECT COUNT(*) FROM opportunities WHERE priority = 'now'),
      'platform_health',         public.get_platform_health()
    ) INTO v_result;

  ELSIF p_role_id IN ('supplier','exporter','cultivator_producer','processor_extractor') THEN
    SELECT jsonb_build_object(
      'role',                  p_role_id,
      'total_active_listings', (SELECT COUNT(*) FROM listings WHERE p_country IS NULL OR location_country = UPPER(p_country)),
      'global_listings',       (SELECT COUNT(*) FROM listings),
      'categories_available',  (SELECT COUNT(DISTINCT category::text) FROM listings),
      'signals_this_week',     (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'top_signal_category',   (SELECT cat FROM signals WHERE (p_country IS NULL OR country = v_country_name OR country = 'Global') AND created_at >= NOW() - INTERVAL '30 days' AND cat != 'SOURCE_ENGINE' GROUP BY cat ORDER BY COUNT(*) DESC LIMIT 1),
      'open_inquiries',        (SELECT COUNT(*) FROM marketplace_inquiries WHERE review_status IS NULL OR review_status != 'closed'),
      'buyer_requests_active', (SELECT COUNT(*) FROM buyer_requests),
      'ia_signals_market',     (SELECT COUNT(*) FROM ia_signals WHERE (p_country IS NULL OR market = v_country_name OR market = 'Global') AND stage = 'qualified'),
      'briefing_available',    (SELECT EXISTS(SELECT 1 FROM jurisdiction_briefings WHERE country_iso2 = UPPER(COALESCE(p_country,'')) AND status = 'published'))
    ) INTO v_result;

  ELSIF p_role_id IN ('buyer','importer','distributor_wholesaler','retail_operator') THEN
    SELECT jsonb_build_object(
      'role',                   p_role_id,
      'available_listings',     (SELECT COUNT(*) FROM listings WHERE p_country IS NULL OR location_country = UPPER(p_country)),
      'global_listings',        (SELECT COUNT(*) FROM listings),
      'signals_this_week',      (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'categories',             (SELECT jsonb_agg(DISTINCT category::text ORDER BY category::text) FROM listings),
      'active_buyer_requests',  (SELECT COUNT(*) FROM buyer_requests),
      'marketplace_inquiries',  (SELECT COUNT(*) FROM marketplace_inquiries),
      'briefing_available',     (SELECT EXISTS(SELECT 1 FROM jurisdiction_briefings WHERE country_iso2 = UPPER(COALESCE(p_country,'')) AND status = 'published'))
    ) INTO v_result;

  ELSIF p_role_id IN ('investor_operator','regulatory_compliance','broker_trader') THEN
    SELECT jsonb_build_object(
      'role',                   p_role_id,
      'total_market_listings',  (SELECT COUNT(*) FROM listings),
      'signals_total',          (SELECT COUNT(*) FROM signals WHERE p_country IS NULL OR country = v_country_name),
      'high_priority_signals',  (SELECT COUNT(*) FROM signals WHERE pri = 'high' AND (p_country IS NULL OR country = v_country_name) AND created_at >= NOW() - INTERVAL '30 days'),
      'countries_with_listings',(SELECT COUNT(DISTINCT location_country) FROM listings WHERE location_country IS NOT NULL AND length(location_country) = 2),
      'signals_this_week',      (SELECT COUNT(*) FROM signals WHERE created_at >= NOW() - INTERVAL '7 days' AND (p_country IS NULL OR country = v_country_name OR country = 'Global')),
      'ia_signals_qualified',   (SELECT COUNT(*) FROM ia_signals WHERE stage = 'qualified' AND (p_country IS NULL OR market = v_country_name)),
      'opportunities_now',      (SELECT COUNT(*) FROM opportunities WHERE priority = 'now')
    ) INTO v_result;

  ELSE
    SELECT jsonb_build_object(
      'role',              'visitor',
      'total_listings',    (SELECT COUNT(*) FROM listings),
      'countries_covered', (SELECT COUNT(*) FROM countries),
      'signals_available', (SELECT COUNT(*) FROM signals WHERE reviewed = true),
      'categories',        (SELECT jsonb_agg(DISTINCT category::text ORDER BY category::text) FROM listings),
      'feed_items',        (SELECT COUNT(*) FROM hv_public_feed WHERE status = 'published')
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- ─── 6. VIEW: signals_intelligence_feed ──────────────────────────────────────
CREATE OR REPLACE VIEW public.signals_intelligence_feed AS
SELECT
  s.id::text   AS signal_id,
  s.headline   AS title,
  s.summary,
  s.cat        AS category,
  s.country,
  s.date       AS signal_date,
  s.score,
  s.pri        AS priority,
  s.commercial_impact,
  s.url,
  s.source,
  s.reviewed,
  s.created_at,
  'signals'    AS source_table
FROM public.signals s
WHERE s.reviewed = true AND s.score >= 6

UNION ALL

SELECT
  ia.id,
  ia.title,
  ia.summary,
  ia.category,
  ia.market    AS country,
  ia.detected_at AS signal_date,
  (ia.confidence / 10)::numeric AS score,
  ia.commercial_impact AS priority,
  ia.commercial_impact,
  NULL         AS url,
  ia.source_name AS source,
  true         AS reviewed,
  ia.created_at,
  'ia_signals' AS source_table
FROM public.ia_signals ia
WHERE ia.stage IN ('qualified','converted_to_opportunity')
  AND ia.id NOT LIKE 's-%';

-- ─── 7. VIEW: platform_coverage_summary ──────────────────────────────────────
CREATE OR REPLACE VIEW public.platform_coverage_summary AS
SELECT
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.medical_status,
  c.adult_use_status,
  c.import_status,
  c.export_status,
  c.opportunity_score,
  ci.review_status    AS intel_review_status,
  ci.regulatory_tier,
  jb.headline         AS latest_briefing,
  jb.week_ending      AS briefing_week,
  jb.legal_status     AS briefing_legal_status,
  COUNT(DISTINCT sr.id)   AS source_count,
  COUNT(DISTINCT l.id)    AS listing_count,
  COUNT(DISTINCT sig.id)  AS signal_count_7d
FROM public.countries c
LEFT JOIN public.country_intel ci ON ci.country_code = c.iso_alpha2
LEFT JOIN LATERAL (
  SELECT headline, week_ending, legal_status
  FROM public.jurisdiction_briefings
  WHERE country_iso2 = c.iso_alpha2 AND status = 'published'
  ORDER BY week_ending DESC LIMIT 1
) jb ON true
LEFT JOIN public.source_registry sr ON sr.iso = c.iso_alpha2 AND sr.is_active = true
LEFT JOIN public.listings l ON l.location_country = c.iso_alpha2 AND l.status = 'approved'
LEFT JOIN public.signals sig ON sig.country = c.country_name AND sig.created_at >= NOW() - INTERVAL '7 days'
GROUP BY
  c.iso_alpha2, c.country_name, c.region,
  c.medical_status, c.adult_use_status, c.import_status, c.export_status, c.opportunity_score,
  ci.review_status, ci.regulatory_tier,
  jb.headline, jb.week_ending, jb.legal_status;

-- ─── 8. SIGNAL SUBSCRIPTIONS: seed for existing users (with user_id) ──────────
INSERT INTO public.signal_subscriptions (
  user_id, email, markets, types, min_confidence, frequency, active, created_at, updated_at
)
SELECT
  up.id,
  up.email,
  ARRAY['Global','Canada','Germany','Australia','United Kingdom'],
  ARRAY['regulatory','market','financial'],
  7,
  'weekly',
  true,
  NOW(),
  NOW()
FROM public.user_profiles up
WHERE up.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.signal_subscriptions ss WHERE ss.email = up.email
  );

-- ─── 9. MISSING updated_at TRIGGERS ──────────────────────────────────────────
DROP TRIGGER IF EXISTS set_ia_signals_updated_at ON public.ia_signals;
CREATE TRIGGER set_ia_signals_updated_at
  BEFORE UPDATE ON public.ia_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_hv_public_feed_updated_at ON public.hv_public_feed;
CREATE TRIGGER set_hv_public_feed_updated_at
  BEFORE UPDATE ON public.hv_public_feed
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER set_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_signal_subscriptions_updated_at ON public.signal_subscriptions;
CREATE TRIGGER set_signal_subscriptions_updated_at
  BEFORE UPDATE ON public.signal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260618211145','maximize_schema_automation_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260618211145_maximize_schema_automation_views.sql

-- RECOVERY BEGIN 20260619030842_test_simple_ddl.sql
CREATE TABLE IF NOT EXISTS public._hv_migration_test_probe (id int);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260619030842','test_simple_ddl','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260619030842_test_simple_ddl.sql

-- RECOVERY BEGIN 20260619030854_cleanup_test_probe.sql
-- Original: DROP TABLE IF EXISTS public._hv_migration_test_probe;
-- Converted to a documented no-op stub on 2026-07-27: flagged by this
-- pipeline's new destructive-statement scanner (DROP TABLE, even
-- IF EXISTS-guarded, is intentionally always flagged for human review
-- rather than silently auto-applied). Confirmed live via
-- information_schema.tables that public._hv_migration_test_probe does
-- not exist -- this was a throwaway table from an early CI pipeline
-- validation sequence (test_simple_ddl -> cleanup_test_probe ->
-- test_drop_policy_only, 2026-06-19), already cleaned up long ago.
SELECT 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260619030854','cleanup_test_probe','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260619030854_cleanup_test_probe.sql

-- RECOVERY BEGIN 20260619030900_test_drop_policy_only.sql
DROP POLICY IF EXISTS service_write ON public.jurisdiction_briefings;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260619030900','test_drop_policy_only','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260619030900_test_drop_policy_only.sql

-- RECOVERY BEGIN 20260619030924_recreate_service_write_step1.sql
CREATE POLICY service_write ON public.jurisdiction_briefings FOR ALL TO service_role USING (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260619030924','recreate_service_write_step1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260619030924_recreate_service_write_step1.sql

-- RECOVERY BEGIN 20260621000000_education_cpd_and_drug_interaction.sql
-- Add drug_interaction_reference claim type and CPD fields to education_modules.
-- drug_interaction_reference is high-liability content (prescriber-facing) requiring
-- primary source or professional body verification before publication.

alter type education_claim_type add value if not exists 'drug_interaction_reference';

alter table education_modules
  add column if not exists cpd_accreditation_body text,
  add column if not exists cpd_credit_hours numeric(5,2),
  add column if not exists cpd_jurisdiction text;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260621000000','education_cpd_and_drug_interaction','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260621000000_education_cpd_and_drug_interaction.sql
