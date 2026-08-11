-- Professional services marketplace directory. Closes a real gap identified in
-- product review: app/marketplace/professional-services/page.tsx has been a
-- dead one-line redirect stub (`redirect('/dashboard?page=marketplace')`) with
-- no backing schema, no listing, no submission path. This migration adds the
-- directory table and the two thin api-schema views needed to browse
-- (public, approved-only) and apply (authenticated, insert-only) without
-- exposing the base table directly to PostgREST.
--
-- Deliberately NOT seeded with any provider rows. This repo already has one
-- lesson on this exact point: lib/enterprise/fixtures.ts and
-- lib/monetization/fixtures.ts contain hardcoded fake providers ("Insurance
-- Providers -- Cannabis", 8 records) that were never wired to any real data
-- source and are dead code today. Inventing plausible-looking law firms,
-- accountants, or insurers here would repeat that mistake, but live and
-- customer-facing instead of admin-only -- a much worse failure mode. The
-- directory launches empty; real providers are added via the application
-- flow this migration also creates, then approved by an operator.

create table if not exists public.professional_service_providers (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  category          text not null check (
                      category in ('legal', 'accounting', 'insurance', 'banking', 'compliance-consulting')
                    ),
  name              text not null check (length(trim(name)) between 1 and 200),
  description       text check (description is null or length(description) <= 2000),
  markets_covered   text[] not null default '{}',
  website           text check (website is null or length(website) <= 500),
  contact_email     text not null check (length(contact_email) <= 320 and contact_email like '%@%'),
  submitted_by      uuid references auth.users(id) on delete set null default auth.uid(),
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at       timestamptz,
  reviewer_notes    text
);

alter table public.professional_service_providers enable row level security;

revoke all on public.professional_service_providers from anon;
revoke all on public.professional_service_providers from authenticated;

grant insert on public.professional_service_providers to authenticated;

drop policy if exists "Authenticated users can apply to be listed" on public.professional_service_providers;
create policy "Authenticated users can apply to be listed"
  on public.professional_service_providers
  for insert
  to authenticated
  with check (
    submitted_by is not distinct from auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and reviewer_notes is null
  );

create index if not exists professional_service_providers_status_category_idx
  on public.professional_service_providers (status, category);

create or replace view api.professional_service_providers
with (security_invoker = true)
as
select id, category, name, description, markets_covered, website, created_at
from public.professional_service_providers
where status = 'approved';

grant select on api.professional_service_providers to anon, authenticated;

create or replace view api.professional_service_provider_applications
with (security_invoker = true)
as select * from public.professional_service_providers;

grant insert on api.professional_service_provider_applications to authenticated;

notify pgrst, 'reload schema';
