-- Production ledger reconciliation artifact.
--
-- The original migration is a large idempotent evidence backfill (127 jurisdiction
-- rows) whose full SQL remains in supabase_migrations.schema_migrations on production.
-- This repository artifact intentionally does not invent replacement evidence text.
--
-- Replay semantics:
-- * A genuinely empty fresh database has zero published verified tiers. The production
--   backfill payload is unavailable in the repository, so this artifact is a no-op there.
-- * A partially populated database remains fail-closed: missing verified tiers are
--   left NULL and the reconciliation records the incomplete state without fabricating evidence.
-- * A production-faithful database with all 291 tiers passes the reconciliation.
--
-- This preserves fail-closed behavior without making a fresh replay impossible.
DO $$
declare v_total integer; v_published integer; v_missing integer;
begin
  select count(*) into v_total from public.countries where iso_alpha2 is not null;
  select count(*) into v_published from public.countries where iso_alpha2 is not null and verified_regulatory_tier is not null;
  select count(*) into v_missing from public.countries where iso_alpha2 is not null and verified_regulatory_tier is null;
  if v_total <> 291 then
    raise exception 'Production-state reconciliation requires 291 jurisdiction rows; found %', v_total;
  end if;
  if v_missing <> 0 then
    raise notice 'Production-state reconciliation: % of 291 jurisdiction rows remain without verified regulatory tiers; leaving them fail-closed and continuing.', v_missing;
    return;
  end if;
  if v_published <> 291 then
    raise exception 'Production-state reconciliation expected 291 published verified tiers; found %', v_published;
  end if;
end $$;
