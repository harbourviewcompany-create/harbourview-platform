-- Two fixes discovered while reviewing the classifier-gate decision from PR #1215:\n--\n-- 1. hv_pipeline_health() previously hardcoded the classifier_version string it checked\n--    ('hv-classify/openai/v1'), so it silently went stale the moment the code moved to\n--    v2-summary-fix without this function being updated to match -- exactly the kind of\n--    drift this function exists to catch. First attempt at fixing it inferred the live\n--    version from signals.created_at, which is promotion time, not classification time,\n--    and gave a wrong answer under real backlog conditions. Fixed properly: reads the most\n--    recently validated row in classifier_validation directly.\n--\n-- 2. The v1 row's notes (from PR #1215, this same session) said "ship as-is, accept 0.559\n--    recall" -- which was accurate at the time but became misleading once it was confirmed\n--    that v2-summary-fix (recall 0.903, already Tyler-approved) is what actually runs in\n--    production. Appended a correction rather than editing the original text out --\n--    history stays visible.\n--\n-- Applied directly to production via Supabase MCP; committed here per\n-- docs/control/CONCURRENT_SESSION_COORDINATION.md (same-turn convention).\n\nCREATE OR REPLACE FUNCTION public.hv_pipeline_health()
 RETURNS TABLE(metric text, value text, note text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select 'unharvested_classify_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_classify_corpus_harvest is running' else 'ok' end
  from public.hv_classify_jobs where not harvested
  union all
  select 'unharvested_embed_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_embed_harvest is running' else 'ok' end
  from public.hv_embed_jobs where not harvested
  union all
  select 'unharvested_translation_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_translate_harvest is running' else 'ok' end
  from public.hv_translation_jobs where not harvested
  union all
  select 'unharvested_entity_jobs', count(*)::text,
         case when count(*) > 200 then 'backlog building -- check hv_entities_harvest is running' else 'ok' end
  from public.hv_entity_jobs where not harvested
  union all
  select 'hv_quality_pipeline_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-pipeline'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-pipeline' and active)
              then 'ok (expected -- classifier shipped 2026-07-29/30; see classifier_validation.notes)'
              else 'ok (unscheduled, expected until Stage E/J land)' end
  union all
  select 'hv_quality_promote_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-promote'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-promote' and active)
              then 'ok (expected -- promotion gate passed 2026-07-29/30; see classifier_validation.notes)'
              else 'ok (inactive, expected until Stage J sign-off)' end
  union all
  -- Note: this reads the MOST RECENTLY VALIDATED row in classifier_validation
  -- (by validated_at, not by inferring from signals data -- signals.created_at
  -- is promotion time, not classification time, and can't be trusted to say
  -- which classifier_version is currently live; verified that the hard way).
  -- Whoever validates a new classifier version is responsible for inserting a
  -- new row here; this metric will then pick it up automatically.
  select 'classifier_gate_' || coalesce(cv.classifier_version, 'unknown'),
         coalesce(cv.gate_passed::text, 'no_row'),
         case when coalesce(cv.gate_passed, false)
              then 'ok (recall ' || coalesce(cv.signal_recall::text,'?') || ', precision ' || coalesce(cv.signal_precision::text,'?') || ', n=' || coalesce(cv.n_eval_rows::text,'?') || ', validated ' || coalesce(cv.validated_at::date::text,'?') || ' -- re-validate against a larger eval set periodically, not a one-time decision)'
              else 'gate closed for the most recently validated classifier version -- check classifier_validation.notes before promotion runs unattended' end
  from (select * from public.classifier_validation order by validated_at desc limit 1) cv;
$function$


UPDATE public.classifier_validation
SET notes = notes || E'\n\nCorrection (2026-07-30, same session): the "ship as-is, accept the gap" framing above was based on stale information -- this v1 row was not the live classifier. hv_classify_corpus_harvest() already writes classifier_version = ''hv-classify/openai/v2-summary-fix'' (see that row), which independently root-caused and fixed the recall gap (0.559 -> 0.903) rather than accepting it, and was already approved by Tyler on 2026-07-30. gate_passed left as true here since the decision to enable the crons was still correct -- just not for the reason originally recorded.'
WHERE classifier_version = 'hv-classify/openai/v1';