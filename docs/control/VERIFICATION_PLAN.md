# Harbourview Verification Plan

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This file defines the minimum verification expected before Harbourview changes are called complete. It separates documentation checks, code checks, database checks, browser smoke checks and production release checks.

## Required fields for verification entries

Each verification entry must include:

- Date and time
- Agent or human running the check
- Branch
- Commit
- Environment
- Command or workflow
- Inputs used
- Result: pass, fail or blocked
- Exact failure if any
- Artifact or log location
- Follow-up ticket if failed

## Current verified available scripts

From `package.json` on `main`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run smoke:marketplace
npm run smoke:marketplace:rls
npm run smoke:marketplace:browser
```

Do not assume these commands pass until run on the branch under review.

## Verification levels

### Level 0: Documentation-only

Use when only `docs/**` files changed.

Required:

- File list
- Markdown review for broken headings or obvious copy errors
- Confirmation that no code, config, workflow, migration or package files changed
- No production-readiness claims

Commands may be unnecessary if no markdown tooling exists. State `not run` with reason.

### Level 1: Static implementation verification

Use for code changes that do not touch database, auth, public submission flows or deployment.

Required commands:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

If `npm run lint` is unsupported or broken because of repo configuration, record exact error and create or execute a repair ticket.

### Level 2: Functional route verification

Use for route, form, UI or server action changes.

Required:

- Level 1 checks
- Relevant route exercised locally or in preview
- Form validation tested for success and failure states where applicable
- No private field exposure in public UI

### Level 3: Marketplace capture verification

Use for listing submission, wanted request, quote routing or marketplace inquiry changes.

Required:

```bash
npm run typecheck
npm run build
npm run smoke:marketplace
npm run smoke:marketplace:rls
npm run smoke:marketplace:browser
```

Production browser smoke requires explicit write gate:

- Manual workflow input `ALLOW_PRODUCTION_SMOKE_WRITES`, or
- Controlled branch matching `smoke/marketplace-browser-*`

Expected production smoke evidence:

- `quote_routing` row created
- `listing_submission` row created
- `wanted_request_submission` row created
- Smoke rows cleaned up or marked `closed`
- Logs captured
- No secret values exposed

### Level 4: Database and RLS verification

Use for database migrations, policy changes, service-role paths or private/public visibility changes.

Required:

- Level 1 checks
- Migration review
- RLS review
- Public leakage test
- Admin/operator visibility test where private fields exist
- Smoke test or equivalent data-path test
- Human approval for production writes

### Level 5: Deployment verification

Use for production deployment, env changes, workflows, Vercel settings or public domain changes.

Required:

- Required lower-level checks for changed surfaces
- Deployment target stated
- Commit deployed stated
- Production smoke or equivalent check run
- Rollback path stated
- Evidence log updated

## Public leakage verification checklist

Public pages must not show:

- Source URLs
- `View source listing`
- Evidence captured
- Provenance logs
- Internal review workflow
- Admin status history
- Internal notes
- Raw contact fields
- Service role diagnostics

Admin/operator pages must preserve access to internal fields only behind appropriate authorization.

## Globe homepage verification checklist

For globe homepage work verify:

- Text and CTAs render before globe if globe is delayed.
- Marketplace CTA visible in the first mobile viewport.
- Reduced motion disables rotation, beam scanning and water animation.
- Static fallback is usable.
- No fake live data appears.
- No marketplace grid appears above the fold.
- Mobile tap behavior does not block navigation.

## Evidence artifact requirements

Acceptable evidence:

- Command output summary with exact command and result
- Workflow run ID or link
- Test result artifact
- Smoke result JSON
- Screenshot or visual regression artifact
- PR diff
- Commit hash

Unacceptable evidence:

- `tested manually` without steps
- screenshots without route and branch context
- passing claim without command output
- local-only verification for production deployment claims
- agent confidence

## Stop conditions

Stop verification and report when:

- Dependencies fail to install.
- Required secrets are missing.
- Production write gate is not satisfied.
- The app targets the wrong Supabase host.
- Public route leaks private fields.
- Build fails and cause is outside ticket scope.
- Database state cannot be safely inspected.

## Forbidden vague language

Do not use:

- all good
- checks passed without listing checks
- tested the flow without inputs and outputs
- production verified without deployment target and commit
- smoke passed without row evidence
- no leakage without public page proof

## Completion criteria

A verification pass is complete only when:

- Every required command or workflow is listed.
- Results are pass, fail or blocked.
- Evidence location is recorded.
- Failures have a next ticket.
- `PROJECT_STATE.md` is updated if status changed.
