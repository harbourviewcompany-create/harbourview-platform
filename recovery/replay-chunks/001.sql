
-- RECOVERY BEGIN 20260301001000_harden_user_roles_grants.sql
revoke all on table public.user_roles from anon;
revoke all on table public.user_roles from authenticated;

grant select on table public.user_roles to authenticated;

comment on table public.user_roles is 'Internal Harbourview role assignments for admin provenance access. Grants are intentionally limited to authenticated SELECT with RLS self-read policy; anon has no table privileges.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260301001000','harden_user_roles_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260301001000_harden_user_roles_grants.sql

-- RECOVERY BEGIN 20260302000000_intelligence_globe_v1.sql
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
      and tablename = 'country_intelligence_profiles'
      and policyname = 'intelligence_country_public_read'
  ) then
    create policy intelligence_country_public_read
    on intelligence.country_intelligence_profiles
    for select
    using (
      public_safe = true
      and publish_to_public = true
    );
  end if;
end
$$;

create or replace view intelligence.public_country_intelligence as
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260302000000','intelligence_globe_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260302000000_intelligence_globe_v1.sql

-- RECOVERY BEGIN 20260303000000_used_surplus_intake_v2.sql
create extension if not exists pgcrypto;

create table if not exists public.source_registry (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  category text not null check (category in ('used-surplus')),
  name text not null,
  source_url text not null,
  parser_type text not null default 'manual-html',
  status text not null default 'needs-review' check (status in ('enabled', 'disabled', 'needs-review')),
  cadence_hours integer not null default 24 check (cadence_hours > 0),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_registry(id) on delete cascade,
  snapshot_hash text not null,
  fetched_at timestamptz not null default now(),
  http_status integer,
  raw_payload text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_id, snapshot_hash)
);

create table if not exists public.used_surplus_candidates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.source_registry(id) on delete set null,
  snapshot_id uuid references public.source_snapshots(id) on delete set null,
  candidate_hash text not null unique,
  title text not null,
  description text not null,
  price text,
  currency text,
  location text,
  condition text not null default 'used' check (condition in ('used', 'refurbished', 'surplus')),
  tags text[] not null default array[]::text[],
  image_url text,
  image_alt text,
  image_status text check (image_status in ('representative', 'supplier-provided', 'verified')),
  image_attribution text,
  image_allowed_use boolean not null default false,
  image_reviewed_at timestamptz,
  discovered_at timestamptz not null default now(),
  expires_at timestamptz,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  publication_status text not null default 'private' check (publication_status in ('private', 'published', 'unpublished')),
  confidence numeric(4,3) not null default 0,
  raw_candidate jsonb not null default '{}'::jsonb,
  internal_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_review_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.used_surplus_candidates(id) on delete cascade,
  actor_id uuid,
  event_type text not null check (event_type in ('created', 'approved', 'rejected', 'published', 'unpublished', 'expired', 'note')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.source_registry enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.used_surplus_candidates enable row level security;
alter table public.candidate_review_events enable row level security;

create or replace function public.harbourview_is_admin_or_operator()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'operator')
  );
$$;

drop policy if exists source_registry_admin_operator_select on public.source_registry;
create policy source_registry_admin_operator_select on public.source_registry
  for select using (public.harbourview_is_admin_or_operator());
drop policy if exists source_registry_admin_operator_write on public.source_registry;
create policy source_registry_admin_operator_write on public.source_registry
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists source_snapshots_admin_operator_select on public.source_snapshots;
create policy source_snapshots_admin_operator_select on public.source_snapshots
  for select using (public.harbourview_is_admin_or_operator());
drop policy if exists source_snapshots_admin_operator_write on public.source_snapshots;
create policy source_snapshots_admin_operator_write on public.source_snapshots
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists used_surplus_candidates_admin_operator_select on public.used_surplus_candidates;
create policy used_surplus_candidates_admin_operator_select on public.used_surplus_candidates
  for select using (public.harbourview_is_admin_or_operator());
drop policy if exists used_surplus_candidates_admin_operator_write on public.used_surplus_candidates;
create policy used_surplus_candidates_admin_operator_write on public.used_surplus_candidates
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

drop policy if exists candidate_review_events_admin_operator_select on public.candidate_review_events;
create policy candidate_review_events_admin_operator_select on public.candidate_review_events
  for select using (public.harbourview_is_admin_or_operator());
drop policy if exists candidate_review_events_admin_operator_write on public.candidate_review_events;
create policy candidate_review_events_admin_operator_write on public.candidate_review_events
  for all using (public.harbourview_is_admin_or_operator())
  with check (public.harbourview_is_admin_or_operator());

create index if not exists idx_source_registry_category_status on public.source_registry(category, status);
create index if not exists idx_source_snapshots_source_hash on public.source_snapshots(source_id, snapshot_hash);
create index if not exists idx_used_surplus_candidates_public on public.used_surplus_candidates(review_status, publication_status, expires_at);
create index if not exists idx_used_surplus_candidates_hash on public.used_surplus_candidates(candidate_hash);
create index if not exists idx_candidate_review_events_candidate on public.candidate_review_events(candidate_id, created_at desc);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260303000000','used_surplus_intake_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260303000000_used_surplus_intake_v2.sql

-- RECOVERY BEGIN 20260304000000_marketplace_conversion_v1.sql
-- Deterministic replay correction for environments where the relation did not
-- exist when this historical migration was first reached. Production state is
-- reconciled by the later forward repair migration.
do $replay$
begin
  if to_regclass('public.marketplace_inquiries') is not null then
    alter table public.marketplace_inquiries
      add column if not exists review_status text not null default 'received',
      add column if not exists priority text not null default 'medium',
      add column if not exists last_contacted_at timestamptz null,
      add column if not exists next_follow_up_at timestamptz null,
      add column if not exists internal_response_notes text null;

    if not exists (
      select 1 from pg_constraint
      where conname = 'marketplace_inquiries_review_status_check'
        and conrelid = 'public.marketplace_inquiries'::regclass
    ) then
      alter table public.marketplace_inquiries
        add constraint marketplace_inquiries_review_status_check
        check (review_status in ('received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'));
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'marketplace_inquiries_priority_check'
        and conrelid = 'public.marketplace_inquiries'::regclass
    ) then
      alter table public.marketplace_inquiries
        add constraint marketplace_inquiries_priority_check
        check (priority in ('high', 'medium', 'low'));
    end if;
  end if;
end
$replay$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260304000000','marketplace_conversion_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260304000000_marketplace_conversion_v1.sql

-- RECOVERY BEGIN 20260304001000_harden_marketplace_supabase_exposure.sql
-- Deterministic replay-safe form of the historical hardening migration.
do $marketplace_exposure$
begin
  if to_regprocedure('public.smoke_verify_marketplace_inquiry(text,text,text)') is not null then
    execute 'revoke execute on function public.smoke_verify_marketplace_inquiry(text, text, text) from anon, authenticated';
  end if;
  if to_regprocedure('public.smoke_close_marketplace_inquiry(text,text,text)') is not null then
    execute 'revoke execute on function public.smoke_close_marketplace_inquiry(text, text, text) from anon, authenticated';
  end if;

  if to_regclass('public.listings') is not null then
    execute $view$
      create or replace view public.marketplace_listings_public_view
      with (security_invoker = true)
      as
      select
        id,
        marketplace_section as section,
        title,
        coalesce(
          slug,
          lower(regexp_replace(title, '[^a-zA-Z0-9]+'::text, '-'::text, 'g'::text)) || '-'::text || left(id::text, 8)
        ) as slug,
        description,
        price_amount,
        price_currency,
        location_country,
        is_featured,
        condition,
        brand,
        model,
        quantity,
        unit,
        created_at
      from public.listings
      where status = 'approved'::public.listing_status
        and public_visibility = true
        and archived_at is null
    $view$;
  end if;

  if to_regclass('public.disclosure_requests') is not null then
    create index if not exists idx_disclosure_requests_match_id on public.disclosure_requests(match_id);
    comment on table public.disclosure_requests is 'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.listings') is not null then
    create index if not exists idx_listings_superseded_by on public.listings(superseded_by);
  end if;
  if to_regclass('public.matches') is not null then
    create index if not exists idx_matches_inquiry_id on public.matches(inquiry_id);
    comment on table public.matches is 'Server-only matching workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.user_roles') is not null then
    create index if not exists idx_user_roles_created_by on public.user_roles(created_by);
    execute 'drop policy if exists user_roles_self_read on public.user_roles';
    execute 'create policy user_roles_self_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()))';
  end if;
  if to_regclass('public.audit_events') is not null then
    comment on table public.audit_events is 'Server-only audit log. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.internal_admin_notes') is not null then
    comment on table public.internal_admin_notes is 'Server-only internal notes table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
  if to_regclass('public.status_history') is not null then
    comment on table public.status_history is 'Server-only status history table. RLS intentionally has no client policies; access must go through trusted server paths.';
  end if;
end
$marketplace_exposure$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260304001000','harden_marketplace_supabase_exposure','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260304001000_harden_marketplace_supabase_exposure.sql

-- RECOVERY BEGIN 20260305000000_live_source_intake_v0_consumables.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260305000000','live_source_intake_v0_consumables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260305000000_live_source_intake_v0_consumables.sql

-- RECOVERY BEGIN 20260306000000_genetics_routing_operations_v1.sql
-- Genetics Routing Operations V1
-- Private persistence layer for controlled genetics access requests and introduction events.

create table if not exists genetics_routing_records (
  id uuid primary key default gen_random_uuid(),
  profile_slug text not null,
  drop_id text not null,
  requester_company text not null,
  requester_country text,
  requester_email text not null,
  intent text not null,
  target_market text,
  score integer not null default 0 check (score between 0 and 100),
  score_band text not null,
  status text not null default 'new_request',
  buyer_permission_approved boolean not null default false,
  holder_permission_approved boolean not null default false,
  introduction_ready boolean not null default false,
  next_action text,
  private_intro_draft text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists genetics_routing_events (
  id uuid primary key default gen_random_uuid(),
  routing_record_id uuid references genetics_routing_records(id) on delete cascade,
  event_type text not null,
  event_summary text not null,
  actor text default 'system',
  private_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_genetics_routing_records_status on genetics_routing_records(status);
create index if not exists idx_genetics_routing_records_score on genetics_routing_records(score desc);
create index if not exists idx_genetics_routing_events_record on genetics_routing_events(routing_record_id);

alter table genetics_routing_records enable row level security;
alter table genetics_routing_events enable row level security;

drop policy if exists genetics_routing_records_admin_operator_all on genetics_routing_records;
create policy genetics_routing_records_admin_operator_all
on genetics_routing_records
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

drop policy if exists genetics_routing_records_analyst_read on genetics_routing_records;
create policy genetics_routing_records_analyst_read
on genetics_routing_records
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);

drop policy if exists genetics_routing_events_admin_operator_all on genetics_routing_events;
create policy genetics_routing_events_admin_operator_all
on genetics_routing_events
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

drop policy if exists genetics_routing_events_analyst_read on genetics_routing_events;
create policy genetics_routing_events_analyst_read
on genetics_routing_events
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260306000000','genetics_routing_operations_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260306000000_genetics_routing_operations_v1.sql

-- RECOVERY BEGIN 20260307000000_genetics_dealflow_v1.sql
-- Genetics Dealflow V1
-- Adds controlled deal lifecycle tracking on top of genetics routing operations.

alter table genetics_routing_records
add column if not exists deal_status text not null default 'not_started';

alter table genetics_routing_records
add column if not exists deal_value_estimate text;

alter table genetics_routing_records
add column if not exists last_deal_event_at timestamptz;

alter table genetics_routing_records
add column if not exists intro_email_subject text;

alter table genetics_routing_records
add column if not exists intro_email_body text;

create index if not exists idx_genetics_routing_records_deal_status
on genetics_routing_records(deal_status);

alter table genetics_routing_records
add constraint genetics_routing_records_deal_status_check
check (deal_status in (
  'not_started',
  'introduced',
  'engaged',
  'negotiating',
  'closed_won',
  'closed_lost',
  'archived'
));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260307000000','genetics_dealflow_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260307000000_genetics_dealflow_v1.sql

-- RECOVERY BEGIN 20260308000000_new_products_equipment_intake.sql
-- New Products equipment intake extension.
-- Extends the private source_registry -> source_snapshots -> marketplace_candidates pipeline.
-- No autonomous scraping. No automatic public publication.

alter table public.marketplace_candidates
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists image_status text,
  add column if not exists image_attribution text,
  add column if not exists image_allowed_use text,
  add column if not exists image_reviewed_at timestamptz;

alter table public.marketplace_candidates
  drop constraint if exists marketplace_candidates_type_check,
  drop constraint if exists marketplace_candidates_category_check,
  drop constraint if exists marketplace_candidates_subcategory_check,
  drop constraint if exists marketplace_candidates_listing_type_check,
  drop constraint if exists marketplace_candidates_image_status_check,
  drop constraint if exists marketplace_candidates_reviewed_image_check;

alter table public.marketplace_candidates
  add constraint marketplace_candidates_type_check check (
    candidate_type in (
      'source_candidate',
      'consumables_supply',
      'supplier_directory',
      'wanted_consumables_request',
      'equipment_supply',
      'equipment_supplier_listing'
    )
  ),
  add constraint marketplace_candidates_category_check check (
    marketplace_category in ('Consumables & Operating Supplies', 'New Products')
  ),
  add constraint marketplace_candidates_subcategory_check check (
    subcategory is null
    or subcategory in (
      'Packaging',
      'Lab & QA Supplies',
      'Cultivation Supplies',
      'Processing Supplies',
      'Sanitation & PPE',
      'Logistics & Warehouse Supplies',
      'Retail Supplies',
      'Maintenance Consumables',
      'Extraction Equipment',
      'Cultivation Equipment',
      'Packaging Equipment',
      'Post-Harvest Equipment',
      'Climate Control Equipment',
      'Processing Equipment',
      'Facility Infrastructure',
      'Lab Equipment'
    )
  ),
  add constraint marketplace_candidates_listing_type_check check (
    listing_type is null
    or listing_type in (
      'Supply Listing',
      'Supplier Directory Entry',
      'Wanted Consumables Request',
      'Equipment Listing',
      'Supplier Equipment Listing',
      'Equipment Inquiry Candidate'
    )
  ),
  add constraint marketplace_candidates_image_status_check check (
    image_status is null
    or image_status in ('supplier_provided', 'licensed_stock', 'public_source_reviewed', 'verified')
  ),
  add constraint marketplace_candidates_reviewed_image_check check (
    image_url is null
    or (
      length(trim(image_url)) > 0
      and length(trim(coalesce(image_alt, ''))) > 0
      and image_status in ('supplier_provided', 'licensed_stock', 'public_source_reviewed', 'verified')
      and length(trim(coalesce(image_attribution, ''))) > 0
      and length(trim(coalesce(image_allowed_use, ''))) > 0
      and image_reviewed_at is not null
    )
  );

comment on column public.marketplace_candidates.image_url is 'Private reviewed candidate image URL. Projected publicly only after validation.';
comment on column public.marketplace_candidates.image_alt is 'Private reviewed candidate image alt text used for safe public projection.';
comment on column public.marketplace_candidates.image_status is 'Private candidate image review status.';
comment on column public.marketplace_candidates.image_attribution is 'Private image attribution and rights note. Not rendered publicly in V1.';
comment on column public.marketplace_candidates.image_allowed_use is 'Private image allowed-use review note. Not rendered publicly in V1.';
comment on column public.marketplace_candidates.image_reviewed_at is 'Private timestamp proving image review occurred before public projection.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260308000000','new_products_equipment_intake','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260308000000_new_products_equipment_intake.sql

-- RECOVERY BEGIN 20260309000000_services_candidate_pipeline.sql
create table if not exists public.service_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  source_url text not null,
  source_host text not null,
  is_allowlisted boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint service_sources_url_not_empty check (length(trim(source_url)) > 0)
);

create table if not exists public.service_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.service_sources(id) on delete set null,
  captured_url text not null,
  captured_title text,
  captured_text text,
  raw_html_hash text,
  fetch_status text not null default 'success',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint service_snapshots_fetch_status_check check (fetch_status in ('success','failed','blocked','skipped'))
);

create table if not exists public.service_candidates (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.service_snapshots(id) on delete set null,
  title_public text,
  description_public text,
  service_type_public text,
  delivery_method_public text,
  location_public text,
  tags_public text[] not null default '{}',
  image_url_public text,
  status text not null default 'needs_review',
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_candidates_status_check check (status in ('needs_review','approved','rejected','archived')),
  constraint service_candidates_delivery_check check (delivery_method_public is null or delivery_method_public in ('remote','on-site','both'))
);

create unique index if not exists service_candidates_snapshot_idx on public.service_candidates(snapshot_id);
create index if not exists service_candidates_public_idx on public.service_candidates(status, expires_at, created_at desc);

alter table public.service_sources enable row level security;
alter table public.service_snapshots enable row level security;
alter table public.service_candidates enable row level security;

revoke all on public.service_sources from anon, authenticated;
revoke all on public.service_snapshots from anon, authenticated;
revoke all on public.service_candidates from anon, authenticated;

grant select, insert, update, delete on public.service_sources to authenticated;
grant select, insert, update, delete on public.service_snapshots to authenticated;
grant select, insert, update, delete on public.service_candidates to authenticated;

drop policy if exists service_sources_admin_operator_only on public.service_sources;
create policy service_sources_admin_operator_only on public.service_sources for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));
drop policy if exists service_snapshots_admin_operator_only on public.service_snapshots;
create policy service_snapshots_admin_operator_only on public.service_snapshots for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));
drop policy if exists service_candidates_admin_operator_only on public.service_candidates;
create policy service_candidates_admin_operator_only on public.service_candidates for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin','operator')));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260309000000','services_candidate_pipeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260309000000_services_candidate_pipeline.sql

-- RECOVERY BEGIN 20260310000000_deal_operations_v1.sql
-- Deal Operations V1
-- Adds operator assignment, next-action tracking, stale escalation and communication timeline support.

alter table genetics_routing_records
add column if not exists assigned_operator text;

alter table genetics_routing_records
add column if not exists next_action_due_at timestamptz;

alter table genetics_routing_records
add column if not exists follow_up_reminder_at timestamptz;

alter table genetics_routing_records
add column if not exists urgency_score integer not null default 0 check (urgency_score between 0 and 100);

alter table genetics_routing_records
add column if not exists stale_escalated boolean not null default false;

alter table genetics_routing_records
add column if not exists internal_notes text;

alter table genetics_routing_events
add column if not exists communication_channel text;

alter table genetics_routing_events
add column if not exists direction text;

alter table genetics_routing_events
add column if not exists next_action_due_at timestamptz;

create index if not exists idx_genetics_routing_records_assigned_operator
on genetics_routing_records(assigned_operator);

create index if not exists idx_genetics_routing_records_next_action_due_at
on genetics_routing_records(next_action_due_at);

create index if not exists idx_genetics_routing_records_urgency_score
on genetics_routing_records(urgency_score desc);

create index if not exists idx_genetics_routing_records_stale_escalated
on genetics_routing_records(stale_escalated);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260310000000','deal_operations_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260310000000_deal_operations_v1.sql

-- RECOVERY BEGIN 20260311000000_signals_v1.sql
-- Signals V1 migration (operator-grade, RLS placeholder to be aligned with user_roles helper)
create schema if not exists signals;

create table if not exists signals.signals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  headline text not null,
  signal_type text not null,
  review_status text not null default 'captured',
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,
  signal_date date not null,
  country_name text,
  region text,
  regulator_name text,
  canonical_source_url text,
  public_summary text,
  public_implication text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table signals.signals enable row level security;

-- NOTE: Replace with existing user_roles-based policies before production


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260311000000','signals_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260311000000_signals_v1.sql

-- RECOVERY BEGIN 20260312000000_regulatory_signals_v1.sql
-- Harbourview Regulatory Signals V1
-- Parallel regulatory intelligence system. Does not reuse marketplace Signal Engine,
-- marketplace_candidates, or public.source_registry.

create schema if not exists regulatory_signals;

create table if not exists regulatory_signals.sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  source_tier text not null,
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  base_url text not null,
  watch_url text,
  rss_url text,
  contact_url text,
  language_code text,
  crawl_allowed boolean not null default false,
  is_active boolean not null default true,
  validation_notes text,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_sources_source_name_not_empty check (length(trim(source_name)) > 0),
  constraint regulatory_sources_base_url_not_empty check (length(trim(base_url)) > 0),
  constraint regulatory_sources_tier_check check (source_tier in ('tier_1_official', 'tier_2_professional', 'tier_3_secondary')),
  constraint regulatory_sources_type_check check (source_type in ('regulator','government_ministry','legislature','official_gazette','court','customs_authority','health_authority','drug_control_authority','enforcement_authority','consultation_portal','international_body','professional_body','law_firm_update','trade_association','specialist_publication','local_media','trade_media'))
);

create table if not exists regulatory_signals.evidence (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references regulatory_signals.sources(id) on delete set null,
  evidence_title text not null,
  evidence_url text not null,
  canonical_url text,
  source_tier text not null,
  source_type text not null,
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  raw_excerpt text,
  evidence_summary text,
  language_code text,
  content_hash text,
  storage_path text,
  pdf_storage_path text,
  screenshot_storage_path text,
  validation_status text not null default 'unvalidated',
  validation_notes text,
  duplicate_of uuid references regulatory_signals.evidence(id) on delete set null,
  captured_by uuid references auth.users(id) on delete set null,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_evidence_title_not_empty check (length(trim(evidence_title)) > 0),
  constraint regulatory_evidence_url_not_empty check (length(trim(evidence_url)) > 0),
  constraint regulatory_evidence_validation_status_check check (validation_status in ('unvalidated', 'validated', 'needs_review', 'rejected', 'duplicate')),
  constraint regulatory_evidence_tier_check check (source_tier in ('tier_1_official', 'tier_2_professional', 'tier_3_secondary'))
);

create table if not exists regulatory_signals.signals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  headline text not null,
  signal_type text not null,
  review_status text not null default 'captured',
  confidence text not null default 'medium',
  impact_level text not null default 'moderate',
  country_code text,
  country_name text,
  region text,
  jurisdiction text,
  regulator_name text,
  signal_date date not null,
  source_published_at timestamptz,
  captured_at timestamptz not null default now(),
  source_tier text not null,
  source_type text not null,
  source_url text not null,
  canonical_source_url text,
  source_id uuid references regulatory_signals.sources(id) on delete set null,
  primary_evidence_id uuid references regulatory_signals.evidence(id) on delete set null,
  private_summary text not null,
  commercial_relevance text,
  compliance_relevance text,
  uncertainty_note text,
  public_summary text,
  public_implication text,
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,
  last_reviewed_at timestamptz,
  next_review_due_at timestamptz,
  expires_at timestamptz,
  published_at timestamptz,
  private_notes text,
  analyst_notes text,
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_signals_slug_not_empty check (length(trim(slug)) > 0),
  constraint regulatory_signals_headline_not_empty check (length(trim(headline)) > 0),
  constraint regulatory_signals_private_summary_not_empty check (length(trim(private_summary)) > 0),
  constraint regulatory_signals_source_url_not_empty check (length(trim(source_url)) > 0),
  constraint regulatory_signals_type_check check (signal_type in ('regulatory_change','policy_announcement','import_export_pathway','licensing_market_access','prescription_patient_access','hemp_cbd_controlled_cannabinoids','enforcement_compliance_action','consultation_pending_rule_change','court_agency_decision','controlled_substance_scheduling','customs_trade_requirement','quality_standard_requirement')),
  constraint regulatory_signals_review_status_check check (review_status in ('captured','triaged','needs_source_validation','in_review','approved_private','approved_public','published','rejected','archived','expired')),
  constraint regulatory_signals_confidence_check check (confidence in ('low', 'medium', 'high', 'official_confirmed')),
  constraint regulatory_signals_impact_level_check check (impact_level in ('low', 'moderate', 'high', 'critical')),
  constraint regulatory_signals_publication_gate check (
    review_status <> 'published'
    or (
      public_safe = true
      and publish_to_public = true
      and public_summary is not null
      and length(trim(public_summary)) > 0
      and public_implication is not null
      and length(trim(public_implication)) > 0
      and canonical_source_url is not null
      and length(trim(canonical_source_url)) > 0
      and published_at is not null
    )
  )
);

create table if not exists regulatory_signals.signal_evidence_links (
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  evidence_id uuid not null references regulatory_signals.evidence(id) on delete cascade,
  relationship text not null default 'supporting',
  created_at timestamptz not null default now(),
  primary key (signal_id, evidence_id),
  constraint regulatory_signal_evidence_relationship_check check (relationship in ('primary', 'supporting', 'context', 'contradictory'))
);

create table if not exists regulatory_signals.review_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint regulatory_review_events_type_check check (event_type in ('created','triaged','source_validation_requested','review_started','approved_private','approved_public','published','rejected','archived','expired','updated'))
);

create table if not exists regulatory_signals.publication_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references regulatory_signals.signals(id) on delete cascade,
  action text not null,
  public_url text,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint regulatory_publication_events_action_check check (action in ('published', 'unpublished', 'republished', 'archived', 'expired'))
);

create index if not exists regulatory_sources_country_idx on regulatory_signals.sources(country_code, source_tier);
create index if not exists regulatory_evidence_country_idx on regulatory_signals.evidence(country_code, published_at desc);
create index if not exists regulatory_signals_public_idx on regulatory_signals.signals(review_status, public_safe, publish_to_public, signal_date desc);
create index if not exists regulatory_signals_country_idx on regulatory_signals.signals(country_code, signal_date desc);
create index if not exists regulatory_signals_type_idx on regulatory_signals.signals(signal_type, signal_date desc);

create or replace view regulatory_signals.public_signals as
select
  id,
  slug,
  headline,
  signal_type,
  confidence,
  impact_level,
  country_code,
  country_name,
  region,
  jurisdiction,
  regulator_name,
  signal_date,
  source_tier,
  source_type,
  canonical_source_url,
  public_summary,
  public_implication,
  published_at,
  last_reviewed_at
from regulatory_signals.signals
where review_status = 'published'
  and public_safe = true
  and publish_to_public = true;

alter table regulatory_signals.sources enable row level security;
alter table regulatory_signals.evidence enable row level security;
alter table regulatory_signals.signals enable row level security;
alter table regulatory_signals.signal_evidence_links enable row level security;
alter table regulatory_signals.review_events enable row level security;
alter table regulatory_signals.publication_events enable row level security;

revoke all on schema regulatory_signals from anon;
revoke all on schema regulatory_signals from authenticated;
grant usage on schema regulatory_signals to authenticated;

revoke all on regulatory_signals.sources from anon;
revoke all on regulatory_signals.evidence from anon;
revoke all on regulatory_signals.signals from anon;
revoke all on regulatory_signals.signal_evidence_links from anon;
revoke all on regulatory_signals.review_events from anon;
revoke all on regulatory_signals.publication_events from anon;

revoke all on regulatory_signals.sources from authenticated;
revoke all on regulatory_signals.evidence from authenticated;
revoke all on regulatory_signals.signals from authenticated;
revoke all on regulatory_signals.signal_evidence_links from authenticated;
revoke all on regulatory_signals.review_events from authenticated;
revoke all on regulatory_signals.publication_events from authenticated;

grant select, insert, update, delete on regulatory_signals.sources to authenticated;
grant select, insert, update, delete on regulatory_signals.evidence to authenticated;
grant select, insert, update, delete on regulatory_signals.signals to authenticated;
grant select, insert, update, delete on regulatory_signals.signal_evidence_links to authenticated;
grant select, insert, update, delete on regulatory_signals.review_events to authenticated;
grant select, insert, update, delete on regulatory_signals.publication_events to authenticated;
grant select on regulatory_signals.public_signals to anon;
grant select on regulatory_signals.public_signals to authenticated;

drop policy if exists regulatory_sources_admin_operator_only on regulatory_signals.sources;
drop policy if exists regulatory_evidence_admin_operator_only on regulatory_signals.evidence;
drop policy if exists regulatory_signals_admin_operator_only on regulatory_signals.signals;
drop policy if exists regulatory_signal_evidence_links_admin_operator_only on regulatory_signals.signal_evidence_links;
drop policy if exists regulatory_review_events_admin_operator_only on regulatory_signals.review_events;
drop policy if exists regulatory_publication_events_admin_operator_only on regulatory_signals.publication_events;

create policy regulatory_sources_admin_operator_only on regulatory_signals.sources for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_evidence_admin_operator_only on regulatory_signals.evidence for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_signals_admin_operator_only on regulatory_signals.signals for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_signal_evidence_links_admin_operator_only on regulatory_signals.signal_evidence_links for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_review_events_admin_operator_only on regulatory_signals.review_events for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));
create policy regulatory_publication_events_admin_operator_only on regulatory_signals.publication_events for all to authenticated using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator'))) with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'operator')));

comment on schema regulatory_signals is 'Parallel Harbourview regulatory intelligence subsystem. Not marketplace Signal Engine.';
comment on table regulatory_signals.sources is 'Private source registry for regulatory and policy monitoring.';
comment on table regulatory_signals.evidence is 'Private evidence records for regulatory Signals. Raw excerpts and storage paths are never public.';
comment on table regulatory_signals.signals is 'Private master regulatory Signals table. Public output must use public_signals projection only.';
comment on view regulatory_signals.public_signals is 'Public-safe projection of published regulatory Signals only.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260312000000','regulatory_signals_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260312000000_regulatory_signals_v1.sql

-- RECOVERY BEGIN 20260313000000_relationship_intelligence_v1.sql
-- Relationship Intelligence V1
-- Private relationship intelligence layer for reliability, repeat-counterparty tracking and routing recommendations.

create table if not exists relationship_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  counterparty_name text not null,
  counterparty_type text not null default 'company',
  associated_profile_slug text,
  associated_drop_ids text[] default '{}',
  preferred_markets text[] default '{}',
  avoided_markets text[] default '{}',
  relationship_strength_score integer not null default 0 check (relationship_strength_score between 0 and 100),
  reliability_score integer not null default 0 check (reliability_score between 0 and 100),
  responsiveness_score integer not null default 0 check (responsiveness_score between 0 and 100),
  execution_score integer not null default 0 check (execution_score between 0 and 100),
  successful_introductions_count integer not null default 0,
  failed_introductions_count integer not null default 0,
  repeat_counterparty_count integer not null default 0,
  last_successful_intro_at timestamptz,
  last_contact_at timestamptz,
  preferred_operator text,
  operator_notes text,
  private_relationship_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists relationship_intelligence_events (
  id uuid primary key default gen_random_uuid(),
  relationship_profile_id uuid references relationship_intelligence_profiles(id) on delete cascade,
  routing_record_id uuid references genetics_routing_records(id) on delete set null,
  event_type text not null,
  event_summary text not null,
  market text,
  outcome text,
  operator text,
  created_at timestamptz not null default now()
);

create index if not exists idx_relationship_intelligence_profiles_name
on relationship_intelligence_profiles(counterparty_name);

create index if not exists idx_relationship_intelligence_profiles_type
on relationship_intelligence_profiles(counterparty_type);

create index if not exists idx_relationship_intelligence_profiles_reliability
on relationship_intelligence_profiles(reliability_score desc);

create index if not exists idx_relationship_intelligence_profiles_strength
on relationship_intelligence_profiles(relationship_strength_score desc);

create index if not exists idx_relationship_intelligence_events_profile
on relationship_intelligence_events(relationship_profile_id);

alter table relationship_intelligence_profiles enable row level security;
alter table relationship_intelligence_events enable row level security;

drop policy if exists relationship_intelligence_profiles_admin_operator_all on relationship_intelligence_profiles;
create policy relationship_intelligence_profiles_admin_operator_all
on relationship_intelligence_profiles
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

drop policy if exists relationship_intelligence_profiles_analyst_read on relationship_intelligence_profiles;
create policy relationship_intelligence_profiles_analyst_read
on relationship_intelligence_profiles
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);

drop policy if exists relationship_intelligence_events_admin_operator_all on relationship_intelligence_events;
create policy relationship_intelligence_events_admin_operator_all
on relationship_intelligence_events
for all
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
)
with check (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator')
  )
);

drop policy if exists relationship_intelligence_events_analyst_read on relationship_intelligence_events;
create policy relationship_intelligence_events_analyst_read
on relationship_intelligence_events
for select
using (
  exists (
    select 1 from user_roles
    where user_roles.user_id = auth.uid()
    and user_roles.role in ('admin', 'operator', 'analyst')
  )
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260313000000','relationship_intelligence_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260313000000_relationship_intelligence_v1.sql

-- RECOVERY BEGIN 20260430000000_marketplace_inquiries.sql
-- Harbourview Marketplace V1 inquiry capture
-- Safe to apply after existing marketplace/listings migrations.
-- Aligned with the production marketplace_inquiries table shape.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'inquiry_status'
      and n.nspname = 'public'
  ) then
    create type public.inquiry_status as enum ('received', 'reviewing', 'matched', 'closed');
  end if;
end $$;

create table if not exists public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  buyer_request_id uuid,
  inquiry_type text not null default 'general',
  message text not null,
  contact_name text not null,
  contact_email text not null,
  contact_company text,
  contact_phone text,
  status public.inquiry_status not null default 'received',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_inquiries enable row level security;

revoke all on public.marketplace_inquiries from anon;
revoke all on public.marketplace_inquiries from authenticated;
grant insert on public.marketplace_inquiries to anon;

drop policy if exists "Public can create marketplace inquiries" on public.marketplace_inquiries;
create policy "Public can create marketplace inquiries"
  on public.marketplace_inquiries
  for insert
  to anon
  with check (
    length(trim(contact_name)) > 0
    and length(trim(contact_email)) > 0
    and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(message)) > 0
    and length(message) <= 2500
    and status = 'received'::public.inquiry_status
    and internal_notes is null
  );

drop policy if exists "Authenticated users can read marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can update marketplace inquiries" on public.marketplace_inquiries;

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_id_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

create index if not exists marketplace_inquiries_buyer_request_id_idx
  on public.marketplace_inquiries (buyer_request_id, created_at desc);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260430000000','marketplace_inquiries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260430000000_marketplace_inquiries.sql

-- RECOVERY BEGIN 20260430000001_signal_engine_schema.sql
-- =============================================================================
-- Harbourview Signal Engine V1 — Schema Migration
-- Milestone 1: Database Foundation
-- =============================================================================

-- Enable pgvector (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- source_documents
-- Root table for every external or manually entered document.
-- =============================================================================
CREATE TABLE IF NOT EXISTS source_documents (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url                  text,
  source_title                text,
  source_domain               text,
  source_type                 text NOT NULL DEFAULT 'manual_admin_entry',
  source_access_type          text NOT NULL DEFAULT 'manual_admin_entry'
                                CHECK (source_access_type IN (
                                  'public_web', 'uploaded_file', 'licensed_database',
                                  'partner_submission', 'manual_admin_entry',
                                  'email_forward', 'private_source'
                                )),
  source_permission_status    text NOT NULL DEFAULT 'uncertain'
                                CHECK (source_permission_status IN (
                                  'allowed', 'uncertain', 'restricted', 'blocked'
                                )),
  source_reuse_allowed        boolean,
  source_date                 date,
  discovered_at               timestamptz NOT NULL DEFAULT now(),
  last_seen_at                timestamptz,
  raw_text                    text,
  cleaned_text                text,
  raw_text_retention_status   text NOT NULL DEFAULT 'retained'
                                CHECK (raw_text_retention_status IN (
                                  'retained', 'redacted', 'removed', 'not_stored'
                                )),
  language_code               text,
  checksum                    text,
  source_credibility_score    numeric(6,4),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- source_chunks
-- Text chunks derived from source_documents, with optional embeddings.
-- =============================================================================
CREATE TABLE IF NOT EXISTS source_chunks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id   uuid NOT NULL REFERENCES source_documents (id) ON DELETE CASCADE,
  chunk_index          integer NOT NULL,
  chunk_text           text NOT NULL,
  embedding            vector(384),
  token_estimate       integer,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, chunk_index)
);

-- =============================================================================
-- signal_duplicate_groups
-- Groups of near-duplicate signal candidates.
-- canonical_signal_candidate_id FK added after signal_candidates is created.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_duplicate_groups (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_signal_candidate_id   uuid,   -- FK added below after signal_candidates
  duplicate_reason                text,
  similarity_score                numeric(6,4),
  created_at                      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_candidates
-- Core table. Each row is a candidate commercial signal extracted from a source.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_candidates (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id              uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  source_chunk_id                 uuid REFERENCES source_chunks (id) ON DELETE SET NULL,
  duplicate_group_id              uuid REFERENCES signal_duplicate_groups (id) ON DELETE SET NULL,

  signal_type                     text NOT NULL
                                    CHECK (signal_type IN (
                                      'supplier_lead', 'buyer_demand', 'seller_listing',
                                      'used_equipment', 'surplus_inventory',
                                      'facility_liquidation', 'packaging_supply',
                                      'cannabis_inventory', 'service_provider',
                                      'business_opportunity', 'policy_change',
                                      'regulatory_signal', 'market_entry_signal',
                                      'counterparty_signal', 'ignore'
                                    )),
  marketplace_category            text
                                    CHECK (marketplace_category IN (
                                      'new_products', 'used_surplus', 'cannabis_inventory',
                                      'wanted_requests', 'services', 'business_opportunities',
                                      'supplier_directory', 'policy_regulatory_signal', 'ignore'
                                    )),

  title                           text NOT NULL,
  summary                         text,
  inferred_company_name           text,
  inferred_location               text,
  inferred_product_type           text,

  jurisdiction_country            text,
  jurisdiction_region             text,
  jurisdiction_city               text,
  jurisdiction_confidence         numeric(6,4),
  jurisdiction_source             text,

  -- Scores (all nullable unless otherwise noted)
  model_confidence_score          numeric(6,4),
  source_credibility_score        numeric(6,4),
  recency_score                   numeric(6,4),
  evidence_strength_score         numeric(6,4),
  category_fit_score              numeric(6,4),
  novelty_score                   numeric(6,4),
  commercial_relevance_score      numeric(6,4),
  commercial_actionability_score  numeric(6,4),
  final_signal_score              numeric(6,4),
  score_breakdown                 jsonb NOT NULL DEFAULT '{}',
  relevance_score                 numeric(6,4),
  rerank_score                    numeric(6,4),
  confidence_score                numeric(6,4),

  status                          text NOT NULL DEFAULT 'needs_review'
                                    CHECK (status IN (
                                      'needs_review', 'needs_source_check',
                                      'needs_contact_enrichment', 'needs_compliance_review',
                                      'needs_pricing_check', 'priority_review',
                                      'approved', 'rejected', 'duplicate', 'archived',
                                      'ready_for_outreach', 'outreach_sent',
                                      'converted_to_listing', 'converted_to_supplier',
                                      'converted_to_wanted_request', 'converted_to_dossier'
                                    )),
  review_notes                    text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

-- Back-fill the FK from signal_duplicate_groups to signal_candidates
ALTER TABLE signal_duplicate_groups
  ADD CONSTRAINT fk_duplicate_groups_canonical_signal
  FOREIGN KEY (canonical_signal_candidate_id)
  REFERENCES signal_candidates (id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- =============================================================================
-- signal_evidence
-- Supporting evidence for a signal candidate.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_evidence (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id     uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  source_document_id      uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  source_chunk_id         uuid REFERENCES source_chunks (id) ON DELETE SET NULL,
  evidence_type           text NOT NULL,
  evidence_claim_type     text NOT NULL DEFAULT 'source_statement'
                            CHECK (evidence_claim_type IN (
                              'source_statement', 'model_inference', 'operator_verification',
                              'commercial_interpretation', 'regulatory_interpretation',
                              'external_confirmation'
                            )),
  evidence_text           text NOT NULL,
  source_url              text,
  confidence_score        numeric(6,4),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_review_events
-- Audit log for every status change or review action on a signal candidate.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_review_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  reviewer_id          uuid,
  event_type           text NOT NULL,
  old_value            jsonb,
  new_value            jsonb,
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_jobs
-- Job queue for async processing tasks (embedding, classification, dedup, etc.).
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      text NOT NULL,
  target_type   text NOT NULL,
  target_id     uuid,
  status        text NOT NULL DEFAULT 'queued'
                  CHECK (status IN (
                    'queued', 'processing', 'completed', 'failed', 'cancelled'
                  )),
  attempts      integer NOT NULL DEFAULT 0,
  max_attempts  integer NOT NULL DEFAULT 3,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  failed_at     timestamptz,
  error_code    text,
  error_message text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_risk_flags
-- Per-candidate risk and quality flags set by model or reviewer.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_risk_flags (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  flag                 text NOT NULL
                         CHECK (flag IN (
                           'stale', 'duplicate', 'restricted_source',
                           'insufficient_evidence', 'unclear_counterparty',
                           'unclear_jurisdiction', 'unverified_licence_claim',
                           'high_compliance_risk', 'low_commercial_value',
                           'likely_spam', 'not_cannabis_relevant',
                           'not_marketplace_relevant'
                         )),
  severity             text NOT NULL DEFAULT 'medium'
                         CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason               text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- model_prompt_versions
-- Versioned prompts / queries used for model tasks.
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_prompt_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name         text NOT NULL,
  version           text NOT NULL,
  prompt_or_query   text NOT NULL,
  labels            jsonb,
  active            boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_name, version)
);

-- =============================================================================
-- model_call_logs
-- Audit log for every external model invocation.
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_call_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider             text NOT NULL,
  model_name           text NOT NULL,
  model_task           text NOT NULL,
  prompt_version_id    uuid REFERENCES model_prompt_versions (id) ON DELETE SET NULL,
  input_hash           text,
  input_excerpt        text,
  output_json          jsonb,
  latency_ms           integer,
  token_or_unit_count  integer,
  status               text NOT NULL
                         CHECK (status IN ('success', 'failed', 'skipped', 'mock')),
  error_message        text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- entities
-- Deduplicated company / operator / organisation registry.
-- =============================================================================
CREATE TABLE IF NOT EXISTS entities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type           text NOT NULL,
  name                  text NOT NULL,
  website               text,
  domain                text,
  country               text,
  region                text,
  verification_status   text NOT NULL DEFAULT 'unverified',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_entity_mentions
-- Links signal candidates to resolved entities.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_entity_mentions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id  uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  entity_id            uuid REFERENCES entities (id) ON DELETE SET NULL,
  mentioned_name       text NOT NULL,
  mention_role         text,
  confidence_score     numeric(6,4),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_conversions
-- Records when a signal is promoted to a real marketplace or dossier record.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_conversions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_candidate_id     uuid NOT NULL REFERENCES signal_candidates (id) ON DELETE CASCADE,
  conversion_type         text NOT NULL
                            CHECK (conversion_type IN (
                              'marketplace_listing', 'supplier_directory_record',
                              'wanted_request', 'private_brokerage_opportunity',
                              'dossier_item'
                            )),
  converted_record_id     uuid,
  converted_record_table  text,
  reviewer_id             uuid,
  conversion_notes        text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- signal_processing_errors
-- Structured error log linking jobs, sources, and candidates.
-- =============================================================================
CREATE TABLE IF NOT EXISTS signal_processing_errors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_job_id        uuid REFERENCES signal_jobs (id) ON DELETE SET NULL,
  source_document_id   uuid REFERENCES source_documents (id) ON DELETE SET NULL,
  signal_candidate_id  uuid REFERENCES signal_candidates (id) ON DELETE SET NULL,
  error_code           text NOT NULL,
  error_message        text,
  error_context        jsonb NOT NULL DEFAULT '{}',
  resolved             boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- source_documents
CREATE INDEX IF NOT EXISTS idx_source_documents_checksum
  ON source_documents (checksum);
CREATE INDEX IF NOT EXISTS idx_source_documents_source_domain
  ON source_documents (source_domain);
CREATE INDEX IF NOT EXISTS idx_source_documents_permission_status
  ON source_documents (source_permission_status);

-- source_chunks — standard btree
CREATE INDEX IF NOT EXISTS idx_source_chunks_source_document_id
  ON source_chunks (source_document_id);

-- source_chunks — ivfflat cosine (skip gracefully if extension unavailable)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    BEGIN
      EXECUTE $sql$
        CREATE INDEX IF NOT EXISTS idx_source_chunks_embedding
          ON source_chunks USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
      $sql$;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ivfflat index creation skipped: %', SQLERRM;
    END;
  END IF;
END $$;

-- signal_candidates
CREATE INDEX IF NOT EXISTS idx_signal_candidates_status
  ON signal_candidates (status);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_marketplace_category
  ON signal_candidates (marketplace_category);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_signal_type
  ON signal_candidates (signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_final_signal_score
  ON signal_candidates (final_signal_score);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_source_document_id
  ON signal_candidates (source_document_id);
CREATE INDEX IF NOT EXISTS idx_signal_candidates_duplicate_group_id
  ON signal_candidates (duplicate_group_id);

-- signal_evidence
CREATE INDEX IF NOT EXISTS idx_signal_evidence_signal_candidate_id
  ON signal_evidence (signal_candidate_id);

-- signal_jobs
CREATE INDEX IF NOT EXISTS idx_signal_jobs_status_scheduled_at
  ON signal_jobs (status, scheduled_at);

-- signal_risk_flags
CREATE INDEX IF NOT EXISTS idx_signal_risk_flags_signal_candidate_id
  ON signal_risk_flags (signal_candidate_id);

-- model_call_logs
CREATE INDEX IF NOT EXISTS idx_model_call_logs_model_name_task
  ON model_call_logs (model_name, model_task);

-- entities
CREATE INDEX IF NOT EXISTS idx_entities_domain
  ON entities (domain);
CREATE INDEX IF NOT EXISTS idx_entities_name
  ON entities (name);

-- signal_entity_mentions
CREATE INDEX IF NOT EXISTS idx_signal_entity_mentions_signal_candidate_id
  ON signal_entity_mentions (signal_candidate_id);

-- signal_conversions
CREATE INDEX IF NOT EXISTS idx_signal_conversions_signal_candidate_id
  ON signal_conversions (signal_candidate_id);

-- signal_processing_errors
CREATE INDEX IF NOT EXISTS idx_signal_processing_errors_resolved
  ON signal_processing_errors (resolved);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260430000001','signal_engine_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260430000001_signal_engine_schema.sql

-- RECOVERY BEGIN 20260430000002_signal_engine_rls.sql
-- =============================================================================
-- Harbourview Signal Engine V1 — RLS Migration
-- Milestone 1: Database Foundation
-- =============================================================================
-- INTEGRATION POINT (Milestone 2): Replace is_signal_admin() body with the
-- real admin check once auth conventions are wired. Options:
--   auth.jwt() ->> 'role' = 'admin'
--   (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean
--   auth.uid() IN (SELECT user_id FROM admin_users)
-- =============================================================================

-- Admin helper function (placeholder — always returns false until Milestone 2)
CREATE OR REPLACE FUNCTION is_signal_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT false;
  -- INTEGRATION POINT: replace with real admin check in Milestone 2
$$;

-- Helper: is the caller the service_role?
-- service_role bypasses RLS by default in Supabase; these policies are defence-in-depth.
-- We use current_role to allow explicit grants in non-Supabase environments.
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT current_role = 'service_role';
$$;

-- =============================================================================
-- Enable RLS on every signal engine table
-- =============================================================================
ALTER TABLE source_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_duplicate_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_evidence          ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_review_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_risk_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_prompt_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_call_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_entity_mentions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_conversions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_processing_errors ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Policy macro: DENY all by default
-- (No policy = no access for any role. These comments document intent.)
-- anon role:           DENY all — no policy created
-- authenticated (non-admin): DENY all — no policy created
-- Policies below grant the minimum required per role.
-- =============================================================================

-- =============================================================================
-- ADMIN: full read/write on all tables
-- =============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'source_documents', 'source_chunks', 'signal_duplicate_groups',
    'signal_candidates', 'signal_evidence', 'signal_review_events',
    'signal_jobs', 'signal_risk_flags', 'model_prompt_versions',
    'model_call_logs', 'entities', 'signal_entity_mentions',
    'signal_conversions', 'signal_processing_errors'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY admin_all ON %I FOR ALL TO authenticated
       USING (is_signal_admin())
       WITH CHECK (is_signal_admin())',
      t
    );
  END LOOP;
END $$;

-- =============================================================================
-- SERVICE_ROLE: INSERT/UPDATE on processing tables
-- (service_role bypasses RLS in Supabase by default; these are defence-in-depth
--  and explicit grants for non-Supabase deployments.)
-- =============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'signal_jobs', 'model_call_logs', 'signal_candidates',
    'signal_evidence', 'signal_processing_errors', 'source_chunks'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY service_role_write ON %I FOR INSERT TO service_role
       WITH CHECK (true)',
      t
    );
    EXECUTE format(
      'CREATE POLICY service_role_update ON %I FOR UPDATE TO service_role
       USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260430000002','signal_engine_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260430000002_signal_engine_rls.sql

-- RECOVERY BEGIN 20260430000003_marketplace_inquiries_conversion_replay.sql
-- Replay-safe chronological repair for the marketplace inquiry workflow.
--
-- The historical conversion migration is dated 20260304000000, but the
-- marketplace_inquiries table is not created until 20260430000000 in a clean
-- repository replay. Restore the production column and constraint contract
-- immediately after relation creation so June/July views and RPCs compile.
-- Existing production data and values are preserved.

do $marketplace_inquiry_conversion_replay$
begin
  if to_regclass('public.marketplace_inquiries') is null then
    raise exception 'public.marketplace_inquiries must exist before conversion replay';
  end if;

  alter table public.marketplace_inquiries
    add column if not exists review_status text not null default 'received',
    add column if not exists priority text not null default 'medium',
    add column if not exists last_contacted_at timestamptz,
    add column if not exists next_follow_up_at timestamptz,
    add column if not exists internal_response_notes text;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_inquiries'::regclass
      and conname = 'marketplace_inquiries_review_status_check'
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_review_status_check
      check (review_status in (
        'received', 'reviewing', 'contacted', 'qualified', 'not_fit', 'closed'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.marketplace_inquiries'::regclass
      and conname = 'marketplace_inquiries_priority_check'
  ) then
    alter table public.marketplace_inquiries
      add constraint marketplace_inquiries_priority_check
      check (priority in ('high', 'medium', 'low'));
  end if;
end
$marketplace_inquiry_conversion_replay$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260430000003','marketplace_inquiries_conversion_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260430000003_marketplace_inquiries_conversion_replay.sql

-- RECOVERY BEGIN 20260501000001_harden_marketplace_inquiries.sql
-- Gate 7: Harden Harbourview marketplace inquiry capture
-- This migration assumes public.marketplace_inquiries already exists in production with:
-- contact_name, contact_email, contact_company, contact_phone, inquiry_type, message,
-- listing_id, buyer_request_id, status inquiry_status, internal_notes, created_at and updated_at.
-- It does not create or alter columns, avoiding a second schema shape.

alter table public.marketplace_inquiries enable row level security;

revoke all on public.marketplace_inquiries from anon;
revoke all on public.marketplace_inquiries from authenticated;
grant insert on public.marketplace_inquiries to anon;

drop policy if exists "Public can create marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can read marketplace inquiries" on public.marketplace_inquiries;
drop policy if exists "Authenticated users can update marketplace inquiries" on public.marketplace_inquiries;

create policy "Public can create marketplace inquiries"
  on public.marketplace_inquiries
  for insert
  to anon
  with check (
    length(trim(contact_name)) > 0
    and length(trim(contact_email)) > 0
    and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and length(trim(message)) > 0
    and length(message) <= 2500
    and status = 'received'::public.inquiry_status
    and internal_notes is null
  );

create index if not exists marketplace_inquiries_status_idx
  on public.marketplace_inquiries (status, created_at desc);

create index if not exists marketplace_inquiries_listing_id_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

create index if not exists marketplace_inquiries_buyer_request_id_idx
  on public.marketplace_inquiries (buyer_request_id, created_at desc);

create or replace function public.set_marketplace_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_inquiries_updated_at on public.marketplace_inquiries;
create trigger trg_marketplace_inquiries_updated_at
  before update on public.marketplace_inquiries
  for each row
  execute function public.set_marketplace_inquiries_updated_at();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260501000001','harden_marketplace_inquiries','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260501000001_harden_marketplace_inquiries.sql

-- RECOVERY BEGIN 20260501000002_set_marketplace_inquiries_updated_at_search_path.sql
-- Gate 7.1: Pin search_path for marketplace inquiry updated_at trigger.

create or replace function public.set_marketplace_inquiries_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260501000002','set_marketplace_inquiries_updated_at_search_path','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260501000002_set_marketplace_inquiries_updated_at_search_path.sql

-- RECOVERY BEGIN 20260512000001_network_persistence_v1.sql
-- Harbourview Network Pass 4 persistence (additive schema + RLS only).
-- Private review tables are admin/operator-only. Public projection exposes published rows only.

create table if not exists public.network_review_items (
  id uuid primary key default gen_random_uuid(),
  object_type text not null,
  source_ref text,
  title_internal text not null,
  title_public_draft text,
  country_code text,
  country_label text,
  category_label text,
  review_status text not null default 'submitted',
  claim_risk text not null default 'medium',
  private_analyst_notes text,
  public_summary_draft text,
  suppressed_fields text[] not null default '{}'::text[],
  requires_legal_review boolean not null default false,
  requires_compliance_review boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_review_items_object_type_check check (
    object_type in ('country', 'category', 'listing', 'wanted_request', 'intelligence_brief')
  ),
  constraint network_review_items_review_status_check check (
    review_status in ('submitted', 'under_review', 'needs_clarification', 'approved_public_summary', 'rejected', 'archived')
  ),
  constraint network_review_items_claim_risk_check check (claim_risk in ('low', 'medium', 'high')),
  constraint network_review_items_title_internal_not_empty check (length(trim(title_internal)) > 0)
);

create table if not exists public.network_intelligence_summaries (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null references public.network_review_items(id) on delete cascade,
  summary_type text not null,
  summary_title text not null,
  summary_body text not null,
  confidence_label text,
  generated_by text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_intel_summaries_summary_type_check check (
    summary_type in ('internal_brief', 'public_draft', 'risk_assessment', 'redaction_note')
  ),
  constraint network_intel_summaries_summary_title_not_empty check (length(trim(summary_title)) > 0),
  constraint network_intel_summaries_summary_body_not_empty check (length(trim(summary_body)) > 0)
);

create table if not exists public.network_public_projections (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null unique references public.network_review_items(id) on delete restrict,
  object_type text not null,
  slug text not null,
  name text not null,
  public_summary text not null,
  country_label text,
  category_label text,
  published_state text not null default 'published',
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint network_public_projections_object_type_check check (
    object_type in ('country', 'category', 'listing', 'wanted_request', 'intelligence_brief')
  ),
  constraint network_public_projections_published_state_check check (published_state in ('published', 'archived')),
  constraint network_public_projections_slug_not_empty check (length(trim(slug)) > 0),
  constraint network_public_projections_name_not_empty check (length(trim(name)) > 0),
  constraint network_public_projections_summary_not_empty check (length(trim(public_summary)) > 0),
  constraint network_public_projections_version_check check (version > 0),
  constraint network_public_projections_object_slug_version_key unique (object_type, slug, version)
);

create table if not exists public.network_review_events (
  id uuid primary key default gen_random_uuid(),
  review_item_id uuid not null references public.network_review_items(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  event_note text,
  event_payload jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint network_review_events_type_check check (
    event_type in ('created', 'status_changed', 'note_added', 'public_projection_requested', 'public_projection_approved', 'rejected', 'archived')
  )
);

create index if not exists network_review_items_status_created_idx
  on public.network_review_items (review_status, created_at desc);
create index if not exists network_review_items_type_risk_created_idx
  on public.network_review_items (object_type, claim_risk, created_at desc);
create index if not exists network_review_items_active_queue_idx
  on public.network_review_items (created_at desc)
  where review_status in ('submitted', 'under_review', 'needs_clarification');

create index if not exists network_intelligence_summaries_review_item_idx
  on public.network_intelligence_summaries (review_item_id, created_at desc);
create index if not exists network_intelligence_summaries_type_idx
  on public.network_intelligence_summaries (summary_type, created_at desc);

create index if not exists network_public_projections_published_idx
  on public.network_public_projections (published_state, is_active, published_at desc);
create unique index if not exists network_public_projections_slug_active_version_idx
  on public.network_public_projections (slug, is_active, version);

create index if not exists network_review_events_review_item_created_idx
  on public.network_review_events (review_item_id, created_at desc);
create index if not exists network_review_events_type_created_idx
  on public.network_review_events (event_type, created_at desc);

alter table public.network_review_items enable row level security;
alter table public.network_intelligence_summaries enable row level security;
alter table public.network_public_projections enable row level security;
alter table public.network_review_events enable row level security;

revoke all on public.network_review_items from anon;
revoke all on public.network_intelligence_summaries from anon;
revoke all on public.network_public_projections from anon;
revoke all on public.network_review_events from anon;

revoke all on public.network_review_items from authenticated;
revoke all on public.network_intelligence_summaries from authenticated;
revoke all on public.network_public_projections from authenticated;
revoke all on public.network_review_events from authenticated;

grant select, insert, update, delete on public.network_review_items to authenticated;
grant select, insert, update, delete on public.network_intelligence_summaries to authenticated;
grant select, insert, update, delete on public.network_public_projections to authenticated;
grant select, insert, update, delete on public.network_review_events to authenticated;
grant select on public.network_public_projections to anon;

drop policy if exists network_review_items_admin_operator_only on public.network_review_items;
drop policy if exists network_intelligence_summaries_admin_operator_only on public.network_intelligence_summaries;
drop policy if exists network_public_projections_admin_operator_only on public.network_public_projections;
drop policy if exists network_public_projections_published_read on public.network_public_projections;
drop policy if exists network_review_events_admin_operator_only on public.network_review_events;

create policy network_review_items_admin_operator_only
  on public.network_review_items
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_intelligence_summaries_admin_operator_only
  on public.network_intelligence_summaries
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_public_projections_published_read
  on public.network_public_projections
  for select
  to anon, authenticated
  using (published_state = 'published' and is_active = true);

create policy network_public_projections_admin_operator_only
  on public.network_public_projections
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

create policy network_review_events_admin_operator_only
  on public.network_review_events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('admin', 'operator')
    )
  );

comment on table public.network_review_items is 'Private canonical Harbourview Network review records. Admin/operator access only.';
comment on table public.network_intelligence_summaries is 'Private analyst intelligence summaries tied to review items. Admin/operator access only.';
comment on table public.network_public_projections is 'Public-safe Harbourview Network projection rows published through explicit review action.';
comment on table public.network_review_events is 'Private append-only audit ledger for Harbourview Network review actions.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260512000001','network_persistence_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260512000001_network_persistence_v1.sql

-- RECOVERY BEGIN 20260526000000_phase1_source_import_recovery.sql
begin;

create extension if not exists pgcrypto;

create or replace function public.hv_normalize_source_url(input_url text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(lower(trim(both from coalesce(input_url, ''))), '/+$', ''), '');
$$;

create table if not exists public.source_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null unique,
  source_version text not null,
  source_count_expected integer not null check (source_count_expected >= 0),
  records_received integer not null default 0 check (records_received >= 0),
  records_inserted integer not null default 0 check (records_inserted >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_rejected integer not null default 0 check (records_rejected >= 0),
  checksum text,
  status text not null default 'received' check (status in ('received', 'processing', 'completed', 'failed')),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.source_import_rejections (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references public.source_import_batches(batch_id) on delete cascade,
  source_version text not null,
  row_index integer,
  raw_record jsonb not null,
  normalized_url text,
  rejection_reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists source_import_rejections_batch_id_idx on public.source_import_rejections(batch_id);
create index if not exists source_import_rejections_normalized_url_idx on public.source_import_rejections(normalized_url);

create unique index if not exists source_registry_normalized_url_unique_idx
  on public.source_registry (public.hv_normalize_source_url(source_url))
  where source_url is not null and public.hv_normalize_source_url(source_url) is not null;

create or replace function public.hv_source_import_adapter(input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'html_snapshot'
  end;
$$;

create or replace function public.hv_source_import_fetch_method(input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'html'
  end;
$$;

create or replace function public.hv_source_import_crawl_cadence(input_tier integer, input_type text)
returns text language sql immutable as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'daily'
    when input_tier = 1 then 'daily'
    when input_tier = 2 then 'weekly'
    else 'monthly'
  end;
$$;

create or replace function public.hv_source_import_authority_level(input_tier integer)
returns text language sql immutable as $$
  select case when input_tier = 1 then 'primary' when input_tier = 2 then 'secondary' else 'supplementary' end;
$$;

create or replace function public.hv_source_import_region(input_country text)
returns text language sql immutable as $$
  select case
    when input_country in ('USA', 'United States', 'Canada', 'Mexico') then 'North America'
    when input_country in ('Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Paraguay', 'Ecuador', 'Bolivia') then 'Latin America'
    when input_country in ('UK', 'Germany', 'France', 'Netherlands', 'Poland', 'Czech Republic', 'Romania', 'Ukraine', 'Serbia', 'North Macedonia') then 'Europe'
    when input_country in ('Thailand', 'India', 'Japan', 'South Korea', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Sri Lanka', 'Nepal') then 'Asia'
    when input_country in ('South Africa', 'Lesotho', 'Malawi', 'Zimbabwe', 'Zambia', 'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Ghana', 'Nigeria', 'Morocco', 'Ethiopia') then 'Africa'
    when input_country in ('Australia', 'New Zealand') then 'Oceania'
    when input_country in ('Global', 'Europe', 'European Union', 'LATAM', 'Latin America', 'Africa', 'Asia', 'Pan-African', 'ASEAN') then input_country
    else null
  end;
$$;

create or replace function public.hv_source_import_signal_keywords(input_category text, input_subcategory text, input_notes text)
returns text[] language sql immutable as $$
  select array_remove(array[
    nullif(lower(trim(input_category)), ''),
    nullif(lower(trim(input_subcategory)), ''),
    case when coalesce(input_notes, '') ilike '%import%' then 'import' end,
    case when coalesce(input_notes, '') ilike '%export%' then 'export' end,
    case when coalesce(input_notes, '') ilike '%license%' or coalesce(input_notes, '') ilike '%licence%' then 'licensing' end,
    case when coalesce(input_notes, '') ilike '%clinical%' then 'clinical' end,
    case when coalesce(input_notes, '') ilike '%trial%' then 'clinical_trials' end,
    case when coalesce(input_notes, '') ilike '%hemp%' then 'hemp' end,
    case when coalesce(input_notes, '') ilike '%procurement%' or coalesce(input_notes, '') ilike '%tender%' then 'procurement' end,
    case when coalesce(input_notes, '') ilike '%court%' then 'court' end,
    case when coalesce(input_notes, '') ilike '%gazette%' then 'gazette' end,
    case when coalesce(input_notes, '') ilike '%customs%' then 'customs' end,
    case when coalesce(input_notes, '') ilike '%recall%' then 'recall' end
  ], null);
$$;

create or replace function public.import_source_registry_batch(
  p_batch_id text,
  p_source_version text,
  p_records jsonb,
  p_checksum text default null
)
returns table (batch_id text, received integer, inserted integer, updated integer, rejected integer, final_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_received integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_rejected integer := 0;
begin
  if p_batch_id is null or btrim(p_batch_id) = '' then raise exception 'batch_id is required'; end if;
  if p_source_version is null or btrim(p_source_version) = '' then raise exception 'source_version is required'; end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' then raise exception 'records must be a JSON array'; end if;

  v_received := jsonb_array_length(p_records);

  insert into public.source_import_batches (batch_id, source_version, source_count_expected, records_received, checksum, status, started_at)
  values (p_batch_id, p_source_version, v_received, v_received, p_checksum, 'processing', now())
  on conflict (batch_id) do update set
    source_version = excluded.source_version,
    source_count_expected = excluded.source_count_expected,
    records_received = excluded.records_received,
    checksum = excluded.checksum,
    records_inserted = 0,
    records_updated = 0,
    records_rejected = 0,
    status = 'processing',
    error_summary = null,
    started_at = now(),
    completed_at = null;

  delete from public.source_import_rejections where source_import_rejections.batch_id = p_batch_id;

  drop table if exists pg_temp.tmp_source_import_upserted;
  drop table if exists pg_temp.tmp_source_import_valid;
  drop table if exists pg_temp.tmp_source_import_records;

  create temp table tmp_source_import_records on commit drop as
  select
    row_number() over ()::integer as row_index,
    raw_record,
    nullif(btrim(raw_record->>'name'), '') as source_name,
    nullif(btrim(raw_record->>'url'), '') as source_url,
    public.hv_normalize_source_url(raw_record->>'url') as normalized_url,
    nullif(btrim(raw_record->>'category'), '') as category,
    nullif(btrim(raw_record->>'subcategory'), '') as subcategory,
    nullif(btrim(raw_record->>'type'), '') as source_type_raw,
    nullif(btrim(raw_record->>'country'), '') as country,
    nullif(btrim(raw_record->>'notes'), '') as notes,
    case when (raw_record->>'tier') ~ '^[0-9]+$' then (raw_record->>'tier')::integer else null end as tier
  from jsonb_array_elements(p_records) as raw_record;

  insert into public.source_import_rejections (batch_id, source_version, row_index, raw_record, normalized_url, rejection_reason)
  select p_batch_id, p_source_version, row_index, raw_record, normalized_url,
    concat_ws('; ',
      case when source_name is null then 'missing name' end,
      case when source_url is null then 'missing url' end,
      case when normalized_url is null then 'invalid normalized url' end,
      case when source_url is not null and source_url !~* '^https?://' then 'non-http url' end,
      case when country is null then 'missing country' end
    )
  from tmp_source_import_records
  where source_name is null or source_url is null or normalized_url is null or source_url !~* '^https?://' or country is null;

  get diagnostics v_rejected = row_count;

  create temp table tmp_source_import_valid on commit drop as
  select distinct on (normalized_url) *
  from tmp_source_import_records
  where source_name is not null and source_url is not null and normalized_url is not null and source_url ~* '^https?://' and country is not null
  order by normalized_url, tier nulls last, row_index;

  create temp table tmp_source_import_upserted (was_inserted boolean not null) on commit drop;

  with upserted as (
  insert into public.source_registry (
    source_name, source_type, source_url, jurisdiction, category_focus, fetch_method, allowed_use, terms_risk,
    review_frequency, is_active, country, subcategory, adapter, crawl_cadence, relevance_status, tier, notes,
    signal_keywords, region, authority_level, intelligence_pass, requires_translation, frequency
  )
  select
    left(source_name, 500), coalesce(source_type_raw, 'html'), source_url, country, category,
    public.hv_source_import_fetch_method(source_type_raw), 'index_reference_only', 'unknown',
    public.hv_source_import_crawl_cadence(tier, source_type_raw), true, country, subcategory,
    public.hv_source_import_adapter(source_type_raw), public.hv_source_import_crawl_cadence(tier, source_type_raw),
    'candidate', coalesce(tier, 3), notes, public.hv_source_import_signal_keywords(category, subcategory, notes),
    public.hv_source_import_region(country), public.hv_source_import_authority_level(coalesce(tier, 3)),
    1, false, public.hv_source_import_crawl_cadence(tier, source_type_raw)
  from tmp_source_import_valid
  on conflict ((public.hv_normalize_source_url(source_url))) where source_url is not null and public.hv_normalize_source_url(source_url) is not null
  do update set
    source_name = excluded.source_name,
    source_type = excluded.source_type,
    jurisdiction = excluded.jurisdiction,
    category_focus = excluded.category_focus,
    fetch_method = excluded.fetch_method,
    review_frequency = excluded.review_frequency,
    is_active = excluded.is_active,
    country = excluded.country,
    subcategory = excluded.subcategory,
    adapter = excluded.adapter,
    crawl_cadence = excluded.crawl_cadence,
    relevance_status = excluded.relevance_status,
    tier = excluded.tier,
    notes = excluded.notes,
    signal_keywords = excluded.signal_keywords,
    region = excluded.region,
    authority_level = excluded.authority_level,
    intelligence_pass = excluded.intelligence_pass,
    requires_translation = excluded.requires_translation,
    frequency = excluded.frequency,
    updated_at = now()
  returning (xmax = 0) as was_inserted
  )
  insert into tmp_source_import_upserted (was_inserted)
  select was_inserted from upserted;

  select count(*) filter (where was_inserted), count(*) filter (where not was_inserted)
  into v_inserted, v_updated
  from tmp_source_import_upserted;

  update public.source_import_batches
  set records_inserted = coalesce(v_inserted, 0), records_updated = coalesce(v_updated, 0), records_rejected = coalesce(v_rejected, 0),
      status = 'completed', completed_at = now(), error_summary = null
  where source_import_batches.batch_id = p_batch_id;

  return query select p_batch_id, v_received, coalesce(v_inserted, 0), coalesce(v_updated, 0), coalesce(v_rejected, 0), 'completed'::text;
exception when others then
  update public.source_import_batches set status = 'failed', error_summary = sqlerrm, completed_at = now()
  where source_import_batches.batch_id = p_batch_id;
  raise;
end;
$$;

revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from public;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from anon;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from authenticated;
grant execute on function public.import_source_registry_batch(text, text, jsonb, text) to service_role;

alter table public.source_import_batches enable row level security;
alter table public.source_import_rejections enable row level security;

drop policy if exists "source_import_batches_admin_read" on public.source_import_batches;
create policy "source_import_batches_admin_read" on public.source_import_batches for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'operator'))
);

drop policy if exists "source_import_rejections_admin_read" on public.source_import_rejections;
create policy "source_import_rejections_admin_read" on public.source_import_rejections for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'operator'))
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260526000000','phase1_source_import_recovery','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260526000000_phase1_source_import_recovery.sql

-- RECOVERY BEGIN 20260526030100_phase1_source_import_recovery.sql
begin;

create extension if not exists pgcrypto;

create or replace function public.hv_normalize_source_url(input_url text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      lower(trim(both from coalesce(input_url, ''))),
      '/+$',
      ''
    ),
    ''
  );
$$;

create table if not exists public.source_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null unique,
  source_version text not null,
  source_count_expected integer not null check (source_count_expected >= 0),
  records_received integer not null default 0 check (records_received >= 0),
  records_inserted integer not null default 0 check (records_inserted >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_rejected integer not null default 0 check (records_rejected >= 0),
  checksum text,
  status text not null default 'received'
    check (status in ('received', 'processing', 'completed', 'failed')),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.source_import_rejections (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null references public.source_import_batches(batch_id) on delete cascade,
  source_version text not null,
  row_index integer,
  raw_record jsonb not null,
  normalized_url text,
  rejection_reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists source_import_rejections_batch_id_idx
  on public.source_import_rejections(batch_id);

create index if not exists source_import_rejections_normalized_url_idx
  on public.source_import_rejections(normalized_url);

create unique index if not exists source_registry_normalized_url_unique_idx
  on public.source_registry (public.hv_normalize_source_url(source_url))
  where source_url is not null and public.hv_normalize_source_url(source_url) is not null;

create or replace function public.hv_source_import_adapter(input_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'html_snapshot'
  end;
$$;

create or replace function public.hv_source_import_fetch_method(input_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'rss'
    when lower(coalesce(input_type, '')) in ('api', 'open api', 'json api') then 'api'
    else 'manual_url'
  end;
$$;

create or replace function public.hv_source_import_crawl_cadence(input_tier integer, input_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(input_type, '')) in ('rss', 'rss feed', 'feed') then 'daily'
    when input_tier = 1 then 'daily'
    when input_tier = 2 then 'weekly'
    else 'monthly'
  end;
$$;

create or replace function public.hv_source_import_authority_level(input_tier integer)
returns text
language sql
immutable
as $$
  select case
    when input_tier = 1 then 'primary'
    when input_tier = 2 then 'secondary'
    else 'supplementary'
  end;
$$;

create or replace function public.hv_source_import_signal_keywords(
  input_category text,
  input_subcategory text,
  input_notes text
)
returns text[]
language sql
immutable
as $$
  select array_remove(array[
    nullif(lower(trim(input_category)), ''),
    nullif(lower(trim(input_subcategory)), ''),
    case when coalesce(input_notes, '') ilike '%import%' then 'import' end,
    case when coalesce(input_notes, '') ilike '%export%' then 'export' end,
    case when coalesce(input_notes, '') ilike '%license%' or coalesce(input_notes, '') ilike '%licence%' then 'licensing' end,
    case when coalesce(input_notes, '') ilike '%clinical%' then 'clinical' end,
    case when coalesce(input_notes, '') ilike '%trial%' then 'clinical_trials' end,
    case when coalesce(input_notes, '') ilike '%hemp%' then 'hemp' end,
    case when coalesce(input_notes, '') ilike '%procurement%' or coalesce(input_notes, '') ilike '%tender%' then 'procurement' end,
    case when coalesce(input_notes, '') ilike '%court%' then 'court' end,
    case when coalesce(input_notes, '') ilike '%gazette%' then 'gazette' end,
    case when coalesce(input_notes, '') ilike '%customs%' then 'customs' end,
    case when coalesce(input_notes, '') ilike '%recall%' then 'recall' end
  ], null);
$$;

create or replace function public.hv_source_import_region(input_country text)
returns text
language sql
immutable
as $$
  select case
    when input_country in ('USA', 'United States', 'Canada', 'Mexico') then 'North America'
    when input_country in ('Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Uruguay', 'Paraguay', 'Ecuador', 'Bolivia') then 'Latin America'
    when input_country in ('UK', 'Germany', 'France', 'Netherlands', 'Poland', 'Czech Republic', 'Romania', 'Ukraine', 'Serbia', 'North Macedonia') then 'Europe'
    when input_country in ('Thailand', 'India', 'Japan', 'South Korea', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Sri Lanka', 'Nepal') then 'Asia'
    when input_country in ('South Africa', 'Lesotho', 'Malawi', 'Zimbabwe', 'Zambia', 'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Ghana', 'Nigeria', 'Morocco', 'Ethiopia') then 'Africa'
    when input_country in ('Australia', 'New Zealand') then 'Oceania'
    when input_country in ('Global', 'Europe', 'European Union', 'LATAM', 'Latin America', 'Africa', 'Asia', 'Pan-African', 'ASEAN') then input_country
    else null
  end;
$$;

create or replace function public.import_source_registry_batch(
  p_batch_id text,
  p_source_version text,
  p_records jsonb,
  p_checksum text default null
)
returns table (
  batch_id text,
  received integer,
  inserted integer,
  updated integer,
  rejected integer,
  final_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_received integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_rejected integer := 0;
begin
  if p_batch_id is null or btrim(p_batch_id) = '' then
    raise exception 'batch_id is required';
  end if;

  if p_source_version is null or btrim(p_source_version) = '' then
    raise exception 'source_version is required';
  end if;

  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'records must be a JSON array';
  end if;

  v_received := jsonb_array_length(p_records);

  insert into public.source_import_batches (
    batch_id,
    source_version,
    source_count_expected,
    records_received,
    checksum,
    status,
    started_at
  )
  values (
    p_batch_id,
    p_source_version,
    v_received,
    v_received,
    p_checksum,
    'processing',
    now()
  )
  on conflict (batch_id) do update
    set source_version = excluded.source_version,
        source_count_expected = excluded.source_count_expected,
        records_received = excluded.records_received,
        checksum = excluded.checksum,
        records_inserted = 0,
        records_updated = 0,
        records_rejected = 0,
        status = 'processing',
        error_summary = null,
        started_at = now(),
        completed_at = null;

  delete from public.source_import_rejections
  where source_import_rejections.batch_id = p_batch_id;

  drop table if exists pg_temp.tmp_source_import_upserted;
  drop table if exists pg_temp.tmp_source_import_valid;
  drop table if exists pg_temp.tmp_source_import_records;

  create temp table tmp_source_import_records on commit drop as
  select
    row_number() over ()::integer as row_index,
    raw_record,
    nullif(btrim(raw_record->>'name'), '') as source_name,
    nullif(btrim(raw_record->>'url'), '') as source_url,
    public.hv_normalize_source_url(raw_record->>'url') as normalized_url,
    nullif(btrim(raw_record->>'category'), '') as category,
    nullif(btrim(raw_record->>'subcategory'), '') as subcategory,
    nullif(btrim(raw_record->>'type'), '') as source_type_raw,
    nullif(btrim(raw_record->>'country'), '') as country,
    nullif(btrim(raw_record->>'notes'), '') as notes,
    case
      when (raw_record->>'tier') ~ '^[0-9]+$' then (raw_record->>'tier')::integer
      else null
    end as tier
  from jsonb_array_elements(p_records) as raw_record;

  insert into public.source_import_rejections (
    batch_id,
    source_version,
    row_index,
    raw_record,
    normalized_url,
    rejection_reason
  )
  select
    p_batch_id,
    p_source_version,
    row_index,
    raw_record,
    normalized_url,
    concat_ws('; ',
      case when source_name is null then 'missing name' end,
      case when source_url is null then 'missing url' end,
      case when normalized_url is null then 'invalid normalized url' end,
      case when source_url is not null and source_url !~* '^https?://' then 'non-http url' end,
      case when country is null then 'missing country' end
    )
  from tmp_source_import_records
  where source_name is null
     or source_url is null
     or normalized_url is null
     or source_url !~* '^https?://'
     or country is null;

  get diagnostics v_rejected = row_count;

  create temp table tmp_source_import_valid on commit drop as
  select distinct on (normalized_url)
    *
  from tmp_source_import_records
  where source_name is not null
    and source_url is not null
    and normalized_url is not null
    and source_url ~* '^https?://'
    and country is not null
  order by normalized_url, tier nulls last, row_index;

  create temp table tmp_source_import_upserted (was_inserted boolean not null) on commit drop;

  with upserted as (
  insert into public.source_registry (
    source_name,
    source_type,
    source_url,
    jurisdiction,
    category_focus,
    fetch_method,
    allowed_use,
    terms_risk,
    review_frequency,
    is_active,
    country,
    subcategory,
    adapter,
    crawl_cadence,
    relevance_status,
    tier,
    notes,
    signal_keywords,
    region,
    authority_level,
    intelligence_pass,
    requires_translation,
    frequency
  )
  select
    left(source_name, 500),
    coalesce(source_type_raw, 'html'),
    source_url,
    country,
    category,
    public.hv_source_import_fetch_method(source_type_raw),
    'index_reference_only',
    'unknown',
    public.hv_source_import_crawl_cadence(tier, source_type_raw),
    true,
    country,
    subcategory,
    public.hv_source_import_adapter(source_type_raw),
    public.hv_source_import_crawl_cadence(tier, source_type_raw),
    'candidate',
    coalesce(tier, 3),
    notes,
    public.hv_source_import_signal_keywords(category, subcategory, notes),
    public.hv_source_import_region(country),
    public.hv_source_import_authority_level(coalesce(tier, 3)),
    1,
    false,
    public.hv_source_import_crawl_cadence(tier, source_type_raw)
  from tmp_source_import_valid
  on conflict ((public.hv_normalize_source_url(source_url))) where source_url is not null and public.hv_normalize_source_url(source_url) is not null
  do update set
    source_name = excluded.source_name,
    source_type = excluded.source_type,
    jurisdiction = excluded.jurisdiction,
    category_focus = excluded.category_focus,
    fetch_method = excluded.fetch_method,
    review_frequency = excluded.review_frequency,
    is_active = excluded.is_active,
    country = excluded.country,
    subcategory = excluded.subcategory,
    adapter = excluded.adapter,
    crawl_cadence = excluded.crawl_cadence,
    relevance_status = excluded.relevance_status,
    tier = excluded.tier,
    notes = excluded.notes,
    signal_keywords = excluded.signal_keywords,
    region = excluded.region,
    authority_level = excluded.authority_level,
    intelligence_pass = excluded.intelligence_pass,
    requires_translation = excluded.requires_translation,
    frequency = excluded.frequency,
    updated_at = now()
  returning (xmax = 0) as was_inserted
  )
  insert into tmp_source_import_upserted (was_inserted)
  select was_inserted from upserted;

  select
    count(*) filter (where was_inserted),
    count(*) filter (where not was_inserted)
  into v_inserted, v_updated
  from tmp_source_import_upserted;

  update public.source_import_batches
  set
    records_inserted = coalesce(v_inserted, 0),
    records_updated = coalesce(v_updated, 0),
    records_rejected = coalesce(v_rejected, 0),
    status = 'completed',
    completed_at = now(),
    error_summary = null
  where source_import_batches.batch_id = p_batch_id;

  return query
  select
    p_batch_id,
    v_received,
    coalesce(v_inserted, 0),
    coalesce(v_updated, 0),
    coalesce(v_rejected, 0),
    'completed'::text;

exception
  when others then
    update public.source_import_batches
    set
      status = 'failed',
      error_summary = sqlerrm,
      completed_at = now()
    where source_import_batches.batch_id = p_batch_id;

    raise;
end;
$$;

revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from public;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from anon;
revoke all on function public.import_source_registry_batch(text, text, jsonb, text) from authenticated;

grant execute on function public.import_source_registry_batch(text, text, jsonb, text) to service_role;

alter table public.source_import_batches enable row level security;
alter table public.source_import_rejections enable row level security;

drop policy if exists "source_import_batches_admin_read" on public.source_import_batches;
create policy "source_import_batches_admin_read"
on public.source_import_batches
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  )
);

drop policy if exists "source_import_rejections_admin_read" on public.source_import_rejections;
create policy "source_import_rejections_admin_read"
on public.source_import_rejections
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  )
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260526030100','phase1_source_import_recovery','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260526030100_phase1_source_import_recovery.sql

-- RECOVERY BEGIN 20260528000000_education_medical_intelligence_v1.sql
create table if not exists public.education_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.education_tracks(id) on delete cascade,
  slug text unique not null,
  title text not null,
  audience text[] not null default '{}',
  sensitivity text not null default 'standard',
  publication_state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_articles (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.education_modules(id) on delete set null,
  slug text unique not null,
  title text not null,
  summary text not null,
  source_basis text not null default 'draft',
  publication_state text not null default 'draft',
  review_status text not null default 'review-required',
  last_reviewed date,
  next_review_due date,
  publication_confidence text not null default 'low',
  reviewer_type text,
  controlled_topic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_article_sections (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  section_key text not null,
  section_content text not null,
  sort_order int not null default 0
);

create table if not exists public.education_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.education_articles(id) on delete cascade,
  raw_source_url text,
  source_snapshot_path text,
  source_basis text not null default 'pending-verification',
  contradictory_source_flag boolean not null default false,
  unresolved_issues text[] not null default '{}',
  reviewer_notes text
);

create table if not exists public.education_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.education_articles(id) on delete cascade,
  review_state text not null,
  reviewer_category text not null,
  review_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.education_glossary_terms (id uuid primary key default gen_random_uuid(),term text unique not null,definition text not null,synonyms text[] not null default '{}',restricted_term_warning boolean not null default false,prohibited_wording_flags text[] not null default '{}');
create table if not exists public.education_country_briefs (id uuid primary key default gen_random_uuid(),country_code text unique not null,title text not null,readiness_label text not null,summary text not null,jurisdiction_sources text[] not null default '{}');
create table if not exists public.education_requests (id uuid primary key default gen_random_uuid(),requester_name text not null,requester_email text not null,topic text not null,country text,sensitivity text not null default 'standard',status text not null default 'submitted',created_at timestamptz not null default now());
create table if not exists public.education_audit_events (id uuid primary key default gen_random_uuid(),actor text not null,event_type text not null,entity_type text not null,entity_id text not null,payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists public.education_content_relationships (id uuid primary key default gen_random_uuid(),from_article_id uuid references public.education_articles(id) on delete cascade,to_article_id uuid references public.education_articles(id) on delete cascade,relationship_type text not null);
create table if not exists public.education_publication_history (id uuid primary key default gen_random_uuid(),article_id uuid not null references public.education_articles(id) on delete cascade,previous_state text not null,new_state text not null,transitioned_by text not null,transitioned_at timestamptz not null default now());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260528000000','education_medical_intelligence_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260528000000_education_medical_intelligence_v1.sql

-- RECOVERY BEGIN 20260528033000_unified_marketplace_listings.sql
begin;

create extension if not exists pgcrypto;

-- MP-SCHEMA-001: one canonical marketplace listing record with typed detail tables.
-- Additive only: this migration creates missing objects and constraints without dropping,
-- renaming, rewriting, or backfilling existing marketplace data.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  listing_type text not null,
  category text,
  subcategory text,
  status text not null default 'draft',
  visibility text not null default 'private',
  summary text,
  description text,
  location_country text,
  location_region text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists listing_type text,
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists status text not null default 'draft',
  add column if not exists visibility text not null default 'private',
  add column if not exists summary text,
  add column if not exists description text,
  add column if not exists location_country text,
  add column if not exists location_region text,
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Existing databases with a pre-existing listings table must explicitly backfill listing_type
-- before this constraint can be validated. NOT VALID avoids an implicit table rewrite/scan,
-- but still enforces the canonical discriminator for new or updated rows.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_listing_type_check'
  ) then
    alter table public.listings
      add constraint listings_listing_type_check
      check (listing_type is not null and listing_type in ('supply', 'equipment')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_status_check'
  ) then
    alter table public.listings
      add constraint listings_status_check
      check (status in ('draft', 'pending_review', 'approved', 'published', 'rejected', 'archived')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname = 'listings_visibility_check'
  ) then
    alter table public.listings
      add constraint listings_visibility_check
      check (visibility in ('private', 'public')) not valid;
  end if;
end $$;

create table if not exists public.listing_supply_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  product_form text,
  material text,
  minimum_order_quantity text,
  pack_size text,
  origin_country text,
  certifications text[],
  lead_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_equipment_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  manufacturer text,
  model text,
  year integer,
  condition text,
  hours_used integer,
  capacity text,
  voltage text,
  dimensions text,
  asset_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_type_status
  on public.listings (listing_type, status);

create index if not exists idx_listings_public
  on public.listings (visibility, status, published_at desc);

create index if not exists idx_listings_category
  on public.listings (category, subcategory);

create index if not exists idx_supply_details_listing
  on public.listing_supply_details (listing_id);

create index if not exists idx_equipment_details_listing
  on public.listing_equipment_details (listing_id);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260528033000','unified_marketplace_listings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260528033000_unified_marketplace_listings.sql

-- RECOVERY BEGIN 20260528033001_convert_listings_status_to_listing_status.sql
-- Give public.listings.status the production type, immediately after the table
-- is created and before anything builds a view on it.
--
-- Production types this column as the listing_status enum, defaulting to
-- 'pending_review'. The repository's creator, 20260528033000, builds it as
-- `status text not null default 'draft'`. Neither a CREATE TABLE nor an
-- ALTER ... TYPE for public.listings appears anywhere in
-- supabase_migrations.schema_migrations, so production's shape was established
-- outside recorded history and there is no recorded body to restore.
--
-- The divergence has to be fixed in the schema rather than worked around in
-- consumers, because the last migration in the candidate --
-- 20260804234000_marketplace_exposure_forward_repair.sql -- is generated by the
-- pinned assembler at CI time, is not present in this repository, and rebuilds
-- public.marketplace_listings_public_view with:
--   where status = 'approved'::public.listing_status
-- Zero-state replay fails there with:
--   ERROR: operator does not exist: text = listing_status (SQLSTATE 42883)
-- That file cannot be edited from here, so the column must satisfy it.
--
-- Placed here, not later, specifically to avoid dependent views. An
-- ALTER COLUMN ... TYPE fails outright when a view depends on the column, and
-- capturing and replaying view definitions around the change does not work:
-- pg_get_viewdef bakes the resolved literal type into the stored definition, so
-- a view whose source says `status = 'approved'` is stored as
-- `status = 'approved'::text` and will not replay against a converted column.
-- I implemented that approach first and a local test with nested views
-- reproduced exactly this failure.
--
-- At this point in replay there is no such problem: 20260528033000 is the first
-- migration in the repository to create public.listings, and the only earlier
-- migration that builds a view on it, 20260304001000, is rewritten by the
-- assembler to guard on `to_regclass('public.listings') is not null` and so
-- skips. Every view built after this point is therefore built over the enum and
-- stores a consistent enum comparison.
--
-- Verified compatible with every later consumer in the repository. Three forms
-- appear, and all work against an enum column:
--   status = 'approved'                  -- unknown literal, resolves to enum
--   status::text = 'approved'            -- 20260704160603, 20260709010000, 20260731145108
--   status = 'approved'::listing_status  -- the assembler's generated repair
-- The one form that would break, `status = 'approved'::text`, does not occur.
--
-- Value mapping: production's labels are pending_review, approved, rejected and
-- archived. The repository's text CHECK admits two more, so both are mapped to
-- the production label with the same meaning -- 'draft' to 'pending_review'
-- (production's own default, the same pre-review state) and 'published' to
-- 'approved' (the same publicly-visible state). Any other value must already be
-- a valid label; if one is not, the cast raises rather than silently coercing.
-- No migration inserts into public.listings before this point, so in practice
-- the table is empty here and the mapping is a safety net, not a data change.
--
-- Idempotent: returns immediately if the column is already listing_status.

do $convert_listings_status$
declare
  v_atttypid oid;
  v_views    text;
begin
  if to_regclass('public.listings') is null then
    raise notice 'public.listings not present; skipping status conversion';
    return;
  end if;

  select a.atttypid into v_atttypid
  from pg_attribute a
  where a.attrelid = 'public.listings'::regclass
    and a.attname = 'status'
    and not a.attisdropped;

  if v_atttypid is null then
    raise notice 'public.listings.status not present; skipping conversion';
    return;
  end if;

  if to_regtype('public.listing_status') is null then
    create type public.listing_status as enum (
      'pending_review',
      'approved',
      'rejected',
      'archived'
    );
    raise notice 'created enum public.listing_status';
  end if;

  if v_atttypid = 'public.listing_status'::regtype then
    raise notice 'public.listings.status is already listing_status; nothing to do';
    return;
  end if;

  -- Defensive: this migration is only safe while nothing depends on the column.
  -- If that ever stops being true, say so plainly instead of failing with a
  -- bare Postgres dependency error.
  select string_agg(c.oid::regclass::text, ', ')
    into v_views
  from pg_depend d
  join pg_rewrite r on r.oid = d.objid
  join pg_class c on c.oid = r.ev_class
  where d.refobjid = 'public.listings'::regclass
    and d.refobjsubid = (
      select attnum from pg_attribute
      where attrelid = 'public.listings'::regclass and attname = 'status'
    )
    and c.relkind in ('v', 'm')
    and c.oid <> 'public.listings'::regclass;

  if v_views is not null then
    raise exception
      'cannot convert public.listings.status: view(s) already depend on it (%). '
      'This migration must run before any view is built over the column.', v_views;
  end if;

  -- 20260528033000 adds a text CHECK on this column:
  --   check (status = any (array['draft','pending_review','approved',
  --                              'published','rejected','archived']))
  -- It cannot survive the conversion -- re-checking it against an enum column
  -- raises `operator does not exist: listing_status = text` -- and it is
  -- redundant afterwards, because the enum enforces a stricter domain. It also
  -- admits two labels the enum does not have. Production carries no such
  -- constraint, relying on the enum exactly as this does.
  alter table public.listings drop constraint if exists listings_status_check;

  alter table public.listings alter column status drop default;

  alter table public.listings
    alter column status type public.listing_status
    using (case status::text
             when 'draft' then 'pending_review'
             when 'published' then 'approved'
             else status::text
           end)::public.listing_status;

  alter table public.listings
    alter column status set default 'pending_review'::public.listing_status;

  raise notice 'public.listings.status converted to listing_status';
end
$convert_listings_status$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260528033001','convert_listings_status_to_listing_status','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260528033001_convert_listings_status_to_listing_status.sql

-- RECOVERY BEGIN 20260531000000_intelligence_automation_tables.sql
-- =============================================================================
-- Intelligence Automation Tables V1
-- Backing store for /admin/intelligence-automation/* pages.
-- All tables are admin/operator-only (no public read).
-- =============================================================================

-- ── ia_sources ────────────────────────────────────────────────────────────────
-- Maps to AutomationSource. Source registry for intelligence acquisition.
CREATE TABLE IF NOT EXISTS ia_sources (
  id                  text        PRIMARY KEY,
  name                text        NOT NULL,
  category            text        NOT NULL,
  markets             text[]      NOT NULL DEFAULT '{}',
  reliability         text        NOT NULL DEFAULT 'medium'
                                    CHECK (reliability IN ('high','medium','low','unverified')),
  last_checked        date,
  next_check          date,
  signal_yield        integer     NOT NULL DEFAULT 0,
  status              text        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active','paused','needs_review','deprecated')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_sources ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_sources_admin_operator_all on ia_sources;
CREATE POLICY ia_sources_admin_operator_all ON ia_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_signals ────────────────────────────────────────────────────────────────
-- Maps to AutomationSignal. Generated commercial signals from source observations.
CREATE TABLE IF NOT EXISTS ia_signals (
  id                  text        PRIMARY KEY,
  title               text        NOT NULL,
  type                text        NOT NULL,
  stage               text        NOT NULL DEFAULT 'new'
                                    CHECK (stage IN (
                                      'new','needs_review','qualified',
                                      'converted_to_opportunity','linked_to_counterparty',
                                      'linked_to_market_pathway','archived'
                                    )),
  source_id           text        REFERENCES ia_sources(id) ON DELETE SET NULL,
  source_name         text        NOT NULL,
  market              text        NOT NULL,
  category            text        NOT NULL,
  confidence          integer     NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  commercial_impact   text        NOT NULL DEFAULT 'medium'
                                    CHECK (commercial_impact IN ('high','medium','low')),
  summary             text        NOT NULL,
  detected_at         date        NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at         date,
  reviewed_by         uuid,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_signals ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_signals_admin_operator_all on ia_signals;
CREATE POLICY ia_signals_admin_operator_all ON ia_signals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_counterparties ─────────────────────────────────────────────────────────
-- Maps to RelationshipMemoryRecord. Persistent counterparty memory.
CREATE TABLE IF NOT EXISTS ia_counterparties (
  id                    text        PRIMARY KEY,
  name                  text        NOT NULL,
  role                  text        NOT NULL,
  markets               text[]      NOT NULL DEFAULT '{}',
  categories            text[]      NOT NULL DEFAULT '{}',
  needs_profile         text,
  supply_profile        text,
  interaction_count     integer     NOT NULL DEFAULT 0,
  last_interaction      date,
  introduction_count    integer     NOT NULL DEFAULT 0,
  documentation_status  text        NOT NULL DEFAULT 'missing'
                                      CHECK (documentation_status IN ('complete','partial','missing')),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_counterparties ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_counterparties_admin_operator_all on ia_counterparties;
CREATE POLICY ia_counterparties_admin_operator_all ON ia_counterparties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_scoring_records ────────────────────────────────────────────────────────
-- Maps to ScoringRecord. Fit/readiness/trust scores for counterparties.
CREATE TABLE IF NOT EXISTS ia_scoring_records (
  id                        text        PRIMARY KEY,
  counterparty_id           text        REFERENCES ia_counterparties(id) ON DELETE CASCADE,
  counterparty_name         text        NOT NULL,
  counterparty_role         text        NOT NULL,
  fit_score                 integer     NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  readiness_score           integer     NOT NULL DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  trust_score               integer     NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  routing_priority          text        NOT NULL DEFAULT 'low'
                                          CHECK (routing_priority IN ('high','medium','low')),
  follow_up_priority        text        NOT NULL DEFAULT 'when_ready'
                                          CHECK (follow_up_priority IN ('urgent','soon','when_ready','dormant')),
  introduction_priority     text        NOT NULL DEFAULT 'not_ready'
                                          CHECK (introduction_priority IN ('high','medium','low','not_ready')),
  market_access_relevance   text[]      NOT NULL DEFAULT '{}',
  scored_at                 date        NOT NULL DEFAULT CURRENT_DATE,
  score_drivers             text[]      NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_scoring_records ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_scoring_admin_operator_all on ia_scoring_records;
CREATE POLICY ia_scoring_admin_operator_all ON ia_scoring_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_agent_tasks ────────────────────────────────────────────────────────────
-- Maps to AgentWorkItem. Agent work queue tasks.
CREATE TABLE IF NOT EXISTS ia_agent_tasks (
  id                text        PRIMARY KEY,
  queue             text        NOT NULL,
  title             text        NOT NULL,
  object_type       text        NOT NULL,
  object_label      text        NOT NULL,
  priority          text        NOT NULL DEFAULT 'medium'
                                  CHECK (priority IN ('urgent','high','medium','low')),
  suggested_action  text        NOT NULL,
  rationale         text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','in_progress','completed','escalated','deferred')),
  agent_label       text        NOT NULL,
  next_action       text        NOT NULL,
  completed_at      timestamptz,
  completed_by      uuid,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_agent_tasks ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_agent_tasks_admin_operator_all on ia_agent_tasks;
CREATE POLICY ia_agent_tasks_admin_operator_all ON ia_agent_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_evidence_vault ─────────────────────────────────────────────────────────
-- Maps to EvidenceVaultEntry. Private evidence documents linked to counterparties.
CREATE TABLE IF NOT EXISTS ia_evidence_vault (
  id                        text        PRIMARY KEY,
  title                     text        NOT NULL,
  type                      text        NOT NULL,
  linked_counterparty_id    text        REFERENCES ia_counterparties(id) ON DELETE SET NULL,
  linked_counterparty_name  text,
  linked_market             text,
  review_status             text        NOT NULL DEFAULT 'pending'
                                          CHECK (review_status IN ('pending','reviewed','needs_action','archived')),
  tags                      text[]      NOT NULL DEFAULT '{}',
  notes                     text,
  added_at                  date        NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at               timestamptz,
  reviewed_by               uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_evidence_vault ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_evidence_admin_operator_all on ia_evidence_vault;
CREATE POLICY ia_evidence_admin_operator_all ON ia_evidence_vault
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_graph_entities ─────────────────────────────────────────────────────────
-- Maps to GraphEntity. Market graph nodes.
CREATE TABLE IF NOT EXISTS ia_graph_entities (
  id               text        PRIMARY KEY,
  type             text        NOT NULL,
  label            text        NOT NULL,
  market           text,
  category         text,
  connection_count integer     NOT NULL DEFAULT 0,
  signal_count     integer     NOT NULL DEFAULT 0,
  last_activity    date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_graph_entities ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_graph_entities_admin_operator_all on ia_graph_entities;
CREATE POLICY ia_graph_entities_admin_operator_all ON ia_graph_entities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_graph_edges ────────────────────────────────────────────────────────────
-- Maps to GraphEdge. Market graph edges (relationships between entities).
CREATE TABLE IF NOT EXISTS ia_graph_edges (
  id          text        PRIMARY KEY,
  type        text        NOT NULL,
  from_label  text        NOT NULL,
  to_label    text        NOT NULL,
  strength    text        NOT NULL DEFAULT 'medium'
                            CHECK (strength IN ('strong','medium','weak')),
  evidenced   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_graph_edges ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_graph_edges_admin_operator_all on ia_graph_edges;
CREATE POLICY ia_graph_edges_admin_operator_all ON ia_graph_edges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_feedback_events ────────────────────────────────────────────────────────
-- Maps to FeedbackEvent. Outcome events that close the commercial intelligence loop.
CREATE TABLE IF NOT EXISTS ia_feedback_events (
  id                  text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  outcome_type        text        NOT NULL,
  counterparty_name   text,
  market              text        NOT NULL,
  category            text        NOT NULL,
  score_impact        text        NOT NULL DEFAULT 'neutral'
                                    CHECK (score_impact IN ('positive','negative','neutral')),
  routing_impact      text        NOT NULL,
  notes               text,
  logged_at           date        NOT NULL DEFAULT CURRENT_DATE,
  logged_by           uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_feedback_events ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_feedback_admin_operator_all on ia_feedback_events;
CREATE POLICY ia_feedback_admin_operator_all ON ia_feedback_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ia_signals_stage       ON ia_signals(stage);
CREATE INDEX IF NOT EXISTS idx_ia_signals_market      ON ia_signals(market);
CREATE INDEX IF NOT EXISTS idx_ia_signals_detected_at ON ia_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_sources_status      ON ia_sources(status);
CREATE INDEX IF NOT EXISTS idx_ia_counterparties_role ON ia_counterparties(role);
CREATE INDEX IF NOT EXISTS idx_ia_scoring_fit         ON ia_scoring_records(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_ia_agent_tasks_priority ON ia_agent_tasks(priority, status);
CREATE INDEX IF NOT EXISTS idx_ia_evidence_review     ON ia_evidence_vault(review_status);
CREATE INDEX IF NOT EXISTS idx_ia_graph_entities_type ON ia_graph_entities(type);
CREATE INDEX IF NOT EXISTS idx_ia_feedback_logged_at  ON ia_feedback_events(logged_at DESC);

-- =============================================================================
-- SEED: Insert fixture data so pages have live data immediately.
-- All inserts use ON CONFLICT DO NOTHING so re-running is safe.
-- =============================================================================

INSERT INTO ia_sources (id, name, category, markets, reliability, last_checked, next_check, signal_yield, status, notes)
VALUES
  ('src-001','BfArM Medical Cannabis Registry','cannabis_licence_database','{Germany}','high','2026-05-27','2026-06-03',8,'active','Validate before live fetch.'),
  ('src-002','UK Home Office Controlled Medicines','regulator_updates','{United Kingdom}','high','2026-05-25','2026-06-01',5,'active',NULL),
  ('src-003','INFARMED Portugal Licence Register','cannabis_licence_database','{Portugal}','medium','2026-05-20','2026-05-27',4,'needs_review',NULL),
  ('src-004','Health Canada Cannabis Act Registry','cannabis_licence_database','{Canada}','high','2026-05-28','2026-06-04',12,'active',NULL),
  ('src-005','EU Importers Directory — Medical Cannabis','importer_distributor_list','{Germany,Netherlands,Poland}','medium','2026-05-15','2026-06-15',7,'active',NULL),
  ('src-006','TGA Therapeutic Goods Register','regulator_updates','{Australia}','high','2026-05-22','2026-05-29',3,'active',NULL),
  ('src-007','BioEurope Conference Exhibitor List','conference_exhibitor','{Germany,United Kingdom,Netherlands}','medium','2026-04-10','2026-10-01',6,'paused',NULL),
  ('src-008','Colombia MinSalud Cannabis Export Registry','cannabis_licence_database','{Colombia}','low','2026-05-01','2026-06-01',2,'needs_review',NULL),
  ('src-009','Israeli Medical Cannabis Export Authority','government_notices','{Israel}','medium','2026-05-10','2026-05-24',3,'active',NULL),
  ('src-010','CannabisTech Equipment Surplus Listings','auction_surplus','{Canada,United States}','low','2026-05-26','2026-06-02',4,'active',NULL),
  ('src-011','EU GMP Packaging Supplier Directory','packaging_supplier','{Germany,Netherlands,Portugal}','medium','2026-05-18','2026-06-18',2,'active',NULL),
  ('src-012','MJBizCon LATAM Operator Profiles','conference_exhibitor','{Colombia,Brazil,Mexico}','low','2026-03-15','2026-11-01',5,'paused',NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_signals (id, title, type, stage, source_id, source_name, market, category, confidence, commercial_impact, summary, detected_at, reviewed_at)
VALUES
  ('sig-001','Germany BfArM updates prescription pathway for flower formats','regulatory_change','needs_review','src-001','BfArM Medical Cannabis Registry','Germany','cannabis inventory',82,'high','BfArM has issued updated guidance on flower-format prescriptions, expanding qualifying conditions. Creates immediate demand signal for EU-GMP certified flower supply.','2026-05-26',NULL),
  ('sig-002','UK importer adds Canada as preferred origin country','importer_activity','qualified','src-002','UK Home Office Controlled Medicines','United Kingdom','cannabis inventory',74,'high','A major UK licensed importer has updated procurement preferences to include Canadian-origin product, signalling a sourcing opportunity for Canadian exporters with EU-GMP certification.','2026-05-24','2026-05-25'),
  ('sig-003','Portuguese producer achieves EU-GMP certification','documentation_readiness','converted_to_opportunity','src-003','INFARMED Portugal Licence Register','Portugal','cannabis inventory',91,'high','A mid-sized Portuguese operator has published EU-GMP certification for their outdoor biomass facility. High-priority for buyer/importer matching in Germany and Netherlands.','2026-05-20','2026-05-21'),
  ('sig-004','Decommissioned CO2 extraction line available — Ontario, Canada','equipment_surplus','new','src-010','CannabisTech Equipment Surplus Listings','Canada','equipment',68,'medium','A Canadian producer is liquidating a GMP-grade CO2 extraction line. Equipment qualifies for European deployment. Potential match for EU buyers seeking cost-effective extraction capacity.','2026-05-27',NULL),
  ('sig-005','Netherlands distributor seeking isolate and distillate supply','buyer_demand','qualified','src-005','EU Importers Directory — Medical Cannabis','Netherlands','cannabis inventory',77,'high','A Dutch licensed distributor is actively seeking consistent THC distillate and CBD isolate supply from EU-GMP or equivalent facilities. Minimum 100kg per month.','2026-05-22','2026-05-23'),
  ('sig-006','Australia TGA approves new qualifying condition — chronic pain expanded','regulatory_change','needs_review','src-006','TGA Therapeutic Goods Register','Australia','cannabis inventory',85,'medium','TGA has expanded SAS Category B eligibility to include a broader chronic pain definition. Expected to increase prescription volume by 20-30% across flower and oil formats.','2026-05-22',NULL),
  ('sig-007','Israeli exporter actively seeking EU distribution partner','relationship_opportunity','new','src-009','Israeli Medical Cannabis Export Authority','Israel','cannabis inventory',65,'medium','A licensed Israeli medical cannabis exporter has publicly noted intent to establish EU distribution agreements. EU-GMP facility, COAs available. Target: Germany, Netherlands.','2026-05-25',NULL),
  ('sig-008','Colombia biomass pricing drop — large volume available Q3','pricing_availability','needs_review','src-008','Colombia MinSalud Cannabis Export Registry','Colombia','cannabis inventory',58,'medium','Multiple Colombian GACP-certified biomass producers are reporting Q3 inventory surplus. Pricing has dropped 15% below market. GACP documentation available but EU-GMP extraction needed.','2026-05-19',NULL),
  ('sig-009','New BioEurope exhibitor specialising in EU-GMP packaging for medical cannabis','new_product_category','archived','src-007','BioEurope Conference Exhibitor List','Germany','packaging',72,'low','A BioEurope exhibitor specialises in pharmaceutical-grade cannabis packaging compliant with EU GMP Annex 16. Potential supplier for EU operators seeking compliant primary packaging.','2026-04-10','2026-04-12'),
  ('sig-010','Polish pharmacy operator group expanding medical cannabis formulary','distributor_activity','qualified','src-005','EU Importers Directory — Medical Cannabis','Poland','cannabis inventory',71,'medium','A Polish pharmacy group (40+ locations) is expanding its medical cannabis formulary to include additional flower strains and oil formats. Sourcing outreach expected in Q3.','2026-05-16','2026-05-18'),
  ('sig-011','Canadian LP achieves EU-GMP certification for dried flower export','documentation_readiness','needs_review','src-004','Health Canada Cannabis Act Registry','Canada','cannabis inventory',88,'high','A mid-sized Canadian LP has achieved EU-GMP certification for their dried flower production facility. High demand signal for European buyers.','2026-05-27',NULL),
  ('sig-012','UK buyer demand for high-CBD oil — consistent monthly supply','buyer_demand','new','src-002','UK Home Office Controlled Medicines','United Kingdom','cannabis inventory',69,'medium','UK licensed operator seeking consistent high-CBD oil supply from EU-adjacent source. Minimum 5L/month pharmaceutical-grade.','2026-05-28',NULL),
  ('sig-013','Portugal genetics facility expanding seed export capacity','facility_expansion','new','src-003','INFARMED Portugal Licence Register','Portugal','genetics',62,'low','A Portuguese licensed genetics operation is expanding certified seed export capacity. Phytosanitary certification update expected Q2 2026.','2026-05-24',NULL),
  ('sig-014','EU GMP logistics provider adds cold-chain cannabis transport service','new_product_category','needs_review','src-011','EU GMP Packaging Supplier Directory','Germany','services',73,'medium','A European logistics company has added a dedicated temperature-controlled cannabis transport service with GDP certification. Covers Germany-Netherlands-Portugal route.','2026-05-21',NULL),
  ('sig-015','Colombian distressed asset — extraction facility for sale','distressed_asset','new','src-008','Colombia MinSalud Cannabis Export Registry','Colombia','equipment',55,'medium','A Colombian extraction operator is selling a complete ethanol extraction and distillation facility. GACP-certified biomass feedstock also available. Early-stage signal.','2026-05-26',NULL),
  ('sig-016','Australia supply gap — indoor-grown high-THC flower','market_entry_opportunity','qualified','src-006','TGA Therapeutic Goods Register','Australia','cannabis inventory',79,'high','TGA prescription data indicates consistent supply shortage for indoor-grown high-THC flower formats (>25% THC). Canadian and Portuguese operators with qualifying products have a near-term entry opportunity.','2026-05-20','2026-05-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_counterparties (id, name, role, markets, categories, needs_profile, supply_profile, interaction_count, last_interaction, introduction_count, documentation_status, notes)
VALUES
  ('rm-001','Rheingold Medical GmbH','importer','{Germany}','{cannabis inventory}','EU-GMP flower and oil, THC >18%, consistent monthly supply, COA mandatory',NULL,4,'2026-05-10',1,'partial','Prefers Canadian and Portuguese origin. Requires full COA package before any review.'),
  ('rm-002','CannaLeaf Exports Ltd','seller','{Canada}','{cannabis inventory}',NULL,'EU-GMP certified dried flower, 3 strains, 200kg/month available',6,'2026-05-20',2,'complete','Strong documentation package. Actively seeking EU distribution.'),
  ('rm-003','PharmaDist Netherlands BV','distributor','{Netherlands,Germany,Poland}','{cannabis inventory,services}','Consistent oil and isolate, pharmaceutical-grade, EU-GMP required',NULL,3,'2026-05-15',1,'partial',NULL),
  ('rm-004','GreenMed Portugal SA','seller','{Portugal}','{cannabis inventory,genetics}',NULL,'GACP biomass, EU-GMP oil, seed genetics. Export-ready Q2 2026.',2,'2026-05-01',0,'partial','Recently EU-GMP certified. First contact for EU buyer introductions.'),
  ('rm-005','UK MedAccess Ltd','importer','{United Kingdom}','{cannabis inventory}','SAS Category B qualifying products, high-CBD oil, consistent supply chain',NULL,5,'2026-05-18',2,'complete',NULL),
  ('rm-006','CanPack EU Solutions','packaging_supplier','{Germany,Netherlands,Portugal}','{packaging}',NULL,'EU GMP Annex 16 compliant primary packaging for medical cannabis',2,'2026-04-20',0,'complete',NULL),
  ('rm-007','Tel Aviv Medical Exports','seller','{Israel}','{cannabis inventory}',NULL,'EU-GMP flower and extracts, COA available, targeting Germany and Netherlands',1,'2026-05-25',0,'partial','Early relationship. Needs import partner introduction.'),
  ('rm-008','EuroCanna Compliance GmbH','consultant','{Germany,Austria,Switzerland}','{services}',NULL,NULL,8,'2026-05-22',5,'complete','High-value advisor. Broad network across German medical market.'),
  ('rm-009','BioLatam Exports','seller','{Colombia,Brazil}','{cannabis inventory}',NULL,'GACP biomass large volume, competitive pricing, seeking EU extraction partners',2,'2026-05-05',0,'missing','Needs EU-GMP extraction partner before EU market access.'),
  ('rm-010','GreenPath Logistics EU','logistics_provider','{Germany,Netherlands,Portugal}','{services}',NULL,NULL,3,'2026-05-21',1,'complete',NULL),
  ('rm-011','Australian MedGreen Imports','buyer','{Australia}','{cannabis inventory}','Indoor high-THC flower, TGA-registered, consistent supply, 50kg+/month',NULL,2,'2026-05-22',0,'partial',NULL),
  ('rm-012','Nordic Pharma Distributors','distributor','{Denmark,Sweden,Norway}','{cannabis inventory}','Medical-grade oil and flower, EU-GMP, pharmacy distribution qualified',NULL,1,'2026-04-15',0,'missing','Early stage. Explore pathway requirements for Nordic markets.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_scoring_records (id, counterparty_id, counterparty_name, counterparty_role, fit_score, readiness_score, trust_score, routing_priority, follow_up_priority, introduction_priority, market_access_relevance, scored_at, score_drivers)
VALUES
  ('score-001','rm-001','Rheingold Medical GmbH','importer',88,72,79,'high','soon','high','{Germany,"EU medical"}','2026-05-25','{Strong market position,Active procurement,Partial docs — COA gap}'),
  ('score-002','rm-002','CannaLeaf Exports Ltd','seller',91,95,85,'high','urgent','high','{EU medical,Germany,UK}','2026-05-26','{Complete documentation,EU-GMP certified,Multiple successful interactions}'),
  ('score-003','rm-003','PharmaDist Netherlands BV','distributor',82,68,74,'high','soon','medium','{Netherlands,Germany,Poland}','2026-05-24','{Multi-market reach,Partial docs,Active demand signal}'),
  ('score-004','rm-004','GreenMed Portugal SA','seller',76,65,62,'medium','soon','medium','{Portugal,EU export}','2026-05-20','{Recently certified,Low interaction count,Strong potential}'),
  ('score-005','rm-005','UK MedAccess Ltd','importer',87,88,83,'high','soon','high','{United Kingdom,EU adjacent}','2026-05-25','{Complete documentation,Active import pipeline,Consistent responsiveness}'),
  ('score-006','rm-007','Tel Aviv Medical Exports','seller',64,58,51,'medium','when_ready','medium','{Israel,EU medical}','2026-05-26','{Early relationship,Partial docs,Needs import partner}'),
  ('score-007','rm-008','EuroCanna Compliance GmbH','consultant',94,96,92,'high','soon','high','{Germany,Austria,Switzerland}','2026-05-27','{Deep network,High intro success rate,Complete docs}'),
  ('score-008','rm-009','BioLatam Exports','seller',52,35,44,'low','when_ready','not_ready','{Colombia,LATAM}','2026-05-20','{Missing EU-GMP,No extraction partner,Large supply potential}'),
  ('score-009','rm-010','GreenPath Logistics EU','logistics_provider',79,85,77,'medium','when_ready','medium','{Germany,Netherlands,Portugal}','2026-05-22','{GDP certified,Multi-market coverage,One confirmed introduction}'),
  ('score-010','rm-011','Australian MedGreen Imports','buyer',74,66,68,'medium','soon','medium','{Australia}','2026-05-23','{Active procurement,Partial docs,Market supply gap}'),
  ('score-011','rm-006','CanPack EU Solutions','packaging_supplier',70,88,72,'medium','when_ready','low','{Germany,Netherlands}','2026-05-21','{GMP compliant product,Low interaction frequency,Niche fit}'),
  ('score-012','rm-012','Nordic Pharma Distributors','distributor',58,42,45,'low','dormant','not_ready','{Denmark,Sweden,Norway}','2026-04-16','{Single interaction,Missing docs,Nordic pathway complexity}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_agent_tasks (id, queue, title, object_type, object_label, priority, suggested_action, rationale, status, agent_label, next_action, created_at)
VALUES
  ('aq-001','buyer_seller_matcher','Match CannaLeaf Exports to Rheingold Medical — EU-GMP flower','counterparty_pair','CannaLeaf x Rheingold','urgent','Prepare intro brief — all documentation complete, fit score 88+','CannaLeaf EU-GMP certified flower matches Rheingold active procurement. Both have history with Harbourview.','pending','Buyer/Seller Matcher','Draft intro packet','2026-05-27 00:00:00+00'),
  ('aq-002','signal_analyst','Review BfArM flower pathway update signal','signal','sig-001','high','Assess commercial impact for active German importer relationships','Regulatory change creates immediate demand uplift. Action window: 2 weeks.','in_progress','Signal Analyst','Update Rheingold brief with signal context','2026-05-26 00:00:00+00'),
  ('aq-003','opportunity_qualifier','Qualify Portuguese EU-GMP certification signal','signal','sig-003','high','Convert to opportunity — match to active Netherlands distributor demand','Signal already at converted_to_opportunity stage. Create formal opportunity record.','pending','Opportunity Qualifier','Create opportunity from sig-003 + rm-003','2026-05-21 00:00:00+00'),
  ('aq-004','document_reviewer','Request missing COA package from Rheingold Medical','counterparty','rm-001','high','Send COA checklist request — COA, stability data, spec sheet','rm-001 documentation status partial. COA gap blocking introduction.','pending','Document Reviewer','Draft document request','2026-05-25 00:00:00+00'),
  ('aq-005','source_watcher','Review INFARMED needs_review status — Portugal source','source','src-003','medium','Validate source reliability — check access permissions before next crawl cycle','src-003 marked needs_review. Signal yield declining.','pending','Source Watcher','Validate and update source status','2026-05-24 00:00:00+00'),
  ('aq-006','follow_up_assistant','Follow up with GreenMed Portugal — first EU buyer introduction','counterparty','rm-004','medium','Warm introduction to Netherlands distributor pending documentation review','GreenMed recently EU-GMP certified. 0 introductions to date. Ready for first match.','pending','Follow-Up Assistant','Draft GreenMed follow-up message','2026-05-22 00:00:00+00'),
  ('aq-007','importer_distributor_router','Route Israeli exporter to German importer pathway','signal','sig-007','medium','Identify qualifying German importer for Tel Aviv Medical Exports introduction','Israeli exporter actively seeking EU distribution. EU-GMP facility. Rheingold may qualify.','pending','Importer/Distributor Router','Assess Rheingold fit for Israeli product','2026-05-26 00:00:00+00'),
  ('aq-008','public_card_generator','Generate public supply card — CannaLeaf EU-GMP flower','counterparty','rm-002','medium','Create anonymised marketplace supply listing from rm-002 supply profile','CannaLeaf documentation complete. Public card generation ready.','pending','Public Card Generator','Draft marketplace card from rm-002 profile','2026-05-27 00:00:00+00'),
  ('aq-009','signal_analyst','Assess Australia supply gap signal — high-THC flower','signal','sig-016','high','Identify Canadian or Portuguese sellers qualified for TGA registration route','sig-016 qualified status. Clear supply gap. 2 active sellers may qualify.','in_progress','Signal Analyst','Match sig-016 to rm-002 and rm-004','2026-05-22 00:00:00+00'),
  ('aq-010','deal_flow_copilot','Review stalled Colombian biomass signal','signal','sig-008','low','Assess EU-GMP extraction partner options for Colombian biomass conversion','sig-008 needs_review. Colombian supply available but EU-GMP gap limits routing options.','deferred','Deal Flow Copilot','Identify EU extraction partner candidates','2026-05-21 00:00:00+00'),
  ('aq-011','opportunity_qualifier','Qualify Canadian LP EU-GMP certification signal','signal','sig-011','high','Convert to opportunity — match to active UK and German importer demand','sig-011 needs_review. High confidence (88). Match to rm-001 and rm-005.','pending','Opportunity Qualifier','Create opportunity from sig-011','2026-05-27 00:00:00+00'),
  ('aq-012','document_reviewer','Chase GreenMed Portugal documentation completion','counterparty','rm-004','medium','Request COA and spec sheet — partial docs blocking first introduction','rm-004 partial documentation status. Newly EU-GMP certified. High potential.','pending','Document Reviewer','Send documentation checklist to rm-004','2026-05-20 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_evidence_vault (id, title, type, linked_counterparty_name, linked_market, review_status, tags, notes, added_at)
VALUES
  ('ev-001','CannaLeaf Exports — EU-GMP Certificate of Compliance','eu_gmp_document','CannaLeaf Exports Ltd','Canada','reviewed','{eu-gmp,canada,flower,critical}',NULL,'2026-05-10'),
  ('ev-002','Rheingold Medical — COA Request Checklist','commercial_note','Rheingold Medical GmbH','Germany','needs_action','{germany,importer,coa-gap,urgent}','COA missing for 2 of 3 requested strains.','2026-05-20'),
  ('ev-003','GreenMed Portugal — INFARMED Licence Certificate','licence_document','GreenMed Portugal SA','Portugal','reviewed','{portugal,licence,eu-gmp,seller}',NULL,'2026-05-02'),
  ('ev-004','BfArM Regulatory Update — Flower Pathway Guidance May 2026','regulator_notice',NULL,'Germany','needs_action','{germany,regulatory,urgent,flower}',NULL,'2026-05-26'),
  ('ev-005','EuroCanna Compliance — Market Access Advisory Note Q2 2026','meeting_note','EuroCanna Compliance GmbH','Germany','reviewed','{germany,advisor,market-access}',NULL,'2026-05-22'),
  ('ev-006','CannaLeaf Exports — Product Specification Sheet (3 strains)','spec_sheet','CannaLeaf Exports Ltd','Canada','reviewed','{canada,spec-sheet,flower,complete}',NULL,'2026-05-12'),
  ('ev-007','Netherlands Distributor — Isolate and Distillate Demand Brief','commercial_note','PharmaDist Netherlands BV','Netherlands','reviewed','{netherlands,demand,isolate,distillate}',NULL,'2026-05-23'),
  ('ev-008','Australian MedGreen — TGA Import Requirements Summary','import_document','Australian MedGreen Imports','Australia','pending','{australia,tga,import,flower}',NULL,'2026-05-22'),
  ('ev-009','Colombian Biomass — GACP Certificate Package','gacp_document','BioLatam Exports','Colombia','pending','{colombia,gacp,biomass}','EU-GMP extraction still needed before EU routing.','2026-05-05'),
  ('ev-010','UK MedAccess — SAS Category B Product Requirements','commercial_note','UK MedAccess Ltd','United Kingdom','reviewed','{uk,sas,requirements,complete}',NULL,'2026-05-19'),
  ('ev-011','GreenPath Logistics — GDP Certification Summary','licence_document','GreenPath Logistics EU','Germany','reviewed','{logistics,gdp,germany,netherlands}',NULL,'2026-05-21'),
  ('ev-012','Tel Aviv Medical Exports — EU-GMP Facility Overview','eu_gmp_document','Tel Aviv Medical Exports','Israel','pending','{israel,eu-gmp,seller,pending-review}',NULL,'2026-05-25')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
VALUES
  ('ge-001','market','Germany',NULL,NULL,12,8,'2026-05-27'),
  ('ge-002','market','United Kingdom',NULL,NULL,8,5,'2026-05-28'),
  ('ge-003','market','Portugal',NULL,NULL,6,4,'2026-05-24'),
  ('ge-004','market','Canada',NULL,NULL,9,6,'2026-05-28'),
  ('ge-005','market','Australia',NULL,NULL,5,3,'2026-05-22'),
  ('ge-006','market','Netherlands',NULL,NULL,7,4,'2026-05-25'),
  ('ge-007','market','Colombia',NULL,NULL,4,3,'2026-05-26'),
  ('ge-008','importer','Rheingold Medical GmbH','Germany',NULL,5,2,'2026-05-25'),
  ('ge-009','seller','CannaLeaf Exports Ltd','Canada',NULL,6,1,'2026-05-26'),
  ('ge-010','distributor','PharmaDist Netherlands BV','Netherlands',NULL,4,2,'2026-05-23'),
  ('ge-011','seller','GreenMed Portugal SA','Portugal',NULL,3,2,'2026-05-20'),
  ('ge-012','importer','UK MedAccess Ltd','United Kingdom',NULL,5,1,'2026-05-25'),
  ('ge-013','pathway','EU-GMP Medical Import — Germany','Germany',NULL,8,4,'2026-05-27'),
  ('ge-014','pathway','SAS Category B — United Kingdom','United Kingdom',NULL,5,2,'2026-05-25'),
  ('ge-015','pathway','TGA Special Access — Australia','Australia',NULL,4,3,'2026-05-22'),
  ('ge-016','category','Cannabis Inventory — Flower',NULL,'Cannabis Inventory',14,9,NULL),
  ('ge-017','category','Cannabis Inventory — Extracts / Oil',NULL,'Cannabis Inventory',8,4,NULL),
  ('ge-018','category','Equipment',NULL,'Equipment',5,2,NULL),
  ('ge-019','source','BfArM Medical Cannabis Registry','Germany',NULL,3,8,'2026-05-27'),
  ('ge-020','consultant','EuroCanna Compliance GmbH','Germany',NULL,7,0,'2026-05-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_graph_edges (id, type, from_label, to_label, strength, evidenced, created_at)
VALUES
  ('edge-001','imports_to','CannaLeaf Exports Ltd','Germany','strong',true,'2026-05-10'),
  ('edge-002','active_in','Rheingold Medical GmbH','Germany','strong',true,'2026-04-01'),
  ('edge-003','matched_to','CannaLeaf Exports Ltd','Rheingold Medical GmbH','strong',true,'2026-05-20'),
  ('edge-004','belongs_to_pathway','CannaLeaf Exports Ltd','EU-GMP Medical Import — Germany','strong',true,'2026-05-10'),
  ('edge-005','requires_document','EU-GMP Medical Import — Germany','Cannabis Inventory — Flower','strong',true,'2026-04-01'),
  ('edge-006','generated_signal','BfArM Medical Cannabis Registry','Germany','strong',true,'2026-05-26'),
  ('edge-007','active_in','GreenMed Portugal SA','Portugal','medium',true,'2026-05-02'),
  ('edge-008','matched_to','GreenMed Portugal SA','PharmaDist Netherlands BV','medium',false,'2026-05-22'),
  ('edge-009','distributes_in','PharmaDist Netherlands BV','Netherlands','strong',true,'2026-04-15'),
  ('edge-010','imports_to','UK MedAccess Ltd','United Kingdom','strong',true,'2026-03-20'),
  ('edge-011','belongs_to_pathway','UK MedAccess Ltd','SAS Category B — United Kingdom','strong',true,'2026-03-20'),
  ('edge-012','relevant_to_market','Cannabis Inventory — Flower','Germany','strong',true,'2026-01-01'),
  ('edge-013','relevant_to_market','Cannabis Inventory — Extracts / Oil','Netherlands','strong',true,'2026-01-01'),
  ('edge-014','converted_to_opportunity','GreenMed Portugal SA','EU-GMP Medical Import — Germany','medium',true,'2026-05-21'),
  ('edge-015','scored_for','EuroCanna Compliance GmbH','Germany','strong',true,'2026-05-27'),
  ('edge-016','exports_from','CannaLeaf Exports Ltd','Canada','strong',true,'2026-04-01'),
  ('edge-017','active_in','Australian MedGreen Imports','Australia','medium',true,'2026-05-22'),
  ('edge-018','belongs_to_pathway','Australian MedGreen Imports','TGA Special Access — Australia','medium',true,'2026-05-22'),
  ('edge-019','matched_to','CannaLeaf Exports Ltd','Australian MedGreen Imports','medium',false,'2026-05-23'),
  ('edge-020','exports_from','GreenMed Portugal SA','Portugal','medium',true,'2026-05-02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_feedback_events (id, outcome_type, counterparty_name, market, category, score_impact, routing_impact, notes, logged_at)
VALUES
  ('fb-001','intro_sent','CannaLeaf Exports x Rheingold Medical','Germany','cannabis inventory','positive','Increased Rheingold routing priority; CannaLeaf intro count +1',NULL,'2026-05-18'),
  ('fb-002','docs_received','UK MedAccess Ltd','United Kingdom','cannabis inventory','positive','UK MedAccess documentation status upgraded to complete; readiness score +12',NULL,'2026-05-15'),
  ('fb-003','buyer_passed','PharmaDist Netherlands BV','Netherlands','cannabis inventory','negative','Temporary fit score reduction; route blocked pending alternative supply review','Passed on Colombian biomass — EU-GMP gap.','2026-05-12'),
  ('fb-004','qualified','GreenMed Portugal SA','Portugal','cannabis inventory','positive','GreenMed promoted to medium routing priority; first EU intro queue',NULL,'2026-05-21'),
  ('fb-005','unresponsive','Nordic Pharma Distributors','Denmark','cannabis inventory','negative','Nordic follow-up priority set to dormant; pathway review deferred',NULL,'2026-04-28'),
  ('fb-006','docs_requested','Rheingold Medical GmbH','Germany','cannabis inventory','neutral','COA request sent; Rheingold readiness score holds pending receipt',NULL,'2026-05-20'),
  ('fb-007','in_discussion','CannaLeaf Exports x UK MedAccess','United Kingdom','cannabis inventory','positive','Both parties introduction priority increased; deal room candidate',NULL,'2026-05-22'),
  ('fb-008','valuable_relationship','EuroCanna Compliance GmbH','Germany','services','positive','EuroCanna trust score upgraded to 92; introduction priority maintained high',NULL,'2026-05-23'),
  ('fb-009','weak_fit','BioLatam Exports','Colombia','cannabis inventory','negative','BioLatam routing priority reduced to low; EU-GMP gap blocks all EU routes',NULL,'2026-05-20'),
  ('fb-010','reviewed','Australian MedGreen Imports','Australia','cannabis inventory','neutral','TGA requirements reviewed; supply matching queued for Q3',NULL,'2026-05-22'),
  ('fb-011','needs_future_follow_up','Tel Aviv Medical Exports','Israel','cannabis inventory','neutral','Introduction deferred pending import partner identification; watch status active',NULL,'2026-05-26'),
  ('fb-012','converted_to_opportunity','GreenMed Portugal x PharmaDist Netherlands','Netherlands','cannabis inventory','positive','Formal opportunity created; doc review pending before intro',NULL,'2026-05-21')
ON CONFLICT (id) DO NOTHING;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260531000000','intelligence_automation_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260531000000_intelligence_automation_tables.sql

-- RECOVERY BEGIN 20260601000000_marketplace_supply_engine.sql
-- Harbourview Marketplace Supply Engine V1
-- Additive marketplace spine migration. Does not publish records.

begin;

create extension if not exists pgcrypto;

alter table public.listings
  add column if not exists marketplace_section text,
  add column if not exists public_visibility boolean not null default false,
  add column if not exists product_type text,
  add column if not exists region text,
  add column if not exists condition text,
  add column if not exists price_amount numeric,
  add column if not exists price_currency text not null default 'USD',
  add column if not exists price_display text,
  add column if not exists seller_type text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists high_level_specs jsonb not null default '{}'::jsonb,
  add column if not exists private_specs jsonb not null default '{}'::jsonb,
  add column if not exists public_summary text,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists seller_authorization_status text not null default 'unknown',
  add column if not exists monetization_path text not null default 'manual_review',
  add column if not exists review_status text not null default 'draft',
  add column if not exists source_candidate_id uuid null,
  add column if not exists expires_at timestamptz null,
  add column if not exists archived_at timestamptz null,
  add column if not exists created_by uuid null references auth.users(id) on delete set null,
  add column if not exists updated_by uuid null references auth.users(id) on delete set null;

create index if not exists listings_marketplace_public_idx
  on public.listings (public_visibility, status, is_featured, created_at desc)
  where archived_at is null;

create or replace view public.marketplace_public_listings_v1
with (security_invoker = true)
as
select
  id,
  slug,
  title,
  coalesce(public_summary, summary, description) as description,
  category,
  subcategory,
  coalesce(marketplace_section, category) as marketplace_section,
  product_type,
  coalesce(region, location_region, location_country, 'global') as region,
  condition,
  location_country,
  location_region,
  price_amount,
  price_currency,
  price_display,
  coalesce(seller_type, 'controlled_review') as seller_type,
  is_featured,
  high_level_specs,
  created_at
from public.listings
-- 'published' dropped 2026-08-05. public.listings.status carries production's
-- listing_status enum from 20260528033001, and that enum has exactly four
-- labels -- pending_review, approved, rejected, archived. 'published' is not
-- one of them, so the original predicate fails against the converted column:
--   invalid input value for enum listing_status: "published"
-- The two are equivalent after the conversion, which maps any legacy
-- 'published' row to 'approved' (the same publicly-visible state), so this
-- selects exactly the same rows.
--
-- Nothing is contradicted by narrowing it: this version is recorded in
-- supabase_migrations.schema_migrations with a null statements array, so
-- production captured no body for it, and the only other repository migration
-- that filtered listings on 'published' is this one.
where status = 'approved'
  and public_visibility = true
  and archived_at is null
  and (expires_at is null or expires_at > now());

revoke all on public.marketplace_public_listings_v1 from anon, authenticated;
grant select on public.marketplace_public_listings_v1 to anon, authenticated;

alter table public.source_registry
  add column if not exists source_owner text,
  add column if not exists category_keys text[] not null default '{}',
  add column if not exists allowed_record_types text[] not null default '{}',
  add column if not exists geography text,
  add column if not exists reliability_score integer,
  add column if not exists scrape_policy text not null default 'manual_only',
  add column if not exists access_method text not null default 'public_web',
  add column if not exists refresh_cadence text not null default 'monthly',
  add column if not exists last_successful_capture_at timestamptz,
  add column if not exists last_failed_capture_at timestamptz,
  add column if not exists source_status text not null default 'active',
  add column if not exists source_notes_private text;

alter table public.marketplace_candidates
  add column if not exists category_key text,
  add column if not exists subcategory_key text,
  add column if not exists listing_type_key text,
  add column if not exists record_type text,
  add column if not exists seller_name_private text,
  add column if not exists seller_url_private text,
  add column if not exists seller_contact_private text,
  add column if not exists seller_authorization_status text not null default 'unknown',
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists publication_status text not null default 'not_publishable',
  add column if not exists monetization_path text not null default 'manual_review',
  add column if not exists asking_price_text text,
  add column if not exists quantity_text text,
  add column if not exists private_specs jsonb not null default '{}'::jsonb,
  add column if not exists high_level_specs jsonb not null default '{}'::jsonb,
  add column if not exists required_documents jsonb not null default '[]'::jsonb,
  add column if not exists evidence_summary_private text,
  add column if not exists public_summary_draft text,
  add column if not exists public_payload jsonb not null default '{}'::jsonb,
  add column if not exists review_due_at timestamptz,
  add column if not exists expires_at timestamptz;

alter table public.marketplace_candidates
  drop constraint if exists marketplace_candidates_type_check,
  drop constraint if exists marketplace_candidates_category_check,
  drop constraint if exists marketplace_candidates_subcategory_check,
  drop constraint if exists marketplace_candidates_listing_type_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_category_key_check'
  ) then
    alter table public.marketplace_candidates
      add constraint marketplace_candidates_category_key_check
      check (
        category_key is null or category_key in (
          'consumables','packaging','new_products','used_surplus','cultivation_equipment','processing_equipment','lab_testing','logistics','services','professional_services','distressed_inventory','distressed_businesses','business_opportunities','export_ready','import_demand','cannabis_inventory','genetics','wanted_requests','qualified_access','education'
        )
      ) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.marketplace_candidates'::regclass
      and conname = 'marketplace_candidates_publication_status_check'
  ) then
    alter table public.marketplace_candidates
      add constraint marketplace_candidates_publication_status_check
      check (publication_status in ('not_publishable','draft_public_summary','needs_public_safety_review','approved_public_summary','published','private_only','rejected','archived')) not valid;
  end if;
end $$;

create index if not exists marketplace_candidates_supply_engine_queue_idx
  on public.marketplace_candidates (publication_status, verification_status, created_at desc);

create index if not exists marketplace_candidates_category_key_idx
  on public.marketplace_candidates (category_key, created_at desc);

comment on view public.marketplace_public_listings_v1 is 'Public-safe marketplace listing DTO view. Private seller, source, evidence, provenance, notes, scores and operator fields are intentionally excluded.';
comment on column public.listings.private_specs is 'Private marketplace details. Never expose in public DTOs or public DOM.';
comment on column public.marketplace_candidates.evidence_summary_private is 'Private evidence summary for operator review only.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260601000000','marketplace_supply_engine','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260601000000_marketplace_supply_engine.sql

-- RECOVERY BEGIN 20260601000001_user_dashboard_preferences.sql
begin;

-- DASH-PREF-001: User dashboard preferences for cross-device persistence.
-- Stores country + role selection so the universal dashboard restores on next visit.

create table if not exists public.user_dashboard_preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  country_iso2 text,
  role_id      text,
  heatmap_layer text default 'marketplace_activity',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id)
);

-- RLS
alter table public.user_dashboard_preferences enable row level security;

drop policy if exists "Users can read their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can read their own dashboard preferences"
  on public.user_dashboard_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can insert their own dashboard preferences"
  on public.user_dashboard_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own dashboard preferences" on public.user_dashboard_preferences;
create policy "Users can delete their own dashboard preferences"
  on public.user_dashboard_preferences for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_dashboard_preferences_updated_at on public.user_dashboard_preferences;
create trigger user_dashboard_preferences_updated_at
  before update on public.user_dashboard_preferences
  for each row execute function public.set_updated_at();

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260601000001','user_dashboard_preferences','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260601000001_user_dashboard_preferences.sql

-- RECOVERY BEGIN 20260601212212_implement_is_signal_admin.sql
-- Implements is_signal_admin() which was a placeholder (always returned false).
-- Now checks user_roles table which was created in 20260313000000_relationship_intelligence_v1.sql

CREATE OR REPLACE FUNCTION is_signal_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'operator')
  );
$$;

COMMENT ON FUNCTION is_signal_admin() IS
  'Returns true if the authenticated user has admin or operator role. Used in signal engine RLS policies.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260601212212','implement_is_signal_admin','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260601212212_implement_is_signal_admin.sql

-- RECOVERY BEGIN 20260603000000_harden_signal_engine_security.sql
-- Harbourview Signal Engine security hardening.
-- Scope: signal-engine tables/functions only. Do not touch marketplace objects here.
-- Control reference: docs/control/signal-engine-hardening/EXECUTION_PLAN.md

begin;

create schema if not exists private;

comment on schema private is
  'Non-API schema for Harbourview database helper functions that must not be exposed through PostgREST RPC.';

revoke all on schema private from public;
revoke all on schema private from anon;

create or replace function private.is_signal_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('admin', 'operator')
  );
$$;

comment on function private.is_signal_admin() is
  'Signal Engine RLS helper. Uses public.user_roles and lives outside exposed API schemas to avoid RPC exposure.';

revoke all on function private.is_signal_admin() from public;
revoke all on function private.is_signal_admin() from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_signal_admin() to authenticated;

-- Remove exposed public-schema helper functions after replacing dependent policies.
-- These functions were RLS internals, not public RPC contract.
revoke all on function public.is_signal_admin() from public;
revoke all on function public.is_signal_admin() from anon;
revoke all on function public.is_signal_admin() from authenticated;

revoke all on function public.is_service_role() from public;
revoke all on function public.is_service_role() from anon;
revoke all on function public.is_service_role() from authenticated;

-- Ensure every Signal Engine table is schema-qualified, RLS-enabled, and policy-clean.
alter table public.source_documents force row level security;
alter table public.source_chunks force row level security;
alter table public.signal_duplicate_groups force row level security;
alter table public.signal_candidates force row level security;
alter table public.signal_evidence force row level security;
alter table public.signal_review_events force row level security;
alter table public.signal_jobs force row level security;
alter table public.signal_risk_flags force row level security;
alter table public.model_prompt_versions force row level security;
alter table public.model_call_logs force row level security;
alter table public.entities force row level security;
alter table public.signal_entity_mentions force row level security;
alter table public.signal_conversions force row level security;
alter table public.signal_processing_errors force row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'source_documents', 'source_chunks', 'signal_duplicate_groups',
    'signal_candidates', 'signal_evidence', 'signal_review_events',
    'signal_jobs', 'signal_risk_flags', 'model_prompt_versions',
    'model_call_logs', 'entities', 'signal_entity_mentions',
    'signal_conversions', 'signal_processing_errors'
  ]) loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated
       using (private.is_signal_admin())
       with check (private.is_signal_admin())',
      t
    );
  end loop;
end $$;

-- Keep the canonical V1 service-role write surface limited to processing tables.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'signal_jobs', 'model_call_logs', 'signal_candidates',
    'signal_evidence', 'signal_processing_errors', 'source_chunks'
  ]) loop
    execute format('drop policy if exists service_role_write on public.%I', t);
    execute format('drop policy if exists service_role_update on public.%I', t);
    execute format(
      'create policy service_role_write on public.%I for insert to service_role with check (true)',
      t
    );
    execute format(
      'create policy service_role_update on public.%I for update to service_role using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Drop legacy exposed helpers once no signal-engine policy depends on them.
drop function if exists public.is_signal_admin();
drop function if exists public.is_service_role();

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260603000000','harden_signal_engine_security','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260603000000_harden_signal_engine_security.sql

-- RECOVERY BEGIN 20260604000000_countries_public_table_v1.sql
-- Deterministic replay-safe countries foundation. Data seeding remains in 20260609000000.
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  country_name text not null,
  country_slug text not null,
  iso_alpha2 text not null,
  iso_alpha3 text,
  region text,
  subregion text,
  market_access_status text not null default 'unknown',
  medical_status text not null default 'unknown',
  adult_use_status text not null default 'unknown',
  import_status text not null default 'unknown',
  export_status text not null default 'unknown',
  signals_status text not null default 'unknown',
  opportunity_status text not null default 'unknown',
  opportunity_score integer not null default 0,
  regulator_label text,
  lat double precision,
  lng double precision,
  public_summary text,
  data_completeness text not null default 'stub',
  last_updated_label text,
  opportunity_categories text[],
  trade_roles text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.countries
  add column if not exists opportunity_score integer not null default 0;

update public.countries set opportunity_score = case market_access_status::text
  when 'open' then 95
  when 'active' then 82
  when 'regulated' then 64
  when 'emerging' then 52
  when 'limited' then 36
  when 'restricted' then 22
  when 'unknown' then 10
  else 10
end
where opportunity_score = 0;

create or replace function public.sync_opportunity_score()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.opportunity_score := case new.market_access_status::text
    when 'open' then 95
    when 'active' then 82
    when 'regulated' then 64
    when 'emerging' then 52
    when 'limited' then 36
    when 'restricted' then 22
    when 'unknown' then 10
    else 10
  end;
  return new;
end;
$$;

drop trigger if exists sync_opportunity_score_trigger on public.countries;
create trigger sync_opportunity_score_trigger
  before insert or update of market_access_status
  on public.countries
  for each row execute function public.sync_opportunity_score();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260604000000','countries_public_table_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260604000000_countries_public_table_v1.sql

-- RECOVERY BEGIN 20260605000000_marketplace_image_trust_layer.sql
do $$
begin
  create type marketplace_image_class as enum (
    'REAL_ITEM_EVIDENCE',
    'MANUFACTURER_CATALOGUE',
    'HARBOURVIEW_ILLUSTRATIVE',
    'ADMIN_PRIVATE_EVIDENCE'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_role as enum (
    'CARD',
    'HERO',
    'GALLERY',
    'DETAIL',
    'CATEGORY_TILE',
    'SELLER_PROFILE',
    'ADMIN_REVIEW',
    'SOCIAL_PREVIEW',
    'PLACEHOLDER'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_review_status as enum (
    'UPLOADED',
    'PROCESSING',
    'NEEDS_REVIEW',
    'APPROVED_PUBLIC',
    'APPROVED_PRIVATE_ONLY',
    'REJECTED',
    'REPLACED'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_rights_status as enum (
    'SELLER_PROVIDED',
    'MANUFACTURER_PERMITTED',
    'HARBOURVIEW_CREATED',
    'PUBLIC_SOURCE_REVIEWED',
    'UNKNOWN'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type marketplace_image_source_type as enum (
    'SELLER_UPLOAD',
    'SUPPLIER_UPLOAD',
    'MANUFACTURER_CATALOGUE',
    'HARBOURVIEW_CREATED',
    'PUBLIC_SOURCE',
    'ADMIN_UPLOAD',
    'UNKNOWN'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.marketplace_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  image_class marketplace_image_class not null,
  image_role marketplace_image_role not null default 'GALLERY',
  review_status marketplace_image_review_status not null default 'UPLOADED',
  rights_status marketplace_image_rights_status not null default 'UNKNOWN',
  source_type marketplace_image_source_type not null default 'UNKNOWN',
  source_name text,
  source_url text,
  source_reference text,
  original_storage_bucket text,
  original_storage_path text,
  edited_storage_bucket text,
  edited_storage_path text,
  public_storage_bucket text,
  public_storage_path text,
  public_url text,
  thumbnail_url text,
  hero_url text,
  gallery_url text,
  social_url text,
  alt_text text,
  caption text,
  is_evidence_image boolean not null default false,
  is_illustrative boolean not null default false,
  adobe_edit_summary text,
  content_credentials_status text,
  content_credentials_reference text,
  width integer,
  height integer,
  file_mime_type text,
  file_size_bytes bigint,
  checksum_sha256 text,
  rejection_reason text,
  replaced_by_image_id uuid references public.marketplace_item_images(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.marketplace_item_images is 'Harbourview marketplace image trust layer. item_id maps to the published marketplace listing/item UUID exposed by marketplace_public_listings_v1; no speculative FK is added until the canonical backing table is verified.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_public_requires_approved'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_public_requires_approved
      check (public_url is null or review_status = 'APPROVED_PUBLIC');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_unknown_rights_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_unknown_rights_not_public
      check (rights_status <> 'UNKNOWN' or public_url is null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_admin_private_not_public'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_admin_private_not_public
      check (image_class <> 'ADMIN_PRIVATE_EVIDENCE' or public_url is null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_illustrative_flag_consistent'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_illustrative_flag_consistent
      check ((image_class = 'HARBOURVIEW_ILLUSTRATIVE' and is_illustrative = true) or image_class <> 'HARBOURVIEW_ILLUSTRATIVE');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_evidence_flag_consistent'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_evidence_flag_consistent
      check ((image_class = 'REAL_ITEM_EVIDENCE' and is_evidence_image = true) or image_class <> 'REAL_ITEM_EVIDENCE');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_item_images_adobe_summary_required'
      and conrelid = 'public.marketplace_item_images'::regclass
  ) then
    alter table public.marketplace_item_images
      add constraint marketplace_item_images_adobe_summary_required
      check (edited_storage_path is null or nullif(trim(adobe_edit_summary), '') is not null);
  end if;
end $$;

create index if not exists idx_marketplace_item_images_item_id
  on public.marketplace_item_images(item_id);

create index if not exists idx_marketplace_item_images_review_status
  on public.marketplace_item_images(review_status);

create index if not exists idx_marketplace_item_images_rights_status
  on public.marketplace_item_images(rights_status);

create index if not exists idx_marketplace_item_images_class
  on public.marketplace_item_images(image_class);

create index if not exists idx_marketplace_item_images_public_item
  on public.marketplace_item_images(item_id, image_role)
  where review_status = 'APPROVED_PUBLIC';

create or replace function public.set_marketplace_item_images_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_item_images_updated_at on public.marketplace_item_images;

create trigger trg_marketplace_item_images_updated_at
before update on public.marketplace_item_images
for each row
execute function public.set_marketplace_item_images_updated_at();

create or replace function public.is_harbourview_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  );
$$;

alter table public.marketplace_item_images enable row level security;

insert into storage.buckets (id, name, public)
values
  ('marketplace-item-originals', 'marketplace-item-originals', false),
  ('marketplace-item-working', 'marketplace-item-working', false),
  ('marketplace-item-public', 'marketplace-item-public', true)
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "Public can read approved public marketplace images" on public.marketplace_item_images;
  drop policy if exists "Admins can read all marketplace images" on public.marketplace_item_images;
  drop policy if exists "Admins can insert marketplace images" on public.marketplace_item_images;
  drop policy if exists "Admins can update marketplace images" on public.marketplace_item_images;
  drop policy if exists "Admins can delete marketplace images" on public.marketplace_item_images;

  create policy "Public can read approved public marketplace images"
  on public.marketplace_item_images
  for select
  to anon, authenticated
  using (
    review_status = 'APPROVED_PUBLIC'
    and rights_status <> 'UNKNOWN'
    and image_class <> 'ADMIN_PRIVATE_EVIDENCE'
    and public_url is not null
  );

  create policy "Admins can read all marketplace images"
  on public.marketplace_item_images
  for select
  to authenticated
  using (public.is_harbourview_admin());

  create policy "Admins can insert marketplace images"
  on public.marketplace_item_images
  for insert
  to authenticated
  with check (public.is_harbourview_admin());

  create policy "Admins can update marketplace images"
  on public.marketplace_item_images
  for update
  to authenticated
  using (public.is_harbourview_admin())
  with check (public.is_harbourview_admin());

  create policy "Admins can delete marketplace images"
  on public.marketplace_item_images
  for delete
  to authenticated
  using (public.is_harbourview_admin());
end $$;

drop policy if exists "Admins can upload marketplace originals" on storage.objects;
drop policy if exists "Admins can read marketplace originals" on storage.objects;
drop policy if exists "Admins can update marketplace originals" on storage.objects;
drop policy if exists "Admins can upload marketplace working edits" on storage.objects;
drop policy if exists "Admins can read marketplace working edits" on storage.objects;
drop policy if exists "Admins can update marketplace working edits" on storage.objects;
drop policy if exists "Admins can upload approved public marketplace derivatives" on storage.objects;
drop policy if exists "Admins can update approved public marketplace derivatives" on storage.objects;

create policy "Admins can upload marketplace originals"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can read marketplace originals"
on storage.objects
for select
to authenticated
using (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can update marketplace originals"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-originals' and public.is_harbourview_admin());

create policy "Admins can upload marketplace working edits"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can read marketplace working edits"
on storage.objects
for select
to authenticated
using (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can update marketplace working edits"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-working' and public.is_harbourview_admin());

create policy "Admins can upload approved public marketplace derivatives"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin());

create policy "Admins can update approved public marketplace derivatives"
on storage.objects
for update
to authenticated
using (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin())
with check (bucket_id = 'marketplace-item-public' and public.is_harbourview_admin());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260605000000','marketplace_image_trust_layer','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260605000000_marketplace_image_trust_layer.sql

-- RECOVERY BEGIN 20260606090000_hv_integration_schemas.sql
-- Harbourview Supabase + Airtable integration foundation: schemas, extensions, roles, helpers.
create extension if not exists pgcrypto;
create extension if not exists vector;

create schema if not exists hv_core;
create schema if not exists hv_private;
create schema if not exists hv_public;
create schema if not exists hv_commercial;
create schema if not exists hv_marketplace;
create schema if not exists hv_education;
create schema if not exists hv_sync;
create schema if not exists hv_audit;
create schema if not exists hv_search;

create or replace function hv_core.current_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'hv_role', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'hv_role', ''),
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
    current_user
  );
$$;

create or replace function hv_core.is_operator_or_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select hv_core.current_role() in ('operator', 'admin', 'service_role');
$$;

create or replace function hv_core.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select hv_core.current_role() in ('admin', 'service_role');
$$;

create or replace function hv_core.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606090000','hv_integration_schemas','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606090000_hv_integration_schemas.sql

-- RECOVERY BEGIN 20260606090100_hv_integration_tables.sql
-- Harbourview Supabase + Airtable integration foundation: base tables.
create table if not exists hv_core.app_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  account_id uuid,
  email text,
  display_name text,
  hv_role text not null default 'authenticated' check (hv_role in ('anon','authenticated','buyer','supplier','sponsor','educator','operator','admin','service_role')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  country_name text not null,
  iso_code text,
  region text,
  cannabis_market_status text,
  priority_tier text,
  notes_private text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  unresolved_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.source_types (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  name text not null unique,
  description text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.source_organizations (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  name text not null,
  website_url text,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.sources (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  source_name text not null,
  source_url text,
  normalized_url text,
  dedupe_key text,
  country_text text,
  source_type_text text,
  organization_text text,
  jurisdiction_level text,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  source_type_id uuid references hv_core.source_types(id),
  organization_id uuid references hv_core.source_organizations(id),
  verification_status text not null default 'pending',
  confidence_score numeric,
  commercial_relevance text,
  last_checked date,
  import_batch_id text,
  raw_row_id text,
  raw_source_file text,
  notes_private text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  unresolved_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_core.market_signals (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  jurisdiction_id uuid references hv_core.jurisdictions(id),
  title text not null,
  summary_public text,
  summary_private text,
  signal_type text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_id uuid references hv_core.sources(id),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_private.verification_queue (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  destination_table text not null,
  destination_record_id uuid,
  queue_status text not null default 'pending',
  review_notes_private text,
  operator_comments text,
  sensitivity text not null default 'confidential' check (sensitivity in ('internal','confidential','restricted')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_private.rejected_records (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  source_table text not null,
  rejection_reason text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  operator_notes_private text,
  created_at timestamptz not null default now()
);

create table if not exists hv_private.evidence_items (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique not null,
  source_id uuid references hv_core.sources(id),
  claim_table text,
  claim_record_id uuid,
  evidence_type text,
  evidence_url text,
  evidence_title text,
  evidence_notes_private text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_summary text,
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.companies (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  account_id uuid,
  company_name text not null,
  normalized_website_domain text,
  website_url text,
  country_code text,
  company_type text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.people (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  full_name text not null,
  email text,
  title text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.offers (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  offer_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  title text not null,
  description_public text,
  description_private text,
  category text,
  ready_to_sell text not null default 'NO' check (ready_to_sell in ('YES','NO')),
  public_visibility boolean not null default false,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_commercial.opportunities (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  opportunity_id text unique,
  company_id uuid references hv_commercial.companies(id),
  account_id uuid,
  title text not null,
  summary_public text,
  summary_private text,
  status text not null default 'private_review',
  public_visibility boolean not null default false,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_marketplace.listings (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  account_id uuid,
  company_id uuid references hv_commercial.companies(id),
  title text not null,
  description_public text,
  description_private text,
  category text,
  price_public text,
  country_code text,
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  private_notes text,
  internal_score numeric,
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_education.resources (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  title text not null,
  summary_public text,
  content_public text,
  notes_private text,
  source_id uuid references hv_core.sources(id),
  evidence_id uuid references hv_private.evidence_items(id),
  verified_evidence boolean not null default false,
  claim_review_status text not null default 'pending',
  public_visibility boolean not null default false,
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted')),
  source_payload_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hv_sync.airtable_sync_log (
  id uuid primary key default gen_random_uuid(),
  log_id text unique not null,
  mode text not null,
  base_id text not null,
  status text not null,
  tables text[] not null default '{}',
  dry_run boolean not null default true,
  writeback_requested boolean not null default false,
  summary jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists hv_audit.action_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  target_schema text,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists hv_search.search_documents (
  id uuid primary key default gen_random_uuid(),
  source_schema text not null,
  source_table text not null,
  source_id uuid not null,
  title text not null,
  body_public text,
  body_private text,
  visibility text not null default 'private' check (visibility in ('public','private','operator')),
  verification_status text not null default 'pending',
  review_status text not null default 'pending',
  embedding vector(1536),
  search_tsv tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_public,''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_schema, source_table, source_id)
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606090100','hv_integration_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606090100_hv_integration_tables.sql

-- RECOVERY BEGIN 20260606090200_hv_integration_indexes_views.sql
-- Harbourview Supabase + Airtable integration foundation: indexes and public-safe DTO views.
create index if not exists hv_jurisdictions_public_idx on hv_core.jurisdictions (public_visibility, verification_status, review_status, sensitivity);
create index if not exists hv_sources_dedupe_idx on hv_core.sources (airtable_record_id, normalized_url, dedupe_key);
create index if not exists hv_sources_public_idx on hv_core.sources (public_visibility, verification_status, sensitivity);
create index if not exists hv_companies_dedupe_idx on hv_commercial.companies (airtable_record_id, normalized_website_domain);
create index if not exists hv_people_dedupe_idx on hv_commercial.people (airtable_record_id, email);
create index if not exists hv_offers_dedupe_idx on hv_commercial.offers (airtable_record_id, offer_id);
create index if not exists hv_opportunities_dedupe_idx on hv_commercial.opportunities (airtable_record_id, opportunity_id);
create index if not exists hv_marketplace_public_idx on hv_marketplace.listings (public_visibility, verification_status, review_status, sensitivity);
create index if not exists hv_search_documents_tsv_idx on hv_search.search_documents using gin (search_tsv);

create or replace view hv_public.jurisdictions_public
with (security_barrier = true)
as
select id, country_name, iso_code, region, cannabis_market_status, priority_tier, updated_at
from hv_core.jurisdictions
where public_visibility is true
  and verification_status = 'verified'
  and review_status in ('reviewed', 'approved')
  and sensitivity = 'public';

create or replace view hv_public.sources_public
with (security_barrier = true)
as
select id, source_name, source_url, normalized_url, country_text, source_type_text, organization_text,
       jurisdiction_level, verification_status, last_checked, updated_at
from hv_core.sources
where public_visibility is true
  and verification_status = 'verified'
  and sensitivity = 'public';

create or replace view hv_public.market_signals_public
with (security_barrier = true)
as
select id, jurisdiction_id, title, summary_public, signal_type, source_id, updated_at
from hv_core.market_signals
where public_visibility is true
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.marketplace_listings_public
with (security_barrier = true)
as
select id, company_id, title, description_public, category, price_public, country_code, updated_at
from hv_marketplace.listings
where public_visibility is true
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.offers_public
with (security_barrier = true)
as
select id, offer_id, company_id, title, description_public, category, updated_at
from hv_commercial.offers
where public_visibility is true
  and ready_to_sell = 'YES'
  and verification_status = 'verified'
  and review_status = 'approved'
  and sensitivity = 'public';

create or replace view hv_public.claim_evidence_public
with (security_barrier = true)
as
select e.id, e.source_id, e.claim_table, e.claim_record_id, e.evidence_type, e.evidence_url,
       e.evidence_title, e.public_summary, e.updated_at
from hv_private.evidence_items e
join hv_core.sources s on s.id = e.source_id
where e.public_visibility is true
  and e.verification_status = 'verified'
  and e.review_status = 'approved'
  and e.sensitivity = 'public'
  and s.verification_status = 'verified'
  and s.public_visibility is true
  and s.sensitivity = 'public';



create or replace view hv_public.education_resources_public
with (security_barrier = true)
as
select r.id, r.title, r.summary_public, r.content_public, r.source_id, r.evidence_id, r.updated_at
from hv_education.resources r
join hv_private.evidence_items e on e.id = r.evidence_id
where r.public_visibility is true
  and r.verified_evidence is true
  and r.claim_review_status = 'approved'
  and r.sensitivity = 'public'
  and e.verification_status = 'verified'
  and e.review_status = 'approved'
  and e.public_visibility is true
  and e.sensitivity = 'public';

grant usage on schema hv_public to anon, authenticated;
grant select on hv_public.jurisdictions_public to anon, authenticated;
grant select on hv_public.sources_public to anon, authenticated;
grant select on hv_public.market_signals_public to anon, authenticated;
grant select on hv_public.marketplace_listings_public to anon, authenticated;
grant select on hv_public.offers_public to anon, authenticated;
grant select on hv_public.claim_evidence_public to anon, authenticated;
grant select on hv_public.education_resources_public to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606090200','hv_integration_indexes_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606090200_hv_integration_indexes_views.sql

-- RECOVERY BEGIN 20260606090300_hv_integration_rls_policies.sql
-- Harbourview Supabase + Airtable integration foundation: RLS policies.
alter table hv_core.app_profiles enable row level security;
alter table hv_core.jurisdictions enable row level security;
alter table hv_core.source_types enable row level security;
alter table hv_core.source_organizations enable row level security;
alter table hv_core.sources enable row level security;
alter table hv_core.market_signals enable row level security;
alter table hv_private.verification_queue enable row level security;
alter table hv_private.rejected_records enable row level security;
alter table hv_private.evidence_items enable row level security;
alter table hv_commercial.companies enable row level security;
alter table hv_commercial.people enable row level security;
alter table hv_commercial.offers enable row level security;
alter table hv_commercial.opportunities enable row level security;
alter table hv_marketplace.listings enable row level security;
alter table hv_education.resources enable row level security;
alter table hv_sync.airtable_sync_log enable row level security;
alter table hv_audit.action_log enable row level security;
alter table hv_search.search_documents enable row level security;

drop policy if exists hv_core_operator_read_jurisdictions on hv_core.jurisdictions;
create policy hv_core_operator_read_jurisdictions on hv_core.jurisdictions for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_core_admin_manage_jurisdictions on hv_core.jurisdictions;
create policy hv_core_admin_manage_jurisdictions on hv_core.jurisdictions for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_core_operator_read_source_types on hv_core.source_types;
create policy hv_core_operator_read_source_types on hv_core.source_types for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_core_admin_manage_source_types on hv_core.source_types;
create policy hv_core_admin_manage_source_types on hv_core.source_types for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_core_operator_read_source_organizations on hv_core.source_organizations;
create policy hv_core_operator_read_source_organizations on hv_core.source_organizations for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_core_admin_manage_source_organizations on hv_core.source_organizations;
create policy hv_core_admin_manage_source_organizations on hv_core.source_organizations for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_core_operator_read_sources on hv_core.sources;
create policy hv_core_operator_read_sources on hv_core.sources for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_core_admin_manage_sources on hv_core.sources;
create policy hv_core_admin_manage_sources on hv_core.sources for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_core_operator_read_market_signals on hv_core.market_signals;
create policy hv_core_operator_read_market_signals on hv_core.market_signals for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_core_admin_manage_market_signals on hv_core.market_signals;
create policy hv_core_admin_manage_market_signals on hv_core.market_signals for all using (hv_core.is_admin()) with check (hv_core.is_admin());

drop policy if exists hv_profiles_self_or_operator_read on hv_core.app_profiles;
create policy hv_profiles_self_or_operator_read on hv_core.app_profiles for select using (hv_core.is_operator_or_admin() or auth.uid() = auth_user_id);
drop policy if exists hv_profiles_admin_manage on hv_core.app_profiles;
create policy hv_profiles_admin_manage on hv_core.app_profiles for all using (hv_core.is_admin()) with check (hv_core.is_admin());

drop policy if exists hv_private_operator_read_verification_queue on hv_private.verification_queue;
create policy hv_private_operator_read_verification_queue on hv_private.verification_queue for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_private_admin_manage_verification_queue on hv_private.verification_queue;
create policy hv_private_admin_manage_verification_queue on hv_private.verification_queue for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_private_operator_read_rejected_records on hv_private.rejected_records;
create policy hv_private_operator_read_rejected_records on hv_private.rejected_records for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_private_admin_manage_rejected_records on hv_private.rejected_records;
create policy hv_private_admin_manage_rejected_records on hv_private.rejected_records for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_private_operator_read_evidence_items on hv_private.evidence_items;
create policy hv_private_operator_read_evidence_items on hv_private.evidence_items for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_private_admin_manage_evidence_items on hv_private.evidence_items;
create policy hv_private_admin_manage_evidence_items on hv_private.evidence_items for all using (hv_core.is_admin()) with check (hv_core.is_admin());

drop policy if exists hv_companies_account_or_operator_read on hv_commercial.companies;
create policy hv_companies_account_or_operator_read on hv_commercial.companies for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
drop policy if exists hv_companies_admin_manage on hv_commercial.companies;
create policy hv_companies_admin_manage on hv_commercial.companies for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_people_account_or_operator_read on hv_commercial.people;
create policy hv_people_account_or_operator_read on hv_commercial.people for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
drop policy if exists hv_people_admin_manage on hv_commercial.people;
create policy hv_people_admin_manage on hv_commercial.people for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_offers_account_or_operator_read on hv_commercial.offers;
create policy hv_offers_account_or_operator_read on hv_commercial.offers for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
drop policy if exists hv_offers_admin_manage on hv_commercial.offers;
create policy hv_offers_admin_manage on hv_commercial.offers for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_opportunities_account_or_operator_read on hv_commercial.opportunities;
create policy hv_opportunities_account_or_operator_read on hv_commercial.opportunities for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
drop policy if exists hv_opportunities_admin_manage on hv_commercial.opportunities;
create policy hv_opportunities_admin_manage on hv_commercial.opportunities for all using (hv_core.is_admin()) with check (hv_core.is_admin());

drop policy if exists hv_marketplace_account_or_operator_read on hv_marketplace.listings;
create policy hv_marketplace_account_or_operator_read on hv_marketplace.listings for select using (hv_core.is_operator_or_admin() or account_id = (select account_id from hv_core.app_profiles where auth_user_id = auth.uid()));
drop policy if exists hv_marketplace_admin_manage on hv_marketplace.listings;
create policy hv_marketplace_admin_manage on hv_marketplace.listings for all using (hv_core.is_admin()) with check (hv_core.is_admin());

drop policy if exists hv_education_operator_read on hv_education.resources;
create policy hv_education_operator_read on hv_education.resources for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_education_admin_manage on hv_education.resources;
create policy hv_education_admin_manage on hv_education.resources for all using (hv_core.is_admin()) with check (hv_core.is_admin());
drop policy if exists hv_sync_operator_read on hv_sync.airtable_sync_log;
create policy hv_sync_operator_read on hv_sync.airtable_sync_log for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_sync_service_insert on hv_sync.airtable_sync_log;
create policy hv_sync_service_insert on hv_sync.airtable_sync_log for insert with check (hv_core.current_role() = 'service_role');
drop policy if exists hv_sync_service_update on hv_sync.airtable_sync_log;
create policy hv_sync_service_update on hv_sync.airtable_sync_log for update using (hv_core.current_role() = 'service_role') with check (hv_core.current_role() = 'service_role');
drop policy if exists hv_audit_operator_read on hv_audit.action_log;
create policy hv_audit_operator_read on hv_audit.action_log for select using (hv_core.is_operator_or_admin());
drop policy if exists hv_audit_service_insert on hv_audit.action_log;
create policy hv_audit_service_insert on hv_audit.action_log for insert with check (hv_core.current_role() = 'service_role' or hv_core.is_admin());
drop policy if exists hv_search_public_or_operator_read on hv_search.search_documents;
create policy hv_search_public_or_operator_read on hv_search.search_documents for select using ((visibility = 'public' and verification_status = 'verified' and review_status = 'approved') or hv_core.is_operator_or_admin());
drop policy if exists hv_search_admin_manage on hv_search.search_documents;
create policy hv_search_admin_manage on hv_search.search_documents for all using (hv_core.is_admin()) with check (hv_core.is_admin());

grant usage on schema hv_core, hv_private, hv_commercial, hv_marketplace, hv_education, hv_sync, hv_audit, hv_search to authenticated;
grant select, insert, update, delete on all tables in schema hv_core to authenticated;
grant select, insert, update, delete on all tables in schema hv_private to authenticated;
grant select, insert, update, delete on all tables in schema hv_commercial to authenticated;
grant select, insert, update, delete on all tables in schema hv_marketplace to authenticated;
grant select, insert, update, delete on all tables in schema hv_education to authenticated;
grant select, insert, update on all tables in schema hv_sync to authenticated;
grant select, insert on all tables in schema hv_audit to authenticated;
grant select, insert, update, delete on all tables in schema hv_search to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606090300','hv_integration_rls_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606090300_hv_integration_rls_policies.sql

-- RECOVERY BEGIN 20260606090400_hv_integration_verification.sql
-- Harbourview verification SQL snippets for local release evidence.
create or replace view hv_audit.rls_enabled_check as
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('hv_core','hv_private','hv_commercial','hv_marketplace','hv_education','hv_sync','hv_audit','hv_search')
order by n.nspname, c.relname;

create or replace view hv_audit.public_dto_private_column_check as
select table_schema, table_name, column_name
from information_schema.columns
where table_schema = 'hv_public'
  and column_name in ('private_notes','notes_private','summary_private','description_private','raw_row_id','raw_source_file','import_batch_id','sensitivity');

create or replace view hv_audit.public_sources_unverified_check as
select * from hv_public.sources_public
where verification_status <> 'verified';

create or replace view hv_audit.public_marketplace_unapproved_check as
select p.id, p.title
from hv_public.marketplace_listings_public p
join hv_marketplace.listings l on l.id = p.id
where l.verification_status <> 'verified' or l.review_status <> 'approved';


create or replace view hv_audit.public_education_unapproved_check as
select p.id, p.title
from hv_public.education_resources_public p
join hv_education.resources r on r.id = p.id
where r.verified_evidence is not true or r.claim_review_status <> 'approved';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606090400','hv_integration_verification','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606090400_hv_integration_verification.sql

-- RECOVERY BEGIN 20260606210000_security_harden_anon_functions_and_regulatory_signals_rls.sql
-- ============================================================
-- PART 1: Revoke anon EXECUTE on SECURITY DEFINER functions
-- that should never be callable via RPC without auth.
-- Deterministic replay guard: some functions are created later in the
-- historical chain in zero-state environments.
-- ============================================================

do $anon_function_hardening$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke execute on function public.handle_new_user() from anon';
  end if;
  if to_regprocedure('public.hv_audit_publication()') is not null then
    execute 'revoke execute on function public.hv_audit_publication() from anon';
  end if;
  if to_regprocedure('public.hv_audit_review_decision()') is not null then
    execute 'revoke execute on function public.hv_audit_review_decision() from anon';
  end if;
  if to_regprocedure('public.hv_requeue_failed_embed_jobs()') is not null then
    execute 'revoke execute on function public.hv_requeue_failed_embed_jobs() from anon';
  end if;
  if to_regprocedure('public.sync_subscription_tier()') is not null then
    execute 'revoke execute on function public.sync_subscription_tier() from anon';
  end if;
end
$anon_function_hardening$;

-- ============================================================
-- PART 2: Scope regulatory_signals RLS policies from
-- USING (true) / WITH CHECK (true) for authenticated
-- down to admin-role-only.
-- ============================================================

DROP POLICY IF EXISTS admin_all ON regulatory_signals.sources;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.evidence;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.signals;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.signal_evidence_links;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.review_events;
DROP POLICY IF EXISTS admin_all ON regulatory_signals.publication_events;

CREATE POLICY "admin_all" ON regulatory_signals.sources FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.evidence FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.signals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.signal_evidence_links FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.review_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "admin_all" ON regulatory_signals.publication_events FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260606210000','security_harden_anon_functions_and_regulatory_signals_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260606210000_security_harden_anon_functions_and_regulatory_signals_rls.sql

-- RECOVERY BEGIN 20260607000000_stripe_subscriptions_user_profiles.sql
-- Migration: 20260607000000_stripe_subscriptions_user_profiles
-- Stripe monetization schema — user_profiles + subscriptions tables
-- Run on Supabase project: zvxdgdkukjrrwamdpqrg

-- 1. user_profiles
create table if not exists public.user_profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  stripe_customer_id text unique,
  tier               text not null default 'free' check (tier in ('free', 'intel', 'operator')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Service role manages profiles" on public.user_profiles;
create policy "Service role manages profiles"
  on public.user_profiles for all
  using (auth.role() = 'service_role');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. subscriptions
create table if not exists public.subscriptions (
  id                   text primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id   text not null,
  status               text not null,
  price_id             text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create index if not exists subscriptions_user_id_idx     on public.subscriptions(user_id);
create index if not exists subscriptions_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx      on public.subscriptions(status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260607000000','stripe_subscriptions_user_profiles','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260607000000_stripe_subscriptions_user_profiles.sql

-- RECOVERY BEGIN 20260607130000_cultivar_passport_network_p0.sql
-- Historical migration marker.
--
-- Production records version 20260607130000 with zero statements because the
-- original Cultivar Passport Network draft never applied successfully. The
-- corrected and complete schema is owned by the forward-fix migration:
--
--   20260621220513_cultivar_passport_network_p0_synfix.sql
--
-- Keeping this version as an intentional no-op reproduces production migration
-- history and prevents duplicate enum, table, policy, view, and storage objects
-- during deterministic zero-state replay.


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260607130000','cultivar_passport_network_p0','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260607130000_cultivar_passport_network_p0.sql

-- RECOVERY BEGIN 20260607140000_cannabis_data_contract_v1_p0_p1.sql
-- =============================================================================
-- Harbourview Global Cannabis Data Contract v1.0 — P0/P1 backend foundation
-- P0/P1 raw intelligence tables are stored in cannabis_intelligence and are not
-- anon-readable. Public access must be projected through explicit DTO allowlists
-- or future approved public snapshot tables.
-- =============================================================================

create extension if not exists pgcrypto;
create schema if not exists cannabis_intelligence;

-- Stable system enums only. Expandable cannabis/product taxonomies use lookup
-- tables with stable slugs.
do $$ begin
  create type cannabis_intelligence.jurisdiction_type as enum ('sovereign_country','territory','region','subnational','municipality','special_administrative_area','supranational','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.sovereignty_status as enum ('sovereign','dependent_territory','disputed','special_status','not_applicable','unknown');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.activity_type as enum ('adult_use_sale','medical_use','prescribing','dispensing','pharmacy_distribution','cultivation','home_cultivation','commercial_cultivation','hemp_cultivation','processing','extraction','manufacturing','testing','research','clinical_trial','import','export','wholesale','distribution','retail','online_sale','advertising','packaging','labelling','transport','storage','waste_disposal','food_use','feed_use','cosmetic_use','construction_material_use','seed_sale','genetics_sale','public_procurement');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.legal_status as enum ('legal','conditionally_legal','prohibited','not_regulated','unclear','mixed','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.operational_status as enum ('operational','partially_operational','announced_not_operational','suspended','not_operational','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.regulator_type as enum ('national_regulator','subnational_regulator','health_authority','agriculture_authority','food_safety_authority','customs_authority','law_enforcement','standards_body','pharmaceutical_regulator','environment_authority','municipal_authority','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.licence_category as enum ('cultivation','processing','manufacturing','testing','research','medical_distribution','pharmacy','retail','wholesale','import','export','transport','storage','seed_genetics','hemp','food_feed_cosmetic','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.licence_status as enum ('active','pending','suspended','revoked','expired','withdrawn','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.entity_type as enum ('company','individual','government_agency','nonprofit','research_institution','healthcare_provider','pharmacy','laboratory','unknown','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.source_type as enum ('law','regulation','official_guidance','licence_register','court_decision','government_dataset','official_press_release','parliamentary_record','treaty','standards_document','regulator_website','public_notice','academic','news','commercial_database','manual_research_note','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.source_reliability_tier as enum ('tier_1_official','tier_2_primary_non_regulator','tier_3_reputable_secondary','tier_4_unverified_secondary','tier_5_low_reliability');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.evidence_status as enum ('verified','partially_verified','conflicting','stale','machine_extracted_unreviewed','human_review_required','native_language_review_required','legal_review_required','no_public_evidence_found','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.exposure_level as enum ('public_safe','public_summary_only','restricted_internal','admin_only','legal_review_required','do_not_publish');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.gap_type as enum ('jurisdiction_universe','source_discovery','legal_status','operational_reality','threshold','regulator','licence_type','licence_register','licensed_entity_extraction','medical_access','import_export','coverage_matrix','contradiction_review','translation_review','legal_review','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.contradiction_status as enum ('open','under_review','resolved','superseded','dismissed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.review_status as enum ('unreviewed','in_review','approved_public','approved_internal','rejected','needs_human_review','needs_native_language_review','needs_legal_review','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.update_frequency as enum ('continuous','daily','weekly','monthly','quarterly','annual','ad_hoc','unknown','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.evidence_relationship_type as enum ('supports','contradicts','supersedes','clarifies','background');
exception when duplicate_object then null; end $$;
do $$ begin
  create type cannabis_intelligence.import_export_direction as enum ('import','export','both','not_applicable','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cannabis_intelligence.coverage_status as enum ('not_started','import_structure_ready','in_progress','partial','complete','blocked','not_applicable');
exception when duplicate_object then null; end $$;

create or replace function cannabis_intelligence.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists cannabis_intelligence.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  official_name text,
  iso_alpha2 text check (iso_alpha2 is null or iso_alpha2 ~ '^[A-Z]{2}$'),
  iso_alpha3 text check (iso_alpha3 is null or iso_alpha3 ~ '^[A-Z]{3}$'),
  jurisdiction_type cannabis_intelligence.jurisdiction_type not null,
  sovereignty_status cannabis_intelligence.sovereignty_status not null default 'unknown',
  parent_jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete restrict,
  region text,
  subregion text,
  universe_import_status cannabis_intelligence.coverage_status not null default 'not_started',
  coverage_generation_status cannabis_intelligence.coverage_status not null default 'not_started',
  source_discovery_status cannabis_intelligence.coverage_status not null default 'not_started',
  legal_fact_population_status cannabis_intelligence.coverage_status not null default 'not_started',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.jurisdictions is 'Raw jurisdiction universe records for cannabis intelligence. Not anon-readable; public DTOs expose only allowlisted fields.';

create table if not exists cannabis_intelligence.jurisdiction_aliases (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  alias text not null,
  alias_type text not null default 'common',
  language_code text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cannabis_intelligence.jurisdiction_relationships (
  id uuid primary key default gen_random_uuid(),
  parent_jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  child_jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  relationship_type text not null,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'human_review_required',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_jurisdiction_id <> child_jurisdiction_id),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  unique (parent_jurisdiction_id, child_jurisdiction_id, relationship_type, valid_from)
);

create table if not exists cannabis_intelligence.plant_product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  description text,
  parent_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table cannabis_intelligence.plant_product_categories is 'Seeded expandable cannabis-plant product taxonomy; stores no country/legal facts.';

create table if not exists cannabis_intelligence.product_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table cannabis_intelligence.product_forms is 'Seeded expandable physical/form taxonomy; stores no country/legal facts.';

create table if not exists cannabis_intelligence.activity_product_matrix (
  id uuid primary key default gen_random_uuid(),
  activity cannabis_intelligence.activity_type not null,
  plant_product_category_id uuid not null references cannabis_intelligence.plant_product_categories(id) on delete cascade,
  coverage_required boolean not null default true,
  notes_public text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity, plant_product_category_id)
);
comment on table cannabis_intelligence.activity_product_matrix is 'Required global coverage pairs used to create explicit gaps without inventing legal facts.';

create table if not exists cannabis_intelligence.source_documents (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  source_type cannabis_intelligence.source_type not null,
  reliability_tier cannabis_intelligence.source_reliability_tier not null default 'tier_4_unverified_secondary',
  title text not null,
  publisher text,
  canonical_url text,
  official_url text,
  language_code text,
  published_at date,
  effective_at date,
  accessed_at timestamptz,
  archive_path text,
  raw_text_path text,
  screenshot_path text,
  pdf_path text,
  extraction_log jsonb,
  content_hash text,
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (canonical_url),
  check (canonical_url is null or canonical_url ~* '^https?://'),
  check (official_url is null or official_url ~* '^https?://')
);
comment on table cannabis_intelligence.source_documents is 'First-class raw source records. Archive/raw paths, extraction logs, hashes, and reviewer notes are internal-only by default.';

create table if not exists cannabis_intelligence.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  source_document_id uuid not null references cannabis_intelligence.source_documents(id) on delete restrict,
  claim_type text not null,
  claim_field text,
  claim_value text,
  raw_excerpt text,
  normalized_summary text,
  machine_extracted boolean not null default true,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  valid_from date,
  valid_to date,
  notes_public text,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.evidence_claims is 'Normalized factual claims extracted from source documents. Machine-extracted claims default non-public until reviewed.';

create table if not exists cannabis_intelligence.data_gaps (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete cascade,
  activity cannabis_intelligence.activity_type,
  gap_type cannabis_intelligence.gap_type not null default 'coverage_matrix',
  priority integer not null default 50 check (priority between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'no_public_evidence_found',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  status cannabis_intelligence.review_status not null default 'unreviewed',
  public_summary text,
  notes_internal text,
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jurisdiction_id, plant_product_category_id, activity, gap_type)
);
comment on table cannabis_intelligence.data_gaps is 'Explicit unknowns and missing coverage. Unknown facts must be represented here rather than omitted.';

create table if not exists cannabis_intelligence.legal_regimes (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid not null references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  activity cannabis_intelligence.activity_type not null,
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.legal_regimes(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.legal_regimes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);
comment on table cannabis_intelligence.legal_regimes is 'Raw legal status and separate operational reality by jurisdiction/category/activity. Temporal records are not destructively overwritten.';

create table if not exists cannabis_intelligence.regulatory_authorities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  name text not null,
  regulator_type cannabis_intelligence.regulator_type not null,
  official_url text,
  contact_url text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (official_url is null or official_url ~* '^https?://'),
  check (contact_url is null or contact_url ~* '^https?://'),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.legal_thresholds (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  threshold_type text not null,
  threshold_value numeric,
  threshold_unit text,
  comparator text check (comparator is null or comparator in ('lt','lte','eq','gte','gt','range','unknown')),
  applies_to_activity cannabis_intelligence.activity_type,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.legal_thresholds(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.legal_thresholds(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.laws_regulations (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  source_document_id uuid references cannabis_intelligence.source_documents(id) on delete restrict,
  title text not null,
  instrument_type text not null,
  official_identifier text,
  status cannabis_intelligence.legal_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  enacted_at date,
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.laws_regulations(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.laws_regulations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.authority_responsibilities (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references cannabis_intelligence.regulatory_authorities(id) on delete cascade,
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  activity cannabis_intelligence.activity_type,
  responsibility_summary text not null,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.licence_types (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  authority_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  category cannabis_intelligence.licence_category not null,
  slug text not null check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  display_name text not null,
  activity cannabis_intelligence.activity_type,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
comment on table cannabis_intelligence.licence_types is 'Licence type definitions only. Actual licensees are stored separately in licensed_entities and entity_licences.';

create table if not exists cannabis_intelligence.licence_registers (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  authority_id uuid references cannabis_intelligence.regulatory_authorities(id) on delete set null,
  licence_type_id uuid references cannabis_intelligence.licence_types(id) on delete set null,
  name text not null,
  register_url text,
  is_public boolean not null default false,
  extraction_status cannabis_intelligence.coverage_status not null default 'not_started',
  update_frequency cannabis_intelligence.update_frequency not null default 'unknown',
  last_checked_at timestamptz,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (register_url is null or register_url ~* '^https?://')
);
comment on table cannabis_intelligence.licence_registers is 'Tracks licence registers even where licensee extraction is incomplete.';

create table if not exists cannabis_intelligence.licensed_entities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  entity_type cannabis_intelligence.entity_type not null default 'unknown',
  legal_name text not null,
  trade_name text,
  official_identifier text,
  website_url text,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  private_contact_data jsonb,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (website_url is null or website_url ~* '^https?://')
);
comment on table cannabis_intelligence.licensed_entities is 'Actual licensee/entity records. Private contact data is internal-only and not exposed in public DTOs.';

create table if not exists cannabis_intelligence.entity_licences (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references cannabis_intelligence.licensed_entities(id) on delete cascade,
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  licence_type_id uuid references cannabis_intelligence.licence_types(id) on delete restrict,
  licence_register_id uuid references cannabis_intelligence.licence_registers(id) on delete set null,
  licence_number text,
  status cannabis_intelligence.licence_status not null default 'unknown',
  issued_at date,
  expires_at date,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'machine_extracted_unreviewed',
  review_status cannabis_intelligence.review_status not null default 'unreviewed',
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  notes_public text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.entity_licences(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.entity_licences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or issued_at is null or expires_at >= issued_at),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists cannabis_intelligence.medical_access_pathways (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  pathway_type text not null,
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'legal_review_required',
  review_status cannabis_intelligence.review_status not null default 'needs_legal_review',
  exposure_level cannabis_intelligence.exposure_level not null default 'legal_review_required',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.medical_access_pathways(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.medical_access_pathways(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.import_export_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references cannabis_intelligence.jurisdictions(id) on delete cascade,
  plant_product_category_id uuid references cannabis_intelligence.plant_product_categories(id) on delete restrict,
  direction cannabis_intelligence.import_export_direction not null default 'unknown',
  legal_status cannabis_intelligence.legal_status not null default 'unknown',
  operational_status cannabis_intelligence.operational_status not null default 'unknown',
  licence_required boolean,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  evidence_status cannabis_intelligence.evidence_status not null default 'legal_review_required',
  review_status cannabis_intelligence.review_status not null default 'needs_legal_review',
  exposure_level cannabis_intelligence.exposure_level not null default 'legal_review_required',
  public_summary text,
  notes_internal text,
  verified_at timestamptz,
  observed_at timestamptz not null default now(),
  effective_from date,
  effective_to date,
  valid_from date,
  valid_to date,
  supersedes_record_id uuid references cannabis_intelligence.import_export_rules(id) on delete set null,
  superseded_by_record_id uuid references cannabis_intelligence.import_export_rules(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table if not exists cannabis_intelligence.contradictions (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  subject_table text not null check (subject_table in ('legal_regimes','legal_thresholds','laws_regulations','regulatory_authorities','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','evidence_claims')),
  subject_id uuid,
  field_name text,
  status cannabis_intelligence.contradiction_status not null default 'open',
  summary text not null,
  evidence_claim_id_a uuid references cannabis_intelligence.evidence_claims(id) on delete restrict,
  evidence_claim_id_b uuid references cannabis_intelligence.evidence_claims(id) on delete restrict,
  exposure_level cannabis_intelligence.exposure_level not null default 'restricted_internal',
  review_status cannabis_intelligence.review_status not null default 'needs_human_review',
  notes_internal text,
  reviewer_notes text,
  observed_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (evidence_claim_id_a is null or evidence_claim_id_b is null or evidence_claim_id_a <> evidence_claim_id_b)
);
comment on table cannabis_intelligence.contradictions is 'Contradictory claims are recorded here rather than overwritten. Internals are not public DTO fields.';

create table if not exists cannabis_intelligence.review_tasks (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references cannabis_intelligence.jurisdictions(id) on delete set null,
  subject_table text not null check (subject_table in ('jurisdictions','source_documents','evidence_claims','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions')),
  subject_id uuid,
  status cannabis_intelligence.review_status not null default 'unreviewed',
  priority integer not null default 50 check (priority between 0 and 100),
  assigned_to uuid,
  due_at timestamptz,
  notes_internal text,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cannabis_intelligence.fact_evidence_links (
  id uuid primary key default gen_random_uuid(),
  subject_table text not null check (subject_table in ('jurisdictions','jurisdiction_aliases','jurisdiction_relationships','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions','review_tasks')),
  subject_id uuid not null,
  evidence_claim_id uuid references cannabis_intelligence.evidence_claims(id) on delete cascade,
  source_document_id uuid references cannabis_intelligence.source_documents(id) on delete cascade,
  relationship_type cannabis_intelligence.evidence_relationship_type not null,
  confidence_contribution integer not null default 0 check (confidence_contribution between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (evidence_claim_id is not null or source_document_id is not null),
  unique (subject_table, subject_id, evidence_claim_id, source_document_id, relationship_type)
);
comment on table cannabis_intelligence.fact_evidence_links is 'Generic provenance relation allowing factual records to link to multiple evidence claims/source documents.';

create or replace function cannabis_intelligence.generate_mandatory_data_gaps(target_jurisdiction_id uuid)
returns integer
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
declare
  inserted_count integer;
begin
  insert into cannabis_intelligence.data_gaps (
    jurisdiction_id,
    plant_product_category_id,
    activity,
    gap_type,
    priority,
    evidence_status,
    review_status,
    exposure_level,
    confidence_score,
    status,
    public_summary,
    notes_internal
  )
  select
    target_jurisdiction_id,
    apm.plant_product_category_id,
    apm.activity,
    'coverage_matrix',
    50,
    'no_public_evidence_found',
    'unreviewed',
    'restricted_internal',
    0,
    'unreviewed',
    null,
    'Auto-generated mandatory coverage gap; no legal fact has been populated.'
  from cannabis_intelligence.activity_product_matrix apm
  where apm.coverage_required = true
    and not exists (
      select 1
      from cannabis_intelligence.legal_regimes lr
      where lr.jurisdiction_id = target_jurisdiction_id
        and lr.plant_product_category_id = apm.plant_product_category_id
        and lr.activity = apm.activity
    )
  on conflict (jurisdiction_id, plant_product_category_id, activity, gap_type) do nothing;

  get diagnostics inserted_count = row_count;

  update cannabis_intelligence.jurisdictions
  set coverage_generation_status = case when inserted_count > 0 then 'partial'::cannabis_intelligence.coverage_status else coverage_generation_status end,
      updated_at = now()
  where id = target_jurisdiction_id;

  return inserted_count;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps(uuid) from public;

create or replace function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction()
returns trigger
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
begin
  perform cannabis_intelligence.generate_mandatory_data_gaps(new.id);
  return new;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction() from public;

drop trigger if exists trg_generate_mandatory_data_gaps_for_new_jurisdiction on cannabis_intelligence.jurisdictions;
create trigger trg_generate_mandatory_data_gaps_for_new_jurisdiction
after insert on cannabis_intelligence.jurisdictions
for each row execute function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction();

create or replace function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair()
returns trigger
language plpgsql
security definer
set search_path = cannabis_intelligence, public
as $$
begin
  insert into cannabis_intelligence.data_gaps (
    jurisdiction_id,
    plant_product_category_id,
    activity,
    gap_type,
    priority,
    evidence_status,
    review_status,
    exposure_level,
    confidence_score,
    status,
    public_summary,
    notes_internal
  )
  select
    jurisdictions.id,
    new.plant_product_category_id,
    new.activity,
    'coverage_matrix',
    50,
    'no_public_evidence_found',
    'unreviewed',
    'restricted_internal',
    0,
    'unreviewed',
    null,
    'Auto-generated mandatory coverage gap from a newly required activity/category matrix pair; no legal fact has been populated.'
  from cannabis_intelligence.jurisdictions
  where new.coverage_required = true
    and not exists (
      select 1
      from cannabis_intelligence.legal_regimes lr
      where lr.jurisdiction_id = jurisdictions.id
        and lr.plant_product_category_id = new.plant_product_category_id
        and lr.activity = new.activity
    )
  on conflict (jurisdiction_id, plant_product_category_id, activity, gap_type) do nothing;

  return new;
end;
$$;
revoke all on function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair() from public;

drop trigger if exists trg_generate_mandatory_data_gaps_for_matrix_pair on cannabis_intelligence.activity_product_matrix;
create trigger trg_generate_mandatory_data_gaps_for_matrix_pair
after insert on cannabis_intelligence.activity_product_matrix
for each row execute function cannabis_intelligence.generate_mandatory_data_gaps_for_matrix_pair();

-- Updated-at triggers for all new tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'jurisdictions','jurisdiction_aliases','jurisdiction_relationships','plant_product_categories','product_forms','activity_product_matrix','source_documents','evidence_claims','data_gaps','legal_regimes','regulatory_authorities','legal_thresholds','laws_regulations','authority_responsibilities','licence_types','licence_registers','licensed_entities','entity_licences','medical_access_pathways','import_export_rules','contradictions','review_tasks','fact_evidence_links'
  ] loop
    execute format('drop trigger if exists %I on cannabis_intelligence.%I', 'trg_' || table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on cannabis_intelligence.%I for each row execute function cannabis_intelligence.set_updated_at()', 'trg_' || table_name || '_set_updated_at', table_name);
  end loop;
end $$;

-- RLS: deny by default. No anon-readable raw intelligence policies are created.
alter table cannabis_intelligence.jurisdictions enable row level security;
alter table cannabis_intelligence.jurisdiction_aliases enable row level security;
alter table cannabis_intelligence.jurisdiction_relationships enable row level security;
alter table cannabis_intelligence.plant_product_categories enable row level security;
alter table cannabis_intelligence.product_forms enable row level security;
alter table cannabis_intelligence.activity_product_matrix enable row level security;
alter table cannabis_intelligence.source_documents enable row level security;
alter table cannabis_intelligence.evidence_claims enable row level security;
alter table cannabis_intelligence.data_gaps enable row level security;
alter table cannabis_intelligence.legal_regimes enable row level security;
alter table cannabis_intelligence.regulatory_authorities enable row level security;
alter table cannabis_intelligence.legal_thresholds enable row level security;
alter table cannabis_intelligence.laws_regulations enable row level security;
alter table cannabis_intelligence.authority_responsibilities enable row level security;
alter table cannabis_intelligence.licence_types enable row level security;
alter table cannabis_intelligence.licence_registers enable row level security;
alter table cannabis_intelligence.licensed_entities enable row level security;
alter table cannabis_intelligence.entity_licences enable row level security;
alter table cannabis_intelligence.medical_access_pathways enable row level security;
alter table cannabis_intelligence.import_export_rules enable row level security;
alter table cannabis_intelligence.contradictions enable row level security;
alter table cannabis_intelligence.review_tasks enable row level security;
alter table cannabis_intelligence.fact_evidence_links enable row level security;

revoke all on schema cannabis_intelligence from anon;
revoke all on all tables in schema cannabis_intelligence from anon;
revoke all on all functions in schema cannabis_intelligence from anon;

-- Required FK/common-filter indexes.
create index if not exists idx_ci_jurisdictions_slug on cannabis_intelligence.jurisdictions(slug);
create index if not exists idx_ci_jurisdictions_type on cannabis_intelligence.jurisdictions(jurisdiction_type);
create index if not exists idx_ci_jurisdictions_parent on cannabis_intelligence.jurisdictions(parent_jurisdiction_id);
create index if not exists idx_ci_jurisdiction_aliases_jurisdiction on cannabis_intelligence.jurisdiction_aliases(jurisdiction_id);
create unique index if not exists uq_ci_jurisdiction_aliases_language on cannabis_intelligence.jurisdiction_aliases(jurisdiction_id, alias, coalesce(language_code, ''));
create unique index if not exists uq_ci_licence_types_slug_valid_from on cannabis_intelligence.licence_types(jurisdiction_id, slug, coalesce(valid_from, date '1900-01-01'));
create unique index if not exists uq_ci_fact_evidence_links_nullable_targets on cannabis_intelligence.fact_evidence_links(subject_table, subject_id, coalesce(evidence_claim_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(source_document_id, '00000000-0000-0000-0000-000000000000'::uuid), relationship_type);
create index if not exists idx_ci_jurisdiction_relationships_parent on cannabis_intelligence.jurisdiction_relationships(parent_jurisdiction_id);
create index if not exists idx_ci_jurisdiction_relationships_child on cannabis_intelligence.jurisdiction_relationships(child_jurisdiction_id);
create index if not exists idx_ci_product_categories_parent on cannabis_intelligence.plant_product_categories(parent_category_id);
create index if not exists idx_ci_activity_product_matrix_category on cannabis_intelligence.activity_product_matrix(plant_product_category_id);
create index if not exists idx_ci_activity_product_matrix_activity on cannabis_intelligence.activity_product_matrix(activity);
create index if not exists idx_ci_sources_jurisdiction_type_accessed on cannabis_intelligence.source_documents(jurisdiction_id, source_type, accessed_at);
create index if not exists idx_ci_sources_jurisdiction on cannabis_intelligence.source_documents(jurisdiction_id);
create index if not exists idx_ci_sources_type_accessed on cannabis_intelligence.source_documents(source_type, accessed_at);
create index if not exists idx_ci_claims_jurisdiction_source on cannabis_intelligence.evidence_claims(jurisdiction_id, source_document_id);
create index if not exists idx_ci_claims_source on cannabis_intelligence.evidence_claims(source_document_id);
create index if not exists idx_ci_gaps_jurisdiction_status_priority on cannabis_intelligence.data_gaps(jurisdiction_id, status, priority);
create index if not exists idx_ci_gaps_category_activity on cannabis_intelligence.data_gaps(plant_product_category_id, activity);
create index if not exists idx_ci_legal_regimes_jurisdiction_category_activity_status on cannabis_intelligence.legal_regimes(jurisdiction_id, plant_product_category_id, activity, legal_status);
create index if not exists idx_ci_legal_regimes_category on cannabis_intelligence.legal_regimes(plant_product_category_id);
create index if not exists idx_ci_regulators_jurisdiction on cannabis_intelligence.regulatory_authorities(jurisdiction_id);
create index if not exists idx_ci_thresholds_jurisdiction on cannabis_intelligence.legal_thresholds(jurisdiction_id);
create index if not exists idx_ci_laws_jurisdiction on cannabis_intelligence.laws_regulations(jurisdiction_id);
create index if not exists idx_ci_laws_source on cannabis_intelligence.laws_regulations(source_document_id);
create index if not exists idx_ci_authority_responsibilities_authority on cannabis_intelligence.authority_responsibilities(authority_id);
create index if not exists idx_ci_authority_responsibilities_jurisdiction on cannabis_intelligence.authority_responsibilities(jurisdiction_id);
create index if not exists idx_ci_licence_types_jurisdiction on cannabis_intelligence.licence_types(jurisdiction_id);
create index if not exists idx_ci_licence_types_authority on cannabis_intelligence.licence_types(authority_id);
create index if not exists idx_ci_licence_registers_jurisdiction on cannabis_intelligence.licence_registers(jurisdiction_id);
create index if not exists idx_ci_licence_registers_authority on cannabis_intelligence.licence_registers(authority_id);
create index if not exists idx_ci_licensees_jurisdiction on cannabis_intelligence.licensed_entities(jurisdiction_id);
create index if not exists idx_ci_entity_licences_entity on cannabis_intelligence.entity_licences(entity_id);
create index if not exists idx_ci_entity_licences_jurisdiction_status on cannabis_intelligence.entity_licences(jurisdiction_id, status);
create index if not exists idx_ci_entity_licences_type on cannabis_intelligence.entity_licences(licence_type_id);
create index if not exists idx_ci_entity_licences_register on cannabis_intelligence.entity_licences(licence_register_id);
create index if not exists idx_ci_medical_access_jurisdiction on cannabis_intelligence.medical_access_pathways(jurisdiction_id);
create index if not exists idx_ci_import_export_jurisdiction on cannabis_intelligence.import_export_rules(jurisdiction_id);
create index if not exists idx_ci_contradictions_jurisdiction on cannabis_intelligence.contradictions(jurisdiction_id);
create index if not exists idx_ci_contradictions_subject on cannabis_intelligence.contradictions(subject_table, subject_id, field_name, status);
create index if not exists idx_ci_review_tasks_subject on cannabis_intelligence.review_tasks(subject_table, subject_id, status);
create index if not exists idx_ci_fact_evidence_links_subject on cannabis_intelligence.fact_evidence_links(subject_table, subject_id);
create index if not exists idx_ci_fact_evidence_links_claim on cannabis_intelligence.fact_evidence_links(evidence_claim_id);
create index if not exists idx_ci_fact_evidence_links_source on cannabis_intelligence.fact_evidence_links(source_document_id);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260607140000','cannabis_data_contract_v1_p0_p1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260607140000_cannabis_data_contract_v1_p0_p1.sql
