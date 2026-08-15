-- Reconcile public.listings with the live production contract, immediately
-- before the first migration that seeds it.
--
-- 20260730220100 fails during zero-state replay on the first column of its
-- INSERT column list that the repository never creates:
--   insert into public.listings
--     (id, category, title, description, product_type, region, price_range, ...
--   column "price_range" of relation "listings" does not exist (SQLSTATE 42703)
--
-- price_range is not the only gap, so this restores the whole contract in one
-- place rather than one column per replay cycle. Production's public.listings
-- has 43 columns; the repository's creator
-- (20260528033000_unified_marketplace_listings.sql) builds a much narrower
-- table, and neither a CREATE TABLE nor an ALTER ... TYPE for this table
-- appears anywhere in supabase_migrations.schema_migrations -- production's
-- shape was established entirely outside recorded history, so there is no
-- recorded body to restore and no ledger chronology to preserve. Every column
-- below is taken from the live catalog (pg_attribute / pg_get_expr), not
-- inferred.
--
-- Every added column uses IF NOT EXISTS, so columns the repository already
-- builds are skipped untouched -- including their existing types. The one
-- legacy-column removal below is likewise idempotent and is backed by the live
-- catalog: listing_type does not exist in current production and no recorded
-- migration statement mentions listings.listing_type. This removes the stale
-- NOT NULL requirement created only by the repository's older zero-state
-- creator before supply-catalog seeds run.
--
-- Deliberate deviations from the live catalog, both to keep this replay-safe:
--   * Columns are added nullable even where production marks them NOT NULL.
--     Adding a NOT NULL column without a default fails if the table has rows,
--     and asserting production's nullability is not needed for replay to build
--     the same surface.
--   * Production defaults are reproduced only where they are literals. id's
--     uuid_generate_v4() default is not reproduced, because that depends on the
--     uuid-ossp extension; id already exists in replay regardless.
--
-- status is intentionally left alone here. It is converted to production's
-- listing_status enum much earlier, at 20260528033001, immediately after the
-- table is created and before any view is built over it -- the only point where
-- the type can be changed without dropping and recreating dependent views.
-- ADD COLUMN IF NOT EXISTS would skip it in any case.

-- price_range is the one enum this table needs that the repository never
-- creates. The other four (marketplace_category, region, seller_type,
-- listing_status) are created at 20260626110924. Guarded the same way.
do $$
begin
  if to_regtype('public.price_range') is null then
    create type public.price_range as enum (
      'under_100k',
      '100k_500k',
      '500k_1m',
      '1m_5m',
      '5m_plus',
      'negotiable'
    );
  end if;
end $$;

alter table public.listings
  drop column if exists listing_type;

alter table public.listings
  add column if not exists category public.marketplace_category,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists product_type text,
  add column if not exists region public.region,
  add column if not exists price_range public.price_range,
  add column if not exists seller_type public.seller_type,
  add column if not exists high_level_specs jsonb default '{}'::jsonb,
  add column if not exists internal_notes text,
  add column if not exists internal_score integer,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists legal_entity text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists superseded_by uuid,
  add column if not exists marketplace_section text default 'equipment'::text,
  add column if not exists slug text,
  add column if not exists public_visibility boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists price_amount numeric,
  add column if not exists price_currency text default 'USD'::text,
  add column if not exists location_country text,
  add column if not exists condition text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists quantity numeric,
  add column if not exists unit text,
  add column if not exists private_notes text,
  add column if not exists average_rating numeric(3,2),
  add column if not exists review_count bigint default 0,
  add column if not exists ratings_updated_at timestamptz default now(),
  add column if not exists sold_by_harbourview boolean default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb default '{}'::jsonb,
  add column if not exists target_countries text[] default '{}'::text[];
