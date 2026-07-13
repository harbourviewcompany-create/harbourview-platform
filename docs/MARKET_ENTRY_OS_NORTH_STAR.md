# Harbourview Market Entry OS — North Star

**Version 1.2** · 2026-07-11 · supersedes v1.1

Status key: ✅ Built · 🟡 Partial · ⬜ Not Started · ⚠️ Open Decision (not a build item — needs a call)

---

## Executive Summary

This is a build-status audit of the Market Entry OS concept — turning Harbourview's existing intelligence into a one-click, per-corridor execution plan — scored against what's actually shipped today. Of the 20 layers, the intelligence-gathering side (Corridor Intelligence, Regulatory Matrix, Market Intelligence, Live Intelligence) is furthest along, because it rides on dossier and crawler infrastructure already in production. The execution side (Workflow Engine, Documentation Engine, Cost Calculator, Timeline Engine) — the layers that would actually make this "one-click" instead of "one more report" — hasn't been started.

Three decisions block that execution work and should be resolved before any new schema is written: how much counterparty detail the public DTO can show (conflicts with the shipped HAR-99/101 decision), what the business model actually is, and whether a low readiness score just prints a to-do list or triggers a warm intro from the network. Recommended path: lock those three decisions, then build one corridor (Canada → Germany) end-to-end starting with the Workflow Engine, before generalizing.

---

## The 20 Layers

| # | Layer | Status | Notes |
|---|-------|--------|-------|
| 1 | Corridor Intelligence | 🟡 | Country intel records (14 populated) and source registry exist. Not structured as corridor *pairs* (origin→destination) with legality/history/risk/difficulty scoring. |
| 2 | Regulatory Matrix | 🟡 | Covered in dossier prose (Denmark, France, Germany, Ghana, Isle of Man). Not a structured, queryable matrix per corridor/product. |
| 3 | Product Classification Engine | ⬜ | No schema differentiating flower/extract/oil/API/genetics requirements. |
| 4 | Required Licenses | 🟡 | Embedded in dossier text. Not structured or linked to workflow steps. |
| 5 | Required Certifications | 🟡 | Same — exists as prose (EU GMP, GACP mentioned in dossiers), not structured. |
| 6 | Documentation Engine | ⬜ | No per-shipment document checklist generator. |
| 7 | Customs Intelligence | ⬜ | No HS codes, tariffs, or clearance-time data modeled. |
| 8 | Regulatory Authority Database | 🟡 | Authorities named in dossiers, no structured contacts/portals/processing-time db. |
| 9 | Workflow Engine | ⬜ | No dependency-graph execution plan generator. This is the core "one-click" mechanic and doesn't exist yet. |
| 10 | Company Intelligence | 🟡 | Marketplace has listings/companies, but importer/broker/lab/freight types aren't modeled distinctly. **Conflicts with CounterpartyStub — see below.** |
| 11 | Commercial Intelligence (buyers) | 🟡 | Marketplace inquiries and deal rooms exist. Buyer-side data (hospitals, tenders, pharmacies) is thin. |
| 12 | Market Intelligence | 🟡 | 16 market metrics seeded, country intel populated. Reasonably strong relative to other layers. |
| 13 | Competitor Intelligence | ⬜ | No competitor volume/facility/partner tracking. |
| 14 | Risk Engine | 🟡 | Maturity Score™ implicitly captures some risk dimension; no dedicated political/currency/supply-chain risk model. |
| 15 | Cost Calculator | ⬜ | No landed-cost estimation logic. |
| 16 | Timeline Engine | ⬜ | No critical-path/bottleneck estimator. |
| 17 | Templates | 🟡 | Dossier template v5 and Strangford doc kit exist. Trade-specific agreements (Quality, GDP SOPs, CAPA) not built. |
| 18 | Live Intelligence | 🟡 | Strongest infrastructure piece — crawler across 1,000+ sources, cadence bug fixed (PR #934). Not yet surfaced as a "what changed" feed tied to active corridor plans. |
| 19 | AI Corridor Advisor | 🟡 | Anthropic gateway wired, match rationale + digest narrative generation exist. The specific corridor Q&A UX in the doc's example isn't built. |
| 20 | Readiness Score | 🟡 | Maturity Score™ /25 exists at country level. Doc wants it at company/shipment level — different unit of analysis. |

**Read on this table:** almost nothing is a clean ✅. The intelligence-gathering layers (1, 2, 12, 18) are furthest along because they're extensions of what the dossier and crawler systems already do. The execution layers (6, 9, 15, 16) — the ones that actually make this "one-click" instead of "one more report" — are all ⬜. That's the real gap between what exists and what the doc describes.

---

## What the Original Doc Is Missing

### Trust & governance
| Item | Status | Notes |
|---|---|---|
| Confidence/freshness scoring per datapoint | ⬜ | Layer 19's example answers "yes" to a controlled-substance question with no hedge or as-of date. Needed before any corridor plan is user-facing. |
| Connect Layer 18 to existing crawler | 🟡 | Infrastructure exists; not wired to corridor plans as a live input. |
| CounterpartyStub conflict | ⚠️ | Layers 10/11 want rich company/buyer detail per corridor. Shipped decision (HAR-99/101) keeps counterparties out of the public DTO. Needs an explicit disclosure-tier decision, not a default assumption. |
| Extend signal→evidence→review→approve→dossier→publish governance to corridor plans | 🟡 | Pipeline exists for dossiers. Doc doesn't say whether corridor plans run through it or are a second, ungoverned path. |

### Content gaps
| Item | Status | Notes |
|---|---|---|
| Gray-area / unclear-answer handling | ⬜ | Every example in the doc is clean-legal. No defined output for "unclear," "contested," or "no." |
| Multi-hop / re-export corridors | ⬜ | Model is single origin→destination. Real trade often routes through a processing/re-export hub. |
| Feedback loop on estimates | ⬜ | Nothing validates a predicted 83-day timeline or approval probability against what actually happened. |

### Bigger picture
| Item | Status | Notes |
|---|---|---|
| Business model | ⚠️ | Zero mention of monetization (subscription / per-report / take-rate / lead-gen). Reclassified from ⬜ — this is a decision, not a build item, and it should decide build order, not follow it. |
| Network integration | ⚠️ | Undecided whether a low readiness score just outputs a to-do list, or triggers an actual intro from the 6,000-contact network. Different product, different moat. |
| Horizontal expansion (pharma, psychedelics, biologics) | ⚠️ | Explicitly flagged in the doc's closing section. Worth deciding on purpose — this dilutes cannabis-specific depth if done by drift instead of decision. |

---

## Value Framework (illustrative — needs real pilot data)

No corridor has run through this system end-to-end yet, so this is a structure to populate from the Canada → Germany pilot, not a measured result.

| Value driver | What it replaces | How to measure |
|---|---|---|
| Research time | Manual regulatory/license/customs lookup per corridor — the same work that produced the Denmark, France, and Germany dossiers by hand | Analyst-hours per corridor, before vs. after Workflow Engine |
| Time-to-market | The doc's own example cites an 83-day predicted approval timeline with no validation loop (see Content gaps, above) | Predicted vs. actual days, once Timeline Engine (16) has real cases to check against |
| Compliance risk avoided | Missed license/certification steps caught late in the process | Count of corridor plans that surface a blocking requirement before shipment vs. after |
| Deal velocity | Marketplace inquiries that stall on missing buyer-side or counterparty context | Time from inquiry to deal-room open, before vs. after Company/Commercial Intelligence layers mature |

Once the pilot corridor runs, replace this table with real before/after numbers — that's the metric to put in front of investors, not a modeled estimate.

### Layer 9 (Workflow Engine) — how it fits together

```mermaid
graph TD
    A["Corridor pair (origin, destination)"] --> C{"Workflow Engine (9)"}
    B["Product classification (3)"] --> C
    D["Regulatory Matrix (2)"] --> C
    E["Required Licenses (4)"] --> C
    F["Required Certifications (5)"] --> C
    G["Customs Intelligence (7)"] --> C
    C --> H["Dependency graph: ordered steps + critical path"]
    H --> I["Documentation Engine (6): per-step checklist"]
    H --> J["Cost Calculator (15): landed cost"]
    H --> K["Timeline Engine (16): predicted days"]
    H --> L["Readiness Score (20): company/shipment level"]
```

---

## Recommended Build Order

1. **Resolve the three open decisions before any schema work** — they change what Layers 9/10/11/20 are even allowed to build:
   - **CounterpartyStub disclosure tier** — Layers 10/11 want rich company/buyer detail per corridor; HAR-99/101 shipped keeping counterparties out of the public DTO. Needs an explicit tier decision.
   - **Business model / monetization** — subscription, per-report, take-rate, or lead-gen changes what the Readiness Score and Workflow Engine outputs need to look like.
   - **Network integration** — whether a low readiness score prints a to-do list or triggers a warm intro from the 6,000-contact network. Different product, different moat.
2. **Pick one corridor** (Canada → Germany — Germany already has the deepest dossier) and build the full stack end-to-end for it before generalizing.
3. **Workflow Engine (9)** first among the ⬜ layers — it's the mechanic that makes everything else feel like "one-click" instead of a report.
4. **Documentation Engine (6)** next — checklist generation is a bounded, high-value slice.
5. **Cost Calculator (15)** and **Timeline Engine (16)** last among near-term work — they depend on data the workflow engine will surface anyway.

---

## Change Log

- **v1.2** (2026-07-11): Fact-checked the closing note against live GitHub state — the four sprint PRs are resolved, not open. Replaced with current status.
- **v1.1** (2026-07-10): Added executive summary. Added Value Framework section with Layer 9 workflow diagram. Reclassified Business Model from ⬜ to ⚠️ (it's a decision, not a build item). Reordered Recommended Build Order to resolve the three open decisions before any corridor/schema work.
- **v1.0** (2026-07-10): Initial 20-layer audit.

---

*Status check (2026-07-11): the four sprint PRs referenced in earlier drafts are resolved — **#921**, **#934**, and **#985** merged; **#962** was closed unmerged after a `package-lock.json` conflict but its work landed on `main` via a manual rebase (commit `8c3a620`, confirmed as an ancestor of `main`). They're no longer a blocker for Market Entry OS work. Five PRs are open as of this check — **#1021** (marketplace ratings forward-fix), **#1022** (compliance-brief rate limiting), **#1023** (heatmap preferences guard), **#1026** (migration drift reconciliation), and this doc's own **#1024** — separate, newer items worth a status pass on their own terms. Track 3 Airtable contract (HAR-52) wasn't reverified in this pass.*
