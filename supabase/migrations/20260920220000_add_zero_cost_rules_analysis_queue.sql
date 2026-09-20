create or replace function public.hv_rules_analysis(p_limit integer default 500)
returns integer language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer;
begin
  with candidates as (
    select s.id,
      left(regexp_replace(regexp_replace(regexp_replace(coalesce(nullif(btrim(s.summary),''),s.headline,'Source text is limited.'),E'\\s+',' ','g'),E'^(Home|Search|Menu|Skip to content)\\s+','','i'),E'(.{40,})\\s+\\1(\\s+\\1)+','\\1','gi'),700) cleaned_summary,
      left(btrim(s.headline),500) clean_headline,s.cat,s.score,s.verification,s.source
    from public.signals s
    where s.reviewed=true and s.headline is not null and s.analysis is null
    order by s.score desc nulls last,s.date desc
    limit greatest(1,least(coalesce(p_limit,500),1000))
  ), updated as (
    update public.signals s set
      analysis=jsonb_build_object(
        'what_changed',case when c.cleaned_summary is not null and length(c.cleaned_summary)>=40 and lower(c.cleaned_summary) not like lower(c.clean_headline)||'% '||lower(c.clean_headline)||'%' then c.cleaned_summary else c.clean_headline end,
        'who_is_affected',case when lower(coalesce(c.cat,''))~'regulat|compliance|law|policy|licen|permit|government' then 'Operators, compliance teams, and businesses subject to the affected regulatory or market requirements.' when lower(coalesce(c.cleaned_summary,''))~'investor|stock|share|market' then 'Investors and market participants exposed to the reported company, sector, or market development.' else 'Organizations and market participants directly exposed to the reported development.' end,
        'deadline',null,
        'recommended_action',case when coalesce(c.score,0)>=80 then 'Review the underlying source and assess whether the development requires an operational, compliance, or monitoring response.' else 'Monitor the underlying source and verify the development before taking material operational action.' end,
        'confidence_rationale',case when nullif(btrim(c.verification),'') is not null then 'Rules-based analysis using the recorded signal text and metadata; source verification is marked "'||btrim(c.verification)||'".' else 'Rules-based analysis using the recorded signal text and metadata; source verification metadata is limited.' end,
        'analysis_quality',case when lower(coalesce(c.source,''))~'source engine' or lower(coalesce(c.cleaned_summary,''))~'home|search|menu|watchlist|featured|copyright' then 'limited_source_text' else 'rules_based' end),
      analysis_generated_at=now(),analysis_backend='rules-v1'
    from candidates c where s.id=c.id returning 1)
  select count(*) into v_count from updated;
  return v_count;
end $$;
revoke all on function public.hv_rules_analysis(integer) from public;
grant execute on function public.hv_rules_analysis(integer) to service_role;