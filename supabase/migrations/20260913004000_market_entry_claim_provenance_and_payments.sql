-- Market Entry OS: claim-level provenance and one-time report payment state.
-- This migration is fail-closed: existing evidence rows without immutable source hashes
-- remain non-executable until a real source snapshot is captured and hashed.

alter table public.market_entry_missions
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','checkout_created','paid','failed','refunded')),
  add column if not exists report_status text not null default 'locked'
    check (report_status in ('locked','generating','ready','delivered','void')),
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists report_snapshot jsonb,
  add column if not exists paid_at timestamptz,
  add column if not exists delivered_at timestamptz;

create unique index if not exists market_entry_missions_payment_intent_uidx
  on public.market_entry_missions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create table if not exists public.regulatory_market_access_claims (
  claim_id uuid primary key default gen_random_uuid(),
  evidence_key text not null references public.regulatory_market_access_evidence(evidence_key) on delete cascade,
  jurisdiction_iso2 text not null,
  claim_key text not null unique,
  claim_text text not null,
  product_class text not null check (product_class in ('any','flower','extract','finished_product','starting_material')),
  jurisdiction_scope text not null,
  authority_name text not null,
  authority_url text not null,
  source_document_id text,
  source_effective_date date,
  retrieved_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  evidence_status text not null default 'unverified'
    check (evidence_status in ('unverified','partial','verified','superseded','rejected')),
  source_snapshot_sha256 text,
  source_snapshot_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_entry_claim_freshness check (
    expires_at is null or verified_at is null or expires_at > verified_at
  )
);

create index if not exists regulatory_market_access_claims_jurisdiction_idx
  on public.regulatory_market_access_claims(jurisdiction_iso2, product_class, evidence_status);
create index if not exists regulatory_market_access_claims_evidence_idx
  on public.regulatory_market_access_claims(evidence_key);

alter table public.regulatory_market_access_claims enable row level security;
alter table public.regulatory_market_access_claims force row level security;
drop policy if exists regulatory_market_access_claims_public_read on public.regulatory_market_access_claims;
create policy regulatory_market_access_claims_public_read
  on public.regulatory_market_access_claims for select to anon, authenticated
  using (evidence_status = 'verified' and source_snapshot_sha256 is not null and expires_at > now());
revoke insert, update, delete on public.regulatory_market_access_claims from anon, authenticated;
grant select on public.regulatory_market_access_claims to anon, authenticated;

drop view if exists api.regulatory_market_access_executable_claims;
create view api.regulatory_market_access_executable_claims as
select
  c.claim_id,
  c.claim_key,
  c.evidence_key,
  c.jurisdiction_iso2,
  c.claim_text,
  c.product_class,
  c.jurisdiction_scope,
  c.authority_name,
  c.authority_url,
  c.source_document_id,
  c.source_effective_date,
  c.retrieved_at,
  c.verified_at,
  c.expires_at,
  c.source_snapshot_sha256,
  c.source_snapshot_uri
from public.regulatory_market_access_claims c
where c.evidence_status = 'verified'
  and c.authority_url <> ''
  and c.source_effective_date is not null
  and c.retrieved_at is not null
  and c.verified_at is not null
  and c.expires_at > now()
  and c.source_snapshot_sha256 is not null;
grant select on api.regulatory_market_access_executable_claims to authenticated, service_role;

-- Backfill a claim record from every existing structured evidence row. This does not
-- manufacture a source hash: the resulting claims remain partial until a source snapshot
-- is actually captured and hashed by the evidence ingestion process.
insert into public.regulatory_market_access_claims (
  evidence_key, jurisdiction_iso2, claim_key, claim_text, product_class,
  jurisdiction_scope, authority_name, authority_url, source_effective_date,
  verified_at, expires_at, evidence_status, source_snapshot_sha256
)
select
  e.evidence_key,
  e.jurisdiction_iso2,
  'market-access:' || e.evidence_key,
  e.rationale,
  'any',
  case when e.parent_iso2 is null then 'jurisdiction' else 'national_pathway_inheritance' end,
  e.authority_name,
  e.authority_url,
  e.source_effective_date,
  e.verified_at,
  e.expires_at,
  case when e.source_snapshot_sha256 is not null and e.source_effective_date is not null
       then 'verified' else 'partial' end,
  e.source_snapshot_sha256
from public.regulatory_market_access_evidence e
on conflict (claim_key) do update set
  claim_text=excluded.claim_text,
  authority_name=excluded.authority_name,
  authority_url=excluded.authority_url,
  source_effective_date=excluded.source_effective_date,
  verified_at=excluded.verified_at,
  expires_at=excluded.expires_at,
  evidence_status=case when excluded.source_snapshot_sha256 is not null and excluded.source_effective_date is not null then 'verified' else 'partial' end,
  source_snapshot_sha256=excluded.source_snapshot_sha256,
  updated_at=now();

comment on table public.regulatory_market_access_claims is
  'Claim-level regulatory provenance. A claim is executable only with authoritative source, effective date, retrieval/verification dates, current expiry, and immutable source snapshot SHA-256.';
comment on column public.regulatory_market_access_claims.source_snapshot_sha256 is
  'SHA-256 of the exact retrieved source snapshot. Never synthesize this value from metadata.';
comment on column public.market_entry_missions.payment_status is
  'One-time Market Entry OS report payment state; independent from subscription entitlements.';
