# Harbourview Platform — Optimization & Capability Review

**Date:** 2026-07-30 · **Author:** Claude (session `platform-optimization-review`) · **Status:** Findings, for Tyler's decision
**Method:** Live verification against Supabase `zvxdgdkukjrrwamdpqrg` and the working tree at `3ccb57d`. Every number below was queried live on 2026-07-30, not carried over from `INTELLIGENCE_ARCHITECTURE_SPEC.md` or `HANDOFF.md`. Where a control doc disagrees with the live database, the live database is what's recorded here.

---

## 0. The one-sentence answer

**Harbourview has built a genuinely differentiated intelligence asset and then disconnected it from every surface a customer can see** — the classifier, the translation layer, the corroboration clustering and the semantic search index are all real, all working, and all invisible in the product; meanwhile the feed a customer *does* see is 9 days stale and renders its confidence badges from the inverted keyword scorer the architecture spec declared dead.

The platform's problem is not that it is missing features. It has 246 pages, 97 API routes, 31 edge functions and 752 migrations. The problem is that the one thing worth paying for does not currently work end to end.

---

## 1. Verified current state (live, 2026-07-30)

### 1.1 The intelligence corpus — large, and genuinely global

| Metric | Value |
|---|---|
| Total rows in `public.signals` | **12,454** |
| Classified (`quality_label` populated) | 8,804 |
| Classified as a real `signal` | 4,954 |
| Promoted to the live feed (`reviewed=true`) | 1,234 |
| Auto-promoted (`reviewed_by='auto:v1'`) | 1,102 |
| **Human-reviewed, ever** | **0** |
| Countries represented in good signals | **124** |
| Countries in the promoted feed | 70 |
| Non-English signals classified as real | 102 |

The country distribution of the promoted feed is the single most encouraging number in this review:

> United States (266), **Lesotho (54)**, **Jamaica (53)**, Puerto Rico (53), Ireland (50), **UAE (43)**, **Peru (42)**, United Kingdom (39)

The US is 21.6% of the feed and Lesotho outranks the UK. No competitor in this category — Prohibition Partners, BDSA, Brightfield, Citeline — has a feed where Lesotho and Peru outrank the United Kingdom. **That is the product.** It is also, right now, almost entirely unreachable by a customer.

### 1.2 The brain is switched off, and the firehose is still running

| Metric | Value |
|---|---|
| Newest promotion to the live feed | **2026-07-20 13:50 UTC** |
| **Feed age** | **9 days 11 hours** |
| Promotions in the last 7 days | **0** |
| Unclassified backlog | **3,650** |
| — of which arrived in the last 7 days | **3,387** (≈480/day) |
| Good signals blocked by the closed gate | 669 |
| `hv-quality-pipeline` (jobid 47) | **no longer exists in `cron.job`** |
| `hv-quality-promote` (jobid 48) | present, `active=false` |
| Ingestion crons (jobs 1–5, 8, 9) | **all active, all succeeding** |

Ingestion is healthy and running daily. Classification and promotion are off. The result is a backlog growing at roughly 480 rows a day against a feed that has not moved in nine days.

Note that jobid 47 is not merely disabled — it is **gone from the cron table entirely**. The architecture spec (§11) records it as "disabled." That is no longer accurate; re-enabling it means re-creating it, not flipping a flag.

The promotion gate is closed by design and working exactly as Stage C intended:

```
classifier_version   hv-classify/openai/v1
signal_precision     1.000
signal_recall        0.559
gate_passed          false
```

This is a **correctly functioning safety mechanism holding back 669 good signals** pending one decision that only Tyler can make (§10 of the spec: ship at 0.559 recall, or hold). Nine days of staleness is the running cost of that open decision.

### 1.3 Cron health — genuinely good

All 19 active jobs ran in the last 48 hours with **zero failures** and sub-second durations. The Stage E cadence redesign worked. The 2026-07-21 disk-I/O incident has not recurred. This part of the system is in better shape than the documentation suggests.

### 1.4 The quality brain's output never reaches a customer

This is the finding that matters most. Grepping the entire application for the columns the pipeline spends money to produce:

| Pipeline output | Where it appears in customer-facing code |
|---|---|
| `quality_label` | Admin eval tool only |
| `content_type` | Admin eval tool only |
| `quality_confidence` | Admin eval tool only |
| `is_representative` / `cluster_rep_id` | **Zero references anywhere in the app** |
| `title_en` / `summary_en` / `lang_detected` | **Zero references anywhere in the app** |
| `embedding_1024` | One orphaned API route (§1.6) |

Every one of these is a paid-for LLM output sitting in Postgres with no path to a screen.

The corroboration data is the sharpest example. `hv_dedup_assign` computes clusters at cosine ≥ 0.90 and marks representatives — the raw material for *"14 sources are reporting this, first seen 6 hours ago in Portuguese"*, which is exactly the kind of thing a compliance officer pays for and which no competitor offers. It is computed on every run and displayed nowhere.

The translation layer is the same story: 102 non-English signals have been classified as genuinely valuable, translation runs and writes `title_en`, and the feed renders the **original-language headline** because nothing reads the translated column.

### 1.5 The feed renders the dead scorer as "confidence" and "impact"

`lib/regulatory-signals/public.ts:37-46` derives both user-visible quality badges from `signals.score` — the keyword-density scorer that spec §2.5 diagnosed as *inverted* and §11 lists as "confirmed dead."

It is dead for *promotion*. It is very much alive for *presentation*. Measured against the classifier's own judgment on the 1,181 promoted rows it labels as real signals:

| Rendered badge | Count |
|---|---|
| "low confidence" (`score < 55`) | **987 of 1,181 (84%)** |
| "high confidence" (`score ≥ 80`) | **19 (1.6%)** |
| "critical impact" (`score ≥ 75`) | 29 |

So a feed of signals the validated classifier rates at **precision 1.000** presents 84% of itself to the customer as low-confidence. The instrument the spec spent a month replacing is still the one the customer reads. `quality_confidence` — the validated number — is right there on the same row and is not used.

Two smaller defects in the same mapper: `country_code` and `region` are hard-coded `null` (`public.ts:63-65`), so signals sourced from `public.signals` cannot be filtered geographically on the surface whose entire differentiator is geographic breadth.

### 1.6 A fourth signal store, and an orphaned semantic search

`app/api/signals/search/route.ts` is a complete, well-written hybrid semantic + keyword search endpoint with tier-based auth. It is **called from nowhere in the application**. It also queries `ia_signals` — a separate table with **640 rows and no embedding column at all** — rather than `public.signals`, which holds 12,454 rows and 5,080 embeddings.

So the platform has: a built semantic search with no UI, pointed at the wrong table, while the right table's HNSW index goes unqueried.

Counting honestly, the estate now has **four** parallel signal stores, not the two the spec diagnosed:
1. `lib/scrapers/` marketplace estate
2. `public.signals` — Pipeline B, the canonical one
3. `ia_signals` (640 rows) — semantic search target
4. `editorial_items` → `daily_digest` — the Digest, entirely separate

### 1.7 The Digest is starving, and Stage D is confirmed unaddressed

I read `run_editorial_digest()` in full. It selects from `editorial_items` and has **zero reference** to `public.signals`, `content_type`, or `quality_label`. Stage D of the spec — "do `content_type='story'` signals reach Digest?" — is now answered definitively: **no, and there is no code path by which they could.** 287 story-classified signals have nowhere to go.

Meanwhile the Digest itself is failing quietly:

| Metric | Value |
|---|---|
| Last digest of any kind | **2026-07-23** (7 days ago) |
| Last digest with editorial headlines | **2026-07-19** (11 days ago) |
| Fresh `editorial_items` in last 7 days | **5** |
| Minimum the function requires to fire | 3 |

The cron runs every 15 minutes 06:00–09:00 and reports success — because the function's honest response to starvation is `{"ok": true, "skipped": "fewer than 3 unused editorial items"}`. **A success-reporting no-op.** Nothing alerts on it. The consumer-facing "Daily Wire" has been dark for a week and the monitoring says green.

This is exactly the failure mode Stage G was written to prevent, occurring in a surface Stage G didn't cover.

### 1.8 Source registry — the multilingual gap is structural, not incidental

| Metric | Value |
|---|---|
| Total sources | 1,730 |
| Active | 1,426 |
| **Active and English** | **1,360 (95.4%)** |
| Distinct languages | 33 |
| Countries | 226 |
| Checked in last 7 days | 1,108 |
| **Never checked** | **306** |
| Failing 3+ consecutive times | **278** |

**584 of 1,730 sources (34%) are either dead or never attempted.** Stage K (source-level language expansion) remains unstarted, and the 95.4% English figure has barely moved since Stage 1. Post-hoc translation cannot fix a source list that never captured the document.

### 1.9 Operational debt

- `hv_classify_jobs`: **89,013 rows**, and the table has **no timestamp column** (`request_id, signal_id, harvested`). Stage H's retention design ("drop harvested rows older than N days") is **not implementable as written** — there is no age to filter on. Same for `hv_classify_jobs`, `hv_embed_jobs`, `hv_entity_jobs`; only `hv_translation_jobs` has `dispatched_at`.
- **13 rows classified as `spam` or `boilerplate` are live in the customer-facing feed** — precision leakage from the pre-gate era that was never swept.
- **35 tables have RLS enabled with no policy**, including `classifier_validation` (the gate itself), `excluded_source_domains` (the blocklist), and every `hv_*` job table. Stage B was never completed.
- `api.regulatory_pending_changes_feed()` is a `SECURITY DEFINER` function **executable by `anon`**.
- 9 functions with mutable `search_path`; `pg_trgm`, `pg_net` and `vector` installed in `public`.
- Leaked-password protection is disabled in Supabase Auth.
- **Deploy-integration sprawl outlived the Jul 1 consolidation.** Five git integrations still fire on every PR against a repo whose canonical target is Vercel: Vercel (✅), Cloudflare Pages on account `c9bde393…` (✅), Cloudflare Workers Builds on account **`4a7c450c…`** (❌ perpetually failing), Cloudflare Workers Builds on `c9bde393…` (skipped), and Netlify `harbourviewns` (✅, building previews despite `netlify.toml` having been removed). `HANDOFF.md:552` names the Workers disconnect without an account ID — it is `4a7c450c…`; disconnecting `c9bde393…` instead would remove the passing Pages check and leave the failure. This is dashboard-side work only Tyler can do.
- `npm run test` exists and aggregates four groups (`test:globe-router`, `test:globe-data`, `test:country-role`, plus the public-surface leakage suite). It could not be executed in this session because `node_modules` is not installed in the review sandbox — the same environment gap recorded in the 2026-07-18 and 2026-07-21 evidence-log entries. Worth noting the aggregate covers 4 of the 20+ `test:*` scripts, so "tests pass" in a PR body is a narrower claim than it reads.

### 1.10 The business context that reframes everything

| Metric | Value |
|---|---|
| `user_profiles` | **7** |
| `subscriptions` | **0** |
| `listings` | 84 |
| `marketplace_inquiries` | 54 |
| Pages / API routes / edge functions / migrations | 246 / 97 / 31 / 752 |

Zero paying customers, seven accounts, and a codebase the size of a Series-A company's. The ratio of built surface to validated demand is the central strategic fact of this review.

---

## 2. Direct answers to the questions asked

### "What is the platform missing?"

Not features. **A working path from the intelligence it already produces to a screen a customer looks at.** Concretely, five things:

1. A live feed (currently 9 days stale).
2. Any use of the classifier's judgment in the UI (currently uses the inverted scorer instead).
3. Corroboration display — the single most defensible differentiator, computed and discarded.
4. Translated headlines on non-English signals — computed and discarded.
5. Working search over the corpus — built, orphaned, aimed at the wrong table.

### "Is it fully optimized for the best outcomes?"

No, and the gap is not efficiency — it is **wiring**. The expensive parts (LLM classification, embeddings, translation, clustering) are built and paid for. The cheap parts (reading a column into a badge, a `WHERE` clause on `content_type`, a fetch call to an existing endpoint) are missing. This is unusually good news: the remaining work is mostly frontend plumbing against data that already exists.

### "Is it intelligent and very useful for a customer in the industry?"

**The data is. The product isn't yet.** A compliance officer at a licensed producer visiting today sees a nine-day-old feed where 84% of entries are badged "low confidence," non-English headlines are untranslated, there is no search, and there is no indication that 14 other sources corroborate the top story. Everything needed to fix all four of those is already in the database.

### "Are the data pipelines optimized?"

Mixed, and better than the docs suggest in one dimension and worse in another.

- **Cadence and cost: genuinely good.** Zero cron failures in 48 hours, sub-second runs, Stage E and Stage F both landed and work. The disk-I/O incident is resolved.
- **Throughput: broken.** Ingestion at ~480/day against zero classification and zero promotion.
- **Architecture: still forked.** Four signal stores, not the one conductor Design Principle #4 requires. The Digest estate (§1.7) was never part of the consolidation plan and is now the one actively failing in front of users.

### "Are we getting as much data and info as possible?"

No, on three fronts:

1. **34% of the source registry is dead or unattempted** (584 sources).
2. **95.4% of active sources are English** — the multilingual ask from spec §1 is unaddressed at the source level.
3. **Every signal is treated as an isolated document.** There is no entity resolution across signals into companies, regulators, licences, or timelines — so the same regulator appearing in 40 signals is 40 unrelated rows, not one tracked actor with a history.

### "Could the process be better?"

Yes — and the highest-leverage process fix is **making silence impossible**. Two independent surfaces (the Intel feed and the Daily Wire) have been dark for over a week while every monitor reported green, because the failure mode is a *successful no-op*. Stage G was specified precisely for this and is still marked PARTIAL. A single scheduled freshness assertion — "the feed must have gained a row in 48h; the digest must have published in 48h; else notify" — would have caught both within a day.

The second process fix: **`npm run test` does not exist.** The QA gate that AGENTS.md makes mandatory for every PR cannot have been run as specified.

### "Can it become intelligent on its own?"

Partly today, and substantially more with work that is well within reach. Being precise about what "on its own" can mean here:

**Already autonomous:** ingestion, extraction, classification, embedding, clustering, and gated promotion all run without a human, and the promotion gate mechanically refuses to trust an unvalidated classifier. That is a real self-governing loop and it is better than most products in this category.

**The missing ingredient is a feedback loop.** Right now the system cannot get better from use, because nothing observes use:
- `reviewed_by` shows **0 human reviews, ever** — the eval set is a frozen 202 rows from July, and there is no mechanism by which a correction becomes training signal.
- No telemetry ties a signal to whether anyone read, saved, or acted on it.
- `classifier_version` is a constant string, so a prompt change cannot be A/B'd or attributed.

**What genuine self-improvement would require** (in dependency order, all feasible on the current stack):
1. **A one-click correction affordance** on each signal in the admin feed writing to `intel_eval_set` — turns every review into a labeled example, growing the ground truth from 202 continuously instead of never.
2. **Real `classifier_version` semantics** — hash the prompt, so `classifier_validation` gates per-version and a regression is caught mechanically rather than noticed.
3. **Engagement telemetry** — which signals get opened, saved, exported. This is the reward signal; without it "learning" has nothing to optimize against.
4. **Stratified evaluation by language** — spec §6.2 already flags that a single pooled number can hide the classifier failing badly on Portuguese. With 102 non-English good signals there is now enough to start.
5. **Entity resolution over the corpus** — the step that turns a feed into an intelligence system, because it lets the platform say *"this regulator has moved three times in six months"* rather than showing three unlinked headlines.

Steps 1–3 are the ones that convert Harbourview from *automated* to *self-improving*. Nothing in the current architecture prevents them.

---

## 3. What would make this significantly better

Ordered by (value to a paying customer) ÷ (effort), highest first. Items 1–5 are all reads against data that already exists.

### Tier 1 — Unblock the product (days, not weeks)

**1. Resolve the recall decision and unfreeze the feed.**
The gate is doing its job; the decision behind it is nine days old. Precision is 1.000 — the risk of shipping at 0.559 recall is *incompleteness*, not *wrongness*. For a pre-revenue product with zero users, a feed that is 56% complete and 100% correct beats a feed that is nine days stale by an enormous margin. **Recommendation: set `gate_passed=true`, re-create jobid 47, re-enable jobid 48, and clear the 669-row backlog.** Then fix recall as a product improvement rather than a launch blocker. This is Tyler's call under Stage J and needs explicit sign-off.

**2. Stop rendering the dead scorer as confidence.**
Change `lib/regulatory-signals/public.ts` to derive `confidence` from `quality_confidence` and `impact_level` from the classifier's `impact` column. This is a ~15-line change that stops the product from telling customers its best content is low quality. Ship it with item 1 or the unfrozen feed still looks worthless.

**3. Sweep the 13 spam/boilerplate rows out of the live feed.** One `UPDATE`, and it removes the only visible precision defect.

**4. Surface corroboration.** "Reported by N sources" using `cluster_rep_id`. The data exists; this is a `COUNT(*) ... GROUP BY cluster_rep_id` and a line of JSX. **This is the most differentiated thing the platform could show and it currently shows nothing.**

**5. Use the translated headline.** `COALESCE(title_en, headline)` in the feed mapper. One line. Immediately makes the global coverage legible to an English-reading customer — which is the entire point of having it.

### Tier 2 — Close the structural gaps (1–2 weeks)

**6. Wire the Digest to the pipeline (Stage D).** Either point `run_editorial_digest()` at `content_type IN ('story','research')` signals, or feed qualified `editorial_items` from the same classifier. Today the Daily Wire is starving beside 287 unused story-classified signals.

**7. Freshness alerting that catches successful no-ops (Stage G, properly).** Assert *outcomes*, not job exit codes: feed gained rows in 48h, digest published in 48h, classification backlog below threshold. Both current outages would have been caught in a day.

**8. Connect semantic search to a UI**, pointed at `public.signals` rather than the 640-row `ia_signals`. The endpoint is written. The index exists. This is a search box.

**9. Finish Stage B.** 35 RLS-no-policy tables including the gate and the blocklist; revoke `anon` execute on `api.regulatory_pending_changes_feed()`.

**10. Widen `npm run test`** to cover more than the current four groups, so the mandatory QA gate proves more than it currently does.

**11. Add timestamps to the job tables** so Stage H retention becomes implementable, then implement it against 89,013 rows.

### Tier 3 — Build the compounding advantage (weeks)

**12. Close the learning loop** — correction affordance → growing eval set → versioned classifier → stratified gate (§2, "can it become intelligent on its own", steps 1–4).

**13. Repair or retire the 584 dead sources**, then expand non-English sources at the registry level (Stage K). Fixing what's broken comes first: 278 sources failing repeatedly are consuming crawl budget and returning nothing.

**14. Entity resolution** — the step that turns a signal feed into a market intelligence system.

### The strategic point underneath all of it

With **7 users and 0 subscriptions**, the binding constraint is not platform capability — it is that nobody is using the platform. Tier 1 exists to make the product demonstrable to a first customer within days. **I would not start Tier 3 before someone is paying.** The most valuable thing the codebase could receive in the next month is not another module; it is a single design partner whose usage tells you which of the 246 pages matter.

---

## 4. Corrections to existing control docs

These should be applied so the next session starts from truth:

| Doc | Claim | Live reality |
|---|---|---|
| `INTELLIGENCE_ARCHITECTURE_SPEC.md` §11 | `hv-quality-pipeline` (jobid 47) "currently disabled" | **Does not exist in `cron.job`** — must be re-created, not re-enabled |
| §11 | `score_signal_from_snapshot` "confirmed dead" | Dead for promotion; **still drives customer-visible confidence/impact badges** |
| §8 Stage D | "unverified" whether stories reach Digest | **Verified: they cannot** — `run_editorial_digest()` has no code path to `public.signals` |
| §8 Stage H | Retention = "drop harvested rows older than N days" | **Not implementable** — job tables have no timestamp column |
| §6.4 | Corroboration "not yet surfaced in any UI" | Confirmed — **zero references to `is_representative`/`cluster_rep_id` in the entire app** |
| §2.1 | "Two disconnected scraping estates" | **Four** — add `ia_signals` (640 rows) and the `editorial_items`→`daily_digest` estate |
| `HANDOFF.md:147` (Jul 1 decision 8) | `netlify.toml` "+ ignore script" removed | `netlify.toml` is gone, but `scripts/netlify-ignore-branch-policy.sh` remains, and Netlify `harbourviewns` still builds a preview on every PR |

---

## 5. Evidence

All figures verified live on 2026-07-30 against project `zvxdgdkukjrrwamdpqrg` via `execute_sql`, and against the working tree at commit `3ccb57d`. Key queries: `cron.job` / `cron.job_run_details` (cadence and failure state), aggregate counts over `public.signals` (corpus, staleness, backlog, country spread, score-vs-label cross-tab), `public.classifier_validation` (gate state), `public.source_registry` (coverage and health), `pg_get_functiondef('run_editorial_digest')` (Stage D determination), `get_advisors(type='security')` (RLS and grants), and repo-wide `grep` for pipeline-column usage in `app/`, `lib/`, `components/`.

No writes of any kind were made to the database or to any production surface during this review.
