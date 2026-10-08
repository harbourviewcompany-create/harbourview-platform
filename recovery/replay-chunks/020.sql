
-- RECOVERY BEGIN 20260822134500_live_regulatory_heatmap_all_jurisdictions.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822134500','live_regulatory_heatmap_all_jurisdictions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822134500_live_regulatory_heatmap_all_jurisdictions.sql

-- RECOVERY BEGIN 20260822134600_reconcile_legacy_heatmap_territory_rows.sql
-- Reconstructed from production. Verbatim statements for version 20260822134600.
-- Replay-safe reconciliation for 20260822134500_live_regulatory_heatmap_all_jurisdictions.
--
-- That historical migration inserted six standalone territory rows (AS, GU, MP,
-- VI, NC, PF). Production never retained those rows: the later canonical map
-- contract is 291 rows and production records 20260822134500 as superseded
-- history. A clean repository replay, however, executes the historical body and
-- reaches 297 rows before 20260830140000 asserts the canonical 291-row shape.
--
-- Remove only the exact six legacy rows, and only when the database is in that
-- exact 297-row historical replay state. On canonical production (291 rows) this
-- migration is intentionally a no-op.

do $reconcile_legacy_heatmap_territories$
declare
  v_total integer;
  v_removed integer;
  -- ISO codes present in a zero-state repository replay that canonical
  -- production does not carry. Verified live 2026-09-06 against
  -- public.countries on project zvxdgdkukjrrwamdpqrg: production holds 291 rows
  -- and none of these eighteen codes appear among them.
  --
  -- Six are the legacy territory rows this migration was originally written for
  -- (AS, GU, MP, VI, NC, PF), inserted by
  -- 20260822134500_live_regulatory_heatmap_all_jurisdictions. The other twelve
  -- are canonical territory identity rows added by
  -- 20260613170000_canonical_country_reference_repair, which post-dates the
  -- original reconciliation and pushed replay from 297 rows to 309.
  v_replay_only constant text[] := array[
    'AS', 'AW', 'AX', 'CW', 'GG', 'GI', 'GS', 'GU', 'HM',
    'IM', 'JE', 'MO', 'MP', 'NC', 'PF', 'SX', 'TF', 'VI'
  ];
begin
  select count(*) into v_total from public.countries;

  if v_total = 291 then
    -- Canonical production state: deliberately no-op.
    return;
  end if;

  -- Match on iso_alpha2 alone rather than the exact (iso_alpha2, iso_alpha3,
  -- country_slug) tuple the original used. That tuple match silently degraded:
  -- 20260609000000 seeds VI as 'us-virgin-islands', not the
  -- 'united-states-virgin-islands' slug the tuple named, so it found five of six.
  -- Rows in these three tables reference the replay-only territories by ISO
  -- code and block the delete on a foreign key. Production carries none of them
  -- (verified live 2026-09-06: zero rows in all three for these eighteen codes),
  -- which is expected -- it has no such country rows to reference. Any OTHER
  -- dependent table is deliberately not swept here: a new foreign-key violation
  -- should surface loudly rather than be silently deleted through.
  delete from public.jurisdiction_crossref where countries_iso2 = any (v_replay_only);
  delete from public.jurisdiction_playbooks_research_queue where country_code = any (v_replay_only);
  delete from public.local_intel_coverage where country_code = any (v_replay_only);

  delete from public.countries where iso_alpha2 = any (v_replay_only);
  get diagnostics v_removed = row_count;

  if (select count(*) from public.countries) <> 291 then
    raise exception
      'Legacy heatmap reconciliation expected 291 rows; started at %, removed % replay-only territory row(s), left %',
      v_total, v_removed, (select count(*) from public.countries);
  end if;
end
$reconcile_legacy_heatmap_territories$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822134600','reconcile_legacy_heatmap_territory_rows','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822134600_reconcile_legacy_heatmap_territory_rows.sql

-- RECOVERY BEGIN 20260822150000_marketplace_item_card_media_v1.sql
-- One approved public card image per marketplace item.
-- Prefer REAL_ITEM_EVIDENCE, then MANUFACTURER_CATALOGUE, then HARBOURVIEW_ILLUSTRATIVE.
-- Used by dashboard projection to avoid multi-row enrichment when only a card hero is needed.

create or replace view public.marketplace_item_card_media_v1
with (security_invoker = true)
as
select distinct on (m.item_id)
  m.item_id,
  m.id as image_id,
  m.image_class,
  m.image_role,
  m.public_url,
  m.thumbnail_url,
  m.hero_url,
  m.gallery_url,
  m.alt_text,
  m.caption,
  m.is_illustrative,
  m.source_name
from public.marketplace_item_images m
where m.review_status = 'APPROVED_PUBLIC'
  and m.rights_status <> 'UNKNOWN'
  and m.image_class <> 'ADMIN_PRIVATE_EVIDENCE'
  and (
    m.public_url is not null
    or m.thumbnail_url is not null
    or m.hero_url is not null
    or m.gallery_url is not null
  )
order by
  m.item_id,
  case m.image_class
    when 'REAL_ITEM_EVIDENCE' then 0
    when 'MANUFACTURER_CATALOGUE' then 1
    when 'HARBOURVIEW_ILLUSTRATIVE' then 2
    else 3
  end,
  case m.image_role
    when 'CARD' then 0
    when 'HERO' then 1
    when 'GALLERY' then 2
    when 'DETAIL' then 3
    else 4
  end,
  m.id;

comment on view public.marketplace_item_card_media_v1 is
  'Best single public card image per marketplace item_id. Prefer real-item evidence over catalogue over illustrative.';

grant select on public.marketplace_item_card_media_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822150000','marketplace_item_card_media_v1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822150000_marketplace_item_card_media_v1.sql

-- RECOVERY BEGIN 20260822172000_talent_production_integration_repair.sql
-- Harbourview Talent Job Board production integration repair
-- Scope: Talent tables/functions only.
-- Repairs Data API grants, closes policy gaps exposed by those grants,
-- and makes application counting atomic for both guest and authenticated applies.

-- ---------------------------------------------------------------------------
-- 1. Least-privilege Data API grants
-- ---------------------------------------------------------------------------
revoke all privileges on table public.talent_opportunities from anon, authenticated;
revoke all privileges on table public.talent_applications from anon, authenticated;
revoke all privileges on table public.talent_saved_jobs from anon, authenticated;
revoke all privileges on table public.talent_alerts from anon, authenticated;

grant select on table public.talent_opportunities to anon, authenticated;
grant insert, update on table public.talent_opportunities to authenticated;

grant insert on table public.talent_applications to anon;
grant select, insert on table public.talent_applications to authenticated;

grant select, insert, update, delete on table public.talent_saved_jobs to authenticated;
grant select, insert on table public.talent_alerts to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Close RLS gaps before exposing the new grants
-- ---------------------------------------------------------------------------
-- Owners may create drafts only. Publication remains a service/admin action.
drop policy if exists "talent_opportunities_insert_own" on public.talent_opportunities;
create policy "talent_opportunities_insert_own"
  on public.talent_opportunities
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'draft'
  );

-- Guest applications must remain guest-owned (user_id null) and every client
-- application starts in submitted state. Authenticated users may only insert
-- their own application rows.
drop policy if exists "talent_applications_insert_own" on public.talent_applications;
create policy "talent_applications_insert_own"
  on public.talent_applications
  for insert
  to anon, authenticated
  with check (
    status = 'submitted'
    and (
      ((select auth.uid()) is null and user_id is null)
      or
      ((select auth.uid()) is not null and user_id = (select auth.uid()))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER RPC execution boundary
-- ---------------------------------------------------------------------------
-- New functions receive EXECUTE for PUBLIC by default in PostgreSQL unless
-- explicitly revoked. Restore the roles intended by the original migration.
revoke execute on function public.increment_talent_view_count(uuid)
  from public, anon, authenticated;
revoke execute on function public.increment_talent_application_count(uuid)
  from public, anon, authenticated;

grant execute on function public.increment_talent_view_count(uuid)
  to anon, authenticated;
grant execute on function public.increment_talent_application_count(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Count successful applications atomically, including guest applications
-- ---------------------------------------------------------------------------
-- The application-count RPC is intentionally not callable by anon. A trigger
-- increments the count after a successful application insert so guest applies
-- are counted without exposing a client-callable anonymous counter mutation.
create or replace function public.talent_application_count_after_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.talent_opportunities
  set application_count = application_count + 1
  where id = new.opportunity_id;

  return new;
end;
$$;

revoke execute on function public.talent_application_count_after_insert()
  from public, anon, authenticated;

drop trigger if exists talent_applications_increment_count
  on public.talent_applications;
create trigger talent_applications_increment_count
  after insert on public.talent_applications
  for each row
  execute function public.talent_application_count_after_insert();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822172000','talent_production_integration_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822172000_talent_production_integration_repair.sql

-- RECOVERY BEGIN 20260822174500_talent_api_schema_exposure.sql
-- Harbourview Talent Job Board API-schema exposure
-- Scope: Talent Job Board only.
-- The canonical Supabase client is locked to the exposed `api` schema, so
-- public.* Talent objects require security-invoker passthrough views/wrappers.

create or replace view api.talent_opportunities
  with (security_invoker = on)
  as select * from public.talent_opportunities;

create or replace view api.talent_applications
  with (security_invoker = on)
  as select * from public.talent_applications;

create or replace view api.talent_saved_jobs
  with (security_invoker = on)
  as select * from public.talent_saved_jobs;

create or replace view api.talent_alerts
  with (security_invoker = on)
  as select * from public.talent_alerts;

revoke all privileges on api.talent_opportunities from anon, authenticated;
revoke all privileges on api.talent_applications from anon, authenticated;
revoke all privileges on api.talent_saved_jobs from anon, authenticated;
revoke all privileges on api.talent_alerts from anon, authenticated;

grant select on api.talent_opportunities to anon, authenticated;
grant insert, update on api.talent_opportunities to authenticated;

grant insert on api.talent_applications to anon;
grant select, insert on api.talent_applications to authenticated;

grant select, insert, update, delete on api.talent_saved_jobs to authenticated;
grant select, insert on api.talent_alerts to authenticated;

create or replace function api.increment_talent_view_count(opportunity_id uuid)
returns void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select public.increment_talent_view_count(opportunity_id);
$$;

create or replace function api.increment_talent_application_count(opportunity_id uuid)
returns void
language sql
security invoker
set search_path = pg_catalog, public
as $$
  select public.increment_talent_application_count(opportunity_id);
$$;

revoke execute on function api.increment_talent_view_count(uuid)
  from public, anon, authenticated;
revoke execute on function api.increment_talent_application_count(uuid)
  from public, anon, authenticated;

grant execute on function api.increment_talent_view_count(uuid)
  to anon, authenticated;
grant execute on function api.increment_talent_application_count(uuid)
  to authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260822174500','talent_api_schema_exposure','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260822174500_talent_api_schema_exposure.sql

-- RECOVERY BEGIN 20260827185123_wire_clinical_evidence_claim_map.sql
-- Wire clinical_evidence_claim_map for real use.
--
-- 20260821190000_clinical_framework_alignment_optional.sql created this table
-- deliberately locked down (RLS enabled, zero policies) with the explicit note
-- that whoever wires the Claim Map UI to it should add real policies as a
-- reviewed security change. Doing that now, at Tyler's direct request.
--
-- Access model: same review-role gate already used for the other admin-only
-- clinical governance tables (clinical_evidence_reviews, clinical_intake_queue,
-- etc.) via the existing clinical_evidence_has_review_role() helper — not a
-- new pattern, reusing what's already established.

drop policy if exists clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map;
create policy clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map
  for all to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());

revoke all on public.clinical_evidence_claim_map from anon;
grant select, insert, update on public.clinical_evidence_claim_map to authenticated;
grant all on public.clinical_evidence_claim_map to service_role;

drop trigger if exists clinical_evidence_claim_map_updated_at
  on public.clinical_evidence_claim_map;
create trigger clinical_evidence_claim_map_updated_at
before update on public.clinical_evidence_claim_map
for each row execute function public.clinical_set_updated_at();

-- Seed with the three entries the admin page has been showing as fixtures,
-- so switching the page over to the database is a zero-surprise change —
-- same content, now persisted and editable instead of hardcoded.
insert into public.clinical_evidence_claim_map (
  claim_key, claim_statement, claim_kind, framework_alignment,
  evidence_record_ids, gap_owner, target_date, status
) values
(
  'claim-dravet-cbd-efficacy',
  'Pharmaceutical purified CBD as adjunctive therapy reduces convulsive seizure frequency in Dravet syndrome versus placebo.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "covered", "notes": "Established association supported by pivotal programmes and labels."},
      "analytical_validation": {"status": "partial", "notes": "Pharmaceutical assay/manufacturing controls; not software validation."},
      "clinical_validation": {"status": "covered", "notes": "Pivotal RCTs showed clinically meaningful convulsive seizure reduction."}
    },
    "dtaDomains": [
      {"domain": "safety", "ecosystem": "regulatory", "status": "covered", "notes": "Labelled AEs and monitoring characterised."},
      {"domain": "benefit", "ecosystem": "regulatory", "status": "covered", "notes": "Efficacy on convulsive seizure frequency established."},
      {"domain": "durability", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Long-term developmental and durability data still accumulating."},
      {"domain": "usability_accessibility", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Access depends on jurisdiction and product authorisation."},
      {"domain": "user_engagement", "ecosystem": "payment", "status": "missing", "notes": "Not a DTx; engagement metrics N/A."}
    ],
    "dtxRwePhase": "monitor",
    "relevanceReliability": {
      "availability": "strong", "generalizability": "adequate", "accuracy": "strong",
      "completeness": "adequate", "provenance": "strong",
      "overallNotes": "Pivotal RCTs and regulatory assessments with clear provenance."
    },
    "alcoaPlusComplete": true,
    "commercialStageGate": "scale",
    "commercialPriority": "high"
  }'::jsonb,
  array['ev-dravet-cbd', 'ev-br-epilepsy-001'],
  'clinical-evidence',
  '2026-12-31',
  'partial'
),
(
  'claim-neuropathic-pain-modest',
  'Some THC-containing products produce small average reductions in chronic neuropathic pain intensity versus placebo, with higher adverse-event rates.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "partial", "notes": "Association signalled in meta-analyses; product heterogeneity limits strength."},
      "analytical_validation": {"status": "missing", "notes": "Heterogeneous non-standardised products dominate evidence base."},
      "clinical_validation": {"status": "partial", "notes": "Small average effects; functional benefit uncertain."}
    },
    "dtaDomains": [
      {"domain": "safety", "ecosystem": "regulatory", "status": "partial", "notes": "AE-related withdrawal not uncommon; product variability high."},
      {"domain": "benefit", "ecosystem": "clinical_acceptance", "status": "partial", "notes": "Modest intensity reductions in some analyses."},
      {"domain": "durability", "ecosystem": "clinical_acceptance", "status": "missing", "notes": "Long-term comparative effectiveness limited."}
    ],
    "dtxRwePhase": "test",
    "relevanceReliability": {
      "availability": "adequate", "generalizability": "partial", "accuracy": "partial",
      "completeness": "partial", "provenance": "adequate",
      "overallNotes": "Systematic reviews available; formulation heterogeneity weakens reliability."
    },
    "alcoaPlusComplete": false,
    "commercialStageGate": "series_a",
    "commercialPriority": "medium"
  }'::jsonb,
  array['ev-neuropathic-pain', 'ev-br-pain-001'],
  'clinical-evidence',
  '2027-06-30',
  'gap'
),
(
  'claim-ms-spasticity-nabiximols',
  'Oromucosal THC:CBD can improve moderate-to-severe MS spasticity symptoms after inadequate response to other agents in selected responders.',
  'efficacy',
  '{
    "imdrfPillars": {
      "valid_clinical_association": {"status": "covered", "notes": "Supported by nabiximols programme and product assessments."},
      "analytical_validation": {"status": "partial", "notes": "Regulated pharmaceutical product context."},
      "clinical_validation": {"status": "partial", "notes": "Enrichment designs limit generalisability; not first-line."}
    },
    "dtaDomains": [
      {"domain": "benefit", "ecosystem": "regulatory", "status": "partial", "notes": "NRS improvement in responder populations."},
      {"domain": "safety", "ecosystem": "regulatory", "status": "covered", "notes": "Dizziness and fatigue common and labelled."}
    ],
    "dtxRwePhase": "monitor",
    "relevanceReliability": {
      "availability": "adequate", "generalizability": "partial", "accuracy": "adequate",
      "completeness": "adequate", "provenance": "strong"
    },
    "alcoaPlusComplete": true,
    "commercialStageGate": "pre_launch",
    "commercialPriority": "high"
  }'::jsonb,
  array['ev-ms-spasticity'],
  null,
  null,
  'partial'
)
on conflict (claim_key) do nothing;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260827185123','wire_clinical_evidence_claim_map','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260827185123_wire_clinical_evidence_claim_map.sql

-- RECOVERY BEGIN 20260827185517_reconcile_claim_map_rls.sql
-- Reconcile clinical_evidence_claim_map RLS with a policy that appeared live
-- on the database moments after the previous migration in this session
-- (20260822150000_wire_clinical_evidence_claim_map.sql) — 'claim_map_select_authenticated',
-- open SELECT for any authenticated user. It wasn't in any committed migration
-- when found; almost certainly landed from concurrent work happening in
-- parallel with this session's own wiring pass. Not fighting it — an
-- internal admin gap-dashboard being readable by any authenticated staff
-- member (not just credentialed reviewers) is a reasonable design on its own
-- merits. Two things this migration does:
--
--   1. Commits that policy into version control as-is, so it stops being
--      invisible drift between the live database and this repo.
--   2. Narrows this session's own policy from `for all` (which redundantly
--      overlapped the read policy on SELECT) to `for insert`/`for update`
--      only, so the two policies are complementary instead of overlapping:
--      broad read, review-role-gated write.
--
-- Net effect on actual access is unchanged from immediately after both
-- policies existed together — this is a clarity/tracking fix, not a
-- behavior change.

drop policy if exists clinical_evidence_claim_map_review_access
  on public.clinical_evidence_claim_map;

drop policy if exists claim_map_select_authenticated
  on public.clinical_evidence_claim_map;
create policy claim_map_select_authenticated
  on public.clinical_evidence_claim_map
  for select
  to authenticated
  using (true);

create policy clinical_evidence_claim_map_insert_review
  on public.clinical_evidence_claim_map
  for insert
  to authenticated
  with check (public.clinical_evidence_has_review_role());

create policy clinical_evidence_claim_map_update_review
  on public.clinical_evidence_claim_map
  for update
  to authenticated
  using (public.clinical_evidence_has_review_role())
  with check (public.clinical_evidence_has_review_role());


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260827185517','reconcile_claim_map_rls','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260827185517_reconcile_claim_map_rls.sql

-- RECOVERY BEGIN 20260827234500_signal_freshness_timeline.sql
-- Canonical timeline fields for reviewed intelligence.
--
-- `date` is a legacy overloaded column: some ingestion paths used source/event
-- time while others used observation time. Keep it for compatibility, but never
-- rely on it to mean all four concepts below.

alter table public.signals
  add column if not exists source_published_at timestamptz,
  add column if not exists event_effective_at timestamptz,
  add column if not exists observed_at timestamptz,
  add column if not exists ingested_at timestamptz;

update public.signals
set
  observed_at = coalesce(observed_at, created_at),
  ingested_at = coalesce(ingested_at, created_at)
where observed_at is null or ingested_at is null;

-- Harvest explicit structured timestamps when upstream analysis already carries
-- them. pg_input_is_valid keeps malformed source strings from aborting replay.
update public.signals
set source_published_at = (analysis->>'source_published_at')::timestamptz
where source_published_at is null
  and analysis is not null
  and pg_input_is_valid(coalesce(analysis->>'source_published_at',''), 'timestamp with time zone');

update public.signals
set event_effective_at = (analysis->>'event_effective_at')::timestamptz
where event_effective_at is null
  and analysis is not null
  and pg_input_is_valid(coalesce(analysis->>'event_effective_at',''), 'timestamp with time zone');

-- Verified historical correction: the Sibiz page itself is dated 2025-08-22 and
-- describes the law as effective 2025-08-20. Preserve both rediscovered signal
-- rows for historical search; the Weekly Signals freshness gate suppresses them
-- from the current 7-day surface and URL dedupe prevents double presentation.
update public.signals
set
  source_published_at = '2025-08-22T00:00:00Z'::timestamptz,
  event_effective_at = '2025-08-20T00:00:00Z'::timestamptz
where url = 'https://sibiz.eu/slovenia-legalizes-medical-cannabis-marijuana-new-law-effective-from-august-20-2025/';

create or replace function public.hv_signal_timeline_defaults()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source text;
  v_event text;
begin
  new.observed_at := coalesce(new.observed_at, new.created_at, now());
  new.ingested_at := coalesce(new.ingested_at, new.created_at, now());

  if new.analysis is not null then
    if new.source_published_at is null then
      v_source := nullif(new.analysis->>'source_published_at', '');
      if v_source is not null and pg_input_is_valid(v_source, 'timestamp with time zone') then
        new.source_published_at := v_source::timestamptz;
      end if;
    end if;

    if new.event_effective_at is null then
      v_event := nullif(new.analysis->>'event_effective_at', '');
      if v_event is not null and pg_input_is_valid(v_event, 'timestamp with time zone') then
        new.event_effective_at := v_event::timestamptz;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.hv_signal_timeline_defaults() from public, anon, authenticated;

drop trigger if exists signals_timeline_defaults on public.signals;
create trigger signals_timeline_defaults
before insert or update of analysis, source_published_at, event_effective_at, observed_at, ingested_at
on public.signals
for each row execute function public.hv_signal_timeline_defaults();

create index if not exists signals_source_published_at_idx
  on public.signals (source_published_at desc)
  where reviewed = true;

create index if not exists signals_event_effective_at_idx
  on public.signals (event_effective_at desc)
  where reviewed = true;

-- CREATE OR REPLACE VIEW may append columns but cannot reorder/rename existing
-- positions. Keep every pre-existing api.signals_with_quality column in its
-- canonical order and append the timeline fields at the end.
create or replace view api.signals_with_quality
with (security_invoker = true)
as
select
  id, date, cat, pri, score, headline, summary, source, url, verification,
  tier, lang, company, country, in_network, lane_r, lane_e, lane_t, top_lane,
  query_pack, commercial_impact, reviewed, action, created_at,
  embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
  editorial_title, editorial_blurb, country_iso2,
  quality_label, quality_confidence, content_type, impact,
  title_en, summary_en, lang_detected, is_representative, cluster_rep_id,
  analysis,
  source_published_at, event_effective_at, observed_at, ingested_at
from public.signals;

revoke all on api.signals_with_quality from public, anon;
grant select on api.signals_with_quality to authenticated, service_role;

comment on column public.signals.source_published_at is
  'Timestamp published by the source when known; distinct from Harbourview observation/ingestion time.';
comment on column public.signals.event_effective_at is
  'Effective/event timestamp when known; distinct from source publication and Harbourview observation/ingestion.';
comment on column public.signals.observed_at is
  'When Harbourview observed the source; must not be presented as publication/event freshness by itself.';
comment on column public.signals.ingested_at is
  'When Harbourview persisted the signal; must not be presented as publication/event freshness by itself.';
comment on view api.signals_with_quality is
  'Authenticated quality view including explicit source/event/observation/ingestion timeline fields. Not granted to anon.';

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260827234500','signal_freshness_timeline','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260827234500_signal_freshness_timeline.sql

-- RECOVERY BEGIN 20260828004330_clinical_claim_map_flat_schema.sql
-- Reshape clinical_evidence_claim_map to match what the merged
-- app/api/clinical/admin/framework-alignment/route.ts already expects.
--
-- This session originally wired this table with a claim_key/framework_alignment
-- jsonb shape (20260827185123_wire_clinical_evidence_claim_map.sql). While that
-- was in flight, a concurrent session shipped a more complete rebuild of the
-- same admin surface — proper admin-auth guard, full audit logging via
-- clinical_admin_audit_log, and a flat-array EvidenceClaimMapEntry shape
-- (slug, condition_label, cannabinoid_focus, target_stage_gates,
-- target_imdrf_pillars, target_dta_domains, gap_summary, updated_by) — but
-- the migration for that shape was never committed, so the live table was
-- left in the old shape underneath the new code. Its own error path even
-- points at the wrong migration filename as a hint. This migration closes
-- that gap: adds the columns the merged route needs, migrates the 3 existing
-- rows across, and drops the columns nothing reads anymore.

alter table public.clinical_evidence_claim_map
  add column if not exists slug text,
  add column if not exists condition_label text,
  add column if not exists cannabinoid_focus text[] not null default '{}',
  add column if not exists target_stage_gates text[] not null default '{}',
  add column if not exists target_imdrf_pillars text[] not null default '{}',
  add column if not exists target_dta_domains text[] not null default '{}',
  add column if not exists gap_summary text,
  add column if not exists updated_by uuid;

update public.clinical_evidence_claim_map
set slug = claim_key
where slug is null;

update public.clinical_evidence_claim_map
set condition_label = coalesce(condition_label, initcap(replace(regexp_replace(claim_key, '^claim-', ''), '-', ' ')))
where condition_label is null;

-- Explicit, accurate labels for the 3 rows this session authored — better
-- than the mechanical placeholder derivation above for known content.
update public.clinical_evidence_claim_map
set condition_label = 'Dravet syndrome (adjunctive CBD)'
where claim_key = 'claim-dravet-cbd-efficacy';
update public.clinical_evidence_claim_map
set condition_label = 'Chronic neuropathic pain'
where claim_key = 'claim-neuropathic-pain-modest';
update public.clinical_evidence_claim_map
set condition_label = 'MS spasticity (nabiximols)'
where claim_key = 'claim-ms-spasticity-nabiximols';

update public.clinical_evidence_claim_map
set status = case status
  when 'complete' then 'supported'
  when 'partial' then 'partial'
  when 'gap' then 'gap'
  else 'gap'
end;

alter table public.clinical_evidence_claim_map
  alter column slug set not null;

alter table public.clinical_evidence_claim_map
  drop constraint if exists clinical_evidence_claim_map_status_check;
alter table public.clinical_evidence_claim_map
  add constraint clinical_evidence_claim_map_status_check
  check (status in ('supported', 'partial', 'gap', 'not_applicable'));

alter table public.clinical_evidence_claim_map
  drop constraint if exists clinical_evidence_claim_map_claim_key_key;
alter table public.clinical_evidence_claim_map
  add constraint clinical_evidence_claim_map_slug_key unique (slug);

-- Columns nothing in the merged app reads anymore. claim_kind and
-- framework_alignment (the jsonb blob) are superseded by the flat
-- target_imdrf_pillars/target_dta_domains/etc. arrays above; gap_owner and
-- target_date had no equivalent in the merged shape and no code references
-- them either.
alter table public.clinical_evidence_claim_map
  drop column if exists claim_key,
  drop column if exists claim_kind,
  drop column if exists framework_alignment,
  drop column if exists gap_owner,
  drop column if exists target_date;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260828004330','clinical_claim_map_flat_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260828004330_clinical_claim_map_flat_schema.sql

-- RECOVERY BEGIN 20260828022000_fix_counterparty_extraction_cte_scope.sql
-- Fix: the live run_signal_counterparty_extraction() references a CTE from a
-- statement that has already ended, so its collect phase can never return.
--
-- The collect branch builds a WITH chain (resp -> parsed -> ok -> extracted ->
-- ins -> mark_used -> done) and terminates it with:
--
--     select count(*) from ins into v_inserted;
--
-- and then, as a SEPARATE statement, does:
--
--     return jsonb_build_object(..., 'provider', (select provider from parsed), ...);
--
-- Common table expressions are scoped to the single statement that defines them,
-- so `parsed` no longer exists by the time the RETURN runs. Every collect-phase
-- invocation raises
--
--     ERROR: relation "parsed" does not exist
--
-- which aborts the transaction and rolls back the ia_counterparties upserts, the
-- ia_signals.counterparty_extracted_at marks, and the _counterparty_jobs
-- collected flag that the same statement just wrote.
--
-- Observed impact (read-only query of cron.job_run_details, 2026-08-28): the
-- `counterparty-extraction` job failed 161 consecutive runs, every run since
-- 2026-08-24 18:10 UTC. Last success 2026-08-24 17:40 UTC. No counterparties
-- were extracted in that window.
--
-- WHY THIS MIGRATION HAS TWO PATHS
--
-- The defect exists only in production. The committed repository body (see
-- 20260704135057_fix_unprotected_http_content_cast.sql, collect-phase return)
-- returns no `provider` key at all and therefore has no out-of-scope reference:
--
--     return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));
--
-- Production's live body has drifted from that committed body -- it carries a
-- Gemini fallback, a provider-degradation check and a pipeline_manual_review_queue
-- path that appear in no migration in this repository, and the `provider` key
-- (with the defect) came in with them. That drift is pre-existing and is NOT
-- resolved here; resolving it means adopting a body this repository has never
-- reviewed, which is a separate decision with a separate blast radius.
--
-- So this migration converges from either starting body:
--   * live/production body  -> patch the collect-phase return (the fix).
--   * committed repo body   -> already correct, nothing to do (fresh
--                              `supabase db reset --local` replay path).
--   * anything else         -> raise, so an unexpected body fails loudly
--                              instead of silently no-opping.
--
-- The patch is applied over pg_get_functiondef() rather than by restating the
-- body, following the house pattern in
-- 20260815234000_daily_brief_lineage_hardening.sql. Restating is what would
-- silently revert the drifted live behaviour.
--
-- The corrected shape -- resolve the CTE inside the statement that owns it, then
-- return a variable -- is exactly what the sibling pipeline functions
-- run_daily_digest() and run_editorial_digest() already do correctly. Both were
-- checked and neither carries this defect; both are deliberately left untouched.
--
-- Grants: intentionally not modified. The function's current ACL is
-- `postgres=X/postgres` -- no service_role grant, no PUBLIC. CREATE OR REPLACE
-- preserves the existing ACL, so this migration neither widens nor narrows it.
--
-- Rollback: write a NEW forward migration that applies the two replacements in
-- reverse (v_old and v_new swapped). Do NOT edit and re-run this file: its version
-- is recorded in supabase_migrations.schema_migrations once applied, so it will not
-- re-run, and editing a recorded migration breaks its content-hash binding.
--
-- Reversal is mechanically possible because the marker this file guards on,
-- `(select provider from parsed)`, SURVIVES the patch -- it moves into the
-- `select ... into v_inserted, v_collect_provider` statement rather than being
-- deleted -- so a reverse patch is not blocked by the guard above. Verified on a
-- local PostgreSQL 16 cluster.
--
-- No data is written and no schema object is created or dropped; the only effect
-- is the text of one function body.

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_signal_counterparty_extraction()'::regprocedure) into v_def;

  if position('(select provider from parsed)' in v_def) = 0 then
    -- Not the drifted production body. The ONLY acceptable no-op is the committed
    -- repository body, whose collect-phase return carries no `provider` key and
    -- therefore has no out-of-scope CTE reference. Verify that positively rather
    -- than treating every marker-free body as known-good: a body edited again
    -- out-of-band, or one carrying the same defect with different whitespace or
    -- capitalization, must NOT be silently recorded as applied while the cron
    -- stays broken.
    if position($ok$    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));$ok$ in v_def) = 0 then
      raise exception 'counterparty extraction CTE-scope fix: unrecognized function body -- it is neither the drifted production body nor the committed repository body, so this migration refuses to record itself as applied. Inspect pg_get_functiondef(''public.run_signal_counterparty_extraction()''::regprocedure) and reconcile before retrying.';
    end if;
    raise notice 'run_signal_counterparty_extraction: committed repository body confirmed; collect-phase return has no out-of-scope CTE reference; nothing to fix';
    return;
  end if;

  -- 1. Declare the variable that carries the provider out of the CTE statement.
  v_old := $old$  v_provider text; v_attempts int; v_failures int;$old$;
  v_new := $new$  v_provider text; v_attempts int; v_failures int;
  v_collect_provider text;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty extraction CTE-scope fix: declare anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 2. Resolve `parsed` while it is still in scope, and return the variable.
  v_old := $old$    select count(*) from ins into v_inserted;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', (select provider from parsed), 'counterparties_touched', coalesce(v_inserted,0));$old$;
  v_new := $new$    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty extraction CTE-scope fix: collect-phase return anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260828022000','fix_counterparty_extraction_cte_scope','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260828022000_fix_counterparty_extraction_cte_scope.sql

-- RECOVERY BEGIN 20260828130000_network_command_p0_p1_release_hardening.sql
begin;

-- Network Command P0-P1 release hardening.
-- Production exposes both `public` and `api` through PostgREST. Harbourview
-- application clients are intentionally pinned to `api`, while base-table RLS
-- and grants remain authoritative for the exposed `public` schema.

-- Small API-schema bridge used by Network Command rendering so the UI can show
-- only lifecycle transitions that the current signed-in actor may actually use.
create or replace function api.hv_network_is_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    auth.uid() is not null
    and public.hv_has_transaction_role(
      array['admin', 'operator', 'super_admin', 'compliance_reviewer']
    );
$$;

revoke all on function api.hv_network_is_staff() from public, anon;
grant execute on function api.hv_network_is_staff() to authenticated, service_role;

-- Keep the original P1 transition function authoritative. The app's Supabase
-- client is pinned to `api`, so this invoker wrapper only transports the call;
-- public.hv_network_advance_introduction still performs membership/staff checks,
-- transition validation, row locking, update, and audit-event creation.
create or replace function api.hv_network_advance_introduction(
  p_introduction_id uuid,
  p_to_status text,
  p_outcome text default null,
  p_detail jsonb default '{}'::jsonb
) returns public.network_introductions
language sql
security invoker
set search_path = ''
as $$
  select public.hv_network_advance_introduction(
    p_introduction_id,
    p_to_status,
    p_outcome,
    coalesce(p_detail, '{}'::jsonb)
  );
$$;

revoke all on function api.hv_network_advance_introduction(uuid, text, text, jsonb) from public, anon;
grant execute on function api.hv_network_advance_introduction(uuid, text, text, jsonb) to authenticated, service_role;

-- Atomic introduction request. This SECURITY DEFINER function intentionally
-- bypasses table RLS only after reproducing the authoritative authorization and
-- linkage checks inside the function. It inserts both the lifecycle object and
-- its immutable initial audit event in the same transaction.
create or replace function api.hv_network_request_introduction(
  p_workspace_id uuid,
  p_reason text,
  p_requested_disclosure_scope text default 'identity_and_business_context',
  p_mission_id uuid default null,
  p_target_entity_id uuid default null,
  p_target_source_kind text default null,
  p_target_source_id text default null
) returns public.network_introductions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  cleaned_reason text := btrim(coalesce(p_reason, ''));
  cleaned_scope text := btrim(coalesce(p_requested_disclosure_scope, ''));
  cleaned_source_kind text := nullif(btrim(coalesce(p_target_source_kind, '')), '');
  cleaned_source_id text := nullif(btrim(coalesce(p_target_source_id, '')), '');
  rec public.network_introductions;
begin
  if actor_user_id is null then
    raise exception 'NETWORK_INTRODUCTION_UNAUTHENTICATED';
  end if;

  if p_workspace_id is null
     or not public.hv_network_active_workspace_member(p_workspace_id) then
    raise exception 'NETWORK_INTRODUCTION_FORBIDDEN';
  end if;

  if length(cleaned_reason) < 1 or length(cleaned_reason) > 2000 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_REASON';
  end if;

  if length(cleaned_scope) < 1 or length(cleaned_scope) > 160 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_DISCLOSURE_SCOPE';
  end if;

  if cleaned_source_kind is not null and length(cleaned_source_kind) > 80 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_SOURCE_KIND';
  end if;
  if cleaned_source_id is not null and length(cleaned_source_id) > 240 then
    raise exception 'NETWORK_INTRODUCTION_INVALID_SOURCE_ID';
  end if;
  if (cleaned_source_kind is null) <> (cleaned_source_id is null) then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TARGET';
  end if;
  if p_target_entity_id is null and cleaned_source_kind is null then
    raise exception 'NETWORK_INTRODUCTION_INVALID_TARGET';
  end if;

  if p_mission_id is not null and not exists (
    select 1
    from public.network_missions m
    where m.id = p_mission_id
      and m.workspace_id = p_workspace_id
  ) then
    raise exception 'NETWORK_MISSION_WORKSPACE_MISMATCH';
  end if;

  if p_target_entity_id is not null and not exists (
    select 1 from public.entities e where e.id = p_target_entity_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_TARGET_NOT_FOUND';
  end if;

  -- If the source record already has an authoritative resolved entity bridge,
  -- callers may not pair it with a conflicting canonical entity id.
  if p_target_entity_id is not null and cleaned_source_kind is not null and exists (
    select 1
    from public.network_source_entity_links l
    where l.source_kind = cleaned_source_kind
      and l.source_id = cleaned_source_id
      and l.resolution_status = 'resolved'
      and l.entity_id is distinct from p_target_entity_id
  ) then
    raise exception 'NETWORK_INTRODUCTION_TARGET_MISMATCH';
  end if;

  insert into public.network_introductions (
    workspace_id,
    mission_id,
    requester_user_id,
    target_entity_id,
    target_source_kind,
    target_source_id,
    reason,
    requested_disclosure_scope,
    status,
    consent_required
  ) values (
    p_workspace_id,
    p_mission_id,
    actor_user_id,
    p_target_entity_id,
    cleaned_source_kind,
    cleaned_source_id,
    cleaned_reason,
    cleaned_scope,
    'review',
    true
  )
  returning * into rec;

  insert into public.network_introduction_events (
    introduction_id,
    workspace_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    detail
  ) values (
    rec.id,
    rec.workspace_id,
    actor_user_id,
    'requested',
    null,
    'review',
    jsonb_build_object('requested_disclosure_scope', cleaned_scope)
  );

  return rec;
end;
$$;

revoke all on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) from public, anon;
grant execute on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) to authenticated, service_role;

-- Direct authenticated creation is removed from both exposed schemas. The only
-- authenticated creation path is the atomic RPC above; service_role remains
-- available for controlled server/admin operations.
revoke insert on table public.network_introductions from authenticated;
revoke insert on table public.network_introduction_events from authenticated;
revoke insert on api.network_introductions from authenticated;
revoke insert on api.network_introduction_events from authenticated;

drop policy if exists network_introductions_member_insert on public.network_introductions;
drop policy if exists network_introduction_events_member_insert on public.network_introduction_events;

-- Atomic mission + requirements creation. Direct mission editing remains under
-- its existing RLS contract, but the customer create flow can no longer leave
-- an archived partial mission when a requirement fails.
create or replace function api.hv_network_create_mission(
  p_workspace_id uuid,
  p_name text,
  p_objective text,
  p_country_iso2 text default null,
  p_target_country_iso2s text[] default '{}'::text[],
  p_target_date date default null,
  p_confidentiality text default 'workspace',
  p_requirements jsonb default '[]'::jsonb
) returns public.network_missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  cleaned_name text := btrim(coalesce(p_name, ''));
  cleaned_objective text := btrim(coalesce(p_objective, ''));
  cleaned_country text := nullif(upper(btrim(coalesce(p_country_iso2, ''))), '');
  cleaned_targets text[] := coalesce(p_target_country_iso2s, '{}'::text[]);
  cleaned_confidentiality text := btrim(coalesce(p_confidentiality, 'workspace'));
  rec public.network_missions;
  requirement jsonb;
  requirement_type text;
  requirement_label text;
  requirement_description text;
  capability_code text;
  licence_activity text;
  requirement_country text;
  expected_value jsonb;
  hard_requirement boolean;
  idx integer := 0;
begin
  if actor_user_id is null then
    raise exception 'NETWORK_MISSION_UNAUTHENTICATED';
  end if;

  if p_workspace_id is null
     or not public.hv_network_active_workspace_member(p_workspace_id) then
    raise exception 'NETWORK_MISSION_FORBIDDEN';
  end if;

  if length(cleaned_name) < 1 or length(cleaned_name) > 160 then
    raise exception 'NETWORK_MISSION_INVALID_NAME';
  end if;
  if length(cleaned_objective) < 1 or length(cleaned_objective) > 2000 then
    raise exception 'NETWORK_MISSION_INVALID_OBJECTIVE';
  end if;
  if cleaned_country is not null and cleaned_country !~ '^[A-Z]{2}$' then
    raise exception 'NETWORK_MISSION_INVALID_COUNTRY';
  end if;
  if cardinality(cleaned_targets) > 30
     or exists (select 1 from unnest(cleaned_targets) value where upper(btrim(value)) !~ '^[A-Z]{2}$') then
    raise exception 'NETWORK_MISSION_INVALID_TARGET_COUNTRY';
  end if;
  cleaned_targets := array(
    select upper(btrim(value)) from unnest(cleaned_targets) value
  );
  if cleaned_confidentiality not in ('workspace', 'restricted') then
    raise exception 'NETWORK_MISSION_INVALID_CONFIDENTIALITY';
  end if;
  if p_requirements is null or jsonb_typeof(p_requirements) <> 'array'
     or jsonb_array_length(p_requirements) > 50 then
    raise exception 'NETWORK_MISSION_INVALID_REQUIREMENTS';
  end if;

  insert into public.network_missions (
    workspace_id,
    created_by,
    name,
    objective,
    status,
    country_iso2,
    target_country_iso2s,
    target_date,
    confidentiality
  ) values (
    p_workspace_id,
    actor_user_id,
    cleaned_name,
    cleaned_objective,
    'active',
    cleaned_country,
    cleaned_targets,
    p_target_date,
    cleaned_confidentiality
  )
  returning * into rec;

  for requirement in select value from jsonb_array_elements(p_requirements)
  loop
    if jsonb_typeof(requirement) <> 'object' then
      raise exception 'NETWORK_MISSION_INVALID_REQUIREMENT';
    end if;

    requirement_type := btrim(coalesce(requirement->>'requirementType', ''));
    requirement_label := btrim(coalesce(requirement->>'label', ''));
    requirement_description := nullif(btrim(coalesce(requirement->>'description', '')), '');
    capability_code := nullif(btrim(coalesce(requirement->>'capabilityCode', '')), '');
    licence_activity := nullif(btrim(coalesce(requirement->>'licenceActivity', '')), '');
    requirement_country := nullif(upper(btrim(coalesce(requirement->>'countryIso2', ''))), '');
    expected_value := coalesce(requirement->'expectedValue', '{}'::jsonb);
    hard_requirement := case
      when requirement ? 'hardRequirement' then (requirement->>'hardRequirement')::boolean
      else true
    end;

    if length(requirement_type) < 1 or length(requirement_type) > 80
       or length(requirement_label) < 1 or length(requirement_label) > 240
       or (requirement_description is not null and length(requirement_description) > 2000)
       or (capability_code is not null and length(capability_code) > 120)
       or (licence_activity is not null and length(licence_activity) > 160)
       or (requirement_country is not null and requirement_country !~ '^[A-Z]{2}$')
       or jsonb_typeof(expected_value) <> 'object' then
      raise exception 'NETWORK_MISSION_INVALID_REQUIREMENT';
    end if;

    insert into public.network_mission_requirements (
      mission_id,
      created_by,
      requirement_type,
      label,
      description,
      hard_requirement,
      capability_code,
      licence_activity,
      country_iso2,
      expected_value,
      status,
      sort_order
    ) values (
      rec.id,
      actor_user_id,
      requirement_type,
      requirement_label,
      requirement_description,
      hard_requirement,
      capability_code,
      licence_activity,
      requirement_country,
      expected_value,
      'active',
      idx
    );

    idx := idx + 1;
  end loop;

  return rec;
end;
$$;

revoke all on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) from public, anon;
grant execute on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) to authenticated, service_role;

comment on function api.hv_network_request_introduction(uuid, text, text, uuid, uuid, text, text) is
  'Atomic authenticated Network introduction request. Enforces active workspace membership, validates linked mission/target, writes one review-state introduction and its requested event together.';
comment on function api.hv_network_create_mission(uuid, text, text, text, text[], date, text, jsonb) is
  'Atomic authenticated Network mission plus requirement creation with active-workspace authorization.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260828130000','network_command_p0_p1_release_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260828130000_network_command_p0_p1_release_hardening.sql

-- RECOVERY BEGIN 20260828143000_signal_timeline_population_hardening.sql
-- Forward-only hardening for the explicit public.signals timeline introduced by
-- 20260827234500_signal_freshness_timeline.sql.
--
-- Production evidence shows current reviewed signal producers already persist
-- trustworthy structured `analysis.publication_date` and `analysis.effective_date`
-- values, but the original trigger only harvested the newer
-- `source_published_at` / `event_effective_at` keys. Preserve that producer
-- contract and promote valid structured dates into the canonical top-level
-- timeline without treating observation/ingestion as publication.

update public.signals
set source_published_at = (analysis->>'publication_date')::timestamptz
where source_published_at is null
  and analysis is not null
  and nullif(analysis->>'publication_date', '') is not null
  and pg_input_is_valid(analysis->>'publication_date', 'timestamp with time zone');

update public.signals
set event_effective_at = (analysis->>'effective_date')::timestamptz
where event_effective_at is null
  and analysis is not null
  and nullif(analysis->>'effective_date', '') is not null
  and pg_input_is_valid(analysis->>'effective_date', 'timestamp with time zone');

create or replace function public.hv_signal_timeline_defaults()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source text;
  v_event text;
begin
  new.observed_at := coalesce(new.observed_at, new.created_at, now());
  new.ingested_at := coalesce(new.ingested_at, new.created_at, now());

  if new.analysis is not null then
    if new.source_published_at is null then
      v_source := nullif(new.analysis->>'source_published_at', '');
      if v_source is null or not pg_input_is_valid(v_source, 'timestamp with time zone') then
        v_source := nullif(new.analysis->>'publication_date', '');
      end if;
      if v_source is not null and pg_input_is_valid(v_source, 'timestamp with time zone') then
        new.source_published_at := v_source::timestamptz;
      end if;
    end if;

    if new.event_effective_at is null then
      v_event := nullif(new.analysis->>'event_effective_at', '');
      if v_event is null or not pg_input_is_valid(v_event, 'timestamp with time zone') then
        v_event := nullif(new.analysis->>'effective_date', '');
      end if;
      if v_event is not null and pg_input_is_valid(v_event, 'timestamp with time zone') then
        new.event_effective_at := v_event::timestamptz;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.hv_signal_timeline_defaults() from public, anon, authenticated;

comment on function public.hv_signal_timeline_defaults() is
  'Populates canonical signal timeline fields from explicit structured source/event dates while keeping observation and ingestion separate.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260828143000','signal_timeline_population_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260828143000_signal_timeline_population_hardening.sql

-- RECOVERY BEGIN 20260828153000_counterparty_extraction_degradation_visibility.sql
-- Make counterparty extraction fail loudly instead of silently.
--
-- Two defects, both found on 2026-08-28 after the CTE-scope fix in
-- 20260828022000 stopped the function crashing and revealed what was underneath.
--
-- DEFECT 1 -- the all-providers-degraded alarm is unreachable.
--
-- The fire branch measures the recent failure rate for `anthropic` only:
--
--     if v_anthropic_key is not null then
--       select ... count(*) filter (where r.status_code <> 200) ... provider='anthropic' ...
--       if ... < 0.5 then v_provider := 'anthropic'; end if;
--     end if;
--     if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
--
-- Gemini is selected unconditionally whenever a key exists. So `v_provider` is
-- never null while a gemini key is configured, and the branch below it --
--
--     if v_provider is null then
--       insert into pipeline_manual_review_queue (...) values ('counterparty_extraction', ...
--         'all_configured_llm_providers_degraded', ...);
--
-- -- cannot fire, even when every configured provider is in fact degraded. That
-- is exactly the condition it was built to catch. Verified live on 2026-08-28:
-- Anthropic returning 400 "credit balance is too low" and Gemini returning 429
-- quota-exceeded, simultaneously, with no queue row and no notification.
--
-- Fixed by applying the same recent-failure-rate check to gemini that anthropic
-- already gets -- a faithful mirror: same 2-hour window, same 10-attempt sample,
-- same 0.5 threshold. When both are degraded `v_provider` is now null, the
-- existing insert fires, and the existing daily cron at
-- app/api/cron/pipeline-manual-review-notify emails it. No new cron and no new
-- delivery channel: INTELLIGENCE_ARCHITECTURE_SPEC.md Stage G explicitly warns
-- against "adding a new always-on cron to solve an always-on-cron problem", and
-- the delivery-channel choice is an open owner decision. This reuses what is
-- already built and already wired.
--
-- DEFECT 2 -- the collect phase reports success when it did nothing.
--
-- On a non-200 the chain produces no `ok` rows, so nothing is extracted, but the
-- job is still marked collected and the function returns a bare
-- `{"ok": true, "phase": "collect", ...}`. Before 20260828022000 a broken
-- pipeline at least showed red in cron.job_run_details; afterwards the identical
-- broken pipeline shows green. The return now carries `llm_status_code` and a
-- `degraded` flag so "ran" is distinguishable from "worked" by anything reading
-- the function's output. Guardrail #5.
--
-- REPOSITORY/PRODUCTION DRIFT -- unresolved, and why this file has two paths.
--
-- Defect 1 exists only in production. No committed migration gives this function
-- a gemini fallback, a provider-degradation check, or the
-- `all_configured_llm_providers_degraded` path at all -- verified across all
-- three migrations that define it (20260704133107, 20260704135057,
-- 20260828022000). Those arrived in an uncommitted production rewrite. Closing
-- that drift means adopting a body this repository has never reviewed, which is
-- a separate owner decision and is NOT taken here.
--
-- So: the production body gets both fixes. The committed repository body has no
-- provider-selection block to correct, so it raises a NOTICE naming the drift
-- rather than pretending there was nothing to do. Any third body raises an
-- exception rather than recording itself as applied.
--
-- Coverage: tests/sql/counterparty_extraction_degradation_dry_run.sql builds a
-- production-shaped fixture and asserts both fixes, so the production-only path
-- is reproducible from this commit rather than from a throwaway cluster.
--
-- Grants: not modified. ACL is `postgres=X/postgres`; CREATE OR REPLACE
-- preserves it.
--
-- Rollback: a NEW forward migration applying both replacements in reverse. Do
-- not edit and re-run this file -- once applied its version is recorded and it
-- will not re-run, and editing a recorded migration breaks its content-hash
-- binding.

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_signal_counterparty_extraction()'::regprocedure) into v_def;

  if position('v_gemini_key' in v_def) = 0 then
    if position($ok$    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));$ok$ in v_def) = 0 then
      raise exception 'counterparty degradation visibility: unrecognized function body -- neither the drifted production body (no v_gemini_key) nor the committed repository body; refusing to record this migration as applied';
    end if;
    raise notice 'run_signal_counterparty_extraction: committed repository body has no provider-selection block (no gemini fallback, no degradation check) -- that logic exists only in the drifted production body, which is a separate unresolved decision. Nothing to patch here.';
    return;
  end if;

  -- 1. Declare the variable carrying the collect-phase HTTP status out of the CTE.
  v_old := $old$  v_collect_provider text;$old$;
  v_new := $new$  v_collect_provider text;
  v_collect_status int;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: declare anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 2. Surface the LLM status and a degraded flag from the collect phase.
  v_old := $old$    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));$old$;
  v_new := $new$    select (select count(*) from ins), (select provider from parsed), (select status_code from parsed)
      into v_inserted, v_collect_provider, v_collect_status;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider,
      'counterparties_touched', coalesce(v_inserted,0),
      'llm_status_code', v_collect_status,
      'degraded', coalesce(v_collect_status, 0) <> 200);$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: collect-phase return anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 3. Give gemini the same degradation check anthropic already has, so the
  --    all-providers-degraded branch below it becomes reachable.
  v_old := $old$  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;$old$;
  v_new := $new$  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: gemini selection anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260828153000','counterparty_extraction_degradation_visibility','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260828153000_counterparty_extraction_degradation_visibility.sql

-- RECOVERY BEGIN 20260829120000_live_tier_pipeline_hardening.sql
-- ============================================================
-- Live regulatory-tier pipeline hardening
-- ============================================================
-- Implements:
--   1. Classifier-driven reclassify for origin=auto only
--   2. Subnational first-class (review queue + classifier text by iso)
--   3. Review queue includes needs_review + differs_from_classifier for all
--   4. Legend contract unchanged (legal_commercial_access = cross-border commercial)
--   5. All writes go through set_regulatory_tier / accept_classifier_tier / reclassify
-- ============================================================

-- 1. Resolve briefing text for any iso (country or subnational state_iso2)
create or replace function api.briefing_text_for_iso(p_iso text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select api.briefing_classifier_text(
    b.program_status,
    b.public_summary,
    b.market_dynamics,
    b.regulatory_outlook
  )
  from public.cc_jurisdiction_briefings b
  where
    (b.jurisdiction_type = 'country' and b.country_iso2 = p_iso)
    or (b.state_iso2 is not null and b.state_iso2 = p_iso)
  order by
    case when b.state_iso2 = p_iso then 0 else 1 end,
    b.last_reviewed_date desc nulls last
  limit 1;
$$;

comment on function api.briefing_text_for_iso(text) is
  'Canonical classifier input for a country or subnational iso (US-*, CA-*, etc.).';

revoke all on function api.briefing_text_for_iso(text) from public, anon;
grant execute on function api.briefing_text_for_iso(text) to authenticated, service_role;

-- 2. Bulk reclassify: only origin=auto rows; never clobber overrides
create or replace function api.reclassify_auto_tiers(
  p_actor text default 'system'
)
returns table (
  iso_alpha2 text,
  old_tier text,
  new_tier text,
  action text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_ps text;
  v_new text;
  v_old text;
begin
  for r in
    select c.iso_alpha2, c.regulatory_tier
    from public.countries c
    where c.regulatory_tier_origin = 'auto'
       or c.regulatory_tier_origin is null
  loop
    v_ps := api.briefing_text_for_iso(r.iso_alpha2);
    v_new := api.derive_regulatory_tier(v_ps);
    v_old := r.regulatory_tier;

    if v_new is null then
      iso_alpha2 := r.iso_alpha2;
      old_tier := v_old;
      new_tier := v_old;
      action := 'skipped_no_briefing';
      return next;
      continue;
    end if;

    if v_new is not distinct from v_old then
      update public.countries set
        regulatory_tier_source_hash = md5(coalesce(v_ps, '')),
        regulatory_tier_last_derived_at = now(),
        regulatory_tier_needs_review = false
      where public.countries.iso_alpha2 = r.iso_alpha2;

      iso_alpha2 := r.iso_alpha2;
      old_tier := v_old;
      new_tier := v_new;
      action := 'unchanged';
      return next;
      continue;
    end if;

    update public.countries set
      regulatory_tier = v_new,
      regulatory_tier_origin = 'auto',
      regulatory_tier_source_hash = md5(coalesce(v_ps, '')),
      regulatory_tier_last_derived_at = now(),
      regulatory_tier_needs_review = false,
      regulatory_tier_source = 'reclassify_auto_tiers (' || p_actor || ') ' || to_char(now(), 'YYYY-MM-DD'),
      regulatory_tier_rationale = left(coalesce(v_ps, ''), 500)
    where public.countries.iso_alpha2 = r.iso_alpha2;

    insert into public.regulatory_tier_audit
      (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
    values
      (r.iso_alpha2, v_old, v_new, 'auto', 'reclassify_auto', v_ps, p_actor, 'Bulk reclassify from briefing');

    iso_alpha2 := r.iso_alpha2;
    old_tier := v_old;
    new_tier := v_new;
    action := 'updated';
    return next;
  end loop;
end;
$$;

comment on function api.reclassify_auto_tiers(text) is
  'Re-derive regulatory_tier from briefings for origin=auto only. Overrides are never touched. Audited.';

revoke all on function api.reclassify_auto_tiers(text) from public, anon, authenticated;
grant execute on function api.reclassify_auto_tiers(text) to service_role;

-- 3. Review queue: all rows that need review OR differ from classifier (incl. subnational)
create or replace view api.regulatory_tier_review_queue as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.regulatory_tier as current_tier,
  c.regulatory_tier_origin as origin,
  api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) as classifier_suggests,
  (
    c.regulatory_tier is distinct from
    api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2))
  ) as differs_from_classifier,
  api.briefing_text_for_iso(c.iso_alpha2) as program_status,
  c.regulatory_tier_rationale as rationale,
  c.regulatory_tier_reviewed_at as reviewed_at,
  c.regulatory_tier_last_derived_at as last_derived_at,
  c.regulatory_tier_needs_review as needs_review
from public.countries c
where
  c.regulatory_tier_needs_review = true
  or (
    c.regulatory_tier is distinct from
    api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2))
  )
order by c.country_name;

grant select on api.regulatory_tier_review_queue to authenticated, service_role;

-- 4. Ensure set_regulatory_tier accepts cbd_hemp_only and writes audit (idempotent recreate)
create or replace function api.set_regulatory_tier(
  p_iso text,
  p_tier text,
  p_actor text default 'agent',
  p_note text default null
) returns public.countries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  -- Preserve the existing runtime admin authorization boundary. Direct postgres
  -- migration sessions are trusted schema-owner operations and have no auth.uid().
  if session_user <> 'postgres' and not public.is_regulatory_tier_admin() then
    raise exception 'insufficient privileges: admin role required' using errcode = '42501';
  end if;

  if p_tier is not null and p_tier not in (
    'legal_commercial_access',
    'medical_limited_trade',
    'domestic_only',
    'cbd_hemp_only',
    'prohibited'
  ) then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then
    raise exception 'unknown country %', p_iso;
  end if;

  v_ps := api.briefing_text_for_iso(p_iso);

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps, '')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'set_regulatory_tier (' || p_actor || ') ' || to_char(now(), 'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor,
     coalesce(p_note, 'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;

revoke all on function api.set_regulatory_tier(text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function api.set_regulatory_tier(text, text, text, text) to postgres;

-- 5. Priority live corrections via audited set path (legend-aligned)
-- medical_limited_trade: lawful medical, no full commercial cross-border
do $$
declare
  iso text;
begin
  foreach iso in array array['BR','AR','GB','DE','NL','ES','IT','FR','PT','PL','CZ','AU']
  loop
    begin
      perform api.set_regulatory_tier(iso, 'medical_limited_trade', 'ops-hardening',
        'Legend: medical market; narrow or no commercial cross-border route');
    exception when others then
      null; -- iso may not exist yet
    end;
  end loop;

  foreach iso in array array['UY','CA','CO','MT','LU']
  loop
    begin
      perform api.set_regulatory_tier(iso, 'legal_commercial_access', 'ops-hardening',
        'Legend: lawful cross-border commercial pathway in operation');
    exception when others then
      null;
    end;
  end loop;

  foreach iso in array array['TR','CN']
  loop
    begin
      perform api.set_regulatory_tier(iso, 'cbd_hemp_only', 'ops-hardening',
        'Legend: hemp/CBD pathway; cannabis otherwise restricted');
    exception when others then
      null;
    end;
  end loop;
end $$;

-- Canada provinces: federal adult-use commercial
do $$
declare
  iso text;
begin
  foreach iso in array array[
    'CA-AB','CA-BC','CA-MB','CA-NB','CA-NL','CA-NS','CA-NT','CA-NU',
    'CA-ON','CA-PE','CA-QC','CA-SK','CA-YT'
  ]
  loop
    begin
      perform api.set_regulatory_tier(iso, 'legal_commercial_access', 'ops-hardening',
        'Canada federal adult-use + commercial retail since 2018');
    exception when others then
      null; -- row may not exist until subnational seed applied
    end;
  end loop;
end $$;

-- 6. Kick auto reclassify for remaining auto rows (does not touch overrides above)
select * from api.reclassify_auto_tiers('ops-hardening-20260829');

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260829120000','live_tier_pipeline_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260829120000_live_tier_pipeline_hardening.sql

-- RECOVERY BEGIN 20260829130000_tier_optimization_batch2.sql
-- Batch 2: legend-aligned live tier corrections + auto reclassify
-- Use set_regulatory_tier so audit trail is preserved.

-- Medical markets (lawful medical; limited/no full commercial cross-border)
do $$
declare iso text;
begin
  foreach iso in array array[
    'AR',  -- Argentina medical
    'TH',  -- Thailand medical
    'NZ',  -- New Zealand medical
    'JP',  -- Japan limited medical/pharma
    'MX',  -- Mexico medical / limited
    'PE',  -- Peru medical
    'CL',  -- Chile medical
    'CH',  -- Switzerland medical / limited
    'NO',  -- Norway medical
    'FI',  -- Finland medical
    'IE',  -- Ireland medical
    'AT',  -- Austria medical
    'BE',  -- Belgium medical
    'DK',  -- Denmark medical
    'SE'   -- Sweden medical (narrow)
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'medical_limited_trade', 'ops-batch2',
        'Legend: lawful medical market; narrow or no commercial cross-border route'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Commercial / export leaders
do $$
declare iso text;
begin
  foreach iso in array array[
    'UY',  -- Uruguay adult-use commercial
    'CO',  -- Colombia export leader
    'IL',  -- Israel medical export ecosystem
    'PT',  -- Portugal medical + EU trade pathways
    'DK'   -- if export licences active; else medical already set above — last write wins; prefer medical for DK
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'legal_commercial_access', 'ops-batch2',
        'Legend: lawful cross-border commercial pathway in operation'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Revert DK to medical (safer default; export not general commercial access)
do $$
begin
  perform api.set_regulatory_tier(
    'DK', 'medical_limited_trade', 'ops-batch2',
    'Denmark: medical pathway; not general commercial access'
  );
exception when others then null;
end $$;

-- Domestic-only adult-use / club models (no full cross-border commercial)
do $$
declare iso text;
begin
  foreach iso in array array[
    'MT',  -- Malta associations / limited
    'NL',  -- coffee-shop domestic
    'ES'   -- clubs / medical; limited export
  ]
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'domestic_only', 'ops-batch2',
        'Legend: legal internally; no full lawful cross-border commercial route'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Hemp / CBD only
do $$
declare iso text;
begin
  foreach iso in array array['TR', 'CN', 'UA', 'RO']
  loop
    begin
      perform api.set_regulatory_tier(
        iso, 'cbd_hemp_only', 'ops-batch2',
        'Legend: hemp/CBD pathway; cannabis otherwise restricted'
      );
    exception when others then null;
    end;
  end loop;
end $$;

-- Reclassify remaining auto-origin rows from briefings
select * from api.reclassify_auto_tiers('ops-batch2');

-- Flag suspicious greens for review (do not auto-green without briefing)
update public.countries set
  regulatory_tier_needs_review = true
where iso_alpha2 in ('ET', 'GR', 'KE', 'UG', 'ZW')
  and regulatory_tier = 'legal_commercial_access';

insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260829130000','tier_optimization_batch2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260829130000_tier_optimization_batch2.sql

-- RECOVERY BEGIN 20260829160000_fix_europe_regulatory_tiers.sql
-- Europe-focused regulatory tier reconciliation.
--
-- This migration records the current accepted production Europe regulatory-tier state
-- after PR #1690 production application and the first-two migration-ledger parity repair.
-- It is intentionally safe to replay against the accepted production state: rows that
-- already match tier, override origin, review state, and rationale are skipped before
-- api.set_regulatory_tier is called.
--
-- Release-safety contract:
--   * preserve the accepted production tier assignments and rationales exactly;
--   * use api.set_regulatory_tier so override/audit semantics remain canonical if a
--     fresh or drifted environment needs repair;
--   * skip rows already at the accepted reviewed override state;
--   * future api.reclassify_auto_tiers runs cannot touch these rows because it
--     operates only on regulatory_tier_origin = 'auto' or null.

do $$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('NL', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('ES', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('MT', 'domestic_only',          'Legend: legal internally; no full lawful cross-border commercial route'),
      ('LU', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('DE', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('FR', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('IT', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('GB', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('IE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('AT', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('BE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('CH', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('DK', 'medical_limited_trade',  'Denmark: medical pathway; not general commercial access'),
      ('SE', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('NO', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('FI', 'medical_limited_trade',  'Legend: lawful medical market; narrow or no commercial cross-border route'),
      ('PL', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('CZ', 'medical_limited_trade',  'Legend: medical market; narrow or no commercial cross-border route'),
      ('GR', 'medical_limited_trade',  'GR medical'),
      ('HR', 'medical_limited_trade',  'HR medical'),
      ('SI', 'medical_limited_trade',  'SI medical'),
      ('SK', 'medical_limited_trade',  'SK medical'),
      ('HU', 'medical_limited_trade',  'HU medical'),
      ('BG', 'medical_limited_trade',  'BG medical'),
      ('RS', 'medical_limited_trade',  'RS medical'),
      ('PT', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('IL', 'legal_commercial_access','Legend: lawful cross-border commercial pathway in operation'),
      ('TR', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted'),
      ('UA', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted'),
      ('RO', 'cbd_hemp_only',          'Legend: hemp/CBD pathway; cannabis otherwise restricted')
    ) as accepted(iso, tier, note)
  loop
    if exists (
      select 1
      from public.countries c
      where c.iso_alpha2 = r.iso
        and c.regulatory_tier is not distinct from r.tier
        and c.regulatory_tier_origin = 'override'
        and c.regulatory_tier_needs_review = false
        and c.regulatory_tier_rationale is not distinct from r.note
    ) then
      continue;
    end if;

    perform api.set_regulatory_tier(r.iso, r.tier, 'ops-eu', r.note);
  end loop;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260829160000','fix_europe_regulatory_tiers','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260829160000_fix_europe_regulatory_tiers.sql

-- RECOVERY BEGIN 20260829181346_fix_regulatory_signals_missing_grants.sql
-- Final entries from the missing-grant audit series (20260729000000,
-- 20260729010000, 20260729020000). regulatory_signals.sources and
-- regulatory_signals.source_snapshots both have api-schema views already
-- granting anon/authenticated SELECT, but the underlying base tables
-- (in the separate `regulatory_signals` Postgres schema) never got the
-- matching grant -- same shape as every prior fix in this series.
--
-- Both tables' RLS already correctly restricts to admin/operator roles
-- (source_snapshots: admin or operator; sources: admin only), so granting
-- SELECT broadly here is safe -- RLS blocks every non-admin/operator role
-- regardless of the grant, this purely restores what the pre-existing
-- api-schema view grants already implied was intended.

grant select on regulatory_signals.sources to anon, authenticated;
grant select on regulatory_signals.source_snapshots to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260829181346','fix_regulatory_signals_missing_grants','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260829181346_fix_regulatory_signals_missing_grants.sql

-- RECOVERY BEGIN 20260830135959_replay_colombia_country_briefing.sql
-- Replay-only reconstruction of Colombia's country briefing, verbatim from production.
--
-- public.cc_jurisdiction_briefings holds 302 rows in production and only 242
-- after a zero-state repository replay (verified 2026-09-06 against project
-- zvxdgdkukjrrwamdpqrg). Colombia is one of the sixty with no repository INSERT
-- anywhere in migration history: the bulk americas seeds
-- (20260621233459 / 233543 / 233640 / 233743) cover AR BB BO BR BZ CL CR CU DM
-- DO EC GD GT GY HT SV HN JM KN MX NI PA PE PY AG BS LC SR TT US UY VC VE and
-- skip CO, while 20260623100137_seed_content_depth_updates only UPDATEs a CO row
-- it assumes already exists.
--
-- 20260830140000_full_regulatory_tier_coverage then asserts that CO's stored
-- regulatory_tier equals api.derive_regulatory_tier(api.briefing_text_for_iso('CO')).
-- With no briefing row that derives NULL, so the assertion fails on replay while
-- passing in production. The text below is production's own row, read back
-- unchanged; it derives legal_commercial_access, matching the stored tier.
--
-- This file exists only in the temporary production-faithful replay workspace and
-- is never a production migration or a migration-ledger entry. The underlying gap
-- -- sixty briefings live in production with no repository record -- is NOT fixed
-- by this file and is tracked separately.

insert into public.cc_jurisdiction_briefings (
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  data_source_summary,
  verification_summary,
  update_cadence,
  coverage_summary,
  last_reviewed_date, watch_regions, change_notes, review_state
)
select
  $hvco$colombia$hvco$,
  $hvco$country$hvco$,
  $hvco$CO$hvco$,
  $hvco$Medical Legal — Export Industry Leader$hvco$,
  $hvco$Colombia was the first country in Latin America to establish a comprehensive regulated medical cannabis framework. Law 1787 of 2016 legalised medical cannabis, and Decree 631 of 2020 created the export licensing framework that has made Colombia a significant global medical cannabis producer. Colombia benefits from ideal growing conditions (tropical climate, near-equatorial light cycles, low-cost labour), making it one of the lowest-cost producers globally. Domestic adult-use remains legally ambiguous — the Constitutional Court decriminalised personal possession (up to 20g) in 1994 (Sentence C-221/94), but selling, buying, and public use remain prohibited. A 2023 bill to legalise adult-use cannabis passed the Senate but not the House; the Petro government has expressed support for adult-use legalisation.$hvco$,
  $hvco$Colombian medical cannabis patients access products through licensed pharmacies and medical dispensaries authorised under the Law 1787 framework. The Ministry of Health (MinSalud) administers patient access. Products include standardised oils, capsules, and dried flower. Domestic medical cannabis is very affordably priced given Colombia's low production costs. Patient registration is managed through the INVIMA regulatory framework.$hvco$,
  $hvco$Colombian physicians may recommend medical cannabis for qualified patients under the Law 1787 framework. INVIMA oversees product approvals. The Colombian Medical Federation has engaged with cannabis prescribing guidelines. No specialist-only restriction exists at the national level.$hvco$,
  $hvco$Colombia is primarily an export market for medical cannabis. Over 1,000 cultivation and production licences have been issued. Major Colombian cannabis companies include Clever Leaves, Khiron Life Sciences, Flora Growth, and PharmaLeaf Colombia. Export destinations include Germany, the UK, Australia, Brazil, and Mexico. Colombia's cost advantage (production cost as low as $0.10–0.30/gram dried flower) makes it highly competitive globally.$hvco$,
  $hvco$Colombia's Petro government (2022–2026) has been the most cannabis-supportive in the country's history. Adult-use legalisation faces legislative obstacles from conservative parties. If it passes, Colombia would become the first country in South America to fully legalise cannabis. The export framework is stable and well-regarded by importing countries' regulators.$hvco$,
  $hvco$INVIMA — invima.gov.co; Colombian Ministry of Justice; Agencia Nacional de Licencias Ambientales$hvco$,
  $hvco$Colombia Ministry of Justice cannabis policy data; INVIMA licensing registry; Colombia Ministerio de Salud y Protección Social publications; Clever Leaves/Khiron investor disclosures; EMCDDA Colombia country data$hvco$,
  $hvco$Current as of Q2 2026; verified against INVIMA and Colombian government official publications$hvco$,
  $hvco$Quarterly$hvco$,
  $hvco$National; 1,000+ licences issued; world's largest medical cannabis exporter by volume; growing domestic market$hvco$,
  date '2026-06-22', '[]'::jsonb, '[]'::jsonb, 'reviewed'
where not exists (
  select 1 from public.cc_jurisdiction_briefings
  where country_iso2 = 'CO' and jurisdiction_type = 'country'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830135959','replay_colombia_country_briefing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830135959_replay_colombia_country_briefing.sql

-- RECOVERY BEGIN 20260830140000_full_regulatory_tier_coverage.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830140000','full_regulatory_tier_coverage','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830140000_full_regulatory_tier_coverage.sql

-- RECOVERY BEGIN 20260830141000_subnational_regulatory_tier_evidence_alignment.sql
-- Reconstructed from production. Verbatim statements for version 20260830141000.
-- ============================================================
-- Subnational regulatory-tier evidence alignment
-- ============================================================
-- Forward-fix after 20260830140000. The first full-coverage pass corrected the
-- country/territory layer, but the canonical classifier contract is parent-aware
-- for state/province rows. This migration makes briefing_text_for_iso use that
-- same source contract, then reviews every evidence-backed live row against it.
-- ============================================================

create or replace function api.briefing_text_for_iso(p_iso text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select api.regulatory_classifier_text_for_briefing(
    b.jurisdiction_type,
    b.country_iso2,
    b.program_status,
    b.public_summary,
    b.market_dynamics,
    b.regulatory_outlook
  )
  from public.cc_jurisdiction_briefings b
  where api.regulatory_tier_target_iso2(
          b.jurisdiction_type,
          b.country_iso2,
          b.state_iso2
        ) = upper(p_iso)
  order by
    case when b.state_iso2 = upper(p_iso) then 0 else 1 end,
    b.last_reviewed_date desc nulls last,
    b.updated_at desc
  limit 1;
$$;

comment on function api.briefing_text_for_iso(text) is
  'Canonical parent-aware classifier input for a live country/territory/subnational ISO map row.';

revoke all on function api.briefing_text_for_iso(text) from public, anon;
grant execute on function api.briefing_text_for_iso(text) to authenticated, service_role;

-- Review every evidence-backed live row against the exact canonical classifier
-- input now used by both set_regulatory_tier and reclassify_auto_tiers. Rows with
-- no canonical classifier evidence retain their non-null tier and stay flagged.
do $$
declare
  c record;
  v_text text;
  v_tier text;
begin
  for c in
    select iso_alpha2
      from public.countries
     order by iso_alpha2
  loop
    v_text := api.briefing_text_for_iso(c.iso_alpha2);
    v_tier := api.derive_regulatory_tier(v_text);

    if v_tier is not null then
      perform api.set_regulatory_tier(
        c.iso_alpha2,
        v_tier,
        'ops-full-coverage-subnational-evidence-20260830',
        'Reviewed against parent-aware canonical briefing evidence: ' || left(v_text, 430)
      );
    else
      update public.countries
         set regulatory_tier = coalesce(regulatory_tier, 'prohibited'),
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

-- Hard postconditions: current production shape remains intact and every row
-- that can be classified from canonical evidence must equal that classifier.
do $$
declare
  v_total integer;
  v_null integer;
  v_subnational integer;
  v_subnational_tiered integer;
  v_mismatch integer;
  v_unreviewed_without_evidence integer;
begin
  select count(*), count(*) filter (where regulatory_tier is null)
    into v_total, v_null
    from public.countries;

  if v_total <> 291 then
    raise exception 'Expected 291 current live map rows, found %', v_total;
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
    into v_mismatch
    from public.countries c
   where api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) is not null
     and c.regulatory_tier is distinct from api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2));

  if v_mismatch <> 0 then
    raise exception 'Canonical evidence parity failed: % live rows disagree with classifier', v_mismatch;
  end if;

  select count(*)
    into v_unreviewed_without_evidence
    from public.countries c
   where api.derive_regulatory_tier(api.briefing_text_for_iso(c.iso_alpha2)) is null
     and c.regulatory_tier_needs_review is distinct from true;

  if v_unreviewed_without_evidence <> 0 then
    raise exception 'Rows without canonical evidence must remain needs_review=true: % violations',
      v_unreviewed_without_evidence;
  end if;
end $$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830141000','subnational_regulatory_tier_evidence_alignment','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830141000_subnational_regulatory_tier_evidence_alignment.sql

-- RECOVERY BEGIN 20260830184434_resync_market_access_status_from_regulatory_tier.sql
-- Root cause: market_access_status (drives the globe choropleth legend: MARKET ACCESS)
-- had drifted out of sync with regulatory_tier (the actively-reviewed, always-populated
-- source of truth: 0 NULLs across 291 countries, tracked with review/source metadata).
-- Same regulatory_tier value was mapping to up to 5 different market_access_status values
-- across countries (e.g. legal_commercial_access -> unknown for 34 countries, regulated
-- for 11, emerging for 9, restricted for 5, limited for 2), producing incorrect map colors.
--
-- Fix: derive market_access_status deterministically from regulatory_tier's 5 clean tiers,
-- 1:1 with the 5-swatch legend, and add a trigger so future regulatory_tier edits can never
-- drift out of sync with the map again.

UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE regulatory_tier IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_market_access_status()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.market_access_status := CASE NEW.regulatory_tier
    WHEN 'legal_commercial_access' THEN 'open'
    WHEN 'medical_limited_trade'   THEN 'regulated'
    WHEN 'domestic_only'           THEN 'emerging'
    WHEN 'cbd_hemp_only'           THEN 'limited'
    WHEN 'prohibited'              THEN 'restricted'
    ELSE 'unknown'
  END::market_access_status;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_sync_market_access_status ON public.countries;
CREATE TRIGGER trg_sync_market_access_status
  BEFORE INSERT OR UPDATE OF regulatory_tier ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_market_access_status();


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830184434','resync_market_access_status_from_regulatory_tier','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830184434_resync_market_access_status_from_regulatory_tier.sql

-- RECOVERY BEGIN 20260830185137_fix_regulatory_tier_rationale_mismatches.sql
-- Same headline-vs-tier consistency bug as elsewhere in this batch: the globe renders off
-- countries.regulatory_tier directly (see lib/globe/globe-materials.ts), and a number of rows
-- had a regulatory_tier that directly contradicted their own stored rationale text.
--
-- Category 1: rationale headline is flatly "Prohibited" (no legal channel of any kind
-- described) but the row was NOT tagged prohibited. Two of these (Kenya, Kosovo) were showing
-- bright green ("legal_commercial_access") for countries whose own evidence says cannabis is
-- illegal there.
UPDATE public.countries SET regulatory_tier = 'prohibited'
WHERE country_name IN ('Belarus','China','Namibia','United Arab Emirates','Andorra','Kenya','Kosovo','Cuba','El Salvador','Honduras','Nicaragua','Venezuela');

-- Category 2: rationale describes a real, operating medical-legal framework (TGA-licensed
-- medical cannabis, government prescription programmes) but the row was filed under
-- cbd_hemp_only (a narrower tier that means only CBD/industrial hemp is legal, not medical
-- cannabis prescribing).
UPDATE public.countries SET regulatory_tier = 'medical_limited_trade'
WHERE country_name IN ('Botswana','Serbia','Queensland','Tasmania','Western Australia');

-- Category 3: Malta's own rationale describes full adult-use personal legalisation (2021
-- Cannabis Reform Act -- possession, home cultivation, cannabis associations), which is a
-- materially broader legal domestic market than "CBD/hemp only".
UPDATE public.countries SET regulatory_tier = 'domestic_only'
WHERE country_name = 'Malta';

-- Keep market_access_status (legacy display fallback) consistent with these corrections too.
UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE country_name IN ('Belarus','China','Namibia','United Arab Emirates','Andorra','Kenya','Kosovo','Cuba','El Salvador','Honduras','Nicaragua','Venezuela','Botswana','Serbia','Queensland','Tasmania','Western Australia','Malta');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830185137','fix_regulatory_tier_rationale_mismatches','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830185137_fix_regulatory_tier_rationale_mismatches.sql

-- RECOVERY BEGIN 20260830191900_fix_market_access_status_trigger_type_resolution.sql
-- Reconstructed from production. Verbatim statements for version 20260830191900.
-- Forward fix for the production-reconciled 20260830184434 trigger body.
-- The historical function casts to an unqualified market_access_status enum.
-- In later trigger execution paths that resolve with a restricted search_path,
-- PostgreSQL cannot resolve that type name. Keep the historical migration body
-- unchanged and replace only the live function with an explicitly-qualified
-- enum reference before any subsequent regulatory-tier update can fire it.

create or replace function public.sync_market_access_status()
returns trigger
language plpgsql
set search_path = ''
as $$
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
$$;

comment on function public.sync_market_access_status() is
  'Keeps countries.market_access_status synchronized with regulatory_tier; enum type is schema-qualified for restricted-search_path trigger execution.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830191900','fix_market_access_status_trigger_type_resolution','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830191900_fix_market_access_status_trigger_type_resolution.sql

-- RECOVERY BEGIN 20260830192000_regulatory_tier_authority_write_guard.sql
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830192000','regulatory_tier_authority_write_guard','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830192000_regulatory_tier_authority_write_guard.sql

-- RECOVERY BEGIN 20260830193000_fix_regulatory_tier_guard_transaction_timestamp.sql
-- Reconstructed from production. Verbatim statements for version 20260830193000.
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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830193000','fix_regulatory_tier_guard_transaction_timestamp','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830193000_fix_regulatory_tier_guard_transaction_timestamp.sql

-- RECOVERY BEGIN 20260830203038_fix_daily_digest_provider_health_durability.sql
-- Reconstructed from production. Supersedes 20260831020000_fix_daily_digest_provider_health_durability.sql
-- (wrong version number vs. actual production apply time). Old file removed in this commit.
-- Verbatim statements from supabase_migrations.schema_migrations for version 20260830203038.

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ≈ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words — do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- Give up on jobs whose async HTTP response never showed up within 1h.
  -- Record status_code = -1 (timeout/no-response sentinel) so this failure
  -- is durably visible to the provider health-check below, instead of
  -- silently vanishing (previously these never counted as a failure at all).
  update _digest_jobs j set collected = true, status_code = coalesce(j.status_code, -1)
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),
    -- Persist status_code onto the job row itself. Previously only
    -- `collected` was set here, so once net._http_response expired/was
    -- pruned, this attempt's outcome became invisible to the provider
    -- health-check below — which is why openai kept getting retried every
    -- cycle for days despite failing every single time.
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  -- Provider health checks now read the durably-persisted status_code column
  -- on _digest_jobs directly, instead of live-joining net._http_response
  -- (which does not retain rows long enough for this to work across cron
  -- cycles — that gap is exactly why openai kept getting picked every 15
  -- minutes for days despite failing every single attempt).
  if v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;
    return jsonb_build_object(
      'ok', true,
      'degraded', true,
      'reason', 'all_configured_llm_providers_degraded',
      'available', jsonb_array_length(v_signals),
      'source', 'pipeline_b'
    );
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 8000, 'thinkingConfig', jsonb_build_object('thinkingLevel', 'low'))
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260830203038','fix_daily_digest_provider_health_durability','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260830203038_fix_daily_digest_provider_health_durability.sql

-- RECOVERY BEGIN 20260831001235_sync_legacy_status_after_medical_reclass.sql
-- Follows the 30-country reclassification applied via api.set_regulatory_tier() (see
-- 20260901021633_document_medical_only_reclassification_via_rpc.sql). That call goes through
-- the guarded RPC and updates regulatory_tier directly; this migration keeps the legacy
-- market_access_status display column in sync with it, same derivation used throughout this
-- batch.
UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
WHERE iso_alpha2 IN (
  'US-AL','US-AR','US-FL','US-HI','US-KY','US-LA','US-MS','US-NE','US-NH','US-ND','US-OK','US-PA','US-SD','US-TX','US-UT','US-WV',
  'BE','BR','DK','EE','FR','NO','SK','SI','GB','PR','PA','PY','CR','PE'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831001235','sync_legacy_status_after_medical_reclass','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831001235_sync_legacy_status_after_medical_reclass.sql

-- RECOVERY BEGIN 20260831011430_fix_dashboard_prefs_update_policy_initplan.sql
-- Reconstructed from production. Verbatim statements for version 20260831011430.
begin;

alter policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences
  using ((select auth.uid()) = user_id)
  with check (
    ((select auth.uid()) = user_id)
    and (
      active_workspace_id is null
      or exists (
        select 1
        from workspace_members wm
        join workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = user_dashboard_preferences.active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831011430','fix_dashboard_prefs_update_policy_initplan','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831011430_fix_dashboard_prefs_update_policy_initplan.sql

-- RECOVERY BEGIN 20260831011731_merge_signals_public_select_policies.sql
-- Reconstructed from production. Verbatim statements for version 20260831011731.
begin;

-- Confirmed via migration history (20260716200514_signals_scored_visibility_gate.sql):
-- the two-policy OR (score>=60 OR reviewed=true) is intentional, documented tiering
-- (automated quality gate OR hand-picked editorial override), not a bug.
-- Collapsing into one policy preserves identical access outcomes while cutting the
-- per-row policy evaluation from 2 permissive policies to 1 for every anon/authenticated
-- SELECT against public.signals (the advisor's own recommended fix for
-- "multiple_permissive_policies").

drop policy if exists signals_public_reviewed_select on public.signals;
drop policy if exists signals_public_scored_select on public.signals;

create policy signals_public_select
  on public.signals
  for select
  to anon, authenticated
  using (score >= 60 or reviewed = true);

comment on policy signals_public_select on public.signals is
  'Public signal gate, merged 2026-08-31: score >= 60 (automated quality bar) OR reviewed = true (editorial hand-pick override). Was two separate permissive policies OR-ed implicitly by Postgres; merged into one for the same access outcome with half the per-row policy evaluation cost. See 20260716200514_signals_scored_visibility_gate.sql for the original design rationale.';

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831011731','merge_signals_public_select_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831011731_merge_signals_public_select_policies.sql

-- RECOVERY BEGIN 20260831011752_drop_redundant_signals_admin_operator_policy.sql
-- Reconstructed from production. Verbatim statements for version 20260831011752.
begin;

-- signals_select_admin_operator_only (admin,operator) is a strict subset of
-- signals_admin_operator_analyst_select (admin,operator,analyst) -- same role_id
-- lookup pattern, same table, same command. Anything the subset policy grants,
-- the superset policy already grants. Zero access-outcome change; one fewer
-- permissive policy evaluated per row on every authenticated SELECT.

drop policy if exists signals_select_admin_operator_only on public.signals;

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831011752','drop_redundant_signals_admin_operator_policy','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831011752_drop_redundant_signals_admin_operator_policy.sql

-- RECOVERY BEGIN 20260831012629_consolidate_redundant_rls_policies_batch1.sql
-- Reconstructed from production. Verbatim statements for version 20260831012629.
begin;

-- ============ Pure duplicates: byte-identical qual/with_check/cmd/roles ============
-- countries: 3 SELECT policies, all `using (true)` for anon/authenticated in some combo.
-- countries_public_read alone already covers {anon,authenticated}.
drop policy if exists countries_anon_select on public.countries;
drop policy if exists countries_authenticated_select on public.countries;

-- clinical_evidence_reviews: two ALL policies, identical qual/with_check (rename artifact).
drop policy if exists clinical_reviews_review_access on public.clinical_evidence_reviews;

-- clinical_reviewer_credentials: two ALL policies, identical qual/with_check (rename artifact).
drop policy if exists clinical_reviewer_credentials_admin_write on public.clinical_reviewer_credentials;

-- clinical_evidence_publication_versions: two SELECT policies, identical qual.
drop policy if exists clinical_publication_versions_review_read on public.clinical_evidence_publication_versions;

-- clinical_evidence_source_snapshots: two SELECT policies, identical qual.
drop policy if exists clinical_source_snapshots_review_read on public.clinical_evidence_source_snapshots;

-- ============ Safe OR-merges: same command scope, different-but-provable-equivalent logic ============

-- education_modules
drop policy if exists education_modules_admin_select on public.education_modules;
drop policy if exists education_modules_public_select on public.education_modules;
create policy education_modules_select on public.education_modules
  for select to anon, authenticated
  using (
    (publication_state = 'published' and (requires_clinical_signoff = false or reviewed_by is not null))
    or exists (
      select 1 from user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst'])
    )
  );

-- listings
drop policy if exists admin_operator_select on public.listings;
drop policy if exists listings_anon_select_public on public.listings;
drop policy if exists listings_authenticated_select_public on public.listings;
create policy listings_select on public.listings
  for select to anon, authenticated
  using (
    (public_visibility = true and status = 'approved'::listing_status)
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

-- marketplace_candidates
drop policy if exists admin_operator_select on public.marketplace_candidates;
drop policy if exists "Authenticated sellers can view own submissions" on public.marketplace_candidates;
create policy marketplace_candidates_select on public.marketplace_candidates
  for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

-- marketplace_item_images
drop policy if exists "Admins can read all marketplace images" on public.marketplace_item_images;
drop policy if exists "Public can read approved public marketplace images" on public.marketplace_item_images;
create policy marketplace_item_images_select on public.marketplace_item_images
  for select to anon, authenticated
  using (
    is_harbourview_admin()
    or (
      review_status = 'APPROVED_PUBLIC'
      and rights_status::text <> 'UNKNOWN'
      and image_class::text <> 'ADMIN_PRIVATE_EVIDENCE'
      and item_id is not null
      and public_url is not null
    )
  );

-- talent_candidates (both source policies were FOR ALL, same role -> clean merge)
drop policy if exists talent_candidates_admin_manage on public.talent_candidates;
drop policy if exists talent_candidates_workspace_manage on public.talent_candidates;
create policy talent_candidates_manage on public.talent_candidates
  for all to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or job_id in (
      select tj.id from talent_jobs tj
      where tj.workspace_id in (
        select workspace_members.workspace_id from workspace_members
        where workspace_members.user_id = (select auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or job_id in (
      select tj.id from talent_jobs tj
      where tj.workspace_id in (
        select workspace_members.workspace_id from workspace_members
        where workspace_members.user_id = (select auth.uid())
      )
    )
  );
-- talent_candidates_public_apply (INSERT, anon+authenticated) left untouched.

-- talent_jobs (same shape as talent_candidates)
drop policy if exists talent_jobs_admin_manage on public.talent_jobs;
drop policy if exists talent_jobs_workspace_manage on public.talent_jobs;
create policy talent_jobs_manage on public.talent_jobs
  for all to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (
      select workspace_members.workspace_id from workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (
      select workspace_members.workspace_id from workspace_members
      where workspace_members.user_id = (select auth.uid())
    )
  );
-- talent_jobs_public_read_open (SELECT, anon+authenticated, status='open') left untouched.

-- workspaces
drop policy if exists admin_operator_select on public.workspaces;
drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to public
  using (
    hv_is_org_member(id)
    or hv_is_platform_staff()
    or exists (
      select 1 from user_roles
      where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])
    )
  );

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831012629','consolidate_redundant_rls_policies_batch1','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831012629_consolidate_redundant_rls_policies_batch1.sql

-- RECOVERY BEGIN 20260831020104_resolve_supply_view_conflict_decouple_from_marketplace_contract_v2.sql
-- Reconstructed from production. Verbatim statements for version 20260831020104.

drop view if exists api.marketplace_public_listings_v1;
drop view if exists public.marketplace_public_listings_v1;

create view public.marketplace_public_listings_v1 as
select
  id,
  slug,
  title,
  description,
  category::text as category,
  null::text as subcategory,
  coalesce(marketplace_section, category::text) as marketplace_section,
  product_type,
  region::text as region,
  condition,
  location_country,
  null::text as location_region,
  price_amount,
  coalesce(price_currency, 'USD'::text) as price_currency,
  case
    when price_amount is not null then concat(coalesce(price_currency, 'USD'::text), ' ', price_amount::text)
    else null::text
  end as price_display,
  coalesce(seller_type::text, 'controlled_review'::text) as seller_type,
  is_featured,
  high_level_specs,
  created_at,
  average_rating,
  review_count
from listings l
where status = 'approved'::listing_status and public_visibility = true and archived_at is null;

create view api.marketplace_public_listings_v1
with (security_invoker = on) as
select
  id, slug, title, description, category, subcategory, marketplace_section, product_type,
  region, condition, location_country, location_region, price_amount, price_currency,
  price_display, seller_type, is_featured, high_level_specs, created_at, average_rating,
  review_count
from public.marketplace_public_listings_v1;

grant select on api.marketplace_public_listings_v1 to anon, authenticated;

create or replace view api.supply_catalog_detail_v1
with (security_invoker = on) as
select
  l.id,
  l.slug,
  l.title,
  l.description,
  l.category::text as category,
  coalesce(l.marketplace_section, l.category::text) as marketplace_section,
  l.product_type,
  l.region::text as region,
  l.condition,
  l.sku,
  l.brand,
  l.model,
  l.quantity,
  l.unit,
  l.price_amount,
  coalesce(l.price_currency, 'CAD') as price_currency,
  case
    when l.price_amount is not null then concat(coalesce(l.price_currency, 'CAD'), ' ', l.price_amount::text)
    else null::text
  end as price_display,
  l.is_featured,
  l.stock_qty,
  l.lead_time_days,
  l.moq,
  l.compliance_flags,
  coalesce(l.target_countries, '{}'::text[]) as target_countries,
  l.high_level_specs,
  l.created_at
from public.listings l
where l.sold_by_harbourview = true
  and l.status = 'approved'
  and l.public_visibility = true
  and l.archived_at is null
  and l.slug is not null;

comment on view api.supply_catalog_detail_v1 is
  'Full-detail public supply catalog DTO -- deliberately shows real stock/MOQ/lead-time/compliance/brand data per explicit product decision. Contrast with api.supply_catalog_public_v1, which redacts the same fields -- that view predates a decision to keep this data public and is not currently used by /supply. Isolated from marketplace_public_listings_v1 so changes to either surface cannot silently break the other.';

grant select on api.supply_catalog_detail_v1 to anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831020104','resolve_supply_view_conflict_decouple_from_marketplace_contract_v2','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831020104_resolve_supply_view_conflict_decouple_from_marketplace_contract_v2.sql

-- RECOVERY BEGIN 20260831021320_daily_digest_manual_fallback.sql
-- Reconstructed from production. Supersedes 20260831021500_daily_digest_manual_fallback.sql
-- (wrong version number vs. actual production apply time). Old file removed in this commit.
-- Verbatim statements from supabase_migrations.schema_migrations for version 20260831021320.

-- Allow a distinct status for auto-published deterministic (non-LLM) digests
ALTER TABLE public.daily_digest DROP CONSTRAINT daily_digest_status_check;
ALTER TABLE public.daily_digest ADD CONSTRAINT daily_digest_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'published_manual'::text]));

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_manual jsonb;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ~ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words -- do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = coalesce(j.status_code, -1)
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  -- All providers degraded (or none configured to try): fall back to a
  -- deterministic, non-LLM "manual pass" instead of just logging and doing
  -- nothing. Uses the same ranked/diversified candidate set already
  -- computed above (top_n), taking the top 10 as-is: title becomes the
  -- headline, the signal's own summary becomes why_it_matters (falling
  -- back to a templated line only if summary is empty). Published under a
  -- distinct status ('published_manual') so downstream consumers (email,
  -- dashboard) can flag it as unreviewed/algorithmic rather than
  -- editorially curated.
  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;

    with cand as (
      select elem, ord
      from jsonb_array_elements(v_signals) with ordinality as t(elem, ord)
      where ord <= 10
    ),
    manual_headlines as (
      select jsonb_agg(
        jsonb_build_object(
          'headline', left(coalesce(nullif(elem->>'title',''), 'Untitled'), 110),
          'why_it_matters', case
            when length(trim(coalesce(elem->>'summary',''))) > 0
              then left(elem->>'summary', 240)
            else format('%s-impact %s signal for %s.',
              initcap(coalesce(elem->>'commercial_impact','medium')),
              coalesce(elem->>'type','regulatory'),
              coalesce(elem->>'market','Global'))
          end,
          'market', coalesce(elem->>'market','Global'),
          'signal_id', elem->>'id'
        ) order by ord
      ) as headlines
      from cand
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, mh.headlines,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(mh.headlines) h),
        'published_manual', now()
      from manual_headlines mh
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = excluded.markets,
            status = 'published_manual',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from cand c
      where s.id = (c.elem->>'id')
        and exists (select 1 from ins)
      returning s.id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'manual_fallback',
      'reason', 'all_configured_llm_providers_degraded',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b'
    ) into v_manual;

    return v_manual;
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 8000, 'thinkingConfig', jsonb_build_object('thinkingLevel', 'low'))
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831021320','daily_digest_manual_fallback','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831021320_daily_digest_manual_fallback.sql

-- RECOVERY BEGIN 20260831021633_digest_manual_fallback_content_quality.sql
-- Reconstructed from production. Verbatim statements for version 20260831021633.
CREATE OR REPLACE FUNCTION public._digest_smart_truncate(input text, max_len int)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when input is null then null
    when length(input) <= max_len then input
    when length(trim(trailing from regexp_replace(left(input, max_len), '\S*$', ''))) = 0
      then left(input, max_len - 1) || '…'
    else trim(trailing from regexp_replace(left(input, max_len), '\S*$', '')) || '…'
  end;
$$;

CREATE OR REPLACE FUNCTION public._digest_manual_why(summary text, title text, impact text, content_type text, market text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when length(trim(coalesce(summary,''))) = 0
      or lower(trim(summary)) = lower(trim(coalesce(title,'')))
      or lower(trim(summary)) like lower(trim(coalesce(title,''))) || '%'
      then format('%s-impact %s signal for %s.',
        initcap(coalesce(impact,'medium')),
        coalesce(content_type,'regulatory'),
        coalesce(market,'Global'))
    else public._digest_smart_truncate(summary, 240)
  end;
$$;

-- One-off: rebuild today's already-published manual-pass digest using the
-- fixed formatting (word-boundary truncation + summary/title dedup), pulling
-- fresh title/summary for the same 10 signals rather than re-running
-- candidate selection (those signals are already marked used_in_digest_at).
with current_ids as (
  select (h->>'signal_id') as signal_id, ord
  from daily_digest d
  cross join lateral jsonb_array_elements(d.headlines) with ordinality as t(h, ord)
  where d.digest_date = current_date
),
fresh as (
  select
    ci.ord,
    s.id,
    coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
    coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
    coalesce(nullif(trim(s.country), ''), 'Global') as market,
    coalesce(s.content_type, 'regulatory') as content_type,
    coalesce(s.impact, 'medium') as impact
  from current_ids ci
  join public.signals s on s.id = ci.signal_id
),
rebuilt as (
  select jsonb_agg(
    jsonb_build_object(
      'headline', public._digest_smart_truncate(f.title, 110),
      'why_it_matters', public._digest_manual_why(f.summary, f.title, f.impact, f.content_type, f.market),
      'market', f.market,
      'signal_id', f.id
    ) order by f.ord
  ) as headlines
  from fresh f
)
update daily_digest d
set headlines = rebuilt.headlines,
    updated_at = now()
from rebuilt
where d.digest_date = current_date;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831021633','digest_manual_fallback_content_quality','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831021633_digest_manual_fallback_content_quality.sql

-- RECOVERY BEGIN 20260831021727_daily_digest_use_smart_truncate.sql
-- Reconstructed from production. Verbatim statements for version 20260831021727.
CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_manual jsonb;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ~ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words -- do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  update _digest_jobs j set collected = true, status_code = coalesce(j.status_code, -1)
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  if v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  -- All providers degraded: deterministic "manual pass" fallback. Headline
  -- and why_it_matters are built with _digest_smart_truncate /
  -- _digest_manual_why (word-boundary truncation, and a templated
  -- why_it_matters when the signal's summary is empty or just duplicates
  -- the title) rather than raw left(text, N), which used to cut mid-word
  -- and could produce a why_it_matters identical to the headline.
  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;

    with cand as (
      select elem, ord
      from jsonb_array_elements(v_signals) with ordinality as t(elem, ord)
      where ord <= 10
    ),
    manual_headlines as (
      select jsonb_agg(
        jsonb_build_object(
          'headline', public._digest_smart_truncate(coalesce(nullif(elem->>'title',''), 'Untitled'), 110),
          'why_it_matters', public._digest_manual_why(
            elem->>'summary', elem->>'title', elem->>'commercial_impact', elem->>'type', elem->>'market'
          ),
          'market', coalesce(elem->>'market','Global'),
          'signal_id', elem->>'id'
        ) order by ord
      ) as headlines
      from cand
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, mh.headlines,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(mh.headlines) h),
        'published_manual', now()
      from manual_headlines mh
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = excluded.markets,
            status = 'published_manual',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from cand c
      where s.id = (c.elem->>'id')
        and exists (select 1 from ins)
      returning s.id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'manual_fallback',
      'reason', 'all_configured_llm_providers_degraded',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b'
    ) into v_manual;

    return v_manual;
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 8000, 'thinkingConfig', jsonb_build_object('thinkingLevel', 'low'))
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831021727','daily_digest_use_smart_truncate','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831021727_daily_digest_use_smart_truncate.sql

-- RECOVERY BEGIN 20260831023000_daily_digest_manual_fallback_content_quality.sql
-- Manual-pass content quality fix. The initial deterministic fallback used
-- raw left(text, N) for both headline and why_it_matters, which:
--   1) truncated mid-word ("...restruct", "...tar", "...si", "...op", "...pos")
--   2) produced a why_it_matters identical to the headline when a signal's
--      summary was empty or literally began with the same text as the title
--      (e.g. the Slovenia entry on 2026-08-31, and the Canadian Hemp entry
--      whose "summary" was just the title re-prepended to a longer excerpt)
--
-- _digest_smart_truncate() truncates at the last word boundary before the
-- limit and appends an ellipsis, instead of cutting mid-word.
-- _digest_manual_why() falls back to a templated why_it_matters line
-- whenever the summary is empty or duplicates the title, instead of
-- echoing back low-value/redundant text.
--
-- Also includes a one-off backfill of the day's already-published manual
-- digest (2026-08-31) using the corrected formatting.

CREATE OR REPLACE FUNCTION public._digest_smart_truncate(input text, max_len int)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when input is null then null
    when length(input) <= max_len then input
    when length(trim(trailing from regexp_replace(left(input, max_len), '\S*$', ''))) = 0
      then left(input, max_len - 1) || '…'
    else trim(trailing from regexp_replace(left(input, max_len), '\S*$', '')) || '…'
  end;
$$;

CREATE OR REPLACE FUNCTION public._digest_manual_why(summary text, title text, impact text, content_type text, market text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when length(trim(coalesce(summary,''))) = 0
      or lower(trim(summary)) = lower(trim(coalesce(title,'')))
      or lower(trim(summary)) like lower(trim(coalesce(title,''))) || '%'
      then format('%s-impact %s signal for %s.',
        initcap(coalesce(impact,'medium')),
        coalesce(content_type,'regulatory'),
        coalesce(market,'Global'))
    else public._digest_smart_truncate(summary, 240)
  end;
$$;

CREATE OR REPLACE FUNCTION public.run_daily_digest()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare
  v_openai_key text;
  v_anthropic_key text;
  v_gemini_key text;
  v_signals jsonb;
  v_signal_ids text[];
  v_provider text := null;
  v_attempts int;
  v_failures int;
  v_manual jsonb;
  v_pre text := $prompt$
You are the senior editor of Harbourview Daily, a B2B cannabis market-intelligence briefing for licensed operators, importers, investors, and compliance officers.

Below is a JSON array of QUALITY-GATED intelligence signals. Each already passed a validated classifier (precision ~ 1.0). Prefer signals that are:
- commercially actionable (licensing, import/export, taxation, market access, M&A, capacity)
- geographically diverse (do not fill the brief with only US/CA/DE/UK)
- corroborated (higher corroboration_count = multiple independent sources)
- high impact / high confidence

Select up to 10 of the most important items (fewer if fewer qualify). For each:
- Rewrite a sharp headline (max 110 chars, your own words -- do not copy boilerplate)
- Write ONE "why_it_matters" sentence a commercial operator would act on
- Keep the market as the country name from the input (or "Global")
- Echo signal_id exactly from the input

Return ONLY a JSON array (no markdown fences, no prose). Each element:
{"headline": string, "why_it_matters": string, "market": string, "signal_id": string}
Order by commercial importance descending.
$prompt$;
begin
  if exists (
    select 1 from daily_digest
    where digest_date = current_date
      and headlines is not null and jsonb_array_length(headlines) > 0
  ) then
    return jsonb_build_object('ok',true,'skipped','digest exists for today');
  end if;

  -- Give up on jobs whose async HTTP response never showed up within 1h.
  -- Record status_code = -1 (timeout/no-response sentinel) so this failure
  -- is durably visible to the provider health-check below, instead of
  -- silently vanishing (previously these never counted as a failure at all).
  update _digest_jobs j set collected = true, status_code = coalesce(j.status_code, -1)
  where j.digest_date = current_date and not j.collected
    and j.created_at < now() - interval '1 hour'
    and not exists (select 1 from net._http_response r where r.id = j.request_id);

  perform 1 from _digest_jobs j where j.digest_date = current_date and not j.collected;
  if found then
    with resp as (
      select j.request_id, j.signal_ids, j.provider, r.status_code,
             coalesce(
               safe_to_jsonb(r.content) -> 'content' -> 0 ->> 'text',
               safe_to_jsonb(r.content) -> 'choices' -> 0 -> 'message' ->> 'content',
               safe_to_jsonb(r.content) -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text'
             ) as llm_text
      from _digest_jobs j join net._http_response r on r.id = j.request_id
      where j.digest_date = current_date and not j.collected
      order by j.created_at desc limit 1
    ),
    parsed as (
      select request_id, signal_ids, provider, status_code,
             safe_to_jsonb(trim(both from regexp_replace(llm_text,'```(?:json)?','','g'))) as p
      from resp
    ),
    ok as (
      select request_id, signal_ids, p
      from parsed
      where status_code = 200 and jsonb_typeof(p) = 'array' and jsonb_array_length(p) > 0
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, o.p,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(o.p) h),
        'published', now()
      from ok o
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = (select coalesce(array_agg(distinct m), '{}') from unnest(daily_digest.markets || excluded.markets) m),
            status = 'published',
            updated_at = now()
      returning id
    ),
    published_signal_ids as (
      select distinct h ->> 'signal_id' as signal_id
      from ok o
      cross join lateral jsonb_array_elements(o.p) h
      where jsonb_typeof(h) = 'object'
        and nullif(h ->> 'signal_id', '') is not null
        and (h ->> 'signal_id') = any(o.signal_ids)
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from published_signal_ids p
      where s.id = p.signal_id
        and exists (select 1 from ins)
      returning s.id
    ),
    mark_collected as (
      update _digest_jobs j set collected = true, status_code = p.status_code
      from parsed p where j.request_id = p.request_id
      returning j.request_id
    )
    select jsonb_build_object('ok',true,'phase','collect',
      'provider', (select provider from parsed),
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b')
    into v_signals;

    return coalesce(v_signals, jsonb_build_object('ok',true,'phase','collect','published',false,'reason','response not ready or unparseable'));
  end if;

  select decrypted_secret into v_openai_key from vault.decrypted_secrets where name='openai_api_key' limit 1;
  select decrypted_secret into v_anthropic_key from vault.decrypted_secrets where name='anthropic_api_key' limit 1;
  select decrypted_secret into v_gemini_key from vault.decrypted_secrets where name='gemini_api_key' limit 1;
  if v_openai_key is null and v_anthropic_key is null and v_gemini_key is null then
    return jsonb_build_object('ok',false,'reason','no openai_api_key, anthropic_api_key or gemini_api_key in vault');
  end if;

  with base as (
    select
      s.id,
      coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
      coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
      coalesce(nullif(trim(s.country), ''), 'Global') as market,
      coalesce(s.content_type, 'regulatory') as content_type,
      coalesce(s.impact, 'medium') as impact,
      coalesce(s.quality_confidence, 0)::numeric as qc,
      coalesce(s.is_representative, true) as is_rep,
      s.cluster_rep_id,
      s.lang_detected,
      coalesce(s.date, s.created_at::date) as signal_date,
      s.created_at
    from public.signals s
    where s.reviewed is true
      and s.used_in_digest_at is null
      and coalesce(s.date, s.created_at::date) > current_date - 14
      and (
        s.quality_label is null
        or lower(s.quality_label) not in ('spam','boilerplate','nav','duplicate')
      )
      and (
        lower(coalesce(s.content_type, '')) in ('story','research','market')
        or (
          lower(coalesce(s.content_type, 'regulatory')) = 'regulatory'
          and lower(coalesce(s.impact, '')) = 'high'
          and coalesce(s.quality_confidence, 0) >= 0.70
        )
      )
      and coalesce(s.is_representative, true) is true
  ),
  scored as (
    select
      b.*,
      public._digest_cluster_size(b.cluster_rep_id) as corroboration_count,
      public._digest_rank_score(
        b.qc,
        b.impact,
        b.content_type,
        public._digest_cluster_size(b.cluster_rep_id),
        b.id
      ) as rank_score
    from base b
  ),
  diversified as (
    select *
    from (
      select
        sc.*,
        row_number() over (
          partition by lower(sc.market)
          order by sc.rank_score desc, sc.signal_date desc
        ) as country_rn
      from scored sc
    ) x
    where country_rn <= 3
  ),
  top_n as (
    select *
    from diversified
    order by rank_score desc, signal_date desc
    limit 24
  )
  select
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', left(t.title, 200),
        'market', t.market,
        'type', t.content_type,
        'confidence', least(100, greatest(0, round(t.qc * 100)::int)),
        'commercial_impact', t.impact,
        'summary', left(t.summary, 600),
        'corroboration_count', t.corroboration_count,
        'lang_detected', t.lang_detected,
        'detected_at', t.signal_date
      )
      order by t.rank_score desc
    ),
    array_agg(t.id order by t.rank_score desc)
  into v_signals, v_signal_ids
  from top_n t;

  if v_signals is null or jsonb_array_length(v_signals) < 3 then
    return jsonb_build_object(
      'ok', true,
      'skipped', 'fewer than 3 unused Pipeline B digest candidates in last 14 days',
      'available', coalesce(jsonb_array_length(v_signals), 0),
      'source', 'pipeline_b'
    );
  end if;

  -- Provider health checks now read the durably-persisted status_code column
  -- on _digest_jobs directly, instead of live-joining net._http_response.
  if v_openai_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'openai' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'openai';
    end if;
  end if;

  if v_provider is null and v_anthropic_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'anthropic' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'anthropic';
    end if;
  end if;

  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where status_code is distinct from 200)
      into v_attempts, v_failures
    from (
      select status_code from _digest_jobs
      where provider = 'gemini' and created_at > now() - interval '2 hours'
        and status_code is not null
      order by created_at desc limit 10
    ) recent;
    if coalesce(v_attempts, 0) = 0 or v_failures::numeric / v_attempts < 0.5 then
      v_provider := 'gemini';
    end if;
  end if;

  -- All providers degraded: deterministic "manual pass" fallback. Headline
  -- and why_it_matters are built with _digest_smart_truncate /
  -- _digest_manual_why (word-boundary truncation, and a templated
  -- why_it_matters when the signal's summary is empty or just duplicates
  -- the title) rather than raw left(text, N), which used to cut mid-word
  -- and could produce a why_it_matters identical to the headline.
  if v_provider is null then
    insert into pipeline_manual_review_queue (pipeline, reference_date, reason, detail)
    values (
      'daily_digest',
      current_date,
      'all_configured_llm_providers_degraded',
      jsonb_build_object('available_signals', jsonb_array_length(v_signals), 'source', 'pipeline_b')
    )
    on conflict (pipeline, reference_date) do nothing;

    with cand as (
      select elem, ord
      from jsonb_array_elements(v_signals) with ordinality as t(elem, ord)
      where ord <= 10
    ),
    manual_headlines as (
      select jsonb_agg(
        jsonb_build_object(
          'headline', public._digest_smart_truncate(coalesce(nullif(elem->>'title',''), 'Untitled'), 110),
          'why_it_matters', public._digest_manual_why(
            elem->>'summary', elem->>'title', elem->>'commercial_impact', elem->>'type', elem->>'market'
          ),
          'market', coalesce(elem->>'market','Global'),
          'signal_id', elem->>'id'
        ) order by ord
      ) as headlines
      from cand
    ),
    ins as (
      insert into daily_digest (digest_date, headlines, markets, status, generated_at)
      select current_date, mh.headlines,
        (select coalesce(array_agg(distinct h->>'market'), '{}') from jsonb_array_elements(mh.headlines) h),
        'published_manual', now()
      from manual_headlines mh
      on conflict (digest_date) do update
        set headlines = excluded.headlines,
            markets = excluded.markets,
            status = 'published_manual',
            updated_at = now()
      returning id
    ),
    mark_used as (
      update public.signals s set used_in_digest_at = now()
      from cand c
      where s.id = (c.elem->>'id')
        and exists (select 1 from ins)
      returning s.id
    )
    select jsonb_build_object(
      'ok', true,
      'phase', 'manual_fallback',
      'reason', 'all_configured_llm_providers_degraded',
      'published', exists(select 1 from ins),
      'signals_marked', (select count(*) from mark_used),
      'source', 'pipeline_b'
    ) into v_manual;

    return v_manual;
  end if;

  if v_provider = 'openai' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.openai.com/v1/chat/completions',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_openai_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'model', 'gpt-4o-mini',
          'max_tokens', 2800,
          'temperature', 0.2,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'system', 'content', v_pre),
            jsonb_build_object('role', 'user', 'content', E'SIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'openai'
    );
  elsif v_provider = 'anthropic' then
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://api.anthropic.com/v1/messages',
        headers := jsonb_build_object(
          'x-api-key', v_anthropic_key,
          'anthropic-version', '2023-06-01',
          'content-type', 'application/json'
        ),
        body := jsonb_build_object(
          'model', 'claude-haiku-4-5-20251001',
          'max_tokens', 2800,
          'messages', jsonb_build_array(
            jsonb_build_object('role', 'user', 'content', v_pre || E'\n\nSIGNALS:\n' || v_signals::text)
          )
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'anthropic'
    );
  else
    insert into _digest_jobs (request_id, digest_date, signal_ids, provider)
    values (
      net.http_post(
        url := 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
        headers := jsonb_build_object('x-goog-api-key', v_gemini_key, 'content-type', 'application/json'),
        body := jsonb_build_object(
          'systemInstruction', jsonb_build_object(
            'parts', jsonb_build_array(jsonb_build_object('text', v_pre))
          ),
          'contents', jsonb_build_array(
            jsonb_build_object(
              'role', 'user',
              'parts', jsonb_build_array(
                jsonb_build_object('text', E'SIGNALS:\n' || v_signals::text)
              )
            )
          ),
          'generationConfig', jsonb_build_object('temperature', 0.2, 'maxOutputTokens', 8000, 'thinkingConfig', jsonb_build_object('thinkingLevel', 'low'))
        ),
        timeout_milliseconds := 60000
      ),
      current_date,
      v_signal_ids,
      'gemini'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'phase', 'fire',
    'provider', v_provider,
    'degraded', (v_provider <> 'openai'),
    'signals_sent', jsonb_array_length(v_signals),
    'source', 'pipeline_b',
    'ranking', 'feedback_aware'
  );
end;
$function$;


-- One-off: rebuild today's already-published manual-pass digest using the
-- fixed formatting, pulling fresh title/summary for the same 10 signals.
with current_ids as (
  select (h->>'signal_id') as signal_id, ord
  from daily_digest d
  cross join lateral jsonb_array_elements(d.headlines) with ordinality as t(h, ord)
  where d.digest_date = current_date
),
fresh as (
  select
    ci.ord,
    s.id,
    coalesce(nullif(trim(s.title_en), ''), nullif(trim(s.headline), ''), 'Untitled') as title,
    coalesce(nullif(trim(s.summary_en), ''), nullif(trim(s.summary), ''), '') as summary,
    coalesce(nullif(trim(s.country), ''), 'Global') as market,
    coalesce(s.content_type, 'regulatory') as content_type,
    coalesce(s.impact, 'medium') as impact
  from current_ids ci
  join public.signals s on s.id = ci.signal_id
),
rebuilt as (
  select jsonb_agg(
    jsonb_build_object(
      'headline', public._digest_smart_truncate(f.title, 110),
      'why_it_matters', public._digest_manual_why(f.summary, f.title, f.impact, f.content_type, f.market),
      'market', f.market,
      'signal_id', f.id
    ) order by f.ord
  ) as headlines
  from fresh f
)
update daily_digest d
set headlines = rebuilt.headlines,
    updated_at = now()
from rebuilt
where d.digest_date = current_date;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831023000','daily_digest_manual_fallback_content_quality','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831023000_daily_digest_manual_fallback_content_quality.sql

-- RECOVERY BEGIN 20260831030000_backfill_strip_leaked_site_suffix_from_signals.sql
-- One-time backfill: strip leaked site-name suffixes ("Article Title - Site
-- Name") from already-stored signals.headline values, using the same
-- matching logic as the source-engine-fetch fix (deployed v49) -- including
-- matching against the article-source's own "Brand - Article Title" style
-- source_name (signals.source), not just a flat substring check.
--
-- Preview showed 411 of ~1,900 dash-suffixed headlines were genuine site-name
-- leaks (the rest were legitimate titles with a trailing dash clause, left
-- untouched). All 411 verified by manual sample before running. No unique
-- constraint on signals.headline, so no collision risk.

CREATE OR REPLACE FUNCTION public._backfill_strip_site_suffix(title text, source_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  select case
    when source_name is null then title
    when (regexp_match(title, '\s+[-|–—]\s+([^-|–—]{2,60})$'))[1] is null then title
    else (
      with m as (
        select (regexp_match(title, '\s+[-|–—]\s+([^-|–—]{2,60})$'))[1] as suffix_raw,
               lower(trim(source_name)) as src
      ),
      m2 as (
        select lower(trim(suffix_raw)) as suffix, src,
               lower(trim((regexp_match(src, '^(.*?)\s+[-|–—]\s+'))[1])) as src_brand
        from m
      )
      select case
        when m2.suffix = m2.src or m2.src like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src||'%'
          or (m2.src_brand is not null and length(m2.src_brand) >= 3 and
              (m2.suffix = m2.src_brand or m2.src_brand like '%'||m2.suffix||'%' or m2.suffix like '%'||m2.src_brand||'%'))
        then regexp_replace(title, '\s+[-|–—]\s+[^-|–—]{2,60}$', '')
        else title
      end
      from m2
    )
  end;
$$;

update public.signals
set headline = public._backfill_strip_site_suffix(headline, source)
where public._backfill_strip_site_suffix(headline, source) <> headline;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831030000','backfill_strip_leaked_site_suffix_from_signals','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831030000_backfill_strip_leaked_site_suffix_from_signals.sql

-- RECOVERY BEGIN 20260831115225_split_transaction_role_all_policies_into_percommand.sql
-- Reconstructed from production. Verbatim statements for version 20260831115225.
begin;

do $$
declare
  rec record;
  write_cond text := '(select hv_has_transaction_role(array[''admin'',''operator'',''super_admin'']))';
begin
  for rec in
    select * from (values
      ('entities','entities_internal'),
      ('assertions','assertions_internal'),
      ('diligence_requirements','diligence_internal'),
      ('economic_account_members','economic_account_members_internal'),
      ('economic_accounts','economic_accounts_internal'),
      ('entity_aliases','entity_aliases_internal'),
      ('entity_facilities','entity_facilities_internal'),
      ('evidence_links','evidence_links_internal'),
      ('network_source_entity_links','network_source_entity_links_staff'),
      ('product_batches','product_batches_internal'),
      ('products','products_internal'),
      ('transaction_decisions','transaction_decisions_internal'),
      ('transaction_import_staging','transaction_import_internal'),
      ('transaction_networks','transaction_networks_internal'),
      ('transaction_parties','transaction_parties_internal'),
      ('transactions','transactions_internal')
    ) as t(tbl, prefix)
  loop
    execute format('drop policy if exists %I on public.%I', rec.prefix || '_write', rec.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', rec.prefix || '_insert', rec.tbl, write_cond);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', rec.prefix || '_update', rec.tbl, write_cond, write_cond);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', rec.prefix || '_delete', rec.tbl, write_cond);
  end loop;
end $$;

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115225','split_transaction_role_all_policies_into_percommand','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115225_split_transaction_role_all_policies_into_percommand.sql

-- RECOVERY BEGIN 20260831115343_split_hv_staff_org_all_policies_into_percommand.sql
-- Reconstructed from production. Verbatim statements for version 20260831115343.
begin;

-- hv_claims: org_member had select+insert+update
drop policy if exists hv_claims_staff_all on public.hv_claims;
drop policy if exists hv_claims_org_member_insert on public.hv_claims;
drop policy if exists hv_claims_org_member_select on public.hv_claims;
drop policy if exists hv_claims_org_member_update on public.hv_claims;
create policy hv_claims_select on public.hv_claims for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_insert on public.hv_claims for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_update on public.hv_claims for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_claims_delete on public.hv_claims for delete to public
  using (hv_is_platform_staff());

-- hv_facilities: same shape as hv_claims
drop policy if exists hv_facilities_staff_all on public.hv_facilities;
drop policy if exists hv_facilities_org_member_insert on public.hv_facilities;
drop policy if exists hv_facilities_org_member_select on public.hv_facilities;
drop policy if exists hv_facilities_org_member_update on public.hv_facilities;
create policy hv_facilities_select on public.hv_facilities for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_insert on public.hv_facilities for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_update on public.hv_facilities for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_facilities_delete on public.hv_facilities for delete to public
  using (hv_is_platform_staff());

-- hv_licences: same shape
drop policy if exists hv_licences_staff_all on public.hv_licences;
drop policy if exists hv_licences_org_member_insert on public.hv_licences;
drop policy if exists hv_licences_org_member_select on public.hv_licences;
drop policy if exists hv_licences_org_member_update on public.hv_licences;
create policy hv_licences_select on public.hv_licences for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_insert on public.hv_licences for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_update on public.hv_licences for update to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id))
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_licences_delete on public.hv_licences for delete to public
  using (hv_is_platform_staff());

-- hv_evidence_documents: org_member had select+insert only (no update policy pre-existing)
drop policy if exists hv_evidence_staff_all on public.hv_evidence_documents;
drop policy if exists hv_evidence_org_member_insert on public.hv_evidence_documents;
drop policy if exists hv_evidence_org_member_select on public.hv_evidence_documents;
create policy hv_evidence_select on public.hv_evidence_documents for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_evidence_insert on public.hv_evidence_documents for insert to public
  with check (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_evidence_update on public.hv_evidence_documents for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_evidence_delete on public.hv_evidence_documents for delete to public
  using (hv_is_platform_staff());

-- hv_claim_reviews: org access was select-only, via join to hv_claims
drop policy if exists hv_claim_reviews_staff_all on public.hv_claim_reviews;
drop policy if exists hv_claim_reviews_org_read_verdict on public.hv_claim_reviews;
create policy hv_claim_reviews_select on public.hv_claim_reviews for select to public
  using (
    hv_is_platform_staff()
    or claim_id in (select hv_claims.id from hv_claims where hv_is_org_member(hv_claims.org_id))
  );
create policy hv_claim_reviews_insert on public.hv_claim_reviews for insert to public
  with check (hv_is_platform_staff());
create policy hv_claim_reviews_update on public.hv_claim_reviews for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_claim_reviews_delete on public.hv_claim_reviews for delete to public
  using (hv_is_platform_staff());

-- hv_passport_scores: org access was select-only, via join to hv_passports
drop policy if exists hv_passport_scores_staff_all on public.hv_passport_scores;
drop policy if exists hv_passport_scores_org_member_select on public.hv_passport_scores;
create policy hv_passport_scores_select on public.hv_passport_scores for select to public
  using (
    hv_is_platform_staff()
    or passport_id in (select hv_passports.id from hv_passports where hv_is_org_member(hv_passports.org_id))
  );
create policy hv_passport_scores_insert on public.hv_passport_scores for insert to public
  with check (hv_is_platform_staff());
create policy hv_passport_scores_update on public.hv_passport_scores for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_passport_scores_delete on public.hv_passport_scores for delete to public
  using (hv_is_platform_staff());

-- hv_passports: org access was select-only, direct org_id
drop policy if exists hv_passports_staff_all on public.hv_passports;
drop policy if exists hv_passports_org_member_select on public.hv_passports;
create policy hv_passports_select on public.hv_passports for select to public
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_passports_insert on public.hv_passports for insert to public
  with check (hv_is_platform_staff());
create policy hv_passports_update on public.hv_passports for update to public
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_passports_delete on public.hv_passports for delete to public
  using (hv_is_platform_staff());

-- hv_org_snapshots: role scope is {authenticated}, not {public} -- preserved as-is.
-- hv_org_snapshots_service_all (service_role) is untouched, separate policy.
drop policy if exists hv_org_snapshots_staff_all on public.hv_org_snapshots;
drop policy if exists hv_org_snapshots_org_member_select on public.hv_org_snapshots;
create policy hv_org_snapshots_select on public.hv_org_snapshots for select to authenticated
  using (hv_is_platform_staff() or hv_is_org_member(org_id));
create policy hv_org_snapshots_insert on public.hv_org_snapshots for insert to authenticated
  with check (hv_is_platform_staff());
create policy hv_org_snapshots_update on public.hv_org_snapshots for update to authenticated
  using (hv_is_platform_staff())
  with check (hv_is_platform_staff());
create policy hv_org_snapshots_delete on public.hv_org_snapshots for delete to authenticated
  using (hv_is_platform_staff());

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115343','split_hv_staff_org_all_policies_into_percommand','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115343_split_hv_staff_org_all_policies_into_percommand.sql

-- RECOVERY BEGIN 20260831115509_split_genetics_cultivar_all_policies_into_percommand.sql
-- Reconstructed from production. Verbatim statements for version 20260831115509.
begin;

-- === Pure duplicate: owner_read is byte-identical to owner_all's condition ===
drop policy if exists genetics_profile_roles_owner_read on public.genetics_profile_roles;

-- === Subset cases (same shape as Family 1: narrower ALL role-set fully covered by broader SELECT) ===
drop policy if exists genetics_routing_events_admin_operator_all on public.genetics_routing_events;
create policy genetics_routing_events_insert on public.genetics_routing_events for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_events_update on public.genetics_routing_events for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_events_delete on public.genetics_routing_events for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

drop policy if exists genetics_routing_records_admin_operator_all on public.genetics_routing_records;
create policy genetics_routing_records_insert on public.genetics_routing_records for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_records_update on public.genetics_routing_records for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy genetics_routing_records_delete on public.genetics_routing_records for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

drop policy if exists genetics_project_members_admin_all on public.genetics_project_members;
create policy genetics_project_members_insert on public.genetics_project_members for insert to public
  with check (is_genetics_admin_or_reviewer());
create policy genetics_project_members_update on public.genetics_project_members for update to public
  using (is_genetics_admin_or_reviewer())
  with check (is_genetics_admin_or_reviewer());
create policy genetics_project_members_delete on public.genetics_project_members for delete to public
  using (is_genetics_admin_or_reviewer());

-- === Simple SELECT+SELECT merge (no ALL policy involved) ===
drop policy if exists country_intel_admin_select on public.country_intel;
drop policy if exists country_intel_intel_tier_read on public.country_intel;
create policy country_intel_select on public.country_intel for select to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst']))
    or (review_status = 'active' and exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator'])))
  );

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115509','split_genetics_cultivar_all_policies_into_percommand','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115509_split_genetics_cultivar_all_policies_into_percommand.sql

-- RECOVERY BEGIN 20260831115538_merge_genetics_cultivar_owner_public_policies.sql
-- Reconstructed from production. Verbatim statements for version 20260831115538.
begin;

-- cultivar_aliases
drop policy if exists cultivar_aliases_owner_all on public.cultivar_aliases;
drop policy if exists cultivar_aliases_public_read on public.cultivar_aliases;
create policy cultivar_aliases_select on public.cultivar_aliases for select to anon, authenticated
  using (
    is_public = true
    or exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer()))
  );
create policy cultivar_aliases_insert on public.cultivar_aliases for insert to authenticated
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_aliases_update on public.cultivar_aliases for update to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())))
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_aliases_delete on public.cultivar_aliases for delete to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_aliases.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));

-- cultivar_country_opportunities
drop policy if exists cultivar_country_opportunities_owner_all on public.cultivar_country_opportunities;
drop policy if exists cultivar_country_opportunities_public_read on public.cultivar_country_opportunities;
create policy cultivar_country_opportunities_select on public.cultivar_country_opportunities for select to anon, authenticated
  using (
    exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and cp.is_public = true)
    or exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer()))
  );
create policy cultivar_country_opportunities_insert on public.cultivar_country_opportunities for insert to authenticated
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_country_opportunities_update on public.cultivar_country_opportunities for update to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())))
  with check (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));
create policy cultivar_country_opportunities_delete on public.cultivar_country_opportunities for delete to authenticated
  using (exists (select 1 from cultivar_passports cp where cp.id = cultivar_country_opportunities.cultivar_id and (cp.owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())));

-- cultivar_passports
drop policy if exists cultivar_passports_owner_all on public.cultivar_passports;
drop policy if exists cultivar_passports_public_read on public.cultivar_passports;
create policy cultivar_passports_select on public.cultivar_passports for select to anon, authenticated
  using (is_public = true or owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_insert on public.cultivar_passports for insert to authenticated
  with check (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_update on public.cultivar_passports for update to authenticated
  using (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer())
  with check (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());
create policy cultivar_passports_delete on public.cultivar_passports for delete to authenticated
  using (owner_user_id = (select auth.uid()) or is_genetics_admin_or_reviewer());

-- genetics_access_grants
drop policy if exists genetics_access_grants_admin_owner_all on public.genetics_access_grants;
drop policy if exists genetics_access_grants_grantee_read on public.genetics_access_grants;
create policy genetics_access_grants_select on public.genetics_access_grants for select to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_access_grants.grantee_profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_insert on public.genetics_access_grants for insert to authenticated
  with check (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_update on public.genetics_access_grants for update to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  )
  with check (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_access_grants_delete on public.genetics_access_grants for delete to authenticated
  using (
    is_genetics_admin_or_reviewer()
    or grantor_user_id = (select auth.uid())
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_access_grants.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );

-- genetics_claim_reviews
drop policy if exists genetics_claim_reviews_admin_all on public.genetics_claim_reviews;
drop policy if exists genetics_claim_reviews_owner_read on public.genetics_claim_reviews;
create policy genetics_claim_reviews_select on public.genetics_claim_reviews for select to public
  using (
    is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_claim_reviews.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_claim_reviews_insert on public.genetics_claim_reviews for insert to public
  with check (is_genetics_admin_or_reviewer());
create policy genetics_claim_reviews_update on public.genetics_claim_reviews for update to public
  using (is_genetics_admin_or_reviewer())
  with check (is_genetics_admin_or_reviewer());
create policy genetics_claim_reviews_delete on public.genetics_claim_reviews for delete to public
  using (is_genetics_admin_or_reviewer());

-- genetics_collaboration_projects
drop policy if exists genetics_collaboration_projects_owner_all on public.genetics_collaboration_projects;
drop policy if exists genetics_collaboration_projects_public_read on public.genetics_collaboration_projects;
create policy genetics_collaboration_projects_select on public.genetics_collaboration_projects for select to anon, authenticated
  using (
    visibility = 'public_summary'::project_visibility
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_collaboration_projects_insert on public.genetics_collaboration_projects for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_collaboration_projects_update on public.genetics_collaboration_projects for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_collaboration_projects_delete on public.genetics_collaboration_projects for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_collaboration_projects.owner_profile_id and gp.owner_user_id = (select auth.uid())));

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115538','merge_genetics_cultivar_owner_public_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115538_merge_genetics_cultivar_owner_public_policies.sql

-- RECOVERY BEGIN 20260831115604_merge_remaining_genetics_ia_hv_policies.sql
-- Reconstructed from production. Verbatim statements for version 20260831115604.
begin;

-- genetics_evidence_items (3-way: owner_all + grant_read + public_summary_read)
drop policy if exists genetics_evidence_items_owner_all on public.genetics_evidence_items;
drop policy if exists genetics_evidence_items_grant_read on public.genetics_evidence_items;
drop policy if exists genetics_evidence_items_public_summary_read on public.genetics_evidence_items;
create policy genetics_evidence_items_select on public.genetics_evidence_items for select to anon, authenticated
  using (
    visibility = 'public_summary'::evidence_visibility
    or created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
    or exists (
      select 1 from genetics_access_grants gag join genetics_profiles gp on gp.id = gag.grantee_profile_id
      where gag.cultivar_id = genetics_evidence_items.cultivar_id
        and gp.owner_user_id = (select auth.uid())
        and gag.status = 'active'::access_grant_status
        and gag.starts_at <= now()
        and (gag.expires_at is null or gag.expires_at > now())
        and gag.revoked_at is null
        and (genetics_evidence_items.id = any (gag.allowed_evidence_item_ids) or genetics_evidence_items.evidence_type = any (gag.allowed_evidence_types))
    )
  );
create policy genetics_evidence_items_insert on public.genetics_evidence_items for insert to authenticated
  with check (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_evidence_items_update on public.genetics_evidence_items for update to authenticated
  using (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  )
  with check (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_evidence_items_delete on public.genetics_evidence_items for delete to authenticated
  using (
    created_by = (select auth.uid())
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_evidence_items.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );

-- genetics_service_providers
drop policy if exists genetics_service_providers_owner_all on public.genetics_service_providers;
drop policy if exists genetics_service_providers_public_read on public.genetics_service_providers;
create policy genetics_service_providers_select on public.genetics_service_providers for select to anon, authenticated
  using (
    is_public = true
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid()))
  );
create policy genetics_service_providers_insert on public.genetics_service_providers for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_service_providers_update on public.genetics_service_providers for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));
create policy genetics_service_providers_delete on public.genetics_service_providers for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from genetics_profiles gp where gp.id = genetics_service_providers.profile_id and gp.owner_user_id = (select auth.uid())));

-- ia_signal_embeddings
drop policy if exists ia_signal_embeddings_admin_operator_all on public.ia_signal_embeddings;
drop policy if exists ia_signal_embeddings_intel_tier_read on public.ia_signal_embeddings;
create policy ia_signal_embeddings_select on public.ia_signal_embeddings for select to authenticated
  using (
    exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
    or exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator']))
  );
create policy ia_signal_embeddings_insert on public.ia_signal_embeddings for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signal_embeddings_update on public.ia_signal_embeddings for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signal_embeddings_delete on public.ia_signal_embeddings for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

-- ia_signals
drop policy if exists ia_signals_admin_operator_all on public.ia_signals;
drop policy if exists ia_signals_intel_tier_read on public.ia_signals;
create policy ia_signals_select on public.ia_signals for select to authenticated
  using (
    exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
    or exists (select 1 from user_profiles up where up.id = (select auth.uid()) and up.tier = any (array['intel','operator']))
  );
create policy ia_signals_insert on public.ia_signals for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signals_update on public.ia_signals for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy ia_signals_delete on public.ia_signals for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

-- hv_public_feed (service_write for service_role untouched)
drop policy if exists hv_public_feed_admin_write on public.hv_public_feed;
drop policy if exists hv_public_feed_public_read on public.hv_public_feed;
create policy hv_public_feed_select on public.hv_public_feed for select to public
  using (
    status = 'published'
    or exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator']))
  );
create policy hv_public_feed_insert on public.hv_public_feed for insert to authenticated
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy hv_public_feed_update on public.hv_public_feed for update to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])))
  with check (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));
create policy hv_public_feed_delete on public.hv_public_feed for delete to authenticated
  using (exists (select 1 from user_roles where user_roles.user_id = (select auth.uid()) and user_roles.role = any (array['admin','operator'])));

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115604','merge_remaining_genetics_ia_hv_policies','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115604_merge_remaining_genetics_ia_hv_policies.sql

-- RECOVERY BEGIN 20260831115940_final_rls_consolidation_pass.sql
-- Reconstructed from production. Verbatim statements for version 20260831115940.
begin;

-- signals: admin_all is a strict subset of every other role-based policy on this table (dead weight).
-- signals_select_admin_operator_only reappeared (concurrent session) and is a subset of analyst_select -- redundant again.
drop policy if exists admin_all on public.signals;
drop policy if exists signals_select_admin_operator_only on public.signals;
drop policy if exists signals_admin_operator_analyst_select on public.signals;
drop policy if exists signals_public_select on public.signals;
create policy signals_select on public.signals for select to anon, authenticated
  using (
    score >= 60
    or reviewed = true
    or exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = any (array['admin','operator','analyst']))
  );

-- clinical_evidence_claims
drop policy if exists clinical_evidence_claims_review_access on public.clinical_evidence_claims;
drop policy if exists clinical_evidence_claims_verified_read on public.clinical_evidence_claims;
create policy clinical_evidence_claims_select on public.clinical_evidence_claims for select to authenticated
  using (
    clinical_evidence_has_review_role()
    or (
      is_verified_clinician() and status = 'current'
      and clinical_source_is_prescriber_inspectable(primary_source_url)
      and exists (select 1 from clinical_evidence_records e where e.id = clinical_evidence_claims.evidence_record_id and e.review_status = 'published')
    )
  );
create policy clinical_evidence_claims_insert on public.clinical_evidence_claims for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_evidence_claims_update on public.clinical_evidence_claims for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_evidence_claims_delete on public.clinical_evidence_claims for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_evidence_outcome_links
drop policy if exists clinical_outcome_links_review_access on public.clinical_evidence_outcome_links;
drop policy if exists clinical_outcome_links_public_read on public.clinical_evidence_outcome_links;
create policy clinical_outcome_links_select on public.clinical_evidence_outcome_links for select to anon, authenticated
  using (
    clinical_evidence_has_review_role()
    or (
      review_status = 'published'
      and exists (select 1 from clinical_condition_terms c where c.id = clinical_evidence_outcome_links.condition_term_id and c.review_status = 'published')
      and exists (select 1 from clinical_evidence_records e where e.id = clinical_evidence_outcome_links.evidence_record_id and e.review_status = 'published')
    )
  );
create policy clinical_outcome_links_insert on public.clinical_evidence_outcome_links for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_outcome_links_update on public.clinical_evidence_outcome_links for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_outcome_links_delete on public.clinical_evidence_outcome_links for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_guideline_recommendations
drop policy if exists clinical_guideline_recommendations_review_access on public.clinical_guideline_recommendations;
drop policy if exists clinical_guideline_recommendations_verified_read on public.clinical_guideline_recommendations;
create policy clinical_guideline_recommendations_select on public.clinical_guideline_recommendations for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and status = 'current'));
create policy clinical_guideline_recommendations_insert on public.clinical_guideline_recommendations for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_guideline_recommendations_update on public.clinical_guideline_recommendations for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_guideline_recommendations_delete on public.clinical_guideline_recommendations for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_regimen_protocols
drop policy if exists clinical_regimen_protocols_review_access on public.clinical_regimen_protocols;
drop policy if exists clinical_regimen_protocols_verified_read on public.clinical_regimen_protocols;
create policy clinical_regimen_protocols_select on public.clinical_regimen_protocols for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and review_status = 'published'));
create policy clinical_regimen_protocols_insert on public.clinical_regimen_protocols for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_regimen_protocols_update on public.clinical_regimen_protocols for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_regimen_protocols_delete on public.clinical_regimen_protocols for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_safety_rules
drop policy if exists clinical_safety_rules_review_access on public.clinical_safety_rules;
drop policy if exists clinical_safety_rules_verified_read on public.clinical_safety_rules;
create policy clinical_safety_rules_select on public.clinical_safety_rules for select to authenticated
  using (clinical_evidence_has_review_role() or (is_verified_clinician() and review_status = 'published'));
create policy clinical_safety_rules_insert on public.clinical_safety_rules for insert to authenticated
  with check (clinical_evidence_has_review_role());
create policy clinical_safety_rules_update on public.clinical_safety_rules for update to authenticated
  using (clinical_evidence_has_review_role()) with check (clinical_evidence_has_review_role());
create policy clinical_safety_rules_delete on public.clinical_safety_rules for delete to authenticated
  using (clinical_evidence_has_review_role());

-- clinical_reviewer_credentials: subset case (review_access's admin/operator is fully covered by
-- review_read's default admin/operator/analyst for SELECT). Split write out, leave review_read as sole SELECT.
drop policy if exists clinical_reviewer_credentials_review_access on public.clinical_reviewer_credentials;
create policy clinical_reviewer_credentials_insert on public.clinical_reviewer_credentials for insert to authenticated
  with check (clinical_evidence_has_review_role(array['admin','operator']));
create policy clinical_reviewer_credentials_update on public.clinical_reviewer_credentials for update to authenticated
  using (clinical_evidence_has_review_role(array['admin','operator']))
  with check (clinical_evidence_has_review_role(array['admin','operator']));
create policy clinical_reviewer_credentials_delete on public.clinical_reviewer_credentials for delete to authenticated
  using (clinical_evidence_has_review_role(array['admin','operator']));

-- genetics_claims
drop policy if exists genetics_claims_owner_admin_all on public.genetics_claims;
drop policy if exists genetics_claims_public_read on public.genetics_claims;
create policy genetics_claims_select on public.genetics_claims for select to public
  using (
    (public_display_allowed = true and review_status = 'approved_public'::claim_review_status)
    or is_genetics_admin_or_reviewer()
    or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid()))
  );
create policy genetics_claims_insert on public.genetics_claims for insert to authenticated
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));
create policy genetics_claims_update on public.genetics_claims for update to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())))
  with check (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));
create policy genetics_claims_delete on public.genetics_claims for delete to authenticated
  using (is_genetics_admin_or_reviewer() or exists (select 1 from cultivar_passports cp where cp.id = genetics_claims.cultivar_id and cp.owner_user_id = (select auth.uid())));

-- talent_jobs: fold manage's select contribution into public_read_open
drop policy if exists talent_jobs_manage on public.talent_jobs;
drop policy if exists talent_jobs_public_read_open on public.talent_jobs;
create policy talent_jobs_select on public.talent_jobs for select to anon, authenticated
  using (
    status = 'open'
    or exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_insert on public.talent_jobs for insert to authenticated
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_update on public.talent_jobs for update to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );
create policy talent_jobs_delete on public.talent_jobs for delete to authenticated
  using (
    exists (select 1 from user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin')
    or workspace_id in (select workspace_members.workspace_id from workspace_members where workspace_members.user_id = (select auth.uid()))
  );

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831115940','final_rls_consolidation_pass','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831115940_final_rls_consolidation_pass.sql

-- RECOVERY BEGIN 20260831130000_evidence_backed_market_access_authority.sql
-- Evidence-backed Market Access authority.
-- Published globe colour is sourced only from structured, current evidence.
-- Legacy countries.regulatory_tier remains advisory for analyst review.

alter table public.countries
  add column if not exists verified_regulatory_tier text,
  add column if not exists regulatory_tier_evidence_key text,
  add column if not exists regulatory_tier_verified_at timestamptz,
  add column if not exists regulatory_tier_expires_at timestamptz;

alter table public.countries drop constraint if exists countries_verified_regulatory_tier_check;
alter table public.countries add constraint countries_verified_regulatory_tier_check
check (verified_regulatory_tier is null or verified_regulatory_tier in (
  'legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited'
));

create table if not exists public.regulatory_market_access_evidence (
  evidence_key text primary key,
  jurisdiction_iso2 text not null references public.countries(iso_alpha2) on update cascade on delete cascade,
  tier text not null check (tier in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited')),
  rationale text not null,
  authority_name text not null,
  authority_url text not null,
  source_effective_date date,
  verified_at timestamptz not null,
  expires_at timestamptz not null,
  parent_iso2 text,
  inheritance_scope text check (inheritance_scope is null or inheritance_scope = 'national_licensed_pathway'),
  source_snapshot_sha256 text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint regulatory_market_access_evidence_expiry check (expires_at > verified_at),
  constraint regulatory_market_access_evidence_parent check (
    (parent_iso2 is null and inheritance_scope is null) or
    (parent_iso2 is not null and inheritance_scope = 'national_licensed_pathway')
  )
);

alter table public.regulatory_market_access_evidence enable row level security;
drop policy if exists regulatory_market_access_evidence_public_read on public.regulatory_market_access_evidence;
create policy regulatory_market_access_evidence_public_read on public.regulatory_market_access_evidence
for select to anon, authenticated using (active = true);
revoke insert, update, delete on public.regulatory_market_access_evidence from anon, authenticated;
grant select on public.regulatory_market_access_evidence to anon, authenticated;

comment on table public.regulatory_market_access_evidence is
  'Structured authority records allowed to publish a Market Access globe tier. Briefing prose/regex is advisory only.';
comment on column public.countries.verified_regulatory_tier is
  'Public Market Access tier. Populated only from current structured evidence; null renders neutral.';

create or replace function api.resolve_verified_market_access_evidence(p_iso text, p_at timestamptz default now())
returns table (evidence_key text, tier text, verified_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with direct_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,0 as precedence
    from public.regulatory_market_access_evidence e
    where e.active and e.jurisdiction_iso2=p_iso and e.parent_iso2 is null
      and e.verified_at<=p_at and e.expires_at>p_at
  ), inherited_match as (
    select e.evidence_key,e.tier,e.verified_at,e.expires_at,1 as precedence
    from public.regulatory_market_access_evidence e
    where e.active and e.parent_iso2 in ('CA','AU','DE')
      and e.jurisdiction_iso2=e.parent_iso2
      and e.inheritance_scope='national_licensed_pathway'
      and p_iso like e.parent_iso2 || '-%'
      and e.verified_at<=p_at and e.expires_at>p_at
  )
  select x.evidence_key,x.tier,x.verified_at,x.expires_at
  from (select * from direct_match union all select * from inherited_match) x
  order by x.precedence,x.verified_at desc limit 1;
$$;
revoke all on function api.resolve_verified_market_access_evidence(text,timestamptz) from public;
grant execute on function api.resolve_verified_market_access_evidence(text,timestamptz) to anon, authenticated, service_role;

create or replace function api.refresh_verified_market_access_tiers(p_actor text default 'system')
returns table (iso_alpha2 text, old_tier text, new_tier text, evidence_key text, action text)
language plpgsql security definer set search_path = '' as $$
declare r record; ev record; v_old text;
begin
  if session_user <> 'postgres' and current_user <> 'service_role' then
    raise exception 'insufficient privileges' using errcode='42501';
  end if;
  for r in select c.iso_alpha2,c.verified_regulatory_tier from public.countries c where c.iso_alpha2 is not null loop
    v_old:=r.verified_regulatory_tier;
    select * into ev from api.resolve_verified_market_access_evidence(r.iso_alpha2,now());
    update public.countries c set
      verified_regulatory_tier=ev.tier,
      regulatory_tier_evidence_key=ev.evidence_key,
      regulatory_tier_verified_at=ev.verified_at,
      regulatory_tier_expires_at=ev.expires_at,
      updated_at=case when c.verified_regulatory_tier is distinct from ev.tier then now() else c.updated_at end
    where c.iso_alpha2=r.iso_alpha2;
    iso_alpha2:=r.iso_alpha2; old_tier:=v_old; new_tier:=ev.tier; evidence_key:=ev.evidence_key;
    action:=case when ev.evidence_key is null and v_old is null then 'neutral_unchanged'
      when ev.evidence_key is null then 'neutralized_no_current_evidence'
      when v_old is distinct from ev.tier then 'published_from_evidence' else 'verified_unchanged' end;
    return next;
  end loop;
end; $$;
revoke all on function api.refresh_verified_market_access_tiers(text) from public, anon, authenticated;
grant execute on function api.refresh_verified_market_access_tiers(text) to service_role;

create or replace view api.regulatory_market_access_drift as
select c.iso_alpha2,c.country_name,c.regulatory_tier as classifier_or_legacy_tier,
  c.verified_regulatory_tier as published_tier,c.regulatory_tier_evidence_key as evidence_key,
  c.regulatory_tier_verified_at as verified_at,c.regulatory_tier_expires_at as expires_at,
  (c.regulatory_tier is distinct from c.verified_regulatory_tier) as legacy_differs_from_published,
  (c.regulatory_tier_expires_at is null or c.regulatory_tier_expires_at<=now()) as evidence_missing_or_expired
from public.countries c;
grant select on api.regulatory_market_access_drift to authenticated, service_role;

-- INCB 2023 reported legal cannabis import/export activity: operational controlled cross-border pathway.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
select 'incb-2023-trade-'||lower(iso),iso,'legal_commercial_access',
  'INCB reports legal cannabis import and/or export activity; an operational controlled cross-border supply pathway is verified.',
  'International Narcotics Control Board — Narcotic Drugs 2024',
  'https://www.incb.org/documents/Narcotic-Drugs/Technical-Publications/2024/Narcotics_2024_EFN.pdf',
  date '2023-12-31',timestamptz '2026-08-31 12:10:00+00',timestamptz '2027-09-01 00:00:00+00'
from unnest(array['AT','AU','BR','CA','CZ','DE','DK','ES','FI','GB','GR','IL','IT','KR','LU','MT','MK','NL','NO','NZ','PE','PL','PT','UY','ZA','ZW']) iso
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- Current national authority records. Parent inheritance is explicit and limited to CA/AU/DE.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at,parent_iso2,inheritance_scope)
values
('hc-ca-import-export-20260831','CA','legal_commercial_access','Federally licensed businesses may import/export cannabis for medical or scientific purposes with shipment permits; provinces and territories operate legal retail distribution.','Health Canada','https://www.canada.ca/en/health-canada/services/cannabis-regulations-licensed-producers/import-export.html',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','CA','national_licensed_pathway'),
('odc-au-import-export-20260831','AU','legal_commercial_access','ODC licenses and permits commercial quantities of medicinal cannabis imports and exports and publishes current import/export/production data.','Australian Government Office of Drug Control','https://www.odc.gov.au/australian-cannabis-data-import-export-production-and-stock','2026-08-19','2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','AU','national_licensed_pathway'),
('bfarm-de-import-export-20260831','DE','legal_commercial_access','The German federal medicinal-cannabis framework permits controlled import/export; the national licensed pathway applies across Länder.','BfArM','https://www.bfarm.de/DE/Bundesopiumstelle/Medizinisches-Cannabis/_node.html',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00','DE','national_licensed_pathway'),
('ica-co-import-export-20260831','CO','legal_commercial_access','Colombian authorities maintain licensed foreign-trade procedures for medicinal cannabis, including psychoactive cannabis exports for medical/scientific purposes.','Instituto Colombiano Agropecuario / INVIMA','https://www.ica.gov.co/areas/proteccion-fronteriza/cannabis-medicinal-importacion-y-exportacion',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00',null,null),
('mag-cr-licensed-export-20260831','CR','legal_commercial_access','Costa Rica licenses psychoactive medicinal cannabis cultivation, import, export, transport and commercialization; export projects require a lawful foreign-market contract.','Costa Rica Ministry of Agriculture and Livestock','https://mag.go.cr/servicios-y-tramites/',null,'2026-08-31 12:10:00+00','2027-09-01 00:00:00+00',null,null)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,
 parent_iso2=excluded.parent_iso2,inheritance_scope=excluded.inheritance_scope,active=true;

-- National US evidence is direct-only: it MUST NOT cascade into state rows.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values ('ncsl-us-national-20260831','US','medical_limited_trade',
  'State medical cannabis markets operate across most of the United States, but no lawful nationwide interstate commercial cannabis pathway is verified; state rows are classified independently.',
  'National Conference of State Legislatures — State Medical Cannabis Laws',
  'https://www.ncsl.org/health/state-medical-cannabis-laws',null,
  '2026-08-31 12:10:00+00','2027-03-01 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- US state market status from NCSL 2026 tables. State adult-use retail => domestic_only because interstate cannabis commerce is not verified.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
select 'ncsl-us-'||lower(replace(iso,'US-',''))||'-20260831',iso,tier,
 case tier when 'domestic_only' then 'Operational state-licensed non-medical adult-use retail market; no verified lawful interstate cannabis trade pathway.'
 when 'medical_limited_trade' then 'State medical cannabis market/program is lawful; no operational adult-use retail market or lawful interstate cannabis trade pathway verified.'
 else 'No full state medical/adult-use cannabis market verified; lawful access is limited to hemp/low-THC/CBD pathways.' end,
 'National Conference of State Legislatures — State Medical Cannabis Laws','https://www.ncsl.org/health/state-medical-cannabis-laws',
 null,timestamptz '2026-08-31 12:10:00+00',timestamptz '2027-03-01 00:00:00+00'
from (values
('US-AK','domestic_only'),('US-AL','medical_limited_trade'),('US-AR','medical_limited_trade'),('US-AZ','domestic_only'),('US-CA','domestic_only'),
('US-CO','domestic_only'),('US-CT','domestic_only'),('US-DC','medical_limited_trade'),('US-DE','domestic_only'),('US-FL','medical_limited_trade'),
('US-GA','medical_limited_trade'),('US-HI','medical_limited_trade'),('US-IA','cbd_hemp_only'),('US-ID','cbd_hemp_only'),('US-IL','domestic_only'),
('US-IN','cbd_hemp_only'),('US-KS','cbd_hemp_only'),('US-KY','medical_limited_trade'),('US-LA','medical_limited_trade'),('US-MA','domestic_only'),
('US-MD','domestic_only'),('US-ME','domestic_only'),('US-MI','domestic_only'),('US-MN','domestic_only'),('US-MO','domestic_only'),
('US-MS','medical_limited_trade'),('US-MT','domestic_only'),('US-NC','cbd_hemp_only'),('US-ND','medical_limited_trade'),('US-NE','medical_limited_trade'),
('US-NH','medical_limited_trade'),('US-NJ','domestic_only'),('US-NM','domestic_only'),('US-NV','domestic_only'),('US-NY','domestic_only'),
('US-OH','domestic_only'),('US-OK','medical_limited_trade'),('US-OR','domestic_only'),('US-PA','medical_limited_trade'),('US-RI','domestic_only'),
('US-SC','cbd_hemp_only'),('US-SD','medical_limited_trade'),('US-TN','cbd_hemp_only'),('US-TX','medical_limited_trade'),('US-UT','medical_limited_trade'),
('US-VA','medical_limited_trade'),('US-VT','domestic_only'),('US-WA','domestic_only'),('US-WI','cbd_hemp_only'),('US-WV','medical_limited_trade'),('US-WY','cbd_hemp_only')
) v(iso,tier)
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,
 authority_url=excluded.authority_url,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

-- More specific current Virginia authority: retail adult-use sales begin July 1 2027, not today.
insert into public.regulatory_market_access_evidence
(evidence_key,jurisdiction_iso2,tier,rationale,authority_name,authority_url,source_effective_date,verified_at,expires_at)
values ('va-cca-20260831','US-VA','medical_limited_trade','Virginia has a regulated medical market. Adult-use retail was enacted in 2026 but retail sales do not begin until July 1, 2027.','Virginia Cannabis Control Authority','https://cca.virginia.gov/retailmarijuanamarket','2027-07-01','2026-08-31 12:10:00+00','2027-07-02 00:00:00+00')
on conflict (evidence_key) do update set tier=excluded.tier,rationale=excluded.rationale,authority_name=excluded.authority_name,authority_url=excluded.authority_url,
 source_effective_date=excluded.source_effective_date,verified_at=excluded.verified_at,expires_at=excluded.expires_at,active=true;

select * from api.refresh_verified_market_access_tiers('evidence-backed-market-access-20260831');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831130000','evidence_backed_market_access_authority','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831130000_evidence_backed_market_access_authority.sql

-- RECOVERY BEGIN 20260831130500_market_access_evidence_uniqueness.sql
-- Enforce deterministic direct publication authority per jurisdiction.
-- The base evidence migration seeds a generic NCSL Virginia row and then a more
-- specific current Virginia CCA row. Keep the CCA row active and retain the NCSL
-- row as inactive historical audit context before adding the uniqueness gate.

update public.regulatory_market_access_evidence
set active = false
where evidence_key = 'ncsl-us-va-20260831'
  and jurisdiction_iso2 = 'US-VA';

create unique index if not exists regulatory_market_access_evidence_one_active_direct
  on public.regulatory_market_access_evidence (jurisdiction_iso2)
  where active = true and parent_iso2 is null;

comment on index public.regulatory_market_access_evidence_one_active_direct is
  'At most one active direct evidence authority may publish a jurisdiction tier. Parent inheritance records are separately constrained by the resolver allowlist.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260831130500','market_access_evidence_uniqueness','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260831130500_market_access_evidence_uniqueness.sql

-- RECOVERY BEGIN 20260901021633_document_medical_only_reclassification_via_rpc.sql
-- Documents a reclassification that was originally applied via ad-hoc
-- api.set_regulatory_tier() calls (not through the migration pipeline), so it never
-- got a tracked version or a repo migration file until now. Idempotent: only
-- touches rows that don't already have the target tier, so safe to run even
-- though the underlying data change already happened in production.
--
-- Same class of fix as the rest of this batch: these 30 jurisdictions were
-- tagged domestic_only (implying a real domestic legal market) when their own
-- rationale describes a narrow medical-prescription-only program with no
-- adult-use/decrim/home-cultivation dimension.
DO $do$
DECLARE
  iso text;
  target_isos text[] := array[
    'US-AL','US-AR','US-FL','US-HI','US-KY','US-LA','US-MS','US-NE','US-NH','US-ND',
    'US-OK','US-PA','US-SD','US-TX','US-UT','US-WV',
    'BE','BR','DK','EE','FR','NO','SK','SI','GB','PR','PA','PY','CR','PE'
  ];
BEGIN
  FOREACH iso IN ARRAY target_isos LOOP
    IF EXISTS (
      SELECT 1 FROM public.countries
      WHERE iso_alpha2 = iso AND regulatory_tier IS DISTINCT FROM 'medical_limited_trade'
    ) THEN
      PERFORM api.set_regulatory_tier(
        iso, 'medical_limited_trade', 'claude-diagnostic',
        'Reclassified: rationale describes narrow medical-prescription-only program (no adult-use/decrim/home-cultivation); was miscategorized under domestic_only, overstating market access on the globe.'
      );
    END IF;
  END LOOP;
END $do$;

UPDATE public.countries
SET market_access_status = CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END::market_access_status
-- Zero-state replay: production types countries.market_access_status as the enum
-- public.market_access_status, but repository history types it text. The earliest
-- creator, 20260604000000_countries_public_table_v1.sql, predates the enum (not
-- created until 20260710114720), and whatever migration converted the column in
-- production was applied out of band with no repository file. Against a text
-- column the original enum-cast comparison raises
-- "operator does not exist: text = market_access_status".
--
-- Comparing as text is equivalent under both column shapes, because enum labels
-- map one-to-one onto their text spellings. Verified live 2026-09-06 against
-- project zvxdgdkukjrrwamdpqrg: both predicates select the same 23 rows. The SET
-- clause above is deliberately untouched -- assigning the enum-cast value
-- resolves through an assignment cast under either shape.
WHERE market_access_status::text IS DISTINCT FROM (CASE regulatory_tier
  WHEN 'legal_commercial_access' THEN 'open'
  WHEN 'medical_limited_trade'   THEN 'regulated'
  WHEN 'domestic_only'           THEN 'emerging'
  WHEN 'cbd_hemp_only'           THEN 'limited'
  WHEN 'prohibited'              THEN 'restricted'
  ELSE 'unknown'
END);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260901021633','document_medical_only_reclassification_via_rpc','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260901021633_document_medical_only_reclassification_via_rpc.sql

-- RECOVERY BEGIN 20260901022725_pin_search_path_on_mutable_functions.sql
-- Reconstructed from production. Verbatim statements for version 20260901022725.
alter function public.set_updated_at() set search_path = 'public';
alter function public.hv_truncate_at_word_boundary(text, integer) set search_path = 'public';
-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260901022725$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260901022725$;
-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260901022725$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public'';';
  end if;
end
$replay_hv_local_classify_gate_20260901022725$;
alter function public._digest_smart_truncate(text, integer) set search_path = 'public';
alter function public._digest_manual_why(text, text, text, text, text) set search_path = 'public';
alter function public._backfill_strip_site_suffix(text, text) set search_path = 'public';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260901022725','pin_search_path_on_mutable_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260901022725_pin_search_path_on_mutable_functions.sql

-- RECOVERY BEGIN 20260901024429_fix_embed_harvest_silent_failure_and_dispatch_starvation.sql
-- Reconstructed from production. Verbatim statements for version 20260901024429.
-- Bug 1: harvest was marking harvested=true unconditionally, even on non-200
-- responses or per-signal parse failures, permanently losing the embedding.
-- Fix: only retire a job once every signal in the batch actually got a value.
-- Failed/partial batches stay unharvested and retry on the next tick (cheap:
-- Gemini re-embed of an already-succeeded signal just overwrites with the
-- same vector).
create or replace function public.hv_embed_harvest()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare j record; i int; n int:=0; v_emb text; v_batch_ok boolean;
begin
  for j in select hj.request_id, hj.signal_ids, resp.status_code, resp.content
           from public.hv_embed_jobs hj join net._http_response resp on resp.id=hj.request_id
           where not hj.harvested
  loop
    v_batch_ok := (j.status_code = 200);
    if v_batch_ok then
      for i in 1 .. array_length(j.signal_ids,1) loop
        begin
          v_emb := replace(((j.content::jsonb)->'embeddings'->(i-1)->'values')::text, ' ', '');
          if v_emb is not null and v_emb <> 'null' then
            update public.signals set embedding_gemini_1024 = v_emb::vector, embedded_at=now()
            where id = j.signal_ids[i];
            n := n+1;
          else
            v_batch_ok := false;
          end if;
        exception when others then
          v_batch_ok := false;
        end;
      end loop;
    end if;
    if v_batch_ok then
      update public.hv_embed_jobs set harvested=true where request_id=j.request_id;
    end if;
  end loop;
  return n;
end
$function$;

-- Bug 2: dispatch selection ordered newest-first, so a steady stream of new
-- signals perpetually starved the backlog of old never-embedded ones.
-- Fix: oldest-first, so the backlog actually drains.
create or replace function public.hv_pipeline_tick()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_tr_h int; v_cl_h int; v_em_h int; v_ent_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ent_d int; v_ids text[];
begin
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();
  v_ent_h := public.hv_entities_harvest();

  v_tr_d := public.hv_translate_dispatch(40, false);
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);
  v_ent_d := public.hv_entities_dispatch(40);

  -- 2026-08-31: was checking embedding_1024 is null (OpenAI column).
  -- hv_embed_dispatch now writes only to embedding_gemini_1024.
  -- 2026-09-01: was also ordering by created_at desc, so the backlog of
  -- older unembedded signals was perpetually starved behind new arrivals.
  -- Switched to oldest-first so the backlog actually drains.
  select array_agg(id) into v_ids from (
    select s.id from public.signals s
    where s.quality_label='signal' and s.embedding_gemini_1024 is null
      and not exists (select 1 from public.hv_embed_jobs j where s.id = any(j.signal_ids) and not j.harvested)
    order by s.created_at asc limit 100
  ) q;
  if v_ids is not null then perform public.hv_embed_dispatch(v_ids); v_em_d := array_length(v_ids,1); end if;

  return jsonb_build_object(
    'translate_harvested', v_tr_h,
    'classify_harvested',  v_cl_h,
    'embed_harvested',     v_em_h,
    'entities_harvested',  v_ent_h,
    'translate_dispatched', v_tr_d,
    'classify_dispatched', v_cl_d,
    'entities_dispatched', v_ent_d,
    'embed_dispatched',    v_em_d
  );
end
$function$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260901024429','fix_embed_harvest_silent_failure_and_dispatch_starvation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260901024429_fix_embed_harvest_silent_failure_and_dispatch_starvation.sql

-- RECOVERY BEGIN 20260901220634_reconcile_regulatory_tier_guard_and_trigger_current_state.sql
-- Reconstructed from production. Verbatim statements for version 20260901220634.
-- No-op against current production (CREATE OR REPLACE onto identical definitions).
-- See the matching repo file for full rationale: this backfills 3 migrations
-- (20260830191900, 20260830192000, 20260830193000) that were applied directly to
-- prod without a repo commit and whose exact incremental SQL wasn't preserved.

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


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260901220634','reconcile_regulatory_tier_guard_and_trigger_current_state','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260901220634_reconcile_regulatory_tier_guard_and_trigger_current_state.sql

-- RECOVERY BEGIN 20260902021703_fix_search_path_regression_missing_extensions_schema.sql
-- Reconstructed from production. Verbatim statements for version 20260902021703.
alter function public.hv_embed_harvest() set search_path = 'public, extensions';
-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260902021703$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_local_classify_gate_20260902021703$;
-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260902021703$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path = ''public, extensions'';';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260902021703$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260902021703','fix_search_path_regression_missing_extensions_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260902021703_fix_search_path_regression_missing_extensions_schema.sql

-- RECOVERY BEGIN 20260902021818_fix_search_path_quoting_regression.sql
-- Reconstructed from production. Verbatim statements for version 20260902021818.
alter function public.hv_embed_harvest() set search_path to public, extensions;
-- Zero-state replay: public.hv_local_classify_gate(vector) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_local_classify_gate_20260902021818$
begin
  if to_regprocedure('public.hv_local_classify_gate(vector)') is not null then
    execute 'alter function public.hv_local_classify_gate(vector) set search_path to public, extensions;';
  end if;
end
$replay_hv_local_classify_gate_20260902021818$;
-- Zero-state replay: public.hv_gemini_embed_backfill_tick(integer) exists only in
-- production. No repository migration creates it -- the only three files that
-- name it are this one and its two sibling search_path repairs, all of which
-- only ALTER it. Pinning search_path on an absent function is a no-op, so
-- guarding on existence changes nothing; against production, where the function
-- exists, the ALTER runs exactly as before and the hardening is unchanged.
do $replay_hv_gemini_embed_backfill_tick_20260902021818$
begin
  if to_regprocedure('public.hv_gemini_embed_backfill_tick(integer)') is not null then
    execute 'alter function public.hv_gemini_embed_backfill_tick(integer) set search_path to public, extensions;';
  end if;
end
$replay_hv_gemini_embed_backfill_tick_20260902021818$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260902021818','fix_search_path_quoting_regression','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260902021818_fix_search_path_quoting_regression.sql
