-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260716200328.
--
-- Rewriting this file cannot affect production: 20260716200328 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs


-- ADR #20: Capital markets / deal-tracker layer
-- Closes competitive gap vs Viridian Capital Advisors (Cannabis Deal Tracker) and
-- Cannabiz Intelligence (M&A targeting/valuations). No fictional/seed data inserted —
-- schema only, to be populated via verified intake (analyst entry or sourced pipeline),
-- consistent with the supplier-seeding policy (no synthetic records in production tables).

create table if not exists public.deal_investors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  investor_type text not null check (investor_type in
    ('vc','private_equity','family_office','corporate','institutional','individual','investment_bank','other')),
  hq_country_iso2 text,
  focus_areas text[],
  website text,
  notes text,
  source_name text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_capital_raises (
  id uuid primary key default gen_random_uuid(),
  company_operator_id uuid references public.cannabis_operators(id),
  company_name text not null,
  country_iso2 text,
  round_type text check (round_type in
    ('seed','series_a','series_b','series_c','series_d_plus','debt','convertible_note',
     'private_placement','public_offering','grant','other')),
  amount_usd numeric,
  amount_raw numeric,
  amount_currency text,
  announced_date date,
  closed_date date,
  deal_status text not null default 'announced' check (deal_status in
    ('announced','closed','withdrawn','rumored')),
  use_of_proceeds text,
  source_name text,
  source_url text,
  confidence text not null default 'reported' check (confidence in ('confirmed','reported','estimated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_ma_transactions (
  id uuid primary key default gen_random_uuid(),
  acquirer_operator_id uuid references public.cannabis_operators(id),
  acquirer_name text not null,
  target_operator_id uuid references public.cannabis_operators(id),
  target_name text not null,
  transaction_type text check (transaction_type in
    ('acquisition','merger','asset_purchase','license_acquisition','majority_stake',
     'minority_stake','reverse_merger','other')),
  country_iso2 text,
  deal_value_usd numeric,
  deal_value_raw numeric,
  deal_value_currency text,
  consideration_type text check (consideration_type in
    ('cash','stock','cash_and_stock','earnout','undisclosed')),
  announced_date date,
  closed_date date,
  deal_status text not null default 'announced' check (deal_status in
    ('announced','pending','closed','terminated','rumored')),
  source_name text,
  source_url text,
  confidence text not null default 'reported' check (confidence in ('confirmed','reported','estimated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_participants (
  id uuid primary key default gen_random_uuid(),
  capital_raise_id uuid references public.deal_capital_raises(id) on delete cascade,
  investor_id uuid references public.deal_investors(id),
  investor_name text not null,
  role text not null default 'participant' check (role in ('lead','co_lead','participant','advisor')),
  created_at timestamptz not null default now()
);

create index if not exists idx_deal_capital_raises_country on public.deal_capital_raises(country_iso2);
create index if not exists idx_deal_capital_raises_date on public.deal_capital_raises(announced_date);
create index if not exists idx_deal_capital_raises_company on public.deal_capital_raises(company_name);
create index if not exists idx_deal_ma_country on public.deal_ma_transactions(country_iso2);
create index if not exists idx_deal_ma_date on public.deal_ma_transactions(announced_date);
create index if not exists idx_deal_ma_acquirer on public.deal_ma_transactions(acquirer_name);
create index if not exists idx_deal_ma_target on public.deal_ma_transactions(target_name);
create index if not exists idx_deal_participants_raise on public.deal_participants(capital_raise_id);
create index if not exists idx_deal_participants_investor on public.deal_participants(investor_id);

alter table public.deal_investors enable row level security;
alter table public.deal_capital_raises enable row level security;
alter table public.deal_ma_transactions enable row level security;
alter table public.deal_participants enable row level security;

-- Public-reference read pattern, matching market_metrics/trade_flows convention.
create policy deal_investors_public_read on public.deal_investors for select using (true);
create policy deal_capital_raises_public_read on public.deal_capital_raises for select using (true);
create policy deal_ma_transactions_public_read on public.deal_ma_transactions for select using (true);
create policy deal_participants_public_read on public.deal_participants for select using (true);

create policy deal_investors_service_write on public.deal_investors for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_capital_raises_service_write on public.deal_capital_raises for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_ma_transactions_service_write on public.deal_ma_transactions for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy deal_participants_service_write on public.deal_participants for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- api schema PostgREST-exposed views (plain SELECT, per established convention)
create or replace view api.deal_investors as select * from public.deal_investors;
create or replace view api.deal_capital_raises as select * from public.deal_capital_raises;
create or replace view api.deal_ma_transactions as select * from public.deal_ma_transactions;
create or replace view api.deal_participants as select * from public.deal_participants;

create or replace view api.deal_activity_by_country as
select
  country_iso2,
  extract(year from announced_date)::int as year,
  count(*) filter (where source = 'capital_raise') as capital_raise_count,
  sum(amount_usd) filter (where source = 'capital_raise') as capital_raised_usd,
  count(*) filter (where source = 'ma') as ma_transaction_count,
  sum(deal_value_usd) filter (where source = 'ma') as ma_value_usd
from (
  select country_iso2, announced_date, amount_usd, null::numeric as deal_value_usd, 'capital_raise' as source
  from public.deal_capital_raises
  union all
  select country_iso2, announced_date, null::numeric as amount_usd, deal_value_usd, 'ma' as source
  from public.deal_ma_transactions
) combined
group by country_iso2, extract(year from announced_date);

grant select on api.deal_investors, api.deal_capital_raises, api.deal_ma_transactions,
  api.deal_participants, api.deal_activity_by_country to anon, authenticated;
grant select, insert, update, delete on
  public.deal_investors, public.deal_capital_raises, public.deal_ma_transactions, public.deal_participants
  to service_role;
