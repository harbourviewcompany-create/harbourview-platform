-- Stamp classifier output with hv-classify/openai/v2-summary-fix
--
-- Pairs with edge function `hv-classify` v14 (see supabase/functions/hv-classify/index.ts).
--
-- WHY
-- ---
-- `hv_promote_signals` refuses to promote unless `classifier_validation` holds a
-- `gate_passed = true` row for the signal's `classifier_version` (Stage C, spec
-- Section 8). Shipping a new prompt without bumping the version would leave the
-- v1 row — recall 0.559 — describing a classifier that no longer exists. Bumping
-- the version without first inserting a matching validation row would silently
-- halt promotion.
--
-- Order of operations actually used on 2026-07-30, deliberately:
--   1. insert classifier_validation row for 'hv-classify/openai/v2-summary-fix'
--      (n_eval_rows 181, signal_precision 1.000, signal_recall 0.903, gate_passed true)
--   2. deploy hv-classify v14
--   3. apply this migration
-- so no row was ever classified under a version lacking a gate row.
--
-- MEASURED (same 181-row cohort, same hand labels, same duplicate-folding
-- methodology as api.intel_eval_scoring; run_ids 'v1-smoke' vs 'v2-summary-fix'):
--
--            precision   recall     TP    FP    FN
--   v1        1.000      0.559      81     0    64
--   v2        1.000      0.903     131     0    14
--
--   stratified recall:  English 0.723 -> 0.936 · non-English 0.480 -> 0.888
--
-- Live confirmation after deploy: rows stamped v2 were judged `signal` 69.8% of
-- the time vs 55.4% under v1, and `hv_quality_promote_tick()` continued to
-- promote (gate accepted the new version).
--
-- ROLLBACK
-- --------
-- Redeploy hv-classify v13 and revert this constant to 'hv-classify/openai/v1'.
-- That version's classifier_validation row is retained precisely so rollback
-- lands in a gated, promotable state with no gap. Rows already stamped v2 keep
-- their labels; they remain promotable because the v2 validation row is retained
-- too.

create or replace function public.hv_classify_corpus_harvest()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r record; v_c jsonb; n int:=0;
begin
  for r in
    select j.request_id, j.signal_id, resp.status_code, resp.content
    from public.hv_classify_jobs j join net._http_response resp on resp.id=j.request_id
    where not j.harvested
  loop
    if r.status_code=200 then
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
          n:=n+1;
        end if;
      exception when others then null;
      end;
    end if;
    update public.hv_classify_jobs set harvested=true where request_id=r.request_id;
  end loop;
  return n;
end$function$;

comment on function public.hv_classify_corpus_harvest() is
  'Harvests hv-classify responses into signals.{quality_label,content_type,impact,quality_confidence}. '
  'Stamps classifier_version = hv-classify/openai/v2-summary-fix (edge fn v14). That version has a '
  'gate_passed=true row in classifier_validation (n=181, precision 1.000, recall 0.903); hv_promote_signals '
  'will refuse to promote any version lacking one.';
