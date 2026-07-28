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

**Superseded stale deployment and account entries:**

- Deployment ID `F57SDFLwW` is superseded.
- Deployment URL `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` is superseded.
- Deployment commit `e67fbee` is superseded.
- Vercel account/team values `harbourviewcompany` and `harbourviewnetwork` are both superseded for canonical production mapping by team slug `harbourview` and team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi` (operator confirmed 2026-06-23).
- Prior HOLD gates for unknown Vercel Project ID and Org/Team ID are closed by the verified values above.

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
| Canonical Vercel project | `harbourview` | Confirmed canonical Vercel project mapping | Project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`; team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`; team slug `harbourview`; GitHub source `harbourviewcompany-create/harbourview-platform`; branch `main`; production commit `2ee3105e236122083d3fb86a16ca3c8811cce440`. |
| Canonical production database | `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg` | Provisional canonical | Contains marketplace tables, inquiries, role model, source intake, candidates and signal-engine migrations. Confirm live RLS state separately before any production write path or migration. |
| Parallel network build | `harbourview-network` | Incubation | Private repo with newer control structure. It must feed or replace the canonical app only after explicit decision. |
| Legacy signal data | `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte` | HOLD | Contains 430 `signals` rows but no migrations found. Treat as legacy/prototype until inspected. |
| Misnamed local chatbot repo | `Harbourview` | Rename/archive candidate | README identifies the repo as a Windows-first local Ollama/browser chatbot, not the Harbourview platform. |

## Confirmed Vercel Production Mapping

Evidence source: 2026-05-17 verified Vercel connector state recorded in Notion dispatch `DSP-10` / `HAR-16 / HAR-22`.

| Field | Confirmed Value | Status |
|---|---|---|
| Production domain | `https://harbourview.vercel.app` | GO |
| Production deployment URL | `https://harbourview-4p247811y-harbourviewnetwork.vercel.app` | GO |
| Vercel project name | `harbourview` | GO |
| Vercel project ID | `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` | GO |
| Vercel team slug | `harbourview` | GO |
| Vercel team ID | `team_0rK4jTvMLlSufR0ZzX4LCKYi` | GO |
| GitHub source | `harbourviewcompany-create/harbourview-platform` | GO |
| GitHub repo ID | `1214598473` | GO |
| Source branch | `main` | GO |
| Deployment status | Latest production deployment recorded from connector state | GO |
| Deployment ID | `dpl_4k2qicqtkwXKQD6CZkgKSDoZ9qoG` | GO |
| Deployment commit | `2ee3105e236122083d3fb86a16ca3c8811cce440` | GO |
| Detected framework | `nextjs` | GO |
| Node.js version | `24.x` | GO |
| Repository visibility | Private | GO |
| Verified | 2026-05-17 | GO |
| GitHub secret mapping for `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Not confirmed against the verified IDs above | HOLD |

## Confirmed Runtime Route Evidence

Prior operator-pasted runtime logs confirmed successful requests against the previously tracked production domain on May 12. Those route results remain historical evidence only and must not be reused as current canonical-domain proof for `https://harbourview.vercel.app` without a fresh verification run.

| Route | Historical Status | Current Registry Read |
|---|---:|---|
| `/` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/signals` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/contact` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/about` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/marketplace` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/intelligence` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/marketplace/wanted` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/network/clinical-education` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/intake` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/legal/terms` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/legal/privacy` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/marketplace/sell` | 200 | Re-verify against `https://harbourview.vercel.app`. |
| `/supplier-directory` | — | Code-present on main (2026-07-28); production smoke recommended. |
| `/marketplace/financing` | — | Code-present on main (2026-07-28); production smoke recommended. |
| `/dashboard/my-briefings` | — | Code-present on main (2026-07-28); auth-gated; Phase 2 personal synthesis on branch; production smoke recommended after merge. |
| `/intelligence/watchlists` | — | Code-present on main (2026-07-28); production smoke recommended. |

## Active Preview Branch Evidence

The earlier Vercel dashboard review showed active preview branches tied to `harbourviewcompany-create/harbourview-platform`. This supports the confirmed GitHub linkage but also preserves cleanup risk. Representative active branches previously observed include `preview/webp-public-listing-images` / PR `#284`, `fix/webp-public-listing-images-v3` / PR `#282`, `fix/webp-public-listing-images-v2` / PR `#281`, `fix/build-import-20260511` / PR `#273`, `fix/current-main-build-cleanup-20260511` / PR `#272`, `vercel-policy-final` / PR `#275`, `deploy/self-host-portability` / PR `#269`, `fix/ts-syntax-blockers-current-main` / PR `#271`, and `recover/institutional-discoverability-gateway` / PR `#185`.

## Remaining Vercel / Runtime HOLD Gates

| Gate | Status | Required Closure Evidence |
|---|---|---|
| Vercel Project ID | GO | `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` — operator confirmed 2026-06-23. |
| Vercel Team ID | GO | `team_0rK4jTvMLlSufR0ZzX4LCKYi` (slug: `harbourview`) — operator confirmed 2026-06-23. |
| GitHub secret mapping | HOLD | Confirm `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` point to `team_0rK4jTvMLlSufR0ZzX4LCKYi` and `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`. |
| Stale branch-protection contexts | HOLD | Confirm required GitHub checks do not require stale Vercel/Netlify contexts. |
| Anonymous `/admin` denial | HOLD | Confirm anonymous `/admin` is denied and does not leak admin/private content on `https://harbourview.vercel.app`. |
| Public leakage scan | HOLD | Confirm production public pages do not expose forbidden provenance, evidence, internal review, source, availability or authorization fields on `https://harbourview.vercel.app`. |
| Remaining marketplace category routes | HOLD | Confirm production `200` or intended redirect/not-found behavior for `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, `/marketplace/business-opportunities` and other active category routes. |
| Production checklist | HOLD | Decide whether Web Analytics and Speed Insights are intentionally disabled or should be enabled. |
| Active preview branch sprawl | HOLD | Review before deleting branches, disconnecting previews or changing branch protection. |
| Domain/default drift | HOLD | Verification defaults and docs must be reconciled with `https://harbourview.vercel.app` after HAR-22 merge if PR #316 still contains older default-domain text. |

## Master Project Register

| System | Project Name | Canonical Status | Purpose | GitHub Repo | Vercel Project | Supabase Project Ref | Production URL | Visibility | Current Risk | Disposition | Owner | Next Action | Decision Needed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GitHub / App / Vercel | Harbourview Platform | Confirmed canonical production app and Vercel mapping | Main Harbourview marketplace, intelligence, admin, intake and public platform surface | `harbourviewcompany-create/harbourview-platform` | `harbourview` under Vercel team `harbourview` (slug, confirmed 2026-06-23); project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`; team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`; production branch `main`; production commit `2ee3105e236122083d3fb86a16ca3c8811cce440` | `zvxdgdkukjrrwamdpqrg` likely target | `https://harbourview.vercel.app`; deployment URL `https://harbourview-4p247811y-harbourviewnetwork.vercel.app` (historical; new deployments under team slug `harbourview`) | Private repo | GitHub secret mapping, stale branch-protection contexts, anonymous `/admin` denial, public leakage scan, remaining marketplace category route evidence, incomplete production checklist, preview-branch sprawl and verification-default drift remain unresolved | Keep and stabilize as canonical | Tyler / Harbourview | Close remaining HOLD gates without modifying runtime code unless separately approved | Confirm GitHub secrets, branch-protection contexts, admin denial, leakage scan, category routes and preview cleanup plan |
| GitHub / App | Harbourview Network | Incubation / replacement candidate | Newer private Harbourview Network architecture and app foundation | `harbourviewcompany-create/harbourview-network` | Not visible in this registry update | Not confirmed | None confirmed | Private repo | Could duplicate `harbourview-platform` work and split execution if treated as parallel production | Keep as architecture feeder or controlled replacement candidate | Tyler / Harbourview | Decide whether it feeds `harbourview-platform` or becomes future canonical repo | Decide merge-forward vs. replacement strategy |
| GitHub / App / Vercel | Chatbot | Separate active deployed product | AI/chat application deployed to Vercel | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` and related Vercel domains | Private repo; Vercel project visible in earlier audit context | May cause operator confusion if treated as Harbourview platform deployment target | Keep separate unless intentionally integrated | Tyler / Harbourview | Document deployment/env requirements and confirm whether it belongs inside Harbourview Network | Decide standalone vs. integrated product |
| GitHub / Local Tool | Local AI Chatbot | Non-canonical / misnamed | Windows-first local chatbot using browser fallback and optional Ollama | `harbourviewcompany-create/Harbourview` | Not visible | None | None | Private repo | Misleading repo name can cause operator confusion and agent mistakes | Rename to `local-ai-chatbot` or archive | Tyler | Rename/archive after preserving useful files | Confirm rename/archive |
| GitHub / Demo Portfolio | Contractor Demos | Demo/sales asset | Static demo websites and visual prototypes for sales/client demonstrations | `harbourviewcompany-create/contractor` | Not visible | None | None confirmed | Public repo | Public demo repo is acceptable only if no private/client-sensitive material exists | Keep as demo portfolio repo | Tyler | Add README clarifying demo-only status and route inventory | Confirm whether public visibility is intentional |
| GitHub / Webhook | HV Telnyx Webhook | Unknown / review required | Unknown Telnyx webhook utility | `harbourviewcompany-create/hv-telnyx-webhook` | Not visible | None | None | Public repo | Public webhook repo may expose operational assumptions even if no secrets are present | Inspect immediately; likely make private or archive | Tyler | Audit files, secrets history, deployment linkage and Telnyx usage | Decide active/private/archive |
| Supabase / Database | Harbourview Marketplace | Provisional canonical production database | Marketplace data, inquiries, admin role model, source intake, candidate workflow, signal-engine migrations | Expected consumer: `harbourview-platform` | Not directly applicable | `zvxdgdkukjrrwamdpqrg` | Supabase API URL should remain controlled | Supabase project active | Mixed migration history, public SECURITY DEFINER smoke RPC warnings, anon insert warning, JWT-disabled edge function, extension in public schema, live RLS state still requires current verification | Keep and harden | Tyler / Harbourview | Run DB hardening PR/migration plan and document intentional deny-by-default tables | Confirm as canonical production DB |
| Supabase / Database | Legacy Signal Project | Legacy/prototype pending inspection | Early signal/editorial/source/dossier schema; 430 signal rows | No confirmed GitHub repo | Not directly applicable | `fgdrvqqezdiraqyuofte` | None | Supabase project active | No migrations found; unclear ownership; data may be stranded or duplicated | Freeze except read-only inspection; migrate or archive later | Tyler / Harbourview | Export/inspect schema and sample rows, then decide migration into canonical DB | Decide migrate, archive, or keep as sandbox |
| Vercel / Deployment | Harbourview Vercel Target | Confirmed canonical production target | Production deployment target for Harbourview Platform | `harbourviewcompany-create/harbourview-platform` | `harbourview` under team slug `harbourview` / team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`; project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (operator confirmed 2026-06-23) | Expected DB: `zvxdgdkukjrrwamdpqrg` | `https://harbourview.vercel.app`; `https://harbourview-4p247811y-harbourviewnetwork.vercel.app` (historical deployment URL) | Public production deployment | GitHub secret mapping and stale context cleanup remain unresolved | Keep as canonical deployment target | Tyler / Harbourview | Confirm GitHub secrets, branch protection and production safety scans | None for production domain/project/team IDs; remaining controls still required |
| Vercel / Deployment | Chatbot Vercel Project | Active separate deployment | Production deployment for chatbot app | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` | Visible in earlier Vercel team audit context | Must not be confused with canonical Harbourview production target | Keep separate | Tyler / Harbourview | Document env, domains and whether it should be under Harbourview product umbrella | Decide naming/domain strategy |

## External Deployment Context Classification

| Context | Classification | Current disposition |
|---|---|---|
| `Vercel – harbourview` | Canonical Vercel deployment context backed by project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` under team slug `harbourview` / team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi` (operator confirmed 2026-06-23) | GO for project/domain/team mapping; HOLD until GitHub secret mapping and branch-protection required checks are confirmed |
| `Vercel – harbourview-platform` | Potential stale/duplicate context | HOLD until branch-protection requirements and Vercel project ownership are inspected |
| `Vercel – harbourview-platform-rod3` | Potential stale/duplicate context | HOLD until branch-protection requirements and Vercel project ownership are inspected |
| `netlify/harbourview-platform/deploy-preview` | Duplicate/stale candidate | Remove from required checks or disconnect only after confirming it is not canonical |
| `netlify/harbourviewns/deploy-preview` | Duplicate/stale candidate | Remove from required checks or disconnect only after confirming it is not canonical |
| `netlify/harbourview-international/deploy-preview` | Duplicate/stale candidate | Remove from required checks or disconnect only after confirming it is not canonical |
| Vercel `chatbot` | Separate Vercel project | Keep outside Harbourview Platform deployment control unless explicitly integrated |

## Operating Rules

1. No Harbourview PR, deployment, Supabase change, Vercel change, new repo, new route, new integration, new agent task or cleanup action is valid unless it names the affected registry row and states whether this registry must change.
2. New repos, Vercel projects, Supabase projects, public routes, workflows or migrations require an existing registry row or a registry update in the same PR.
3. Temporary verification PRs must be closed after evidence is captured.
4. Production deployment decisions must name the exact GitHub repo, branch, Vercel project, Vercel team/account, production domain and Supabase project.
5. Public/private boundaries must be verified before merge for any repo or route touching marketplace, admin, intelligence, signal, source, candidate, inquiry or lead data.
6. External deployment/status contexts must not be treated as complete canonical proof unless the registry identifies the backing project, workspace/team, linked repo, branch, domains, Project ID, Team ID and required GitHub secret mapping.
7. Operator-pasted dashboard evidence may establish a registry mapping, but unresolved machine-verifiable controls must remain listed as HOLD gates until independently checked.
8. Historical evidence tied to older Harbourview domains must not be reused as current canonical-domain evidence for `https://harbourview.vercel.app` without a fresh verification run.
9. **Production artifact source of truth:** production release artifacts are the outputs produced by the canonical Vercel production pipeline for `harbourviewcompany-create/harbourview-platform` on `main` (project `harbourview`, team slug `harbourview` / team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`, domain `https://harbourview.vercel.app`); local Node builds (`npm run build`) and Cloudflare/OpenNext commands (`npm run preview`, `npm run deploy`, `npm run upload`) are validation or alternate-runtime workflows and must not be treated as canonical production evidence unless this registry is explicitly updated.

## Supabase Control Notes

### `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg`

Classification: provisional canonical production database.

Known table groups:

| Group | Tables | Control Read |
|---|---|---|
| Marketplace public/core | `listings`, `buyer_requests`, `supplier_profiles`, `marketplace_inquiries` | Active marketplace data and inquiry capture (includes `inquiry_type=trade_financing`) |
| Admin/server workflow | `matches`, `disclosure_requests`, `status_history`, `internal_admin_notes`, `audit_events` | Intended server-only/admin-only workflow tables |
| Authorization | `user_roles` | Harbourview role model anchor |
| Source/intelligence intake | `source_registry`, `source_snapshots`, `marketplace_candidates`, `candidate_review_events` | Evidence/source watching and candidate review foundation |
| Watchlist / Command Centre | `cc_watch_rules`, `cc_watchlist_items` | Authenticated watch rules + items (My Briefings + dashboard rule builder) |
| Weekly LLM briefings | `jurisdiction_briefings` | Published weekly synthesis from `synthesiseJurisdiction` (surfaced on My Briefings Phase 2) |
| Experimental/local lead capture | `wurx_ottawa_leads` | Needs classification and policy hardening |

Known cleanup items:

- Revoke public execution from smoke RPCs unless still intentionally required.
- Review `wurx_ottawa_leads` anonymous insert policy.
- Review `wurx-lead-notify` edge function because JWT verification is disabled.
- Move `vector` extension out of `public` schema when safe.
- Enable leaked password protection if Supabase Auth is used.
- Document RLS-enabled/no-policy server-only tables as intentional deny-by-default, or add explicit policies if not intentional.
- Verify live RLS state before any production write path, release claim or schema change.
- **2026-07-10 — `listings` ratings columns forward-fix pending.** `average_rating`/`review_count`/`ratings_updated_at` (added by `20260709000000_add_ratings_to_listings.sql`, PR #1000/#1004) were already applied directly to this production project on 2026-07-09 with three defects: `review_count` typed `integer` (overflow risk), the two supporting indexes created without `CONCURRENTLY` (table-lock risk), and `average_rating` defaulting to `0.0` instead of `NULL` for "no ratings yet". This session's fix (`supabase/migrations/20260709000000_add_ratings_to_listings.sql` + new `20260710160000_add_ratings_indexes_concurrently.sql`) corrects the checked-in migration files for any fresh environment, but since these objects are already live in production with the old (buggy) shape, the fix does **not** retroactively apply there — a follow-up forward-fix migration (`ALTER TABLE listings ALTER COLUMN review_count TYPE bigint`, `ALTER COLUMN average_rating DROP DEFAULT`, drop + `CREATE INDEX CONCURRENTLY` the two existing indexes) is required against `zvxdgdkukjrrwamdpqrg` and needs explicit production sign-off before running. See `docs/control/DATABASE_CONTROL.md` for full detail.

### `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte`

Classification: legacy/prototype pending inspection.

Known tables:

| Table | Rows | Control Read |
|---|---:|---|
| `signals` | 430 | Material data exists; inspect before archive |
| `editorials` | 2 | Small content set |
| `workspaces` | 0 | Empty |
| `sources` | 0 | Empty |
| `source_documents` | 0 | Empty |
| `dossiers` | 0 | Empty |

Control rule: no new writes until this project is classified. Export schema and representative rows before any pause/archive decision.

## Immediate HOLD Items

- GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` is not confirmed against the canonical Vercel team/project IDs.
- Stale branch-protection contexts are not resolved, including possible stale Vercel and Netlify checks.
- Anonymous `/admin` denial has not been confirmed against `https://harbourview.vercel.app`.
- Production public leakage scan has not been confirmed against `https://harbourview.vercel.app`.
- Current canonical-domain smoke evidence has not been recorded for `https://harbourview.vercel.app`.
- Remaining marketplace category routes have not been confirmed against `https://harbourview.vercel.app`: `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, `/marketplace/business-opportunities`.
- Production checklist remains incomplete or not classified: Web Analytics and Speed Insights.
- Active preview branch sprawl requires separate cleanup review before deletion or branch-protection changes.
- `harbourview-platform` has active PR debt and stale/superseded branches.
- The legacy Supabase signal project contains data but no migrations.
- `hv-telnyx-webhook` is public and not classified.
- Supabase canonical project has security advisor warnings requiring review.
- Playfair Display is not verified as an implemented/imported runtime font.
- Custom JWT claims are not verified; current evidence supports `user_roles` table lookup.
- Verification defaults and docs must be checked for post-HAR-22 drift if they still target an older Harbourview production domain.

## External Dependencies (Harbourview Marketplace / `zvxdgdkukjrrwamdpqrg`)

| Dependency | Used by | Purpose | Auth | Noted |
|---|---|---|---|---|
| OpenAI `gpt-4o-mini` | `hv_entity_jobs` queue + `hv_entities_dispatch`/`hv_entities_harvest` functions, called via `pg_net` from `hv_pipeline_tick` | Named-entity extraction (operators/regulators/investors) from promoted signals, resolved/created into `ia_graph_entities`, linked via `signal_entities` | Vaulted `openai_api_key` (Supabase Vault, service_role-only) | 2026-07-23 — dependency was live in production prior to this entry; documented retroactively per the registry change policy flagged in PR #1095 |

## Immediate GO Items

- Treat `harbourviewcompany-create/harbourview-platform` on `main` as the canonical Harbourview production app source.
- Treat Vercel project `harbourview` under team slug `harbourview` / team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi` as the canonical Harbourview Vercel production project (operator confirmed 2026-06-23; supersedes prior `harbourviewnetwork` team slug entries).
- Treat Vercel project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` as the canonical Harbourview Vercel project ID.
- Treat `https://harbourview.vercel.app` as the canonical Harbourview production domain.
- Treat `https://harbourview-4p247811y-harbourviewnetwork.vercel.app` as the latest production deployment URL from the verified Vercel connector state.
- Treat deployment `dpl_4k2qicqtkwXKQD6CZkgKSDoZ9qoG` at commit `2ee3105e236122083d3fb86a16ca3c8811cce440` as the latest recorded production deployment evidence from the verified Vercel connector state.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database for control purposes.
- Keep `harbourview-network` private and non-production until a replacement decision is made.
- Keep `chatbot` separate from Harbourview platform release control unless explicitly integrated.
- Keep this registry current before additional launch execution.
