-- Harbourview native transaction system: Stage 5 append-only economics + transaction decisions.

create type public.hv_economics_metric_type as enum (
  'estimated_gtv','modeled_gtv','evidenced_gtv','contracted_gtv','transacted_gtv',
  'harbourview_addressable_revenue','harbourview_accrued_revenue','harbourview_invoiced_revenue','harbourview_collected_revenue',
  'cost','gross_margin','other'
);
create type public.hv_economics_basis as enum (
  'unknown','scenario','modeled','primary_evidence','contract','invoice','settlement'
);
create type public.hv_economics_status as enum (
  'draft','provisional','validated','superseded','void'
);
create type public.hv_transaction_decision_type as enum (
  'qualify','advance','hold','reject','approve_diligence','reject_diligence','approve_economics','select_counterparty',
  'authorize_proposal','authorize_contract','close_won','close_lost','cancel','reopen'
);
create type public.hv_decision_status as enum (
  'pending','approved','rejected','superseded'
);

create table public.transaction_economics_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  network_id uuid references public.transaction_networks(id) on delete restrict,
  metric_type public.hv_economics_metric_type not null,
  basis public.hv_economics_basis not null,
  status public.hv_economics_status not null default 'draft',
  amount numeric(20,6),
  currency text,
  quantity numeric(20,6),
  quantity_unit text,
  unit_rate numeric(20,6),
  formula_text text,
  calculation_inputs jsonb not null default '{}'::jsonb,
  evidence_id uuid references public.hv_evidence(id) on delete restrict,
  assertion_id uuid references public.assertions(id) on delete restrict,
  contract_document_id uuid references public.hv_evidence_documents(id) on delete restrict,
  effective_at timestamptz,
  recognized_at timestamptz,
  scenario_only boolean not null default false,
  recognition_key text not null,
  visibility_scope public.hv_visibility_scope not null default 'platform_only',
  specific_party_id uuid,
  classification public.hv_classification not null default 'confidential',
  supersedes_entry_id uuid references public.transaction_economics_entries(id) on delete restrict,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint transaction_economics_amount_chk check (
    amount is null or amount >= 0 or metric_type = 'gross_margin'
  ),
  constraint transaction_economics_quantity_chk check (quantity is null or quantity >= 0),
  constraint transaction_economics_rate_chk check (unit_rate is null or unit_rate >= 0),
  constraint transaction_economics_currency_chk check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint transaction_economics_key_chk check (length(btrim(recognition_key)) > 0),
  constraint transaction_economics_specific_party_chk check (
    visibility_scope <> 'specific_party' or specific_party_id is not null
  ),
  constraint transaction_economics_specific_party_transaction_fk foreign key (specific_party_id, transaction_id)
    references public.transaction_parties(id, transaction_id)
    on delete restrict,
  constraint transaction_economics_primary_evidence_chk check (
    basis <> 'primary_evidence' or evidence_id is not null or assertion_id is not null
  ),
  constraint transaction_economics_contract_chk check (
    basis <> 'contract' or contract_document_id is not null
  ),
  constraint transaction_economics_transacted_basis_chk check (
    metric_type <> 'transacted_gtv' or basis in ('primary_evidence','invoice','settlement')
  ),
  constraint transaction_economics_scenario_chk check (
    (scenario_only and basis = 'scenario') or (not scenario_only and basis <> 'scenario')
  ),
  constraint transaction_economics_supersedes_chk check (supersedes_entry_id is null or supersedes_entry_id <> id)
);
create index transaction_economics_transaction_idx on public.transaction_economics_entries (transaction_id, metric_type, created_at desc);
create index transaction_economics_network_idx on public.transaction_economics_entries (network_id, metric_type) where network_id is not null;
create index transaction_economics_recognition_idx on public.transaction_economics_entries (recognition_key, status, scenario_only);
create index transaction_economics_supersedes_idx on public.transaction_economics_entries (supersedes_entry_id) where supersedes_entry_id is not null;
create index transaction_economics_evidence_idx on public.transaction_economics_entries (evidence_id) where evidence_id is not null;

create or replace function public.hv_validate_economics_recognition_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  current_leaf uuid;
  parent_tx uuid;
  parent_key text;
begin
  -- Serialize authoritative inserts by recognition event. Without this lock, two concurrent
  -- first inserts can both observe no current leaf and double-book the same economic event.
  if new.status = 'validated' and not new.scenario_only then
    perform pg_advisory_xact_lock(hashtextextended(new.recognition_key, 0));
  end if;

  if new.supersedes_entry_id is not null then
    select transaction_id, recognition_key
      into parent_tx, parent_key
      from public.transaction_economics_entries
     where id = new.supersedes_entry_id;

    if parent_tx is null then
      raise exception 'supersedes_entry_id % does not exist', new.supersedes_entry_id;
    end if;
    if parent_tx <> new.transaction_id or parent_key <> new.recognition_key then
      raise exception 'economics supersession must remain in the same transaction and recognition_key';
    end if;
  end if;

  if new.status = 'validated' and not new.scenario_only then
    select e.id
      into current_leaf
      from public.transaction_economics_entries e
     where e.recognition_key = new.recognition_key
       and e.status = 'validated'
       and not e.scenario_only
       and not exists (
         select 1
           from public.transaction_economics_entries child
          where child.supersedes_entry_id = e.id
            and child.status = 'validated'
            and not child.scenario_only
       )
     order by e.created_at desc, e.id desc
     limit 1;

    if current_leaf is not null and new.supersedes_entry_id is distinct from current_leaf then
      raise exception 'validated recognition_key % already has current entry %; replacement must explicitly supersede it',
        new.recognition_key, current_leaf;
    end if;
  end if;

  return new;
end;
$$;

create trigger transaction_economics_recognition_chain
before insert on public.transaction_economics_entries
for each row execute function public.hv_validate_economics_recognition_chain();

create or replace function public.hv_prevent_economics_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'transaction_economics_entries is append-only; insert a superseding entry instead';
end;
$$;

create trigger transaction_economics_append_only
before update or delete on public.transaction_economics_entries
for each row execute function public.hv_prevent_economics_mutation();

create table public.transaction_decisions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  decision_type public.hv_transaction_decision_type not null,
  status public.hv_decision_status not null default 'pending',
  decision_note text,
  previous_stage public.hv_transaction_stage,
  new_stage public.hv_transaction_stage,
  evidence_ids uuid[] not null default '{}'::uuid[],
  assertion_ids uuid[] not null default '{}'::uuid[],
  economics_entry_ids uuid[] not null default '{}'::uuid[],
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  classification public.hv_classification not null default 'confidential',
  supersedes_decision_id uuid references public.transaction_decisions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transaction_decisions_stage_change_chk check (
    new_stage is null or previous_stage is distinct from new_stage
  ),
  constraint transaction_decisions_supersedes_chk check (supersedes_decision_id is null or supersedes_decision_id <> id)
);
create index transaction_decisions_transaction_idx on public.transaction_decisions (transaction_id, decided_at desc);
create index transaction_decisions_type_idx on public.transaction_decisions (decision_type, status);

-- commissions exists on the live project but is production drift, so the bridge is replay-safe.
alter table if exists public.commissions
  add column if not exists economics_entry_id uuid references public.transaction_economics_entries(id) on delete set null;
do $$
begin
  if to_regclass('public.commissions') is not null then
    execute 'create index if not exists commissions_economics_entry_idx on public.commissions (economics_entry_id) where economics_entry_id is not null';
  end if;
end;
$$;

comment on table public.transaction_economics_entries is 'Append-only economics ledger. Stronger evidence is appended with supersedes_entry_id; authoritative inserts are serialized by recognition key; GTV and Harbourview revenue remain distinct metrics.';
comment on table public.transaction_decisions is 'Evidence/economics-aware commercial decisions, separate from hv_review_decisions publication governance.';
