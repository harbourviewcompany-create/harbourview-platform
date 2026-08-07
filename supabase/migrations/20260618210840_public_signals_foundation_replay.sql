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
