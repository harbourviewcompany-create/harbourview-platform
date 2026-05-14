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

## Live Source Intake V0 Verification

Required for changes to private source intake, marketplace candidates or the consumables category foundation:

```bash
npm run typecheck
npm run build
npm run test:admin-guard
npm run test:visibility
npm run test:live-source-intake
```

If deployment authority is present, also run:

```bash
npm run probe:production-visibility
```

Required checks:

- migration `007_live_source_intake_v0_consumables.sql` creates only private intake/candidate tables
- RLS is enabled and deny-by-default for anonymous users
- admin/operator-only access uses existing `public.user_roles`
- `/admin/sources` and `/admin/candidates` are directly guarded with `requireAdminAuth()`
- V0 source capture remains manual-only and stores `fetch_status = skipped`
- candidate workflow never publishes publicly
- restricted/excluded consumables and licence-review candidates cannot reach `approved_draft`
- public consumables UI uses only safe inquiry-first labels
- public leakage probes include private source/candidate table and field names

## Verification command map (control-plane)

- `npm run typecheck` — TypeScript gate.
- `npm run lint` — lint gate (warnings currently allowed, failures block).
- `npm run test:intelligence-os` — unit extraction contract.
- `npm run verify:leakage` — public leakage gate for forbidden admin/provenance strings.
- `npm run verify:admin-auth` — admin authorization gate (anonymous/missing role/viewer/analyst denied; operator/admin allowed via role logic checks).
- `npm run verify:marketplace-smoke` — safe workflow and route guard checks; does not perform production writes.
- `npm run verify:production-visibility` — production visibility probe (read-only probe, env-dependent).
- `npm run build` — production build gate.
- `npm run verify:all-safe` — aggregate safe local/CI verification command.

### Smoke write gate semantics

`scripts/smoke-marketplace.mjs` now emits explicit status labels:
- `NOT RUN`
- `GATED`
- `BLOCKED`
- `RUN`
- `PASS`
- `FAIL` (process exit non-zero)

Required env controls for write-capable smoke:
- `HARBOURVIEW_SMOKE_WRITE=1`
- `HARBOURVIEW_SMOKE_CLEANUP=1` (cleanup optional but recommended)
- `HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1` (required when `VERCEL_ENV=production`)
