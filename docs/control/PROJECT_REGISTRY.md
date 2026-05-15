# Harbourview Project Registry

Status: Canonical registry updated to the HAR-56 verified Harbourview Vercel production state  
Scope: GitHub, Vercel and Supabase assets visible in the connected audit plus Linear HAR-56 verified production evidence  
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy, reconfigure domains, change branch protection, change secrets, modify Supabase, modify runtime code, modify middleware, modify auth, modify dependencies or migrate anything without a separate approved cleanup PR or operator confirmation.

## Purpose

This registry is the source-of-truth map for Harbourview-related projects across GitHub, Vercel and Supabase. Every PR, issue, deployment task, Supabase task, Vercel task, cleanup action and agent handoff must name the affected registry row and state whether the registry changes.

## Current Canonical Decisions

| Decision Area | Current Decision | Decision Status | Notes |
|---|---|---|---|
| Canonical production app | `harbourview-platform` | Confirmed canonical app | Main Harbourview platform repo with marketplace, intelligence, admin, intake and public platform surface. |
| Canonical production domain | `https://harbourview-nu.vercel.app` | Confirmed canonical production domain | Supersedes prior `https://harbourview.vercel.app` registry evidence. Verified in HAR-56 from Vercel live state. |
| Canonical Vercel project | `harbourview` | Confirmed canonical Vercel project mapping | Vercel team: `Harbourview` / `harbourviewnetwork` / `team_zFcrpEaH7xxVPfFlj9yAKMZf`; project ID: `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ`; GitHub source: `harbourviewcompany-create/harbourview-platform`; branch: `main`; production deployment status: `READY`; commit: `2ee3105e236122083d3fb86a16ca3c8811cce440`. |
| Canonical production database | `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg` | Provisional canonical | Contains marketplace tables, inquiries, role model, source intake, candidates and signal-engine migrations. Confirm separately before any production write path or migration. |
| Parallel network build | `harbourview-network` | Incubation | Private repo with newer control structure. It must feed or replace the canonical app only after explicit decision. |
| Legacy signal data | `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte` | HOLD | Contains 430 `signals` rows but no migrations found. Treat as legacy/prototype until inspected. |
| Misnamed local chatbot repo | `Harbourview` | Rename/archive candidate | README identifies the repo as a Windows-first local Ollama/browser chatbot, not the Harbourview platform. |

## Confirmed Vercel Production Mapping

Evidence source: Linear HAR-56 Vercel MCP live verification. HAR-56 closed on 2026-05-15 and records the verified project, team, domain, deployment, branch alias, region, source repo and commit.

| Field | Confirmed Value | Status |
|---|---|---|
| Production domain | `https://harbourview-nu.vercel.app` | GO |
| Production deployment URL | `https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app` | GO |
| Branch alias | `https://harbourview-git-main-harbourviewnetwork.vercel.app` | GO |
| Vercel project name | `harbourview` | GO |
| Vercel project ID | `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ` | GO |
| Vercel team/account | `Harbourview` / `harbourviewnetwork` | GO |
| Vercel team ID | `team_zFcrpEaH7xxVPfFlj9yAKMZf` | GO |
| GitHub source | `harbourviewcompany-create/harbourview-platform` | GO |
| GitHub repo ID | `1214598473` | GO |
| Source branch | `main` | GO |
| Deployment status | `READY` | GO |
| Deployment target | `production` | GO |
| Deployment id | `dpl_FRHiKm5k7P9xFSFDCfJC4u9piM6e` | GO |
| Deployment commit | `2ee3105e236122083d3fb86a16ca3c8811cce440` | GO |
| Commit message shown by Vercel | `Merge PR #313` | GO |
| Framework | Next.js | GO |
| Node.js version | `24.x` | GO |
| Region | `iad1` | GO |
| Vercel project-level `live: false` flag | API artefact / not blocker | HAR-56 states production deployment `READY` with target `production` is authoritative. |
| GitHub secret mapping for `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Not confirmed from GitHub settings | HOLD |
| Required GitHub branch-protection contexts | Not confirmed | HOLD |

## Superseded / Unproven Prior Production Evidence

The previous registry entry declared `https://harbourview.vercel.app` as canonical using operator-pasted dashboard evidence for deployment `F57SDFLwW`, deployment URL `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app`, Vercel account `harbourviewcompany`, and commit `e67fbee`.

HAR-56 supersedes that evidence. The prior mapping now has the following control classification:

| Prior item | Prior value | Current classification | Required handling |
|---|---|---|---|
| Prior production domain | `https://harbourview.vercel.app` | Superseded / not canonical | Do not use as default production URL unless Tyler explicitly re-authorizes it. |
| Prior deployment id | `F57SDFLwW` | Superseded evidence | Preserve as historical evidence only. Do not use as current production proof. |
| Prior deployment commit | `e67fbee` | Superseded evidence | Preserve as historical evidence only. Current verified commit is `2ee3105e236122083d3fb86a16ca3c8811cce440`. |
| Prior Vercel team/account label | `harbourviewcompany` | Superseded / ambiguous | Current verified team is `Harbourview` / `harbourviewnetwork` / `team_zFcrpEaH7xxVPfFlj9yAKMZf`. |
| Prior deployment URL | `https://harbourview-5npukawm2-harbourviewnetwork.vercel.app` | Superseded evidence | Current verified deployment URL is `https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app`. |

Control rule: production probes, smoke defaults, release notes and coordinator dispatches must use `https://harbourview-nu.vercel.app` unless a later approved registry update changes this row.

## Runtime Route Evidence

Prior runtime route evidence against `https://harbourview.vercel.app` is preserved as historical evidence only. It is not current canonical production proof after HAR-56.

Current route proof requirement: re-run production visibility and leakage probes against `https://harbourview-nu.vercel.app` before claiming production readiness.

| Route | Current Status | Required Closure Evidence |
|---|---|---|
| `/` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/signals` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/contact` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/about` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/marketplace` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/intelligence` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/marketplace/wanted` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/network/clinical-education` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/intake` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/legal/terms` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/legal/privacy` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |
| `/marketplace/sell` | HOLD | Confirm 200 or intended redirect at `https://harbourview-nu.vercel.app`. |

## Active Preview Branch Evidence

The Vercel dashboard previously showed many active preview branches tied to `harbourviewcompany-create/harbourview-platform`. This supports the GitHub linkage but preserves cleanup risk. Representative active branches observed include `preview/webp-public-listing-images` / PR `#284`, `fix/webp-public-listing-images-v3` / PR `#282`, `fix/webp-public-listing-images-v2` / PR `#281`, `fix/build-import-20260511` / PR `#273`, `fix/current-main-build-cleanup-20260511` / PR `#272`, `vercel-policy-final` / PR `#275`, `deploy/self-host-portability` / PR `#269`, `fix/ts-syntax-blockers-current-main` / PR `#271`, and `recover/institutional-discoverability-gateway` / PR `#185`.

Preview branch cleanup remains a separate HOLD item. Do not delete branches, disconnect previews, alter domains or change branch protection from this registry update.

## Remaining Vercel / Runtime HOLD Gates

| Gate | Status | Required Closure Evidence |
|---|---|---|
| GitHub secret mapping | HOLD | Confirm `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` point to `team_zFcrpEaH7xxVPfFlj9yAKMZf` and `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ`. |
| Stale branch-protection contexts | HOLD | Confirm required GitHub checks do not require stale Vercel/Netlify contexts, especially `netlify/harbourview-platform/deploy-preview`. |
| Anonymous `/admin` denial | HOLD | Confirm anonymous `/admin` is denied and does not leak admin/private content on `https://harbourview-nu.vercel.app`. |
| Public leakage scan | HOLD | Confirm production public pages do not expose forbidden provenance, evidence, internal review, source, availability or authorization fields on `https://harbourview-nu.vercel.app`. |
| Remaining marketplace category routes | HOLD | Confirm production `200` or intended redirect/not-found behavior for category routes including `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, and `/marketplace/business-opportunities`. |
| Dashboard error item for PR `#293` merge | HOLD | Inspect deployment/job/log context before classifying. |
| Production checklist incomplete | HOLD | Decide whether Web Analytics and Speed Insights are intentionally disabled or should be enabled. |
| Active preview branch sprawl | HOLD | Review before deleting branches, disconnecting previews or changing branch protection. |

## Master Project Register

| System | Project Name | Canonical Status | Purpose | GitHub Repo | Vercel Project | Supabase Project Ref | Production URL | Visibility | Current Risk | Disposition | Owner | Next Action | Decision Needed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GitHub / App / Vercel | Harbourview Platform | Confirmed canonical production app and Vercel mapping | Main Harbourview marketplace, intelligence, admin, intake and public platform surface | `harbourviewcompany-create/harbourview-platform` | `harbourview` under Vercel team/account `Harbourview` / `harbourviewnetwork`; team ID `team_zFcrpEaH7xxVPfFlj9yAKMZf`; project ID `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ`; production branch `main`; Ready at commit `2ee3105e236122083d3fb86a16ca3c8811cce440` | `zvxdgdkukjrrwamdpqrg` likely target | `https://harbourview-nu.vercel.app`; deployment URL `https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app`; branch alias `https://harbourview-git-main-harbourviewnetwork.vercel.app` | Public production deployment | GitHub secret mapping, stale branch-protection contexts, anonymous `/admin` denial, public leakage scan, remaining marketplace category route evidence, PR #293 dashboard error item, incomplete production checklist and preview-branch sprawl remain unresolved | Keep and stabilize as canonical | Tyler / Harbourview | Close remaining HOLD gates without modifying runtime code unless separately approved | Confirm secrets, branch-protection contexts, admin denial, leakage scan, category routes and preview cleanup plan |
| GitHub / App | Harbourview Network | Incubation / replacement candidate | Newer private Harbourview Network architecture and app foundation | `harbourviewcompany-create/harbourview-network` | Not visible | Not confirmed | None confirmed | Private repo | Could duplicate `harbourview-platform` work and split execution if treated as parallel production | Keep as architecture feeder or controlled replacement candidate | Tyler / Harbourview | Decide whether it feeds `harbourview-platform` or becomes future canonical repo | Decide merge-forward vs. replacement strategy |
| GitHub / App / Vercel | Chatbot | Separate active deployed product | AI/chat application deployed to Vercel | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` and related Vercel domains | Private repo; Vercel project visible in earlier audit context | May cause operator confusion if treated as Harbourview platform deployment target | Keep separate unless intentionally integrated | Tyler / Harbourview | Document deployment/env requirements and confirm whether it belongs inside Harbourview Network | Decide standalone vs. integrated product |
| GitHub / Local Tool | Local AI Chatbot | Non-canonical / misnamed | Windows-first local chatbot using browser fallback and optional Ollama | `harbourviewcompany-create/Harbourview` | Not visible | None | None | Private repo | Misleading repo name can cause operator confusion and agent mistakes | Rename to `local-ai-chatbot` or archive | Tyler | Rename/archive after preserving useful files | Confirm rename/archive |
| GitHub / Demo Portfolio | Contractor Demos | Demo/sales asset | Static demo websites and visual prototypes for sales/client demonstrations | `harbourviewcompany-create/contractor` | Not visible | None | None confirmed | Public repo | Public demo repo is acceptable only if no private/client-sensitive material exists | Keep as demo portfolio repo | Tyler | Add README clarifying demo-only status and route inventory | Confirm whether public visibility is intentional |
| GitHub / Webhook | HV Telnyx Webhook | Unknown / review required | Unknown Telnyx webhook utility | `harbourviewcompany-create/hv-telnyx-webhook` | Not visible | None | None | Public repo | Public webhook repo may expose operational assumptions even if no secrets are present | Inspect immediately; likely make private or archive | Tyler | Audit files, secrets history, deployment linkage and Telnyx usage | Decide active/private/archive |
| Supabase / Database | Harbourview Marketplace | Provisional canonical production database | Marketplace data, inquiries, admin role model, source intake, candidate workflow, signal-engine migrations | Expected consumer: `harbourview-platform` | Not directly applicable | `zvxdgdkukjrrwamdpqrg` | Supabase API URL should remain controlled | Supabase project active | Mixed migration history, public SECURITY DEFINER smoke RPC warnings, anon insert warning, JWT-disabled edge function, extension in public schema | Keep and harden | Tyler / Harbourview | Run DB hardening PR/migration plan and document intentional deny-by-default tables | Confirm as canonical production DB |
| Supabase / Database | Legacy Signal Project | Legacy/prototype pending inspection | Early signal/editorial/source/dossier schema; 430 signal rows | No confirmed GitHub repo | Not directly applicable | `fgdrvqqezdiraqyuofte` | None | Supabase project active | No migrations found; unclear ownership; data may be stranded or duplicated | Freeze except read-only inspection; migrate or archive later | Tyler / Harbourview | Export/inspect schema and sample rows, then decide migration into canonical DB | Decide migrate, archive, or keep as sandbox |
| Vercel / Deployment | Harbourview Vercel Target | Confirmed canonical production target | Production deployment target for Harbourview Platform | `harbourviewcompany-create/harbourview-platform` | `harbourview` under `Harbourview` / `harbourviewnetwork`; project ID `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ` | Expected DB: `zvxdgdkukjrrwamdpqrg` | `https://harbourview-nu.vercel.app`; `https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app`; branch alias `https://harbourview-git-main-harbourviewnetwork.vercel.app` | Public production deployment | GitHub secret mapping and stale context cleanup remain unresolved | Keep as canonical deployment target | Tyler / Harbourview | Confirm GitHub secrets, branch protection and production safety scans | None for production domain/project/team; remaining controls still required |
| Vercel / Deployment | Chatbot Vercel Project | Active separate deployment | Production deployment for chatbot app | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` | Visible in earlier Vercel team audit context | Must not be confused with canonical Harbourview production target | Keep separate | Tyler / Harbourview | Document env, domains and whether it should be under Harbourview product umbrella | Decide naming/domain strategy |

## External Deployment Context Classification

| Context | Classification | Current disposition |
|---|---|---|
| `Vercel – harbourview` | Canonical Vercel deployment context if backed by project `harbourview` under team/account `Harbourview` / `harbourviewnetwork` | GO for domain/project mapping based on HAR-56; HOLD until GitHub secret mapping and branch-protection contexts are confirmed |
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
7. Linear/Vercel live-state evidence may establish a registry mapping, but unresolved machine-verifiable controls must remain listed as HOLD gates until independently checked.

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

- GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` is not confirmed against team `team_zFcrpEaH7xxVPfFlj9yAKMZf` and project `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ`.
- Stale branch-protection contexts are not resolved, including possible stale Vercel and Netlify checks.
- Anonymous `/admin` denial has not been confirmed on `https://harbourview-nu.vercel.app` in this registry update.
- Production public leakage scan has not been confirmed on `https://harbourview-nu.vercel.app` in this registry update.
- Remaining marketplace category routes have not been confirmed on `https://harbourview-nu.vercel.app`: `/marketplace/consumables`, `/marketplace/new-products`, `/marketplace/used-surplus`, `/marketplace/services`, `/marketplace/business-opportunities`.
- Dashboard error item for PR `#293` merge is not inspected or classified.
- Production checklist remains incomplete: Web Analytics and Speed Insights are not enabled or not classified as intentionally disabled.
- Active preview branch sprawl requires separate cleanup review before deletion or branch-protection changes.
- `harbourview-platform` has active PR debt and stale/superseded branches.
- The legacy Supabase signal project contains data but no migrations.
- `hv-telnyx-webhook` is public and not classified.
- Supabase canonical project has security advisor warnings requiring review.

## Immediate GO Items

- Treat `harbourviewcompany-create/harbourview-platform` on `main` as the canonical Harbourview production app source.
- Treat Vercel project `harbourview` under account/team `Harbourview` / `harbourviewnetwork` as the canonical Harbourview Vercel production project.
- Treat `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ` as the canonical Vercel project ID recorded by HAR-56.
- Treat `team_zFcrpEaH7xxVPfFlj9yAKMZf` as the canonical Vercel team ID recorded by HAR-56.
- Treat `https://harbourview-nu.vercel.app` as the canonical Harbourview production domain.
- Treat `https://harbourview-14bdr4iuk-harbourviewnetwork.vercel.app` as the current production deployment URL recorded by HAR-56.
- Treat deployment `dpl_FRHiKm5k7P9xFSFDCfJC4u9piM6e` at commit `2ee3105e236122083d3fb86a16ca3c8811cce440` as Ready production evidence recorded by HAR-56.
- Treat prior `https://harbourview.vercel.app`, deployment `F57SDFLwW`, and commit `e67fbee` evidence as superseded historical evidence unless Tyler explicitly re-authorizes it.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database for control purposes.
- Keep `harbourview-network` private and non-production until a replacement decision is made.
- Keep `chatbot` separate from Harbourview platform release control unless explicitly integrated.
- Keep this registry current before additional launch execution.