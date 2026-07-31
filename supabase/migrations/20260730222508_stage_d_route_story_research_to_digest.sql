-- Stage D: bridge story/research signals into the editorial pipeline.
--
-- WHY
-- ---
-- The classifier has assigned a `content_type` since Pipeline B shipped, and
-- the spec (Section 4.3) routes it:
--
--   regulatory -> Signals
--   market     -> Signals + Digest
--   story      -> Digest
--   research   -> Digest
--   noise      -> nowhere
--
-- Nothing enforced that in either direction. 395 promoted rows typed `story`
-- or `research` were being presented on the Signals feed as regulatory
-- intelligence, and the Digest never saw them at all. So the classifier was
-- paying for a judgement that was then discarded.
--
-- This closes the write side: story/research rows are bridged into
-- editorial_items at the `qualified` stage, where the existing editorial
-- workflow picks them up. The read side is closed in lib/signals/quality.ts
-- (belongsOnSignalsFeed) and lib/regulatory-signals/public.ts, which filter
-- these types off the Signals feed.
--
-- Deliberately conservative:
--   * only `quality_label = 'signal'` rows -- spam/nav/boilerplate never bridge
--   * only `reviewed` rows -- unpromoted content is not editorial-ready
--   * one editorial_item per source URL, so re-runs cannot duplicate
--   * bounded per call, so a backlog drains over several runs rather than
--     dumping hundreds of rows into the editorial queue at once

create or replace function public.hv_route_signals_to_digest(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n int := 0;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 300);

  with candidates as (
    select s.id, s.headline, s.title_en, s.summary, s.summary_en, s.url,
           s.country, s.lang, s.date, s.source
      from public.signals s
     where s.reviewed
       and s.content_type in ('story','research')
       and s.quality_label = 'signal'
       and s.url is not null
       -- only bridge each source document once
       and not exists (select 1 from public.editorial_items e where e.source_url = s.url)
     order by s.date desc
     limit p_limit
  ),
  ins as (
    insert into public.editorial_items
      (headline, summary, outlet_name, source_url, country, language, published_at, stage)
    select coalesce(c.title_en, c.headline),
           coalesce(c.summary_en, c.summary),
           coalesce(c.source, 'Harbourview Source Engine'),
           c.url,
           c.country,
           coalesce(c.lang, 'en'),
           c.date,
           'qualified'
    from candidates c
    returning 1
  )
  select count(*) into n from ins;

  return n;
end$function$;

comment on function public.hv_route_signals_to_digest(integer) is
  'Stage D write side: bridges reviewed story/research signals into editorial_items at stage '
  '''qualified''. Deduped on source_url so re-runs are idempotent. The matching read-side filter '
  'lives in lib/signals/quality.ts (belongsOnSignalsFeed) -- change both together or content '
  'either double-surfaces or disappears.';

-- Operator-plane only: SECURITY DEFINER, inserts up to 300 editorial_items rows.
revoke execute on function public.hv_route_signals_to_digest(integer) from public, anon, authenticated;
grant  execute on function public.hv_route_signals_to_digest(integer) to service_role;

-- Twice daily, ahead of the digest generation windows.
select cron.schedule('hv-route-digest', '25 4,16 * * *', 'select public.hv_route_signals_to_digest(100);')
where not exists (select 1 from cron.job where jobname = 'hv-route-digest');
