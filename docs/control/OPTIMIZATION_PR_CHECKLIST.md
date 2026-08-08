# Harbourview optimization — concrete PR checklist

**Status:** Active control doc  
**Owner:** Tyler / Harbourview Team  
**Created:** 2026-08-08  
**Purpose:** Ordered, independently mergeable PRs that wire backend intelligence the platform already produces into customer-facing UI. Derived from `docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md` and `docs/control/FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md`.

**Principle:** The expensive parts (LLM classification, embeddings, translation, clustering) are built. The remaining work is mostly reading columns into badges, counts, and search — not new product modules.

---

## Global rules (every PR)

- No private fields on public/customer surfaces (`contactEmail`, internal review, raw provenance, etc.).
- Prefer `api` schema / invoker-security views for client reads.
- Update `docs/control/PROJECT_REGISTRY.md` when a surface or pipeline changes.
- Run: `npm ci` → typecheck → lint (if runnable) → tests → build.
- Manual smoke on the listed routes after deploy.
- Prefer small PRs; do not batch Tier 1 with Tier 3.

---

## Phase 0 — Pre-flight (ops, may be non-code)

| # | Task | Owner | Done when |
|---|------|--------|-----------|
| 0.1 | Confirm quality pipeline healthy: classify + promote crons active, vault `hv_edge_anon_key` present, budgets ≥ ingest rate | Operator | Feed gains rows within ~24–48h; backlog trending down |
| 0.2 | Note current feed age, promoted count, countries in feed | — | Baseline recorded in PR / evidence log |
| 0.3 | Disconnect duplicate Cloudflare Workers Builds integrations if still failing checks | Tyler | PR checks no longer show colliding identical check names |

---

## Tier 1 — Unblock the product (ship first)

### PR-1 — Confidence & impact from classifier (not dead keyword score)

**Goal:** Stop showing high-precision signals as “low confidence.”

| Item | Detail |
|------|--------|
| **Scope** | Mapper only |
| **Primary files** | `lib/regulatory-signals/public.ts` (and any shared DTO types used by feed UI) |
| **Change** | Derive `confidence` from `quality_confidence` (or equivalent classifier field); derive impact from classifier `impact` / `quality_label` path — **not** legacy `signals.score` |
| **Do not** | Change promotion SQL or gate logic in this PR |
| **Tests** | Unit/fixture: high `quality_confidence` → high badge; null quality → safe fallback |
| **Smoke** | Public intel feed + dashboard signals: badges match classifier, not keyword density |
| **Acceptance** | No customer-facing badge still driven solely by inverted keyword `score` for Pipeline B rows |

### PR-2 — Translated headlines on feed

**Goal:** Non-English coverage is readable.

| Item | Detail |
|------|--------|
| **Scope** | Mapper + optional display label |
| **Primary files** | `lib/regulatory-signals/public.ts`, feed list/card components |
| **Change** | `title: COALESCE(title_en, headline)` (and summary analog if shown); optional `lang` / “Translated” affordance |
| **API** | Ensure public select list includes `title_en`, `summary_en`, `lang_detected` only if already allowed on public view |
| **Smoke** | Known non-English promoted row shows English title when `title_en` present |
| **Acceptance** | Feed never requires user to read source language when translation exists |

### PR-3 — Corroboration (“Reported by N sources”)

**Goal:** Surface the differentiator already computed in DB.

| Item | Detail |
|------|--------|
| **Scope** | Small API enrichment + UI line |
| **Backend** | RPC or view: for `cluster_rep_id`, `COUNT(*)` of cluster members (or precomputed on rep row); only for representatives / promoted rows |
| **Frontend** | Signal card: e.g. “Reported by N sources” when N > 1 |
| **Files** | API route or `lib/regulatory-signals/*`, feed card component |
| **Security** | Counts only; no private source credentials |
| **Smoke** | Clustered signal shows N ≥ 2; singleton shows nothing or “1 source” |
| **Acceptance** | At least one live cluster visible on prod/staging feed with N > 1 |

### PR-4 — Geo on public signal DTO

**Goal:** Geographic filters work on the product differentiator.

| Item | Detail |
|------|--------|
| **Primary files** | `lib/regulatory-signals/public.ts` (today hard-codes `country_code` / `region` null in places) |
| **Change** | Map real `country_code` / region from signal row or join; keep null only when truly unknown |
| **Frontend** | Confirm feed/globe filters use these fields |
| **Smoke** | Filter by a country known to have promoted signals returns rows |
| **Acceptance** | No hard-coded `null` for country on Pipeline B public mapper |

### PR-5 — Sweep spam/boilerplate from live feed

**Goal:** Remove known precision leakage from pre-gate era.

| Item | Detail |
|------|--------|
| **Type** | Data + optional one-time migration or admin script |
| **Change** | `UPDATE` promoted rows still labeled spam/boilerplate (or set `reviewed=false` per product rule) — **operator-approved**, replay-safe, logged |
| **Do not** | Broad delete of unclassified rows |
| **Acceptance** | Zero spam/boilerplate in customer-facing promoted set; count before/after in PR body |

### PR-6 — (Optional same week) Tiny feed polish bundle

Only if PR-1–4 are merged: loading/empty states when feed is fresh, link from card to source without leaking private fields. Keep under ~100 LOC UI.

---

## Tier 2 — Structural product paths

### PR-7 — Semantic search UI → `public.signals`

| Item | Detail |
|------|--------|
| **Backend** | Fix `/api/signals/search` (or successor) to query **`public.signals`** + embeddings / HNSW, not `ia_signals` without embeddings |
| **Auth** | Existing tier gates preserved |
| **Frontend** | Search box on intel feed or Command Centre; call the API |
| **Acceptance** | Query returns ranked hits from main corpus; empty state and auth failures handled |

### PR-8 — Digest ← quality pipeline (Stage D)

| Item | Detail |
|------|--------|
| **Backend** | `run_editorial_digest()` (or parallel path) consumes `content_type IN ('story','research')` (and policy for quality_label) **or** writes qualified rows into `editorial_items` |
| **Do not** | Leave Digest only on starved `editorial_items` with no path from `public.signals` |
| **Ops** | Outcome alert: digest published within 48h or page |
| **Smoke** | After classify of story rows, digest can publish without manual editorial flood |
| **Acceptance** | Documented code path from Pipeline B → Daily Wire; no silent success-only skip without monitoring |

### PR-9 — Freshness / outcome monitors (Stage G)

| Item | Detail |
|------|--------|
| **Change** | Scheduled assertion: feed row newer than 48h; digest published within 48h; classify backlog under threshold; **notify on fail** |
| **Not enough** | Cron exit code success alone |
| **Acceptance** | Forced stale condition triggers alert in staging |

### PR-10 — My Briefings depth (LLM synthesis spine)

| Item | Detail |
|------|--------|
| **Backend** | Job: watch rules + jurisdiction briefings → synthesized briefing artifact (table or storage) |
| **Prefs** | Cadence + markets on user profile / prefs table |
| **Frontend** | `/dashboard/my-briefings` reads job output, not only raw assembly |
| **Acceptance** | One authenticated user with watch rules gets a generated briefing object end-to-end |

### PR-11 — Delivery spine (email / in-app)

| Item | Detail |
|------|--------|
| **Backend** | Reuse signal subscription patterns; queue + template; no secrets in client |
| **Frontend** | Opt-in toggles on watchlist / briefings |
| **Acceptance** | Test send in non-prod; unsubscribe path works |

### PR-12 — Security closeout (can parallel Tier 1)

| Item | Detail |
|------|--------|
| **RLS** | Policies on tables with RLS enabled but zero policies (priority: gate, blocklist, reference tables) |
| **Grants** | Revoke `anon` execute on over-exposed `SECURITY DEFINER` RPCs |
| **Acceptance** | Advisor / manual probe: sensitive RPCs not callable as anon; evidence in PR |

### PR-13 — Job table timestamps + retention (Stage H)

| Item | Detail |
|------|--------|
| **Migration** | Add `created_at`/`dispatched_at` where missing on `hv_*_jobs` |
| **Job** | Drop harvested rows older than N days |
| **Acceptance** | Retention job runs; table growth bounded |

---

## Tier 3 — Frontend architecture & compounding (after Tier 1 is live)

### PR-14a — PRICE cross-check only

| Item | Detail |
|------|--------|
| **Spec** | `docs/control/PRICE_CROSSCHECK_SPEC.md` |
| **Change** | Annotate `PRICE_BENCHMARKS` with `market_metrics` where mappable — additive, read-only |
| **Acceptance** | No replacement of full static structure; clear “live metric” vs reference |

### PR-14b+ — Static CC panels (one PR per domain)

Banking / insurance / logistics / jobs / events / landed cost — each is either:

- New table + ingestion + API, **or**
- Explicit “curated reference” labeling in UI

Do **not** batch all six.

### PR-15 — Command Centre split (sequence, not one PR)

| PR | Slice |
|----|--------|
| 15.1 | Extract one domain (e.g. corridor/logistics) to lazy-loaded module; no behavior change |
| 15.2 | Second domain (compliance or marketplace) |
| 15.3 | … until shell is thin |

**Acceptance each slice:** same routes, no layout regression, measurable smaller initial JS for that path if practical.

### PR-16 — Learning loop (admin)

| Item | Detail |
|------|--------|
| **UI** | One-click correct on admin signal → write `intel_eval_set` (or equivalent) |
| **Backend** | Version stamp on classifier; gate per version |
| **Acceptance** | Correction increases eval set; no path for public users to poison labels |

### PR-17 — Entity resolution (larger epic)

Graph/timeline APIs for regulator/company/licence → FE “actor history” panel. Separate design note before coding.

---

## Suggested merge order (first two weeks)

```
Week 1:  PR-1 → PR-2 → PR-4 → PR-3 → PR-5
         (PR-12 can parallel)
Week 2:  PR-7 → PR-8 → PR-9
         then PR-10 / PR-11 as capacity allows
```

**Do not start** PR-15 monolith split or PR-17 entity epic until Tier 1 is on production and feed is demonstrably fresh.

---

## Per-PR template (copy into GitHub)

```markdown
## Summary
- [ ] Tier / PR id: e.g. PR-1 Confidence mapper

## Why
- Customer-visible issue this fixes

## Changes
- Files / migrations / RPCs

## Security
- [ ] No private fields on public DTO
- [ ] api schema / RLS considered

## QA
- [ ] typecheck / test / build
- [ ] Smoke routes: …

## Evidence
- Before/after counts or screenshots
- PROJECT_REGISTRY updated: yes/no
```

---

## Explicit non-goals for this checklist

- New marketplace modules, BNPL embed, genetics depth, education CPD (roadmap Phase 2) until intel path is visible and fresh
- Rewriting classifier prompts inside SQL
- Pointing product UI at `ia_signals` as the primary corpus

---

## Related docs

- `docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md`
- `docs/control/FRONTEND_DASHBOARD_OPTIMIZATION_PLAN.md`
- `docs/FEATURES_ROADMAP.md`
- `docs/control/PRICE_CROSSCHECK_SPEC.md`
