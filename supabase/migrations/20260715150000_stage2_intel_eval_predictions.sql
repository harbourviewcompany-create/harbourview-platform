-- Stage 2 (INTELLIGENCE_ARCHITECTURE_SPEC.md): the classifier validation harness.
-- Stores hv-classify predictions and grades them against the human-labelled
-- intel_eval_set. VALIDATION ONLY — nothing here touches the promotion path.
-- Additive + reversible. Rollback:
--   drop view if exists api.intel_eval_scoring;
--   drop function if exists api.intel_eval_rows_needing_prediction(text,int);
--   drop table if exists public.intel_eval_predictions;

create table public.intel_eval_predictions (
  id            uuid primary key default gen_random_uuid(),
  run_id        text not null,
  signal_id     text not null references public.signals(id) on delete cascade,
  quality_label text not null check (quality_label in ('signal','boilerplate','spam','nav','duplicate')),
  content_type  text check (content_type in ('regulatory','market','story','research','noise')),
  impact        text check (impact in ('high','medium','low')),
  confidence    double precision,
  reason        text,
  model         text,
  created_at    timestamptz not null default now(),
  unique (run_id, signal_id)
);
alter table public.intel_eval_predictions enable row level security;
comment on table public.intel_eval_predictions is
  'Stage 2: hv-classify outputs, graded against intel_eval_set. Validation only; never drives promotion.';
create index intel_eval_predictions_run_idx on public.intel_eval_predictions (run_id);

-- Rows the classifier still needs to score for a given run (joined to signal text).
create function api.intel_eval_rows_needing_prediction(p_run_id text, p_limit int default 250)
returns table (signal_id text, headline text, summary text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select e.signal_id, s.headline, s.summary
  from public.intel_eval_set e
  join public.signals s on s.id = e.signal_id
  where not exists (
    select 1 from public.intel_eval_predictions p
    where p.run_id = p_run_id and p.signal_id = e.signal_id
  )
  order by e.sample_stratum, e.signal_id
  limit p_limit;
$$;

-- Per-run scoring: prediction vs the operative label. Uses the HUMAN label when the
-- row has been confirmed/corrected; otherwise falls back to the assistant draft and
-- flags the row as provisional so the two are never silently mixed in the headline.
create view api.intel_eval_scoring as
with graded as (
  select
    p.run_id,
    p.signal_id,
    p.quality_label as pred_quality,
    p.content_type  as pred_content,
    case when e.label_status in ('confirmed','corrected') then e.quality_label
         else e.draft_quality_label end as truth_quality,
    case when e.label_status in ('confirmed','corrected') then e.content_type
         else e.draft_content_type end as truth_content,
    (e.label_status in ('confirmed','corrected')) as is_human_truth
  from public.intel_eval_predictions p
  join public.intel_eval_set e on e.signal_id = p.signal_id
)
select
  run_id,
  count(*)                                                  as n,
  count(*) filter (where is_human_truth)                   as n_human_truth,
  -- overall quality-label accuracy
  round(avg((pred_quality = truth_quality)::int)::numeric, 3) as quality_accuracy,
  -- 'signal' precision/recall (the gate metric, spec §6.2)
  count(*) filter (where pred_quality='signal' and truth_quality='signal')            as tp_signal,
  count(*) filter (where pred_quality='signal' and truth_quality<>'signal')           as fp_signal,
  count(*) filter (where pred_quality<>'signal' and truth_quality='signal')           as fn_signal,
  round( (count(*) filter (where pred_quality='signal' and truth_quality='signal'))::numeric
         / nullif(count(*) filter (where pred_quality='signal'),0), 3)                as signal_precision,
  round( (count(*) filter (where pred_quality='signal' and truth_quality='signal'))::numeric
         / nullif(count(*) filter (where truth_quality='signal'),0), 3)               as signal_recall,
  -- content_type accuracy among rows both call a signal
  round(avg((pred_content = truth_content)::int) filter (where truth_quality='signal' and pred_quality='signal')::numeric, 3) as content_type_accuracy_on_signals
from graded
group by run_id;

comment on view api.intel_eval_scoring is
  'Stage 2 gate metrics per classifier run. signal_precision/recall computed on human-truth rows once labelled; provisional against drafts until then. See spec §6.2.';

revoke all on api.intel_eval_scoring from public;
revoke all on function api.intel_eval_rows_needing_prediction(text,int) from public;
grant select on api.intel_eval_scoring to service_role;
grant execute on function api.intel_eval_rows_needing_prediction(text,int) to service_role;
grant select on public.intel_eval_predictions to service_role;
grant insert on public.intel_eval_predictions to service_role;

-- Manual-review terminal fallback: rows no LLM provider could classify land here for
-- a human to label (never silently dropped). Populated by hv-classify.
create table public.intel_classify_review_queue (
  signal_id  text primary key references public.signals(id) on delete cascade,
  headline   text,
  summary    text,
  reason     text,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.intel_classify_review_queue enable row level security;
comment on table public.intel_classify_review_queue is
  'Stage 2 manual-review fallback: signals no LLM provider could classify (all providers failed/exhausted). Human labels these. Populated by hv-classify.';
grant select, insert, update on public.intel_classify_review_queue to service_role;
