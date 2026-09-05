-- Enforce deterministic direct publication authority per jurisdiction.
-- The base evidence migration seeds a generic NCSL Virginia row and then a more
-- specific current Virginia CCA row. Keep the CCA row active and retain the NCSL
-- row as inactive historical audit context before adding the uniqueness gate.

update public.regulatory_market_access_evidence
set active = false
where evidence_key = 'ncsl-us-va-20260831'
  and jurisdiction_iso2 = 'US-VA';

create unique index if not exists regulatory_market_access_evidence_one_active_direct
  on public.regulatory_market_access_evidence (jurisdiction_iso2)
  where active = true and parent_iso2 is null;

comment on index public.regulatory_market_access_evidence_one_active_direct is
  'At most one active direct evidence authority may publish a jurisdiction tier. Parent inheritance records are separately constrained by the resolver allowlist.';
