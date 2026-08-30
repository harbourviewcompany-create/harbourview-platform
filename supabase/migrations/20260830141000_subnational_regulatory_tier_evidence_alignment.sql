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
