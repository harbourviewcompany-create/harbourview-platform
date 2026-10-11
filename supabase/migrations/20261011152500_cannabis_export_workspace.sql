-- Harbourview private cannabis export operating workspace.
-- No researched counterparties or commercial assumptions are seeded here because
-- the repository is public. Sensitive rows are imported directly into production
-- after this schema is applied.
--
-- Access model:
--   * public base tables are RLS-enabled and explicitly unavailable to anon/authenticated
--   * server routes must pass requireAdminAuth() before using the service-role client
--   * no supplier_profiles rows are created; marketplace supplier approval policy remains intact

create table if not exists public.cannabis_export_accounts (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  kind text not null check (kind in ('buyer','supplier','route_partner','demand_partner')),
  company_name text not null,
  country text,
  tier text,
  score numeric,
  priority_band text,
  status text not null default 'research',
  last_verified date,
  source_urls text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cannabis_export_accounts_kind_idx
  on public.cannabis_export_accounts(kind);
create index if not exists cannabis_export_accounts_priority_idx
  on public.cannabis_export_accounts(priority_band, score desc nulls last);
create index if not exists cannabis_export_accounts_country_idx
  on public.cannabis_export_accounts(country);

create table if not exists public.cannabis_export_contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.cannabis_export_accounts(id) on delete cascade,
  contact_key text not null,
  name text not null,
  role text,
  email text,
  phone text,
  linkedin_url text,
  sequence integer,
  verification text,
  outreach_status text not null default 'not_contacted',
  last_verified date,
  source_urls text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, contact_key)
);

create index if not exists cannabis_export_contacts_account_idx
  on public.cannabis_export_contacts(account_id, sequence nulls last);

create table if not exists public.cannabis_export_products (
  id uuid primary key default gen_random_uuid(),
  supplier_account_id uuid references public.cannabis_export_accounts(id) on delete cascade,
  product_key text not null unique,
  product_name text not null,
  format_positioning text,
  thc_cbd_signal text,
  quality_signal text,
  export_evidence text,
  availability_status text,
  recommended_use text,
  last_verified date,
  source_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cannabis_export_products_supplier_idx
  on public.cannabis_export_products(supplier_account_id);

create table if not exists public.cannabis_export_matches (
  id uuid primary key default gen_random_uuid(),
  match_key text not null unique,
  buyer_account_id uuid not null references public.cannabis_export_accounts(id) on delete cascade,
  supplier_account_id uuid not null references public.cannabis_export_accounts(id) on delete cascade,
  supplier_rank integer,
  match_score numeric,
  why_match text,
  buyer_specific_offer text,
  suggested_pilot text,
  status text not null default 'not_contacted',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cannabis_export_matches_buyer_idx
  on public.cannabis_export_matches(buyer_account_id, supplier_rank);
create index if not exists cannabis_export_matches_supplier_idx
  on public.cannabis_export_matches(supplier_account_id);

create table if not exists public.cannabis_export_rfqs (
  id uuid primary key default gen_random_uuid(),
  rfq_key text not null unique,
  supplier_account_id uuid not null references public.cannabis_export_accounts(id) on delete cascade,
  contact_id uuid references public.cannabis_export_contacts(id) on delete set null,
  priority integer,
  subject text,
  email_draft text,
  linkedin_opening text,
  primary_ask text,
  why_now text,
  status text not null default 'drafted',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cannabis_export_rfqs_supplier_idx
  on public.cannabis_export_rfqs(supplier_account_id, priority);

create table if not exists public.cannabis_export_deals (
  id uuid primary key default gen_random_uuid(),
  deal_key text not null unique,
  buyer_account_id uuid not null references public.cannabis_export_accounts(id) on delete cascade,
  supplier_account_id uuid references public.cannabis_export_accounts(id) on delete set null,
  market text,
  product_concept text not null,
  target_kg numeric,
  expected_sell_cad_per_g numeric,
  target_gross_margin numeric,
  non_supplier_variable_cad_per_g numeric,
  max_supplier_buy_cad_per_g numeric generated always as (
    greatest(
      0::numeric,
      coalesce(expected_sell_cad_per_g, 0::numeric)
        * (1::numeric - coalesce(target_gross_margin, 0::numeric))
        - coalesce(non_supplier_variable_cad_per_g, 0::numeric)
    )
  ) stored,
  public_supply_benchmark_cad_per_g numeric,
  buyer_status text not null default 'not_contacted',
  supplier_status text not null default 'not_contacted',
  next_action text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cannabis_export_deals_buyer_idx
  on public.cannabis_export_deals(buyer_account_id);
create index if not exists cannabis_export_deals_supplier_idx
  on public.cannabis_export_deals(supplier_account_id);

create table if not exists public.cannabis_export_benchmarks (
  id uuid primary key default gen_random_uuid(),
  benchmark_key text not null unique,
  name text not null,
  period text,
  cad_per_g numeric,
  source_url text,
  payload jsonb not null default '{}'::jsonb,
  last_verified date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cannabis_export_tasks (
  id uuid primary key default gen_random_uuid(),
  task_key text not null unique,
  day_number integer,
  action text not null,
  account_key text,
  owner_label text,
  expected_output text,
  dependency text,
  status text not null default 'not_started',
  due_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cannabis_export_accounts enable row level security;
alter table public.cannabis_export_contacts enable row level security;
alter table public.cannabis_export_products enable row level security;
alter table public.cannabis_export_matches enable row level security;
alter table public.cannabis_export_rfqs enable row level security;
alter table public.cannabis_export_deals enable row level security;
alter table public.cannabis_export_benchmarks enable row level security;
alter table public.cannabis_export_tasks enable row level security;

revoke all on table public.cannabis_export_accounts from public, anon, authenticated;
revoke all on table public.cannabis_export_contacts from public, anon, authenticated;
revoke all on table public.cannabis_export_products from public, anon, authenticated;
revoke all on table public.cannabis_export_matches from public, anon, authenticated;
revoke all on table public.cannabis_export_rfqs from public, anon, authenticated;
revoke all on table public.cannabis_export_deals from public, anon, authenticated;
revoke all on table public.cannabis_export_benchmarks from public, anon, authenticated;
revoke all on table public.cannabis_export_tasks from public, anon, authenticated;

grant select, insert, update, delete on table public.cannabis_export_accounts to service_role;
grant select, insert, update, delete on table public.cannabis_export_contacts to service_role;
grant select, insert, update, delete on table public.cannabis_export_products to service_role;
grant select, insert, update, delete on table public.cannabis_export_matches to service_role;
grant select, insert, update, delete on table public.cannabis_export_rfqs to service_role;
grant select, insert, update, delete on table public.cannabis_export_deals to service_role;
grant select, insert, update, delete on table public.cannabis_export_benchmarks to service_role;
grant select, insert, update, delete on table public.cannabis_export_tasks to service_role;

comment on table public.cannabis_export_accounts is
  'Private Harbourview cannabis export buyer/supplier/route-partner intelligence. Never project directly to public marketplace surfaces.';
comment on table public.cannabis_export_contacts is
  'Private decision-maker and outreach records for cannabis export intelligence.';
comment on table public.cannabis_export_deals is
  'Private buyer-supplier deal economics and negotiation state for cannabis export opportunities.';
