
alter table public.listings
  add column if not exists sold_by_harbourview boolean not null default false,
  add column if not exists sku text,
  add column if not exists stock_qty integer,
  add column if not exists lead_time_days integer,
  add column if not exists moq integer,
  add column if not exists compliance_flags jsonb not null default '{}'::jsonb,
  add column if not exists target_countries text[] not null default '{}';

create index if not exists listings_sold_by_harbourview_idx
  on public.listings (sold_by_harbourview)
  where sold_by_harbourview = true;

comment on column public.listings.sold_by_harbourview is 'True for Harbourview's own direct-sale supply catalog (consumables/equipment), false for third-party P2P marketplace listings.';
comment on column public.listings.compliance_flags is 'Per-jurisdiction compliance metadata, e.g. {"CA": {"child_resistant": true, "csa_z76_1": true, "plain_packaging": true}}';
comment on column public.listings.target_countries is 'ISO country codes this SKU is compliant/available for (e.g. {CA,DE,AU}).';
