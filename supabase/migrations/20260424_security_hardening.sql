-- Harbourview production security hardening migration
-- Apply only after reviewing against the current production schema.
-- This migration intentionally fails loudly if expected tables are missing.
--
-- FIXES applied vs original (2026-04-26):
--
-- [F1] workspace_memberships → workspace_members
--   Original referenced a table named workspace_memberships which does not exist.
--   The base schema (0002) defines this table as workspace_members.
--   All occurrences corrected: helper functions, RLS enforcement array, policies.
--
-- [F2] workspace_members column names corrected
--   Original used wm.role and wm.status which do not exist on workspace_members.
--   Corrected to wm.workspace_role (the actual enum column). No status column exists.
--
-- [F3] RLS policies on signals, sources, source_documents, review_queue_items fixed
--   Original policies referenced workspace_id on these tables, which does not exist
--   in the base schema (0001-0012). These tables have no workspace_id column.
--   Replaced with platform_role-based access consistent with 0008.
--
-- [F4] signal_evidence policies fixed
--   Original joined through signals.workspace_id which does not exist.
--   Replaced with platform_role-based access consistent with 0008.

begin;

create extension if not exists pgcrypto;

-- Public-feed tokens use hashed tokens only. Raw tokens must never be stored.
create table if not exists public.public_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  publish_event_id uuid references public.publish_events(id) on delete restrict,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  snapshot jsonb not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by_profile_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_feed_tokens_hash_shape check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint public_feed_tokens_revoked_consistency check (
    (status = 'revoked' and revoked_at is not null) or
    (status <> 'revoked')
  )
);

create table if not exists public.public_feed_token_access_events (
  id uuid primary key default gen_random_uuid(),
  public_feed_token_id uuid not null references public.public_feed_tokens(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create index if not exists public_feed_tokens_workspace_idx on public.public_feed_tokens(workspace_id);
create index if not exists public_feed_tokens_status_expiry_idx on public.public_feed_tokens(status, expires_at);
create index if not exists public_feed_token_access_events_token_idx on public.public_feed_token_access_events(public_feed_token_id, accessed_at desc);

-- Generic updated_at trigger.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_public_feed_tokens_updated_at on public.public_feed_tokens;
create trigger set_public_feed_tokens_updated_at
before update on public.public_feed_tokens
for each row execute function public.set_updated_at();

-- Role and membership helpers.
-- FIX [F1][F2]: table is workspace_members. Column is workspace_role. No status column.
create or replace function public.current_profile_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

create or replace function public.current_platform_role()
returns text language sql stable security definer set search_path = public as $$
  select p.platform_role::text
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_platform_role() = 'admin', false);
$$;

-- FIX [F1][F2]: workspace_members, workspace_role, no status filter.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.profile_id = auth.uid()
  ) or public.is_platform_admin();
$$;

-- FIX [F1][F2]: workspace_members, workspace_role column.
-- owner = full control, editor = can write, viewer = read-only.
create or replace function public.is_workspace_operator(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.profile_id = auth.uid()
      and wm.workspace_role::text in ('owner', 'editor')
  ) or public.is_platform_admin();
$$;

-- Enable and force RLS. FIX [F1]: workspace_members not workspace_memberships.
do $$
declare
  tbl text;
  tables text[] := array[
    'profiles',
    'workspaces',
    'workspace_members',
    'signals',
    'signal_evidence',
    'sources',
    'source_documents',
    'review_queue_items',
    'publish_events',
    'public_feed_tokens',
    'public_feed_token_access_events'
  ];
begin
  foreach tbl in array tables loop
    if to_regclass('public.' || tbl) is null then
      raise exception 'Expected table public.% is missing. Review schema before applying hardening migration.', tbl;
    end if;
    execute format('alter table public.%I enable row level security', tbl);
    execute format('alter table public.%I force row level security', tbl);
  end loop;
end $$;

-- Profiles.
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_platform_admin());

drop policy if exists profiles_update_self_limited on public.profiles;
create policy profiles_update_self_limited on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_platform_admin())
with check (
  public.is_platform_admin() or (
    id = auth.uid()
    and platform_role = (select platform_role from public.profiles where id = auth.uid())
    and default_workspace_id = (select default_workspace_id from public.profiles where id = auth.uid())
  )
);

-- Workspaces.
drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member on public.workspaces
for select to authenticated
using (public.is_workspace_member(id));

drop policy if exists workspaces_operator_write on public.workspaces;
create policy workspaces_operator_write on public.workspaces
for all to authenticated
using (public.is_workspace_operator(id))
with check (public.is_workspace_operator(id));

-- Workspace members. FIX [F1]: policy targets workspace_members not workspace_memberships.
drop policy if exists workspace_memberships_select_member_or_admin on public.workspace_members;
create policy workspace_memberships_select_member_or_admin on public.workspace_members
for select to authenticated
using (profile_id = auth.uid() or public.is_workspace_operator(workspace_id));

drop policy if exists workspace_memberships_operator_write on public.workspace_members;
create policy workspace_memberships_operator_write on public.workspace_members
for all to authenticated
using (public.is_workspace_operator(workspace_id))
with check (public.is_workspace_operator(workspace_id));

-- Signals.
-- FIX [F3]: no workspace_id column on signals. Platform_role gate replaces workspace gate.
-- Clients have no direct DB access to signals per ADR-001 D4.
drop policy if exists signals_workspace_select on public.signals;
create policy signals_workspace_select on public.signals
for select to authenticated
using (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists signals_workspace_operator_write on public.signals;
create policy signals_workspace_operator_write on public.signals
for all to authenticated
using (public.current_platform_role() in ('admin', 'analyst'))
with check (public.current_platform_role() in ('admin', 'analyst'));

-- Sources.
-- FIX [F3]: no workspace_id column on sources.
drop policy if exists sources_workspace_select on public.sources;
create policy sources_workspace_select on public.sources
for select to authenticated
using (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists sources_workspace_operator_write on public.sources;
create policy sources_workspace_operator_write on public.sources
for all to authenticated
using (public.current_platform_role() in ('admin', 'analyst'))
with check (public.current_platform_role() in ('admin', 'analyst'));

-- Source documents.
-- FIX [F3]: no workspace_id column on source_documents.
drop policy if exists source_documents_workspace_select on public.source_documents;
create policy source_documents_workspace_select on public.source_documents
for select to authenticated
using (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists source_documents_workspace_operator_write on public.source_documents;
create policy source_documents_workspace_operator_write on public.source_documents
for all to authenticated
using (public.current_platform_role() in ('admin', 'analyst'))
with check (public.current_platform_role() in ('admin', 'analyst'));

-- Review queue items.
-- FIX [F3]: no workspace_id column. Platform_role gate.
-- Analysts can read and insert. Only admins can update (resolve).
drop policy if exists review_queue_items_workspace_select on public.review_queue_items;
create policy review_queue_items_workspace_select on public.review_queue_items
for select to authenticated
using (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists review_queue_items_workspace_operator_write on public.review_queue_items;
create policy review_queue_items_workspace_operator_write on public.review_queue_items
for insert to authenticated
with check (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists review_queue_items_admin_update on public.review_queue_items;
create policy review_queue_items_admin_update on public.review_queue_items
for update to authenticated
using (public.current_platform_role() = 'admin')
with check (public.current_platform_role() = 'admin');

-- Publish events.
drop policy if exists publish_events_workspace_select on public.publish_events;
create policy publish_events_workspace_select on public.publish_events
for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists publish_events_workspace_operator_insert on public.publish_events;
create policy publish_events_workspace_operator_insert on public.publish_events
for insert to authenticated
with check (public.is_workspace_operator(workspace_id));

drop policy if exists publish_events_no_update on public.publish_events;
create policy publish_events_no_update on public.publish_events
for update to authenticated using (false) with check (false);

drop policy if exists publish_events_no_delete on public.publish_events;
create policy publish_events_no_delete on public.publish_events
for delete to authenticated using (false);

-- Signal evidence.
-- FIX [F4]: original joined through signals.workspace_id which does not exist.
-- Platform_role gate consistent with 0008.
drop policy if exists signal_evidence_workspace_select on public.signal_evidence;
create policy signal_evidence_workspace_select on public.signal_evidence
for select to authenticated
using (public.current_platform_role() in ('admin', 'analyst'));

drop policy if exists signal_evidence_workspace_operator_write on public.signal_evidence;
create policy signal_evidence_workspace_operator_write on public.signal_evidence
for all to authenticated
using (public.current_platform_role() in ('admin', 'analyst'))
with check (public.current_platform_role() in ('admin', 'analyst'));

-- Public feed token tables: service-role only. No direct authenticated access.
drop policy if exists public_feed_tokens_no_direct_access on public.public_feed_tokens;
create policy public_feed_tokens_no_direct_access on public.public_feed_tokens
for all to anon, authenticated
using (false)
with check (false);

drop policy if exists public_feed_token_access_events_no_direct_access on public.public_feed_token_access_events;
create policy public_feed_token_access_events_no_direct_access on public.public_feed_token_access_events
for all to anon, authenticated
using (false)
with check (false);

-- Warn if raw api_token column still exists on publish_events.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'publish_events'
      and column_name = 'api_token'
  ) then
    raise notice 'SECURITY WARNING: public.publish_events.api_token exists. Backfill to public_feed_tokens and drop this column after clients move to v2 feed tokens.';
  end if;
end $$;

commit;
