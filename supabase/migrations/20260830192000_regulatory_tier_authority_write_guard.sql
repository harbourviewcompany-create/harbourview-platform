-- Reconstructed from production. Verbatim statements for version 20260830192000.
-- ============================================================
-- Regulatory tier authority + write guard
-- ============================================================
-- Supersedes the direct tier-only corrections recorded in 20260830185137.
-- Canonical jurisdiction evidence is authoritative; reviewed overrides are
-- source-versioned and all tier-changing mutation paths must refresh provenance.
-- ============================================================

create or replace function api.derive_regulatory_tier(program_status text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  ps text := coalesce(program_status, '');
  general_under_discussion boolean;
  export_commercial boolean;
  import_commercial boolean;
begin
  if trim(both from ps) = '' then
    return null;
  end if;

  general_under_discussion :=
    ps ~* '(under (active )?consideration|under discussion|under review|licensing under (discussion|consideration|review)|reform under)';

  select exists (
    select 1
    from regexp_split_to_table(ps, '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+', 'i') as s(segment)
    where segment ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?(commercial[[:space:]]+)?)(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* 'export licensing under (discussion|consideration|review)'
  ) into export_commercial;

  select exists (
    select 1
    from regexp_split_to_table(ps, '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+', 'i') as s(segment)
    where segment ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?((commercial|medical)[[:space:]]+)?)(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* 'import licensing under (discussion|consideration|review)'
  ) into import_commercial;

  -- Operational cross-border cannabis access outranks a local industrial-hemp
  -- mention. This matters for parent-aware Australian state briefings, where
  -- federal TGA import/export access is part of the canonical classifier text.
  if export_commercial or import_commercial then
    return 'legal_commercial_access';
  end if;

  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  if not general_under_discussion then
    if ps ~* 'industrial (cultivation licensed|legal)' then
      return 'legal_commercial_access';
    end if;
    if ps ~* 'adult-use legal — federal' then
      return 'legal_commercial_access';
    end if;
  end if;

  if ps ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail' then
    return 'domestic_only';
  end if;

  if ps ~* '(medical legal([[:space:][:punct:]]|$)|medical[[:space:]]*(—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
     and ps !~* '(no medical programme|no medical program|medical (reform|programme|program|access|legalization|legalisation|licensing)( remains?)? under (active )?(consideration|discussion|review))'
  then
    return 'medical_limited_trade';
  end if;

  return 'prohibited';
end;
$$;

comment on function api.derive_regulatory_tier(text) is
  'Canonical market-access classifier. Operational licensed import/export outranks hemp-only; future/discussion-only pathways do not establish commercial access.';

-- Replace misleading or stale canonical prose only where the 18-row conflict
-- review found a material evidence problem. Prohibited jurisdictions use
-- unambiguous prose that does not contain negated positive classifier keywords.
update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Andorra. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Andorra.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='AD';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Cuba. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Cuba.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='CU';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Honduras. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Honduras.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='HN';

update public.cc_jurisdiction_briefings
set program_status='Prohibited; Export Licensing Under Discussion Only',
    public_summary='Cannabis remains prohibited in Kenya. No licensed commercial cannabis market is operating; possible export licensing remains under discussion and is not an enacted pathway.',
    market_dynamics='No licensed commercial cannabis market is operating in Kenya.',
    regulatory_outlook='Potential export reform remains prospective and does not constitute current lawful market access.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='KE';

update public.cc_jurisdiction_briefings
set program_status='Prohibited; Reform Under Review',
    public_summary='Cannabis remains prohibited in Namibia. No operating licensed cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Namibia.',
    regulatory_outlook='Reform remains under review and is not an enacted market-access pathway.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='NA';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Nicaragua. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Nicaragua.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='NI';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in El Salvador. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in El Salvador.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='SV';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Venezuela. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Venezuela.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='VE';

update public.cc_jurisdiction_briefings
set program_status='Prohibited — No Lawful Cannabis Market',
    public_summary='Cannabis is prohibited in Kosovo. No lawful cannabis market or commercial pathway is established.',
    market_dynamics='No licensed cannabis market operates in Kosovo.',
    regulatory_outlook='No enacted cannabis market-access reform is currently in force.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='XK';

update public.cc_jurisdiction_briefings
set program_status='Cannabis Prohibited; Licensed Industrial Hemp Cultivation Legal',
    public_summary='Serbia prohibits psychoactive cannabis cultivation and general cannabis market access. Low-THC cannabis varieties may be cultivated for specified industrial purposes under a Ministry of Agriculture permit.',
    market_dynamics='The lawful cannabis-adjacent pathway is licensed industrial hemp; no operating general cannabis market is established.',
    regulatory_outlook='Treat as hemp-only unless a broader lawful cannabis pathway becomes operational.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='RS';

update public.cc_jurisdiction_briefings
set program_status='Medical/Industrial/Scientific Legal; Licensed Import/Export Framework Operational',
    public_summary='Botswana Cannabis Act 20 of 2025 is in force and establishes licensing for cultivation, manufacture, medical cannabis products, distribution, import and export for medicinal, scientific, research or industrial purposes.',
    market_dynamics='The statutory licensing framework expressly provides import and export licences and a National Cannabis Control Authority.',
    regulatory_outlook='Commercial access remains licence-controlled under the Cannabis Act and implementing rules.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='BW';

update public.cc_jurisdiction_briefings
set program_status='Adult-Use Personal/Association Legal; Medical Legal; Licensed Medicinal Cannabis Import and Wholesale Distribution',
    public_summary='Malta permits personal adult-use possession, home cultivation and licensed non-profit cannabis associations, and separately operates a regulated medicinal-cannabis programme.',
    market_dynamics='The Malta Medicines Authority reviews importation and wholesale-distribution applications for cannabis-based medicinal products; licensed importers and wholesale distributors may source approved products subject to permits.',
    regulatory_outlook='The medical import/wholesale pathway is operational and remains subject to Medicines Authority licensing and product controls.',
    updated_at=now()
where jurisdiction_type='country' and country_iso2='MT';

-- Re-review all 18 disputed jurisdictions through the existing audited setter.
do $review_conflict_set$
declare
  v_iso text;
  v_tier text;
begin
  foreach v_iso in array array[
    'AD','AE','AU-QLD','AU-TAS','AU-WA','BW','BY','CN','CU','HN','KE','MT','NA','NI','RS','SV','VE','XK'
  ] loop
    v_tier := api.derive_regulatory_tier(api.briefing_text_for_iso(v_iso));
    if v_tier is null then
      raise exception 'No canonical tier for conflict-set jurisdiction %', v_iso;
    end if;
    perform api.set_regulatory_tier(
      v_iso,
      v_tier,
      'ops-regulatory-tier-authority-repair-20260830',
      'Reviewed against corrected canonical jurisdiction evidence and the market-access tier ontology.'
    );
  end loop;
end
$review_conflict_set$;

-- Prevent privileged ordinary SQL from changing only the tier while leaving
-- source hash/provenance stale. Approved mutation paths refresh all three.
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
    raise exception 'regulatory_tier write for % rejected: canonical source hash not refreshed', new.iso_alpha2 using errcode='P0001';
  end if;
  if new.regulatory_tier_last_derived_at is null
     or new.regulatory_tier_last_derived_at is not distinct from old.regulatory_tier_last_derived_at then
    raise exception 'regulatory_tier write for % rejected: last-derived provenance not refreshed', new.iso_alpha2 using errcode='P0001';
  end if;
  if v_source = coalesce(old.regulatory_tier_source, '') then
    raise exception 'regulatory_tier write for % rejected: mutation source not refreshed', new.iso_alpha2 using errcode='P0001';
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
    raise exception 'regulatory_tier write for % rejected: unapproved mutation source %', new.iso_alpha2, v_source using errcode='P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_regulatory_tier_write_contract() from public, anon, authenticated;
drop trigger if exists trg_guard_regulatory_tier_write_contract on public.countries;
create trigger trg_guard_regulatory_tier_write_contract
before update of regulatory_tier on public.countries
for each row execute function public.guard_regulatory_tier_write_contract();

-- Atomic postconditions.
do $regulatory_tier_authority_postconditions$
declare
  v_total integer;
  v_null integer;
  v_subnational integer;
  v_subnational_tiered integer;
  v_mismatch integer;
  v_market_mismatch integer;
  v_conflict_mismatch integer;
begin
  select count(*),count(*) filter(where regulatory_tier is null) into v_total,v_null from public.countries;
  if v_total<>291 or v_null<>0 then raise exception 'Coverage postcondition failed: total %, null %',v_total,v_null; end if;

  select count(*),count(*) filter(where regulatory_tier is not null)
    into v_subnational,v_subnational_tiered from public.countries where iso_alpha2 ~ '^(US|CA|DE|AU)-';
  if v_subnational<>88 or v_subnational_tiered<>88 then raise exception 'Subnational postcondition failed: %/%',v_subnational,v_subnational_tiered; end if;

  select count(*) into v_mismatch from public.countries c
  where api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) is not null
    and c.regulatory_tier is distinct from api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2));
  if v_mismatch<>0 then raise exception 'Canonical evidence parity failed: % mismatches',v_mismatch; end if;

  select count(*) into v_market_mismatch from public.countries
  where market_access_status::text is distinct from case regulatory_tier
    when 'legal_commercial_access' then 'open' when 'medical_limited_trade' then 'regulated'
    when 'domestic_only' then 'emerging' when 'cbd_hemp_only' then 'limited'
    when 'prohibited' then 'restricted' else 'unknown' end;
  if v_market_mismatch<>0 then raise exception 'market_access_status projection failed: % mismatches',v_market_mismatch; end if;

  with expected(iso,tier) as (values
    ('AD','prohibited'),('AE','cbd_hemp_only'),('AU-QLD','legal_commercial_access'),
    ('AU-TAS','legal_commercial_access'),('AU-WA','legal_commercial_access'),
    ('BW','legal_commercial_access'),('BY','cbd_hemp_only'),('CN','cbd_hemp_only'),
    ('CU','prohibited'),('HN','prohibited'),('KE','prohibited'),
    ('MT','legal_commercial_access'),('NA','prohibited'),('NI','prohibited'),
    ('RS','cbd_hemp_only'),('SV','prohibited'),('VE','prohibited'),('XK','prohibited')
  )
  select count(*) into v_conflict_mismatch from expected e join public.countries c on c.iso_alpha2=e.iso
  where c.regulatory_tier is distinct from e.tier;
  if v_conflict_mismatch<>0 then raise exception 'Conflict-set evidence resolution failed: % mismatches',v_conflict_mismatch; end if;

  if not exists(select 1 from pg_trigger where tgrelid='public.countries'::regclass and tgname='trg_guard_regulatory_tier_write_contract' and not tgisinternal) then
    raise exception 'Regulatory tier write guard trigger missing';
  end if;
end
$regulatory_tier_authority_postconditions$;
