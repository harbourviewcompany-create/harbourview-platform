# Signals Engine — Maximum Automation Design

**Status:** Design specification (docs-only)  
**Date:** 2026-08-16  
**Owner:** Harbourview Intelligence  
**Related:**  
- `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (canonical pipeline, Stages A–K, guardrails)  
- `docs/SOURCE_EXPANSION_PLAN.md` (Tier-1 native primary sources)  
- `docs/harbourview-signal-engine-v1.md`  
- `docs/QUALITY_PIPELINE_HANDOFF.md`  
- `docs/API_SOURCE_INTEGRATION.md`

---

## 1. Objective

Drive human involvement in the Signals Engine to **exception-only** operation while making the system self-improving and competitively superior on measurable grounds.

| Metric | Target (6 months) | Stretch |
|--------|-------------------|--------|
| % of promoted signals via Full Auto | ≥ 85% | ≥ 95% |
| Human review volume | ↓ 70–90% from baseline | Exception-only |
| Precision on auto-promoted set | ≥ 0.95 | ≥ 0.97 |
| Recall on high-value classes | Maintain or improve (≥ 0.70 stratified) | — |
| Median time-to-promotion (Full Auto) | < 15 min | Near real-time |
| Cost per high-value promoted signal | Decreasing quarter-over-quarter | — |
| Native-language primary source share of promoted set | ≥ 25% | ≥ 40% |

Human effort that remains must compound: every decision improves models so future human effort falls.

---

## 2. Prerequisites (must land before aggressive autonomy)

This design **layers on** the canonical quality brain. It does not replace `INTELLIGENCE_ARCHITECTURE_SPEC.md`. The following must be true (or explicitly accepted as residual risk) before Full Auto is enabled for any class:

1. **One canonical pipeline** — Pipeline B (`hv_*`) is the only live promotion path. Pipeline A remains deprecated; no third parallel implementation.
2. **Mechanical validation gate** — `hv_promote_signals` already refuses to promote unless `classifier_validation.gate_passed = true` for the row’s `classifier_version`. This design extends that pattern; it never bypasses it.
3. **Compute & budget headroom** — Nano-tier disk I/O and daily LLM spend ceilings (Stage E/F of the architecture spec) are respected. New loops (sampler, preference optimization, yield metrics) inherit the same hard ceilings.
4. **Observable pipeline** — `hv_pipeline_health()` (or successor) surfaces backlog, gate status, and cron state. Active alerting channel still an open owner decision; autonomy work must not reintroduce silent multi-hour failures.
5. **Source quality path started** — Tier-1 native primary source load from `SOURCE_EXPANSION_PLAN.md` is in progress or complete for flagship markets. Autonomy on a 97%-English secondary-press firehose amplifies noise.

If any prerequisite is false, stay in Instrument + Shadow only.

---

## 3. High-Level Architecture

```
Source Registry (+ Tier-1 native primaries + yield metrics)
    ↓
Ingestion (HTML / RSS / API / PDF / JS adapters)
    ↓
Snapshot Store (immutable, content-hashed)
    ↓
Extraction + Translation
    ↓
Multi-Head Classification + Scoring
    ↓
Automated Gate Stack  ←── autonomy_policies (versioned thresholds)
    ↓
┌──────────────────────┬──────────────────────┐
│  Full Auto / Shadow  │  Exception + AL Queue│
│  (no human required) │  (rare human touch)  │
└──────────────────────┴──────────────────────┘
    ↓                        ↓
Public / Marketplace     Human Review UI
/ Digest / Graph         (safety + active learning)
    ↓
SignalDecisionEvent → Continuous Learning Loop
    ↓
source_yield_metrics · classifier_validation · autonomy_policies
```

Everything defaults to automated paths. Humans only see items that fail high-stakes or high-uncertainty gates, or that the active-learning sampler selects for maximum model improvement.

---

## 4. Autonomy Levels

Explicit, configurable, and recorded on every signal.

| Level | Name           | Behavior                                      | Human |
|-------|----------------|-----------------------------------------------|-------|
| 0     | Discard        | Auto-discard (low confidence / high junk)     | None  |
| 1     | Full Auto      | Promote immediately                           | None  |
| 2     | Shadow         | Promote + log for later audit / training      | Optional later |
| 3     | Exception      | Hold for human (residual target state)        | Required |
| 4     | Human Required | Always hold (new types, high-risk categories) | Required |

Promotion decisions write `autonomy_level`, full `gate_scores`, and `promotion_path` onto the signal record for auditability.

**Compatibility with live path:**  
`promotion_path = 'full_auto' | 'shadow'` still goes through `hv_promote_signals` (or its successor) and still requires `classifier_validation.gate_passed = true`. Autonomy never invents a second, ungated promotion function.

---

## 5. Automated Gate Stack (Ordered)

A candidate must clear every gate to reach Full Auto or Shadow. Failure routes to Discard or Exception.

### Gate 1 — Source Authority
- Inputs: `source_registry.tier`, primary vs secondary, historical yield (`source_yield_metrics`), language match, official/regulator/gazette flags.
- Primary regulators and official gazettes receive large positive weight.
- Sources with sustained near-zero yield are soft-blocked or forced to Exception.

### Gate 2 — Multi-Head Classification Consensus
Specialized heads (or strongly conditioned prompts) run in parallel:

| Head | Primary `content_type` / use |
|------|------------------------------|
| Regulatory / Policy | regulatory → Signals feed |
| Commercial Opportunity | market → marketplace candidates |
| Financing / Capital | market / story → financing surfaces |
| Enforcement / Risk | regulatory + risk flags |
| Digest Story | story / research → Digest |
| Genetics / Supply | market → genetics / supply surfaces |
| Organizational / Talent | story / market → talent / network |

Require agreement across heads, or high confidence on a single high-precision head, for Full Auto. Disagreement → Exception or Shadow.

### Gate 3 — Confidence & Calibration
- Calibrated model confidence (temperature scaling / isotonic on validation set).
- Novelty score (embedding distance to recent promoted set).
- Cross-source corroboration count (cluster size / independent sources).
- Thresholds are **per signal type and per language family**, stored in `autonomy_policies`, and only raised when stratified eval evidence supports it.

### Gate 4 — Risk Stack
- Entity risk (known bad actors, sanctions, enforcement history via `ia_graph_entities` / risk flags).
- Content risk classifiers (unsupported medical/legal claims, promotional language, defamation risk).
- Jurisdiction sensitivity flags.
- High risk forces Exception or Discard even at high confidence.

### Gate 5 — Business Rules
- Configurable allow/deny lists by signal type, country, entity, source.
- Rate limits and diversity constraints (prevent flooding one market).
- Respect existing `excluded_source_domains` and any future blocklists.

Only items that clear all gates at the required thresholds enter Full Auto or Shadow.

### 5.1 Starting threshold sketch (non-binding until measured)

| Class | Full Auto min confidence | Min corroboration | Source tier | Notes |
|-------|--------------------------|-------------------|-------------|-------|
| Tier-1 primary regulatory notice | 0.90 | 1 (self) | 1 | Safest first enablement class |
| Clean commercial opportunity (structured) | 0.92 | 1 | 1–2 | After regulatory proves out |
| Digest story | 0.93 | 2 | any | Higher bar; narrative risk |
| Enforcement / sensitive jurisdiction | — | — | — | Stay Human Required until risk models mature |
| New signal type (< N labels) | — | — | — | Human Required until cold-start quota met |

Exact numbers live in `autonomy_policies` and change only with eval evidence + owner sign-off for irreversible widenings.

---

## 6. Active Learning Sampler

**Goal:** Minimize human labeling effort while maximizing improvement in classifier, ranker, and risk models. Surface only the most informative candidates.

### 6.1 Candidate Pool

- Items that failed Full Auto (Exception queue + high-uncertainty Shadow items).
- Recent items near decision boundaries.
- Items from under-represented sources, languages, jurisdictions, or signal types.
- Items on which current models disagree (ensemble disagreement).
- Stratified samples for coverage (prevent ignoring rare but important classes).

### 6.2 Acquisition Score

For each candidate \( x \):

\[
A(x) = \alpha \cdot U(x) + \beta \cdot D(x) + \gamma \cdot C(x) + \delta \cdot V(x) + \varepsilon \cdot R(x)
\]

| Component | Meaning | Computation |
|-----------|---------|-------------|
| **U(x)** Uncertainty | Model uncertainty | Entropy of predictive distribution, or 1 − max probability. Ensemble: average pairwise disagreement or probability variance. |
| **D(x)** Diversity / Novelty | Difference from recently labeled items | Embedding-space distance to k-nearest already-labeled examples (or labeled-set centroid). |
| **C(x)** Coverage / Rarity | Value of filling under-represented slices | Inverse frequency of (language × country × signal_type × source_tier) bucket in recent labeled set. |
| **V(x)** Expected Value | Potential business impact if correct | Predicted commercial impact × novelty × source authority. |
| **R(x)** Risk / Sensitivity | Cost of being wrong | Entity risk, sensitive jurisdictions, medical/legal claim density. Up-weighted while risk models mature. |

Weights (\(\alpha, \beta, \gamma, \delta, \varepsilon\)) are configurable and may be annealed (early: uncertainty + coverage; later: more expected value). Acquisition-function version is stored on every sampled batch for A/B and audit.

### 6.3 Batch Selection Algorithm

```text
function activeLearningBatch(pool, batchSize, recentLabels):
    scored = []
    for x in pool:
        u = uncertainty(x)
        d = diversity(x, recentLabels)
        c = coverageScore(x, recentLabels)
        v = expectedValue(x)
        r = riskScore(x)
        A = α*u + β*d + γ*c + δ*v + ε*r
        scored.append((A, x))

    batch = diverseTopK(scored, batchSize, embedding_similarity_threshold)
    batch = enforceQuotas(batch)   # min % non-English, min % per major signal type, etc.
    return batch
```

**diverseTopK** options:
- Greedy: repeatedly pick highest remaining score that is sufficiently far (cosine) from already selected items.
- Maximal Marginal Relevance (MMR) or Determinantal Point Process (DPP) for stronger diversity.

### 6.4 Uncertainty Estimators

1. Single-model entropy: \( U(x) = -\sum_c p(c|x) \log p(c|x) \)
2. Margin sampling: \( U(x) = 1 - (p_1 - p_2) \)
3. Ensemble disagreement (preferred when available): variance or average KL across members / prompt variants / dropout-at-inference.
4. Prefer calibrated probabilities (temperature scaling or isotonic regression on validation data).

### 6.5 Diversity & Coverage Mechanics

- Rolling window (or coreset) of recent human-labeled embeddings.
- Cosine distance in the same embedding space used for deduplication (`embedding_1024` or current platform default).
- Frequency counts per (language, country, signal_type, source_tier); boost rare combinations.
- Periodic pure-exploration batches (higher diversity/coverage weight) to avoid local optima.
- Cold-start for new signal types: force higher sampling rate until a minimum label count exists.

### 6.6 Integration with Exception Queue

- **Exception Queue** = items that *must* be reviewed for safety/policy.
- **Active Learning Sampler** = items that are *most useful* to review for model improvement.
- In practice the queues are merged with a priority that balances safety and learning value.
- When a human labels an item: record `SignalDecisionEvent`, update recent-labels coreset / frequency tables, optionally trigger lightweight model or threshold update.

### 6.7 Starting Hyperparameters

| Parameter | Starting value | Notes |
|-----------|----------------|-------|
| α (Uncertainty) | 0.40 | Highest early on |
| β (Diversity) | 0.25 | Prevents redundant labels |
| γ (Coverage) | 0.15 | Long-tail languages/markets |
| δ (Expected Value) | 0.15 | Business alignment |
| ε (Risk) | 0.05–0.20 | Higher while risk models mature |
| Batch size | 25–50 / day | Match available human capacity |
| Diversity similarity threshold | 0.85–0.92 cosine | Avoid near-duplicates in batch |

Tune offline by simulating labeling sequences on historical data (which sequence improves the model fastest).

### 6.8 Sampler Evaluation

Track:
- Reduction in human labels needed to reach target precision/recall.
- Model performance gain per human hour.
- Coverage of rare slices over time.
- Exception queue volume trend.

Compare against baselines: random, pure uncertainty, pure highest-confidence.

### 6.9 Job / queue design

- Sampler runs as a scheduled job (not inside the hot promote path), subject to the same daily budget ceilings as other `hv_*` dispatch functions.
- Writes a small batch of `signal_review_queue` (or equivalent) rows with `reason = 'active_learning' | 'exception' | 'policy'` and full score breakdown.
- Idempotent: re-running the same day does not duplicate queue rows for the same `signal_id`.

---

## 7. Feedback Capture Schema

Every human action (and every auto decision) is logged:

```ts
interface SignalDecisionEvent {
  id: string                       // uuid
  signal_id: string
  decision: 'promote' | 'reject' | 'edit' | 'escalate' | 'defer'
  autonomy_level_at_decision: 0 | 1 | 2 | 3 | 4
  promotion_path?: 'full_auto' | 'shadow' | 'human' | 'rejected'
  human_id?: string                // null for auto
  gate_scores: Record<string, number>
  acquisition_scores?: Record<string, number>  // if from AL sampler
  model_versions: Record<string, string>
  classifier_version?: string
  edits?: { field: string; old: unknown; new: unknown }[]
  reason_codes?: string[]          // structured, preferred over free text
  free_text_notes?: string
  created_at: string               // timestamptz
}
```

This table is the training signal for preference optimization and hard-negative mining. Auto decisions are also logged (with `human_id` null) so the full decision distribution is observable.

---

## 8. Continuous Learning Loop

1. Nightly / continuous evaluation against expanding labeled set + recent human decisions.
2. Active learning sampler preferentially surfaces highest expected-information-gain items.
3. Preference optimization / light fine-tuning of classifier and ranking heads from decision events.
4. Automatic threshold adjustment proposals: raise Full Auto thresholds when stratified precision is proven; shrink Exception volume over time. **Applying** a raise requires the same mechanical discipline as classifier_validation (versioned policy row + gate).
5. Drift detection: alert + temporary gate tightening if performance degrades.
6. Eval-set expansion: every N human decisions, sample a stratified subset into the durable eval set (not only the online decision log) so the gate cannot overfit to a fixed 202-row set.

---

## 9. Data Model Additions (contract)

Building on existing `signals`, `source_registry`, `classifier_validation`, `hv_*` job tables.

### 9.1 Columns on `public.signals` (or projection view if preferred)

| Column | Type | Purpose |
|--------|------|--------|
| `autonomy_level` | smallint | 0–4 as defined above |
| `gate_scores` | jsonb | Full gate score breakdown |
| `promotion_path` | text | `full_auto` \| `shadow` \| `human` \| `rejected` |
| `model_versions` | jsonb | Versions of all models that scored the item |

These coexist with existing `reviewed` / `reviewed_by` / `reviewed_at` / `quality_*` columns. Do not invent a second reviewed flag.

### 9.2 New table: `signal_decision_events`

```sql
-- Sketch only; implementation PR owns the migration.
create table public.signal_decision_events (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id),
  decision text not null check (decision in ('promote','reject','edit','escalate','defer')),
  autonomy_level_at_decision smallint not null check (autonomy_level_at_decision between 0 and 4),
  promotion_path text,
  human_id uuid references auth.users(id),
  gate_scores jsonb not null default '{}',
  acquisition_scores jsonb,
  model_versions jsonb not null default '{}',
  classifier_version text,
  edits jsonb,
  reason_codes text[],
  free_text_notes text,
  created_at timestamptz not null default now()
);

create index on public.signal_decision_events (signal_id, created_at desc);
create index on public.signal_decision_events (created_at desc);
create index on public.signal_decision_events (decision, created_at desc);
```

### 9.3 New table: `source_yield_metrics`

Incremental or materialized metrics per source (and optionally per language):

| Column | Purpose |
|--------|--------|
| `source_id` | FK to `source_registry` |
| `window_start` / `window_end` | Metric window |
| `n_snapshots` / `n_signals` / `n_promoted` | Volume |
| `junk_rate` | share quality_label in (spam, nav, boilerplate) |
| `promotion_rate` | promoted / signals |
| `precision_proxy` | from human decisions when available |
| `freshness_hours_p50` | median lag |
| `updated_at` | |

Used by Gate 1 and by auto-prune / cadence prioritization (pairs with `SOURCE_EXPANSION_PLAN.md` §4).

### 9.4 New table: `autonomy_policies`

Versioned thresholds and rules:

| Column | Purpose |
|--------|--------|
| `policy_version` | text, unique |
| `signal_class` | e.g. tier1_regulatory, digest_story |
| `full_auto_min_confidence` | numeric |
| `min_corroboration` | int |
| `allowed_source_tiers` | int[] |
| `requires_human` | boolean |
| `gate_passed` | boolean — mechanical; promotion autonomy respects this |
| `validated_at` / `metrics` | jsonb evidence |
| `created_at` | |

Mirrors the spirit of `classifier_validation`: no silent widening of Full Auto without a validated policy row.

### 9.5 Optional: `signal_review_queue`

Unified Exception + Active Learning inbox:

| Column | Purpose |
|--------|--------|
| `signal_id` | |
| `reason` | `exception` \| `active_learning` \| `policy` |
| `priority` | computed |
| `acquisition_scores` | jsonb |
| `status` | `open` \| `claimed` \| `done` |
| `claimed_by` / `claimed_at` | |
| `created_at` | |

### 9.6 RLS

- All new tables: RLS enabled.
- `anon` / non-admin `authenticated`: deny all.
- Admin (existing `is_signal_admin()` or platform admin convention): full access.
- `service_role`: insert/update on processing tables only as needed for pipeline and sampler jobs.
- No public DTO exposure of decision events, gate scores, or yield internals (align with `HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md`).

Exact migration SQL is owned by implementation PRs; this section is the contract.

---

## 10. Source Yield + Auto-Prune (pairs with Source Expansion)

Autonomy fails if the input estate is mostly junk. This design requires the self-curating source loop from `SOURCE_EXPANSION_PLAN.md`:

1. Compute per-source yield after each classify/promote cycle.
2. Deactivate or slow sources with near-zero signal yield (pure SEO/nav).
3. Accelerate high-yield primary sources (especially Tier-1 native regulators/gazettes).
4. Feed `source_expansion_coverage_queue` when promoted volume by market/language is below target.

Gate 1 reads these metrics. Prune decisions should be logged (reason + metrics snapshot) for audit.

---

## 11. Multi-Surface Extraction & Knowledge Graph

### 11.1 Multi-surface heads

Routing must become real (Architecture Spec §4.3 / Stage D gap):

- `content_type='regulatory'` → Signals feed  
- `content_type='story'` / `research'` → Digest  
- `content_type='market'` → Signals + marketplace candidate paths  

Full Auto enablement is **per surface**. Digest story can lag regulatory notices.

### 11.2 Knowledge graph deepening

Existing `signal_entities` / `ia_graph_entities` are the base. Maximum automation benefits from:

- Temporal edges (entity relationships over time).
- Counterparty risk scores fed into Gate 4.
- Corroboration and “why this matters” features for ranking and V(x).
- Entity resolution quality as a first-class metric (bad resolution → false risk or missed risk).

Graph enrichment jobs inherit the same budget ceilings as other `hv_*` stages and should not run on the hot promote path.

---

## 12. Exception / Active Learning UI — Acceptance Criteria

No wireframes in this doc; implementation must satisfy:

1. Single inbox merging Exception + Active Learning, filterable by `reason`.
2. Each item shows: headline/summary, source + tier, gate_scores breakdown, acquisition_scores (if AL), cluster/corroboration, entity risk flags, model versions.
3. Actions: promote / reject / edit / escalate / defer — each writes `signal_decision_events` with structured `reason_codes`.
4. Claim/lock so two admins do not double-work the same row.
5. Keyboard-efficient review path (high volume early; low volume later).
6. Audit view: history of decisions for a signal and for a human reviewer.
7. No private fields leak to public routes (DTO allowlist discipline).

---

## 13. Observability, Cost, and Proof Metrics

### 13.1 Operational dashboards

- % volume by autonomy level (target: Full Auto + Shadow ≫ Exception).
- Precision / recall / FP rate by signal type, language, source tier (stratified).
- Human review volume and reason codes (must trend down).
- Cost per auto-promoted high-value signal (LLM + compute).
- Gate failure distribution.
- Model drift and calibration metrics.
- Source yield leaderboard + auto-prune candidates.
- Sampler efficiency: labels needed to move precision/recall by Δ.

### 13.2 Alerts

- Sudden drop in precision (stratified).
- Spike in Exception queue depth or age.
- Source yield collapse.
- Cost / budget ceiling hit.
- `classifier_validation` or `autonomy_policies` gate closed unexpectedly.
- Pipeline health degradation (reuse / extend `hv_pipeline_health`).

### 13.3 Competitive / proof instrumentation

To claim superiority with numbers, not marketing:

- Coverage: promoted signals by country × language × primary vs secondary source.
- Freshness: p50/p90 time from source publish → promote.
- Precision/recall on held-out eval (and by language once non-English eval mass exists).
- Conversion: promoted signal → marketplace inquiry / watchlist hit / briefing use (where measurable).
- Cost efficiency vs volume.

These metrics should be reproducible queries, not one-off notebooks.

### 13.4 Cost controls

- Sampler, preference optimization, and yield aggregation jobs consume `hv_dispatch_budget` (or successor) like other stages.
- Hard daily ceilings; refuse to fire past budget rather than degrade the DB.
- Preference optimization / fine-tune jobs are offline and rate-limited; never block ingest/promote.

---

## 14. Progressive Rollout (Safe Path)

1. **Instrument** — Capture all current human decisions and gate scores without changing behavior. Ship `signal_decision_events` + column additions in nullable/default-safe form.
2. **Shadow mode** — Run full gate stack in parallel; log what *would* have been Full Auto. No user-visible change.
3. **Measure** — Compare shadow Full Auto set against actual human outcomes and eval set; prove stratified precision.
4. **Progressive enablement** — Turn on Full Auto for safest classes first (Tier-1 primary regulatory notices). Requires `autonomy_policies.gate_passed = true` for that class.
5. **Raise thresholds and expand classes** as evidence accumulates (owner sign-off for irreversible widenings).
6. **Reduce human UI surface** — Review interface becomes rare exception inbox + active learning queue + audit tools.
7. **Source expansion + yield prune** in parallel once pipeline is stable under autonomy load.

No class moves to Full Auto without measured precision evidence against the evaluation set and recent human decisions. No bypass of `classifier_validation`.

---

## 15. Failure Modes & Rollback

| Failure | Detection | Response |
|---------|-----------|----------|
| Precision collapse on auto-promoted set | Stratified eval / human override rate spike | Auto-tighten: set affected `autonomy_policies.gate_passed = false`; fall back to Exception |
| Exception queue flood | Depth / age alerts | Raise discard threshold; slow low-yield sources; temporary Human Required on noisy classes |
| Budget exhaustion | `hv_dispatch_budget` / cost alerts | Sampler and non-critical jobs stop first; promote path stays protected |
| Bad policy version | Gate metrics / owner review | Revert `autonomy_policies` row; promote path reads only `gate_passed = true` |
| Pipeline / DB overload | `hv_pipeline_health`, Disk IO advisory | Disable sampler + non-essential crons first (same discipline as 2026-07-21 load-shed) |

Rollback for this design’s runtime pieces is: close Full Auto policies, keep decision logging, resume human Exception path. Docs-only phase has zero runtime rollback need.

---

## 16. Implementation Priority Order

Aligned with the broader roadmap and Architecture Spec stages:

| Order | Work | Depends on |
|-------|------|------------|
| 0 | Pipeline unification soak + reliable automation on controlled compute (Architecture Spec Stages E/G/J as needed) | Owner sign-off on cron re-enable |
| 1 | Decision-event logging + `autonomy_level` / `gate_scores` / `promotion_path` columns | Migrations + RLS |
| 2 | Gate stack (authority + confidence + basic risk) in **shadow** | 1 |
| 3 | Measurement harness (shadow vs human vs eval) | 2 |
| 4 | `autonomy_policies` + progressive Full Auto on safest class only | 3 + classifier_validation healthy |
| 5 | Source yield metrics + auto-prune | Source Expansion Plan execution |
| 6 | Active learning sampler + review queue UI | 1, 2 |
| 7 | Preference optimization loop + eval-set expansion | 6 |
| 8 | Multi-head expansion, deeper risk models, graph features for Gate 4 / V(x) | Stable Full Auto on core classes |
| 9 | Proof metrics dashboard + competitive instrumentation | Data from 4–8 |

---

## 17. Mapping to INTELLIGENCE_ARCHITECTURE_SPEC

| This design | Architecture Spec |
|-------------|-------------------|
| Prerequisites / Phase 0 | Stages E, F, G, J (cadence, budget, alerting, re-enable) |
| Mechanical policy gate for autonomy | Extends Stage C (`classifier_validation`) pattern |
| Multi-surface routing | Stage D (content_type → Digest/Signals) |
| Source yield + Tier-1 natives | Stage K + `SOURCE_EXPANSION_PLAN.md` |
| Guardrails | Section 9 — verify writer, mechanical gates, promotion only promotes, cost ceilings in code, no parallel third pipeline |

This document does **not** authorize a third promotion path or unvalidated auto-promote.

---

## 18. Relationship to Existing Specs

- Does **not** replace `INTELLIGENCE_ARCHITECTURE_SPEC.md`. It layers autonomy, feedback, and active learning on top of the canonical quality brain (translate → classify → embed → dedup → promote).
- Complements `SOURCE_EXPANSION_PLAN.md`: better primary sources + per-source yield reduce the volume of low-value candidates that create review burden.
- Aligns with closed-loop quality goals already present in the architecture spec; this document makes the human-minimization path explicit and implementable.
- Respects public/private DTO allowlist: decision events, gate scores, and yield internals stay private.

---

## 19. Out of Scope for This Document

- Concrete production migration files (follow-on implementation PRs).
- Visual UI mockups (acceptance criteria only).
- Choice of specific LLM providers or embedding dimensions (reuse platform conventions: OpenAI-first per current funding decision unless owner revisits).
- Changes to public DTO allowlists or weakening of RLS.
- Replacing `hv_promote_signals` with an ungated alternative.

---

## 20. Open Decisions for Owner (Tyler)

1. **Recall bar for classifier_validation** — still open in Architecture Spec; autonomy Full Auto should not widen while the underlying gate is intentionally closed.
2. **First Full Auto class** — confirm Tier-1 primary regulatory notices as the pilot class.
3. **Daily human review capacity** — sets AL batch size and Exception SLA.
4. **Alerting channel** — required for safe autonomy (email/SMS/push).
5. **Compute tier** — Nano vs paid headroom before sustained Full Auto + sampler load.
6. **Preference optimization cadence and spend ceiling** — offline job budget.
7. **Whether Shadow promotions are user-visible** or logged-only until audit passes.

---

*End of design specification.*
