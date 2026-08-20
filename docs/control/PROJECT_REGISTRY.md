Status: Canonical registry with verified Harbourview Vercel production mapping as of 2026-05-17; Vercel team ID and project ID corrected by operator confirmation 2026-06-23. Scoped residual systems catch-up 2026-07-28 (code-presence only). Phase 2 personal briefings slice started 2026-07-28. Intelligence Productization Board control doc registered 2026-08-10 (docs-only; no production verification claim). Intelligence pipeline optimization migrations registered 2026-08-20 (PR #1598; not yet production-applied / cron-enabled).
Scope: GitHub, Vercel and Supabase assets visible in connected audits, plus the 2026-05-17 verified Vercel connector state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`.
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

## Intelligence pipeline optimization — 2026-08-20 (PR #1598)

**Status:** Code present on branch `docs/intel-pipeline-optimization-2026-08-20`. **Not** production-applied. Crons remain operator-gated.

| Component | Path / object | Notes |
|-----------|---------------|-------|
| Control plan | `docs/control/INTEL_PIPELINE_OPTIMIZATION_2026-08-20.md` | Goals, phases, safety invariants |
| Apply checklist | `docs/control/INTEL_PIPELINE_APPLY_CHECKLIST_2026-08-20.md` | Operator steps post-merge |
| Migration A | `supabase/migrations/20260820130000_hv_pipeline_optimization.sql` | Pre-filter, review queue, stage log, safer promote/tick/dedup, HNSW, eval helper |
| Migration B | `supabase/migrations/20260820131000_hv_review_queue_resolve.sql` | Approve/reject/list RPCs for review queue |
| New tables | `hv_signal_review_queue`, `hv_pipeline_stage_log` | RLS on; service_role/postgres only |
| Cron enable | Still `INTEL_CRON_REENABLE_RUNBOOK.md` | Do not enable in migration |

**Registry impact:** documents new tables + migrations. Live apply + cron re-enable require separate operator confirmation and ledger update.

## Supplier Directory

| Area | Routes / Tables | Status |
|------|------------------|--------|
| Public | `/supplier-directory`, `/supplier-directory/apply`, `/supplier-directory/[id]` | Active (Phase 0 complete; public list + detail closed 2026-07-28) |
| Data | `supplier_profiles` | Active — RLS: public read (approved/active + verified), service write |
| Intake | Server action `submitSupplierApplication` + form | Complete |
| Admin | Pending review flow (via applicationsQuery + `/admin/(protected)/applications`) | Active |

## Residual systems catch-up — 2026-07-28 (code-presence)

**Status:** Scoped registry rows for systems closed in the Phase 0–1 residual pass. Confirmed paths exist on `main` at commit `03f1f3ea`. This is **not** a full live RLS / production-deployment re-verification.

| System | Routes / key files | Tables / data | Status |
|--------|--------------------|---------------|--------|
| Public supplier directory | `/supplier-directory`, `/supplier-directory/[id]`, `/supplier-directory/apply` | `supplier_profiles` | Active — public approved-only surface |
| Trade financing inquiry | `/marketplace/financing`, `app/actions/submitFinancingInquiry.ts`, `FinancingInquiryForm` | `marketplace_inquiries` (`inquiry_type=trade_financing`) | Active — inquiry spine; partner embed Phase 3 |
| My Briefings spine | `/dashboard/my-briefings`, `lib/intelligence/personalBriefing.ts` | Uses `getWatchlistData` + `getJurisdictionBriefing` + `getLatestBriefing` (`jurisdiction_briefings`) + on-demand `generatePersonalBriefing` via LLM gateway | Active — Phase 2 personal synthesis wired 2026-07-28; scheduled email delivery still deferred |
| Watchlists (public + Command Centre) | `/intelligence/watchlists`, dashboard WatchlistPage | `cc_watch_rules`, `cc_watchlist_items` | Active — rule builder live; public surface CTAs to Command Centre + My Briefings |
| Professionals directory (pattern mirror) | `/professionals`, `/professionals/[slug]`, `/professionals/apply` | `hv_professionals` (or equivalent) | Active — reference pattern for supplier directory |

**Still HOLD (full live re-verify):** production deployment ID freshness, live Supabase RLS per table, anonymous `/admin` denial, public leakage probe, marketplace category route 200s, GitHub secret mapping for Vercel IDs, branch-protection stale contexts. See sections below.

## Phase 2 — Personal briefings (2026-07-28)

| Component | Path | Notes |
|-----------|------|-------|
| Personal synthesis helper | `lib/intelligence/personalBriefing.ts` | On-demand LLM paragraph from watch keywords + published `jurisdiction_briefings`; deterministic fallback when gateway disabled |
| Weekly LLM market cards | `getLatestBriefing` from `lib/intelligence/jurisdictionSynthesis.ts` | Surfaces existing weekly Claude synthesis on My Briefings |
| Delivery | Existing `signal_subscriptions` + `/api/cron/intelligence-notify` | Cadence/market filters already live; watch-rule-driven personal email is next depth item |
| Schema | None | No new tables or migrations in this slice |

## Intelligence Productization Board — 2026-08-10 (control doc)

**Status:** Active planning / execution board. **Docs-only.** Does not certify production, RLS, or deployment state. Does not authorize migrations or runtime changes.

| Component | Path | Notes |
|-----------|------|-------|
| Execution board | `docs/control/INTELLIGENCE_PRODUCTIZATION_BOARD_2026-08-10.md` | 2-week Tier 1–3 board: wire Pipeline B outputs (quality, translations, clusters, embeddings) into customer-visible Intel, search, Digest; no new modules |
| Related assessment | `docs/PLATFORM_OPTIMIZATION_REVIEW_2026-07-30.md` | Live Jul-30 gap review (feed wiring, dead scorer, Stage D, freshness) |
| Quality handoff | `docs/QUALITY_PIPELINE_HANDOFF.md` | Pipeline B architecture debt and product-layer gaps |
| Public DTO allowlist | `docs/HARBOURVIEW_PUBLIC_PRIVATE_DTO_ALLOWLIST.md` | Customer-field source of truth for quality/translation/corroboration mapping |
| Schema / routes | None in this registry slice | Follow-on PRs (PR-A…E on the board) must name affected app/lib paths and update this registry if they add routes or tables |
| PR introducing board | #1333 | Branch `docs/intelligence-productization-board-2026-08-10` |

**Registry impact of this entry:** control-document registration only. No change to canonical Vercel mapping, Supabase project ref, public routes, or HOLD gates below.

---

*Remainder of registry unchanged from prior canonical content; full historical sections retained on `main`. This PR only prepends the 2026-08-20 intelligence pipeline optimization registration block above.*
