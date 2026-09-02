-- Reconstructed from production. Verbatim statements for version 20260830140000.
-- ============================================================
-- Full regulatory-tier coverage — evidence-backed + live
-- ============================================================
-- Contract:
--   * countries.regulatory_tier remains the sole heatmap colour source.
--   * Every existing country/territory and supported US/CA/AU/DE subnational
--     row remains non-null.
--   * Country/territory rows with canonical briefing evidence are reviewed
--     against the current classifier and stored as source-versioned overrides.
--   * A later canonical briefing change automatically expires a reviewed
--     override when the newly derived tier differs.
--   * Country briefing changes also recompute child subnational jurisdictions.
--   * Rows lacking canonical classifier evidence keep their existing non-null
--     tier and are explicitly flagged for analyst review; they are never
--     fabricated as reviewed evidence.
-- ============================================================

-- Normalize a briefing row to the ISO key used by the live map.
create or replace function api.regulatory_tier_target_iso2(
  jurisdiction_type text,
  country_iso2 text,
  state_iso2 text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when jurisdiction_type = 'country' then upper(country_iso2)
    when jurisdiction_type = 'state'
      and upper(state_iso2) in (
        'US-AS','US-GU','US-MP','US-PR','US-VI',
        'FR-GF','FR-GP','FR-MQ','FR-NC','FR-PF','FR-RE'
      )
      then split_part(upper(state_iso2), '-', 2)
    when jurisdiction_type = 'state' then upper(state_iso2)
    else null
  end;
$$;

revoke all on function api.regulatory_tier_target_iso2(text,text,text) from public, anon, authenticated;

-- Canonical classifier text for one briefing. State rows include the parent
-- country's trade-access evidence so subnational colours follow the same
-- cross-border market-access ontology as countries.
create or replace function api.regulatory_classifier_text_for_briefing(
  p_jurisdiction_type text,
  p_country_iso2 text,
  p_program_status text,
  p_public_summary text,
  p_market_dynamics text,
  p_regulatory_outlook text
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_local text;
  v_parent text;
begin
  v_local := api.briefing_classifier_text(
    p_program_status,
    p_public_summary,
    p_market_dynamics,
    p_regulatory_outlook
  );

  if p_jurisdiction_type is distinct from 'state' then
    return v_local;
  end if;

  select api.briefing_classifier_text(
           b.program_status,
           b.public_summary,
           b.market_dynamics,
           b.regulatory_outlook
         )
    into v_parent
    from public.cc_jurisdiction_briefings b
   where b.jurisdiction_type = 'country'
     and b.country_iso2 = p_country_iso2
   order by b.updated_at desc
   limit 1;

  return nullif(trim(both from concat_ws(' | ', v_local, v_parent)), '');
end;
$$;

revoke all on function api.regulatory_classifier_text_for_briefing(text,text,text,text,text,text)
  from public, anon, authenticated;

-- Apply one canonical classifier result to one live map row. Reviewed overrides
-- are source-versioned, not permanent. Once the underlying canonical source
-- changes, an override is retained only if the new classifier still agrees.
create or replace function public.recompute_regulatory_tier_row(
  p_target_iso2 text,
  p_program_status text,
  p_classifier_text text,
  p_trigger_source text,
  p_allow_override_expiry boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_tier text;
  v_old_origin text;
  v_old_hash text;
  v_new_tier text;
  v_new_hash text;
  v_changed boolean := false;
begin
  if p_target_iso2 is null or p_classifier_text is null then
    return false;
  end if;

  v_new_hash := md5(p_classifier_text);
  v_new_tier := api.derive_regulatory_tier(p_classifier_text);
  if v_new_tier is null then
    return false;
  end if;

  select regulatory_tier, regulatory_tier_origin, regulatory_tier_source_hash
    into v_old_tier, v_old_origin, v_old_hash
    from public.countries
   where iso_alpha2 = p_target_iso2
   for update;

  if not found then
    return false;
  end if;

  if v_old_origin = 'override' then
    if v_old_hash is null then
      update public.countries set
        regulatory_tier_source_hash = v_new_hash,
        regulatory_tier_last_derived_at = now()
      where iso_alpha2 = p_target_iso2;
      return false;
    end if;

    if v_old_hash = v_new_hash then
      return false;
    end if;

    if v_new_tier is not distinct from v_old_tier then
      update public.countries set
        regulatory_tier_source_hash = v_new_hash,
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_needs_review = false
      where iso_alpha2 = p_target_iso2;
      return false;
    end if;

    if not p_allow_override_expiry then
      update public.countries set
        regulatory_tier_source_hash = v_new_hash,
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_needs_review = true
      where iso_alpha2 = p_target_iso2;
      return false;
    end if;

    update public.countries set
      regulatory_tier = v_new_tier,
      regulatory_tier_origin = 'auto',
      regulatory_tier_reviewed_at = null,
      regulatory_tier_source = 'canonical briefing change (live auto)',
      regulatory_tier_rationale = 'Derived from canonical briefing prose: "' || left(p_classifier_text, 500) || '"',
      regulatory_tier_source_hash = v_new_hash,
      regulatory_tier_last_derived_at = now(),
      regulatory_tier_needs_review = true,
      updated_at = now()
    where iso_alpha2 = p_target_iso2;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (p_target_iso2, v_old_tier, v_new_tier, 'auto', p_trigger_source,
       p_program_status, 'system',
       'Canonical briefing changed after a reviewed source baseline and now derives a different tier; stale override expired automatically.');

    return true;
  end if;

  v_changed := v_new_tier is distinct from v_old_tier;

  update public.countries set
    regulatory_tier = v_new_tier,
    regulatory_tier_origin = 'auto',
    regulatory_tier_source = 'canonical briefing (live auto)',
    regulatory_tier_rationale = 'Derived from canonical briefing prose: "' || left(p_classifier_text, 500) || '"',
    regulatory_tier_source_hash = v_new_hash,
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_needs_review = case when v_changed then true else regulatory_tier_needs_review end,
    updated_at = now()
  where iso_alpha2 = p_target_iso2;

  if v_changed then
    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (p_target_iso2, v_old_tier, v_new_tier, 'auto', p_trigger_source,
       p_program_status, 'system',
       'Live regulatory tier re-derived from canonical full briefing prose.');
  end if;

  return v_changed;
end;
$$;

revoke all on function public.recompute_regulatory_tier_row(text,text,text,text,boolean)
  from public, anon, authenticated;

-- Replace the override-freezing trigger from 20260829120000. A country change
-- also fans out to every child state because national trade access is part of
-- the subnational classification contract.
create or replace function public.sync_regulatory_tier_from_briefing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target text;
  v_text text;
  child record;
begin
  if new.jurisdiction_type not in ('country', 'state') then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.program_status is not distinct from new.program_status
     and old.public_summary is not distinct from new.public_summary
     and old.market_dynamics is not distinct from new.market_dynamics
     and old.regulatory_outlook is not distinct from new.regulatory_outlook
  then
    return new;
  end if;

  v_target := api.regulatory_tier_target_iso2(new.jurisdiction_type, new.country_iso2, new.state_iso2);
  v_text := api.regulatory_classifier_text_for_briefing(
    new.jurisdiction_type,
    new.country_iso2,
    new.program_status,
    new.public_summary,
    new.market_dynamics,
    new.regulatory_outlook
  );

  perform public.recompute_regulatory_tier_row(
    v_target,
    new.program_status,
    v_text,
    'briefing_change_live',
    true
  );

  if new.jurisdiction_type = 'country' then
    for child in
      select jurisdiction_type, country_iso2, state_iso2, program_status,
             public_summary, market_dynamics, regulatory_outlook
        from public.cc_jurisdiction_briefings
       where jurisdiction_type = 'state'
         and country_iso2 = new.country_iso2
    loop
      v_target := api.regulatory_tier_target_iso2(child.jurisdiction_type, child.country_iso2, child.state_iso2);
      v_text := api.regulatory_classifier_text_for_briefing(
        child.jurisdiction_type,
        child.country_iso2,
        child.program_status,
        child.public_summary,
        child.market_dynamics,
        child.regulatory_outlook
      );

      perform public.recompute_regulatory_tier_row(
        v_target,
        child.program_status,
        v_text,
        'parent_briefing_change_live',
        true
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
after insert or update of program_status, public_summary, market_dynamics, regulatory_outlook
on public.cc_jurisdiction_briefings
for each row execute function public.sync_regulatory_tier_from_briefing();

-- Evidence-backed reviewed seed for every country/territory row with current
-- canonical classifier evidence. This intentionally replaces the previous
-- hand-authored static list: the canonical briefings are the authority, so
-- Lesotho, Morocco, Colombia, Kenya and every other row cannot diverge from the
-- evidence at seed time.
do $$
declare
  c record;
  v_text text;
  v_tier text;
begin
  for c in
    select iso_alpha2, regulatory_tier
      from public.countries
     where length(iso_alpha2) = 2
     order by iso_alpha2
  loop
    v_text := api.briefing_text_for_iso(c.iso_alpha2);
    v_tier := api.derive_regulatory_tier(v_text);

    if v_tier is not null then
      perform api.set_regulatory_tier(
        c.iso_alpha2,
        v_tier,
        'ops-full-coverage-evidence-20260830',
        'Reviewed against canonical briefing evidence: ' || left(v_text, 450)
      );
    else
      -- No canonical classifier evidence: preserve the existing non-null tier,
      -- but never mislabel it as reviewed evidence.
      update public.countries set
        regulatory_tier = coalesce(regulatory_tier, 'prohibited'),
        regulatory_tier_needs_review = true,
        regulatory_tier_source = 'full-coverage fallback; canonical briefing evidence unavailable 2026-08-30',
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_rationale = coalesce(
          regulatory_tier_rationale,
          'Coverage preserved pending canonical briefing evidence review'
        )
      where iso_alpha2 = c.iso_alpha2;
    end if;
  end loop;
end $$;

-- Preserve complete coverage for any future sparse/subnational row while making
-- unsupported fallback explicit and reviewable.
update public.countries
set
  regulatory_tier = 'prohibited',
  regulatory_tier_origin = coalesce(regulatory_tier_origin, 'auto'),
  regulatory_tier_needs_review = true,
  regulatory_tier_rationale = coalesce(
    regulatory_tier_rationale,
    'Coverage fallback pending canonical briefing evidence review'
  ),
  regulatory_tier_source = 'full-coverage-null-fallback 2026-08-30',
  regulatory_tier_last_derived_at = now()
where regulatory_tier is null;

-- Hard postconditions. These fail the migration atomically rather than leaving a
-- partially coloured globe.
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
    raise exception 'Expected 291 current country/territory/subnational rows, found %', v_total;
  end if;

  if v_null <> 0 then
    raise exception 'Expected zero null regulatory tiers, found %', v_null;
  end if;

  select count(*), count(*) filter (where regulatory_tier is not null)
    into v_subnational, v_subnational_tiered
    from public.countries
   where iso_alpha2 ~ '^(US|CA|DE|AU)-';

  if v_subnational <> 88 or v_subnational_tiered <> 88 then
    raise exception 'Expected 88/88 tiered US/CA/DE/AU subnational rows, found %/%',
      v_subnational, v_subnational_tiered;
  end if;

  select count(*)
    into v_bad_evidence
    from public.countries c
   where c.iso_alpha2 in ('LS','MA','CO','KE')
     and c.regulatory_tier is distinct from api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2));

  if v_bad_evidence <> 0 then
    raise exception 'Canonical evidence regression for LS/MA/CO/KE: % mismatches', v_bad_evidence;
  end if;
end $$;
