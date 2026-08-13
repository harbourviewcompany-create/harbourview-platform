-- Restore the missing organization snapshot relation consumed by the existing
-- generate-org-snapshot Edge Function. Production currently has no
-- public.hv_org_snapshots relation. The writer is updated alongside this
-- migration to target the public relation directly with the service role.
--
-- This migration is intentionally isolated from the commercial-graph work:
-- snapshots remain a private derived cache owned by the workspace/KYB estate.

create table if not exists public.hv_org_snapshots (
  org_id uuid primary key references public.workspaces(id) on delete cascade,
  legal_name text,
  trade_name text,
  org_type text,
  jurisdiction_country text,
  verification_status text not null default 'unverified',
  slug text,
  completeness_score double precision not null default 0,
  completeness_band text not null default 'incomplete',
  verification_level text not null default 'none',
  export_readiness_band text not null default 'not_ready',
  passport_last_computed_at timestamptz,
  active_licence_count integer not null default 0 check (active_licence_count >= 0),
  licence_types text[] not null default '{}',
  facility_count integer not null default 0 check (facility_count >= 0),
  verified_doc_count integer not null default 0 check (verified_doc_count >= 0),
  marketplace_listing_count integer not null default 0 check (marketplace_listing_count >= 0),
  has_export_licence boolean not null default false,
  has_coa boolean not null default false,
  member_since timestamptz,
  updated_at timestamptz not null default now(),
  constraint hv_org_snapshots_verification_status_check check (
    verification_status in ('unverified', 'pending_review', 'verified', 'suspended', 'revoked')
  ),
  constraint hv_org_snapshots_completeness_band_check check (
    completeness_band in ('incomplete', 'partial', 'substantial', 'complete')
  ),
  constraint hv_org_snapshots_verification_level_check check (
    verification_level in ('none', 'basic', 'standard', 'enhanced')
  ),
  constraint hv_org_snapshots_export_band_check check (
    export_readiness_band in ('not_ready', 'partial', 'ready', 'verified')
  )
);

comment on table public.hv_org_snapshots is
  'Private derived organization snapshot generated from workspace, passport, licence, facility, evidence and marketplace state.';
comment on column public.hv_org_snapshots.org_id is
  'One snapshot per workspace. Primary key is also the workspaces FK and the Edge Function upsert conflict key.';

alter table public.hv_org_snapshots enable row level security;

-- The generated snapshot is readable by members of its own organization and
-- fully manageable by Harbourview platform staff. Writes from normal org
-- sessions are intentionally absent: generation is server/service controlled.
drop policy if exists hv_org_snapshots_org_member_select on public.hv_org_snapshots;
create policy hv_org_snapshots_org_member_select
  on public.hv_org_snapshots
  as permissive
  for select
  to authenticated
  using (public.hv_is_org_member(org_id));

drop policy if exists hv_org_snapshots_staff_all on public.hv_org_snapshots;
create policy hv_org_snapshots_staff_all
  on public.hv_org_snapshots
  as permissive
  for all
  to authenticated
  using (public.hv_is_platform_staff())
  with check (public.hv_is_platform_staff());

drop policy if exists hv_org_snapshots_service_all on public.hv_org_snapshots;
create policy hv_org_snapshots_service_all
  on public.hv_org_snapshots
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.hv_org_snapshots from public, anon, authenticated;
grant select on table public.hv_org_snapshots to authenticated;
grant all privileges on table public.hv_org_snapshots to service_role;

-- No api.hv_org_snapshots projection is created. There is no current reader
-- requiring it, and the service writer now targets public.hv_org_snapshots
-- explicitly so the private derived cache does not gain unnecessary API surface.

notify pgrst, 'reload schema';
