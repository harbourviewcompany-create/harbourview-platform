-- Reconciliation migration: brings repo in line with the live intelligence
-- "editorial feed" pipeline built directly against production this session.
-- Captures editorial titles, source tiering (gov/press/exclude), freshness gating,
-- semantic dedup, and the classify→title→promote→dedup tick. Extracted verbatim
-- from the live database (pg_get_functiondef / pg_get_viewdef) so it matches prod.
--
-- NOTE: the pg_cron jobs are environment state, not created here. Live jobs:
--   job 13 'hv-embed-every-30min' : SELECT public.hv_trigger_embed();  (25,55 * * * *)
--   job 38 'intel-classify-promote': SELECT public.intel_pipeline_tick(); (*/4 * * * *)
-- Recreate with cron.schedule(<name>,<cron>,<cmd>) after applying, if provisioning fresh.

-- ── editorial columns ─────────────────────────────────────────────────────────
alter table public.signals add column if not exists editorial_title text;
alter table public.signals add column if not exists editorial_blurb text;

-- ── remove the stale no-arg overload that made dedup_promoted_feed() ambiguous ──
drop function if exists public.dedup_promoted_feed();

-- ── views (api surface + source tiering) ──────────────────────────────────────
create or replace view public.source_domain_type as
 SELECT domain, tier, source_type,
    CASE
        WHEN source_type = ANY (ARRAY['regulator','government_official','government_release','regulator_official','regulatory_filing','primary_legislation']) THEN 'gov'
        WHEN source_type = ANY (ARRAY['trade','trade_press','industry_press','news','mainstream_media','legal_analysis','academic']) THEN 'press'
        ELSE 'exclude'
    END AS bucket
   FROM ( SELECT regexp_replace(lower(source_url), '^https?://(www\.)?([^/]+).*$', '\2') AS domain,
            min(tier) AS tier,
            (array_agg(source_type ORDER BY tier))[1] AS source_type
           FROM public.source_registry
          WHERE source_url IS NOT NULL
          GROUP BY regexp_replace(lower(source_url), '^https?://(www\.)?([^/]+).*$', '\2')) x;

create or replace view api.signals as
 SELECT id, date, cat, pri, score, headline, summary, source, url, verification, tier, lang,
    company, country, in_network, lane_r, lane_e, lane_t, top_lane, query_pack, commercial_impact,
    reviewed, action, created_at, embedding_1024, embedding_model, embedded_at, reviewed_by, reviewed_at,
    editorial_title, editorial_blurb, country_iso2
   FROM public.signals;

create or replace view api.signal_classifications as
 SELECT id, signal_id, quality_label, content_type, impact, confidence, model, created_at
   FROM public.signal_classifications;

create or replace view api.intel_eval_predictions as
 SELECT id, run_id, signal_id, quality_label, content_type, impact, confidence, reason, model, created_at
   FROM public.intel_eval_predictions;

create or replace view api.intel_classify_review_queue as
 SELECT signal_id, headline, summary, reason, resolved, created_at
   FROM public.intel_classify_review_queue;

-- ── functions ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_junk_headline(h text)
 RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public','pg_temp'
AS $function$
  select h is null
    or length(btrim(h)) < 20
    or h ~* '(most read|delivered every|no paywall|related news|related posts|skip to content|newsletter|subscribe now|sign ?up|log ?in|cookie policy|privacy policy|read more|share this|all rights reserved|^menu\M|^home\M)';
$function$;

CREATE OR REPLACE FUNCTION public.signal_bucket(p_url text)
 RETURNS text LANGUAGE sql STABLE SET search_path TO 'public','pg_temp'
AS $function$
  select coalesce(
    (select d.bucket from public.source_domain_type d
      where d.domain = regexp_replace(lower(coalesce(p_url,'')),'^https?://(www\.)?([^/]+).*$','\2')
      limit 1),
    'unknown');
$function$;

CREATE OR REPLACE FUNCTION api.apply_editorial_title(p_signal_id text, p_title text, p_blurb text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare n int;
begin
  update public.signals
    set editorial_title=p_title, editorial_blurb=p_blurb, headline=p_title,
        summary=coalesce(nullif(p_blurb,''), summary)
  where id=p_signal_id;
  get diagnostics n = row_count;
  return n;
end$function$;

CREATE OR REPLACE FUNCTION public.dedup_promoted_feed(p_sim double precision DEFAULT 0.72)
 RETURNS integer LANGUAGE plpgsql SET search_path TO 'public','pg_temp'
AS $function$
declare r record; kept_ids text[] := '{}'; removed int := 0;
begin
  for r in
    select id, coalesce(url,'') as url, embedding_1024 as emb,
           lower(btrim(coalesce(editorial_title, headline))) as core
    from public.signals
    where reviewed=true and action like 'Promoted by classifier%'
    order by coalesce(created_at,'2000-01-01'::timestamptz), id
  loop
    if exists (
      select 1 from public.signals k
      where k.id = any(kept_ids) and (
        (r.url <> '' and r.url = coalesce(k.url,'')
           and r.url !~* '/feed/|/rss|rss\?|news\.google|/search\?')
        or (r.emb is not null and k.embedding_1024 is not null
           and (1 - (r.emb <=> k.embedding_1024)) >= p_sim)
        or similarity(r.core, lower(btrim(coalesce(k.editorial_title,k.headline)))) > 0.72
      )
    ) then
      update public.signals set reviewed=false, action='Deduped (semantic)' where id=r.id;
      removed := removed + 1;
    else
      kept_ids := kept_ids || r.id;
    end if;
  end loop;
  return removed;
end$function$;

CREATE OR REPLACE FUNCTION api.rows_needing_titles(p_limit integer DEFAULT 25)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  select s.id, s.headline, s.summary
  from public.signals s
  join public.signal_classifications c on c.signal_id = s.id and c.quality_label='signal'
  where s.editorial_title is null and not public.is_junk_headline(s.headline)
  order by s.created_at desc limit p_limit;
$function$;

CREATE OR REPLACE FUNCTION api.pool_rows_needing_classification(p_limit integer DEFAULT 50)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
  select s.id, s.headline, s.summary
  from public.signals s
  where s.reviewed=false and s.cat='SOURCE_ENGINE'
    and not exists (select 1 from public.signal_classifications c where c.signal_id=s.id)
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by (case when public.signal_bucket(s.url)='gov' then 0 else 1 end), s.date desc nulls last
  limit p_limit;
$function$;

CREATE OR REPLACE FUNCTION api.promote_classified_signals(p_min_confidence numeric DEFAULT 0.65, p_dry_run boolean DEFAULT true, p_limit integer DEFAULT 500)
 RETURNS TABLE(candidate_count bigint, promoted bigint, dry_run boolean)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare v_candidates bigint; v_promoted bigint := 0;
begin
  create temporary table _promote_batch on commit drop as
  select distinct on (c.signal_id) c.signal_id, c.content_type
  from public.signal_classifications c join public.signals s on s.id=c.signal_id
  where s.reviewed=false and c.quality_label='signal'
    and coalesce(c.confidence,0) >= p_min_confidence
    and s.editorial_title is not null
    and public.signal_bucket(s.url) in ('gov','press')
    and s.url !~* 'google\.|/search\?'
    and s.date >= now() - interval '30 days'
  order by c.signal_id, c.created_at desc limit p_limit;
  select count(*) into v_candidates from _promote_batch;
  if p_dry_run then return query select v_candidates,0::bigint,true; return; end if;
  update public.signals s set reviewed=true,
    top_lane=case b.content_type when 'regulatory' then 'Regulatory' when 'market' then 'Economic' else 'Trade' end,
    action='Promoted by classifier (Stage 3)'
  from _promote_batch b where s.id=b.signal_id and s.reviewed=false;
  get diagnostics v_promoted = row_count;
  return query select v_candidates,v_promoted,false;
end$function$;

-- Live version embeds the project's public anon key as the bearer; placeholder here
-- to avoid committing a token. Replace __SUPABASE_ANON_KEY__ before applying to a fresh env.
CREATE OR REPLACE FUNCTION public.intel_pipeline_tick()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_temp'
AS $function$
declare hdr jsonb := jsonb_build_object('content-type','application/json',
  'Authorization','Bearer __SUPABASE_ANON_KEY__');
    url text := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify';
begin
  perform api.promote_classified_signals(0.65, false);
  perform public.dedup_promoted_feed();
  perform net.http_post(url, jsonb_build_object('mode','titles','limit',12), '{}'::jsonb, hdr, 150000);
  perform net.http_post(url, jsonb_build_object('mode','pool','limit',15), '{}'::jsonb, hdr, 150000);
end$function$;

-- ── grants ────────────────────────────────────────────────────────────────────
grant select, insert on api.signal_classifications to service_role;
grant select, insert on api.intel_eval_predictions to service_role;
grant select, insert, update on api.intel_classify_review_queue to service_role;
grant select, update on api.signals to service_role;
grant update (editorial_title, editorial_blurb, headline, summary, top_lane, reviewed, action) on public.signals to service_role;
grant execute on function public.is_junk_headline(text) to service_role;
grant execute on function public.signal_bucket(text) to service_role;
grant execute on function api.apply_editorial_title(text,text,text) to service_role;
grant execute on function api.rows_needing_titles(integer) to service_role;
grant execute on function api.pool_rows_needing_classification(integer) to service_role;
grant execute on function api.promote_classified_signals(numeric,boolean,integer) to service_role;
