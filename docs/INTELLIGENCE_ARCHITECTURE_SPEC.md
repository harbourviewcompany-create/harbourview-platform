# HarbourView Intelligence Ingestion & Scoring — Architecture Spec

**Status:** Draft v2 · **Owner:** Tyler (sole founder) · **Written:** 2026-07-14 · **Revised:** 2026-07-22
**Audience:** Any agent (Claude Code, Codex, etc.) or engineer picking this up cold.
**Target:** Best-in-class as of a 2027 release. Build in verifiable stages, not one pass.

---

## 0. How to use this document

This is a build spec, not a description of what exists. Sections 1–3 are the
**diagnosis** (what's true today, with evidence). Sections 4–7 are the **target
architecture**. Section 8 is the **staged build plan** — each stage is independently
shippable and independently verifiable. Section 9 is the **guardrails** every
contributor must follow, derived from real failures on this codebase.

**The single most important rule (Section 9 expanded):** verify the actual
consumer/writer of any table, view, or function BEFORE changing it, and validate any
scoring/judgment change against a labeled sample BEFORE wiring anything to it. Every
serious defect in this system came from skipping one of those two steps. Do not add to
the list.

**v2 note (2026-07-22):** v1's diagnosis (Sections 1-2) undersold the problem. A
second, fully independent implementation of Stages 0-4 was discovered live in
production the same week this v2 was written — see Section 2.8. v2's job is to stop
that from happening a third time: one canonical pipeline, committed to git, with a
mechanically-enforced quality gate and real alerting. Sections 2.8, 8, and 9 are the
parts that matter most if you're picking this up cold.

---

## 1. Problem statement (what the user actually asked for)

The Intel product must:
1. Pull in **far more** relevant data than it does today.
2. Cover **multiple languages** — international gazettes and press are not in English
   (Spanish, Portuguese, French, German, Thai, etc.). Non-English sources are currently
   invisible or mis-scored.
3. Surface **interesting stories for Digest**, not only regulatory/legislation for
   Signals. It's a multi-surface product; ingestion currently optimizes for one surface.
4. **Amalgamate** the scraping estate. There are too many scrapers running in different
   directions with no coordination. One system, one conductor.
5. Be judged **proprietary and best-in-class** — the moat is the quality brain, not the
   scrapers.

---

## 2. Current-state diagnosis (verified 2026-07-14, with evidence)

### 2.1 Two disconnected scraping estates
- **Marketplace/equipment estate:** `lib/scrapers/` (registry `sources.ts`, ~311 sources).
  Categories are entirely commercial: `business_opportunities` (63), `cannabis_inventory`
  (56), `import_demand` (43), `professional_services` (35), `used_surplus`, etc. **Zero
  regulatory or news sources.**
- **Intelligence estate:** edge functions (`hv-source-pull-runner`, `source-engine-fetch`,
  `source-engine-promote`, `hv-extract`, `hv-score`, `hv-pipeline-orchestrator`) writing to
  the `signals` table via `SOURCE_ENGINE` category, plus `ia_signals` (the cleaned table).
- These two estates **do not know about each other.** This is the "scrapers running in
  different directions" the user named.

### 2.2 Scale of the estate (why it feels chaotic)
- **26 edge functions** under `supabase/functions/` (not all scrapers — includes
  `github-bridge`, diag tools, embed workers, etc., but many are pipeline stages).
- **15 cron routes** under `app/api/cron/` (`scrape`, `intelligence-ingest`,
  `intelligence-extract`, `intelligence-embed`, `regulatory-watch`, `deep-discovery`,
  `synthesize-jurisdictions`, …) **plus a separate, larger set of `pg_cron` jobs living
  directly in Postgres** (see 2.8) that this original count missed entirely.
- **`lib/scrapers/` module**: `fetcher`, `parser`, `normaliser`, `ingestor`, `runner`,
  `deduplication`, `digest`, `sources`, `types`.
- No single orchestrator owns the run. `hv-pipeline-orchestrator` exists but does not
  conduct the whole estate.

### 2.3 No language dimension — at all (partially superseded, see 2.8)
- `grep -ic "lang|locale|language|translat"` across `sources.ts` + `types.ts` = **0**.
- Every source is implicitly English. Non-English regulatory/press content is either not
  sourced, or scraped and then mis-scored because keyword matching only knows English
  "cannabis".
- **2026-07-22 update:** a translation stage now exists (`hv_translate_dispatch`/
  `hv_translate_harvest`, part of the pipeline in 2.8) but has only reached 190 of 8,684
  classified signals. The language problem is being worked, not solved.

### 2.4 Regional skew is structural (in the source list, not fixable by tuning)
- Region coverage in the marketplace registry: North America 164, Europe 60, Global 43,
  Asia-Pacific 19, Latin America 13, Middle-East/Africa 12.
- The feed is US-heavy because the **source list** is US-heavy.
- NOTE: the raw `SOURCE_ENGINE` scrape pool already spans **130 countries** — reach exists
  in the intelligence estate; it's buried by scoring/promotion, not missing.

### 2.5 The scorer is inverted and unsafe — THIS IS THE ROOT DEFECT (fixed by 2.8's classifier, not by tuning)
`public.score_signal_from_snapshot(p_pass, p_lead, p_keywords)` computes:

```
score = (keywords * 5) + (lead * 2) + (pass * 10),  clamped to 99
priority: >=75 URGENT, >=50 HIGH, >=30 MONITOR, else LOW
```

Score is **almost entirely keyword count**. Verified consequences from a stratified sample:
- **Scoring 99/URGENT:** "Taxes - Department of Revenue Request a Certificate of Compliance",
  "Is Weed Legal in Egypt? … Free Ultimate 50 Prompt Hemp & THC AI Guide ($1,7…" (SEO
  affiliate spam), "MENU Entrar/Registar --> Favoritos Siga-nos FacebookLink" (nav chrome).
- **Scoring <40 / MONITOR-LOW:** "Australian medicinal cannabis sales fall nearly 30% in
  second half of 2025", "Virginia cannabis veto could boost hemp business", "UK medical
  cannabis is maturing" — i.e. the genuinely good, clean news headlines.
- **The scorer is inverted:** keyword-dense boilerplate outranks real one-line signals.
  No amount of threshold tuning fixes an inverted signal. The instrument is wrong.

**Implication for everything else:** any feature that increases volume through this scorer
(more sources, more languages, "stories too") scales noise, not value. The scorer must be
replaced before the firehose is widened. **(Done — see 2.8. The scorer described above is
dead code as of 2026-07-22; nothing live still reads it for promotion decisions.)**

### 2.6 Data-integrity history (context so you don't re-break it)
- The `signals.reviewed` flag is the gate every feed reader filters on (`reviewed=eq.true`).
  Readers (verified): `lib/regulatory-signals/public.ts` (the live Intel feed),
  `lib/intelligence/jurisdictionSynthesis.ts`, `lib/dashboard/dashboardServerData.ts` (×3),
  `app/api/dashboard/digest/route.ts`, `app/api/dashboard/signals/route.ts`. 7+ consumers.
- The ingest (`promote_snapshot_to_signals`) correctly inserts SOURCE_ENGINE rows with
  `reviewed=false`. On/before 2026-07-05 an untracked bulk UPDATE wrongly flipped 528
  SOURCE_ENGINE rows to `reviewed=true` (avg score 33 — did NOT select for quality). The
  HAR-28 hardening (disabled the old promote HTTP path) stopped the bleed on 2026-07-06.
- **Fixed 2026-07-14** (migration `correct_wrongly_flipped_source_engine_reviewed`): the 528
  rows restored to `reviewed=false`. Feed dropped to 75 genuinely-reviewed rows, avg score
  65, 0 dumps, ~44 countries. `signals` has no `reviewed_by`/`reviewed_at` column, so there
  is currently NO way to distinguish human review from automated — add one (see 4.3).
  **(Superseded — these columns exist now; see 2.8.)**
- There is currently **no correct promotion path**. Fresh good signals are stranded
  unreviewed (the feed is clean but goes stale). This spec's Stage 3 is that path.
  **(Built twice, independently — see 2.8. This is exactly the gap the second build
  filled, without anyone checking whether the first one already existed.)**

### 2.7 Also fixed 2026-07-14 (don't undo)
- `api.get_corridor_stats(text)` created as a service_role-only SECURITY DEFINER wrapper;
  was briefly over-granted to anon/authenticated via the PUBLIC pseudo-role, then locked
  down (`lock_down_corridor_stats_revoke_public`). Grants must stay service_role-only.
- The view `public.signals_intelligence_feed` was edited earlier this session but **is
  referenced nowhere in the app** — do not build on it. The live feed is the PostgREST
  query in `lib/regulatory-signals/public.ts`. (Candidate for deletion; confirm first.)

### 2.8 The pipeline forked into two independent implementations (found 2026-07-22 — read this before touching anything)

Between 2026-07-14 and 2026-07-21, **two separate sessions independently built Stage
0-4 of this spec, neither aware of the other.** Both are live in production today.

**Pipeline A — `intel_*` family.** Built first (2026-07-14/15). `intel_eval_set` (202
hand-labeled rows, the only real ground truth that exists), `intel_eval_predictions`,
`api.intel_eval_scoring` (precision/recall/quality_accuracy view), `signal_classifications`
(a join table keyed on `signal_id`), `api.promote_classified_signals()` (dry-run by
default, promotes from `signal_classifications` into `signals.reviewed`), cron
`intel-classify-promote` → `public.intel_pipeline_tick()`. Has **no** translation,
**no** dedup/clustering, **no** entity extraction. Was found running live and
auto-promoting (1,102 rows believed at the time to be its output — **this was wrong**,
see below) off a classifier that had not cleared its own proposed validation gate.
Paused 2026-07-21.

**Pipeline B — `hv_*` family.** Discovered 2026-07-22, **not referenced anywhere in
git** — no migration file, no doc, no HANDOFF entry, for any of its 10 functions or 4
job-tracking tables. Classification and promotion state live as **direct columns on
`signals`** (`quality_label`, `content_type`, `impact`, `quality_confidence`,
`classifier_version`, `title_en`, `summary_en`, `lang_detected`, `embedding_1024`,
`is_representative`, `cluster_rep_id`), not a join table. Full harvest/dispatch async
pattern: `hv_translate_{harvest,dispatch}`, `hv_classify_corpus_{harvest,dispatch}`
(calls the same `hv-classify` edge function Pipeline A's classifier work hardened),
`hv_embed_{harvest,dispatch}`, `hv_entities_{harvest,dispatch}`, `hv_dedup_assign`
(cosine-similarity clustering via `pgvector`, sets `is_representative`/`cluster_rep_id`),
`hv_promote_signals()` (promotes at raw `quality_confidence >= 0.65`, **zero reference
to Pipeline A's eval-gate work** — an independent, unvalidated promotion path). Crons:
`hv-quality-pipeline` (`hv_pipeline_tick`, every 2 min — runs translate+classify+embed+
entities dispatch/harvest in one call) and `hv-quality-promote` (`hv_quality_promote_tick`,
every 10 min — dedup + promote). **This is the pipeline that actually produced the
1,102 `reviewed_by='auto:v1'` promotions** — verified by the fact 100% of them have
`quality_label` populated, a column only Pipeline B's harvest function writes. Pipeline
A's promotion function reads a different table (`signal_classifications`) that was not
the source. **The original diagnosis attributing this to Pipeline A was wrong and was
corrected once the columns were checked — a direct instance of Guardrail #1 (verify the
actual writer) being skipped, then caught.**

Both pipelines share the same `'auto:v1'` marker, so `reviewed_by` alone cannot
distinguish which system promoted a given row — only the presence of
`signals.quality_label` (Pipeline B) vs. a matching `signal_classifications` row
(Pipeline A) can.

**Scale at discovery:** 8,684 signals with `quality_label` populated, 1,102 promoted,
5,080 embedded, 190 translated, 302 graph entities from 100 links, **89,013 total
classify-dispatch jobs ever fired** (real historical OpenAI spend), 121+80+5
dispatched-but-unharvested jobs stalled mid-flight when both crons were disabled.

**Why both crons are currently off:** not because anyone caught the validation-gate
problem in Pipeline B. This project runs on the **Nano** compute tier (43 Mbps baseline
disk I/O, 30-min/day burst budget — see `docs/control` and Supabase's own advisor). Six-
plus cron jobs firing every 2-10 minutes, several doing embedding writes and LLM-result
writes, burned through 90% of the daily burst budget and degraded the database for
2+ hours (checkpoints of 4-5 buffers taking 57-67s, `archive command failed`,
`pgbouncer`/`pg_stat_statements` queries taking 14-18s, live PostgREST traffic 503/504ing
for real users) before a manual Postgres restart plus disabling the five worst-offending
jobs (`hv-quality-pipeline`, `hv-quality-promote`, `airtable-tier-pull`,
`hv-embed-every-30min`, `claude-signal-extraction`) resolved it. Checked against
Supabase's public status page first — confirmed not a platform incident; this was
self-inflicted load against an undersized instance.

**Decision (2026-07-22, Tyler):** Pipeline B is canonical going forward — it already
implements Stages 4 (dedup) and part of 6 (translation) that Pipeline A never built, and
rebuilding those from scratch would be pure waste. Pipeline A is not deleted outright;
its real assets (the 202-row hand-labeled eval set, the `intel_eval_scoring`
duplicate-truth grading fix, the ingest-sanitization backfill) get folded into
Pipeline B's validation path (Section 6.2, Section 8 Stage-consolidated). Pipeline A's
own tables/functions/cron are formally retired once nothing depends on them (a later,
separately-gated stage — see 8).

---

## 3. Design principles (the "2027, proprietary, best-in-class" lens)

1. **The quality brain is the moat; scrapers are commodity.** Invest in judgment
   (classification, dedup, clustering), not in bespoke scraper cleverness. Anyone can
   scrape; the differentiator is deciding what matters, across languages, correctly.
2. **Judge meaning, not surface.** Replace keyword-density scoring with semantic
   classification. An LLM that reads "is this a substantive regulatory/market/culture
   signal, and what type?" is inherently language-agnostic and solves the multilingual
   problem and the quality problem in one instrument.
3. **Normalize early, route late.** Translate/normalize to a canonical representation at
   ingest so all downstream logic is language-neutral; decide destination (Signals vs
   Digest vs Market) by content-type at the end.
4. **One registry, one conductor.** A single source-of-truth source registry with explicit
   dimensions; one orchestrator that fans out. Kill the parallel estates. **(v2: this
   applies to the classification/promotion pipeline itself now, not just source
   ingestion — see 2.8. There must be exactly one.)**
5. **Everything is validated before it's trusted.** No scorer/classifier goes live without
   measured precision/recall against a labeled set. No auto-promotion wired to an
   unvalidated judge. **(v2: "wired to" must be mechanical — a function that checks a
   validated-version table before promoting — not a policy an agent is trusted to
   remember. Policy-only enforcement of this exact rule already failed twice.)**
6. **Idempotent, reversible, observable.** Every stage can re-run safely, be rolled back,
   and reports what it did. Promotion only ever promotes; it never mass-mutates state that
   a human might own. **(v2: "observable" must mean actively alerting, not a dashboard
   someone has to remember to check — see Section 8's monitoring stage. The 2026-07-22
   incident ran 2+ hours undetected against exactly this kind of passive dashboard.)**

---

## 4. Target data model

**v2 status: mostly built, live on Pipeline B.** Documented here as the actual current
schema, not a proposal.

### 4.1 Unified source registry (`source_registry`)
Built (Stage 1, 2026-07-14/15) by extending the pre-existing `source_registry` table in
place rather than creating a new `intel_sources` table. 1,727 rows: 1,487 pre-existing
intelligence sources + 240 imported (deduped) from the marketplace estate. Every row has
`content_type` and (for active/crawled rows) `language`. Coverage gap unchanged since
Stage 1: of 1,180 active crawled sources, 1,148 (97%) are still English — Stage 6
(language expansion) has not been executed at the source-registry level; only
post-hoc translation (4.2) exists so far.

### 4.2 Canonical signal record (`public.signals`)
Live columns (Pipeline B), superseding the proposed-but-unbuilt version of this table in
v1:

| column | type | notes |
|---|---|---|
| `lang_detected` | text | set by `hv_translate_harvest` |
| `title_en` / `summary_en` | text | set by `hv_translate_harvest`; null until translated |
| `quality_label` | text | `signal`/`boilerplate`/`spam`/`nav`/`duplicate`; set by `hv_classify_corpus_harvest` |
| `content_type` | text | `regulatory`/`market`/`story`/`research`/`noise` |
| `quality_confidence` | numeric | 0–1 |
| `classifier_version` | text | currently a constant string, not versioned per prompt change — **gap, see 6.2** |
| `embedding_1024` | vector(1024) | `text-embedding-3-small`, set by `hv_embed_harvest` |
| `embedding_model` / `embedded_at` | text / timestamptz | |
| `is_representative` / `cluster_rep_id` | bool / text | set by `hv_dedup_assign`, cosine threshold 0.90 |
| `reviewed` / `reviewed_by` / `reviewed_at` | bool / text / timestamptz | `reviewed_by='auto:v1'` for both pipelines' auto-promotions (ambiguous — see 2.8); `'human:<id>'` for human review |

Supporting tables: `hv_classify_jobs`, `hv_embed_jobs`, `hv_translation_jobs`,
`hv_entity_jobs` (async request/harvest tracking, one row per dispatched HTTP call —
**89,013 rows in `hv_classify_jobs` alone, no retention/cleanup policy — see 8**),
`signal_entities` / `ia_graph_entities` (entity graph, 100 links / 302 entities).

Pipeline A's parallel model (`intel_eval_set`, `intel_eval_predictions`,
`signal_classifications`) stays for now as the source of the hand-labeled ground truth
and the scoring methodology; it does not get new production traffic once the
consolidation lands.

### 4.3 Routing
- `content_type='regulatory'` → Signals feed
- `content_type='story'` → Digest
- `content_type='market'` → both
- `content_type='research'` → Digest (+ Signals if high impact)
- `quality_label != 'signal'` → never surfaced anywhere

**v2 gap, unresolved:** this routing table is the *design*, not a verified fact. Signals
promotion (`hv_promote_signals`) does not filter or branch on `content_type` at all —
every promoted row goes to `reviewed=true` regardless of type, and `signals.reviewed=true`
is what the Intel feed reads. Whether `content_type='story'` rows actually reach the
Digest surface has **not been checked** — `run_daily_digest()`/`run_editorial_digest()`
read from a separate table (`daily_digest.headlines`), not `signals`. This is a real,
open integration gap addressed as its own stage (8, Stage D).

---

## 5. Target pipeline (one conductor, clear stages)

**v2: this is now Pipeline B's actual shape, annotated with what's real vs. still gap.**

```
                     source_registry (1,727 rows, 22 languages, 97% English)
                                │  source-engine-fetch (cron, daily passes)
                                ▼
                     source_snapshots (raw capture, sanitized 2026-07-21:
                     HTML-stripped + entity-decoded before use)
                                │  hv_extract_signals_from_captured_text
                                ▼
                          public.signals (raw landing, reviewed=false)
                                │
              ┌─────────────────┼──────────────────┬───────────────────┐
              ▼                 ▼                  ▼                   ▼
     hv_translate_*     hv_classify_corpus_*   hv_embed_*        hv_entities_*
     (title_en/         (quality_label/        (embedding_1024)  (signal_entities,
     summary_en/        content_type/                            ia_graph_entities —
     lang_detected —     quality_confidence,                      gated on
     190/8,684 done)     via hv-classify edge                     reviewed_by='auto:v1',
                         fn — same fn hardened                    i.e. runs AFTER
                         2026-07-21 for                           promotion)
                         OpenAI-only + retry)
              │                 │                  │
              └─────────────────┴──────────────────┘
                                ▼
                     hv_dedup_assign (cosine >=0.90, sets
                     is_representative / cluster_rep_id)
                                ▼
                     hv_promote_signals (quality_confidence>=0.65,
                     is_representative=true, not excluded-domain)
                     — GAP: no reference to intel_eval_scoring at all (6.2)
                                ▼
                     reviewed=true, reviewed_by='auto:v1'
                                ▼
                     Intel feed (lib/regulatory-signals/public.ts)
                     — GAP: content_type routing to Digest unverified (4.3)
```

Orchestrated by two cron entry points, not one:
`hv_pipeline_tick()` (translate+classify+embed+entities dispatch/harvest, was */2 min)
and `hv_quality_promote_tick()` (dedup+promote, was */10 min). **Both disabled as of
2026-07-21** pending the consolidation work in Section 8.

---

## 6. The quality brain (the core proprietary component)

### 6.1 Classifier contract — built, live, hardened

`supabase/functions/hv-classify/index.ts`. Modes: `pool` (live-corpus batch, called by
Pipeline B), `eval` (eval-set batch, called by Pipeline A's validation work), `titles`,
ad-hoc `{text}`/`{signalId}`.

**Input:** `{ headline, summary }` (or `{ signalId }`, resolved server-side)
**Output (strict JSON):**
```json
{
  "quality_label": "signal | boilerplate | spam | nav | duplicate",
  "content_type":  "regulatory | market | story | research | noise",
  "impact":        "high | medium | low",
  "confidence":    0.0-1.0,
  "reason":        "one-line justification"
}
```
- `quality_label='duplicate'` is explicitly restricted in the system prompt to "only
  when explicitly told of a specific other item" — this classifier cannot detect
  duplicates on its own; that is `hv_dedup_assign`'s job (cross-document, cosine
  similarity), not the classifier's. **This is why the eval-scoring view folds
  duplicate-truth rows into the signal bucket for grading (6.2) — the classifier was
  being penalized for a job that structurally belongs to dedup.**
- **Provider chain (2026-07-21, per explicit direction not to fund Anthropic/Gemini
  until the product makes money):** default `CLASSIFY_PROVIDER_ORDER=openai` only
  (previously `openai,gemini,anthropic` — the other two are billing-blocked and were
  being tried on every failure at pure latency cost). Same-provider retry without forced
  JSON mode on empty/unparseable response (a real, persistent — not transient — OpenAI
  failure mode found in ~18% of eval rows). 429 backoff-retry (added after re-validating
  the eval set concentrated 100% of traffic on one provider and tripped a rate limit that
  three-way load-spreading had been masking). `hv-extract`'s `extractSignal`/
  `extractEditorial` reordered OpenAI-first for the same reason (previously tried
  Anthropic first on every call, a guaranteed-fail round trip every time).
- **Residual risk, not yet mitigated:** if OpenAI has a full outage (not just a rate
  limit), the entire pipeline — translate, classify, embed's caption text, entities —
  stops, since Gemini/Anthropic are explicitly off the table. Terminal fallback is
  `hv_classify_review_queue`/`intel_classify_review_queue` (manual review) — nothing is
  silently dropped, but nothing auto-processes either. Accepted risk per Tyler's
  explicit funding decision; not something to silently re-litigate.

### 6.2 Validation set and gate — built, but not mechanically wired to promotion (THE central open gap)

- `intel_eval_set`: 202 rows, **fully human-labeled** (197 confirmed + 5 corrected — the
  structural-crosscheck/`needs_human` triage described in `INTEL_EVAL_SET_RUBRIC.md` has
  been completed; there is no unlabeled remainder).
- `api.intel_eval_scoring`: computes `quality_accuracy`, `signal_precision`,
  `signal_recall`, `content_type_accuracy_on_signals` per `run_id`. **Fixed 2026-07-21**
  to fold `duplicate`-truth rows into the signal bucket for precision/recall grading
  (previously penalized the classifier for Stage 4's job — see 6.1).
- **Latest measured numbers** (`run_id='v1-smoke'`, 181/202 rows — full coverage blocked
  by hitting OpenAI's account-tier rate limit mid-run, itself evidence for the residual
  risk in 6.1): **signal_precision = 1.000, signal_recall = 0.559**,
  `content_type_accuracy_on_signals = 0.753`. Precision clears the proposed ≥0.9 gate
  with room to spare. Recall remains below the proposed ≥0.7 gate.
- Recall gap, characterized (not yet fixed): (a) a small residual of signals where the
  2026-07-21 backfill's recurrence heuristic couldn't fully dedupe genuinely-repeated
  ingest text (no `" - Source"` separator to anchor on) — these still read as
  legitimately repetitive to the classifier, correctly; (b) genuine classifier judgment
  misses on terse or foreign-language real news the current prompt under-rates. Neither
  has been root-caused to a specific prompt fix yet.
- **The gap that matters most:** none of this is checked by `hv_promote_signals()`
  before it promotes. The measured 1.000/0.559 numbers exist in a separate table that
  the promotion function never queries. A future prompt or model change could silently
  regress precision and nothing would stop `hv_promote_signals` from continuing to
  promote off it. **This must become a mechanical check, not a remembered policy** —
  see Stage C in Section 8.
- **Also open:** the eval gate is currently a single pooled number across all languages.
  Given multilingual coverage is an explicit goal (Section 1, item 2) and only 190/8,684
  signals are translated, a pooled pass could hide the classifier doing much worse on
  non-English content specifically. Stratify the gate by `lang_detected` once enough
  non-English eval coverage exists to make that meaningful (it's thin today — most of
  the 202-row eval set's non-English rows were the ones that hit the OpenAI rate limit
  and never got a `v1-smoke` prediction at all).

### 6.3 Promotion — live, unguarded (see 6.2)

`hv_promote_signals(p_min_conf numeric default 0.65)`: promotes
`quality_label='signal' AND quality_confidence >= max(p_min_conf, 0.65) AND
is_representative=true AND url domain not in excluded_source_domains AND reviewed is
distinct from true AND reviewed_by not like 'human:%'`. Sets
`reviewed=true, reviewed_by='auto:v1', reviewed_at=now()`. **Only ever promotes** —
the single write is `false → true`, idempotent, never touches human-reviewed rows.
That structural invariant is sound and should be preserved exactly as-is through the
consolidation. What's missing is the gate (6.2), the cost ceiling (Section 9), and
verification that `excluded_source_domains` is actually a maintained blocklist rather
than a dead reference (unchecked as of this writing).

### 6.4 Dedup / clustering — live

`hv_dedup_assign(p_tau=0.90, p_scope_days=120)`: cosine similarity on `embedding_1024`,
sets `is_representative` (false if a higher-scored or older duplicate exists within
threshold) and `cluster_rep_id`. `hv_promote_signals` already filters to
`is_representative=true`, so the "12 sources reporting this" corroboration design (v1
§6.4) is structurally possible but **not yet surfaced in any UI** — unverified whether
the public feed shows corroborating-source counts at all.

---

## 7. Multilingual & story coverage (the user's explicit asks)

- **Languages:** translation stage exists and works (`hv_translate_*`) but has only
  processed 190 of 8,684 classified signals — not yet run at the volume needed to move
  the needle on the "97% English" gap measured in Stage 1. Source-level language
  expansion (adding non-English gov/press sources, not just translating what's already
  captured) has not started.
- **Stories for Digest:** `content_type='story'` classification exists and is being
  produced. Whether it reaches the Digest surface is **unverified** — see 4.3. This is
  very possibly still unsolved end-to-end despite both pipelines existing.
- **Coverage target:** unchanged from v1 — raw pool spans 130 countries; the goal is
  promoted/deduped signals matching that footprint. Current promoted set (1,102 rows)
  has not been audited for country/language spread.

---

## 8. Staged consolidation plan (v2 — supersedes v1 §8)

v1's staged plan (Stage 0 eval set → Stage 1 registry → Stage 2 classifier → Stage 3
promotion → Stage 4 dedup → Stage 5 orchestrator → Stage 6 languages → Stage 7 routing)
assumed a single, greenfield build. That's no longer the situation: Stages 0-4 exist,
duplicated, in two systems. This plan is the **consolidation and hardening** sequence
from here, replacing v1 §8 outright.

**Process discipline for every stage below (non-negotiable, derived directly from how
tonight went wrong):**
1. **Branch-test first.** Apply and verify on a Supabase database branch
   (`create_branch`) before promoting to production. No stage goes straight to prod.
2. **One migration, one reason, committed to git immediately** — not batched, not left
   live-only. This is the exact discipline Pipeline B skipped, which is how it went
   nine-tenths of a year — sorry, nine-tenths of a *week* — undocumented.
3. **A falsifiable verification check, run live, pasted into the evidence log** — not
   "should work," a specific query result against a specific threshold.
4. **A soak period under real production load before advancing to the next stage** —
   a single pass/fail check at deploy time does not catch resource-exhaustion failures
   that only emerge after sustained operation, which is exactly what happened
   2026-07-21/22.
5. **A rehearsed rollback path, written before the stage ships, not improvised during
   an incident.**
6. **Explicit go/no-go from Tyler at every irreversible step** (deprecating Pipeline A,
   first live promotion under the new gate, re-enabling any cron) — plan approval is
   not blanket approval for every step inside it.

### Stage A — Document and commit Pipeline B as it exists today
Write the 10 functions + 4 job tables + 2 cron jobs into tracked migrations, exact
current behavior, no functional changes yet. Verify: `pg_get_functiondef` on live vs.
committed matches byte-for-byte; `git log` shows the commit; this document's Section 2.8
is the record of why. This stage alone closes the "zero paper trail" gap regardless of
what else happens next.

### Stage B — Security/grants audit on the newly-committed tables
`get_advisors(type='security')` on `hv_classify_jobs`, `hv_embed_jobs`,
`hv_translation_jobs`, `hv_entity_jobs`, `signal_entities`, `ia_graph_entities`. Fix any
RLS-on-no-policy or over-granted findings — this repo has a specific, repeated history
of exactly this defect class on new tables. Verify: zero new findings on a second
`get_advisors` pass.

### Stage C — Mechanically enforce the validation gate
Add a `classifier_validation` table (classifier_version, validated_at, signal_precision,
signal_recall, n_eval_rows, gate_passed boolean). `hv_promote_signals` looks up the
current `classifier_version`'s row and refuses to promote anything if `gate_passed` is
not true or the row doesn't exist — no silent promotion off an unvalidated version, ever
again, regardless of which agent or session touches the prompt next. Backfill the row
for the current `hv-classify/openai/v1` version from the 2026-07-21 `v1-smoke` numbers
(1.000/0.559 — Tyler's call whether 0.559 recall clears his bar, or whether this ships
with promotion still held pending a recall fix). Verify: a live test that
`hv_promote_signals` is a no-op when the validation row is deliberately set to
`gate_passed=false`.

**Status: DONE (2026-07-23).** `public.classifier_validation` created, RLS-locked to
service_role, backfilled with the live `v1-smoke` numbers
(`n_eval_rows=181, signal_precision=1.000, signal_recall=0.559, gate_passed=false`).
`hv_promote_signals` rewritten to require a `gate_passed=true` row for the row's
`classifier_version` — verified live: `select hv_promote_signals(0.65)` returns `0`
right now, gate closed, regardless of cron state. Gate stays closed until Tyler decides
the open recall question below.

### Stage D — Resolve the content_type → surface routing gap
Confirm or fix whether `content_type='story'`/`research` promoted signals actually reach
Digest, or whether Digest's separate `daily_digest`/`editorial_items` tables need their
own wiring to this pipeline's output. This is the piece of the original ask (Section 1,
item 3) that may still be entirely unaddressed regardless of everything else here.
Verify: a `story`-classified, promoted signal actually renders on the Digest surface,
checked end-to-end, not assumed from column values.

### Stage E — Cron redesign for the Nano-tier disk-I/O budget
Replace the `*/2 min` and `*/10 min` all-in-one ticks with staggered, larger-batch,
lower-frequency schedules (matching the `intel_*` family's proven-clean :05/:10/:15-style
offsets — confirmed via `cron.job_run_details` to run sub-second with zero overlap).
Split `hv_pipeline_tick`'s four dispatch/harvest calls (translate, classify, embed,
entities) across separate offsets rather than one function firing all four every tick.
Verify: a full day of `cron.job_run_details` with zero `job startup timeout` entries and
Supabase's own Disk IO Budget advisory below 50% consumption.

**Status: DESIGNED, NOT SCHEDULED (2026-07-23).** Recommended cadence, matching the
30-minute pattern already proven safe elsewhere in this exact project
(`hv-extract-every-30min`, `hv-score-every-30min`, `hv-signal-analysis-every-30min`):
run `hv_pipeline_tick()` on `*/30` and `hv_quality_promote_tick()` staggered 10 minutes
off it (e.g. `10,40 * * * *`) — 48 + 48 = 96 invocations/day total, down from the prior
720 + 144 = 864/day that caused both incidents (~9x reduction). Deliberately not
scheduled by this stage: re-adding either cron is Stage J and needs Tyler's explicit
sign-off, plus a soak check against `cron.job_run_details` and the Disk IO Budget
advisory per this section's verify criteria, before it goes live.

### Stage F — Cost and disk-I/O hard limits in the dispatch functions themselves
Not a dashboard — a check inside `hv_classify_corpus_dispatch`/`hv_embed_dispatch`/
`hv_translate_dispatch`/`hv_entities_dispatch` that refuses to fire more requests past a
daily count/spend ceiling, logging and stopping rather than continuing. Verify: a
deliberately-lowered test ceiling actually halts dispatch mid-run.

**Status: DONE (2026-07-23).** Two layers: (1) hard per-call `LEAST()` ceilings on all
four dispatch functions plus `hv_dedup_assign`'s scope/tau parameters, independent of
caller-supplied limits; (2) `public.hv_dispatch_budget` — a real daily-call ceiling per
stage (classify 500, translate 200, embed 300, entities 200/day), consumed via
`hv_consume_dispatch_budget()` before each dispatch function's loop. Verified live: with
`classify`'s ceiling deliberately set to 0, `hv_classify_corpus_dispatch(50,30)` returned
`0` (halted, not throttled-but-still-firing), then restored to 500.

### Stage G — Active alerting, not passive dashboards
A scheduled check (separate from the pipeline itself, so it can't be taken down by the
same failure) that pages/notifies Tyler if: disk IO budget crosses a threshold, any
pipeline cron has failed N times in a row, or job-table backlog (`not harvested` counts)
exceeds a threshold. The 2026-07-21/22 incident ran 2+ hours undetected specifically
because nothing did this. Verify: a deliberately-triggered test condition actually
produces a notification.

**Status: PARTIAL (2026-07-23).** `public.hv_pipeline_health()` built — one query
surfacing job-table backlogs, both crons' live active/unscheduled state, and the
classifier gate's current status, each with a plain-English note. This is checkable
state, not active alerting: it is not itself scheduled (adding a new always-on cron to
solve an always-on-cron problem seemed backwards) and produces no push notification.
Full Stage G requires a delivery-channel decision (email/SMS/push — see open decisions
below) that's Tyler's to make; wiring `hv_pipeline_health()` to a low-frequency cron
(e.g. hourly) plus that channel is the remaining work once he picks one.

### Stage H — Retention policy on the job-tracking tables
`hv_classify_jobs` alone has 89,013 rows with no cleanup. Define and implement a
retention window (e.g., drop `harvested=true` rows older than N days) so these don't
become an unbounded disk-growth problem independent of the I/O-bandwidth issue. Verify:
row counts stabilize under continued operation instead of growing monotonically.

### Stage I — Deprecate Pipeline A (separately gated, only after B has proven itself)
Only after Stage C-G have shipped and soaked: fold Pipeline A's real assets (the 202-row
eval set, the eval-scoring methodology) fully into Pipeline B's validation path if not
already done by Stage C, confirm nothing still depends on `signal_classifications`/
`api.promote_classified_signals`/`intel_pipeline_tick`, then formally retire them
(documented removal, not silent orphaning). **Requires explicit sign-off — this is the
irreversible step, not the plan approval that preceded it.**

**Status: DONE, by a concurrent session (2026-07-22), ahead of this plan's sequencing.**
Migrations `deprecate_unused_stage3_pipeline_a` and `deprecate_pipeline_a_precise_wording`
(both same day) mark `signal_classifications` and `api.promote_classified_signals` as
deprecated via `COMMENT ON` only — no drop, fully reversible, per their own text citing
"Tyler's decision (2026-07-22)". A companion fix (`fix_rows_needing_titles_pipeline_b`)
corrected `api.rows_needing_titles` to stop joining the now-deprecated table (it was only
reaching 9 of 919 rows through that join). This landed out of this plan's stated sequence
(before C/E/F/G, not after) — flagged here for the record, not undone, since the decision
itself was Tyler's and the change is non-destructive. **Known gap this created:**
`docs/control/STAGE3_PROMOTION.md` (the doc these migrations cite for context) still
describes the pre-deprecation state as of 2026-07-15 and was not updated alongside them —
it now reads as though Pipeline A is still the intended path. Needs a follow-up edit;
not made here to avoid two concurrent sessions editing the same doc.

### Stage J — Re-enable promotion, on purpose, with sign-off
Only after Stage C (mechanical gate) is live and Stage E-G (cadence, cost caps,
alerting) have soaked: re-enable `hv-quality-promote` (and, separately, whichever
translate/classify/embed/entity cadence Stage E lands on). This is a live, public-feed-
facing action and gets the same explicit go-ahead every other consequential step in this
project has required.

### Stage K (unchanged from v1, still not started) — Source-level language + story expansion
Add non-English gov/press sources and story/research sources to `source_registry` with
correct `language`/`content_type` tags. Only after the above land — no point widening the
firehose before the brain (gate, cadence, cost, alerting) is trustworthy at current
volume.

---

## 9. Guardrails (MANDATORY — derived from real failures on this codebase, v2 additions marked)

1. **Verify the consumer/writer before changing anything.** A view was edited that
   nothing read; a function was over-granted by assuming it matched a sibling; **1,102
   promoted rows were misattributed to the wrong pipeline until someone actually checked
   which column was populated (2026-07-22).** Trace the actual readers/writers first,
   every time. `grep` the codebase AND check DB triggers/grants AND check which columns
   are actually populated, not just which function looks like it should be responsible.
2. **Validate judgment against labels before wiring it — and keep that validation
   mechanically connected, not just documented.** The keyword scorer was never
   validated and was inverted. Fixed by building `intel_eval_scoring`. Then a
   *second, independent* promotion function was found live with zero connection to
   that validation at all. **A validation gate that a promotion function doesn't
   actually query might as well not exist.** (Stage C, Section 8.)
3. **Promotion only promotes.** Never write a bulk mutation that flips shared state a
   human might own. The 528-row `reviewed=true` incident, and separately Pipeline B's
   `hv_promote_signals`, both respect this — preserve it exactly through consolidation.
4. **One migration = one reversible change with a documented reason, committed to git
   in the same session it's applied.** Ten functions and four tables lived in
   production for roughly a week with zero git history. "Applying via `execute_sql`
   without committing the file" isn't a smaller version of this problem — a whole
   undocumented subsystem is the same problem at a scale that should make the rule feel
   less optional, not more.
5. **Idempotent + observable — and "observable" means actively alerting, not a
   dashboard someone has to remember to check.** (Stage G.)
6. **Grants stay least-privilege.** SECURITY DEFINER functions default to service_role
   only; watch the PUBLIC pseudo-role.
7. **Don't scale the firehose ahead of the brain.** No new sources/languages promoted to
   users until the classifier gates them — and now, additionally, until the gate is a
   mechanical check the promotion function can't bypass, not a policy an agent can
   forget under time pressure or genuinely not know about because the code that
   violates it was never committed anywhere they could have found it.
8. **[v2] Test infrastructure changes on a branch before production.** Every stage in
   Section 8 branch-tests first. This wasn't a rule in v1 because v1 assumed a
   greenfield build; it's a rule now because the 2026-07-21/22 incident was a live
   production database degrading in front of real users for over two hours.
9. **[v2] A resource/cost ceiling lives in the code that spends the resource, not in a
   dashboard next to it.** Disk-I/O and LLM-spend limits are enforced in the dispatch
   functions themselves (Stage F), because a chart doesn't stop a runaway loop — code
   does.
10. **[v2] Two independent implementations of the same stage is itself the failure,
    not a tiebreaker exercise.** If you find yourself building something that already
    plausibly exists, the very first move is `grep`/`pg_proc` for anything with an
    overlapping purpose before writing a single line — Guardrail #1, applied one level
    up, to whole subsystems instead of single functions.

---

## 10. Open decisions for the owner (Tyler)

- **Recall bar:** ship promotion with recall still at 0.559 (below the proposed 0.7),
  or hold Stage J until a recall fix lands? Precision is already excellent (1.000); the
  tradeoff is completeness vs. further prompt-engineering time.
- **Cost ceiling:** the actual daily $ or request-count cap for Stage F — no number
  proposed yet, needs your sense of acceptable spend on a pre-revenue product.
- **Cron cadence for Stage E:** how fresh does the feed need to be? 30-minute cadence
  (matching Pipeline A's proven-clean pattern) vs. something else — a direct tradeoff
  against Nano's disk-I/O budget, independent of whether you also upgrade compute.
- **Compute tier:** Nano vs. a paid compute add-on — flagged repeatedly, not resolved.
  Even a perfectly efficient consolidated pipeline will eventually want headroom if
  volume grows; this is a cost decision independent of the technical rebuild.
- **Alerting channel for Stage G:** email, SMS, push — whatever reaches you fastest at
  3am, since that's exactly when tonight's incident would have needed one.
- **Which target markets/languages** get source expansion first in Stage K (LatAm,
  Africa, APAC order) — unchanged from v1, still open.
- **Digest editorial bar** — how "interesting" is interesting for the `story`
  content_type, once Stage D actually gets it flowing there — unchanged from v1, still
  open.

---

## 11. Fast reference — key identifiers (updated 2026-07-22)

- Supabase project: `zvxdgdkukjrrwamdpqrg` (Harbourview Platform, us-west-2,
  **Nano compute tier**)
- Vercel project: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (name `harbourview`), team
  `team_0rK4jTvMLlSufR0ZzX4LCKYi`
- Repo: `harbourviewcompany-create/harbourview-platform`
- Live Intel feed query: `lib/regulatory-signals/public.ts` → PostgREST
  `/rest/v1/signals?reviewed=eq.true&order=date.desc&limit=300`
- Canonical pipeline (Pipeline B, uncommitted as of this writing — Stage A fixes that):
  `hv_pipeline_tick()`, `hv_quality_promote_tick()`, `hv_translate_*`,
  `hv_classify_corpus_*`, `hv_embed_*`, `hv_entities_*`, `hv_dedup_assign`,
  `hv_promote_signals`. Crons `hv-quality-pipeline` (jobid 47) and `hv-quality-promote`
  (jobid 48), both currently disabled.
- Deprecated-pending pipeline (Pipeline A): `intel_eval_set`, `intel_eval_predictions`,
  `api.intel_eval_scoring`, `signal_classifications`, `api.promote_classified_signals`,
  `intel_pipeline_tick()`. Cron `intel-classify-promote`, unscheduled 2026-07-21.
- Shared classifier: edge function `hv-classify` (v13 as of 2026-07-21 — OpenAI-only,
  retry + 429 backoff). Shared extraction: edge function `hv-extract` (v33, OpenAI-first
  provider order).
- Raw landing table: `public.signals` (~7,200+ SOURCE_ENGINE rows historically; 8,684
  with `quality_label` populated as of 2026-07-22)
- Broken scorer, confirmed dead: `public.score_signal_from_snapshot` — nothing live
  reads it for promotion anymore.
- Unused view (do not build on; confirm before deleting): `public.signals_intelligence_feed`
- Existing infra reused: `pgvector` (`embedding_1024`), OpenAI `text-embedding-3-small`
  and `gpt-4o-mini`.

---
*End of spec v2. Update this document as Section 8 stages land; keep Section 2
(diagnosis) and Section 11 (identifiers) current so the next agent starts from truth,
not assumption — that discipline is the entire reason v2 exists.*
