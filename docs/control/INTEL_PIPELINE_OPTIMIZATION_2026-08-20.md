# Intelligence Pipeline Optimization — 2026-08-20

**Status:** Repaired implementation on PR #1598; repository-only and not production-applied.
**Migrations:** `20260820130000_hv_pipeline_optimization.sql`, then `20260820131000_hv_review_queue_resolve.sql`
**Registry impact:** Adds internal review, pre-filter-disposition and stage-log objects only after an approved database apply. No public route or DTO change.

## Objective

Reduce avoidable classifier calls without weakening the Pipeline B controls that
were already active at the PR merge-base. Filtered inputs must be measurable,
multilingual relevance must not be silently lost, and a human review decision
must be the final authority over automatic promotion.

## Proposed repository change

1. `hv_prefilter_signal_disposition(...)` returns an explicit, versioned reason:
   eligible, untranslated-non-English fail-open, language-unknown fail-open,
   too-short, navigation, excluded-domain or low-relevance.
2. `hv_classify_prefilter_dispositions` persists that reason, whether translated
   text was used and an input hash. A later translation changes the hash and
   triggers re-evaluation.
3. `hv_classify_corpus_dispatch` remains the August 14 safe body: it retires
   five failed attempts to `intel_classify_review_queue`, excludes unresolved
   manual-review rows and in-flight jobs, selects before charging, and consumes
   exactly the selected `classify` budget. The pre-filter is added only inside
   that path and receives the same coalesced `title_en`/`summary_en` values sent
   to `hv-classify`.
4. `hv_signal_review_queue` holds borderline signals. The approval and rejection
   RPCs lock a pending row before touching `signals`, update both records in one
   transaction and refuse arbitrary or repeated decisions. Rejection writes a
   human authority marker and automatic promotion also excludes pending,
   rejected and skipped queue states.
5. `hv_promote_signals` retains the matching
   `classifier_validation.gate_passed = true` predicate. There is no fail-open
   evaluation helper.
6. `hv_pipeline_stage_log` records internal classifier/promotion counters.

## Existing implementation deliberately preserved

- `hv_dedup_assign` is not redefined. The authoritative migration remains
  `20260814143000_fix_hv_dedup_assign_search_path.sql`: HNSW
  `ORDER BY <=> LIMIT 25`, 400-row target batch, unassigned-only candidates and
  `search_path = pg_catalog, public, extensions`.
- The canonical index remains `idx_signals_embedding_1024_hnsw`; PR #1598 does
  not create `signals_embedding_1024_hnsw_idx` or any second vector index.
- `hv_pipeline_tick` is not redefined. The authoritative
  `20260730184257_fix_duplicate_dispatch_translate_and_embed.sql` body retains
  the unharvested `hv_embed_jobs` exclusion.
- `hv_classify_corpus_harvest`, `hv_quality_promote_tick` and the August
  dispatch-budget table/function are not replaced.

## Multilingual recall evidence

`tests/sql/pr1598_pipeline_optimization_dry_run.sql` is a PostgreSQL 17 behavior
fixture. Its relevant set covers Spanish, Portuguese, French, German, Thai and
untranslated Japanese. The gate requires all six relevant fixtures to remain
eligible and emits an exact numerator, denominator and recall. This is a
controlled contract set—not a production-corpus measurement—and the PR body
must report the observed run result rather than extrapolate it.

The fixture also proves translated values reach the HTTP request, untranslated
non-English rows fail open, PostgreSQL-compatible navigation boundaries work,
excluded domains match host/subdomain rather than URL substrings, and every
filtered candidate receives a persisted disposition.

## Cron reconciliation

Read-only inspection on 2026-08-20 found the two quality jobs already active:

| Job | Active schedule |
|---|---|
| `hv-quality-pipeline` | `*/30 * * * *` |
| `hv-quality-promote` | `10,40 * * * *` |

Neither migration contains `cron.schedule`, `cron.alter_job`,
`cron.unschedule`, or an update to `cron.job`. The apply checklist captures
pre/post state and requires the schedules to remain unchanged. This PR does not
re-enable, disable or re-cadence either job.

## Data and access boundary

- New tables are internal operational data in the exposed `public` schema, so
  RLS is enabled.
- `anon` and `authenticated` have no privileges.
- `service_role` has read-only table access; queue mutations occur only through
  the service-role-only `SECURITY DEFINER` review RPCs.
- Classifier dispatch and promotion do not gain a new service-role grant.
- No secret, customer PII, source payload or public projection is added.

## Apply and forward-fix boundary

Nothing in this PR applies a migration. A later apply needs explicit owner
approval and must follow
`INTEL_PIPELINE_APPLY_CHECKLIST_2026-08-20.md`.

If a post-apply defect is found, leave cron state unchanged unless a separately
authorized incident action requires otherwise. Forward-fix the affected
function from the exact latest safe source:

- dispatch/harvest: `20260814180000_bound_classify_retries.sql`;
- dedup: `20260814143000_fix_hv_dedup_assign_search_path.sql`;
- pending-embedding tick: `20260730184257_fix_duplicate_dispatch_translate_and_embed.sql`;
- publication gate: `20260723084602_stage_c_classifier_validation_gate.sql`.

Do not restore the July baseline migration: it predates these safety repairs.
The additive internal tables can remain while a forward fix is reviewed.
