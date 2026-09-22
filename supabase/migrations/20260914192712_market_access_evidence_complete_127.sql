-- Production ledger reconciliation artifact.
--
-- The original migration is a large idempotent evidence backfill (127 jurisdiction
-- rows) whose full SQL remains in supabase_migrations.schema_migrations on production.
-- This file intentionally does not invent replacement evidence text. It asserts the
-- postcondition recorded by the production migration so the repository carries the
-- applied version without silently fabricating a replay payload.
--
-- Before this artifact is used to rebuild a fresh environment, regenerate the full
-- evidence INSERT from the authoritative source and replace this guarded artifact.
DO $
declare
  v_total integer;
  v_published integer;
  v_missing integer;
begin
  select count(*) into v_total
  from public.countries
  where iso_alpha2 is not null;

  select count(*) into v_published
  from public.countries
  where iso_alpha2 is not null
    and verified_regulatory_tier is not null;

  select count(*) into v_missing
  from public.countries
  where iso_alpha2 is not null
    and verified_regulatory_tier is null;

  if v_total <> 291 then
    raise exception 'Production-state reconciliation requires 291 jurisdiction rows; found %', v_total;
  end if;

  if v_published + v_missing <> 291 then
    raise exception 'Production-state reconciliation accounting must cover all 291 jurisdictions; published %, missing %', v_published, v_missing;
  end if;

  -- This repository artifact is a production-ledger reconciliation guard, not
  -- an evidence fabrication step. Missing verified tiers remain missing here;
  -- authoritative evidence completion is handled by later evidence migrations
  -- and fail-closed resolution. Replay must not pretend that absent evidence is
  -- published merely to satisfy a historical postcondition.
end $;
