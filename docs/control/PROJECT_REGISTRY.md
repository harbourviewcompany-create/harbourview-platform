Status: Canonical registry with verified Harbourview Vercel production mapping as of 2026-05-17; Vercel team ID and project ID corrected by operator confirmation 2026-06-23. Scoped residual systems catch-up 2026-07-28 (code-presence only). Phase 2 personal briefings slice started 2026-07-28.
Scope: GitHub, Vercel and Supabase assets visible in connected audits, plus the 2026-05-17 verified Vercel connector state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`.
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

## Jurisdictions identity seed — 2026-08-11 (control)

**Registry impact:** Harbourview Platform + provisional canonical DB (`zvxdgdkukjrrwamdpqrg`).

| Item | Detail |
|------|--------|
| Problem | Production `public.jurisdictions` = **0 rows**; `jurisdiction_crossref` ≈ 203 ISO bridges |
| Migration | `supabase/migrations/20260811140000_seed_jurisdictions_identity_from_countries.sql` |
| Source | `public.countries` (iso_alpha3 + country_slug) → `jurisdiction_id` format `country_area:<ALPHA3>` |
| Also | Links `jurisdiction_crossref.jurisdictions_id`; seeds minimal `country_profiles_public` identity DTOs |
| Claims | **Identity only** — `data_release_status = seeded_identity_pending_regulated_market_review` |
| Unblocks | Decision Intel Stage 0 (#1309) non-null jurisdiction linkage after merge + **production apply** |
| Apply gate | Migration must be applied to production separately; this PR does not deploy |

---

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

**Why this exists:** the registry above dates to 2026-05-17 and documents only Supplier Directory. Six weeks of `HANDOFF.md` session-log entries (Jun 23 – Jul 7) describe substantial systems with no corresponding registry rows: Command Centre dashboard (`app/dashboard`, `components/dashboard/CommandCentre.tsx`, `components/dashboard/MobileCommandCentre.tsx`), country/role intel routes (`app/country/[country]/role/[role]`), the Digest pipeline (`app/api/dashboard/digest`, `app/daily`, editorial content pipeline), the HF Intelligence Layer (`lib/hf/`), and the intelligence automation layer (`ia_*` tables). Confirmed only that these paths exist on disk (`test -e`) — did not re-verify their production/RLS/deployment state, which is what this registry is actually supposed to certify.

**What this note is NOT:** it is not a GO for any of the systems listed above, and it does not supersede or update the "Current Canonical Decisions," "Confirmed Vercel Production Mapping," or "Supabase Control Notes" sections below — those require live re-verification (current production deployment ID, current Supabase RLS per table, current branch-protection required checks) that wasn't performed this pass. Per this document's own Change policy, that re-verification is a separate approved cleanup task, not something to fold into an unrelated PR review/merge session.

**2026-07-28 update:** Residual Phase 0–1 systems (supplier public surface, financing, my-briefings, watchlists) are now registered above under "Residual systems catch-up." Phase 2 personal briefings slice updates the My Briefings row (on-demand LLM synthesis + weekly `jurisdiction_briefings` cards). Broader Command Centre / Digest / HF / ia_* systems remain in the 2026-07-07 HOLD scope until a dedicated full pass.

**Recommended next step:** a dedicated registry-reconciliation pass — list every system live in `main` today, add a row per system with actual verified routes/tables/RLS state, and re-run the full Vercel/Supabase verification block (mirroring the rigor of the original 2026-05-17 pass) rather than patching this document incrementally.

---

This registry is the source-of-truth map for Harbourview-related projects across GitHub, Vercel and Supabase. Every PR, issue, deployment task, Supabase task, Vercel task, cleanup action and agent handoff must name the affected registry row and state whether the registry changes.

## Canonical compliance/public copy ownership

- Canonical public compliance copy constants are owned in `lib/content/complianceCopy.ts`.
- Marketplace and intake routes must compose route-specific wrappers around those constants instead of duplicating inline phrases.
- Static regression check: `npm run test:public-copy-dedup`.

## Source-of-truth verification pass — 2026-05-17

**Status:** GO for canonical Vercel production mapping recorded below. HOLD remains for fresh post-merge production deployment proof, production leakage verification, anonymous admin-denial proof, marketplace browser smoke and live Supabase RLS verification.

**Scope:** Registry-only documentation update from the verified canonical state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`. No runtime code, Supabase schema, migrations, RLS, auth logic, middleware, marketplace DTOs, routes, UI, workflows, dependencies, package files, Vercel config or deployment settings were changed by this registry update.

**Verified canonical Vercel state:**

- Canonical production domain: `https://harbourview.vercel.app`.
- Vercel project ID: `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`.
- Vercel team ID: `team_0rK4jTvMLlSufR0ZzX4LCKYi`.
- Vercel team slug: `harbourview`.
- Latest production deployment ID: `dpl_4k2qicqtkwXKQD6CZkgKSDoZ9qoG`.
- Latest production deployment URL: `https://harbourview-4p247811y-harbourviewnetwork.vercel.app`.
- Production commit: `2ee3105e236122083d3fb86a16ca3c8811cce440` on `main`.
- Framework: `nextjs`.
- Node.js version: `24.x`.
- GitHub source: `harbourviewcompany-create/harbourview-platform`.
- Repository visibility: private.
- Verified date: 2026-05-17.

**Still HOLD:**

- Confirm GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` points to the verified canonical Vercel team/project IDs above.
- Branch protection and stale status contexts.
- Preview/staging safety and Supabase environment separation.
- Live Supabase RLS verification.
- Current canonical-domain public leakage pass against `https://harbourview.vercel.app`.
- Current anonymous admin denial proof and full role matrix.
- Current canonical-domain route map and smoke evidence.
- Fresh production deployment proof after any merge to `main`.

## Current Canonical Decisions

| Decision Area | Current Decision | Decision Status | Notes |
|---|---|---|---|
| Canonical production app | `harbourview-platform` | Confirmed canonical app | Main Harbourview platform repo with marketplace, intelligence, admin, intake and public platform surface. |
| Canonical production domain | `https://harbourview.vercel.app` | Confirmed canonical production domain | Verified through the 2026-05-17 Vercel connector state recorded in Notion dispatch `DSP-10`. |
| Canonical Vercel project | `harbourview` | Confirmed canonical Vercel project mapping | Project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`; team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`; team slug `harbourview`; GitHub source `harbourviewcompany-create/harbourview-platform`; branch `main`. |
| Canonical production database | `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg` | Provisional canonical | Contains marketplace tables, inquiries, role model, source intake, candidates and signal-engine migrations. Confirm live RLS state separately before any production write path or migration. |
| Parallel network build | `harbourview-network` | Incubation | Private repo with newer control structure. |
| Legacy signal data | `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte` | HOLD | Treat as legacy/prototype until inspected. |

## Operating Rules

1. No Harbourview PR, deployment, Supabase change, Vercel change, new repo, new route, new integration, new agent task or cleanup action is valid unless it names the affected registry row and states whether this registry must change.
2. New repos, Vercel projects, Supabase projects, public routes, workflows or migrations require an existing registry row or a registry update in the same PR.
3. Temporary verification PRs must be closed after evidence is captured.
4. Production deployment decisions must name the exact GitHub repo, branch, Vercel project, Vercel team/account, production domain and Supabase project.
5. Public/private boundaries must be verified before merge for any repo or route touching marketplace, admin, intelligence, signal, source, candidate, inquiry or lead data.
6. Production artifact source of truth: Vercel production pipeline for `harbourviewcompany-create/harbourview-platform` on `main`.

## Immediate GO Items

- Treat `harbourviewcompany-create/harbourview-platform` on `main` as the canonical Harbourview production app source.
- Treat Vercel project `harbourview` under team slug `harbourview` / team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi` as the canonical Harbourview Vercel production project.
- Treat `https://harbourview.vercel.app` as the canonical Harbourview production domain.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database for control purposes.
