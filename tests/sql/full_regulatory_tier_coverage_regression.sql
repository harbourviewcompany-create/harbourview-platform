\set ON_ERROR_STOP on

-- Static postconditions after 20260830140000.
do $$
declare
  v_total integer;
  v_null integer;
  v_subnational integer;
  v_subnational_tiered integer;
  v_bad_evidence integer;
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
end $$;

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

  -- Baseline a reviewed override to the current canonical source.
  perform api.set_regulatory_tier(
    v_iso,
    v_current,
    'regression-override-expiry',
    'transactional regression baseline'
  );

  -- Use canonical fields that derive a materially different prohibited tier.
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

select 'FULL_REGULATORY_TIER_COVERAGE_REGRESSION|PASS' as result;
