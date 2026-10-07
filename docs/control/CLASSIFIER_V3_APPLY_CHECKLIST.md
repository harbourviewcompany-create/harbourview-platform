# Classifier v3 — production apply checklist

**Branch:** `feat/classifier-v3-content-type-strict`  
**Version:** `hv-classify/openai/v3-content-type-strict`  
**Gate on apply:** CLOSED (`gate_passed = false`)

Do not flip the gate in the same change as the apply.

## Pre-merge

- [ ] PR reviewed (migration + edge function + docs)
- [ ] Diff confirms harvest stamp is only the v3 string
- [ ] Diff confirms `gate_passed` is not set true in SQL
- [ ] `hv_promote_signals` body is **not** modified by this branch

## Open PR (if not already)

https://github.com/harbourviewcompany-create/harbourview-platform/compare/main...feat/classifier-v3-content-type-strict?expand=1

## After merge — apply

### 1. Migration

```bash
# Linked project only; migration-aware tooling preferred
supabase db push --linked --include-all
```

Or ensure version `20261007180000` is applied and recorded in
`supabase_migrations.schema_migrations`.

### 2. Edge function

```bash
supabase functions deploy hv-classify --project-ref <ref>
```

### 3. Structural proofs (service role / SQL)

```sql
-- v3 row exists and is CLOSED
select classifier_version, gate_passed, n_eval_rows, signal_precision, signal_recall
from public.classifier_validation
where classifier_version = 'hv-classify/openai/v3-content-type-strict';
-- expect: gate_passed = false

select public.hv_classifier_versions_snapshot();

-- harvest stamps v3
select pg_get_functiondef('public.hv_classify_corpus_harvest()'::regprocedure)
  like '%v3-content-type-strict%' as harvest_stamps_v3;

-- promote still requires gate (unchanged by this work)
select pg_get_functiondef('public.hv_promote_signals(numeric)'::regprocedure)
  like '%gate_passed%' as promote_still_gated;
```

### 4. Smoke classify (single)

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/hv-classify" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":{"headline":"Health Canada issues new cannabis licence","summary":""}}'
```

Expect JSON with `quality_label`, `content_type`, `impact`, `confidence`.

### 5. Eval run

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/hv-classify" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode":"eval","runId":"v3-gate-2026-10-07","limit":250}'
```

Score with `docs/control/CLASSIFIER_V3_EVAL_SQL.md` (stratified only).

### 6. Record metrics — still closed

```sql
update public.classifier_validation
set
  validated_at = now(),
  n_eval_rows = <n>,
  signal_precision = <p>,
  signal_recall = <r>,
  notes = notes || ' | eval run_id=v3-gate-2026-10-07 stratified; gate still closed'
where classifier_version = 'hv-classify/openai/v3-content-type-strict'
returning *;
```

### 7. Volume check before any gate open

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
    where q.signal_id = s.id and q.status in ('pending','rejected','skipped')
  );
```

### 8. Owner gate flip (separate decision)

Only after accepting precision/recall bar:

```sql
update public.classifier_validation
set gate_passed = true,
    validated_at = now(),
    notes = notes || ' | OPENED by <owner> on <date>'
where classifier_version = 'hv-classify/openai/v3-content-type-strict'
  and gate_passed = false
returning *;
```

Then:

```sql
select public.hv_promote_signals(0.80);
-- sample feed; then consider promote cron restore under Nano cadence rules
```

## Emergency close

```sql
update public.classifier_validation
set gate_passed = false,
    notes = notes || ' | CLOSED <ts> reason: <incident>'
where classifier_version = 'hv-classify/openai/v3-content-type-strict';
```

## Related docs

- `docs/control/CLASSIFIER_V3_CONTENT_TYPE_STRICT.md` — version semantics
- `docs/control/CLASSIFIER_V3_EVAL_SQL.md` — stratified scoring queries
- `docs/control/INTEL_PIPELINE_P0_P2_LIVE_RUNBOOK.md` — pause/drain/cron discipline
