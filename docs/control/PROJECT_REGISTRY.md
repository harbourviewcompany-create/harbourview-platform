Status: Canonical registry with verified Harbourview Vercel production mapping as of 2026-05-17; Vercel team ID and project ID corrected by operator confirmation 2026-06-23. Scoped residual systems catch-up 2026-07-28 (code-presence only). Phase 2 personal briefings slice started 2026-07-28.
Scope: GitHub, Vercel and Supabase assets visible in connected audits, plus the 2026-05-17 verified Vercel connector state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`.
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

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

## Registry catch-up note — 2026-07-07

**Status:** Not a verified update — a scoped flag of what's missing, added while reviewing why the `Enforce registry impact discipline` CI check fails on nearly every current PR (see `HANDOFF.md` session log, Jul 7).

**2026-07-28 update:** Residual Phase 0–1 systems (supplier public surface, financing, my-briefings, watchlists) are registered under "Residual systems catch-up." Phase 2 personal briefings slice updates the My Briefings row above.

**Recommended next step:** a dedicated registry-reconciliation pass — list every system live in `main` today, add a row per system with actual verified routes/tables/RLS state, and re-run the full Vercel/Supabase verification block.

---

This registry is the source-of-truth map for Harbourview-related projects across GitHub, Vercel and Supabase. Every PR, issue, deployment task, Supabase task, Vercel task, cleanup action and agent handoff must name the affected registry row and state whether the registry changes.

## Canonical compliance/public copy ownership

- Canonical public compliance copy constants are owned in `lib/content/complianceCopy.ts`.
- Marketplace and intake routes must compose route-specific wrappers around those constants instead of duplicating inline phrases.
- Static regression check: `npm run test:public-copy-dedup`.

## Operating Rules (summary)

1. Name the affected registry row on every PR.
2. New routes/tables require a registry update in the same PR.
3. Production decisions must name exact GitHub repo, branch, Vercel project, domain and Supabase project.
4. Public/private boundaries must be verified before merge for marketplace, admin, intelligence, signal, source, candidate, inquiry or lead data.

## Supabase Control Notes (watchlist / briefings)

| Group | Tables | Control Read |
|---|---|---|
| Watchlist / Command Centre | `cc_watch_rules`, `cc_watchlist_items` | Authenticated watch rules + items (My Briefings + dashboard rule builder) |
| Weekly LLM briefings | `jurisdiction_briefings` | Published weekly synthesis from `synthesiseJurisdiction` |
| Orientation briefings | `cc_jurisdiction_briefings` | Static/public-safe orientation content via `getJurisdictionBriefing` |
| Signal delivery | `signal_subscriptions`, `signal_digest_log` | Email digest cadence for Intel/Operator tiers |
