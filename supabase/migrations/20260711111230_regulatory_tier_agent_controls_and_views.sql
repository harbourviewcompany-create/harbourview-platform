-- The "editing view" surface: what's stale/flagged, plus RPCs an agent (or the
-- Airtable sync) calls to make changes safely. All writes funnel through these
-- so provenance, hashing, audit, and the needs_review flag stay consistent.

-- 1. Review-queue view: everything currently flagged, with its source text and
--    what the classifier WOULD say now (so a reviewer sees the delta at a glance).
create or replace view api.regulatory_tier_review_queue as
select
  c.iso_alpha2,
  c.country_name,
  c.region,
  c.regulatory_tier              as current_tier,
  c.regulatory_tier_origin       as origin,
  api.derive_regulatory_tier(b.program_status) as classifier_suggests,
  (c.regulatory_tier is distinct from api.derive_regulatory_tier(b.program_status)) as differs_from_classifier,
  b.program_status,
  c.regulatory_tier_rationale    as rationale,
  c.regulatory_tier_reviewed_at  as reviewed_at,
  c.regulatory_tier_last_derived_at as last_derived_at
from public.countries c
left join public.cc_jurisdiction_briefings b
  on b.country_iso2=c.iso_alpha2 and b.jurisdiction_type='country'
where c.regulatory_tier_needs_review = true
order by c.country_name;

grant select on api.regulatory_tier_review_queue to authenticated, service_role;

-- 2. Agent sets a reviewed tier (becomes an override, clears the flag, logs it).
create or replace function api.set_regulatory_tier(
  p_iso text,
  p_tier text,
  p_actor text default 'agent',
  p_note text default null
) returns public.countries
language plpgsql security definer set search_path=''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
begin
  if p_tier not in ('legal_commercial_access','medical_limited_trade','domestic_only','cbd_hemp_only','prohibited') then
    raise exception 'invalid tier %', p_tier;
  end if;

  select * into v_old from public.countries where iso_alpha2 = p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';

  update public.countries set
    regulatory_tier = p_tier,
    regulatory_tier_origin = 'override',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'reviewed override ('||p_actor||') '||to_char(now(),'YYYY-MM-DD'),
    regulatory_tier_rationale = coalesce(p_note, regulatory_tier_rationale)
  where iso_alpha2 = p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, p_tier, 'override', 'manual', v_ps, p_actor, coalesce(p_note,'Manual override via set_regulatory_tier'));

  return v_row;
end;
$$;

-- 3. Agent accepts the classifier's current suggestion (reverts to auto, clears flag).
create or replace function api.accept_classifier_tier(
  p_iso text,
  p_actor text default 'agent'
) returns public.countries
language plpgsql security definer set search_path=''
as $$
declare
  v_old public.countries;
  v_row public.countries;
  v_ps  text;
  v_new text;
begin
  select * into v_old from public.countries where iso_alpha2=p_iso;
  if not found then raise exception 'unknown country %', p_iso; end if;

  select program_status into v_ps from public.cc_jurisdiction_briefings
   where country_iso2=p_iso and jurisdiction_type='country';
  v_new := api.derive_regulatory_tier(v_ps);

  update public.countries set
    regulatory_tier = coalesce(v_new, regulatory_tier),
    regulatory_tier_origin = 'auto',
    regulatory_tier_reviewed_at = now(),
    regulatory_tier_needs_review = false,
    regulatory_tier_source_hash = md5(coalesce(v_ps,'')),
    regulatory_tier_last_derived_at = now(),
    regulatory_tier_source = 'classifier-accepted ('||p_actor||') '||to_char(now(),'YYYY-MM-DD')
  where iso_alpha2=p_iso
  returning * into v_row;

  insert into public.regulatory_tier_audit
    (country_iso2, old_tier, new_tier, origin, trigger_source, program_status, actor, note)
  values
    (p_iso, v_old.regulatory_tier, coalesce(v_new,v_old.regulatory_tier), 'auto', 'manual', v_ps, p_actor, 'Accepted classifier suggestion');

  return v_row;
end;
$$;

revoke all on function api.set_regulatory_tier(text,text,text,text) from public, anon;
revoke all on function api.accept_classifier_tier(text,text) from public, anon;
grant execute on function api.set_regulatory_tier(text,text,text,text) to authenticated, service_role;
grant execute on function api.accept_classifier_tier(text,text) to authenticated, service_role;
