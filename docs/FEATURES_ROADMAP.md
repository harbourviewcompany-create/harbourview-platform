# Harbourview Platform - Comprehensive Features Roadmap

**Status**: Active Planning Document
**Owner**: Tyler / Harbourview Team
**Last Updated**: June 22, 2026
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

## Prioritization Matrix

| Feature | Impact (Business Value) | Effort | Priority | Phase |
otes |
|---------|--------------------------|--------|----------|-------|-------|
| Supplier/Professional Directory Completion | High (lead gen, trust) | Low | P0 | Quick Wins | Reuse professional pattern |
| Counterparties Polish (edit/remove, normalize) | Medium | Low | P0 | Quick Wins | Unblocks admin ops |
| Watchlist Rule Builder UI | Medium-High | Low-Medium | P0 | Quick Wins | Existing table, missing UI |
| Genetics Catalog Basic | High (differentiation) | Medium | P1 | Quick Wins / Phase 1 | Build on recent seeding |
| Deal Room Enhancements | High (B2B core) | Medium | P1 | Phase 1 | Existing deal_rooms table |
| AI Personalized Briefings & Alerts | High (stickiness) | Medium | P1 | Phase 2 | Leverage existing LLM gateway |
| Logistics & Trade Route Simulator | High (intelligence moat) | High | P2 | Phase 2 | Globe extension |
| Education Hub Expansion (CPD, paid) | Medium | Low-Medium | P1 | Phase 1 | Existing modules |
| Embedded BNPL / Financing Inquiry | High (revenue) | Medium-High | P2 | Phase 2 | Start with inquiry form |
| Admin Dashboard Polish | High (ops efficiency) | Low | P0 | Quick Wins | Pending review UIs |
| Advanced Analytics & Reporting | Medium-High | Medium | P2 | Phase 3 | New views + exports |
| Community / Forum Layer | Medium (network effects) | High | P3 | Phase 3 | Strict RLS required |
| Mobile Globe + PWA / Offline Briefings | Medium | Medium | P2 | Phase 2 | Performance + accessibility |
| Multi-Language Support | Medium (global) | High | P3 | Phase 3 | i18n framework |

## Phased Implementation Roadmap

### Phase 0: Quick Wins & Foundation (Target: 1-2 dedicated sessions)
**Goal**: Deliver immediate value, complete thin surfaces, build momentum and data.

**Features**:
1. **Counterparties Full CRUD + Normalization**
   - Add edit/delete to ia_counterparties admin page
   - Normalize `markets` field against country_intel or jurisdiction codes
   - Extend existing create/log/doc-status patterns
   - Files: app/admin/(protected)/intelligence/counterparties/*, lib/server/iaCounterparties.ts or db.ts, new server actions

2. **Watchlist Rule Builder UI**
   - Build UI to manage cc_watch_rules (currently 2 seeded rows, only count shown)
   - Reuse watchlist patterns from cc_watchlist_items
   - Files: app/intelligence/watchlists or dashboard equivalent, new components

3. **Supplier Directory Intake + Admin Approval**
   - Mirror /professionals/apply flow for suppliers
   - Create supplier_profiles table if not exists (or extend)
   - Admin list/approve/reject with document verification
   - Public directory page with verified badge
   - Files: app/supplier-directory/apply, app/admin/suppliers, new actions, migration if needed

4. **Genetics / Cultivar Basic Catalog**
   - Searchable list + detail pages for cultivar_passports and genetics_profiles
   - Leverage 12+ seeded passports
   - Add basic filters (country, type, breeder)
   - Files: app/genetics/*, lib/server/geneticsQuery.ts, extend existing seeding

5. **Admin Polish for Pending Items**
   - Complete hv_professionals and supplier_profiles review UIs
   - Any other pending admin surfaces from recent PRs

**Success Criteria**:
- All thin surfaces from Jun 21 HANDOFF addressed
- Realistic data in new tables
- CI green + production deploy verified
- PROJECT_REGISTRY updated for any new routes

### Phase 1: Marketplace Activation (Target: 2-3 sessions)
**Goal**: Turn marketplace into functional revenue/lead engine.

**Features**:
1. **Deal Room Enhancements**
   - Private workspaces for matched parties
   - NDA upload/gating, file sharing (integrate with existing storage?)
   - Automated notifications on new matches or activity
   - Status tracking (negotiation, closed)
   - Files: app/marketplace/deals/[id] or new deal room routes, realtime subscriptions if possible

2. **Verified Professional & Supplier Profiles Live**
   - Full public profiles with verification badges, contact gating (form or intro request)
   - Profile completion scores, testimonials (future)
   - Integration with watchlists and briefings

3. **Education Hub Expansion**
   - CPD credit tracking tied to user profiles
   - Module completion certificates
   - Basic paid/premium module support or partnership CTAs
   - Audience taxonomy reconciliation (doctor_prescriber vs doctor etc.)

4. **Basic BNPL / Trade Financing Inquiry Flow**
   - "Request Financing" button on marketplace/deal flows
   - Structured inquiry form (amount, purpose, timeline)
   - Routes to admin + email notification
   - Future: embed partner API
   - New table: financing_inquiries

**Dependencies**: Phase 0 supplier/professional completion

### Phase 2: Intelligence & Engagement Amplification (Target: 3-4 sessions)
**Goal**: Deepen moat with AI and interactive tools; increase retention.

**Features**:
1. **AI-Powered Personalized Briefings & Alerts**
   - "My Markets" dashboard section
   - Configurable watch rules → daily/weekly synthesized briefings (reuse synthesiseJurisdiction)
   - Email or in-app delivery (integrate existing signal_subscriptions)
   - User preference storage
   - Files: New cron/orchestrator job, app/dashboard or intelligence/my-briefings, extend LLM gateway usage

2. **Logistics & Trade Route Simulator**
   - Interactive globe layer showing approved corridors, duties, partners, risk scores
   - Filter by product type, volume, compliance status
   - Data model: trade_routes, logistics_partners, corridor_risks
   - Files: Extend config/globe and globe components, new lib/intelligence/logistics.ts

3. **Mobile Globe Improvements + PWA + Offline Briefings**
   - Performance optimizations for mobile (lazy load, simplified 3D)
   - PWA manifest + service worker for offline country briefings
   - Download buttons on briefing pages

4. **Genetics Marketplace Core**
   - Full catalog with IP notes, comparison tool, breeder matching
   - Claim/licence integration (hv_claims, hv_licences)
   - Basic inquiry/routing to verified professionals

**Dependencies**: Strong genetics seeding, LLM patterns from education/briefings

### Phase 3: Scale, Community & Global (Target: Ongoing / 4+ sessions)
**Goal**: Build network effects, global reach, advanced ops tools.

**Features**:
1. **Gated Community / Forum Layer**
   - Verified-only discussion boards (by role or market expertise)
   - Threaded discussions, expert AMAs, moderated
   - New tables: forum_threads, forum_posts with strict RLS (member-only)
   - Realtime updates
   - Files: app/community/* or /intelligence/community, new components

2. **Advanced Analytics & Reporting Dashboard (Admin + User)**
   - Usage analytics, market entry ROI calculators, compliance report exports
   - Custom report builder for admins
   - New views or materialized views in Supabase

3. **Multi-Language Support & Internationalization**
   - Detect user locale or preference
   - Translate key UI + briefings (start with high-priority markets: ES, FR, PT)
   - Use next-intl or similar (evaluate vs current setup)
   - Locale-aware globe and data

4. **Full BNPL / Financing Integration**
   - Embed partner BNPL flow at checkout/inquiry
   - Automated status sync
   - Compliance logging

**Dependencies**: Mature user base, strong data foundations from prior phases

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

---

**This document is the canonical plan. All work should align to it. Update it after every significant session or PR.**

**Next Action**: Create GitHub issues for each phase/feature for tracking. Start Phase 0 implementation.