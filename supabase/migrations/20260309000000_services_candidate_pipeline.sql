create table if not exists public.service_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  source_url text not null,
  source_host text not null,
  is_allowlisted boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint service_sources_url_not_empty check (length(trim(source_url)) > 0)
);

create table if not exists public.service_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.service_sources(id) on delete set null,
  captured_url text not null,
  captured_title text,
  captured_text text,
  raw_html_hash text,
  fetch_status text not null default 'success',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint service_snapshots_fetch_status_check check (fetch_status in ('success','failed','blocked','skipped'))
);

create table if not exists public.service_candidates (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.service_snapshots(id) on delete set null,
  title_public text,
  description_public text,
  service_type_public text,
  delivery_method_public text,
  location_public text,
  tags_public text[] not null default '{}',
  image_url_public text,
  status text not null default 'needs_review',
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_candidates_status_check check (status in ('needs_review','approved','rejected','archived')),
  constraint service_candidates_delivery_check check (delivery_method_public is null or delivery_method_public in ('remote','on-site','both'))
);

create unique index if not exists service_candidates_snapshot_idx on public.service_candidates(snapshot_id);
create index if not exists service_candidates_public_idx on public.service_candidates(status, expires_at, created_at desc);

alter table public.service_sources enable row level security;
alter table public.service_snapshots enable row level security;
alter table public.service_candidates enable row level security;

revoke all on public.service_sources from anon, authenticated;
revoke all on public.service_snapshots from anon, authenticated;
revoke all on public.service_candidates from anon, authenticated;

grant select, insert, update, delete on public.service_sources to authenticated;
grant select, insert, update, delete on public.service_snapshots to authenticated;
grant select, insert, update, delete on public.service_candidates to authenticated;

create policy service_sources_admin_operator_only on public.service_sources for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));
create policy service_snapshots_admin_operator_only on public.service_snapshots for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));
create policy service_candidates_admin_operator_only on public.service_candidates for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));
