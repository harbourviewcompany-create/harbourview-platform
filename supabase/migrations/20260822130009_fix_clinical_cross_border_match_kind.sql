-- Fix: clinical_cross_border_formulary_check's match_kind stuck at 'no-match'
-- even on a real match, whenever the matched row had a mix of null and
-- non-null fields (e.g. a genuine match with a null brand_name).
--
-- Root cause: the original body derived "was a match found" from whole-record
-- `v_match IS NULL` / `IS NOT NULL` checks. Per the SQL-standard row-comparison
-- rule, a row is only `IS NULL` if ALL fields are null, and only `IS NOT NULL`
-- if ALL fields are non-null — a row with a MIX of null/non-null fields makes
-- BOTH predicates evaluate to false. Confirmed live:
--   select row(1,null,3) is null, row(1,null,3) is not null;  -- false, false
-- So `if v_match is not null then v_match_kind := ...` silently never ran
-- whenever the matched row's brand_name happened to be null (the common case
-- today, since brand_name is largely unpopulated in both formulary feeds).
-- portability_verdict was coincidentally correct — its only check was
-- `v_match IS NULL` for the negative case — but match_kind stayed null and
-- coalesced to 'no-match' even on a real match. Confirmed via a scratch debug
-- function reproducing the AU + "Wide CBD/THC range" case from the original
-- verification: match_is_null=false (correct) but match_kind_val stayed null
-- straight through the assignment step.
--
-- Fix: use `v_match.source_type IS NULL` as the "not found yet" sentinel
-- instead of whole-record nullity. source_type is always a literal
-- ('sku'/'product') when a row was actually found, and is only null before
-- any select has matched — so it can never itself be affected by other
-- columns' nullability. v_match is given a fixed row shape up front so this
-- sentinel check is safe even before either pass has run (e.g. when only
-- p_cannabinoid_profile is supplied and Pass 1 never executes).

create or replace function public.clinical_cross_border_formulary_check(
  p_destination_country_iso2 text,
  p_brand_name text default null,
  p_cannabinoid_profile text default null
)
returns table (
  destination_country_iso2 text,
  match_kind text,
  portability_verdict text,
  matched_source_type text,
  matched_product_name text,
  matched_brand_name text,
  matched_authorization_status text,
  supply_risk_level text,
  supply_signal_headline text,
  supply_signal_source_url text,
  generated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_country text := upper(nullif(trim(p_destination_country_iso2), ''));
  v_brand text := nullif(trim(p_brand_name), '');
  v_profile text := nullif(trim(p_cannabinoid_profile), '');
  v_match record;
  v_match_kind text;
  v_verdict text;
  v_outlook record;
begin
  if v_country is null or length(v_country) <> 2 then
    return;
  end if;

  if v_brand is null and v_profile is null then
    return query select
      v_country, 'no-input'::text, 'insufficient-input'::text,
      null::text, null::text, null::text, null::text,
      null::text, null::text, null::text, now();
    return;
  end if;

  select null::text as source_type, null::text as product_name,
         null::text as brand_name, null::text as authorization_status
  into v_match;

  -- Pass 1: same brand, either table.
  if v_brand is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and brand_name ilike v_brand
    order by last_seen_at desc nulls last
    limit 1;

    if v_match.source_type is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and brand_name ilike v_brand
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match.source_type is not null then
      v_match_kind := 'same-brand';
    end if;
  end if;

  -- Pass 2: fall back to matching cannabinoid profile if no brand match.
  if v_match.source_type is null and v_profile is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and cannabinoid_profile ilike ('%' || v_profile || '%')
    order by last_seen_at desc nulls last
    limit 1;

    if v_match.source_type is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and cannabinoid_profile ilike ('%' || v_profile || '%')
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match.source_type is not null then
      v_match_kind := 'equivalent-profile';
    end if;
  end if;

  v_verdict := case
    when v_match.source_type is null then 'not-currently-available'
    when v_match_kind = 'same-brand' then 'likely-portable'
    else 'profile-equivalent-available'
  end;

  select o.risk_level, o.most_recent_headline, o.most_recent_source_url
  into v_outlook
  from public.clinical_jurisdiction_supply_outlook(v_country, 180) o;

  return query select
    v_country,
    coalesce(v_match_kind, 'no-match'),
    v_verdict,
    v_match.source_type,
    v_match.product_name,
    v_match.brand_name,
    v_match.authorization_status,
    v_outlook.risk_level,
    v_outlook.most_recent_headline,
    v_outlook.most_recent_source_url,
    now();
end;
$function$;

-- Grants/comment unchanged, but reasserted for a clean forward-only migration.
revoke all on function public.clinical_cross_border_formulary_check(text, text, text) from public;
grant execute on function public.clinical_cross_border_formulary_check(text, text, text)
  to authenticated, service_role;

comment on function public.clinical_cross_border_formulary_check(text, text, text) is
  'Cross-border regimen portability check: given a brand name and/or cannabinoid profile and a destination country, reports whether an equivalent published formulary entry exists there, plus that jurisdiction''s supply-continuity outlook. Informational only, not a legal or clinical determination.';

drop function if exists public._debug_cross_border_trace(text, text);
