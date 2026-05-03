# Harbourview Verification Plan

## Purpose

This file defines minimum verification before Harbourview changes are called complete.

## Required verification entry fields

Each entry must include:

- Date/time
- Agent or human
- Branch and commit
- Environment
- Command or workflow
- Inputs used
- Result: pass, fail or blocked
- Exact failure if any
- Artifact/log location
- Follow-up ticket if failed

## Verification levels

### Level 0: Documentation-only

Use when only `docs/**` files changed.

Required:

- File list
- Confirmation no code, config, workflow, migration or package files changed
- No implementation or deployment claims

Runtime commands may be omitted when no markdown tooling exists. State not run and why.

### Level 1: Static implementation

Required for code changes:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

### Level 2: Functional route/UI verification

Required for route, form, UI or server action changes:

- Level 1 checks
- Relevant route exercised locally or in preview
- Success and failure states tested where applicable
- Public/private field exposure reviewed

### Level 3: Marketplace capture verification

Required for listing submission, wanted request, quote routing or marketplace inquiry changes:

```bash
npm run typecheck
npm run build
npm run smoke:marketplace
npm run smoke:marketplace:rls
npm run smoke:marketplace:browser
```

Production browser smoke requires explicit write gate or controlled branch policy.

Expected evidence:

- `quote_routing` row created
- `listing_submission` row created
- `wanted_request_submission` row created
- Smoke rows cleaned up or marked `closed`
- Logs/artifacts captured
- No secret values exposed

### Level 4: Database and RLS verification

Required for migrations, RLS, service-role paths or private/public visibility changes:

- Level 1 checks
- Migration review
- RLS review
- Public leakage test
- Admin/operator visibility test where private fields exist
- Data-path test
- Human approval for production writes

### Level 5: Deployment verification

Required for production deployment, env changes, workflow changes or public domain changes:

- Lower-level checks for changed surfaces
- Deployment target and commit stated
- Production smoke or equivalent verification
- Rollback path
- Evidence update

## Public leakage checklist

Public pages must not show source URLs, evidence captured, provenance logs, internal notes, admin status history, raw contact fields or service-role diagnostics.

## Globe homepage checklist

Verify text and CTAs render before delayed globe, Marketplace CTA appears in the first mobile viewport, reduced motion disables animation, static fallback is usable and no fake live data appears.

## Evidence quality

Acceptable:

- Command output
- Workflow run ID/link
- Test artifact
- Smoke JSON
- Screenshot with route and branch context
- Commit hash

Unacceptable:

- `tested manually` without steps
- passing claim without command output
- local-only proof for production claim
- agent confidence

## Stop conditions

Stop if dependencies fail to install, required secrets are missing, production write gate is not satisfied, public route leaks private fields or DB state cannot be safely inspected.

## Completion criteria

Verification is complete only when commands/workflows are listed, results are pass/fail/blocked, evidence location is recorded and failures have a next ticket.
