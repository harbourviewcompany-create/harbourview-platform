-- Live Source Intake V0 + Consumables foundation.
-- These tables are deliberately separate from the older used/surplus intake
-- schema, which has different required columns and lifecycle semantics.

create table if not exists public.marketplace_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  source_type text not null,
  source_url text not null,
  jurisdiction text,
  category_focus text,
  fetch_method text not null default 'manual_url',
  allowed_use text,
  terms_risk text,
  review_frequency text,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_source_registry_url_not_empty check (length(trim(source_url)) > 0),
  constraint marketplace_source_registry_type_not_empty check (length(trim(source_type)) > 0),
  constraint marketplace_source_registry_fetch_method_check check (fetch_method in ('manual_url'))
);

create unique index if not exists marketplace_source_registry_normalized_url_idx
  on public.marketplace_source_registry (lower(regexp_replace(trim(source_url), '/+$', '')));

create table if not exists public.marketplace_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.marketplace_source_registry(id) on delete set null,
  captured_url text not null,
  captured_title text,
  captured_text text,
  raw_html_hash text,
  captured_at timestamptz not null default now(),
  fetch_status text not null,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint marketplace_source_snapshots_url_not_empty check (length(trim(captured_url)) > 0),
  constraint marketplace_source_snapshots_status_check check (fetch_status in ('success', 'failed', 'blocked', 'skipped'))
);

create table if not exists public.marketplace_candidates (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.marketplace_source_snapshots(id) on delete set null,
  candidate_type text not null,
  marketplace_category text not null,
  subcategory text,
  listing_type text,
  title_internal text,
  title_public_draft text,
  description_internal text,
  description_public_draft text,
  jurisdiction text,
  country text,
  region text,
  source_type text,
  supply_type text,
  condition text,
  bulk_available boolean,
  recurring_supply_available boolean,
  region_available text,
  lead_time_text text,
  public_restriction_note text,
  confidence_score integer,
  commercial_relevance_score integer,
  compliance_risk_score integer,
  restricted_item boolean not null default false,
  requires_license_review boolean not null default false,
  status text not null default 'needs_review',
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_candidates_type_check check (candidate_type in ('source_candidate', 'consumables_supply', 'supplier_directory', 'wanted_consumables_request')),
  constraint marketplace_candidates_category_check check (marketplace_category = 'Consumables & Operating Supplies'),
  constraint marketplace_candidates_subcategory_check check (
    subcategory is null or subcategory in (
      'Packaging', 'Lab & QA Supplies', 'Cultivation Supplies', 'Processing Supplies',
      'Sanitation & PPE', 'Logistics & Warehouse Supplies', 'Retail Supplies', 'Maintenance Consumables'
    )
  ),
  constraint marketplace_candidates_listing_type_check check (
    listing_type is null or listing_type in ('Supply Listing', 'Supplier Directory Entry', 'Wanted Consumables Request')
  ),
  constraint marketplace_candidates_status_check check (status in ('captured', 'needs_review', 'needs_verification', 'approved_draft', 'rejected', 'archived')),
  constraint marketplace_candidates_confidence_score_check check (confidence_score is null or confidence_score between 0 and 100),
  constraint marketplace_candidates_commercial_relevance_score_check check (commercial_relevance_score is null or commercial_relevance_score between 0 and 100),
  constraint marketplace_candidates_compliance_risk_score_check check (compliance_risk_score is null or compliance_risk_score between 0 and 100)
);

create table if not exists public.marketplace_candidate_review_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.marketplace_candidates(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint marketplace_candidate_review_events_type_check check (
    event_type in ('created', 'reviewed', 'approved_draft', 'rejected', 'archived', 'verification_requested')
  )
);

create index if not exists marketplace_source_snapshots_source_idx
  on public.marketplace_source_snapshots(source_id, captured_at desc);
create index if not exists marketplace_candidates_status_idx
  on public.marketplace_candidates(status, created_at desc);
create index if not exists marketplace_candidates_snapshot_idx
  on public.marketplace_candidates(snapshot_id);
create index if not exists marketplace_candidate_review_events_candidate_idx
  on public.marketplace_candidate_review_events(candidate_id, created_at desc);

alter table public.marketplace_source_registry enable row level security;
alter table public.marketplace_source_snapshots enable row level security;
alter table public.marketplace_candidates enable row level security;
alter table public.marketplace_candidate_review_events enable row level security;

revoke all on public.marketplace_source_registry from anon, authenticated;
revoke all on public.marketplace_source_snapshots from anon, authenticated;
revoke all on public.marketplace_candidates from anon, authenticated;
revoke all on public.marketplace_candidate_review_events from anon, authenticated;

grant select, insert, update, delete on public.marketplace_source_registry to authenticated;
grant select, insert, update, delete on public.marketplace_source_snapshots to authenticated;
grant select, insert, update, delete on public.marketplace_candidates to authenticated;
grant select, insert, update, delete on public.marketplace_candidate_review_events to authenticated;

drop policy if exists marketplace_source_registry_admin_operator_only on public.marketplace_source_registry;
create policy marketplace_source_registry_admin_operator_only on public.marketplace_source_registry
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_source_snapshots_admin_operator_only on public.marketplace_source_snapshots;
create policy marketplace_source_snapshots_admin_operator_only on public.marketplace_source_snapshots
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_candidates_admin_operator_only on public.marketplace_candidates;
create policy marketplace_candidates_admin_operator_only on public.marketplace_candidates
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists marketplace_candidate_review_events_admin_operator_only on public.marketplace_candidate_review_events;
create policy marketplace_candidate_review_events_admin_operator_only on public.marketplace_candidate_review_events
  for all to authenticated
  using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

comment on table public.marketplace_source_registry is 'Private consumables source registry. Separate from used/surplus source_registry.';
comment on table public.marketplace_source_snapshots is 'Private consumables source snapshots. Separate from used/surplus source_snapshots.';
comment on table public.marketplace_candidates is 'Private marketplace candidates created from controlled source intake.';
comment on table public.marketplace_candidate_review_events is 'Private review audit for marketplace_candidates.';

-- Copy compatible legacy source rows into the separated consumables registry.
do $source_intake_repair$
begin
  if to_regclass('public.source_registry') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'source_registry' and column_name = 'source_key'
    )
  then
    insert into public.marketplace_source_registry (
      id, source_name, source_type, source_url, category_focus, fetch_method,
      is_active, last_checked_at, created_at, updated_at
    )
    select
      id, name, category, source_url, category, 'manual_url',
      status <> 'disabled', last_checked_at, created_at, updated_at
    from public.source_registry
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.source_snapshots') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'source_snapshots' and column_name = 'snapshot_hash'
    )
  then
    insert into public.marketplace_source_snapshots (
      id, source_id, captured_url, captured_text, raw_html_hash, captured_at,
      fetch_status, error_message, created_at
    )
    select
      ss.id, ss.source_id, sr.source_url, ss.raw_payload, ss.snapshot_hash, ss.fetched_at,
      case when coalesce(ss.http_status, 0) between 200 and 399 then 'success' else 'skipped' end,
      case when coalesce(ss.http_status, 0) between 200 and 399 then null else 'Migrated from legacy source snapshot.' end,
      ss.fetched_at
    from public.source_snapshots ss
    join public.source_registry sr on sr.id = ss.source_id
    join public.marketplace_source_registry msr on msr.id = ss.source_id
    on conflict (id) do nothing;
  end if;
end
$source_intake_repair$;

do $candidate_snapshot_fk$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and contype = 'f'
      and conkey = array[
        (select attnum from pg_attribute
         where attrelid = 'public.marketplace_candidates'::regclass
           and attname = 'snapshot_id')
      ]
  loop
    execute format('alter table public.marketplace_candidates drop constraint %I', constraint_record.conname);
  end loop;

  update public.marketplace_candidates candidate
  set snapshot_id = null
  where snapshot_id is not null
    and not exists (
      select 1 from public.marketplace_source_snapshots snapshot
      where snapshot.id = candidate.snapshot_id
    );

  alter table public.marketplace_candidates
    add constraint marketplace_candidates_snapshot_id_fkey
    foreign key (snapshot_id)
    references public.marketplace_source_snapshots(id)
    on delete set null;
end
$candidate_snapshot_fk$;
