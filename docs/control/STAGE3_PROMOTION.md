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

### Pipeline A — documented, effectively unused
- `public.signal_classifications` (staging table) populated by `hv-classify`'s `pool`
  mode (synchronous, one HTTP call per row via `supabase.rpc`).
- `api.promote_classified_signals(p_min_confidence=0.65, p_dry_run=true, p_limit=500)` —
  requires `editorial_title` set, source tier in `gov`/`press`, `date` within 30 days.
  Dry-run by default.
- Verified state: `signal_classifications` holds only 929 rows, all from a single test
  window (2026-07-19 to 2026-07-20). No evidence `promote_classified_signals` was ever
  invoked with `p_dry_run => false` — its output signature (`action = 'Promoted by
  classifier (Stage 3)'`, no `reviewed_by` write) does not match any row in `signals`.
- **Status: not wired to anything, not the pipeline actually promoting rows. Kept as-is
  for now (not dropped) pending Tyler's confirmation of pipeline B below as canonical —
  see Owner decisions.**

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
  crons (`hv-quality-pipeline` */2min, `hv-quality-promote` */10min) are **INACTIVE**.
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

## Owner decisions (spec §10) — still open, not resolved by this rewrite

- **Which pipeline is canonical.** Recommendation: Pipeline B (`hv_classify_corpus_*` /
  `hv_promote_signals` / `hv_dedup_assign`) — it's the one actually proven in production
  and the more complete one (translate + classify + embed + dedup + promote in one
  chain). If confirmed, Pipeline A (`signal_classifications` /
  `promote_classified_signals`) should be formally deprecated (dropped or left inert with
  a clear "do not use" marker) to remove the duplicate-system risk this rewrite exists to
  document. **Not decided yet — do not drop Pipeline A until Tyler confirms.**
- **Enabling continuous automation.** `hv-quality-pipeline` and `hv-quality-promote`
  remain inactive. Turning them on means the live public feed gets written every 2–10
  minutes without a human in the loop each time — a deliberate go/no-go, not bundled into
  this documentation or the confidence-floor fix.
- **Confidence threshold value.** Set to 0.65 (this rewrite's fix, matching the
  never-applied Pipeline A default). Revisit against real eval-set precision/recall data
  if/when Stage 0's `intel_eval_set` labeling work happens — 0.65 is a carried-over
  proposal, not a freshly validated number.
- **Editorial title backfill for the 919 untitled live rows.** Mechanically ready
  (`rows_needing_titles` + `apply_editorial_title`, already RPC-hardened as of
  2026-07-21/22) but not run — it calls out to paid LLM providers (OpenAI first per
  `CLASSIFY_PROVIDER_ORDER`), so needs an explicit cost-aware go before running, per
  CLAUDE.md's cost-gate rule.

## Rollback

Pipeline A (if abandoned): `drop function api.promote_classified_signals(numeric,boolean,int); drop table public.signal_classifications;` — blast radius: none, not wired, not applied.

Pipeline B confidence-floor fix: see `20260722020100_hv_quality_promote_explicit_confidence_floor.sql`.

RPC grant hardening: see `20260722020000_harden_signal_review_rpc_grants_revoke_public.sql`.
