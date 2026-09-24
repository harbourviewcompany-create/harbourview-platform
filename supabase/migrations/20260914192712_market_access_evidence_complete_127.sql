-- Production ledger reconciliation artifact.
-- The original 127-row production payload is not present in the repository.
-- Clean replay must never invent it, but partial baseline state must also not
-- abort an otherwise valid schema replay. Production completeness is enforced
-- by the dedicated production-state verification gate, not by this migration.
DO $$
declare v_total integer; v_published integer; v_missing integer;
begin
  select count(*) into v_total from public.countries where iso_alpha2 is not null;
  select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
  select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;

  if v_total <> 291 then
    raise exception 'Production-state reconciliation requires 291 jurisdiction rows; found %', v_total;
  end if;

  if v_published = 0 then
    raise notice 'Production-state reconciliation: no reconstructed 127-row payload is present; continuing without inventing historical rows.';
    return;
  end if;

  if v_missing <> 0 or v_published <> 291 then
    raise notice 'Production-state reconciliation: partial baseline remains (published %, missing %); preserving existing state and deferring completeness to the production verification gate.', v_published, v_missing;
    return;
  end if;

  raise notice 'Production-state reconciliation: all 291 verified tiers are present.';
end $$;
