# Signals Engine — Maximum Automation Design

**Status:** Design specification (docs-only)  
**Date:** 2026-08-16  
**Owner:** Harbourview Intelligence  
**Related:** `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md`, `docs/SOURCE_EXPANSION_PLAN.md`, `docs/harbourview-signal-engine-v1.md`, `docs/QUALITY_PIPELINE_HANDOFF.md`

---

## 1. Objective

Drive human involvement in the Signals Engine to **exception-only** operation:

| Metric | Target (6 months) | Stretch |
|--------|-------------------|--------|
| % of promoted signals via Full Auto | ≥ 85% | ≥ 95% |
| Human review volume | ↓ 70–90% from baseline | Exception-only |
| Precision on auto-promoted set | ≥ 0.95 | ≥ 0.97 |
| Recall on high-value classes | Maintain or improve | — |
| Median time-to-promotion (Full Auto) | < 15 min | Near real-time |

Human effort that remains must compound: every decision improves models so future human effort falls.

---

## 2. High-Level Architecture

```
Source Registry
    ↓
Ingestion (HTML / RSS / API / PDF / JS adapters)
    ↓
Snapshot Store (immutable, content-hashed)
    ↓
Extraction + Translation
    ↓
Multi-Head Classification + Scoring
    ↓
Automated Gate Stack
    ↓
┌──────────────────────┬──────────────────────┐
│  Full Auto / Shadow  │  Exception Queue     │
│  (no human required) │  (rare human touch)  │
└──────────────────────┴──────────────────────┘
    ↓                        ↓
Public / Marketplace     Human Review UI
/ Digest / Graph         + Active Learning Queue
    ↓
SignalDecisionEvent → Continuous Learning Loop
```

Everything defaults to automated paths. Humans only see items that fail high-stakes or high-uncertainty gates, or that the active-learning sampler selects for maximum model improvement.

---

## 3. Autonomy Levels

Explicit, configurable, and recorded on every signal.

| Level | Name           | Behavior                                      | Human |
|-------|----------------|-----------------------------------------------|-------|
| 0     | Discard        | Auto-discard (low confidence / high junk)     | None  |
| 1     | Full Auto      | Promote immediately                           | None  |
| 2     | Shadow         | Promote + log for later audit / training      | Optional later |
| 3     | Exception      | Hold for human (residual target state)        | Required |
| 4     | Human Required | Always hold (new types, high-risk categories) | Required |

Promotion decisions write `autonomy_level`, full `gate_scores`, and `promotion_path` onto the signal record for auditability.

---

## 4. Automated Gate Stack (Ordered)

A candidate must clear every gate to reach Full Auto or Shadow. Failure routes to Discard or Exception.

### Gate 1 — Source Authority
- Score from source tier, primary vs secondary, historical yield, language match, official status.
- Primary regulators and official gazettes receive large positive weight.

### Gate 2 — Multi-Head Classification Consensus
Specialized heads run in parallel:
- Regulatory / Policy
- Commercial Opportunity
- Financing / Capital
- Enforcement / Risk
- Digest Story
- Genetics / Supply
- Organizational / Talent

Require agreement, or high confidence on a single high-precision head, for Full Auto.

### Gate 3 — Confidence & Calibration
- Calibrated model confidence.
- Novelty score.
- Cross-source corroboration count.
- Thresholds are per-signal-type and continuously tuned from evaluation data.

### Gate 4 — Risk Stack
- Entity risk (known bad actors, sanctions, enforcement history).
- Content risk classifiers (unsupported medical/legal claims, promotional language, defamation risk).
- Jurisdiction sensitivity flags.
- High risk forces Exception or Discard even at high confidence.

### Gate 5 — Business Rules
- Configurable allow/deny lists by signal type, country, entity, source.
- Rate limits and diversity constraints to prevent market flooding.

Only items that clear all gates at the required thresholds enter Full Auto or Shadow.

---

## 5. Active Learning Sampler

**Goal:** Minimize human labeling effort while maximizing improvement in classifier, ranker, and risk models. Surface only the most informative candidates.

### 5.1 Candidate Pool

- Items that failed Full Auto (Exception queue + high-uncertainty Shadow items).
- Recent items near decision boundaries.
- Items from under-represented sources, languages, jurisdictions, or signal types.
- Items on which current models disagree (ensemble disagreement).
- Stratified samples for coverage (prevent ignoring rare but important classes).

### 5.2 Acquisition Score

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

Weights (\(\alpha, \beta, \gamma, \delta, \varepsilon\)) are configurable and may be annealed (early: uncertainty + coverage; later: more expected value).

### 5.3 Batch Selection Algorithm

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

### 5.4 Uncertainty Estimators

1. Single-model entropy: \( U(x) = -\sum_c p(c|x) \log p(c|x) \)
2. Margin sampling: \( U(x) = 1 - (p_1 - p_2) \)
3. Ensemble disagreement (preferred when available): variance or average KL across members / prompt variants / dropout-at-inference.
4. Prefer calibrated probabilities (temperature scaling or isotonic regression on validation data).

### 5.5 Diversity & Coverage Mechanics

- Rolling window (or coreset) of recent human-labeled embeddings.
- Cosine distance in the same embedding space used for deduplication.
- Frequency counts per (language, country, signal_type, source_tier); boost rare combinations.
- Periodic pure-exploration batches (higher diversity/coverage weight) to avoid local optima.
- Cold-start for new signal types: force higher sampling rate until a minimum label count exists.

### 5.6 Integration with Exception Queue

- **Exception Queue** = items that *must* be reviewed for safety/policy.
- **Active Learning Sampler** = items that are *most useful* to review for model improvement.
- In practice the queues are merged with a priority that balances safety and learning value.
- When a human labels an item: record `SignalDecisionEvent`, update recent-labels coreset / frequency tables, optionally trigger lightweight model or threshold update.

### 5.7 Starting Hyperparameters

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

### 5.8 Sampler Evaluation

Track:
- Reduction in human labels needed to reach target precision/recall.
- Model performance gain per human hour.
- Coverage of rare slices over time.
- Exception queue volume trend.

Compare against baselines: random, pure uncertainty, pure highest-confidence.

---

## 6. Feedback Capture Schema

Every human action (and every auto decision) is logged:

```ts
interface SignalDecisionEvent {
  signal_id: string
  decision: 'promote' | 'reject' | 'edit' | 'escalate' | 'defer'
  autonomy_level_at_decision: 0 | 1 | 2 | 3 | 4
  human_id?: string
  gate_scores: Record<string, number>
  model_version: string
  edits?: { field: string; old: any; new: any }[]
  reason_codes?: string[]          // structured
  free_text_notes?: string
  timestamp: string
}
```

This table is the training signal for preference optimization and hard-negative mining.

---

## 7. Continuous Learning Loop

1. Nightly / continuous evaluation against expanding labeled set + recent human decisions.
2. Active learning sampler preferentially surfaces highest expected-information-gain items.
3. Preference optimization / light fine-tuning of classifier and ranking heads from decision events.
4. Automatic threshold adjustment: raise Full Auto thresholds when precision is proven; shrink Exception volume over time.
5. Drift detection: alert + temporary gate tightening if performance degrades.

---

## 8. Data Model Additions

Building on existing `signals`, `source_registry`, and related tables:

| Addition | Purpose |
|----------|--------|
| `signals.autonomy_level` | Recorded decision level |
| `signals.gate_scores` (jsonb) | Full gate score breakdown |
| `signals.promotion_path` | `full_auto` \| `shadow` \| `human` \| `rejected` |
| `signals.model_versions` (jsonb) | Versions of all models that scored the item |
| `signal_decision_events` (new table) | Full audit + training data |
| `source_yield_metrics` | Precision, promotion_rate, freshness, junk_rate per source |
| `autonomy_policies` | Configurable thresholds and rules per signal type / jurisdiction |

Exact migration shapes to be defined in a follow-on implementation PR; this document is the contract.

---

## 9. Observability & Control Plane

**Dashboards / metrics**
- % of volume by autonomy level (target: Full Auto + Shadow ≫ Exception).
- Precision / recall / false-positive rate by signal type, language, source tier.
- Human review volume and reason codes (must trend down).
- Cost per auto-promoted high-value signal.
- Gate failure distribution.
- Model drift and calibration metrics.
- Source yield leaderboard + auto-prune candidates.

**Alerts**
- Sudden drop in precision.
- Spike in Exception queue.
- Source yield collapse.
- Cost anomalies.

---

## 10. Progressive Rollout (Safe Path)

1. **Instrument** — Capture all current human decisions and gate scores without changing behavior.
2. **Shadow mode** — Run full gate stack in parallel; log what *would* have been Full Auto.
3. **Measure** — Compare shadow Full Auto set against actual human outcomes; prove precision.
4. **Progressive enablement** — Turn on Full Auto for safest, highest-precision classes first (e.g. clean Tier-1 regulatory notices from primary sources).
5. **Raise thresholds and expand classes** as evidence accumulates.
6. **Reduce human UI surface** — Review interface becomes rare exception inbox + active learning queue + audit tools.

No class moves to Full Auto without measured precision evidence against the evaluation set and recent human decisions.

---

## 11. Implementation Priority Order

1. Decision-event logging + `autonomy_level` / `gate_scores` / `promotion_path` on signals (foundation).
2. Gate stack (start with authority + confidence + basic risk).
3. Shadow mode + measurement harness.
4. Progressive Full Auto enablement on safest classes.
5. Source yield metrics + auto-prune (pairs with Source Expansion Plan).
6. Active learning sampler + preference optimization loop.
7. Specialized multi-head expansion and deeper risk models.

---

## 12. Relationship to Existing Specs

- Does **not** replace `INTELLIGENCE_ARCHITECTURE_SPEC.md`. It layers autonomy, feedback, and active learning on top of the canonical quality brain (translate → classify → embed → dedup → promote).
- Complements `SOURCE_EXPANSION_PLAN.md`: better primary sources + per-source yield reduce the volume of low-value candidates that create review burden.
- Aligns with the closed-loop quality goals already present in the architecture spec; this document makes the human-minimization path explicit and implementable.

---

## 13. Out of Scope for This Document

- Concrete migration SQL (follow-on implementation PR).
- UI wireframes for the residual Exception / Active Learning inbox.
- Choice of specific LLM providers or embedding dimensions (reuse existing platform conventions).
- Changes to public DTO allowlists or RLS (no public exposure changes in this design).

---

*End of design specification.*
