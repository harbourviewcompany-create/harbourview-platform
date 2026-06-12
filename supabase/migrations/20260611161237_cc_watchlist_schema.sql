-- cc_watchlist_schema: Watchlist Command Centre tables
-- Applied: 2026-06-11; stub created to reconcile supabase migration history

create table if not exists public.cc_watchlist_items (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null,
  added_by           uuid not null,
  item_type          text not null,
  ref_id             text,
  title              text not null,
  subtitle           text,
  tags               text[] not null default '{}',
  jurisdiction       text,
  confidence_pct     int,
  latest_change_at   timestamptz,
  latest_change_note text,
  next_action        text,
  watch_status       text not null default 'active',
  snoozed_until      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.cc_watchlist_notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  org_id            uuid not null,
  watchlist_item_id uuid references public.cc_watchlist_items(id) on delete set null,
  notification_type text not null,
  title             text not null,
  body              text,
  is_read           bool not null default false,
  is_snoozed        bool not null default false,
  snoozed_until     timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.cc_watch_rules (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null,
  created_by uuid not null,
  rule_type  text not null,
  keywords   text[] not null default '{}',
  is_active  bool not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cc_watchlist_items_org_id_idx
  on public.cc_watchlist_items(org_id);
create index if not exists cc_watchlist_items_org_type_idx
  on public.cc_watchlist_items(org_id, item_type);
create index if not exists cc_watchlist_items_org_status_idx
  on public.cc_watchlist_items(org_id, watch_status) where watch_status = 'active';
create index if not exists cc_watchlist_items_ref_id_idx
  on public.cc_watchlist_items(ref_id) where ref_id is not null;
create index if not exists cc_watchlist_notifs_user_id_idx
  on public.cc_watchlist_notifications(user_id);
create index if not exists cc_watchlist_notifs_item_id_idx
  on public.cc_watchlist_notifications(watchlist_item_id) where watchlist_item_id is not null;
create index if not exists cc_watchlist_notifs_user_unread_idx
  on public.cc_watchlist_notifications(user_id, is_read) where is_read = false;
create index if not exists cc_watch_rules_org_id_idx
  on public.cc_watch_rules(org_id);
create index if not exists cc_watch_rules_org_active_idx
  on public.cc_watch_rules(org_id, is_active) where is_active = true;

alter table public.cc_watchlist_items         enable row level security;
alter table public.cc_watchlist_notifications enable row level security;
alter table public.cc_watch_rules             enable row level security;

drop policy if exists cc_watchlist_items_member_read   on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_insert on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_update on public.cc_watchlist_items;
drop policy if exists cc_watchlist_items_member_delete on public.cc_watchlist_items;
drop policy if exists cc_watchlist_notifs_user_read    on public.cc_watchlist_notifications;
drop policy if exists cc_watchlist_notifs_user_update  on public.cc_watchlist_notifications;
drop policy if exists cc_watch_rules_member_read       on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_insert     on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_update     on public.cc_watch_rules;
drop policy if exists cc_watch_rules_member_delete     on public.cc_watch_rules;

create policy cc_watchlist_items_member_read
  on public.cc_watchlist_items for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_items_member_insert
  on public.cc_watchlist_items for insert to authenticated
  with check (
    added_by = (select auth.uid()) and
    org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid()))
  );
create policy cc_watchlist_items_member_update
  on public.cc_watchlist_items for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_items_member_delete
  on public.cc_watchlist_items for delete to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watchlist_notifs_user_read
  on public.cc_watchlist_notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy cc_watchlist_notifs_user_update
  on public.cc_watchlist_notifications for update to authenticated
  using (user_id = (select auth.uid()));
create policy cc_watch_rules_member_read
  on public.cc_watch_rules for select to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watch_rules_member_insert
  on public.cc_watch_rules for insert to authenticated
  with check (
    created_by = (select auth.uid()) and
    org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid()))
  );
create policy cc_watch_rules_member_update
  on public.cc_watch_rules for update to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
create policy cc_watch_rules_member_delete
  on public.cc_watch_rules for delete to authenticated
  using (org_id in (select workspace_id from public.workspace_members where user_id = (select auth.uid())));
