# Harbourview Project Registry

Status: Canonical registry with confirmed Harbourview Vercel production mapping and 2026-05-16 source-of-truth HOLD notes  
Scope: GitHub, Vercel and Supabase assets visible in the connected audit plus operator-pasted Vercel production evidence and read-only repository/control verification  
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

## Purpose

This registry is the source-of-truth map for Harbourview-related projects across GitHub, Vercel and Supabase. Every PR, issue, deployment task, Supabase task, Vercel task, cleanup action and agent handoff must name the affected registry row and state whether the registry changes.

## Source-of-truth verification pass — 2026-05-16

**Status:** HOLD for complete source-of-truth closure. GO only for documentation-only recording of verified facts and unresolved HOLD gates.

**Scope:** Read-only repository/control verification. No runtime code, Supabase schema, migrations, RLS, auth logic, middleware, marketplace DTOs, routes, UI, workflows, dependencies, package files, Vercel config or deployment settings were changed.

**Verified repository/control facts:**

- `docs/control/DESIGN_SYSTEM.md` is the documented design-system authority.
- Tailwind/global CSS support the Harbourview navy/gold/off-white institutional direction.
- Playfair Display is not verified as an implemented/imported runtime font. Treat it as design direction only until repository evidence proves implementation.
- App Router structure is present through `app/layout.tsx`, app route files, protected admin route groups and API route files.
- Admin role names are `admin`, `operator`, `analyst` and `viewer`.
- Admin authorization evidence supports database-backed `user_roles` lookup and a custom `hv-admin-session` cookie path. Custom JWT claims remain unverified.
- Protected admin pages use server-side `requireAdminAuth()` before rendering private admin surfaces.
- Public marketplace DTO allowlisting exists in `lib/marketplace/publicListings.ts`.
- Public-leakage probe and marketplace smoke scripts exist, but script existence is not current production pass evidence.
- Smoke-write gates exist for write-based verification paths.

**Drift flagged:**

- Locked canonical production domain is `https://harbourview.vercel.app`.
- Historical durable smoke evidence and the current marketplace browser smoke workflow default still reference `https://harbourview-platform.vercel.app`.
- This documentation-only PR records the drift but does not change workflows, runtime code, Vercel settings, domain settings or environment variables.

**Still HOLD:**

- Vercel Project ID and Org ID for the canonical `harbourview` project/account.
- GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
- Branch protection and stale status contexts.
- Preview/staging safety and Supabase environment separation.
- Live Supabase RLS verification.
- Current canonical-domain public leakage pass.
- Current anonymous admin denial proof and full role matrix.
- Current canonical-domain route map and smoke evidence.

## Current Canonical Decisions

| Decision Area | Current Decision | Decision Status | Notes |
|---|---|---|---|
| Canonical production app | `harbourview-platform` | Confirmed canonical app | Main Harbourview platform repo with marketplace, intelligence, admin, intake and public platform surface. |
| Canonical production domain | `https://harbourview.vercel.app` | Confirmed canonical production domain | Confirmed from operator-pasted Vercel production deployment evidence. Historical smoke/default workflow references to `https://harbourview-platform.vercel.app` are drift and must not be treated as current canonical-domain proof. |
| Canonical Vercel project | `harbourview` | Confirmed canonical Vercel project mapping | Vercel account/team: `harbourviewcompany`; GitHub source: `harbourviewcompany-create/harbourview-platform`; branch: `main`; production deployment status: Ready; commit: `e67fbee`. Project ID and Org ID remain unresolved HOLD gates. |
| Canonical production database | `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg` | Provisional canonical | Contains marketplace tables, inquiries, role model, source intake, candidates and signal-engine migrations. Confirm live RLS state separately before any production write path or migration. |
| Parallel network build | `harbourview-network` | Incubation | Private repo with newer control structure. It must feed or replace the canonical app only after explicit decision. |
| Legacy signal data | `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte` | HOLD | Contains 430 `signals` rows but no migrations found. Treat as legacy/prototype until inspected. |
| Misnamed local chatbot repo | `Harbourview` | Rename/archive candidate | README identifies the repo as a Windows-first local Ollama/browser chatbot, not the Harbourview platform. |

## Confirmed Vercel Production Mapping

Evidence source: operator-pasted Vercel dashboard, deployment details and runtime logs for production deployment `F57SDFLwW` / `harbourview-5npukawm2-harbourviewnetwork.vercel.app`, recorded in this registry as confirmed mapping evidence.

| Field | Confirmed Value | Status |
|---|---|---|
| Production domain | `https://harbourview.vercel.app` | GO |
| Production deployment URL | `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` | GO |
| Vercel project name | `harbourview` | GO |
| Vercel team/account | `harbourviewcompany` | GO |
| GitHub source | `harbourviewcompany-create/harbourview-platform` | GO |
| Source branch | `main` | GO |
| Deployment status | Ready | GO |
| Deployment id | `F57SDFLwW` | GO |
| Deployment commit | `e67fbee` | GO |
| Commit message shown by Vercel | `Remove public contactEmail leakage from listing path (#172)` | GO |
| Created | May 8 by `harbourviewcompany-create` | GO |
| Build duration | 48s | GO |
| Build region | Washington, D.C., USA East / `iad1` | GO |
| Detected framework | Next.js `15.5.15` | GO |
| Node.js version | `24.x` | GO |
| Function region | `iad1` | GO |
| Fluid Compute | Enabled | GO |
| Deployment Protection | Standard Protection | GO |
| Skew Protection | Disabled | GO |
| On-Demand Concurrent Builds | Disabled | GO |
| Build Machine | Standard / 4 vCPU / 8 GB memory | GO |
| Prioritize Production Builds | Enabled | GO |
| Edge Requests | 3.1K over 6h dashboard window | GO |
| Function Invocations | 1.2K over 6h dashboard window | GO |
| Error Rate | 0% over 6h dashboard window | GO |
| Production checklist | 3/5 complete | HOLD |
| Web Analytics | Not enabled / no data | HOLD |
| Speed Insights | Not enabled | HOLD |
| Project ID | Not recorded | HOLD |
| Org ID | Not recorded | HOLD |
| GitHub secret mapping for `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Not confirmed | HOLD |

## Confirmed Runtime Route Evidence

Operator-pasted Vercel runtime logs confirm successful requests against `harbourview.vercel.app` on May 12. Cached `304` entries were also observed for `/about` and `/network/clinical-education`, but both routes had successful `200` evidence in the same runtime window.

| Route | Confirmed Status | Notes |
|---|---:|---|
| `/` | 200 | Production runtime log evidence. |
| `/signals` | 200 | Production runtime log evidence. |
| `/contact` | 200 | Production runtime log evidence. |
| `/about` | 200 | Also observed as 304 on a cached follow-up request. |
| `/marketplace` | 200 | Production runtime log evidence. |
| `/intelligence` | 200 | Production runtime log evidence. |
| `/marketplace/wanted` | 200 | Production runtime log evidence. |
| `/network/clinical-education` | 200 | Also observed as 304 on a cached follow-up request. |
| `/intake` | 200 | Production runtime log evidence. |
| `/legal/terms` | 200 | Production runtime log evidence. |
| `/legal/privacy` | 200 | Production runtime log evidence. |
| `/marketplace/sell` | 200 | Production runtime log evidence. |

## Active Preview Branch Evidence

The Vercel dashboard shows many active preview branches tied to `harbourviewcompany-create/harbourview-platform`. This supports the confirmed GitHub linkage but also preserves cleanup risk. Representative active branches observed include `preview/webp-public-listing-images` / PR `#284`, `fix/webp-public-listing-images-v3` / PR `#282`, `fix/webp-public-listing-images-v2` / PR `#281`, `fix/build-import-20260511` / PR `#273`, `fix/current-main-build-cleanup-20260511` / PR `#272`, `vercel-policy-final` / PR `#275`, `deploy/self-host-portability` / PR `#269`, `fix/ts-syntax-blockers-current-main` / PR `#271`, and `recover/institutional-discoverability-gateway` / PR `#185`.

## Remaining Vercel / Runtime HOLD Gates

| Gate | Status | Required Closure Evidence |
|---|---|---|
| Vercel Project ID | HOLD | Exact project ID for Vercel project `harbourview`. |
| Vercel Org ID | HOLD | Exact team/org ID for Vercel account `harbourviewcompany`. |
| GitHub secret mapping | HOLD | Confirm `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` point to the canonical `harbourview` project under `harbourviewcompany`. |
| Stale branch-protection contexts | HOLD | Confirm required GitHub checks do not require stale Vercel/Netlify contexts. |
| Anonymous `/admin` denial | HOLD | Confirm anonymous `/admin` is denied and does not leak admin/private content. |
| Public leakage scan | HOLD | Confirm production public pages do not expose forbidden provenance, evidence, internal review, source, availability or authorization fields. |
| Remaining marketplace category routes | HOLD | Confirm production `200` or intended redirect/not-found behavior for category routes not included in pasted evidence, including `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, and `/marketplace/business-opportunities`. |
| Dashboard error item for PR `#293` merge | HOLD | Inspect deployment/job/log context before classifying. |
| Production checklist incomplete | HOLD | Decide whether Web Analytics and Speed Insights are intentionally disabled or should be enabled. |
| Active preview branch sprawl | HOLD | Review before deleting branches, disconnecting previews or changing branch protection. |
| Domain/default drift | HOLD | Historical smoke evidence and marketplace-browser-smoke workflow default reference `https://harbourview-platform.vercel.app`; canonical current domain is `https://harbourview.vercel.app`. Close only through a separate workflow/runtime verification patch. |

## Master Project Register

| System | Project Name | Canonical Status | Purpose | GitHub Repo | Vercel Project | Supabase Project Ref | Production URL | Visibility | Current Risk | Disposition | Owner | Next Action | Decision Needed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GitHub / App / Vercel | Harbourview Platform | Confirmed canonical production app and Vercel mapping | Main Harbourview marketplace, intelligence, admin, intake and public platform surface | `harbourviewcompany-create/harbourview-platform` | `harbourview` under Vercel team/account `harbourviewcompany`; production branch `main`; Ready at commit `e67fbee` | `zvxdgdkukjrrwamdpqrg` likely target | `https://harbourview.vercel.app`; deployment URL `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` | Public repo | Project ID, Org ID, GitHub secret mapping, stale branch-protection contexts, anonymous `/admin` denial, public leakage scan, remaining marketplace category route evidence, PR #293 dashboard error item, incomplete production checklist, preview-branch sprawl and historical domain/default drift remain unresolved | Keep and stabilize as canonical | Tyler / Harbourview | Close remaining HOLD gates without modifying runtime code unless separately approved | Confirm Vercel IDs, secrets, branch-protection contexts, admin denial, leakage scan, category routes and preview cleanup plan |
| GitHub / App | Harbourview Network | Incubation / replacement candidate | Newer private Harbourview Network architecture and app foundation | `harbourviewcompany-create/harbourview-network` | Not visible | Not confirmed | None confirmed | Private repo | Could duplicate `harbourview-platform` work and split execution if treated as parallel production | Keep as architecture feeder or controlled replacement candidate | Tyler / Harbourview | Decide whether it feeds `harbourview-platform` or becomes future canonical repo | Decide merge-forward vs. replacement strategy |
| GitHub / App / Vercel | Chatbot | Separate active deployed product | AI/chat application deployed to Vercel | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` and related Vercel domains | Private repo; Vercel project visible in earlier audit context | May cause operator confusion if treated as Harbourview platform deployment target | Keep separate unless intentionally integrated | Tyler / Harbourview | Document deployment/env requirements and confirm whether it belongs inside Harbourview Network | Decide standalone vs. integrated product |
| GitHub / Local Tool | Local AI Chatbot | Non-canonical / misnamed | Windows-first local chatbot using browser fallback and optional Ollama | `harbourviewcompany-create/Harbourview` | Not visible | None | None | Private repo | Misleading repo name can cause operator confusion and agent mistakes | Rename to `local-ai-chatbot` or archive | Tyler | Rename/archive after preserving useful files | Confirm rename/archive |
| GitHub / Demo Portfolio | Contractor Demos | Demo/sales asset | Static demo websites and visual prototypes for sales/client demonstrations | `harbourviewcompany-create/contractor` | Not visible | None | None confirmed | Public repo | Public demo repo is acceptable only if no private/client-sensitive material exists | Keep as demo portfolio repo | Tyler | Add README clarifying demo-only status and route inventory | Confirm whether public visibility is intentional |
| GitHub / Webhook | HV Telnyx Webhook | Unknown / review required | Unknown Telnyx webhook utility | `harbourviewcompany-create/hv-telnyx-webhook` | Not visible | None | None | Public repo | Public webhook repo may expose operational assumptions even if no secrets are present | Inspect immediately; likely make private or archive | Tyler | Audit files, secrets history, deployment linkage and Telnyx usage | Decide active/private/archive |
| Supabase / Database | Harbourview Marketplace | Provisional canonical production database | Marketplace data, inquiries, admin role model, source intake, candidate workflow, signal-engine migrations | Expected consumer: `harbourview-platform` | Not directly applicable | `zvxdgdkukjrrwamdpqrg` | Supabase API URL should remain controlled | Supabase project active | Mixed migration history, public SECURITY DEFINER smoke RPC warnings, anon insert warning, JWT-disabled edge function, extension in public schema, live RLS state still requires current verification | Keep and harden | Tyler / Harbourview | Run DB hardening PR/migration plan and document intentional deny-by-default tables | Confirm as canonical production DB |
| Supabase / Database | Legacy Signal Project | Legacy/prototype pending inspection | Early signal/editorial/source/dossier schema; 430 signal rows | No confirmed GitHub repo | Not directly applicable | `fgdrvqqezdiraqyuofte` | None | Supabase project active | No migrations found; unclear ownership; data may be stranded or duplicated | Freeze except read-only inspection; migrate or archive later | Tyler / Harbourview | Export/inspect schema and sample rows, then decide migration into canonical DB | Decide migrate, archive, or keep as sandbox |
| Vercel / Deployment | Harbourview Vercel Target | Confirmed canonical production target | Production deployment target for Harbourview Platform | `harbourviewcompany-create/harbourview-platform` | `harbourview` under `harbourviewcompany` | Expected DB: `zvxdgdkukjrrwamdpqrg` | `https://harbourview.vercel.app`; `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` | Public production deployment | Project ID, Org ID, secret mapping and stale context cleanup remain unresolved | Keep as canonical deployment target | Tyler / Harbourview | Confirm Project ID, Org ID, GitHub secrets, branch protection and production safety scans | None for production domain/project name; remaining IDs and controls still required |
| Vercel / Deployment | Chatbot Vercel Project | Active separate deployment | Production deployment for chatbot app | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` | Visible in earlier Vercel team audit context | Must not be confused with canonical Harbourview production target | Keep separate | Tyler / Harbourview | Document env, domains and whether it should be under Harbourview product umbrella | Decide naming/domain strategy |

## External Deployment Context Classification

| Context | Classification | Current disposition |
|---|---|---|
| `Vercel – harbourview` | Canonical Vercel deployment context if backed by project `harbourview` under team/account `harbourviewcompany` | GO for domain/project mapping based on pasted Vercel evidence; HOLD until Project ID, Org ID and GitHub secret mapping are confirmed |
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
6. External deployment/status contexts must not be treated as complete canonical proof unless the registry identifies the backing project, workspace/team, linked repo, branch, domains, Project ID, Org ID and required GitHub secret mapping.
7. Operator-pasted dashboard evidence may establish a registry mapping, but unresolved machine-verifiable controls must remain listed as HOLD gates until independently checked.
8. Historical evidence tied to `https://harbourview-platform.vercel.app` must not be reused as current canonical-domain evidence for `https://harbourview.vercel.app` without a fresh verification run.

## Supabase Control Notes

### `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg`

Classification: provisional canonical production database.

Known table groups:

| Group | Tables | Control Read |
|---|---|---|
| Marketplace public/core | `listings`, `buyer_requests`, `supplier_profiles`, `marketplace_inquiries` | Active marketplace data and inquiry capture |
| Admin/server workflow | `matches`, `disclosure_requests`, `status_history`, `internal_admin_notes`, `audit_events` | Intended server-only/admin-only workflow tables |
| Authorization | `user_roles` | Harbourview role model anchor |
| Source/intelligence intake | `source_registry`, `source_snapshots`, `marketplace_candidates`, `candidate_review_events` | Evidence/source watching and candidate review foundation |
| Experimental/local lead capture | `wurx_ottawa_leads` | Needs classification and policy hardening |

Known cleanup items:

- Revoke public execution from smoke RPCs unless still intentionally required.
- Review `wurx_ottawa_leads` anonymous insert policy.
- Review `wurx-lead-notify` edge function because JWT verification is disabled.
- Move `vector` extension out of `public` schema when safe.
- Enable leaked password protection if Supabase Auth is used.
- Document RLS-enabled/no-policy server-only tables as intentional deny-by-default, or add explicit policies if not intentional.
- Verify live RLS state before any production write path, release claim or schema change.

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

- Vercel Project ID for canonical project `harbourview` is not recorded.
- Vercel Org ID for account/team `harbourviewcompany` is not recorded.
- GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` is not confirmed against the canonical `harbourview` Vercel project.
- Stale branch-protection contexts are not resolved, including possible stale Vercel and Netlify checks.
- Anonymous `/admin` denial has not been confirmed in the pasted evidence.
- Production public leakage scan has not been confirmed in the pasted evidence.
- Current canonical-domain smoke evidence has not been recorded for `https://harbourview.vercel.app`.
- Remaining marketplace category routes have not been confirmed in the pasted evidence: `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, `/marketplace/business-opportunities`.
- Dashboard error item for PR `#293` merge is not inspected or classified.
- Production checklist remains incomplete: Web Analytics and Speed Insights are not enabled or not classified as intentionally disabled.
- Active preview branch sprawl requires separate cleanup review before deletion or branch-protection changes.
- `harbourview-platform` has active PR debt and stale/superseded branches.
- The legacy Supabase signal project contains data but no migrations.
- `hv-telnyx-webhook` is public and not classified.
- Supabase canonical project has security advisor warnings requiring review.
- Playfair Display is not verified as an implemented/imported runtime font.
- Custom JWT claims are not verified; current evidence supports `user_roles` table lookup.
- The marketplace browser smoke workflow default still references `https://harbourview-platform.vercel.app` and requires a separate workflow/runtime patch if it is to be changed.

## Immediate GO Items

- Treat `harbourviewcompany-create/harbourview-platform` on `main` as the canonical Harbourview production app source.
- Treat Vercel project `harbourview` under account/team `harbourviewcompany` as the canonical Harbourview Vercel production project, subject to unresolved Project ID, Org ID and GitHub secret mapping gates.
- Treat `https://harbourview.vercel.app` as the canonical Harbourview production domain.
- Treat `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` as the current production deployment URL from the pasted Vercel overview.
- Treat deployment `F57SDFLwW` at commit `e67fbee` as Ready production evidence from the pasted Vercel dashboard.
- Treat the listed production route responses as confirmed runtime evidence for the routes covered by the pasted logs.
- Treat the 6h dashboard snapshot of 3.1K edge requests, 1.2K function invocations and 0% error rate as production observability evidence, not as a substitute for route/admin/leakage verification.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database for control purposes.
- Keep `harbourview-network` private and non-production until a replacement decision is made.
- Keep `chatbot` separate from Harbourview platform release control unless explicitly integrated.
- Keep this registry current before additional launch execution.
