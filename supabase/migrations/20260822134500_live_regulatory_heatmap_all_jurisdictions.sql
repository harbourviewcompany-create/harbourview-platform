-- ============================================================
-- Live regulatory heatmap — all current jurisdictions
-- ============================================================
-- Goals:
--   1. countries.regulatory_tier remains the only colour source.
--   2. Upgrade production to the current clause-scoped full-briefing classifier.
--   3. Recompute both country and state/subnational briefing targets.
--   4. Let a later canonical briefing change invalidate a stale manual override
--      when (and only when) the derived tier actually changes.
--   5. Propagate country-level trade-pathway changes into child regions.
--   6. Map renderable overseas-territory briefings to their ISO-3166-1 globe rows.
--
-- Static frontend tier fixtures are intentionally not part of this migration.
-- Missing/unmapped regions must render neutral, never inherit a parent colour.
-- ============================================================

-- Bring production forward to the clause-scoped classifier contract already
-- present on main in 20260819153000. Re-stating it here makes this corrective
-- migration self-contained on databases that missed that earlier migration.
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
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?(commercial[[:space:]]+)?)(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented|export permit)'
      and segment !~* 'export licensing under (discussion|consideration|review)'
  ) into export_commercial;

  select exists (
    select 1
    from regexp_split_to_table(
      ps,
      '[.;,|]+|[[:space:]]+(and|but|however)[[:space:]]+',
      'i'
    ) as s(segment)
    where segment ~* '(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* '((no|not|without|never|lack of|lacks?|lacking|absent|does[[:space:]]+not)[[:space:]]+(longer[[:space:]]+|currently[[:space:]]+)?((has?|have|operates?|supports?|maintains?)[[:space:]]+)?((a|an|any)[[:space:]]+)?(licensed[[:space:]]+)?((commercial|medical)[[:space:]]+)?)(licensed import|import market|medical import|commercial import|import pathway|import permit|licensed importer|importers)'
      and segment !~* 'import licensing under (discussion|consideration|review)'
  ) into import_commercial;

  if ps ~* 'prohibited'
     and ps ~* '(industrial hemp (producer|cultivation)|largest industrial hemp|hemp expansion underway|licensed .*hemp|hemp .*licensed)'
     and ps !~* '(research (interest|developing)|informal)'
  then
    return 'cbd_hemp_only';
  end if;

  if export_commercial or import_commercial then
    return 'legal_commercial_access';
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
  'Derives the live market-access tier from canonical briefing prose. Cross-border import/export evidence outranks domestic-only access; established medical access remains medical_limited_trade; missing/future-only pathways fail closed.';

create or replace function public.api_derive_or_null(program_status text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select api.derive_regulatory_tier(program_status);
$$;

-- Normalize briefing identifiers to the ISO code used by the globe. Most state
-- rows keep their explicit state_iso2. Overseas territories that Natural Earth
-- renders as separate Admin-0 polygons use their ISO-3166-1 code instead.
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

-- Natural Earth already contains separate polygons for these current briefing
-- jurisdictions. Seed the missing live rows so their briefing tiers can colour
-- the actual globe polygon. PR already exists in production and is therefore
-- intentionally not inserted here.
insert into public.countries
  (country_name, country_slug, iso_alpha2, iso_alpha3, lat, lng)
values
  ('American Samoa', 'american-samoa', 'AS', 'ASM', -14.327, -170.747),
  ('Guam', 'guam', 'GU', 'GUM', 13.354, 144.704),
  ('Northern Mariana Islands', 'northern-mariana-islands', 'MP', 'MNP', 15.188, 145.734),
  ('United States Virgin Islands', 'united-states-virgin-islands', 'VI', 'VIR', 17.747, -64.779),
  ('New Caledonia', 'new-caledonia', 'NC', 'NCL', -21.065, 165.084),
  ('French Polynesia', 'french-polynesia', 'PF', 'PYF', -17.628, -149.462)
on conflict (iso_alpha2) do nothing;

-- Apply one classifier result to one live map row. Override semantics are
-- source-versioned rather than permanent: a migration/explicit review first
-- baselines source_hash. Later briefing changes keep an override when the tier
-- remains the same, but automatically expire it if the canonical source now
-- derives a different tier.
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
    -- A null hash means an older/manual override has not yet been baselined to
    -- the current canonical source. Do not treat migration-contract drift as a
    -- real regulatory change.
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

    -- Source changed, but the reviewed tier still agrees with the classifier:
    -- keep the override and advance its source baseline automatically.
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
       'Canonical briefing changed after an override baseline and now derives a different tier; stale override expired automatically.');

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

revoke all on function public.recompute_regulatory_tier_row(text,text,text,text,boolean) from public;
revoke all on function public.recompute_regulatory_tier_row(text,text,text,text,boolean) from anon;
revoke all on function public.recompute_regulatory_tier_row(text,text,text,text,boolean) from authenticated;

-- Country-level trade access is legally inherited by a subnational market when
-- that national pathway is available there. The local briefing is therefore
-- classified together with its parent country's canonical briefing. This keeps
-- the tier ontology consistent: green is cross-border market access, not merely
-- local adult-use retail legality.
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

revoke all on function api.regulatory_classifier_text_for_briefing(text,text,text,text,text,text) from public;
revoke all on function api.regulatory_classifier_text_for_briefing(text,text,text,text,text,text) from anon;
revoke all on function api.regulatory_classifier_text_for_briefing(text,text,text,text,text,text) from authenticated;

-- Baseline every existing manual override against the CURRENT canonical source
-- before changing the trigger contract. This prevents the migration itself from
-- being misinterpreted as a regulatory source change.
with override_sources as (
  select
    c.iso_alpha2,
    api.regulatory_classifier_text_for_briefing(
      b.jurisdiction_type,
      b.country_iso2,
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    ) as classifier_text
  from public.countries c
  join public.cc_jurisdiction_briefings b
    on api.regulatory_tier_target_iso2(b.jurisdiction_type, b.country_iso2, b.state_iso2) = c.iso_alpha2
  where c.regulatory_tier_origin = 'override'
)
update public.countries c set
  regulatory_tier_source_hash = md5(os.classifier_text),
  regulatory_tier_last_derived_at = now(),
  regulatory_tier_needs_review = false
from override_sources os
where c.iso_alpha2 = os.iso_alpha2
  and os.classifier_text is not null;

-- Uruguay's temporary manual green override was based on legal adult-use status,
-- not Harbourview's cross-border market-access tier doctrine. Its canonical
-- briefing explicitly describes a resident-only domestic system with no export
-- trade, so return it to the live automatic classifier before bulk derivation.
update public.countries
set regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = null,
    regulatory_tier_needs_review = true
where iso_alpha2 = 'UY'
  and regulatory_tier_origin = 'override';

-- Recompute every mapped current country + subnational briefing. Overrides stay
-- in place because they were just baselined; automatic rows are fully refreshed.
do $$
declare
  b record;
  v_target text;
  v_text text;
begin
  for b in
    select jurisdiction_type, country_iso2, state_iso2, program_status,
           public_summary, market_dynamics, regulatory_outlook
      from public.cc_jurisdiction_briefings
     where jurisdiction_type in ('country', 'state')
     order by jurisdiction_type, country_iso2, state_iso2 nulls first
  loop
    v_target := api.regulatory_tier_target_iso2(b.jurisdiction_type, b.country_iso2, b.state_iso2);
    v_text := api.regulatory_classifier_text_for_briefing(
      b.jurisdiction_type,
      b.country_iso2,
      b.program_status,
      b.public_summary,
      b.market_dynamics,
      b.regulatory_outlook
    );

    perform public.recompute_regulatory_tier_row(
      v_target,
      b.program_status,
      v_text,
      'live_heatmap_classifier_upgrade',
      false
    );
  end loop;
end;
$$;

-- Live trigger: local briefing changes recompute their exact jurisdiction. A
-- country briefing change also recomputes every child region because national
-- import/export access is part of a region's market-access classification.
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

-- The trigger already exists in production; recreate defensively so a fresh DB
-- gets the exact same event columns and contract.
drop trigger if exists trg_sync_regulatory_tier on public.cc_jurisdiction_briefings;
create trigger trg_sync_regulatory_tier
after insert or update of program_status, public_summary, market_dynamics, regulatory_outlook
on public.cc_jurisdiction_briefings
for each row execute function public.sync_regulatory_tier_from_briefing();

-- Guardrails: current rendered subnational geometry rows must all exist and have
-- a live tier after migration. Unmapped future regions are allowed to remain
-- neutral; missing rows must never be papered over by a parent fallback.
do $$
declare
  v_supported_count integer;
  v_supported_tiered integer;
begin
  select count(*), count(*) filter (where regulatory_tier is not null)
    into v_supported_count, v_supported_tiered
    from public.countries
   where iso_alpha2 ~ '^(US|CA|DE|AU)-';

  if v_supported_count <> 88 then
    raise exception 'Expected 88 currently rendered US/CA/DE/AU subnational rows, found %', v_supported_count;
  end if;

  if v_supported_tiered <> 88 then
    raise exception 'Expected all 88 currently rendered subnational rows to have live tiers, found %', v_supported_tiered;
  end if;
end;
$$;
