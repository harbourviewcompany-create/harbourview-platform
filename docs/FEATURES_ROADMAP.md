# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document  
**Owner**: Tyler / Harbourview Team  
**Last Updated**: July 28, 2026  
**Purpose**: Single source of truth for all planned features. All implementation must reference this document and update PROJECT_REGISTRY.md.

## Executive Summary

This document consolidates all high-value feature ideas for the Harbourview Platform — a Next.js + Supabase + Vercel platform delivering regulated cannabis market routing, reviewed intelligence, and B2B marketplace capabilities.

**Core Positioning**: "Market access backed by intelligence and relationships."

All features must:
- Maintain strict security (RLS, admin guards)
- Follow existing patterns (server actions, lib/server queries, globe components)
- Update docs/control/PROJECT_REGISTRY.md for any new routes/tables
- Pass full validation: npm ci → typecheck → lint → build → production deploy verification
- Be delivered via granular, reviewable PRs

## Phase 0–1 Closure Audit (2026-07-28)

**Outcome**: Phase 0 is **CLOSED**. Phase 1 core marketplace activation is **CLOSED** with two residual thin-surface notes.

### Phase 0 — Closed

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1 | Counterparties Full CRUD + Normalization | ✅ Complete | `app/admin/(protected)/intelligence-automation/counterparties/CounterpartyActions.tsx` — Add / Edit / Delete / Log contact / Doc status; API routes under `/api/admin/intelligence/counterparties` |
| 2 | Watchlist Rule Builder UI | 🟡 Partial → deferred polish | Public `/intelligence/watchlists` surface + `/api/watchlist/rules` + `/api/watchlist/items` exist. Full interactive rule-builder UI for `cc_watch_rules` remains a Phase 2 stickiness item (AI briefings dependency). |
| 3 | Supplier Directory Intake + Admin Approval | ✅ Complete | Registry: Active (Phase 0 complete). Routes: `/supplier-directory/apply`, `submitSupplierApplication`, admin applications suppliers API, `supplier_profiles` table + RLS |
| 4 | Genetics / Cultivar Basic Catalog | ✅ Complete (basic) | `app/genetics/*`, `app/marketplace/genetics/*`, `app/dashboard/genetics/*`, `createPassport` action, admin genetics review, public passport API |
| 5 | Admin Polish for Pending Items | ✅ Complete | Applications list (professionals + suppliers), counterparties admin, genetics review, inquiries, listings candidates |

**Phase 0 success criteria met**: thin surfaces addressed, realistic data paths present, production deploy path verified historically, registry notes supplier directory complete.

### Phase 1 — Closed (core)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1 | Deal Room Enhancements | ✅ Complete (core) | `app/marketplace/deals/[id]` — realtime messages, NDA flag, status tracking (active / negotiating / agreed / closed / cancelled), composer, access gating |
| 2 | Verified Professional & Supplier Profiles Live | ✅ Professionals / 🟡 Suppliers | `/professionals/[slug]` full public profiles; supplier public directory currently redirects to dashboard marketplace (intake + admin approval live) |
| 3 | Education Hub Expansion | 🟡 Structural complete | Broad route map under `/education/*` and `/network/clinical-education`; CPD credit tracking / certificates / paid modules still Phase 2 depth |
| 4 | Basic BNPL / Trade Financing Inquiry Flow | ⬜ Not started | No `financing_inquiries` table or "Request Financing" UI found — **moved to Phase 2 residual** |

### Residual items carried forward

1. **Watchlist interactive rule builder** (full CRUD UI on `cc_watch_rules`) → Phase 2 / AI briefings track  
2. **Public supplier directory listing** (non-redirect, verified badges) → polish  
3. **BNPL / financing inquiry form** → Phase 2 residual (was Phase 1 #4)  
4. **Education CPD / certificates / paid modules** → Phase 2 depth  
5. **PROJECT_REGISTRY full reconciliation** — still HOLD for systems beyond supplier directory (dashboard, digest, ia_*, etc.)

---

## Optimization Guidelines for Maximum Execution Ability (with Grok)

To execute at peak performance:

1. **Session Protocol**:
   - Start every session by reading latest HANDOFF.md and docs/control/PROJECT_REGISTRY.md
   - End every session by updating HANDOFF.md with actions, data snapshots, blockers, and next priorities
   - Always verify production deploy reached `READY` state via Vercel tools before marking complete

2. **Prompting Best Practices**:
   - Be specific: "Implement supplier directory intake following the exact pattern from professionals/apply (PR #759). First search code for similar, then propose migration if needed."
   - Reference this roadmap and specific phase/feature ID
   - Request full validation loop explicitly
   - Ask for GitHub issue creation for tracking

3. **Tool Usage**:
   - Use github___search_code extensively before writing any new code to find patterns
   - Use github___issue_write to create tracking issues/epics
   - Use vercel___get_deployment and vercel___web_fetch_vercel_url for post-merge verification
   - Use read_file/edit_file patterns when local context is available; otherwise propose precise diffs

4. **Development Discipline**:
   - One logical feature or small slice per PR
   - Data model first (migration + RLS + seed)
   - Backend (actions/routes) before UI
   - Security review for every new surface
   - Update PROJECT_REGISTRY for every added route/table
   - Realistic data seeding early

5. **Risk Management**:
   - Address Supabase migration drift immediately
   - Hold major dependency bumps until dedicated upgrade session
   - Never expose private fields publicly

## Prioritization Matrix (post Phase 0–1 close)

| Feature | Impact | Effort | Priority | Phase | Notes |
|---------|--------|--------|----------|-------|-------|
| Watchlist Rule Builder UI (interactive) | Medium-High | Low-Medium | P1 | Phase 2 residual | API exists; UI thin |
| Public Supplier Directory polish | High | Low | P1 | Polish | Redirect → live list + badges |
| BNPL / Financing Inquiry | High | Medium | P1 | Phase 2 residual | Was Phase 1 #4 |
| AI Personalized Briefings & Alerts | High | Medium | P1 | Phase 2 | LLM gateway exists |
| Logistics & Trade Route Simulator | High | High | P2 | Phase 2 | Globe extension |
| Education CPD / paid modules | Medium | Medium | P2 | Phase 2 | Structure present |
| Mobile Globe + PWA | Medium | Medium | P2 | Phase 2 | |
| Advanced Analytics | Medium-High | Medium | P2 | Phase 3 | |
| Community / Forum | Medium | High | P3 | Phase 3 | Strict RLS |
| Multi-Language | Medium | High | P3 | Phase 3 | |

## Phased Implementation Roadmap

### Phase 0: Quick Wins & Foundation — ✅ CLOSED (2026-07-28)

**Goal**: Deliver immediate value, complete thin surfaces, build momentum and data.

All five original items delivered or consciously deferred (watchlist builder → Phase 2 residual).

### Phase 1: Marketplace Activation — ✅ CLOSED core (2026-07-28)

**Goal**: Turn marketplace into functional revenue/lead engine.

Deal rooms + professional profiles + supplier intake/admin + genetics basic catalog live. BNPL inquiry and full CPD/education depth carried to Phase 2 residual.

### Phase 2: Intelligence & Engagement Amplification (Next focus)

**Goal**: Deepen moat with AI and interactive tools; increase retention.

**Features**:
1. **AI-Powered Personalized Briefings & Alerts**
   - "My Markets" dashboard section
   - Configurable watch rules → daily/weekly synthesized briefings (reuse synthesiseJurisdiction)
   - Email or in-app delivery (integrate existing signal_subscriptions)
   - User preference storage

2. **Watchlist Rule Builder UI** (carried residual)
   - Full interactive management of `cc_watch_rules`

3. **BNPL / Trade Financing Inquiry Flow** (carried residual)
   - "Request Financing" button + structured form → admin + email
   - Table: `financing_inquiries`

4. **Logistics & Trade Route Simulator**
   - Interactive globe layer: corridors, duties, partners, risk scores

5. **Mobile Globe Improvements + PWA + Offline Briefings**

6. **Genetics Marketplace Core** (beyond basic catalog)
   - IP notes, comparison tool, breeder matching, claim/licence integration

7. **Public Supplier Directory polish**
   - Live verified list (not dashboard redirect only)

8. **Education CPD / certificates / premium modules**

### Phase 3: Scale, Community & Global (Ongoing)

1. Gated Community / Forum Layer  
2. Advanced Analytics & Reporting  
3. Multi-Language Support  
4. Full BNPL / Financing Integration (embed partner)

## Cross-Cutting Technical Requirements

- **New Tables (examples)**: financing_inquiries, trade_routes, forum_threads, forum_posts, user_preferences, briefing_subscriptions, cultivar_comparisons
- **RLS Policies**: Every new table must have member-scoped or admin-only policies. Never public write.
- **Admin Surfaces**: All new admin pages under app/admin/(protected)/ with getAdminAuthCheck()
- **Globe Extensions**: Leverage existing config/globe and three.js patterns
- **LLM / Intelligence Engine**: Reuse existing gateway for synthesis, embeddings for search
- **Testing**: Add targeted tests for new queries/actions. Update smoke tests.
- **Documentation**: Update this roadmap, HANDOFF.md, relevant docs/marketplace/ or docs/intelligence/, and PROJECT_REGISTRY.md
- **Deployment**: All changes via main branch + Vercel auto-deploy. Verify with tools.

## Data & Seeding Strategy

- Extend existing seeding scripts for new tables
- Use realistic but anonymized cannabis industry data
- Maintain public vs private data boundaries (see HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md)

## Success Metrics (Overall)

- Increased time-on-site and return visits (briefings, watchlists)
- Marketplace GMV or inquiry volume growth
- Admin ops time reduction (faster approvals)
- User feedback on intelligence quality
- Production stability (zero regression on core globe/intelligence)

## How to Execute a Specific Feature

1. Create GitHub issue referencing this doc and phase
2. Search code for similar patterns (e.g. professionals apply, counterparty mutations)
3. Propose schema migration + RLS
4. Implement backend (server actions / API routes)
5. Build UI components following Tailwind + existing design system
6. Add to PROJECT_REGISTRY
7. Full local validation + production deploy check
8. Update this roadmap with status and learnings
9. Merge and verify

## Open Questions / Decisions Needed

- BNPL partner selection and integration depth (inquiry vs full embed)
- Forum moderation model and tooling
- Exact i18n library choice
- Prioritization adjustments based on user feedback or business needs
- Resource allocation for data sourcing (genetics, logistics partners)
- Full PROJECT_REGISTRY reconciliation pass (dashboard, digest, ia_*, HF layer)

---

**This document is the canonical plan. All work should align to it. Update it after every significant session or PR.**

**Next Action**: Execute Phase 2 residual items in priority order — (1) public supplier directory polish, (2) watchlist rule builder UI, (3) financing inquiry form, (4) AI briefings spine.
