-- Backs the public /intelligence/watchlists page, which currently renders
-- static boilerplate with no live data source (content-gap audit, July 2026).
--
-- Deliberately NOT named `watchlists` -- public.watchlists already exists and
-- is unrelated internal source-monitoring config (jurisdiction/scope targets
-- consumed by the crawler via source_watchlist_links). Reusing that name
-- across schemas for a different concept is exactly what caused confusion
-- during this audit; `watchlist_collections` in the regulatory_signals
-- schema keeps the two systems unambiguous.
--
-- A "watchlist" here is a named, curated grouping of one or more
-- regulatory_signals.signals rows (e.g. "EU Novel Food Reform Watch",
-- "US State Adult-Use Rollouts"). It reuses the signals table as the
-- underlying content and review pipeline rather than introducing a second,
-- parallel content type and a second analyst-review workflow -- signals are
-- already gated by review_status / public_safe / publish_to_public, and
-- regulatory_signals.public_signals already implements exactly this pattern
-- for individual signals. This migration adds the same gate at the
-- collection level and lets a collection reference many already-reviewed
-- signals.
--
-- Verified before writing this: regulatory_signals.signals currently has
-- zero rows, so this migration ships the schema + RLS only. Nothing will
-- render on the public page until content actually exists on both sides.
-- That's a content/ops task (populating signals, then grouping them into
-- collections), not a follow-up migration.

create table if not exists regulatory_signals.watchlist_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  scope_type text not null check (scope_type in ('country', 'region', 'global', 'topic')),
  country_code text,
  region text,
  display_priority integer not null default 0,

  -- Same three-flag review gate as regulatory_signals.signals, kept
  -- independent of the underlying signals' own gate: a collection can be
  -- in draft while it references signals that are individually already
  -- public, and vice versa is blocked by the view below.
  review_status text not null default 'draft'
    check (review_status in ('draft', 'in_review', 'published', 'archived')),
  public_safe boolean not null default false,
  publish_to_public boolean not null default false,

  published_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table regulatory_signals.watchlist_collections is
  'Named, curated groupings of regulatory_signals.signals for the public /intelligence/watchlists page. Analyst-reviewed, not auto-published.';

create trigger watchlist_collections_set_updated_at
  before update on regulatory_signals.watchlist_collections
  for each row execute function public.set_updated_at();

create index if not exists watchlist_collections_published_idx
  on regulatory_signals.watchlist_collections (display_priority)
  where review_status = 'published' and public_safe = true and publish_to_public = true;

create index if not exists watchlist_collections_country_idx
  on regulatory_signals.watchlist_collections (country_code);

-- Join table: which signals belong to which collection, and in what order.
create table if not exists regulatory_signals.watchlist_collection_signals (
  watchlist_collection_id uuid not null
    references regulatory_signals.watchlist_collections (id) on delete cascade,
  signal_id uuid not null
    references regulatory_signals.signals (id) on delete cascade,
  display_order integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (watchlist_collection_id, signal_id)
);

comment on table regulatory_signals.watchlist_collection_signals is
  'Membership: which regulatory_signals.signals rows appear in which watchlist_collections row, and in what order.';

alter table regulatory_signals.watchlist_collections enable row level security;
alter table regulatory_signals.watchlist_collection_signals enable row level security;

create policy "service role all watchlist_collections"
  on regulatory_signals.watchlist_collections
  for all
  to service_role
  using (true)
  with check (true);

create policy "service role all watchlist_collection_signals"
  on regulatory_signals.watchlist_collection_signals
  for all
  to service_role
  using (true)
  with check (true);

-- Public-safe view, same shape/intent as regulatory_signals.public_signals:
-- only fully-published, public-safe collection metadata, no internal
-- review fields (review_status, last_reviewed_at, etc. stay server-side).
create or replace view regulatory_signals.public_watchlist_collections as
select
  id,
  slug,
  title,
  description,
  scope_type,
  country_code,
  region,
  display_priority,
  published_at
from regulatory_signals.watchlist_collections
where review_status = 'published'
  and public_safe = true
  and publish_to_public = true;

-- Convenience joined view for the page: collection metadata + its member
-- signals' already-public-safe fields, in one query. Both sides of the join
-- must independently qualify as published/public-safe -- a published
-- collection does not implicitly expose an unpublished signal, and a
-- published signal does not leak through an unpublished collection.
create or replace view regulatory_signals.public_watchlist_collection_signals as
select
  wc.id as watchlist_collection_id,
  wc.slug as watchlist_slug,
  wc.title as watchlist_title,
  wcs.display_order,
  ps.id as signal_id,
  ps.slug as signal_slug,
  ps.headline,
  ps.signal_type,
  ps.confidence,
  ps.impact_level,
  ps.country_code,
  ps.country_name,
  ps.region,
  ps.jurisdiction,
  ps.regulator_name,
  ps.signal_date,
  ps.public_summary,
  ps.public_implication,
  ps.published_at as signal_published_at
from regulatory_signals.watchlist_collections wc
join regulatory_signals.watchlist_collection_signals wcs
  on wcs.watchlist_collection_id = wc.id
join regulatory_signals.public_signals ps
  on ps.id = wcs.signal_id
where wc.review_status = 'published'
  and wc.public_safe = true
  and wc.publish_to_public = true
order by wc.display_priority, wcs.display_order;

grant select on regulatory_signals.public_watchlist_collections to anon, authenticated;
grant select on regulatory_signals.public_watchlist_collection_signals to anon, authenticated;

-- Expose through the api schema, matching the current project convention
-- (see 20260710150000_expose_education_sections_and_playbooks.sql) rather
-- than granting directly on public/regulatory_signals schema objects.
create or replace view api.watchlist_collections as
  select * from regulatory_signals.public_watchlist_collections;
grant select on api.watchlist_collections to anon, authenticated;

create or replace view api.watchlist_collection_signals as
  select * from regulatory_signals.public_watchlist_collection_signals.
grant select on api.watchlist_collection_signals to anon, authenticated;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
