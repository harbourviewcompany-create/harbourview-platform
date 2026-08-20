-- Cross-border formulary portability check.
--
-- Second half of the differentiation bet started in
-- 20260819160000_clinical_jurisdiction_supply_outlook.sql (see
-- docs/control/CLINICAL_PRESCRIBER_OS_DIFFERENTIATION_20260819.md). Cannabis
-- patients travel; no single-jurisdiction competitor (CannaScript=UK,
-- Releaf=UK) can answer "is this patient's product available/authorised in
-- their destination country" because it requires exactly the multi-country
-- formulary + regulatory dataset Harbourview already operates.
--
-- Deliberately stateless: takes a brand name and/or cannabinoid profile
-- directly rather than a regimen_id, so it works from a UI that already has
-- the source product loaded (no dependency on clinical_regimen_protocols'
-- grants/shape, which is under active concurrent development) and is usable
-- standalone before a regimen is even finalised.

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

    if v_match is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and brand_name ilike v_brand
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match is not null then
      v_match_kind := 'same-brand';
    end if;
  end if;

  -- Pass 2: fall back to matching cannabinoid profile if no brand match.
  if v_match is null and v_profile is not null then
    select 'sku' as source_type, product_name as product_name, brand_name, authorization_status
    into v_match
    from public.clinical_formulary_skus
    where country_iso2 = v_country
      and review_status = 'published'
      and cannabinoid_profile ilike ('%' || v_profile || '%')
    order by last_seen_at desc nulls last
    limit 1;

    if v_match is null then
      select 'product' as source_type, name as product_name, brand_name, authorization_status
      into v_match
      from public.clinical_formulary_products
      where country_iso2 = v_country
        and review_status = 'published'
        and cannabinoid_profile ilike ('%' || v_profile || '%')
      order by updated_at desc nulls last
      limit 1;
    end if;

    if v_match is not null then
      v_match_kind := 'equivalent-profile';
    end if;
  end if;

  v_verdict := case
    when v_match is null then 'not-currently-available'
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

revoke all on function public.clinical_cross_border_formulary_check(text, text, text) from public;
grant execute on function public.clinical_cross_border_formulary_check(text, text, text)
  to authenticated, service_role;

comment on function public.clinical_cross_border_formulary_check(text, text, text) is
  'Cross-border regimen portability check: given a brand name and/or cannabinoid profile and a destination country, reports whether an equivalent published formulary entry exists there, plus that jurisdiction''s supply-continuity outlook. Informational only, not a legal or clinical determination.';
