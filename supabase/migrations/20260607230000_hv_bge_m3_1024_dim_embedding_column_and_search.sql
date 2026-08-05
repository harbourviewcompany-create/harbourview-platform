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
