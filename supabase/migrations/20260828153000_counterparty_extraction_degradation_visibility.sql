-- Make counterparty extraction fail loudly instead of silently.
--
-- Two defects, both found on 2026-08-28 after the CTE-scope fix in
-- 20260828022000 stopped the function crashing and revealed what was underneath.
--
-- DEFECT 1 -- the all-providers-degraded alarm is unreachable.
--
-- The fire branch measures the recent failure rate for `anthropic` only:
--
--     if v_anthropic_key is not null then
--       select ... count(*) filter (where r.status_code <> 200) ... provider='anthropic' ...
--       if ... < 0.5 then v_provider := 'anthropic'; end if;
--     end if;
--     if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;
--
-- Gemini is selected unconditionally whenever a key exists. So `v_provider` is
-- never null while a gemini key is configured, and the branch below it --
--
--     if v_provider is null then
--       insert into pipeline_manual_review_queue (...) values ('counterparty_extraction', ...
--         'all_configured_llm_providers_degraded', ...);
--
-- -- cannot fire, even when every configured provider is in fact degraded. That
-- is exactly the condition it was built to catch. Verified live on 2026-08-28:
-- Anthropic returning 400 "credit balance is too low" and Gemini returning 429
-- quota-exceeded, simultaneously, with no queue row and no notification.
--
-- Fixed by applying the same recent-failure-rate check to gemini that anthropic
-- already gets -- a faithful mirror: same 2-hour window, same 10-attempt sample,
-- same 0.5 threshold. When both are degraded `v_provider` is now null, the
-- existing insert fires, and the existing daily cron at
-- app/api/cron/pipeline-manual-review-notify emails it. No new cron and no new
-- delivery channel: INTELLIGENCE_ARCHITECTURE_SPEC.md Stage G explicitly warns
-- against "adding a new always-on cron to solve an always-on-cron problem", and
-- the delivery-channel choice is an open owner decision. This reuses what is
-- already built and already wired.
--
-- DEFECT 2 -- the collect phase reports success when it did nothing.
--
-- On a non-200 the chain produces no `ok` rows, so nothing is extracted, but the
-- job is still marked collected and the function returns a bare
-- `{"ok": true, "phase": "collect", ...}`. Before 20260828022000 a broken
-- pipeline at least showed red in cron.job_run_details; afterwards the identical
-- broken pipeline shows green. The return now carries `llm_status_code` and a
-- `degraded` flag so "ran" is distinguishable from "worked" by anything reading
-- the function's output. Guardrail #5.
--
-- REPOSITORY/PRODUCTION DRIFT -- unresolved, and why this file has two paths.
--
-- Defect 1 exists only in production. No committed migration gives this function
-- a gemini fallback, a provider-degradation check, or the
-- `all_configured_llm_providers_degraded` path at all -- verified across all
-- three migrations that define it (20260704133107, 20260704135057,
-- 20260828022000). Those arrived in an uncommitted production rewrite. Closing
-- that drift means adopting a body this repository has never reviewed, which is
-- a separate owner decision and is NOT taken here.
--
-- So: the production body gets both fixes. The committed repository body has no
-- provider-selection block to correct, so it raises a NOTICE naming the drift
-- rather than pretending there was nothing to do. Any third body raises an
-- exception rather than recording itself as applied.
--
-- Coverage: tests/sql/counterparty_extraction_degradation_dry_run.sql builds a
-- production-shaped fixture and asserts both fixes, so the production-only path
-- is reproducible from this commit rather than from a throwaway cluster.
--
-- Grants: not modified. ACL is `postgres=X/postgres`; CREATE OR REPLACE
-- preserves it.
--
-- Rollback: a NEW forward migration applying both replacements in reverse. Do
-- not edit and re-run this file -- once applied its version is recorded and it
-- will not re-run, and editing a recorded migration breaks its content-hash
-- binding.

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_signal_counterparty_extraction()'::regprocedure) into v_def;

  if position('v_gemini_key' in v_def) = 0 then
    if position($ok$    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));$ok$ in v_def) = 0 then
      raise exception 'counterparty degradation visibility: unrecognized function body -- neither the drifted production body (no v_gemini_key) nor the committed repository body; refusing to record this migration as applied';
    end if;
    raise notice 'run_signal_counterparty_extraction: committed repository body has no provider-selection block (no gemini fallback, no degradation check) -- that logic exists only in the drifted production body, which is a separate unresolved decision. Nothing to patch here.';
    return;
  end if;

  -- 1. Declare the variable carrying the collect-phase HTTP status out of the CTE.
  v_old := $old$  v_collect_provider text;$old$;
  v_new := $new$  v_collect_provider text;
  v_collect_status int;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: declare anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 2. Surface the LLM status and a degraded flag from the collect phase.
  v_old := $old$    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));$old$;
  v_new := $new$    select (select count(*) from ins), (select provider from parsed), (select status_code from parsed)
      into v_inserted, v_collect_provider, v_collect_status;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider,
      'counterparties_touched', coalesce(v_inserted,0),
      'llm_status_code', v_collect_status,
      'degraded', coalesce(v_collect_status, 0) <> 200);$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: collect-phase return anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 3. Give gemini the same degradation check anthropic already has, so the
  --    all-providers-degraded branch below it becomes reachable.
  v_old := $old$  if v_provider is null and v_gemini_key is not null then v_provider := 'gemini'; end if;$old$;
  v_new := $new$  if v_provider is null and v_gemini_key is not null then
    select count(*), count(*) filter (where r.status_code <> 200)
      into v_attempts, v_failures
    from (select request_id from _counterparty_jobs where provider='gemini' and created_at > now() - interval '2 hours' order by created_at desc limit 10) recent
    join net._http_response r on r.id = recent.request_id;
    if coalesce(v_attempts,0) = 0 or v_failures::numeric / v_attempts < 0.5 then v_provider := 'gemini'; end if;
  end if;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty degradation visibility: gemini selection anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;
