# HarbourView Intelligence Ingestion & Scoring — Architecture Spec

**Status:** Draft v1 · **Owner:** Tyler (sole founder) · **Written:** 2026-07-14
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
  `synthesize-jurisdictions`, …).
- **`lib/scrapers/` module**: `fetcher`, `parser`, `normaliser`, `ingestor`, `runner`,
  `deduplication`, `digest`, `sources`, `types`.
- No single orchestrator owns the run. `hv-pipeline-orchestrator` exists but does not
  conduct the whole estate.

### 2.3 No language dimension — at all
- `grep -ic "lang|locale|language|translat"` across `sources.ts` + `types.ts` = **0**.
- Every source is implicitly English. Non-English regulatory/press content is either not
  sourced, or scraped and then mis-scored because keyword matching only knows English
  "cannabis".

### 2.4 Regional skew is structural (in the source list, not fixable by tuning)
- Region coverage in the marketplace registry: North America 164, Europe 60, Global 43,
  Asia-Pacific 19, Latin America 13, Middle-East/Africa 12.
- The feed is US-heavy because the **source list** is US-heavy.
- NOTE: the raw `SOURCE_ENGINE` scrape pool already spans **130 countries** — reach exists
  in the intelligence estate; it's buried by scoring/promotion, not missing.

### 2.5 The scorer is inverted and unsafe — THIS IS THE ROOT DEFECT
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
replaced before the firehose is widened.

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
- There is currently **no correct promotion path**. Fresh good signals are stranded
  unreviewed (the feed is clean but goes stale). This spec's Stage 3 is that path.

### 2.7 Also fixed 2026-07-14 (don't undo)
- `api.get_corridor_stats(text)` created as a service_role-only SECURITY DEFINER wrapper;
  was briefly over-granted to anon/authenticated via the PUBLIC pseudo-role, then locked
  down (`lock_down_corridor_stats_revoke_public`). Grants must stay service_role-only.
- The view `public.signals_intelligence_feed` was edited earlier this session but **is
  referenced nowhere in the app** — do not build on it. The live feed is the PostgREST
  query in `lib/regulatory-signals/public.ts`. (Candidate for deletion; confirm first.)

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
   dimensions; one orchestrator that fans out. Kill the parallel estates.
5. **Everything is validated before it's trusted.** No scorer/classifier goes live without
   measured precision/recall against a labeled set. No auto-promotion wired to an
   unvalidated judge.
6. **Idempotent, reversible, observable.** Every stage can re-run safely, be rolled back,
   and reports what it did. Promotion only ever promotes; it never mass-mutates state that
   a human might own.

---

## 4. Target data model

### 4.1 Unified source registry (`intel_sources`)
One table replacing the split between `lib/scrapers/sources.ts` and the intelligence-side
source lists. Proposed columns:

| column | type | notes |
|---|---|---|
| id | text PK | stable slug |
| name | text | |
| url / search_url | text | |
| **language** | text | ISO 639-1 (`en`,`es`,`pt`,`fr`,`de`,`th`,…). REQUIRED. New dimension. |
| **region** | text | existing enum, keep |
| country | text | ISO where known |
| **content_type** | text[] | one or more of `regulatory`,`market`,`story`,`equipment`,`research`. New dimension — drives routing. |
| parser_type | text | reuse existing (`html-card`, etc.) |
| tier | int | source trust tier (gov/official > trade press > aggregator > forum) |
| cadence_hours | int | |
| status | text | `enabled`/`needs-review`/`disabled` |
| last_run_at / last_ok_at | timestamptz | observability |
| notes | text | |

Migration path: import the 311 marketplace rows with `content_type={equipment|market}`,
`language=en`; import the intelligence-side sources with their real content types; backfill
`language` for known non-English gov sources.

### 4.2 Canonical signal record
Keep `signals` as the raw landing table but add:

| column | type | notes |
|---|---|---|
| lang_original | text | detected source language |
| title_en / summary_en | text | normalized English (translate-on-ingest) |
| content_type | text | classifier output: `regulatory`/`market`/`story`/`research`/`noise` |
| quality_label | text | classifier verdict: `signal`/`boilerplate`/`spam`/`nav` |
| quality_confidence | numeric | 0–1 |
| embedding | vector | for dedup/clustering (infra exists: `hv-embed-worker`, pgvector) |
| cluster_id | text | groups syndicated/duplicate reports of the same event |
| reviewed | bool | KEEP semantics: true = passed quality bar (human OR validated auto) |
| **reviewed_by** | text | NEW. `'human:<id>'` or `'auto:<classifier_version>'`. Distinguishes review source — absence of this column is why the 528-row incident was ambiguous. |
| **reviewed_at** | timestamptz | NEW. |

### 4.3 Routing
- `content_type='regulatory'` → Signals feed
- `content_type='story'` → Digest
- `content_type='market'` → both
- `content_type='research'` → Digest (+ Signals if high impact)
- `quality_label != 'signal'` → never surfaced anywhere

---

## 5. Target pipeline (one conductor, clear stages)

```
                        ┌─────────────────────────────────────────┐
   intel_sources ──────▶│  ORCHESTRATOR (single scheduled entry)  │
   (unified registry)   │  hv-pipeline-orchestrator, rewritten    │
                        └───────────────┬─────────────────────────┘
                                        │ fan-out by source, cadence-aware
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              FETCH (raw)         FETCH (raw)          FETCH (raw)     ← language-tagged
                    │                   │                   │
                    └─────────┬─────────┴───────────────────┘
                              ▼
                   NORMALIZE + DETECT LANGUAGE
                   translate → title_en / summary_en
                              ▼
                   CLASSIFY (LLM)  ← the brain (Section 6)
                   → content_type, quality_label, quality_confidence
                              ▼
                   EMBED + DEDUP/CLUSTER (pgvector)
                   → embedding, cluster_id  (collapse syndicated repeats)
                              ▼
                   PROMOTE (Section 6.3)
                   quality_label='signal' AND confidence>=τ
                   → reviewed=true, reviewed_by='auto:vN', reviewed_at=now()
                              ▼
                   ROUTE by content_type → Signals / Digest / Market
```

Kill/absorb the competing crons: `scrape`, `intelligence-ingest`, `intelligence-extract`,
`intelligence-embed`, `regulatory-watch`, `deep-discovery` should become **stages invoked
by the orchestrator**, not independent schedules racing each other. (Audit each before
removal — see Stage 5.)

---

## 6. The quality brain (the core proprietary component)

### 6.1 Classifier contract
A single callable (edge function `hv-classify`, or a DB-invoked service) with a stable I/O
contract so any stage or agent can call it:

**Input:** `{ title, body_excerpt, source_tier, source_country, lang_original }`
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
- Model: use the current best available small/fast model via the existing AI pipeline /
  gateway. Keep the prompt + model version in `classifier_version` so promotions are
  traceable and re-runnable.
- Language-agnostic by construction: the model reads meaning, so a Spanish gazette or Thai
  FDA notice is judged without per-language keyword lists. Still store `lang_original` and
  translate for downstream display.

### 6.2 Validation set (BUILD THIS BEFORE THE CLASSIFIER IS TRUSTED)
- Hand-label a stratified sample (≥200 rows across score bands, categories, languages,
  countries) with the true `quality_label` and `content_type`. A starter unlabeled sample
  and the labeling axes are already identified in Section 2.5.
- Store as `intel_eval_set` (row id, human labels).
- Gate: the classifier must hit an agreed precision/recall bar on this set (propose:
  precision on `signal` ≥ 0.9 so the feed stays clean; recall ≥ 0.7 so it's not too sparse)
  BEFORE it is allowed to drive promotion. Re-run on every prompt/model change (regression).

### 6.3 Promotion (replaces the broken bulk-flip and the keyword scorer)
- A scheduled function promotes rows where `quality_label='signal' AND quality_confidence>=τ`
  (τ tuned on the eval set), setting `reviewed=true`, `reviewed_by='auto:vN'`, `reviewed_at`.
- **Only ever promotes.** Never demotes, never mass-mutates, never touches curated
  categories or human-reviewed rows (`reviewed_by LIKE 'human:%'`). Idempotent.
- Keep a manual human-review queue for `medium` confidence (`needs-review`), so humans add
  signal rather than fight the machine.

### 6.4 Dedup / clustering
- Embed `title_en + summary_en`; cluster near-duplicates (cosine threshold on eval set).
- Promote one representative per cluster; attach the rest as corroborating sources
  ("12 sources reporting this"). This directly kills the "same syndicated footer scored 99
  eleven times" problem seen in 2.5.

---

## 7. Multilingual & story coverage (the user's explicit asks)

- **Languages:** add non-English gov/press sources per target market with correct
  `language` tags (LatAm es/pt, Francophone Africa fr, DACH de, Thailand th, etc.).
  Because the classifier is semantic, no per-language keyword engineering is needed — but
  translate-on-ingest is required for display + dedup.
- **Stories for Digest:** add `content_type='story'`/`research` sources (trade press,
  business moves, culture, science) and let routing (4.3) send them to Digest. This is why
  content_type is a first-class dimension, not a tag.
- **Coverage target:** the raw pool already spans 130 countries; the goal is that promoted,
  correctly-classified, deduped signals span a comparable footprint — reach without noise.

---

## 8. Staged build plan (each stage independently shippable + verifiable)

**Do them in order. Each ends with a verification step. Do not start N+1 until N is
verified. Do not batch these into one migration.**

- **Stage 0 — Eval set (prereq for everything judgmental).**
  Build `intel_eval_set` with ≥200 hand-labeled rows. Verify: label distribution covers all
  bands/types/≥5 languages.

- **Stage 1 — Unified source registry.**
  Create `intel_sources`; import both estates with `language` + `content_type`. No pipeline
  behavior change yet. Verify: row counts reconcile with the two old lists; every row has a
  language + ≥1 content_type; produce a coverage-gap report (countries/languages with zero
  sources).

- **Stage 2 — Classifier + validation.**
  Build `hv-classify` to the 6.1 contract. Run against `intel_eval_set`. Verify: hits the
  6.2 precision/recall bar. If not, iterate the prompt — do NOT wire it to anything yet.

- **Stage 3 — Correct promotion path.**
  Add `reviewed_by`/`reviewed_at`. Build the promote function (6.3) driven by the classifier.
  Backfill: classify the existing 7,136-row unreviewed pool; promote the true signals.
  Verify: feed freshness returns (fresh_30d > 0), avg quality up, 0 dumps, the two known-good
  cards (WHO/THCV, INCB) present, no human-reviewed row altered.

- **Stage 4 — Embeddings + dedup/clustering.**
  Populate embeddings (reuse `hv-embed-worker`); cluster; promote one-per-cluster. Verify:
  duplicate rate in feed drops; cluster sizes sane on eval set.

- **Stage 5 — Orchestrator consolidation.**
  Audit all 15 crons + 26 edge functions; map each to a pipeline stage or mark obsolete.
  Make `hv-pipeline-orchestrator` the single conductor; convert racing crons into invoked
  stages. Verify: one scheduled entry point; no two jobs writing the same rows; run trace
  observable end-to-end.

- **Stage 6 — Language + story source expansion.**
  Add non-English + story/research sources to `intel_sources`. Verify: promoted signals gain
  languages/countries; Digest receives `story` items; Signals unaffected in quality.

- **Stage 7 — Routing + surface polish.**
  Wire `content_type` routing to Signals/Digest/Market. Verify each surface shows only its
  type, quality bar held.

---

## 9. Guardrails (MANDATORY — derived from real failures this codebase has had)

1. **Verify the consumer/writer before changing anything.** A view was edited that nothing
   read; a function was over-granted by assuming it matched a sibling. Trace the actual
   readers/writers first, every time. `grep` the codebase AND check DB triggers/grants.
2. **Validate judgment against labels before wiring it.** The keyword scorer was never
   validated and is inverted. No classifier/scorer drives promotion until it clears the
   eval-set bar. Marking your own homework is how the cookie-banner-scores-99 bug shipped.
3. **Promotion only promotes.** Never write a bulk mutation that flips shared state a human
   might own. The 528-row `reviewed=true` incident came from exactly this. Respect
   `reviewed_by LIKE 'human:%'`.
4. **One migration = one reversible change with a documented reason.** No sweeping
   multi-concern migrations. Name the reason in the migration body (see the corrective
   migrations from 2026-07-14 as the template).
5. **Idempotent + observable.** Every stage re-runnable; every run leaves a trace
   (`last_run_at`, counts of what it touched).
6. **Grants stay least-privilege.** SECURITY DEFINER functions default to service_role only;
   watch the PUBLIC pseudo-role (revoking from anon/authenticated does nothing if PUBLIC
   holds the grant).
7. **Don't scale the firehose ahead of the brain.** No new sources/languages promoted to
   users until the classifier gates them. More volume through a bad judge = more noise.

---

## 10. Open decisions for the owner (Tyler)

These are product/judgment calls a builder should NOT make silently:
- **Precision vs recall bar** for the `signal` classifier (proposed p≥0.9 / r≥0.7).
- **Promotion confidence threshold τ** and whether medium-confidence goes to a human queue.
- **Which target markets/languages** get source expansion first (LatAm, Africa, APAC order).
- **Digest editorial bar** — how "interesting" is interesting? (impact filter for stories.)
- **Model/cost budget** for per-row classification + translation at ingest volume.

---

## 11. Fast reference — key identifiers (verified 2026-07-14)

- Supabase project: `zvxdgdkukjrrwamdpqrg`
- Vercel project: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (name `harbourview`), team
  `team_0rK4jTvMLlSufR0ZzX4LCKYi`
- Repo: `harbourviewcompany-create/harbourview-platform`
- Live Intel feed query: `lib/regulatory-signals/public.ts` → PostgREST
  `/rest/v1/signals?reviewed=eq.true&order=date.desc&limit=300`
- Raw landing table: `public.signals` (7,211 rows; 7,136 SOURCE_ENGINE, all reviewed=false
  post-fix; 130 countries in pool)
- Cleaned table: `public.ia_signals` (522 rows)
- Broken scorer to replace: `public.score_signal_from_snapshot`
- Ingest writer (correct): `public.promote_snapshot_to_signals`
- Unused view (do not build on; confirm before deleting): `public.signals_intelligence_feed`
- Existing infra to reuse: `hv-embed-worker` (embeddings), `hv-extract`, `hv-score`,
  `hv-pipeline-orchestrator`, pgvector.

---
*End of spec v1. Update this document as stages land; keep Section 2 (diagnosis) and
Section 11 (identifiers) current so the next agent starts from truth, not assumption.*
