# Harbourview Evidence Log

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This file records evidence for Harbourview claims. It is the counterweight to agent optimism. If a fact is not recorded here or directly cited in a PR, it must not be treated as verified.

## Required fields for every evidence entry

- Evidence ID
- Date and time UTC
- Agent or human
- Branch
- Commit
- Environment
- Claim being verified
- Command, workflow, file inspection or source checked
- Result: pass, fail, blocked or informational
- Key output
- Artifact location
- Follow-up action

## Evidence quality levels

| Level | Evidence type | Use |
|---|---|---|
| E0 | User-provided instruction or locked context | Product/brand authority, not implementation proof |
| E1 | File inspection | Verifies repository content only |
| E2 | Local command output | Verifies local branch behavior only |
| E3 | CI workflow result | Verifies branch in CI environment |
| E4 | Preview deployment verification | Verifies deployed preview behavior |
| E5 | Production verification | Verifies production behavior for a stated commit and target |

## Current evidence entries

### HV-EVID-2026-05-02-001

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Repository exists and default branch is `main`.
- Method: GitHub repository metadata fetch
- Result: Informational pass
- Key output: Repo `harbourviewcompany-create/harbourview-platform` exists, default branch `main`, accessible with push/admin permissions through connected tool.
- Artifact location: GitHub connector response in chat execution history
- Follow-up action: None for repo identity. Do not infer deployment status from this.

### HV-EVID-2026-05-02-002

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Package scripts and stack markers exist.
- Method: Fetched `package.json`
- Result: Informational pass
- Key output: Scripts include `dev`, `build`, `start`, `lint`, `typecheck`, `smoke:marketplace`, `smoke:marketplace:rls`, `smoke:marketplace:browser`. Dependencies include Next `^15.3.1`, React `^19.0.0`; dev dependencies include TypeScript `^5.4.5`, Tailwind `^3.4.17`, ESLint `^9.0.0`.
- Artifact location: `package.json` on `main`
- Follow-up action: Run scripts before claiming they pass.

### HV-EVID-2026-05-02-003

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Marketplace browser smoke workflow exists.
- Method: Fetched `.github/workflows/marketplace-browser-smoke.yml`
- Result: Informational pass
- Key output: Workflow supports manual dispatch to `https://harbourview-platform.vercel.app` and requires `ALLOW_PRODUCTION_SMOKE_WRITES` for manual production smoke writes, or controlled branches matching `smoke/marketplace-browser-*`.
- Artifact location: Workflow file on `main`
- Follow-up action: Dispatch or trigger workflow only with appropriate approval.

### HV-EVID-2026-05-02-004

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Smoke verifier route references Supabase marketplace inquiry verification.
- Method: Fetched `app/api/smoke/marketplace/route.ts`
- Result: Informational pass
- Key output: Route validates smoke marker, email and inquiry type; checks host `zvxdgdkukjrrwamdpqrg.supabase.co`; reads `marketplace_inquiries`; patches smoke rows to `closed` with `internal_notes` during cleanup.
- Artifact location: Route file on `main`
- Follow-up action: Verify live database schema and route behavior before claiming production capture works.

### HV-EVID-2026-05-02-005

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Browser smoke script exercises three marketplace capture paths.
- Method: Fetched `scripts/smoke-marketplace-browser.mjs`
- Result: Informational pass
- Key output: Script submits quote, New Product listing and Wanted Request listing, verifies rows for `quote_routing`, `listing_submission`, `wanted_request_submission` and closes inserted smoke rows.
- Artifact location: Script file on `main`
- Follow-up action: Run script through CI or controlled environment.

### HV-EVID-2026-05-02-006

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Requested control files did not already exist on `main`.
- Method: Direct fetch attempts for each requested `docs/control/*.md` path
- Result: Informational pass
- Key output: Each requested control file path returned 404 before creation on control branch.
- Artifact location: GitHub connector responses in chat execution history
- Follow-up action: Open PR for newly created files.

### HV-EVID-2026-05-02-007

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: `.env.example` was not found on `main` during this pass.
- Method: Direct file fetch
- Result: Informational pass
- Key output: Fetch returned 404.
- Artifact location: GitHub connector response in chat execution history
- Follow-up action: Consider a separate safe ticket to add `.env.example` with variable names only.

### HV-EVID-2026-05-02-008

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `main`
- Commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`
- Environment: GitHub repository inspection
- Claim being verified: Latest smoke result artifact was not found on `main`.
- Method: Direct fetch for `smoke-results/marketplace-browser-smoke-latest.json`
- Result: Informational pass
- Key output: Fetch returned 404.
- Artifact location: GitHub connector response in chat execution history
- Follow-up action: Run controlled browser smoke and preserve artifact where appropriate.

### HV-EVID-2026-05-02-009

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `docs/harbourview-control-pack-v1`
- Commit: `67b4953755a895a189c7081c582168bf100e5bbc` before this evidence-update commit
- Environment: GitHub connector capability inspection
- Claim being verified: Whether the connected GitHub tool surface can dispatch `.github/workflows/marketplace-browser-smoke.yml`.
- Method: Listed available connected GitHub tool resources and inspected available Actions-related tools.
- Result: Blocked
- Key output: The connected GitHub tool surface exposes workflow run/job/artifact fetch and retry tools, but no workflow-dispatch tool. Because the requested path required dispatching `marketplace-browser-smoke.yml` with exact confirmation `ALLOW_PRODUCTION_SMOKE_WRITES`, the workflow was not run from this pass.
- Artifact location: GitHub connector tool list in chat execution history
- Follow-up action: Use GitHub UI/CLI or add a separately approved controlled trigger ticket. Do not claim smoke pass until a workflow run exists.

### HV-EVID-2026-05-02-010

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `docs/harbourview-control-pack-v1`
- Commit: `67b4953755a895a189c7081c582168bf100e5bbc` before this evidence-update commit
- Environment: GitHub connector capability inspection
- Claim being verified: Whether required GitHub Actions secrets can be verified by name only through the connected tool surface.
- Method: Listed available connected GitHub tool resources and inspected for repository-secret listing/read tools.
- Result: Blocked
- Key output: The connected GitHub tool surface does not expose a repository-secret listing or read-by-name tool. Presence of `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` could not be verified. No secret values were requested or exposed.
- Artifact location: GitHub connector tool list in chat execution history
- Follow-up action: Verify secret names through GitHub Actions settings, GitHub CLI with appropriate permissions, or a safe diagnostic workflow in a separately approved ticket.

### HV-EVID-2026-05-02-011

- Date and time UTC: 2026-05-02, exact tool time not exported
- Agent or human: ChatGPT via connected GitHub tool
- Branch: `docs/harbourview-control-pack-v1`
- Commit: `67b4953755a895a189c7081c582168bf100e5bbc` before this evidence-update commit
- Environment: GitHub repository inspection
- Claim being verified: Whether the marketplace browser smoke workflow definition itself supports the required production write gate.
- Method: Fetched `.github/workflows/marketplace-browser-smoke.yml` from `main`.
- Result: Informational pass
- Key output: The workflow has `workflow_dispatch` inputs for `base_url` and `allow_production_writes`, default target `https://harbourview-platform.vercel.app`, and requires exact input `ALLOW_PRODUCTION_SMOKE_WRITES` unless run on a controlled `smoke/marketplace-browser-*` branch. This verifies workflow design only, not execution.
- Artifact location: `.github/workflows/marketplace-browser-smoke.yml` on `main`
- Follow-up action: Dispatch the workflow from a tool or human environment that supports workflow dispatch and secret verification.

## Evidence entry template

```md
### HV-EVID-YYYY-MM-DD-###

- Date and time UTC:
- Agent or human:
- Branch:
- Commit:
- Environment:
- Claim being verified:
- Method:
- Result:
- Key output:
- Artifact location:
- Follow-up action:
```

## Forbidden vague language

Do not use:

- verified in spirit
- evidence pending but complete
- logs unavailable but passed
- checked quickly
- no concerns
- production confirmed without production target and commit

## Completion criteria

Evidence is acceptable only when:

- It names exactly what was checked.
- It states pass, fail, blocked or informational.
- It does not prove more than it actually proves.
- It points to a file, command, workflow, log, artifact or connector response.
