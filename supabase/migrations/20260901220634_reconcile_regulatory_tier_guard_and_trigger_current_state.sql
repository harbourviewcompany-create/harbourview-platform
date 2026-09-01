-- Reconciliation migration, not a literal replay of history.
--
-- Three migrations were applied directly to production without ever being committed
-- to this repo, and their exact incremental SQL was not preserved on the authoring
-- side (they were applied ad hoc, outside this session):
--   20260830191900  fix_market_access_status_trigger_type_resolution
--   20260830192000  regulatory_tier_authority_write_guard
--   20260830193000  fix_regulatory_tier_guard_transaction_timestamp
--
-- Rather than guess at the intermediate diffs, this migration brings a fresh database
-- to the current live definitions of the two objects those three migrations produced,
-- dumped directly from production via pg_get_functiondef()/pg_get_triggerdef() at
-- authoring time. It is idempotent (CREATE OR REPLACE / DROP+CREATE TRIGGER) and safe
-- to run on a database that already has these objects in this state.
--
-- guard_regulatory_tier_write_contract() enforces that any UPDATE of
-- countries.regulatory_tier: (1) refreshes regulatory_tier_source_hash to match the
-- current canonical briefing text, (2) sets regulatory_tier_last_derived_at, and
-- (3) comes from an approved mutation source (the set_regulatory_tier RPC, the
-- classifier, an Airtable edit/poll, or a live canonical-briefing-change job) --
-- rejecting any other direct write. This is the guard that started rejecting raw
-- UPDATE ... SET regulatory_tier statements partway through this session's work,
-- which is why the second half of that work switched to calling
-- api.set_regulatory_tier() instead.

CREATE OR REPLACE FUNCTION public.sync_market_access_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.market_access_status := case new.regulatory_tier
    when 'legal_commercial_access' then 'open'
    when 'medical_limited_trade'   then 'regulated'
    when 'domestic_only'           then 'emerging'
    when 'cbd_hemp_only'           then 'limited'
    when 'prohibited'              then 'restricted'
    else 'unknown'
  end::public.market_access_status;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.guard_regulatory_tier_write_contract()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_expected_hash text;
  v_source text := coalesce(new.regulatory_tier_source, '');
begin
  if new.regulatory_tier is not distinct from old.regulatory_tier then
    return new;
  end if;

  v_expected_hash := md5(coalesce(api.briefing_text_for_iso(new.iso_alpha2), ''));

  if new.regulatory_tier_source_hash is distinct from v_expected_hash then
    raise exception 'regulatory_tier write for % rejected: canonical source hash not refreshed', new.iso_alpha2
      using errcode='P0001';
  end if;

  if new.regulatory_tier_last_derived_at is null then
    raise exception 'regulatory_tier write for % rejected: derivation timestamp missing', new.iso_alpha2
      using errcode='P0001';
  end if;

  if v_source = coalesce(old.regulatory_tier_source, '') then
    raise exception 'regulatory_tier write for % rejected: mutation source not refreshed', new.iso_alpha2
      using errcode='P0001';
  end if;

  if not (
    v_source like 'set_regulatory_tier (%'
    or v_source like 'classifier-accepted (%'
    or v_source like 'airtable edit %'
    or v_source like 'airtable poll %'
    or v_source like 'reclassify_auto_tiers (%'
    or v_source='canonical briefing change (live auto)'
    or v_source='canonical briefing (live auto)'
  ) then
    raise exception 'regulatory_tier write for % rejected: unapproved mutation source %', new.iso_alpha2, v_source
      using errcode='P0001';
  end if;

  return new;
end;
$function$;

DROP TRIGGER IF EXISTS trg_guard_regulatory_tier_write_contract ON public.countries;
CREATE TRIGGER trg_guard_regulatory_tier_write_contract
  BEFORE UPDATE OF regulatory_tier ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_regulatory_tier_write_contract();

DROP TRIGGER IF EXISTS trg_sync_market_access_status ON public.countries;
CREATE TRIGGER trg_sync_market_access_status
  BEFORE INSERT OR UPDATE OF regulatory_tier ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_market_access_status();
