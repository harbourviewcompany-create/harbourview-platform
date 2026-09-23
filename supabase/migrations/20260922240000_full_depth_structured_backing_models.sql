-- Structured backing models for the previously identified depth gaps.
create table if not exists public.jurisdiction_regulatory_rules (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  rule_dimension text not null check (rule_dimension in ('access_rules','commercial_activity','import','export','distribution','testing','packaging_labeling','tax_fees')),
  rule_type text not null,
  rule_value jsonb not null,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jurisdiction_regulatory_rules_jurisdiction_idx on public.jurisdiction_regulatory_rules(jurisdiction_key,rule_dimension);
create index if not exists jurisdiction_regulatory_rules_status_idx on public.jurisdiction_regulatory_rules(verification_status);

create table if not exists public.jurisdiction_regulators (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  regulator_name text not null,
  regulator_type text not null,
  authority_scope text not null,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jurisdiction_regulatory_changes (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  dimension_key text not null references public.jurisdiction_data_depth_dimensions(dimension_key),
  change_type text not null,
  previous_value jsonb,
  new_value jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  announced_at timestamptz,
  effective_at timestamptz,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists jurisdiction_regulatory_changes_idx on public.jurisdiction_regulatory_changes(jurisdiction_key,dimension_key,effective_at desc);

create table if not exists public.jurisdiction_market_participants (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  participant_type text not null check (participant_type in ('participant','buyer','seller','counterparty')),
  name text not null,
  role text,
  status text,
  source_url text not null,
  source_snapshot_id uuid,
  effective_from date,
  effective_to date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jurisdiction_market_participants_idx on public.jurisdiction_market_participants(jurisdiction_key,participant_type);

create table if not exists public.jurisdiction_relationships (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  from_entity_id uuid,
  to_entity_id uuid,
  relationship_type text not null,
  evidence jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  confidence text not null default 'unknown' check (confidence in ('high','medium','low','unknown')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.jurisdiction_opportunities (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_key text not null,
  opportunity_type text not null,
  description text not null,
  evidence jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_snapshot_id uuid,
  confidence text not null default 'unknown' check (confidence in ('high','medium','low','unknown')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified','superseded','conflict')),
  effective_from date,
  effective_to date,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Explicit research work for every unresolved contract cell.
insert into public.jurisdiction_data_depth_tasks
(jurisdiction_key,dimension_key,jurisdiction_level,status,priority,evidence_required,notes)
select
  s.jurisdiction_key,
  s.dimension_key,
  c.jurisdiction_level,
  case
    when s.applicability='unknown' then 'open'
    when s.status in ('missing','unmeasured','stale','blocked','conflict') then 'open'
    else 'verified'
  end,
  case when d.required_for_regulatory_publication then 100 else 50 end,
  d.requires_primary_source,
  case
    when s.applicability='unknown' then 'Applicability must be established from authoritative jurisdiction-specific evidence.'
    when s.status='stale' then 'Existing evidence has exceeded the dimension freshness window.'
    when s.status='conflict' then 'Conflicting evidence requires documented resolution.'
    when s.status='blocked' then 'Evidence requirement is blocked and requires research resolution.'
    when s.status in ('missing','unmeasured') then 'Structured evidence required; no completion inferred.'
    else 'Existing contract state verified.'
  end
from public.jurisdiction_data_depth_dimension_state s
join public.countries c on c.iso_alpha2=s.jurisdiction_key
join public.jurisdiction_data_depth_dimensions d on d.dimension_key=s.dimension_key and d.contract_version=s.contract_version
where s.contract_version='2026-09-22.v1'
on conflict do nothing;

alter table public.jurisdiction_regulatory_rules enable row level security;
alter table public.jurisdiction_regulators enable row level security;
alter table public.jurisdiction_regulatory_changes enable row level security;
alter table public.jurisdiction_market_participants enable row level security;
alter table public.jurisdiction_relationships enable row level security;
alter table public.jurisdiction_opportunities enable row level security;

create policy jurisdiction_regulatory_rules_read on public.jurisdiction_regulatory_rules for select to anon,authenticated using (true);
create policy jurisdiction_regulators_read on public.jurisdiction_regulators for select to anon,authenticated using (true);
create policy jurisdiction_regulatory_changes_read on public.jurisdiction_regulatory_changes for select to anon,authenticated using (true);
create policy jurisdiction_market_participants_read on public.jurisdiction_market_participants for select to anon,authenticated using (true);
create policy jurisdiction_relationships_read on public.jurisdiction_relationships for select to anon,authenticated using (true);
create policy jurisdiction_opportunities_read on public.jurisdiction_opportunities for select to anon,authenticated using (true);

grant select on public.jurisdiction_regulatory_rules,public.jurisdiction_regulators,public.jurisdiction_regulatory_changes,public.jurisdiction_market_participants,public.jurisdiction_relationships,public.jurisdiction_opportunities to anon,authenticated;

comment on table public.jurisdiction_regulatory_rules is 'Structured jurisdiction-specific commercial/regulatory rules. Empty rows never imply permission or prohibition.';
comment on table public.jurisdiction_regulatory_changes is 'Versioned regulatory changes with source provenance and effective dates.';
comment on table public.jurisdiction_market_participants is 'Evidence-backed participant/buyer/seller/counterparty records; unverified rows do not satisfy depth.';
