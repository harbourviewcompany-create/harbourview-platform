-- Restore the disclosure workflow relation that production already had before
-- 20260304001000_harden_marketplace_supabase_exposure.sql indexed and documented it.
-- This migration is additive and idempotent. It preserves production's three-state
-- workflow, server-controlled RLS posture, and match ownership without touching data.

do $restore_disclosure_status$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'disclosure_status'
  ) then
    create type public.disclosure_status as enum (
      'requested',
      'approved',
      'rejected'
    );
  end if;
end
$restore_disclosure_status$;

create table if not exists public.disclosure_requests (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id),
  requested_by text not null,
  status public.disclosure_status not null default 'requested',
  approved_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.disclosure_requests enable row level security;

create index if not exists idx_disclosure_requests_match_id
  on public.disclosure_requests(match_id);

comment on table public.disclosure_requests is
  'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server/service-role paths.';

-- Match the production relation ACL. RLS denies application-role access until the
-- later dated admin/operator SELECT policy is installed.
grant select, insert, update, delete on table public.disclosure_requests
  to anon, authenticated;
grant all privileges on table public.disclosure_requests to service_role;
