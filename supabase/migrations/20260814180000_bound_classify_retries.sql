-- Bound the classifier retry loop: record per-attempt outcomes, retire signals
-- that keep failing into the manual-review queue, and stop re-dispatching them.
--
-- TWO DEFECTS, ONE OUTAGE
--
-- DEFECT 1 -- the dispatch budget is a reservation that is never released.
--
-- `hv_classify_corpus_dispatch()` calls
-- `hv_consume_dispatch_budget('classify', p_limit)` BEFORE it selects any rows,
-- charging the full p_limit whether or not there is anything to dispatch, and
-- nothing ever returns the unused remainder. `hv_pipeline_tick()` passes 120 and
-- runs every 30 minutes, so the ceiling is consumed at 120 x 48 = 5,760/day
-- against a 3,000/day limit -- exhausted after ~25 ticks, roughly 12.5 hours,
-- every single day, even with an empty pool and zero work performed.
--
-- Demonstrated locally on a PostgreSQL 16 harness: with every signal already
-- classified and the review queue empty, two consecutive ticks reported
-- `dispatched = 0` while `calls_used` advanced 0 -> 120.
--
-- This is why all three metered stages sit at exactly their ceilings on
-- 2026-08-14 (classify 3000/3000, translate 800/800, entities 600/600). Three
-- independent workloads landing precisely on three different ceilings is not a
-- coincidence about volume; it is unconditional reservation.
--
-- DEFECT 2 -- failed attempts are not recorded, so they repeat without limit.
--
-- `hv_classify_corpus_harvest()` only ever writes a signal when the edge
-- response is HTTP 200 *and* its body carries a `classification` object. Every
-- other case falls through the `if v_c is not null` guard, does nothing, and
-- still marks the job `harvested = true`.
--
-- Nothing records that the attempt failed. The signal keeps
-- `quality_label is null`, which is exactly the predicate
-- `hv_classify_corpus_dispatch()` selects on, so the same row is dispatched
-- again on the next tick, and the next, without limit.
--
-- That turns a transient upstream failure into a permanent outage, because the
-- retries are charged against the daily dispatch budget that
-- `hv_consume_dispatch_budget('classify', ...)` enforces. Once the failing
-- backlog is large enough to consume the ceiling, healthy new signals never get
-- dispatched at all -- the cost control works exactly as designed and is spent
-- entirely on rows that will fail again.
--
-- MEASURED AGAINST PRODUCTION 2026-08-14, not inferred:
--
--   classify budget (hv_dispatch_budget) ............ 3000 / 3000 used
--   eligible unclassified backlog ................... 123 signals
--   hv_classify_jobs rows for those 123 signals ..... 3,859
--   average dispatches per backlogged signal ........ 31.4
--   most-retried single signal ...................... 392 dispatches
--
--   signals ingested / left unclassified, by day:
--     2026-08-11 .... 133 ingested,   0 unclassified    (0.0%)
--     2026-08-12 ....  27 ingested,  21 unclassified   (77.8%)
--     2026-08-13 ....  44 ingested,  44 unclassified  (100.0%)
--     2026-08-14 ....  62 ingested,  57 unclassified   (91.9%)
--
-- 123 backlogged rows retried across 48 ticks/day at 120 per tick lands on
-- ~2,950 calls against a 3,000 ceiling. The arithmetic closes: the loop is
-- self-sustaining and will not clear on its own.
--
-- The surviving `net._http_response` rows show what the retries were buying:
--
--   200 with body {"ok":true,"routed":"manual_review","reason":"openai_429"} .. 169
--   503 SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED ............................... 71
--
-- Note the first shape carries HTTP 200 and no `classification` key. To the
-- harvester that is indistinguishable from success, which is why the failure
-- was invisible while every cron job reported green.
--
-- WHY THE EDGE FUNCTION CANNOT FIX THIS ALONE
--
-- `hv-classify`'s ad-hoc `{text}` path reports `routed: "manual_review"` but
-- performs no routing -- unlike its `pool` and `eval` modes, it never calls
-- `routeToManualReview`. It cannot: `hv_classify_corpus_dispatch` posts only
-- `{text: {headline, summary}}` and no `signalId`, so the function does not know
-- which row it is judging. Confirmed by the queue itself --
-- `public.intel_classify_review_queue` has taken no new row since 2026-07-21
-- despite 169 "routed to manual review" responses today alone.
--
-- So `INTELLIGENCE_ARCHITECTURE_SPEC.md` §6.1's stated safety property --
-- "nothing is silently dropped" -- does not hold for the path Pipeline B
-- actually uses. The harvester is the only participant that knows the
-- signal_id, so the routing belongs here.
--
-- WHAT THIS CHANGES
--
-- 1. `hv_classify_jobs` gains `outcome` and `attempted_at`, so a failed attempt
--    is distinguishable from a successful one after the fact.
-- 2. `hv_classify_corpus_harvest()` records that outcome instead of discarding
--    it. Its successful path is byte-for-byte unchanged.
-- 3. `hv_classify_corpus_dispatch()` retires a signal to
--    `intel_classify_review_queue` after c_max_attempts recorded failures and
--    excludes anything sitting unresolved in that queue from further dispatch.
-- 4. `hv_classify_corpus_dispatch()` selects its batch before charging the
--    budget, and charges for exactly the rows it will dispatch. The ceiling and
--    its fail-closed behaviour on an unknown stage name are unchanged;
--    `hv_consume_dispatch_budget` itself is not modified.
--
-- Only `classify` is changed here. `translate` and `entities` dispatch through
-- their own functions with the same reservation defect and are left alone: this
-- migration is scoped to the stage whose outage was actually measured, and
-- fixing all three at once would make it un-revertable in isolation. They are
-- called out in the PR so the remaining work is visible rather than implied.
--
-- Existing `hv_classify_jobs` rows keep `outcome = null` -- their outcomes were
-- never recorded and are not recoverable, so they are left honestly unknown
-- rather than backfilled with a guess. The 123 backlogged signals therefore get
-- a fresh budget of c_max_attempts each (~615 calls, one-off) and then retire
-- permanently.
--
-- Confirmed read-only against production before writing this: with `outcome`
-- absent, the retirement predicate matches 0 rows, so nothing is mass-retired on
-- first run. The dispatch pool goes 123 -> 122, the single row removed being one
-- already sitting unresolved in the review queue from July.
--
-- Note the two defects interact, so do not read the retry counts as the budget
-- driver: today the reservation (Defect 1) exhausts the ceiling first, which
-- caps how often the retries (Defect 2) can actually fire. Fixing only Defect 1
-- would have freed the budget for an unbounded retry loop to consume in earnest
-- -- roughly 123 x 48 ticks -- which is why both are fixed together.
--
-- Resolving a queue row makes its signal eligible again, which is the intended
-- manual-override path and the reason the exclusion tests `not q.resolved`
-- rather than mere presence.
--
-- SEARCH PATH
--
-- Both functions are recreated with their live `search_path` reproduced
-- verbatim, including its duplicated 'public' entry. That duplicate is not a
-- typo to tidy: narrowing a pinned search_path on a SECURITY DEFINER function
-- in this database is precisely what broke `hv_dedup_assign` on 2026-08-14
-- (see 20260814143000). Verbatim is the house standard here.

alter table public.hv_classify_jobs
  add column if not exists outcome text,
  add column if not exists attempted_at timestamptz;

-- Added without a default so the rewrite is skipped and pre-existing rows stay
-- NULL ("not recorded") rather than being stamped with the migration time.
alter table public.hv_classify_jobs
  alter column attempted_at set default now();

comment on column public.hv_classify_jobs.outcome is
  'Harvest result for this dispatch: ok | no_classification | http_<status>. NULL means the attempt predates 20260814180000 and its outcome was never recorded.';

create index if not exists hv_classify_jobs_signal_failed_idx
  on public.hv_classify_jobs (signal_id)
  where outcome is not null and outcome <> 'ok';

create index if not exists intel_classify_review_queue_unresolved_idx
  on public.intel_classify_review_queue (signal_id)
  where not resolved;

create or replace function public.hv_classify_corpus_harvest()
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_c jsonb; v_outcome text; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    v_outcome := 'http_' || coalesce(r.status_code::text, 'null');
    if r.status_code=200 then
      v_outcome := 'no_classification';
      begin
        v_c := (r.content::jsonb->'classification');
        if v_c is not null then
          update public.signals s set
            quality_label = v_c->>'quality_label',
            content_type = v_c->>'content_type',
            impact = v_c->>'impact',
            quality_confidence = (v_c->>'confidence')::numeric,
            classifier_version = 'hv-classify/openai/v2-summary-fix'
          where s.id = r.signal_id;
          v_outcome := 'ok';
          n:=n+1;
        end if;
      exception when others then v_outcome := 'parse_error';
      end;
    end if;
    update public.hv_classify_jobs
       set harvested=true, outcome=v_outcome, attempted_at=coalesce(attempted_at, now())
     where request_id=r.request_id;
  end loop;
  return n;
end$function$;

create or replace function public.hv_classify_corpus_dispatch(p_limit integer DEFAULT 100, p_scope_days integer DEFAULT 120)
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'
as $function$
declare r record; v_rid bigint; n int:=0; v_ids text[]; c_max_attempts constant int := 5;
begin
  p_limit := least(greatest(coalesce(p_limit, 100), 1), 150);
  p_scope_days := least(greatest(coalesce(p_scope_days, 120), 1), 400);

  -- Retire anything that has failed c_max_attempts times into manual review, so
  -- the exclusion below can take it out of the dispatch pool permanently. This
  -- runs before the budget is consumed: retiring a dead row must not itself be
  -- rationed, or a saturated budget would keep the loop alive forever.
  insert into public.intel_classify_review_queue (signal_id, headline, summary, reason)
  select s.id,
         coalesce(s.title_en, s.headline),
         coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline),
         'classify_failed_after_' || c_max_attempts || '_attempts'
  from public.signals s
  where s.quality_label is null
    and s.reviewed is distinct from true
    and s.headline is not null
    and s.created_at > now() - (p_scope_days||' days')::interval
    and (
      select count(*) from public.hv_classify_jobs k
      where k.signal_id = s.id and k.outcome is not null and k.outcome <> 'ok'
    ) >= c_max_attempts
  on conflict (signal_id) do nothing;

  -- Select the batch BEFORE consuming budget, then charge for exactly the rows
  -- that will actually be dispatched. The original charged p_limit up front and
  -- never returned the unused remainder, so a tick that dispatched nothing
  -- still spent its full reservation -- see the header for the measurements.
  select array_agg(s.id order by s.created_at desc) into v_ids
  from (
    select s.id, s.created_at
    from public.signals s
    where s.quality_label is null
      and s.reviewed is distinct from true
      and s.headline is not null
      and s.created_at > now() - (p_scope_days||' days')::interval
      and not exists (select 1 from public.hv_classify_jobs j where j.signal_id=s.id and not j.harvested)
      and not exists (select 1 from public.intel_classify_review_queue q where q.signal_id=s.id and not q.resolved)
    order by s.created_at desc
    limit p_limit
  ) s;

  if v_ids is null then return 0; end if;

  p_limit := public.hv_consume_dispatch_budget('classify', array_length(v_ids,1));
  if p_limit <= 0 then return 0; end if;
  v_ids := v_ids[1:p_limit];

  for r in
    select s.id, coalesce(s.title_en, s.headline) as h, coalesce(s.summary_en, left(s.summary,1000), s.title_en, s.headline) as sm
    from public.signals s
    where s.id = any(v_ids)
    order by s.created_at desc
  loop
    select net.http_post(
      url:='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hv_edge_anon_key' limit 1)),
      body:=jsonb_build_object('text', jsonb_build_object('headline', r.h, 'summary', r.sm)),
      timeout_milliseconds:=30000
    ) into v_rid;
    insert into public.hv_classify_jobs(request_id, signal_id) values (v_rid, r.id) on conflict do nothing;
    n:=n+1;
  end loop;
  return n;
end$function$;

-- Deliberately no GRANT block.
--
-- The sibling migration 20260814143000 ends with `grant execute ... to
-- service_role`, and copying that pattern here would have been wrong. Checked
-- rather than assumed -- live ACLs on 2026-08-14:
--
--   hv_classify_corpus_dispatch ..... {postgres=X/postgres}
--   hv_classify_corpus_harvest ...... {postgres=X/postgres}
--   hv_pipeline_tick ................ {postgres=X/postgres}
--   hv_dedup_assign ................. {postgres=X/postgres,service_role=X/postgres}
--
-- Only hv_dedup_assign carries service_role, and these two are reached solely
-- through hv_pipeline_tick under pg_cron, which runs as postgres. Adding
-- service_role would widen privileges beyond what the caller needs, against
-- Guardrail 6. `create or replace function` preserves the existing ACL, so the
-- current least-privilege state carries forward untouched.
