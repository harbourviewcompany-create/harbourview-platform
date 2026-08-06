-- Replay-safe reconciliation of the regulatory_signals.signals column contract.
--
-- 20260713223057 recreates api."regulatory_signals.signals" with an explicit
-- forty-three column list taken from the live table. Zero-state replay fails
-- there with: column "raw_excerpt" does not exist.
--
-- Cause: production and this repository build two different shapes of the same
-- table. 20260312000000_regulatory_signals_v1.sql creates
-- regulatory_signals.signals with "create table if not exists", and in
-- production the relation already existed out of band, so that creator was a
-- no-op there and production kept its own column set. No migration anywhere in
-- the ledger adds the seven columns below; they only ever appear in the two
-- view migrations that read them.
--
-- Comparing the two shapes at this point in history: thirty-six columns are
-- shared, seven exist only in production (added here), and seven exist only in
-- the repository (captured_at, compliance_relevance, expires_at,
-- next_review_due_at, primary_evidence_id, rejection_reason,
-- uncertainty_note). The repository-only columns are left alone -- they are
-- additive, nothing in the recorded history drops them, and the api view does
-- not select them.
--
-- Every statement is "if not exists" so this is a no-op against production and
-- against any environment that already reconciled.

alter table regulatory_signals.signals
  add column if not exists raw_excerpt text,
  add column if not exists internal_only boolean not null default true,
  add column if not exists requires_diligence boolean not null default false,
  add column if not exists linked_country_slug text,
  add column if not exists linked_product_category text,
  add column if not exists reviewer_id uuid,
  add column if not exists reviewed_at timestamptz;

-- Matches the live signals_reviewer_id_fkey.
do $reconcile_signals_reviewer_fk$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'regulatory_signals.signals'::regclass
      and conname = 'signals_reviewer_id_fkey'
  ) then
    alter table regulatory_signals.signals
      add constraint signals_reviewer_id_fkey
      foreign key (reviewer_id) references auth.users(id) on delete set null;
  end if;
end
$reconcile_signals_reviewer_fk$;
