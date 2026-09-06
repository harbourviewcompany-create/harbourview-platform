\set ON_ERROR_STOP on

-- Static postconditions after the full regulatory-tier authority chain.
do $$
declare
  v_total integer;
  v_null integer;
  v_subnational integer;
  v_subnational_tiered integer;
  v_bad_evidence integer;
  v_all_mismatches integer;
  v_unreviewed_without_evidence integer;
  v_market_mismatches integer;
  v_conflict_mismatches integer;
begin
  select count(*), count(*) filter (where regulatory_tier is null)
    into v_total, v_null
    from public.countries;

  if v_total <> 291 then
    raise exception 'expected 291 rows, found %', v_total;
  end if;
  if v_null <> 0 then
    raise exception 'expected zero null tiers, found %', v_null;
  end if;

  select count(*), count(*) filter (where regulatory_tier is not null)
    into v_subnational, v_subnational_tiered
    from public.countries
   where iso_alpha2 ~ '^(US|CA|DE|AU)-';

  if v_subnational <> 88 or v_subnational_tiered <> 88 then
    raise exception 'expected 88/88 tiered subnational rows, found %/%', v_subnational, v_subnational_tiered;
  end if;

  select count(*) into v_bad_evidence
    from public.countries c
   where c.iso_alpha2 in ('LS','MA','CO','KE')
     and c.regulatory_tier is distinct from api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2));

  if v_bad_evidence <> 0 then
    raise exception 'LS/MA/CO/KE canonical evidence mismatch count %', v_bad_evidence;
  end if;

  select count(*) into v_all_mismatches
    from public.countries c
   where api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) is not null
     and c.regulatory_tier is distinct from api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2));

  if v_all_mismatches <> 0 then
    raise exception 'global canonical evidence mismatch count %', v_all_mismatches;
  end if;

  select count(*) into v_unreviewed_without_evidence
    from public.countries c
   where api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) is null
     and c.regulatory_tier_needs_review is distinct from true;

  if v_unreviewed_without_evidence <> 0 then
    raise exception 'rows without canonical evidence not flagged needs_review: %', v_unreviewed_without_evidence;
  end if;

  select count(*) into v_market_mismatches
    from public.countries
   where market_access_status::text is distinct from case regulatory_tier
     when 'legal_commercial_access' then 'open'
     when 'medical_limited_trade' then 'regulated'
     when 'domestic_only' then 'emerging'
     when 'cbd_hemp_only' then 'limited'
     when 'prohibited' then 'restricted'
     else 'unknown' end;

  if v_market_mismatches <> 0 then
    raise exception 'market_access_status/regulatory_tier mismatch count %', v_market_mismatches;
  end if;

  with expected(iso,tier) as (values
    ('AD','prohibited'),
    ('AE','cbd_hemp_only'),
    ('AU-QLD','legal_commercial_access'),
    ('AU-TAS','legal_commercial_access'),
    ('AU-WA','legal_commercial_access'),
    ('BW','legal_commercial_access'),
    ('BY','cbd_hemp_only'),
    ('CN','cbd_hemp_only'),
    ('CU','prohibited'),
    ('HN','prohibited'),
    ('KE','prohibited'),
    ('MT','legal_commercial_access'),
    ('NA','prohibited'),
    ('NI','prohibited'),
    ('RS','cbd_hemp_only'),
    ('SV','prohibited'),
    ('VE','prohibited'),
    ('XK','prohibited')
  )
  select count(*) into v_conflict_mismatches
  from expected e
  join public.countries c on c.iso_alpha2=e.iso
  where c.regulatory_tier is distinct from e.tier;

  if v_conflict_mismatches <> 0 then
    raise exception '18-jurisdiction evidence resolution mismatch count %', v_conflict_mismatches;
  end if;
end $$;

-- Direct privileged tier-only writes must fail. This reproduces the exact bug
-- class that created 20260830185137, transactionally and without persisted data.
begin;
do $$
declare
  v_old text;
  v_attempt text;
  v_blocked boolean := false;
begin
  select regulatory_tier into v_old from public.countries where iso_alpha2='LS';
  v_attempt := case when v_old='prohibited' then 'domestic_only' else 'prohibited' end;

  begin
    update public.countries set regulatory_tier=v_attempt where iso_alpha2='LS';
  exception when sqlstate 'P0001' then
    v_blocked := true;
  end;

  if not v_blocked then
    raise exception 'direct regulatory_tier write unexpectedly bypassed provenance guard' using errcode='P0002';
  end if;

  if (select regulatory_tier from public.countries where iso_alpha2='LS') is distinct from v_old then
    raise exception 'blocked direct write changed LS tier';
  end if;
end $$;
rollback;

-- Live override-expiry proof. This changes one canonical country briefing only
-- inside a transaction and rolls it back, leaving production data unchanged.
begin;

do $$
declare
  v_iso constant text := 'LS';
  v_text text;
  v_current text;
  v_test_tier text;
begin
  v_text := api.briefing_text_for_iso(v_iso);
  v_current := api.derive_regulatory_tier(v_text);

  if v_text is null or v_current is null then
    raise exception 'LS canonical fixture unavailable';
  end if;

  perform api.set_regulatory_tier(
    v_iso,
    v_current,
    'regression-override-expiry',
    'transactional regression baseline'
  );

  update public.cc_jurisdiction_briefings
     set program_status = 'Prohibited',
         public_summary = 'Cannabis prohibited. No medical program. No licensed import pathway. No licensed export pathway.',
         market_dynamics = null,
         regulatory_outlook = null
   where jurisdiction_type = 'country'
     and country_iso2 = v_iso;

  select regulatory_tier into v_test_tier
    from public.countries
   where iso_alpha2 = v_iso;

  if v_test_tier is distinct from 'prohibited' then
    raise exception 'override expiry failed: expected prohibited, found %', v_test_tier;
  end if;

  if exists (
    select 1 from public.countries
     where iso_alpha2 = v_iso
       and regulatory_tier_origin is distinct from 'auto'
  ) then
    raise exception 'override expiry failed: LS did not return to origin=auto';
  end if;

  if not exists (
    select 1
      from public.regulatory_tier_audit
     where country_iso2 = v_iso
       and trigger_source = 'briefing_change_live'
       and note like 'Canonical briefing changed after a reviewed source baseline%'
  ) then
    raise exception 'override expiry audit row missing';
  end if;
end $$;

rollback;

-- Country -> child propagation proof. A harmless parent-source text change must
-- refresh the source hash of a reviewed child even when its derived tier stays
-- the same. The transaction is rolled back.
begin;

do $$
declare
  v_parent constant text := 'DE';
  v_child constant text := 'DE-BE';
  v_parent_tier text;
  v_child_tier text;
  v_hash_before text;
  v_hash_after text;
begin
  v_parent_tier := api.derive_regulatory_tier(api.briefing_text_for_iso(v_parent));
  v_child_tier := api.derive_regulatory_tier(api.briefing_text_for_iso(v_child));

  if v_parent_tier is null or v_child_tier is null then
    raise exception 'DE/DE-BE canonical propagation fixtures unavailable';
  end if;

  perform api.set_regulatory_tier(v_parent, v_parent_tier, 'regression-parent-propagation', 'parent baseline');
  perform api.set_regulatory_tier(v_child, v_child_tier, 'regression-parent-propagation', 'child baseline');

  select regulatory_tier_source_hash into v_hash_before
    from public.countries where iso_alpha2 = v_child;

  update public.cc_jurisdiction_briefings
     set public_summary = coalesce(public_summary, '') || ' [parent-propagation-regression-marker]'
   where jurisdiction_type = 'country'
     and country_iso2 = v_parent;

  select regulatory_tier_source_hash into v_hash_after
    from public.countries where iso_alpha2 = v_child;

  if v_hash_before is null or v_hash_after is null or v_hash_before = v_hash_after then
    raise exception 'country-to-child propagation failed: DE-BE source hash did not refresh';
  end if;
end $$;

rollback;

select 'FULL_REGULATORY_TIER_COVERAGE_REGRESSION|PASS' as result;
