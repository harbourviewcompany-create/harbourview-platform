# Harbourview Market Entry OS — North Star

Status key: ✅ Built · 🟡 Partial · ⬜ Not Started · ⚠️ Open Decision (not a build item — needs a call)

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
| Business model | ⬜ | Zero mention of monetization (subscription / per-report / take-rate / lead-gen). This should decide build order, not follow it. |
| Network integration | ⚠️ | Undecided whether a low readiness score just outputs a to-do list, or triggers an actual intro from the 6,000-contact network. Different product, different moat. |
| Horizontal expansion (pharma, psychedelics, biologics) | ⚠️ | Explicitly flagged in the doc's closing section. Worth deciding on purpose — this dilutes cannabis-specific depth if done by drift instead of decision. |

---

## Recommended Build Order

1. **Pick one corridor** (Canada → Germany — already has the deepest dossier) and build the full stack end-to-end for it before generalizing.
2. **Workflow Engine (9)** first among the ⬜ layers — it's the mechanic that makes everything else feel like "one-click" instead of a report.
3. **Documentation Engine (6)** next — checklist generation is a bounded, high-value slice.
4. Resolve the two ⚠️ items that change architecture before writing schema: **CounterpartyStub disclosure tier** and **business model**. Both affect what Layers 10/11 are even allowed to show.
5. Cost Calculator (15) and Timeline Engine (16) last among near-term work — they depend on data the workflow engine will surface anyway.

---

*Four PRs (#921, #934, #962, #985) and the Track 3 Airtable contract are still open from the current sprint. This is a second major build, not a finishing touch — worth sequencing deliberately rather than starting in parallel.*
