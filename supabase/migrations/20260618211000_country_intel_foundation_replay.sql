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
