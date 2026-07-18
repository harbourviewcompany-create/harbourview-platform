# Harbourview Market Entry OS — North Star

**Version 1.5** · 2026-07-18 · supersedes v1.4

Status key: ✅ Built · 🟡 Partial · ⬜ Not Started · ⚠️ Open Decision (not a build item — needs a call)

---

## Executive Summary

This is a build-status audit of the Market Entry OS concept — turning Harbourview's existing intelligence into a one-click, per-corridor execution plan — scored against what's actually shipped today. Of the 20 layers, the intelligence-gathering side (Corridor Intelligence, Regulatory Matrix, Market Intelligence, Live Intelligence) is furthest along, because it rides on dossier and crawler infrastructure already in production. The execution side (Workflow Engine, Documentation Engine, Cost Calculator, Timeline Engine) — the layers that would actually make this "one-click" instead of "one more report" — hasn't been started.

All four of the original blocking decisions are now resolved (as of v1.5, 2026-07-18): **business model is per-report** (Tyler — one-time fee per corridor plan generated, not subscription or take-rate), **`jurisdiction_playbooks` is the canonical knowledge graph**, **CounterpartyStub disclosure holds at HAR-99/101** (no raw counterparty contact data in report output — see Bigger Picture table), and **network integration is reports-only, no automated intro-triggering** (see same table). No new schema work is blocked by an open decision as of this version. Recommended path: build one corridor (Canada → Germany) end-to-end starting with the Documentation Engine and Workflow Engine — now the actual product being sold, not a bonus on top of a subscription — before generalizing.

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
| 10 | Company Intelligence | 🟡 | Marketplace has listings/companies, but importer/broker/lab/freight types aren't modeled distinctly. **CounterpartyStub disclosure tier resolved 2026-07-18 (HAR-99/101 holds) — see below.** |
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

## Reconciliation with the 2026-07-18 AI Market Entry Engine Handoff

A newer solution-architecture handoff doc — "Harbourview Platform – AI Market Entry Engine," received as a pasted brief for an external SA quote on 2026-07-18, not itself a file checked into this repo — describes the same "press one button, enter a market" concept as this North Star, but breaks out four things the 20-layer table above doesn't track as separate build items: a named multi-agent architecture, an explicit knowledge graph, a continuous data-ingestion platform, and a specific tech stack. Reconciled against current codebase state as inspected on 2026-07-18 (a snapshot, not a re-verified live check at read time):

| New-doc concept | Status | Evidence |
|---|---|---|
| Multi-agent architecture (30 named agents: Regulatory, Trade, Pricing, ...) | 🟡 Scaffolding only | `supabase/migrations/20260531000000_intelligence_automation_tables.sql` (the GitHub #458 build, closed 2026-05-29) created `ia_agent_tasks` (work queue), `ia_graph_entities`, `ia_graph_edges`, `ia_evidence_vault`, `ia_counterparties`, `ia_scoring_records`, with a full admin UI at `app/admin/(protected)/intelligence-automation/*`. No code inserts into these tables via an LLM or autonomous agent — `agent_label`/`suggested_action` are free-text fields filled through human admin actions (`AgentTaskActions.tsx`). This is a human-operated work-queue UI with the right shape, not the multi-agent orchestration the new doc describes. |
| Knowledge graph | ✅ Resolved 2026-07-18 — `jurisdiction_playbooks` is canonical | `supabase/migrations/20260607140000_cannabis_data_contract_v1_p0_p1.sql` builds a structurally richer 23-table typed graph (`cannabis_intelligence` schema — jurisdictions, licence_types, entity_licences, evidence_claims, contradictions, etc.), but it's seeded for only 5 jurisdictions and a repo-wide `.ts`/`.tsx` search found it referenced only by a test file (`tests/cannabis-data-contract/migration.test.ts`) and its own write path (`app/api/cron/intelligence-graph/route.ts` → `lib/intelligence-engine/graph-writer.ts`) — a cron feeds it, nothing reads from it. `jurisdiction_playbooks`, by contrast, has dozens of seed migrations covering essentially all ~192 countries (`*_jurisdiction_playbooks_batch*_*.sql`, `*_gap_g_playbook_*.sql`), a dedicated access module (`lib/intelligence/jurisdictionPlaybooks.ts`), and is consumed directly by `lib/dashboard/dashboardLiveData.ts` and the live user-facing route `app/country/[country]/role/[role]/page.tsx`. On evidence, `jurisdiction_playbooks` is what's actually serving production traffic; `cannabis_intelligence` is the one that's abandoned in practice despite the richer schema. `lib/intelligence/workflowEngine.ts`'s choice to build on `jurisdiction_playbooks` was correct, even though its own header comment justified it with an imprecise claim ("never populated with real schema" — it has schema and some data, just no readers and 38x less jurisdiction coverage). Follow-up resolved 2026-07-18: the `cannabis_intelligence` write pipeline was retired — its cron entry removed from `vercel.json`, route left in place but unscheduled (see file header for why). It made no LLM calls (checked before retiring — no wasted API spend, just a wasted daily run against a schema nothing reads). |
| Data ingestion platform | 🟡 Real pipeline, currently degraded | Two-track pipeline: `lib/scrapers/` (311 commercial sources, zero regulatory) and the intelligence estate (`source-engine-fetch` → `hv-extract` → `hv-score` → `hv-pipeline-orchestrator` edge functions → `signals`/`ia_signals` via `hv_ingest_snapshot_to_staging`/`promote_snapshot_to_signals`, both confirmed live). Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (verified 2026-07-14), the scoring stage is documented as inverted (SEO spam scores 99, clean headlines score under 40) with "no correct promotion path" currently. No translation stage, no LLM-based quality classification (spec proposes `hv-classify`, unbuilt). This is an open defect layered on a partial pipeline, not just a gap. (A separately-flagged `hv-score` Anthropic billing failure noted earlier has since cleared — live check on 2026-07-18 shows `hv-score` returning 200s on schedule and `regulatory_signals.signals` growing daily, ~9-13 rows/day; not a current blocker.) |
| Hybrid search (SQL + full-text + vector + AI retrieval) | 🟡 Vector search exists, not hybrid | pgvector confirmed (`ia_signal_embeddings`, 768-dim HNSW, `public.ia_search_signals()`), covering signal-level semantic search only. No combined SQL+FTS+vector+AI-reranking layer, and `cannabis_intelligence` has no embedding columns at all — the two knowledge graph candidates and the search layer aren't unified. |
| Mission Workspace (submit market + product + business profile → live interactive workspace) | ⬜ Not started | No file or route matches this concept. `app/intake/` is lead capture (`IntakeForm.tsx`), not a generated workspace. `app/intelligence/` is static per-country/module dossier content. Consistent with the existing table's Layer 6 (Documentation Engine) and Layer 9 (Workflow Engine), both already ⬜. |
| Durable workflow orchestration (Temporal or equivalent) | ⬜ Not started | `package.json` as inspected has no Temporal, BullMQ, or Inngest dependency. Scheduling is Vercel Cron + `pg_cron` + manual sequential edge-function chaining (`hv-pipeline-orchestrator`) — no dependency graph, retries, or durable execution. This is the concrete infra gap behind Layer 9's ⬜, not just missing schema. |
| Recommended tech stack | Mostly aligned, some gaps | Live: Next.js 16.2.10 (App Router — newer than the doc's "Next.js 15" assumption), React 19.2.7, TypeScript, Tailwind 4, TanStack Query, React Three Fiber, Supabase, `@anthropic-ai/sdk`, `@google/genai`, Upstash Redis. Absent: shadcn/ui (no `components.json` or scaffold beyond the raw `class-variance-authority` dep), AG Grid, React Flow, MapLibre GL, Motion/Framer Motion, Kafka, NATS, Temporal. Redis is present but for rate-limiting, not job orchestration. |
| 5-phase roadmap (Phase 1 core/KG foundation → Phase 5 predictive analytics) | Not scoped anywhere | `docs/FEATURES_ROADMAP.md` has no mission-engine or workflow-automation phase. `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` is itself a target/proposal document for the ingestion rebuild described above, not shipped work. No roadmap doc scopes predictive analytics or market simulation. |

**Net read:** the new handoff's ambition sits ahead of the 20-layer table above in one way still worth calling out as an open decision rather than folded silently into the build queue: it names multi-agent orchestration as its own architecture, where today's build is a human-operated queue with the right schema but no agents actually running against it. The other gap flagged here — two unreconciled knowledge graph implementations — is resolved as of 2026-07-18 (see row above): `jurisdiction_playbooks` is canonical, on evidence it's the one actually serving production traffic, not on the strength of either implementation's code comments.

---

## What the Original Doc Is Missing

### Trust & governance
| Item | Status | Notes |
|---|---|---|
| Confidence/freshness scoring per datapoint | ⬜ | Layer 19's example answers "yes" to a controlled-substance question with no hedge or as-of date. Needed before any corridor plan is user-facing. |
| Connect Layer 18 to existing crawler | 🟡 | Infrastructure exists; not wired to corridor plans as a live input. |
| CounterpartyStub conflict | ✅ Resolved 2026-07-18 — HAR-99/101 holds | Layers 10/11 want rich company/buyer detail per corridor; HAR-99/101 (shipped) keeps counterparties out of the public DTO, and `docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md` (checked 2026-07-18) confirms no counterparty/company public view exists among the required public views — the restriction is still actively enforced, not stale. Resolution: keep it that way. The same disintermediation logic Tyler used to reject take-rate (no way to stop a customer from taking a revealed contact off-platform) applies at least as strongly to a paid report that hands over raw counterparty contacts — it would undercut repeat per-report purchases across corridors. Reports can surface structured counterparty *category and count* ("14 verified importers matched") without raw contact fields; see Network Integration below for how an actual introduction gets handled. |
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
| Business model | ✅ Resolved 2026-07-18 — per-report | Tyler decided against subscription (fights the "living OS" positioning less than expected, but per-report was the explicit call) and against take-rate/lead-gen (rejected on enforcement grounds — no way to collect on deals that move off-platform after an intro, without a contractual hook or being in the payment flow). Each corridor plan is now a one-time paid deliverable; the Documentation Engine (6) and Workflow Engine (9) are the actual product being sold, not a value-add on a subscription. |
| Network integration | ✅ Resolved 2026-07-18 — reports-only, no automated intro-triggering | A low readiness score (or a matched counterparty) produces content in the report — a to-do list, and a counterparty category/count per CounterpartyStub above — not an automated warm intro from the 6,000-contact network. Consistent with both the per-report business model (no take-rate mechanism to fund automated brokering) and the CounterpartyStub resolution (no raw contact handoff to automate against). "Request an introduction" stays a manual, human-mediated action outside the generated report if Harbourview chooses to offer it later — not something to build now. |
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

All four decisions that previously gated this section are resolved as of v1.5 (business model, knowledge graph, CounterpartyStub tier, network integration — see reconciliation and Bigger Picture tables above). Build order:

1. **Pick one corridor** (Canada → Germany — Germany already has the deepest dossier) and build the full stack end-to-end for it before generalizing.
2. **Documentation Engine (6)** and **Workflow Engine (9)** first among the ⬜ layers, with equal priority rather than sequenced — with per-report as the business model, the generated document *is* the product, not a mechanic in service of a subscription dashboard. Workflow Engine builds against `jurisdiction_playbooks`, the canonical schema. Counterparty content in the generated report is category/count only, per the CounterpartyStub resolution — no raw contact fields.
3. **Cost Calculator (15)** and **Timeline Engine (16)** last among near-term work — they depend on data the workflow engine will surface anyway.

---

## Change Log

- **v1.5** (2026-07-18): Closed the remaining two open decisions plus a related follow-up, at Tyler's direction ("fix all"). **CounterpartyStub disclosure tier**: HAR-99/101 holds — verified still-enforced via `docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md` (no counterparty public view exists), and reasoned from Tyler's own take-rate rejection logic (disintermediation risk applies to raw contact handoff in a report at least as much as to an unenforceable take-rate). **Network integration**: resolved to reports-only — to-do list and counterparty category/count, no automated intro-triggering, consistent with per-report and the CounterpartyStub call. **Follow-up on the retired `cannabis_intelligence` write path**: actually retired, not just flagged — removed its cron entry from `vercel.json` (confirmed first via `lib/intelligence-engine/graph-writer.ts` that it makes no LLM calls, so no API spend was on the line, only a daily wasted run), left the route file in place with a header explaining why it's unscheduled. All four decisions that were blocking schema work in v1.3 are now resolved.
- **v1.4** (2026-07-18): Two of the four open decisions resolved. Business model set to per-report (Tyler) — subscription and take-rate/lead-gen both rejected, the latter on enforcement grounds (no way to collect on deals that move off-platform after an intro). Knowledge graph canonicalization set to `jurisdiction_playbooks` — reversed the tentative v1.3 lean toward `cannabis_intelligence` after checking actual `.ts`/`.tsx` usage: `cannabis_intelligence` has a write-only cron and no consumer, while `jurisdiction_playbooks` has ~192-country seed coverage and powers the live `dashboardLiveData.ts` and `app/country/[country]/role/[role]/page.tsx`. Corrected a stale claim carried from CLAUDE.md's session addenda — `hv-score`'s Anthropic billing failure has since cleared, confirmed via live Supabase log/table check, not a current blocker. Recommended Build Order updated: Documentation Engine and Workflow Engine now equal priority (per-report makes the generated document the product), Network Integration downgraded to low-urgency rather than a hard blocker.
- **v1.3** (2026-07-18): Reconciled a newer, more detailed "AI Market Entry Engine" solution-architecture handoff doc against current codebase state (multi-agent architecture, knowledge graph, data-ingestion platform, hybrid search, Mission Workspace, durable workflow orchestration, tech stack, 5-phase roadmap). Surfaced a new open decision — two unreconciled knowledge graph implementations (`cannabis_intelligence` vs `jurisdiction_playbooks`) — and added it to the build-order blockers, taking the count from three to four. No new build items were scheduled silently; multi-agent orchestration and knowledge graph unification are logged as decisions, consistent with how Business Model and Network Integration were already handled in v1.1.
- **v1.2** (2026-07-11): Fact-checked the closing note against live GitHub state — the four sprint PRs are resolved, not open. Replaced with current status.
- **v1.1** (2026-07-10): Added executive summary. Added Value Framework section with Layer 9 workflow diagram. Reclassified Business Model from ⬜ to ⚠️ (it's a decision, not a build item). Reordered Recommended Build Order to resolve the three open decisions before any corridor/schema work.
- **v1.0** (2026-07-10): Initial 20-layer audit.

---

*Status check (2026-07-11): the four sprint PRs referenced in earlier drafts are resolved — **#921**, **#934**, and **#985** merged; **#962** was closed unmerged after a `package-lock.json` conflict but its work landed on `main` via a manual rebase (commit `8c3a620`, confirmed as an ancestor of `main`). They're no longer a blocker for Market Entry OS work. Five PRs are open as of this check — **#1021** (marketplace ratings forward-fix), **#1022** (compliance-brief rate limiting), **#1023** (heatmap preferences guard), **#1026** (migration drift reconciliation), and this doc's own **#1024** — separate, newer items worth a status pass on their own terms. Track 3 Airtable contract (HAR-52) wasn't reverified in this pass.*
