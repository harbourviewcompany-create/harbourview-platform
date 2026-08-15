-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260723084824.
--
-- Rewriting this file cannot affect production: 20260723084824 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- Stage G (docs/INTELLIGENCE_ARCHITECTURE_SPEC.md Section 8), partial: an
-- on-demand health-check function for the hv_* pipeline and the two
-- previously-dangerous crons. This is NOT a new cron -- it adds no
-- always-on automation, so it cannot reproduce the disk-IO incidents.
-- Deliberately scoped down from "active alerting" (push notification on
-- a schedule) to "checkable state" because true push alerting needs a
-- delivery channel decision (email vs Slack vs something else) that's
-- Tyler's to make, not mine to assume. Call this manually, or wire it to
-- a low-frequency cron (e.g. hourly) once that channel decision is made.

create or replace function public.hv_pipeline_health()
returns table(metric text, value text, note text)
language sql
security definer
set search_path to 'public'
as $function$
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
              then 'ACTIVE -- was this re-enabled intentionally? See 20260722210000_baseline_hv_intelligence_pipeline.sql warning.'
              else 'ok (unscheduled, expected until Stage E/J land)' end
  union all
  select 'hv_quality_promote_cron', coalesce((select active::text from cron.job where jobname = 'hv-quality-promote'), 'unscheduled'),
         case when exists (select 1 from cron.job where jobname = 'hv-quality-promote' and active)
              then 'ACTIVE -- promotion is gated on Stage J explicit sign-off, confirm this was intentional'
              else 'ok (inactive, expected until Stage J sign-off)' end
  union all
  select 'classifier_gate_hv_v1', coalesce((select gate_passed::text from public.classifier_validation where classifier_version = 'hv-classify/openai/v1'), 'no_row'),
         case when coalesce((select gate_passed from public.classifier_validation where classifier_version = 'hv-classify/openai/v1'), false)
              then 'ok' else 'gate closed -- expected until Tyler decides on the 0.559 recall question' end;
$function$;

revoke all on function public.hv_pipeline_health() from public, anon, authenticated;
