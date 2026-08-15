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
-- version 20260720023051.
--
-- Rewriting this file cannot affect production: 20260720023051 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

-- One pipeline tick: harvest prior async work, dispatch next batches. (Stage 5 "conductor", minimal.)
create or replace function public.hv_pipeline_tick()
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_tr_h int; v_cl_h int; v_em_h int; v_cl_d int; v_tr_d int; v_em_d int := 0; v_ids text[];
begin
  -- 1) harvest anything the previous tick dispatched
  v_tr_h := public.hv_translate_harvest();
  v_cl_h := public.hv_classify_corpus_harvest();
  v_em_h := public.hv_embed_harvest();

  -- 2) dispatch next batches (bounded per tick for rate/cost)
  v_tr_d := public.hv_translate_dispatch(40, false);        -- translate non-English before classify
  v_cl_d := public.hv_classify_corpus_dispatch(120, 400);   -- classify unclassified, freshest first

  -- 3) embed ONLY promotable signals (dedup only needs signal-vs-signal)
  select array_agg(id) into v_ids from (
    select s.id from public.signals s
    where s.quality_label = 'signal' and s.embedding_1024 is null
    order by s.created_at desc limit 100
  ) q;
  if v_ids is not null then
    perform public.hv_embed_dispatch(v_ids);
    v_em_d := array_length(v_ids,1);
  end if;

  return jsonb_build_object('translate_harvested',v_tr_h,'classify_harvested',v_cl_h,'embed_harvested',v_em_h,
                            'translate_dispatched',v_tr_d,'classify_dispatched',v_cl_d,'embed_dispatched',v_em_d);
end$fn$;

-- Slower tick: dedup among embedded signals + promote representatives. Idempotent & safe.
create or replace function public.hv_quality_promote_tick()
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_dd int; v_pr int;
begin
  v_dd := public.hv_dedup_assign(0.90, 400);
  v_pr := public.hv_promote_signals(0.0);
  return jsonb_build_object('deduped',v_dd,'promoted',v_pr);
end$fn$;
