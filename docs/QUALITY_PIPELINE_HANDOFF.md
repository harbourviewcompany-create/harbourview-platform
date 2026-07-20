# Quality Pipeline — Handoff, Technical Debt & Roadmap

**Written:** 2026-07-20 · **Status:** honest self-review for the next agent
**Read alongside:** `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (the target design) and `docs/SOURCE_EXPANSION_PLAN.md` (Stage 6).

This documents a session that built a working signal-quality pipeline (translate → classify → embed → dedup → promote → entity-link) plus legislative-bill ingestion. **It works and is validated, but it is a fast proof, not production architecture.** Below is what exists, what's wrong with it, and what to do next. Do not treat the current pipeline as the intended end-state.

---

## 1. What was built (so you can navigate it)

**Validated outcome:** on the 202-row `intel_eval_set`, the classifier went from failing to passing your §6.2 gate — `signal` recall **0.73** (≥0.70), precision **0.906** (≥0.90) — via a translation stage (non-English recall 0.40→0.74) and dedup at cosine τ=0.90.

**New columns on `public.signals`:** `title_en, summary_en, lang_detected, translated_at, translation_model, quality_label, content_type, impact, quality_confidence, classifier_version, cluster_rep_id, is_representative, corroborating_count`.

**New tables:** `signal_entities` (signal↔graph link), `legislative_bills`, `excluded_source_domains`, and job tables `hv_translation_jobs / hv_classify_jobs / hv_embed_jobs / hv_reclassify_jobs / hv_entity_jobs`. **View:** `source_yield_report`. **Modified view:** `signals_quality` (added a `reviewed=true` bypass so promoted rows surface — see §4).

**Functions:** `hv_translate_dispatch/harvest`, `hv_classify_corpus_dispatch/harvest`, `hv_embed_dispatch/harvest`, `hv_dedup_assign`, `hv_promote_signals`, `hv_entities_dispatch/harvest`, `hv_billwatch_uk_harvest`, and the orchestrators `hv_pipeline_tick` (cron `hv-quality-pipeline`, every 2 min) + `hv_quality_promote_tick` (cron `hv-quality-promote`, every 10 min).

**Committed in PRs:** #1086 (stage 3), #1095 (entity linking), #1096 (bills), plus #1078/#1079 (regulatory feed + Radar UI), #1087 (source plan doc), #1090 (competitor exclusion). **Uncommitted at handoff:** `signals_quality_reviewed_bypass` migration (live, needs a PR).

---

## 2. The core architectural debt (read this first)

**The entire pipeline runs LLM calls from inside Postgres via `pg_net` + `pg_cron`.** This was the fastest way to prove the thesis without deploying edge functions. It is not how this should run in production.

Problems, in order of severity:

1. **It shadows the real pipeline.** The codebase already has proper edge-function workers — `hv-classify` (has repo source), `hv-embed-worker`, `hv-score`, and `hv-signal-analysis` (⚠️ **no repo source — deployed only**). There is also `get_signals_pending_analysis` (a queue gated on `reviewed=true`, which is why the analysis worker was idling). This session built a **parallel** pg_net pipeline instead of extending those. **You now have two pipelines that don't know about each other.** Consolidating them is the #1 job.

2. **The dispatch/harvest pattern is racy.** Each tick fires `net.http_post` requests and the *next* tick harvests them from `net._http_response`. Under load that table is pruned aggressively — if a response is evicted before harvest, the job strands as `harvested=false` forever. Mitigated by prompt harvesting, not solved. (At handoff, stranded-job count was 0, but the design is fragile.)

3. **`hv_dedup_assign` is O(n²) with no ANN index** and re-runs the whole scope every 10 minutes. Fine at ~300 embedded signals; it will time out in the thousands. Needs an `ivfflat`/`hnsw` index on `embedding_1024` and incremental (only-new-rows) clustering.

4. **Cost is unbounded and unmonitored.** ~10k LLM calls/hour at peak, no cap, no alerting, and **no batching** (OpenAI's Batch API is ~50% cheaper for backfills). For a pre-revenue product this is a real risk.

5. **No tests, no observability.** An autonomous system that spends money and writes to the live feed has zero test coverage and no dashboard/alerting. `cron.job_run_details` is the only signal.

**Operational gotcha for agents:** pausing the `hv-quality-*` crons stalls the backfill. This session repeatedly paused them to run git operations (because the cron flood evicts git API responses from `net._http_response`), which starved the pipeline. **Don't pause the crons to commit.** Either commit via a path that doesn't depend on `net._http_response`, or accept brief pauses only.

---

## 3. The moat is being built noisy — entity resolution

`hv_entities_harvest` resolves entities by **lowercase-label match only**. That means "BfArM", "Bundesinstitut für Arzneimittel und Medizinprodukte", and "German Federal Institute for Drugs" become **three separate nodes for one regulator**. As the graph grows it fragments into thousands of near-duplicate entities — the moat asset degrades with scale. Needs real canonicalization: alias tables, embedding-based entity matching, and a human-in-the-loop merge queue for ambiguous cases. Do this **before** the graph gets large.

---

## 4. Known bugs

- **FIXED this session:** promoted signals were invisible — `signals_quality`'s pre-classifier score band excluded ~70% of `reviewed=true` rows. Added a `reviewed=true` bypass; visible count 305 → 1,151. (Migration uncommitted.)
- **Country-tagging bug:** a US Congress bill was tagged `PK` (Pakistan). Country assignment is unreliable and corrupts the country-based product. Not fixed.
- **`quality_confidence` is uninformative:** ~0.86 on both correct and incorrect classifications. It cannot be used as a promotion dial. `hv_promote_signals` therefore gates on `quality_label='signal' AND is_representative` only. Fixing this needs a calibrated confidence (see feedback loop, §6).
- **No medium-confidence review queue.** It's promote-or-drop; borderline signals are silently lost. §6.3 of the spec calls for a human-review middle tier — not wired.

---

## 5. The bigger miss — the product layer barely exists

We optimized the engine, not the product. A customer paying $490/mo currently sees a thin feed. The **interpretation / "so what" layer** — the thing that justifies the price and beats incumbents — is essentially untouched:

- "Germany raised import quotas 40%" is **data**.
- "Here's who benefits, the trade-flow shift, and which of *your* counterparties to contact this week" is the **product**.

The proprietary substrate for this exists but is idle and disconnected: `trade_flows` (58), the deal tracker (`deal_capital_raises`/`deal_ma_transactions`), operator/license registries, `regulatory_pending_changes` (only 6 rows), and the graph (`ia_graph_entities`/`ia_graph_edges`). Build 1 (entity linking) started connecting signals to this; the analytical layer on top does not exist yet.

Also still **dark** from the original audit that kicked off this work: `market_metrics` (154), `education_articles` (37), `trade_flows` (58) — real content never surfaced in the UI. And there is still a **hardcoded fake `components/dashboard/data/priceIntelligence.ts`** shadowing real `market_metrics`.

---

## 6. "Self-learning" is aspirational, not real

The system **runs**; it does not **learn**. There is no engagement telemetry, no outcome tracking, and no prediction-resolution loop. For it to actually get smarter it needs a feedback signal:

- **Prediction resolution:** score dated `regulatory_pending_changes` against what actually happened; recalibrate source/signal confidence (fixes §4's dead confidence). This is also the strongest sales asset — a public calibrated track record.
- **Engagement telemetry:** log view/save/dismiss/act per country+role and rank on it. Cheap to add; compounds forever; every day without it is training data thrown away.

---

## 7. Recommended roadmap (priority order)

1. **Consolidate the two pipelines into one.** Extend the existing edge-function workers (`hv-classify`, `hv-embed-worker`) rather than the pg_net shadow; drive the analysis queue off the **classifier verdict**, not `reviewed=true`. Retire the pg_net dispatch/harvest functions once ported. Add batching + a cost cap + basic alerting.
2. **Real entity resolution** (aliases, embedding match, merge queue) — before the graph scales.
3. **Fix the country-tagging bug** — it corrupts the core product.
4. **Interpretation layer** — connect regulation → operator → deal → trade flow; this is the product a customer pays for. Start with one flagship query end-to-end ("who is exposed to change X").
5. **Feedback loop** — engagement telemetry + prediction resolution (makes confidence real and the system genuinely self-improving).
6. **Surface the still-dark data** (`market_metrics` — and delete the fake `priceIntelligence.ts` — `education_articles`, `trade_flows`).
7. **Forecast extractor** (bill → `regulatory_pending_changes`), **validated against a labeled sample first** (§6.2 discipline), + the other 4 bill markets.
8. **Execute Stage 6 source expansion** (`docs/SOURCE_EXPANSION_PLAN.md`) — native-language primary regulators/gazettes; the brain is starved of good raw material.

---

## 8. Standing rules for whoever picks this up

- **Never ingest or surface competitor/aggregator content** (MJBizDaily, Leafly, Leafwell, Herb, High Times, etc.). Primary sources (govt/regulator/gazette) and licensed feeds only. See `excluded_source_domains`.
- **Validate any classifier/judgment change against `intel_eval_set` (202 labeled rows) before wiring it** — precision ≥0.90, recall ≥0.70 on `signal`. This gate already caught two bad shortcuts.
- **`hv_promote_signals` must stay safe:** only ever promotes, never demotes, never touches `reviewed_by LIKE 'human:%'`, idempotent.
- **Migrations apply live then get PR'd** (drift is a recurring problem — reconcile the ledger against the repo).
- **The feed reads `signals_quality WHERE reviewed=true`** server-side; changes to that view are live to users immediately, without a frontend merge.


---

## 9. Post-handoff addenda (verified live, same day)

- **The backfill never actually completed — cron-pausing is why.** The `hv-quality-pipeline` cron fired ~once per 15 min during this session instead of every 2 min, because it was repeatedly unscheduled to run git commits (the pg_net flood evicts git API responses, so commits seemed to "need" a pause). Net effect: ~4,600 of ~8,600 signals classified, crawling. **Do not pause the crons to commit.** The fresh-feed payoff depends on letting this run uninterrupted (~2–3h).
- **The graph has nodes but no edges.** Build 1 (`hv_entities_*`) writes signal→entity links and creates entity nodes, but **zero entity↔entity relationships** (`ia_graph_edges` unchanged at 195). Co-mentioned entities in the same signal (a real relationship) are not linked. The world-model is currently a bag of nodes. **Relationship extraction — not node extraction — is the real moat build:** add an edge-builder that links co-mentioned entities per signal, typed (regulated-by, supplies, invested-in, party-to) with provenance.
- **New tables lack RLS.** `signal_entities`, `legislative_bills`, `excluded_source_domains`, and the `hv_*_jobs` tables have row-level security off. Mitigated (only the `api` schema is PostgREST-exposed; these are `public`), but not defense-in-depth. Enable RLS before any `public` exposure.

**Verified NOT problems:** classify never ran ahead of translation (0 non-English rows classified without `title_en`); no stranded jobs at handoff.
