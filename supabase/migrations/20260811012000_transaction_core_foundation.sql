-- Harbourview native transaction system: Stage 3 transaction core.

create type public.hv_transaction_stage as enum (
  'discovery','qualified','evidence_requested','diligence','economics_validated','proposal','negotiation','contracted','transacting','completed','lost','cancelled','archived'
);
create type public.hv_transaction_type as enum (
  'sale','purchase','testing_service','manufacturing_service','distribution','licensing','market_access','partnership','procurement','acquisition','investment','advisory','other'
);
create type public.hv_party_role as enum (
  'buyer','seller','supplier','manufacturer','laboratory','distributor','importer','exporter','regulator','government','implementation_partner','university','investor','advisor','harbourview','other'
);
create type public.hv_network_status as enum (
  'identified','qualifying','active','contracted','completed','abandoned','archived'
);
create type public.hv_visibility_scope as enum (
  'platform_only','transaction_parties','specific_party','public_projection'
);

create or replace function public.hv_transaction_network_key(
  jurisdiction_code text,
  buyer_account_id uuid,
  seller_account_id uuid,
  transaction_object text,
  commercial_period text
)
returns text
language plpgsql
immutable
strict
set search_path = public
as $$
begin
  if jurisdiction_code like '%|%'
     or transaction_object like '%|%'
     or commercial_period like '%|%' then
    raise exception 'transaction network key inputs cannot contain pipe separators';
  end if;

  if length(btrim(jurisdiction_code)) = 0
     or length(btrim(transaction_object)) = 0
     or length(btrim(commercial_period)) = 0 then
    raise exception 'transaction network key inputs cannot be empty';
  end if;

  return concat_ws('|',
    'NETWORK',
    upper(btrim(jurisdiction_code)),
    buyer_account_id::text,
    seller_account_id::text,
    lower(regexp_replace(btrim(transaction_object), '\s+', '-', 'g')),
    upper(regexp_replace(btrim(commercial_period), '\s+', '-', 'g'))
  );
end;
$$;

create table public.transaction_networks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction_code text,
  trigger_artifact_id uuid references public.hv_artifacts(id) on delete set null,
  trigger_signal_id text,
  commercial_thesis text,
  transaction_object_type text not null,
  status public.hv_network_status not null default 'identified',
  double_count_key text not null,
  classification public.hv_classification not null default 'confidential',
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_networks_key_chk check (double_count_key like 'NETWORK|%'),
  constraint transaction_networks_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  unique (double_count_key)
);
create index transaction_networks_status_idx on public.transaction_networks (status);
create index transaction_networks_jurisdiction_idx on public.transaction_networks (jurisdiction_code) where jurisdiction_code is not null;
create index transaction_networks_trigger_artifact_idx on public.transaction_networks (trigger_artifact_id) where trigger_artifact_id is not null;
create trigger transaction_networks_set_updated_at
before update on public.transaction_networks
for each row execute function public.hv_transaction_set_updated_at();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  network_id uuid references public.transaction_networks(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  economic_account_id uuid references public.economic_accounts(id) on delete set null,
  transaction_type public.hv_transaction_type not null,
  title text not null,
  description text,
  stage public.hv_transaction_stage not null default 'discovery',
  jurisdiction_code text,
  currency text,
  target_decision_date date,
  expected_close_date date,
  contracted_at timestamptz,
  completed_at timestamptz,
  lost_at timestamptz,
  loss_reason text,
  classification public.hv_classification not null default 'confidential',
  created_by uuid references auth.users(id) on delete set null,
  owned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_currency_chk check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint transactions_completed_stage_chk check (completed_at is null or stage in ('completed','archived')),
  constraint transactions_lost_stage_chk check (lost_at is null or stage in ('lost','archived')),
  constraint transactions_terminal_outcome_chk check (not (completed_at is not null and lost_at is not null))
);
create index transactions_network_idx on public.transactions (network_id) where network_id is not null;
create index transactions_opportunity_idx on public.transactions (opportunity_id) where opportunity_id is not null;
create index transactions_account_idx on public.transactions (economic_account_id) where economic_account_id is not null;
create index transactions_stage_idx on public.transactions (stage, target_decision_date);
create index transactions_owner_idx on public.transactions (owned_by) where owned_by is not null;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.hv_transaction_set_updated_at();

create table public.transaction_parties (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete cascade,
  economic_account_id uuid references public.economic_accounts(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  party_role public.hv_party_role not null,
  contracting_entity boolean not null default false,
  budget_owner boolean not null default false,
  procurement_owner boolean not null default false,
  signatory_required boolean not null default false,
  signatory_status text,
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  classification public.hv_classification not null default 'confidential',
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  constraint transaction_parties_target_chk check (num_nonnulls(entity_id, economic_account_id, workspace_id) >= 1),
  constraint transaction_parties_validity_chk check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint transaction_parties_specific_visibility_chk check (visibility_scope <> 'specific_party'),
  constraint transaction_parties_id_transaction_unique unique (id, transaction_id)
);
create unique index transaction_parties_identity_uidx
  on public.transaction_parties (
    transaction_id,
    party_role,
    coalesce(entity_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(economic_account_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index transaction_parties_transaction_idx on public.transaction_parties (transaction_id);
create index transaction_parties_workspace_idx on public.transaction_parties (workspace_id) where workspace_id is not null;
create index transaction_parties_account_idx on public.transaction_parties (economic_account_id) where economic_account_id is not null;

-- Existing-domain compatibility changes are nullable foreign-key bridges only.
-- Existing APIs continue reading their existing fields.
alter table public.opportunities
  add column if not exists entity_id uuid references public.entities(id) on delete set null,
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists trigger_artifact_id uuid references public.hv_artifacts(id) on delete set null,
  add column if not exists transaction_network_id uuid references public.transaction_networks(id) on delete set null;

alter table public.matches
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists transaction_network_id uuid references public.transaction_networks(id) on delete set null;

alter table public.deal_rooms
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;
create unique index if not exists deal_rooms_transaction_uidx on public.deal_rooms (transaction_id) where transaction_id is not null;

-- engagements/commissions exist on the live project but are production-drift tables that are not
-- defined by the repository migration replay. Guard these bridges so fresh repository replays remain valid.
alter table if exists public.engagements
  add column if not exists economic_account_id uuid references public.economic_accounts(id) on delete set null,
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;
alter table if exists public.commissions
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

create index if not exists opportunities_entity_idx on public.opportunities (entity_id) where entity_id is not null;
create index if not exists opportunities_economic_account_idx on public.opportunities (economic_account_id) where economic_account_id is not null;
create index if not exists opportunities_transaction_network_idx on public.opportunities (transaction_network_id) where transaction_network_id is not null;
create index if not exists matches_opportunity_idx on public.matches (opportunity_id) where opportunity_id is not null;
create index if not exists matches_transaction_network_idx on public.matches (transaction_network_id) where transaction_network_id is not null;

do $$
begin
  if to_regclass('public.engagements') is not null then
    execute 'create index if not exists engagements_economic_account_idx on public.engagements (economic_account_id) where economic_account_id is not null';
    execute 'create index if not exists engagements_transaction_idx on public.engagements (transaction_id) where transaction_id is not null';
  end if;
  if to_regclass('public.commissions') is not null then
    execute 'create index if not exists commissions_transaction_idx on public.commissions (transaction_id) where transaction_id is not null';
  end if;
end;
$$;

comment on table public.transaction_networks is 'Economic grouping/double-counting control. IA graph remains the discovery graph.';
comment on table public.transactions is 'Canonical Harbourview-facilitated commercial transaction; deal_rooms remain execution/collaboration surfaces.';
comment on table public.transaction_parties is 'Generic transaction participant model used for contracting roles and participant-safe authorization.';
