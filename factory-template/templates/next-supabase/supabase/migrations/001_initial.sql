create table if not exists public.factory_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  public_summary text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.factory_items enable row level security;

create or replace view public.factory_items_public as
select id, title, status, public_summary, created_at, updated_at
from public.factory_items
where status = 'published';
