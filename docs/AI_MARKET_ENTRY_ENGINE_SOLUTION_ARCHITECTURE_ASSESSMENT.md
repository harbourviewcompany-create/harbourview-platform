# AI Market Entry Engine — Solution Architecture Quote Assessment

**Version 1.0** · 2026-07-17 · Status: Draft assessment, not a build spec or an approved scope
**Input:** the "Harbourview Platform – AI Market Entry Engine" technical & product handoff doc (pasted verbatim into this task, not separately filed in the repo)
**Purpose:** reconcile that handoff doc against verified current-state, so it can be turned into a scoped, priced Solution Architecture Quote rather than quoted as a single line item

Status key: ✅ Built · 🟡 Partial · ⬜ Not Started · ⚠️ Open Decision (not a build item — needs a call)

---

## 0. How this relates to existing docs

The handoff doc describes the same underlying product — a one-click, per-corridor market-entry execution engine — already tracked in this repo as **`docs/MARKET_ENTRY_OS_NORTH_STAR.md` (v1.2, 2026-07-11)**, which scored the same concept against 20 build layers. This assessment does not repeat that audit; it:

1. Re-verifies the layers most affected by code shipped **after** North Star v1.2 (dated six days before this assessment) — one layer's status changed.
2. Covers what North Star doesn't: the handoff doc's specific **technology stack** (Temporal, Kafka/NATS, AG Grid, React Flow, MapLibre GL, multi-agent framework), which is new content not in North Star.
3. Cross-references `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (2026-07-14) for the Data Ingestion Platform section — that doc contains a harsher, more specific diagnosis of the ingestion pipeline than either this handoff doc or North Star assume.
4. Does **not** re-litigate North Star's three open decisions (CounterpartyStub disclosure tier, business model, network integration). They still block execution-layer work regardless of which spec doc is used going forward.

**This assessment is research/documentation only.** No schema, code, or config changed. Per `CLAUDE.md` Rule 5, no build starts against this handoff doc without an approved spec — that's the point of doing this reconciliation first.

---

## 1. Executive summary

The handoff doc is a **restatement of the Market Entry OS concept at a much higher production-tech ambition** — it asks for Temporal, Kafka/NATS, a dedicated knowledge-graph layer, a 30-agent orchestration framework, and a distinct "Mission" product surface. None of that additional ambition is reflected in what's built. Stripped to the same 20 layers North Star already scored, the picture is unchanged: intelligence-gathering (corridor data, regulatory prose, market metrics, live crawling) is the strongest area; execution (workflow generation, documentation, cost/timeline estimation) is the weakest.

One material update since North Star v1.2: **Layer 9 (Workflow Engine)** moved from ⬜ to 🟡 on 2026-07-13 (`lib/intelligence/workflowEngine.ts`, PR #1039) — a prototype corridor-plan generator exists for exactly one corridor (Canada→Germany), is **not wired to any route or UI**, and explicitly does not compute real step dependencies. It's a first attempt, not a working engine.

Two things this assessment surfaces that neither the handoff doc nor North Star fully capture:
- The ingestion pipeline the handoff doc's "Data Ingestion Platform" section assumes is straightforward is, per the 2026-07-14 spec, **actively unsafe** — the scoring function is inverted (SEO spam outranks real news) and the pipeline is currently **billing-blocked** (`hv-score`'s Anthropic API calls are failing on low credit balance, per this session's CLAUDE.md addenda — worth confirming still true before quoting anything downstream of it).
- Several primitives the handoff doc's "Search Architecture" section asks for as if novel — pgvector semantic search, a knowledge-graph traversal layer, full-text/SQL search — **already exist independently**, just not unified behind a single AI-routed retrieval layer.

**Recommendation:** don't quote this doc as one build. Quote it in the tiers in Section 6 — the tiers have very different cost profiles and some are blocked on decisions, not engineering.

---

## 2. Layer re-verification (deltas from North Star v1.2 only)

| # | Layer | North Star v1.2 (2026-07-11) | This assessment (2026-07-17) | Evidence |
|---|---|---|---|---|
| 9 | Workflow Engine | ⬜ Not started | 🟡 Prototype exists, unwired | `lib/intelligence/workflowEngine.ts` (merged 2026-07-13, PR #1039). Merges two independent `jurisdiction_playbooks` entries into a corridor plan for **one hardcoded corridor** (`CA-DE`, via `CORRIDOR_NOTES`). No `depends_on` field on playbook steps, so `criticalPathWeeksEstimate` is an explicit heuristic, not a real critical path. No caller — `grep` for `deriveCorridorPlan` finds only its own definition. |

All other 19 layers: no code shipped since 2026-07-11 that changes their status — see North Star for the full table and reasoning. Re-verify before quoting if more time has passed since this assessment than since North Star's own writing.

---

## 3. What the handoff doc adds that North Star doesn't cover

### 3.1 Proposed tech stack vs. actual

| Proposed | Status | Evidence |
|---|---|---|
| Next.js (App Router), React, TypeScript, Tailwind | ✅ | `package.json`: Next 16.2.10 (doc says "Next.js" generically — already ahead of a Next 15 assumption), React 19.2.7, TypeScript 5.4, Tailwind 4.3.2 |
| shadcn/ui | ✅ | `components/ui/*.tsx` (button, card, badge, alert, avatar, …) already present |
| TanStack Query | ✅ | `@tanstack/react-query ^5.101.2` |
| React Three Fiber / drei / postprocessing | ✅ | `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `three` — already used for the globe visualization |
| AG Grid | ⬜ | No dependency, no usage found |
| React Flow | ⬜ | No dependency, no usage found — relevant since Workflow Engine (9) would likely want this for dependency-graph visualization |
| MapLibre GL | ⬜ | No dependency; current geo visualization is the R3F/Three.js globe, a different approach |
| PostgreSQL, Supabase (auth/DB/storage) | ✅ | `@supabase/supabase-js`, `@supabase/ssr`; project ref `zvxdgdkukjrrwamdpqrg` |
| pgvector | ✅ | Referenced live in `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (§4.2: `embedding` column, `hv-embed-worker`) |
| Redis | ✅ (managed, not self-hosted) | `@upstash/redis` + `@upstash/ratelimit`, used in `lib/network/rateLimit.ts` |
| Temporal (workflow orchestration) | ⬜ | No dependency. Current long-running work uses Vercel Cron routes (`app/api/cron/*`, 15 routes) + a custom `DistributedTaskQueue` / `CircuitBreaker` (`lib/intelligence-engine/orchestrator.ts`, `queue/task-queue.ts`) — a hand-rolled equivalent for the ingestion pipeline specifically, not a general durable-workflow engine, and not usable as-is for multi-day mission orchestration with human-approval waits. |
| Kafka or NATS | ⬜ | No event-streaming layer. All coordination is direct Postgres reads/writes and cron-triggered HTTP calls. |
| Object storage | 🟡 | Supabase Storage available via the SDK; no evidence of it being used for the doc's "Raw Storage" ingestion stage specifically |

**Read on this table:** the frontend stack is already close to or ahead of what the doc proposes. The gap is entirely on the backend orchestration/eventing side — Temporal and Kafka/NATS would be genuinely new infrastructure, not upgrades of something half-built.

### 3.2 AI Agent Architecture (30 named agents)

⬜ Not started as described. What exists:
- `lib/intelligence-engine/orchestrator.ts` — an `IntelligenceOrchestrator` class that fans out **ingestion/crawling** work (fetch → extract → score) across sources using a task queue and circuit breaker. This is pipeline orchestration, not decisioning agents with distinct roles (Regulatory Agent, Pricing Agent, Customs Agent, etc.).
- `docs/AI_INTEGRATION.md` describes the current AI usage pattern — worth reading in full before scoping this section, but no multi-agent framework (LangGraph-style handoffs, per-agent tool scoping, shared agent workspace) is present.
- No agent named or scoped anywhere in the codebase maps to the 30 listed in the handoff doc.

Building this as literally 30 distinct agents is very likely over-scoped for a first pass — North Star's own recommendation (build one corridor end-to-end before generalizing) argues for collapsing this into however many *distinct reasoning steps* the Workflow Engine actually needs for the CA→DE pilot, not 30 standing agents up front.

### 3.3 Knowledge Graph

🟡 Real, but far smaller and less production-shaped than the doc implies.
- Tables: `ia_graph_entities`, `ia_graph_edges` — confirmed live, **20 nodes / 20 edges at seed** per the code comment in `lib/intelligence/graphQueries.ts`.
- Traversal: `lib/intelligence/graphQueries.ts` fetches the *entire* graph in two parallel queries, then filters/traverses in JS. The file's own comment flags this: fine at 20 nodes, needs replacing with real SQL traversal at 10K+. There is no graph database (Neo4j, AGE, etc.) — this is relational tables plus application-layer graph logic.
- Exposed via `app/api/intelligence/graph/route.ts`.
- The doc's example relationship chain (Germany → import license → requires → EU GMP → issued by → accepted by → German import authority) is a 6-hop reasoning chain. At 20 seed nodes this graph cannot support that today; it's aspirational for the current data volume, correct as a target shape.

### 3.4 Data Ingestion Platform

🟡/⚠️ Partially built, and the built part has known, documented defects — this section needs the most caution in a quote.

Per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` (2026-07-14, verified with evidence, not a stale doc):
- **Two disconnected scraping estates** that don't know about each other: a marketplace/equipment scraper registry (`lib/scrapers/`, ~311 sources, zero regulatory/news sources) and a separate intelligence estate (edge functions writing to `signals`/`ia_signals`).
- **The scoring function is inverted and unsafe**: `score_signal_from_snapshot` is keyword-count-driven. Verified real examples: SEO affiliate spam scored 99/URGENT; genuine clean news headlines scored under 40/MONITOR-LOW. The spec states plainly: "no amount of threshold tuning fixes an inverted signal — the instrument is wrong."
- **No language dimension** — every source is implicitly English; the doc's requirement to ingest non-English gazettes/press is not just unbuilt, it's actively mis-scored if force-fed through the current pipeline.
- The spec's own Section 8 has a staged rebuild plan for exactly this (unified `intel_sources` registry, LLM-based semantic classifier replacing keyword scoring, translate-on-ingest, one conductor). **That staged plan is the right scope reference for this section of the handoff doc — don't re-derive it.**
- **Operationally blocked right now**: per this session's CLAUDE.md addenda, `hv-score`'s Anthropic API calls are failing on "credit balance too low," which is likely why `regulatory_signals.signals` is empty despite correct schema. Confirm this is still true (it's a live/billing check, cheap to verify) before quoting or building anything downstream of ingestion — there's no point pricing Layer 6/7/9 work against a pipeline that isn't currently producing data.

### 3.5 Search Architecture (hybrid retrieval)

🟡 The individual primitives the doc asks for mostly exist; the routing layer that picks between them does not.
- SQL / structured queries: ✅ (Postgres via Supabase throughout)
- Full-text search: not independently confirmed in this pass — check `signals`/`listings` table definitions for `tsvector` columns before quoting this as built or not.
- Semantic vector search: ✅ pgvector `embedding` column live (per ingestion spec), `hv-embed-worker` exists.
- Knowledge graph traversal: ✅ per §3.3 above, at small scale.
- AI-selected retrieval strategy (the doc's actual ask — "AI automatically selects the appropriate retrieval strategy"): ⬜ not found anywhere.

### 3.6 Mission Workspace / "Launch Mission" UX

⬜ Not built as described, and no "mission" concept exists in the codebase (zero matches for "mission" across `app/` and `lib/`). The closest existing analog is the **Command Centre dashboard** (`components/dashboard/CommandCentre.tsx`, `MobileCommandCentre.tsx`) — a three-panel, role-based (20 role profiles) live dashboard already wired to real Supabase data via `Promise.all`-batched fetches (per the harbourview-platform skill notes). It is not corridor-mission-scoped or generated by a "Launch Mission" action; it's a persistent per-role/per-country view, not an ephemeral per-mission workspace. Worth deciding whether Mission Workspace is a *new* surface or a *reshape* of Command Centre before scoping — those are very different efforts.

### 3.7 Workflow Automation (partner intro workflows)

⬜ Not built. Directly overlaps North Star's still-open **Network integration** decision (⚠️): whether a gap in the plan (e.g., "need importer") triggers an actual warm intro from Harbourview's network or just prints a checklist item. That's a product/business decision, not an engineering gap — flagging again here because the handoff doc's examples (all six of them) assume the "warm intro" interpretation without saying so.

### 3.8 Development Roadmap (5 phases in the handoff doc)

Maps reasonably cleanly onto North Star's build order, with one gap: the handoff doc's Phase 1 lists "Core platform, Authentication, Country database, Knowledge graph foundation, Manual data entry, Basic search" as if starting from zero. All six of those already exist in some form (auth via Supabase, country coverage for all 191 UN member states per the Command Centre work, knowledge graph seed, and search primitives per §3.5). **If this doc is used as a quoting reference, Phase 1 should not be priced as greenfield** — it would substantially overstate cost and timeline for work already done.

---

## 4. Consolidated status (this doc's language, mapped to North Star's 20 layers)

| Handoff doc term | North Star layer(s) | Status |
|---|---|---|
| Regulatory pathway / licensing / import / export determination | 2, 4, 5, 8 | 🟡 prose exists, not structured |
| Documentation checklist | 6 | ⬜ |
| Partner discovery (distributors/importers/manufacturers/labs/logistics/brokers) | 10, 11 | 🟡 marketplace exists; typed distinctly by role — not yet; conflicts with CounterpartyStub decision (⚠️, unresolved) |
| Market demand / pricing / competitor analysis | 12, 13 | 🟡 / ⬜ |
| Risk analysis | 14 | 🟡 |
| Recommended strategy / AI recommendations | 19 | 🟡 gateway wired, corridor-specific UX not built |
| Implementation checklist | 6, 9 | ⬜ / 🟡 prototype (§2 above) |
| Continuous monitoring | 18 | 🟡 strongest infrastructure piece, not yet tied to mission/corridor plans |
| AI Agent Architecture | *(new — not a North Star layer)* | ⬜ (§3.2) |
| Knowledge Graph | *(new)* | 🟡 (§3.3) |
| Data Ingestion Platform | *(new, but overlaps ingestion spec)* | 🟡/⚠️ (§3.4) — **do not quote without confirming the billing block is resolved** |
| Search Architecture | *(new)* | 🟡 (§3.5) |
| Mission Workspace | *(new — closest analog: Command Centre)* | ⬜ (§3.6) |
| Workflow Automation | *(new — overlaps Network integration decision)* | ⬜ (§3.7) |

---

## 5. Open decisions this quote is blocked on

Carried forward from North Star (unchanged, still open):
1. **CounterpartyStub disclosure tier** — how much company/buyer detail the public DTO can show, given the shipped HAR-99/101 decision to keep counterparties out of it. Blocks Layers 10/11 and this doc's partner-discovery sections.
2. **Business model** — subscription / per-report / take-rate / lead-gen. Changes what Readiness Score and Workflow Engine outputs need to look like.
3. **Network integration** — whether a gap triggers a warm intro from the network or just a to-do item. Directly determines the scope of §3.7.

New, surfaced by this assessment:
4. **Ingestion pipeline health** — confirm whether `hv-score`'s Anthropic billing block is still active before pricing any Data Ingestion or Document Processing work. If still blocked, that's a same-day fix (add credit) that should happen before any related quoting conversation, not as part of the quoted scope.
5. **Orchestration technology** — does this need real Temporal (durable, human-approval-aware, multi-day workflows) or does the existing Vercel Cron + `DistributedTaskQueue`/`CircuitBreaker` pattern get extended? Temporal is new infrastructure with real operational cost (hosting, ops burden); the existing pattern is proven for ingestion but has never been used for mission-style workflows with approval gates.
6. **Mission Workspace vs. Command Centre** — new surface or reshape of the existing one (§3.6)? Materially changes scope.
7. **Agent count** — 30 named agents vs. however many the CA→DE pilot actually needs (§3.2).

---

## 6. Recommended quoting structure

Don't price this as one deliverable. Suggested tiers, in dependency order:

- **Tier 0 — Decisions (no engineering cost, blocks everything else).** Resolve items 1–3 (North Star) and 5–7 (above) with Tyler before any of Tiers 1–3 can be scoped accurately. Item 4 is a same-day operational fix, not a decision.
- **Tier 1 — Finish the pilot corridor (CA→DE), per North Star's existing recommendation.** Wire the existing `workflowEngine.ts` prototype into a real route/UI, extend it past the single hardcoded corridor note, add Documentation Engine (Layer 6) as a bounded slice. This is the cheapest path to a genuinely "one-click" demo and the doc's own Phase 3 (Mission engine, interactive workspace, document generation) at pilot scale.
- **Tier 2 — Fix ingestion before widening it.** Execute `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md`'s Section 8 staged plan (unified source registry, LLM classifier replacing the inverted scorer, language dimension). Required before the handoff doc's "far more relevant data" and "multiple languages" asks can be safely built — building on top of the current scorer would scale noise, not value, per that spec's own diagnosis.
- **Tier 3 — New infrastructure ambition.** Temporal migration, Kafka/NATS event streaming, multi-agent framework, knowledge-graph scale-out past JS-side traversal, React Flow/AG Grid/MapLibre additions. This is genuinely new build, largely independent of Tiers 1–2, and should be scoped/priced separately since it's infrastructure investment rather than incremental feature work — likely the highest-cost, highest-uncertainty tier, and the one most worth deferring until Tier 1 proves the corridor-plan concept has real value (per North Star's Value Framework, which explicitly has no real pilot numbers yet).

---

## Change log

- **v1.0** (2026-07-17): Initial assessment. Reconciles the pasted "AI Market Entry Engine" handoff doc against verified current-state, North Star v1.2, and the 2026-07-14 Intelligence Architecture Spec. One North Star layer status updated (Workflow Engine, ⬜→🟡). No code or schema changed by this assessment.
