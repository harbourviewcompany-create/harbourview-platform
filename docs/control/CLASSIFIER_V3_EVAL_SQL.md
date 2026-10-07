# Classifier v3 — stratified eval SQL

Use after deploying `hv-classify` v3 and running:

```json
{ "mode": "eval", "runId": "v3-gate-2026-10-07", "limit": 250 }
```

Replace `:run_id` with your actual `runId`. Score **stratified** rows separately from `live_correction`.

## 1. Prediction coverage for this run

```sql
select
  count(*) as predictions,
  count(*) filter (where quality_label = 'signal') as pred_signal,
  count(*) filter (where quality_label is distinct from 'signal') as pred_non_signal
from public.intel_eval_predictions
where run_id = :run_id;
```

## 2. Headline gate metrics (stratified only)

```sql
with truth as (
  select
    e.signal_id,
    e.quality_label as truth_label,
    e.sample_stratum
  from public.intel_eval_set e
  where e.label_status in ('confirmed', 'corrected')
    and coalesce(e.sample_stratum, '') is distinct from 'live_correction'
),
pred as (
  select
    p.signal_id,
    p.quality_label as pred_label
  from public.intel_eval_predictions p
  where p.run_id = :run_id
),
joined as (
  select
    t.signal_id,
    t.truth_label,
    p.pred_label,
    (t.truth_label = 'signal') as truth_pos,
    (p.pred_label = 'signal') as pred_pos
  from truth t
  join pred p on p.signal_id = t.signal_id
)
select
  count(*) as n_eval_rows,
  count(*) filter (where truth_pos and pred_pos) as tp,
  count(*) filter (where not truth_pos and pred_pos) as fp,
  count(*) filter (where truth_pos and not pred_pos) as fn,
  count(*) filter (where not truth_pos and not pred_pos) as tn,
  round(
    count(*) filter (where truth_pos and pred_pos)::numeric
    / nullif(count(*) filter (where pred_pos), 0),
    3
  ) as signal_precision,
  round(
    count(*) filter (where truth_pos and pred_pos)::numeric
    / nullif(count(*) filter (where truth_pos), 0),
    3
  ) as signal_recall
from joined;
```

## 3. Live-correction stratum (report only — do not use as sole gate number)

```sql
with truth as (
  select e.signal_id, e.quality_label as truth_label
  from public.intel_eval_set e
  where e.label_status in ('confirmed', 'corrected')
    and e.sample_stratum = 'live_correction'
),
pred as (
  select p.signal_id, p.quality_label as pred_label
  from public.intel_eval_predictions p
  where p.run_id = :run_id
)
select
  count(*) as n_live_correction,
  count(*) filter (where t.truth_label = 'signal' and p.pred_label = 'signal') as tp,
  count(*) filter (where t.truth_label is distinct from 'signal' and p.pred_label = 'signal') as fp,
  count(*) filter (where t.truth_label = 'signal' and p.pred_label is distinct from 'signal') as fn
from truth t
join pred p on p.signal_id = t.signal_id;
```

## 4. Content-type agreement on true signals (v3-specific check)

```sql
with truth as (
  select e.signal_id, e.quality_label, e.content_type as truth_ct
  from public.intel_eval_set e
  where e.label_status in ('confirmed', 'corrected')
    and coalesce(e.sample_stratum, '') is distinct from 'live_correction'
    and e.quality_label = 'signal'
),
pred as (
  select p.signal_id, p.quality_label as pred_label, p.content_type as pred_ct
  from public.intel_eval_predictions p
  where p.run_id = :run_id
)
select
  count(*) as n_true_signals_scored,
  count(*) filter (where p.pred_label = 'signal') as pred_also_signal,
  count(*) filter (where p.pred_label = 'signal' and p.pred_ct = t.truth_ct) as content_type_match,
  round(
    count(*) filter (where p.pred_label = 'signal' and p.pred_ct = t.truth_ct)::numeric
    / nullif(count(*) filter (where p.pred_label = 'signal'), 0),
    3
  ) as content_type_accuracy_among_tp
from truth t
join pred p on p.signal_id = t.signal_id;
```

## 5. Write metrics (gate still closed)

```sql
update public.classifier_validation
set
  validated_at = now(),
  n_eval_rows = <n_eval_rows from query 2>,
  signal_precision = <signal_precision>,
  signal_recall = <signal_recall>,
  notes = notes || format(
    ' | eval run_id=%s stratified; P=%s R=%s; gate still closed',
    :run_id,
    <signal_precision>,
    <signal_recall>
  )
where classifier_version = 'hv-classify/openai/v3-content-type-strict'
returning classifier_version, gate_passed, n_eval_rows, signal_precision, signal_recall;
```

## 6. Would-promote volume if gate opened (read-only)

```sql
select count(*) as would_auto_promote
from public.signals s
where s.quality_label = 'signal'
  and coalesce(s.is_representative, true)
  and s.quality_confidence >= 0.80
  and s.reviewed is distinct from true
  and (s.reviewed_by is null or s.reviewed_by not like 'human:%')
  and s.classifier_version = 'hv-classify/openai/v3-content-type-strict'
  and not exists (
    select 1 from public.hv_signal_review_queue q
    where q.signal_id = s.id and q.status in ('pending', 'rejected', 'skipped')
  );
```

## 7. Owner open (only after accepting the bar)

```sql
update public.classifier_validation
set
  gate_passed = true,
  validated_at = now(),
  notes = notes || ' | OPENED by <owner> on <date>; stratified bar accepted'
where classifier_version = 'hv-classify/openai/v3-content-type-strict'
  and gate_passed = false
returning *;
```
