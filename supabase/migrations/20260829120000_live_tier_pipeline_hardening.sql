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