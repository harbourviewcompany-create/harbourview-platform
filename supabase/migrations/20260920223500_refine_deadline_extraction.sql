-- Refine deadline extraction to require explicit deadline/effective-date language.
create or replace function public.hv_rules_enrich_deadlines(p_limit integer default 1000)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare r record; v_text text; v_match text; v_date text; v_n integer:=0;
begin
  for r in
    select id,headline,summary,analysis from public.signals
    where analysis is not null and coalesce(analysis->>'deadline','')='' and (headline is not null or summary is not null)
    order by date desc nulls last
    limit least(greatest(coalesce(p_limit,1000),1),1000)
  loop
    v_text:=left(btrim(coalesce(r.headline,'')||'. '||coalesce(r.summary,'')),6000);
    v_match:=(regexp_match(v_text,'(?i)(?:deadline|due(?: date)?|by|before|effective|takes effect|expires?|expiration)\s*:?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{1,2}(?:st|nd|rd|th)?(?:,|\s)\s*[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}/[0-9]{1,2}/[0-9]{4})'))[1];
    if v_match is not null and btrim(v_match)<>'' then
      v_date:=btrim(v_match);
      update public.signals
      set analysis=jsonb_set(jsonb_set(analysis,'{deadline}',to_jsonb(v_date),true),'{deadline_source}','"rules-v2"',true)
      where id=r.id and coalesce(analysis->>'deadline','')='';
      v_n:=v_n+1;
    end if;
  end loop;
  return v_n;
end $$;
revoke all on function public.hv_rules_enrich_deadlines(integer) from public;
grant execute on function public.hv_rules_enrich_deadlines(integer) to service_role;

update public.signals
set analysis=jsonb_set(analysis,'{deadline}','null'::jsonb,true)
where analysis->>'deadline_source'='rules-v2';
