-- Reconciled from live supabase_migrations.schema_migrations
-- Version: 20260920215219
-- Source: production-applied statements (byte-for-byte). Do not invent SQL.
-- This file does not change production; it only records what already ran.

create or replace function public.hv_rules_repair_limited_analysis(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare r record; v_clean text; v_changed text; v_quality text; v_n integer:=0;
begin
  for r in
    select id,headline,summary,cat,score,verification,source,analysis
    from public.signals
    where analysis_backend='rules-v1'
      and analysis->>'analysis_quality'='limited_source_text'
    order by score desc nulls last,date desc
    limit least(greatest(coalesce(p_limit,500),1),500)
  loop
    v_clean:=btrim(regexp_replace(
      regexp_replace(coalesce(r.summary,''),'<[^>]+>',' ','g'),
      '(?i)(home|skip to main content|navigation menu|menu toggle|search for:|featured|watchlist|copyright|subscribe|sign up|all rights reserved|read this first).*?(?=\b[A-Z][^.!?]{5,}|$)',
      ' ','g'
    ));
    v_clean:=btrim(regexp_replace(v_clean,'\s+',' ','g'));

    if v_clean is null or length(v_clean)<40 or
       lower(v_clean) like '%'||lower(coalesce(r.headline,''))||'%' and length(v_clean)>length(r.headline)*3
    then
      v_changed:=left(btrim(r.headline),700);
    else
      v_changed:=left(v_clean,700);
    end if;

    if v_changed is null or v_changed='' then
      v_changed:=left(btrim(coalesce(r.headline,'Source text available for review.')),700);
    end if;

    if null::text is null then
      v_quality:='limited_source_text';
    else
      v_quality:='rules_based_cleaned';
    end if;

    update public.signals
    set analysis=jsonb_set(
      jsonb_set(
        analysis,
        '{what_changed}',to_jsonb(v_changed),true
      ),
      '{analysis_quality}',to_jsonb(v_quality),true
    )
    where id=r.id;
    v_n:=v_n+1;
  end loop;
  return v_n;
end $$;
