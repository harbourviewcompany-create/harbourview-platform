-- Replay-safe restoration of the production public profile snapshot table.
--
-- The live relation predates its first registered migration-ledger consumer
-- (20260710094130), but no registered migration owns its creation. Preserve
-- the later migrations' ownership of API exposure, security_invoker repair,
-- and explicit base-table SELECT grants.

create table if not exists public.hv_public_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.workspaces(id) on delete cascade,
  snapshot_data jsonb not null default '{}'::jsonb,
  snapshot_version integer not null default 1,
  generated_at timestamptz not null default now()
);

create index if not exists idx_hv_snapshots_org
  on public.hv_public_profile_snapshots (org_id);

alter table public.hv_public_profile_snapshots enable row level security;

-- Match the live production ACL surface. Only SELECT is authorized by RLS;
-- client-role writes remain denied because no INSERT/UPDATE/DELETE policy
-- exists. service_role retains the server-side snapshot refresh capability.
grant select, insert, update, delete
  on table public.hv_public_profile_snapshots
  to anon, authenticated;
grant all privileges
  on table public.hv_public_profile_snapshots
  to service_role;

do $restore_hv_public_profile_snapshots_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_public_profile_snapshots'::regclass
      and polname = 'hv_snapshots_public_read'
  ) then
    execute $policy$
      create policy hv_snapshots_public_read
        on public.hv_public_profile_snapshots
        as permissive
        for select
        to public
        using (true)
    $policy$;
  end if;
end
$restore_hv_public_profile_snapshots_policy$;

do $restore_hv_public_profile_snapshots_comment$
begin
  if obj_description(
    'public.hv_public_profile_snapshots'::regclass,
    'pg_class'
  ) is null then
    execute $comment$
      comment on table public.hv_public_profile_snapshots is
        'Public-safe pre-computed org snapshots. Updated by Edge Function on verification/passport events only.'
    $comment$;
  end if;
end
$restore_hv_public_profile_snapshots_comment$;
