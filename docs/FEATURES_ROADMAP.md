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

**Outcome**: Phase 0 is **CLOSED**. Phase 1 core marketplace activation is **CLOSED**. Public supplier directory residual closed same day (`e0f87ff`).

### Phase 0 — Closed

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1 | Counterparties Full CRUD + Normalization | ✅ Complete | `app/admin/(protected)/intelligence-automation/counterparties/CounterpartyActions.tsx` — Add / Edit / Delete / Log contact / Doc status; API routes under `/api/admin/intelligence/counterparties` |
| 2 | Watchlist Rule Builder UI | 🟡 Partial → deferred polish | Public `/intelligence/watchlists` surface + `/api/watchlist/rules` + `/api/watchlist/items` exist. Full interactive rule-builder UI for `cc_watch_rules` remains a Phase 2 stickiness item (AI briefings dependency). |
| 3 | Supplier Directory Intake + Admin Approval | ✅ Complete | Registry: Active. Routes: `/supplier-directory/apply`, `submitSupplierApplication`, admin applications suppliers API, `supplier_profiles` table + RLS |
| 4 | Genetics / Cultivar Basic Catalog | ✅ Complete (basic) | `app/genetics/*`, `app/marketplace/genetics/*`, `app/dashboard/genetics/*`, `createPassport` action, admin genetics review, public passport API |
| 5 | Admin Polish for Pending Items | ✅ Complete | Applications list (professionals + suppliers), counterparties admin, genetics review, inquiries, listings candidates |

### Phase 1 — Closed (core)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1 | Deal Room Enhancements | ✅ Complete (core) | `app/marketplace/deals/[id]` — realtime messages, NDA flag, status tracking, composer, access gating |
| 2 | Verified Professional & Supplier Profiles Live | ✅ Complete | `/professionals/[slug]`; `/supplier-directory` list + `/supplier-directory/[id]` detail (`e0f87ff`) — public-safe columns only, verified badge, intro via `/contact` |
| 3 | Education Hub Expansion | 🟡 Structural complete | Broad route map under `/education/*`; CPD / certificates / paid modules still Phase 2 depth |
| 4 | Basic BNPL / Trade Financing Inquiry Flow | ⬜ Not started | Moved to Phase 2 residual |

### Residual items carried forward

1. **Watchlist interactive rule builder** (full CRUD UI on `cc_watch_rules`) → Phase 2 / AI briefings track  
2. ~~**Public supplier directory listing**~~ → ✅ Closed `e0f87ff`  
3. **BNPL / financing inquiry form** → Phase 2 residual  
4. **Education CPD / certificates / paid modules** → Phase 2 depth  
5. **PROJECT_REGISTRY full reconciliation** — still HOLD for systems beyond supplier directory

---

## Prioritization Matrix (post Phase 0–1 close)

| Feature | Impact | Effort | Priority | Phase | Notes |
|---------|--------|--------|----------|-------|-------|
| Watchlist Rule Builder UI (interactive) | Medium-High | Low-Medium | P1 | Phase 2 residual | API exists; UI thin |
| BNPL / Financing Inquiry | High | Medium | P1 | Phase 2 residual | Was Phase 1 #4 |
| AI Personalized Briefings & Alerts | High | Medium | P1 | Phase 2 | LLM gateway exists |
| Logistics & Trade Route Simulator | High | High | P2 | Phase 2 | Globe extension |
| Education CPD / paid modules | Medium | Medium | P2 | Phase 2 | Structure present |
| Mobile Globe + PWA | Medium | Medium | P2 | Phase 2 | |
| Advanced Analytics | Medium-High | Medium | P2 | Phase 3 | |
| Community / Forum | Medium | High | P3 | Phase 3 | Strict RLS |
| Multi-Language | Medium | High | P3 | Phase 3 | |

## Phased Implementation Roadmap

### Phase 0 — ✅ CLOSED (2026-07-28)
### Phase 1 — ✅ CLOSED core (2026-07-28); supplier public profiles closed same day

### Phase 2: Intelligence & Engagement Amplification (Next focus)

1. **AI-Powered Personalized Briefings & Alerts**
2. **Watchlist Rule Builder UI** (carried residual)
3. **BNPL / Trade Financing Inquiry Flow** (carried residual)
4. **Logistics & Trade Route Simulator**
5. **Mobile Globe Improvements + PWA + Offline Briefings**
6. **Genetics Marketplace Core** (beyond basic catalog)
7. **Education CPD / certificates / premium modules**

### Phase 3: Scale, Community & Global

1. Gated Community / Forum Layer  
2. Advanced Analytics & Reporting  
3. Multi-Language Support  
4. Full BNPL / Financing Integration (embed partner)

## Cross-Cutting Technical Requirements

- **New Tables (examples)**: financing_inquiries, trade_routes, forum_threads, forum_posts, user_preferences, briefing_subscriptions, cultivar_comparisons
- **RLS Policies**: Every new table must have member-scoped or admin-only policies. Never public write.
- **Admin Surfaces**: All new admin pages under app/admin/(protected)/ with getAdminAuthCheck()
- **Deployment**: All changes via main branch + Vercel auto-deploy. Verify with tools.

---

**Next Action**: Phase 2 residual priority — (1) watchlist rule builder UI, (2) financing inquiry form, (3) AI briefings spine.
