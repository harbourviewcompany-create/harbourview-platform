-- 2026-09-25: reconcile hv-quality-pipeline promotion safeguards applied live
-- Context: hv_promote_signals (cron job "hv-quality-promote", every 10/40 min)
-- was promoting rows straight from quality_label='signal' with no title-gate,
-- no URL-level dedup, and no action stamp. This let ~5,270 raw scraped
-- body-text fragments (and duplicate page-chunks, e.g. one Canada.ca licensee
-- table -> 61 "signals") reach the live public feed. Reverted those rows to
-- reviewed=false live; this migration reconciles the function fixes.

-- 1. Widen title-generation candidates to also cover the corpus classifier's
--    quality_label rows (previously only old signal_classifications rows).
CREATE OR REPLACE FUNCTION api.rows_needing_titles(p_limit integer DEFAULT 25)
 RETURNS TABLE(signal_id text, headline text, summary text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'api', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
begin
  if (select auth.role()) is distinct from 'service_role' and not public.is_genetics_admin_or_reviewer() then
    raise exception 'insufficient privileges: admin/operator/analyst role or service_role required' using errcode = '42501';
  end if;
  return query
  select s.id, s.headline, s.summary
  from public.signals s
  where s.editorial_title is null
    and not public.is_junk_headline(s.headline)
    and (
      exists (select 1 from public.signal_classifications c where c.signal_id = s.id and c.quality_label='signal')
      or (s.quality_label = 'signal' and coalesce(s.quality_confidence,0) >= 0.65 and coalesce(s.is_representative, true) = true)
    )
  order by s.created_at desc limit p_limit;
end;
$function$;

-- 2. Promotion now requires: a generated editorial_title, not junk-headline,
--    not on excluded_source_domains, and no other already-live row sharing
--    the same non-aggregator URL. Stamps action for traceability.
CREATE OR REPLACE FUNCTION public.hv_promote_signals(p_min_conf numeric DEFAULT 0.65)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
AS $function$
declare n int;
begin
  update public.signals s set
    reviewed = true, reviewed_by = 'auto:v2', reviewed_at = now(),
    action = 'Promoted by hv_promote_signals (quality-gate v2)'
  where s.quality_label = 'signal'
    and coalesce(s.is_representative, true) = true
    and coalesce(s.quality_confidence, 1) >= p_min_conf
    and s.reviewed is distinct from true
    and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
    and s.editorial_title is not null
    and not public.is_junk_headline(s.headline)
    and regexp_replace(coalesce(s.url,''), '^https?://(www\.)?([^/]+).*', '\2')
        not in (select domain from public.excluded_source_domains)
    and not exists (
      select 1 from public.signals k
      where k.reviewed = true
        and k.id <> s.id
        and k.url = s.url
        and s.url !~* '/feed/|/rss|rss\?|news\.google|/search\?'
    );
  get diagnostics n = row_count;
  return n;
end$function$;

-- 3. New: fires hv-classify in mode=titles so quality-gated candidates
--    actually get a clean editorial title (previously nothing generated one
--    for the corpus-classifier path, so promotion could never gate on it).
CREATE OR REPLACE FUNCTION public.hv_title_dispatch_tick(p_limit integer DEFAULT 25)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'api', 'extensions', 'net', 'vault'
AS $function$
declare v_rid bigint;
begin
  select net.http_post(
    url := 'https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)
    ),
    body := jsonb_build_object('mode','titles','limit', p_limit),
    timeout_milliseconds := 55000
  ) into v_rid;
  return v_rid;
end$function$;

-- 4. Cron jobs (documented here; created live via cron.schedule, not run by this file):
--    select cron.schedule('hv-title-dispatch', '*/5 * * * *', $$select public.hv_title_dispatch_tick(15)$$);
--    select cron.schedule('hv-quality-promote', '10,40 * * * *', $$select public.hv_quality_promote_tick()$$);
