-- Zero-cost editorial enrichment and deterministic deadline extraction.
create or replace function public.hv_rules_enrich_editorial(p_limit integer default 200)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  v_clean text;
  v_n integer := 0;
begin
  for r in
    select id, headline, summary
    from public.editorial_items
    where stage = 'qualified'
      and (why_it_matters is null or btrim(why_it_matters) = '')
    order by created_at asc
    limit least(greatest(coalesce(p_limit,200),1),200)
  loop
    v_clean := btrim(regexp_replace(
      regexp_replace(coalesce(nullif(btrim(r.summary),''), r.headline, ''), '<[^>]+>', ' ', 'g'),
      '(?i)(home|search|menu|watchlist|featured|copyright|sign up|subscribe|all rights reserved).*$', '', 'g'
    ));
    v_clean := btrim(regexp_replace(v_clean, '\s+', ' ', 'g'));
    if v_clean is null or v_clean = '' then
      v_clean := btrim(r.headline);
    end if;

    update public.editorial_items
    set why_it_matters = left(
      'Source-reported development: ' ||
      coalesce(v_clean, 'The item reports a development requiring source verification.') ||
      ' Further context and impact should be verified against the underlying source.',
      700
    ),
    updated_at = now()
    where id = r.id
      and (why_it_matters is null or btrim(why_it_matters) = '');

    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;

create or replace function public.hv_rules_enrich_deadlines(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  v_text text;
  v_match text;
  v_date text;
  v_n integer := 0;
begin
  for r in
    select id, headline, summary, analysis
    from public.signals
    where analysis is not null
      and coalesce(analysis->>'deadline','') = ''
      and (headline is not null or summary is not null)
    order by date desc nulls last
    limit least(greatest(coalesce(p_limit,500),1),500)
  loop
    v_text := left(btrim(coalesce(r.headline,'') || '. ' || coalesce(r.summary,'')), 6000);

    v_match := (regexp_match(
      v_text,
      '(?i)(?:deadline|due|due date|by|before|effective|takes effect|takes effect on|expires?|expiration|through|on)\s*:?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{1,2}(?:st|nd|rd|th)?(?:,|\s)\s*[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})'
    ))[1];

    if v_match is not null and btrim(v_match) <> '' then
      v_date := btrim(v_match);
      update public.signals
      set analysis = jsonb_set(
        jsonb_set(analysis, '{deadline}', to_jsonb(v_date), true),
        '{deadline_source}', '"rules-v2"', true
      ),
      analysis_generated_at = coalesce(analysis_generated_at, now())
      where id = r.id
        and coalesce(analysis->>'deadline','') = '';
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end
$$;

revoke all on function public.hv_rules_enrich_editorial(integer) from public;
revoke all on function public.hv_rules_enrich_deadlines(integer) from public;
grant execute on function public.hv_rules_enrich_editorial(integer) to service_role;
grant execute on function public.hv_rules_enrich_deadlines(integer) to service_role;
