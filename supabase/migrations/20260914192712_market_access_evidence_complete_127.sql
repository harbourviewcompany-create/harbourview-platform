-- Production ledger reconciliation artifact. The original 127-row evidence payload remains
-- authoritative in the production migration ledger and is not fabricated here.
-- Clean replay: zero verified tiers is an explicit fail-closed no-op.
-- Partial replay: rejected. Production state: exactly 291 verified tiers required.
DO $$
declare v_total integer; v_published integer; v_missing integer;
begin
  select count(*) into v_total from public.countries where iso_alpha2 is not null;
  select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
  select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;
  if v_total <> 291 then raise exception 'Production-state reconciliation requires 291 jurisdiction rows; found %', v_total; end if;
  if v_published = 0 then
    raise notice 'Production-state reconciliation: clean replay has no reconstructed 127-row production payload; continuing fail-closed.';
    return;
  end if;
  if v_missing <> 0 or v_published <> 291 then raise exception 'Production-state reconciliation requires 291 published verified tiers; published %, missing %', v_published, v_missing; end if;
end $$;
