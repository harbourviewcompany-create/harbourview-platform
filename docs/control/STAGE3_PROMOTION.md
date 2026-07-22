# Stage 3 — Correct Promotion Path

Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` Stage 3. Replaces score-driven publishing
with promotion driven by the **validated Stage 2 classifier**.

## Status (rewritten 2026-07-22 — supersedes the 2026-07-15 version of this doc)

The 2026-07-15 version of this document described a promotion path
(`signal_classifications` + `api.promote_classified_signals`) as the intended Stage 3
implementation and stated "nothing applied live." That was accurate on 2026-07-15, but a
**second, undocumented pipeline was built and is the one that actually ran in
production** on 2026-07-20. This rewrite documents what is actually live, per
`INTELLIGENCE_ARCHITECTURE_SPEC.md` guardrail #1 ("verify the actual consumer/writer of
any table, view, or function before changing it") — discovered by querying live
`pg_proc` definitions and `cron.job`, not by trusting this file.

**This is itself an instance of spec Section 2.1's "two disconnected estates" problem,
recurring one layer deeper than originally diagnosed — two independently-built
classify→promote systems, not two disconnected source registries.**

## What promotion actually is here (verified live, 2026-07-22)

- `promote_snapshot_to_signals()` (via `promote_all_extracted_snapshots()`, cron
  `source-engine-daily-promote`, active daily 07:00) stages fresh snapshots into
  `public.signals` with `reviewed = false`. This part is unchanged and still runs daily.
- The live Intel feed reads `signals?reviewed=eq.true` (`lib/regulatory-signals/public.ts`).
- Promotion = deciding which `reviewed=false` rows become `reviewed=true`. Two separate
  mechanisms exist for that decision:

### Pipeline A — documented, not wired to live promotion

- `public.signal_classifications` (staging table) populated by `hv-classify`'s `pool`
  mode (synchronous, one HTTP call per row via `supabase.rpc`). This mode is real code
  that can still write here if invoked — "unused" below means "not on any promotion
  path or cron schedule," not "has no producer" or "is safe to assume empty."
- `api.promote_classified_signals(p_min_confidence=0.65, p_dry_run=true, p_limit=500)` —
  requires `editorial_title` set, source tier in `gov`/`press`, `date` within 30 days.
  Dry-run by default.
- Verified state: `signal_classifications` holds 929 real rows, all from a single test
  window (2026-07-19 to 2026-07-20) — these are live staged data, not placeholder rows.
  No evidence `promote_classified_signals` was ever invoked with `p_dry_run => false` —
  its output signature (`action = 'Promoted by classifier (Stage 3)'`, no `reviewed_by`
  write) does not match any row in `signals`.
- **Status: not wired to live promotion or cron automation — the 929 staged rows remain
  and pool mode could still populate more if someone invokes it directly. Deprecated via
  `COMMENT ON` (not dropped) in `20260722021600_deprecate_unused_stage3_pipeline_a.sql`,
  narrowly worded to "not the production promotion path," not "has never been used or
  written to." See Owner decisions.**

### Pipeline B — undocumented until this rewrite, the one actually used
- `hv_classify_corpus_dispatch(p_limit, p_scope_days)` / `hv_classify_corpus_harvest()` —
  async version of the same `hv-classify` edge function (dispatch via `net.http_post`,
  harvest via `net._http_response`), writing classifier output **directly onto
  `public.signals`**: `quality_label`, `content_type`, `impact`, `quality_confidence`,
  `classifier_version`. This is the source of the ~8,700 classified rows on `signals`,
  not `signal_classifications`.
- `hv_translate_dispatch` / `hv_translate_harvest` — translation, same dispatch/harvest
  pattern.
- `hv_embed_dispatch` / `hv_embed_harvest` — embeddings for `quality_label='signal'` rows
  missing `embedding_1024`.
- `hv_dedup_assign(p_threshold=0.90, p_limit)` — clustering/dedup.
- `hv_promote_signals(p_min_conf)` — promotes `quality_label='signal'` rows above the
  confidence floor, excluding `excluded_source_domains` (a 12-row domain blocklist) and
  any `reviewed_by like 'human:%'` row. Sets `reviewed=true, reviewed_by='auto:v1',
  reviewed_at=now()`. **Promotion-only invariant intact** — the `WHERE` clause only ever
  flips `false -> true`, matching guardrail #3.
- `hv_pipeline_tick()` and `hv_quality_promote_tick()` chain the above. Both corresponding
  crons (`hv-quality-pipeline` */2min, `hv-quality-promote` */10min) were inactive as of
  the initial 2026-07-22 rewrite of this document; **both are now ACTIVE as of later the
  same day** — see Owner decisions below, "Enabling continuous automation — RESOLVED."
  (This sentence is intentionally kept as a historical note of the pre-activation state;
  do not read anything in this "Pipeline B" section as reflecting current cron status —
  Owner decisions is the current-state source of truth.)
- **Verified live run:** `hv_promote_signals` (almost certainly via a manual call to
  `hv_quality_promote_tick()` or directly) executed once, 2026-07-20 02:24–13:50 UTC,
  promoting 1,102 rows. At the time, the tick's hardcoded call was
  `hv_promote_signals(0.0)` — **no confidence floor was actually enforced**, only
  `quality_label='signal'`. It happened not to matter (all 1,102 promoted rows carry
  `quality_confidence >= 0.8`, avg 0.856) but that was incidental, not designed-in safety
  — a direct conflict with spec guardrail #2. **Fixed** in
  `20260722020100_hv_quality_promote_explicit_confidence_floor.sql` — default and
  call-site floor now 0.65, matching Pipeline A's original proposed value.
- **Known output gap:** 919 of the 1,102 promoted rows (83%) have no `editorial_title` —
  they are live on the public feed showing raw scraped headlines, not the cleaned
  editorial titles `rows_needing_titles`/`apply_editorial_title` exist to produce.

## Owner decisions (spec §10) — resolved 2026-07-22, except the title backfill

- **Which pipeline is canonical — RESOLVED.** Pipeline B (`hv_classify_corpus_*` /
  `hv_promote_signals` / `hv_dedup_assign`) confirmed canonical by Tyler 2026-07-22.
  Pipeline A (`signal_classifications` / `api.promote_classified_signals`) marked
  deprecated via `COMMENT ON` in
  `20260722021600_deprecate_unused_stage3_pipeline_a.sql` — not dropped, no data
  touched, fully reversible, just carries a "do not use" marker now.
- **Enabling continuous automation — RESOLVED, now ON.** Both `hv-quality-pipeline`
  (jobid 47, */2min) and `hv-quality-promote` (jobid 48, */10min) were activated
  2026-07-22 via `20260722021500_enable_hv_quality_pipeline_and_promote_crons.sql`.
  The live public feed now gets written continuously and unattended on this schedule.
  Monitor `cron.job_run_details` for the first several runs.
- **Confidence threshold value.** Set to 0.65 (2026-07-22 fix, matching the
  never-applied Pipeline A default). Revisit against real eval-set precision/recall data
  if/when Stage 0's `intel_eval_set` labeling work happens — 0.65 is a carried-over
  proposal, not a freshly validated number.
- **Editorial title backfill — STILL OPEN, blocked on tooling, not on decision.**
  Tyler approved running this 2026-07-22. While scoping it, found `api.rows_needing_titles`
  was still joined against the deprecated Pipeline A staging table and could only reach 9
  of 919 target rows — fixed in `20260722021700_fix_rows_needing_titles_pipeline_b.sql`
  to match `signals.quality_label` directly (now correctly reaches the full pool: 904 live
  promoted rows missing a title, plus a separately-discovered 3,519-row unpromoted-backlog
  population also missing titles — the backlog was NOT part of what was approved and
  hasn't been run). The RPC fix is live and verified; the actual title-generation calls
  (`hv-classify` in `mode=titles`, which calls paid LLM providers) were **blocked by the
  Claude Code Auto Mode classifier** on every attempt (consistently, not transiently) when
  invoked via `curl` — no MCP tool exists to invoke an edge function directly, and routing
  around the block via `net.http_post` from SQL was deliberately not attempted, since it's
  the same paid-API-spend action through a different door. **Needs Tyler to either run it
  directly or grant the specific permission.** Command, once permitted (16 calls covers
  the originally-approved ~919-row scope; each call processes up to 60 rows):
  ```bash
  curl -X POST "https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/hv-classify" \
    -H "Authorization: Bearer <anon key, via get_publishable_keys>" \
    -H "Content-Type: application/json" \
    -d '{"mode":"titles","limit":60}'
  ```
  Repeat until the response's `requested` field is 0. Estimated cost: low single-digit
  dollars at most for the full ~4,400-row pool (gpt-4o-mini per `CLASSIFY_PROVIDER_ORDER`),
  a small fraction of that for the originally-approved ~919-row scope.

## Rollback

Pipeline A (if abandoned): `drop function api.promote_classified_signals(numeric,boolean,int); drop table public.signal_classifications;` — **this is destructive, not zero-blast-radius**: `signal_classifications` holds 929 real rows (see Pipeline A above) and the drop would delete them permanently and could break any remaining pool-mode or ad-hoc test consumer that still reads or writes that table. Do not run without first taking a snapshot (`create table public.signal_classifications_backup_<date> as select * from public.signal_classifications;` or equivalent) and confirming via grep/logs that nothing currently depends on it. Not currently planned — Pipeline A is deprecated-in-place (comment marker only), not scheduled for removal.

Pipeline B confidence-floor fix: see `20260722020100_hv_quality_promote_explicit_confidence_floor.sql`, hardened further in `20260722022000_hv_promote_signals_structural_confidence_floor.sql` (closes a NULL-confidence auto-promotion gap and prevents callers from passing a floor below 0.65).

RPC grant hardening: see `20260722020000_harden_signal_review_rpc_grants_revoke_public.sql`.

Cron activation: see `20260722021500_enable_hv_quality_pipeline_and_promote_crons.sql` (rewritten 2026-07-22 to resolve jobs by name instead of hardcoded IDs — see that file's header).

`rows_needing_titles` promoted-only scope: see `20260722022100_rows_needing_titles_promoted_only.sql`.
