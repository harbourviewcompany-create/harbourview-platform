-- Transaction-safe refinement of the regulatory-tier write guard installed by
-- 20260830192000. PostgreSQL now() is transaction-stable, so two legitimate
-- provenance-refreshing writes in one transaction can share the same timestamp.
-- Requiring last_derived_at to differ from OLD therefore rejects valid live
-- override expiry even when the canonical source hash and mutation source were
-- refreshed correctly.
--
-- Keep the actual authority boundary: a tier-changing write must carry the
-- current canonical source hash, a non-null derivation timestamp, a refreshed
-- approved mutation source, and therefore cannot be a raw tier-only UPDATE.

create or replace function public.guard_regulatory_tier_write_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

comment on function public.guard_regulatory_tier_write_contract() is
  'Rejects tier-changing raw DML unless canonical source hash, provenance timestamp and approved mutation source are refreshed. Transaction-safe: does not require now()-based timestamps to differ within one transaction.';

revoke all on function public.guard_regulatory_tier_write_contract() from public, anon, authenticated;
