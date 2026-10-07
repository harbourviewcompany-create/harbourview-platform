# Classifier v3 — `hv-classify/openai/v3-content-type-strict`

**Status:** Branch package only. Gate **closed** until stratified eval + owner flip.  
**Created:** 2026-10-07  
**Baseline:** `hv-classify/openai/v2-summary-fix`

## What changed vs v2

| Layer | Change |
|-------|--------|
| **Prompt** | Stricter `content_type` (regulatory > market > story > research); clearer impact bands; high-value actor/action cues |
| **Input formatting** | Unchanged (`bodyIsRedundant` / judge headline alone) |
| **Harvest stamp** | `classifier_version = 'hv-classify/openai/v3-content-type-strict'` |
| **Gate** | New `classifier_validation` row with **`gate_passed = false`** |
| **Promote floor** | Unchanged (hard ≥ 0.80 auto) |

## Files

- `supabase/migrations/20261007180000_classifier_v3_content_type_strict.sql`
- `supabase/functions/hv-classify/index.ts`
- This runbook

## Deploy order (mandatory)

1. Apply migration `20261007180000` (validation row closed + harvest stamp).
2. Deploy `hv-classify` edge function from this branch.
3. Optional: pause `hv-quality-promote` if volume risk is a concern.
4. Eval: `{"mode":"eval","runId":"v3-gate-YYYY-MM-DD","limit":250}`.
5. Score stratified `intel_eval_set` → `UPDATE classifier_validation` metrics (**still** `gate_passed=false`).
6. Owner: `gate_passed = true` with notes.
7. Manual `select public.hv_promote_signals(0.80);` + feed sample.
8. Restore promote cron only after smoke.

## Verify after migration

```sql
select classifier_version, gate_passed, n_eval_rows, signal_precision, signal_recall
from public.classifier_validation
order by validated_at desc;

select public.hv_classifier_versions_snapshot();
```

## Record metrics (still closed)

```sql
update public.classifier_validation
set
  validated_at = now(),
  n_eval_rows = <n>,
  signal_precision = <p>,
  signal_recall = <r>,
  notes = notes || ' | eval run_id=v3-gate-... stratified; gate still closed'
where classifier_version = 'hv-classify/openai/v3-content-type-strict';
```

## Owner open

```sql
update public.classifier_validation
set
  gate_passed = true,
  validated_at = now(),
  notes = notes || ' | OPENED by <owner> on <date>; run_id=...; bar accepted'
where classifier_version = 'hv-classify/openai/v3-content-type-strict'
  and gate_passed = false
returning *;
```

## Emergency close

```sql
update public.classifier_validation
set
  gate_passed = false,
  notes = notes || ' | CLOSED <ts> reason: <incident>'
where classifier_version = 'hv-classify/openai/v3-content-type-strict';
```

Does not un-publish already `reviewed=true` rows.

## Out of scope

- Flipping `gate_passed` in this PR
- Changing the 0.80 promote floor
- Wiring `content_type` into `hv_promote_signals` / feed routing
- Re-enabling Nano quality crons
