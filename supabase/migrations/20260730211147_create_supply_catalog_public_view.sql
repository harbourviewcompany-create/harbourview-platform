-- Zero-state replay: this view selects columns on public.listings that are
-- added by 20260730220050_reconcile_listings_production_columns.sql, which
-- sorts LATER than this file. A from-scratch replay driven purely by filename
-- order therefore fails here with "column l.brand does not exist". Supabase's
-- native preview-branch integration replays that way; it does not run
-- scripts/prepare-production-faithful-migration-replay.mjs, whose
-- REPLAY_RELOCATIONS list already moves that file ahead of this one.
--
-- The reconcile block is copied verbatim below so this file is self-contained
-- regardless of which migration runs first, following the same approach used
-- for the corridor tables in 20260701180751_remote_applied_repair.sql. Every
-- clause is ADD COLUMN IF NOT EXISTS, so it is a no-op against production and
-- against the later reconcile migration alike -- no column is redefined and no
-- default is changed.
-- The guarded relaxation below is copied from the same reconcile migration and
-- must precede the column block: the seed migrations that follow this view
-- insert rows without a listing_type, which the original NOT NULL constraint
-- rejects. Both branches are existence-checked, so this is a no-op wherever
-- the constraint has already been dropped -- production included.
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_constraint con
    where con.conrelid = 'public.listings'::regclass
      and con.conname = 'listings_listing_type_check'
  ) then
    alter table public.listings drop constraint listings_listing_type_check;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'listings'
      and a.attname = 'listing_type'
      and a.attnum > 0
      and not a.attisdropped
      and a.attnotnull
  ) then
    alter table public.listings alter column listing_type drop not null;
  end if;
end $$;

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

create or replace view api.supply_catalog_v1
with (security_invoker = on) as
select
  l.id,
  l.slug,
  l.title,
  l.description,
  l.category,
  l.marketplace_section,
  l.sku,
  l.brand,
  l.model,
  l.condition,
  l.quantity,
  l.unit,
  l.price_amount,
  l.price_currency,
  l.price_range,
  l.stock_qty,
  l.lead_time_days,
  l.moq,
  l.compliance_flags,
  l.target_countries,
  l.is_featured,
  l.average_rating,
  l.review_count,
  l.created_at,
  l.updated_at
from public.listings l
where l.sold_by_harbourview = true
  and l.status = 'approved'
  and l.public_visibility = true;

grant select on api.supply_catalog_v1 to anon, authenticated;
