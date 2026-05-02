# Harbourview Project State

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform  
Repository: harbourviewcompany-create/harbourview-platform  
Base branch reviewed: main  
Base commit reviewed: f835cd4d04a2550c19dfb4b313a82f59591ff15d  
Last control update: 2026-05-02

## Purpose

This file is the project state ledger for Harbourview. It separates verified repository facts, locked product context, unverified assumptions and the next execution priority. No agent may use this file to claim repo, database, deployment or test completion unless the evidence is recorded here or in `EVIDENCE_LOG.md`.

## Required fields

Every update must include:

- Update date
- Updating agent or human
- Branch and commit reviewed
- Verified facts added
- Assumptions removed or preserved
- Tests or checks actually run
- Evidence location
- Current blocker
- Single next execution ticket

## Forbidden vague language

Do not use these phrases unless immediately followed by evidence:

- should work
- likely complete
- probably deployed
- appears fine
- production ready
- mostly done
- verified elsewhere
- simple fix
- just needs cleanup
- no issues found

## Locked Harbourview context

These are product and brand facts from the Harbourview control authority, not proof of current implementation state:

- Harbourview provides commercial intelligence, strategic introductions and market-access support for serious operators in regulated cannabis and adjacent supply chains.
- Core positioning line: `Market access backed by intelligence and relationships.`
- Marketplace V1 is a controlled-introduction marketplace, not checkout commerce.
- Marketplace V1 supports listing submission, wanted request submission and buyer quote/introduction capture.
- Globe Homepage V1 direction is premium navy, black and gold with a lighthouse, subtle water, an interactive globe, Marketplace as the primary CTA and Intelligence as the secondary CTA.
- Scope must avoid fake live data, fake buyer networks, guaranteed market access or claims of confirmed deal flow unless verified.

## Verified repository facts from this control-file pass

| Area | Verified fact | Evidence |
|---|---|---|
| Repo access | GitHub repo `harbourviewcompany-create/harbourview-platform` is accessible with push/admin permissions through the connected GitHub tool. | Connected GitHub repository metadata |
| Default branch | Default branch is `main`. | Connected GitHub repository metadata |
| Base commit | `main` resolved to commit `f835cd4d04a2550c19dfb4b313a82f59591ff15d`. | Connected GitHub commit fetch |
| Package name | `package.json` name is `harbourview-platform`, version `1.0.0`, private `true`. | `package.json` on `main` |
| Stack markers | `package.json` includes Next `^15.3.1`, React `^19.0.0`, TypeScript `^5.4.5`, Tailwind `^3.4.17`, ESLint `^9.0.0`. | `package.json` on `main` |
| Available scripts | Scripts include `dev`, `build`, `start`, `lint`, `typecheck`, `smoke:marketplace`, `smoke:marketplace:rls`, `smoke:marketplace:browser`. | `package.json` on `main` |
| Browser smoke workflow | `.github/workflows/marketplace-browser-smoke.yml` exists. It supports manual dispatch and controlled smoke branches. | Workflow file on `main` |
| Production smoke target | Workflow default `base_url` is `https://harbourview-platform.vercel.app`. | Workflow file on `main` |
| Production smoke write gate | Workflow requires exact confirmation `ALLOW_PRODUCTION_SMOKE_WRITES` for manual production smoke writes or a branch matching `smoke/marketplace-browser-*`. | Workflow file on `main` |
| Smoke verifier route | `app/api/smoke/marketplace/route.ts` exists and uses `marketplace_inquiries` through Supabase REST. | Route file on `main` |
| Smoke inquiry types | The smoke verifier accepts `quote_routing`, `listing_submission` and `wanted_request_submission`. | Route and script files on `main` |
| Smoke cleanup behavior | Browser smoke script verifies inserted rows and closes created smoke rows when cleanup is enabled. | `scripts/smoke-marketplace-browser.mjs` on `main` |
| `.env.example` | `.env.example` was not found on `main` during this pass. | Direct file fetch returned 404 |
| Control files | The ten requested `docs/control/*.md` files were not found on `main` before creation. | Direct file fetches returned 404 |
| Smoke result artifact on main | `smoke-results/marketplace-browser-smoke-latest.json` was not found on `main` during this pass. | Direct file fetch returned 404 |

## Latest verification update: controlled marketplace browser smoke attempt

Date: 2026-05-02  
Updating agent: ChatGPT via connected GitHub tool  
Branch: `docs/harbourview-control-pack-v1`  
Commit before update: `67b4953755a895a189c7081c582168bf100e5bbc`  
Evidence: `docs/control/EVIDENCE_LOG.md`, entries `HV-EVID-2026-05-02-009` through `HV-EVID-2026-05-02-011`

Verified in this update:

- The workflow file supports `workflow_dispatch` with `base_url` and `allow_production_writes` inputs.
- The required exact confirmation string is `ALLOW_PRODUCTION_SMOKE_WRITES`.
- The default target remains `https://harbourview-platform.vercel.app`.
- The connected GitHub tool surface can inspect workflow files and fetch workflow/job/artifact data.
- The connected GitHub tool surface does not expose a workflow-dispatch operation.
- The connected GitHub tool surface does not expose a repository-secret list/read operation.

Blocked in this update:

- The workflow was not dispatched.
- No workflow run ID exists from this pass.
- Required secrets were not verified by name.
- No smoke logs or artifacts were produced.
- No row creation or cleanup was verified.

## Explicitly unverified

Do not claim any of the following as complete until evidence is added:

- Current Vercel deployment status
- Current GitHub Actions secret configuration
- Current Supabase table schema beyond what the smoke verifier references
- Current Supabase RLS policy state
- Whether production smoke workflow has passed
- Whether `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build` or any smoke script currently passes
- Whether routes render correctly in a browser
- Whether marketplace rows are actually being created in production
- Whether any migration set is complete
- Whether globe homepage tickets are implemented
- Whether visual design matches the locked Harbourview globe direction

## Current project state classification

| Layer | Current status | Reason |
|---|---|---|
| Product scope | Locked enough to control work | Harbourview control authority defines marketplace and globe direction. |
| Repo inventory | Partially verified | Package, smoke workflow, verifier and script were inspected. Full tree was not enumerated. |
| Implementation | Unverified | No build, typecheck, lint, test or browser run was executed in this pass. |
| Database | Unverified | Table references exist in code, but live database schema and RLS were not inspected. |
| Deployment | Unverified | Workflow target exists, but deployment status was not checked in this pass. |
| Evidence | Partially updated | Smoke verification attempt was recorded as blocked due to missing workflow-dispatch and secret-inspection tool capabilities. |

## Current allowed execution lane

The current safe lane is documentation control and verification hardening. Implementation work requires a ticket created from `TASK_TICKET_TEMPLATE.md` and must update this file after execution.

## Immediate blocker

Controlled production browser smoke cannot be run from the currently exposed GitHub tool surface because the tool surface does not expose workflow dispatch and does not expose repository-secret verification by name. The workflow file itself supports the required controlled production smoke gate, but it was not executed in this pass.

## Single highest-leverage next execution ticket

Run the marketplace browser smoke through a mechanism that can dispatch GitHub Actions workflows and verify secrets by name only, then update `docs/control/EVIDENCE_LOG.md` and `docs/control/PROJECT_STATE.md` with the workflow run ID, logs, artifact status and row creation/cleanup evidence.

## Completion criteria

This file is current only when:

- The latest branch and commit are stated.
- All claims are separated into verified, locked-context or unverified.
- No implementation or deployment completion is claimed without evidence.
- The next execution ticket is singular and actionable.
- `EVIDENCE_LOG.md` contains supporting evidence for every completed claim.
