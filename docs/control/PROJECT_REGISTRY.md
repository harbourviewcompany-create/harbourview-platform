# Harbourview Project Registry

Status: Draft canonical registry  
Scope: GitHub, Vercel and Supabase assets visible in the connected audit  
Change policy: This document is a control register. It is not approval to delete, pause, merge, deploy or migrate anything without a separate approved cleanup PR or operator confirmation.

## Purpose

This registry is the source-of-truth map for Harbourview-related projects across GitHub, Vercel and Supabase. Every PR, issue, deployment task, Supabase task, Vercel task, cleanup action and agent handoff must name the affected registry row and state whether the registry changes.

## Current Canonical Decisions

| Decision Area | Current Decision | Decision Status | Notes |
|---|---|---|---|
| Canonical production app | `harbourview-platform` | Provisional canonical | Most mature Harbourview product repo with marketplace, admin, leakage tests, smoke tests and control scripts. |
| Canonical production database | `Harbourview Marketplace` / `zvxdgdkukjrrwamdpqrg` | Provisional canonical | Contains marketplace tables, inquiries, role model, source intake, candidates and signal-engine migrations. |
| Canonical Vercel deployment | Unresolved | HOLD | Connected Vercel inventory exposed only `chatbot`; Harbourview production project was not visible through the connector. |
| Parallel network build | `harbourview-network` | Incubation | Private repo with newer control structure. It must feed or replace the canonical app only after explicit decision. |
| Legacy signal data | `harbourviewcompany-create's Project` / `fgdrvqqezdiraqyuofte` | HOLD | Contains 430 `signals` rows but no migrations found. Treat as legacy/prototype until inspected. |
| Misnamed local chatbot repo | `Harbourview` | Rename/archive candidate | README identifies the repo as a Windows-first local Ollama/browser chatbot, not the Harbourview platform. |

## Master Project Register

| System | Project Name | Canonical Status | Purpose | GitHub Repo | Vercel Project | Supabase Project Ref | Production URL | Visibility | Current Risk | Disposition | Owner | Next Action | Decision Needed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GitHub / App | Harbourview Platform | Provisional canonical production app | Main Harbourview marketplace, intelligence, admin, intake and public platform surface | `harbourviewcompany-create/harbourview-platform` | Not visible in connected Vercel inventory | `zvxdgdkukjrrwamdpqrg` likely target | Previously referenced as `https://harbourview.vercel.app`; must verify | Public repo | Open/stale PR debt, deployment-target ambiguity, Cloudflare/Vercel command sprawl, public/private boundary risk | Keep and stabilize as canonical unless formally replaced | Tyler / Harbourview | Resolve Vercel linkage, close stale PRs, run canonical verification gates | Confirm this remains canonical production app |
| GitHub / App | Harbourview Network | Incubation / replacement candidate | Newer private Harbourview Network architecture and app foundation | `harbourviewcompany-create/harbourview-network` | Not visible | Not confirmed | None confirmed | Private repo | Could duplicate `harbourview-platform` work and split execution if treated as parallel production | Keep as architecture feeder or controlled replacement candidate | Tyler / Harbourview | Decide whether it feeds `harbourview-platform` or becomes future canonical repo | Decide merge-forward vs. replacement strategy |
| GitHub / App / Vercel | Chatbot | Separate active deployed product | AI/chat application deployed to Vercel | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` and related Vercel domains | Private repo; Vercel project visible | Build runs DB migration before `next build`; may be operationally sensitive; separate from Harbourview platform | Keep separate unless intentionally integrated | Tyler / Harbourview | Document deployment/env requirements and confirm whether it belongs inside Harbourview Network | Decide standalone vs. integrated product |
| GitHub / Local Tool | Local AI Chatbot | Non-canonical / misnamed | Windows-first local chatbot using browser fallback and optional Ollama | `harbourviewcompany-create/Harbourview` | Not visible | None | None | Private repo | Misleading repo name can cause operator confusion and agent mistakes | Rename to `local-ai-chatbot` or archive | Tyler | Rename/archive after preserving useful files | Confirm rename/archive |
| GitHub / Demo Portfolio | Contractor Demos | Demo/sales asset | Static demo websites and visual prototypes for sales/client demonstrations | `harbourviewcompany-create/contractor` | Not visible | None | None confirmed | Public repo | Public demo repo is acceptable only if no private/client-sensitive material exists | Keep as demo portfolio repo | Tyler | Add README clarifying demo-only status and route inventory | Confirm whether public visibility is intentional |
| GitHub / Webhook | HV Telnyx Webhook | Unknown / review required | Unknown Telnyx webhook utility | `harbourviewcompany-create/hv-telnyx-webhook` | Not visible | None | None | Public repo | Public webhook repo may expose operational assumptions even if no secrets are present | Inspect immediately; likely make private or archive | Tyler | Audit files, secrets history, deployment linkage and Telnyx usage | Decide active/private/archive |
| Supabase / Database | Harbourview Marketplace | Provisional canonical production database | Marketplace data, inquiries, admin role model, source intake, candidate workflow, signal-engine migrations | Expected consumer: `harbourview-platform` | Not directly applicable | `zvxdgdkukjrrwamdpqrg` | Supabase API URL should remain controlled | Supabase project active | Mixed migration history, public SECURITY DEFINER smoke RPC warnings, anon insert warning, JWT-disabled edge function, extension in public schema | Keep and harden | Tyler / Harbourview | Run DB hardening PR/migration plan and document intentional deny-by-default tables | Confirm as canonical production DB |
| Supabase / Database | Legacy Signal Project | Legacy/prototype pending inspection | Early signal/editorial/source/dossier schema; 430 signal rows | No confirmed GitHub repo | Not directly applicable | `fgdrvqqezdiraqyuofte` | None | Supabase project active | No migrations found; unclear ownership; data may be stranded or duplicated | Freeze except read-only inspection; migrate or archive later | Tyler / Harbourview | Export/inspect schema and sample rows, then decide migration into canonical DB | Decide migrate, archive, or keep as sandbox |
| Vercel / Deployment | Harbourview Vercel Target | Missing from connected inventory | Intended Harbourview production/preview deployment target | Expected repo: `harbourview-platform` or future `harbourview-network` | Not visible | Expected DB: `zvxdgdkukjrrwamdpqrg` | Previously referenced as `https://harbourview.vercel.app`; must verify | Unknown | Highest infrastructure ambiguity; cannot trust deployment-control state until resolved | Resolve before more launch work | Tyler / Harbourview | Check Vercel accounts/teams/project connections and map canonical domains | Identify actual canonical Vercel project |
| Vercel / Deployment | Chatbot Vercel Project | Active separate deployment | Production deployment for chatbot app | `harbourviewcompany-create/chatbot` | `chatbot` | None found | `chatbot-harbourviewnetwork.vercel.app` | Visible in Vercel team | Only visible Vercel project; may mask missing Harbourview team/project scope | Keep separate | Tyler / Harbourview | Document env, domains and whether it should be under Harbourview product umbrella | Decide naming/domain strategy |

## Operating Rules

1. No Harbourview PR, deployment, Supabase change, Vercel change, new repo, new route, new integration, new agent task or cleanup action is valid unless it names the affected registry row and states whether this registry must change.
2. New repos, Vercel projects, Supabase projects, public routes, workflows or migrations require an existing registry row or a registry update in the same PR.
3. Temporary verification PRs must be closed after evidence is captured.
4. Production deployment decisions must name the exact GitHub repo, branch, Vercel project and Supabase project.
5. Public/private boundaries must be verified before merge for any repo or route touching marketplace, admin, intelligence, signal, source, candidate, inquiry or lead data.

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

- Harbourview Vercel production target is not visible in the connected Vercel inventory.
- `harbourview-platform` has active PR debt and stale/superseded branches.
- The legacy Supabase signal project contains data but no migrations.
- `hv-telnyx-webhook` is public and not classified.
- Supabase canonical project has security advisor warnings requiring review.

## Immediate GO Items

- Use `harbourview-platform` as provisional canonical app for control purposes.
- Use `zvxdgdkukjrrwamdpqrg` as provisional canonical database for control purposes.
- Keep `harbourview-network` private and non-production until a replacement decision is made.
- Keep `chatbot` separate from Harbourview platform release control unless explicitly integrated.
- Add and maintain this registry before additional launch execution.
