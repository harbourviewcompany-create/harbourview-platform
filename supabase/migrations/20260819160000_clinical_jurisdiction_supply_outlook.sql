-- Clinical × Market-Intelligence bridge: jurisdiction supply-continuity outlook.
--
-- Strategic rationale (see docs/control/CLINICAL_PRESCRIBER_OS_DIFFERENTIATION_20260819.md):
-- no cannabis-specific clinical decision support competitor (CannaScript, OpenEvidence,
-- InteractSafe, CANN-DIR, Lexicomp/UpToDate) has access to a real trade/regulatory
-- intelligence network. Harbourview does. This closes that gap: it surfaces a safe,
-- aggregated read of the existing `signals` market-intelligence pipeline, scoped to a
-- jurisdiction, for use anywhere a clinical surface shows a formulary SKU or regimen.
--
-- Design constraints:
--   * Never expose raw `signals` rows (internal notes, unverified inference chains,
--     embeddings, competitive intel) to clinical app users. Only an aggregated,
--     reviewed-only summary crosses the boundary.
--   * Additive only. Touches no existing clinical governance table, no RLS on
--     `signals`, no file under active concurrent development.
--   * SECURITY DEFINER so the function can read `signals` on the caller's behalf
--     without granting clinical users direct table access.

create or replace function public.clinical_jurisdiction_supply_outlook(
  p_country_iso2 text,
  p_lookback_days integer default 180
)
returns table (
  country_iso2 text,
  risk_level text,
  signal_count_90d integer,
  signal_count_lookback integer,
  top_category text,
  most_recent_headline text,
  most_recent_summary text,
  most_recent_source_url text,
  most_recent_signal_at timestamptz,
  generated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_country text := upper(nullif(trim(p_country_iso2), ''));
  v_lookback integer := greatest(coalesce(p_lookback_days, 180), 1);
  v_count_90d integer;
  v_count_lookback integer;
  v_top_category text;
  v_row record;
begin
  if v_country is null then
    return;
  end if;

  select count(*) into v_count_90d
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - interval '90 days';

  select count(*) into v_count_lookback
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval;

  select s.cat into v_top_category
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval
  group by s.cat
  order by count(*) desc, max(s.date) desc
  limit 1;

  select
    coalesce(s.editorial_title, s.title_en, s.headline) as headline,
    coalesce(s.editorial_blurb, s.summary_en, s.summary) as summary,
    s.url,
    s.date
  into v_row
  from public.signals s
  where s.country_iso2 = v_country
    and s.reviewed is true
    and s.cat in ('regulatory','GAZETTE','supply','market','commercial','international')
    and s.date >= now() - (v_lookback || ' days')::interval
  order by s.date desc, s.score desc nulls last
  limit 1;

  return query select
    v_country,
    case
      when v_count_lookback = 0 then 'insufficient-data'
      when v_count_90d >= 3 then 'elevated'
      when v_count_90d >= 1 then 'watch'
      else 'normal'
    end,
    v_count_90d,
    v_count_lookback,
    v_top_category,
    v_row.headline,
    v_row.summary,
    v_row.url,
    v_row.date,
    now();
end;
$function$;

revoke all on function public.clinical_jurisdiction_supply_outlook(text, integer) from public;
grant execute on function public.clinical_jurisdiction_supply_outlook(text, integer)
  to authenticated, service_role;

comment on function public.clinical_jurisdiction_supply_outlook(text, integer) is
  'Clinical-safe aggregated read of the internal market-intelligence signals pipeline, scoped to one jurisdiction. Returns risk level + one representative reviewed signal, never raw rows. Feeds the supply-continuity badge on formulary SKUs and regimens.';
