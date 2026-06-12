create schema if not exists intelligence;

create table if not exists intelligence.country_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  country_code text,
  country_name text not null,
  region text,
  review_status text not null default 'draft',
  public_summary text,
  commercial_pathway_summary text,
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,
  last_reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table intelligence.country_intelligence_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'intelligence'
      and tablename  = 'country_intelligence_profiles'
      and policyname = 'intelligence_country_public_read'
  ) then
drop policy if exists intelligence_country_public_read on intelligence.country_intelligence_profiles;
    create policy intelligence_country_public_read
    on intelligence.country_intelligence_profiles
    for select
    using (
      public_safe = true
      and publish_to_public = true
    );
  end if;
end $$;

create view if not exists intelligence.public_country_intelligence as
select
  id,
  country_code,
  country_name,
  region,
  public_summary,
  commercial_pathway_summary,
  last_reviewed_at
from intelligence.country_intelligence_profiles
where public_safe = true
and publish_to_public = true;
