-- Fix: the live run_signal_counterparty_extraction() references a CTE from a
-- statement that has already ended, so its collect phase can never return.
--
-- The collect branch builds a WITH chain (resp -> parsed -> ok -> extracted ->
-- ins -> mark_used -> done) and terminates it with:
--
--     select count(*) from ins into v_inserted;
--
-- and then, as a SEPARATE statement, does:
--
--     return jsonb_build_object(..., 'provider', (select provider from parsed), ...);
--
-- Common table expressions are scoped to the single statement that defines them,
-- so `parsed` no longer exists by the time the RETURN runs. Every collect-phase
-- invocation raises
--
--     ERROR: relation "parsed" does not exist
--
-- which aborts the transaction and rolls back the ia_counterparties upserts, the
-- ia_signals.counterparty_extracted_at marks, and the _counterparty_jobs
-- collected flag that the same statement just wrote.
--
-- Observed impact (read-only query of cron.job_run_details, 2026-08-28): the
-- `counterparty-extraction` job failed 161 consecutive runs, every run since
-- 2026-08-24 18:10 UTC. Last success 2026-08-24 17:40 UTC. No counterparties
-- were extracted in that window.
--
-- WHY THIS MIGRATION HAS TWO PATHS
--
-- The defect exists only in production. The committed repository body (see
-- 20260704135057_fix_unprotected_http_content_cast.sql, collect-phase return)
-- returns no `provider` key at all and therefore has no out-of-scope reference:
--
--     return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));
--
-- Production's live body has drifted from that committed body -- it carries a
-- Gemini fallback, a provider-degradation check and a pipeline_manual_review_queue
-- path that appear in no migration in this repository, and the `provider` key
-- (with the defect) came in with them. That drift is pre-existing and is NOT
-- resolved here; resolving it means adopting a body this repository has never
-- reviewed, which is a separate decision with a separate blast radius.
--
-- So this migration converges from either starting body:
--   * live/production body  -> patch the collect-phase return (the fix).
--   * committed repo body   -> already correct, nothing to do (fresh
--                              `supabase db reset --local` replay path).
--   * anything else         -> raise, so an unexpected body fails loudly
--                              instead of silently no-opping.
--
-- The patch is applied over pg_get_functiondef() rather than by restating the
-- body, following the house pattern in
-- 20260815234000_daily_brief_lineage_hardening.sql. Restating is what would
-- silently revert the drifted live behaviour.
--
-- The corrected shape -- resolve the CTE inside the statement that owns it, then
-- return a variable -- is exactly what the sibling pipeline functions
-- run_daily_digest() and run_editorial_digest() already do correctly. Both were
-- checked and neither carries this defect; both are deliberately left untouched.
--
-- Grants: intentionally not modified. The function's current ACL is
-- `postgres=X/postgres` -- no service_role grant, no PUBLIC. CREATE OR REPLACE
-- preserves the existing ACL, so this migration neither widens nor narrows it.
--
-- Rollback: write a NEW forward migration that applies the two replacements in
-- reverse (v_old and v_new swapped). Do NOT edit and re-run this file: its version
-- is recorded in supabase_migrations.schema_migrations once applied, so it will not
-- re-run, and editing a recorded migration breaks its content-hash binding.
--
-- Reversal is mechanically possible because the marker this file guards on,
-- `(select provider from parsed)`, SURVIVES the patch -- it moves into the
-- `select ... into v_inserted, v_collect_provider` statement rather than being
-- deleted -- so a reverse patch is not blocked by the guard above. Verified on a
-- local PostgreSQL 16 cluster.
--
-- No data is written and no schema object is created or dropped; the only effect
-- is the text of one function body.

do $do$
declare
  v_def text;
  v_old text;
  v_new text;
begin
  select pg_get_functiondef('public.run_signal_counterparty_extraction()'::regprocedure) into v_def;

  if position('(select provider from parsed)' in v_def) = 0 then
    -- Not the drifted production body. The ONLY acceptable no-op is the committed
    -- repository body, whose collect-phase return carries no `provider` key and
    -- therefore has no out-of-scope CTE reference. Verify that positively rather
    -- than treating every marker-free body as known-good: a body edited again
    -- out-of-band, or one carrying the same defect with different whitespace or
    -- capitalization, must NOT be silently recorded as applied while the cron
    -- stays broken.
    if position($ok$    return jsonb_build_object('ok', true, 'phase', 'collect', 'counterparties_touched', coalesce(v_inserted,0));$ok$ in v_def) = 0 then
      raise exception 'counterparty extraction CTE-scope fix: unrecognized function body -- it is neither the drifted production body nor the committed repository body, so this migration refuses to record itself as applied. Inspect pg_get_functiondef(''public.run_signal_counterparty_extraction()''::regprocedure) and reconcile before retrying.';
    end if;
    raise notice 'run_signal_counterparty_extraction: committed repository body confirmed; collect-phase return has no out-of-scope CTE reference; nothing to fix';
    return;
  end if;

  -- 1. Declare the variable that carries the provider out of the CTE statement.
  v_old := $old$  v_provider text; v_attempts int; v_failures int;$old$;
  v_new := $new$  v_provider text; v_attempts int; v_failures int;
  v_collect_provider text;$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty extraction CTE-scope fix: declare anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  -- 2. Resolve `parsed` while it is still in scope, and return the variable.
  v_old := $old$    select count(*) from ins into v_inserted;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', (select provider from parsed), 'counterparties_touched', coalesce(v_inserted,0));$old$;
  v_new := $new$    select (select count(*) from ins), (select provider from parsed)
      into v_inserted, v_collect_provider;

    return jsonb_build_object('ok', true, 'phase', 'collect', 'provider', v_collect_provider, 'counterparties_touched', coalesce(v_inserted,0));$new$;
  if position(v_old in v_def) = 0 then
    raise exception 'counterparty extraction CTE-scope fix: collect-phase return anchor not found';
  end if;
  v_def := replace(v_def, v_old, v_new);

  execute v_def;
end;
$do$;
