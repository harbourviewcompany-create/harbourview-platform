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

## Safer Low-Friction Execution Workflow

This workflow reduces repeated tool-confirmation friction by moving repeatable verification into GitHub Actions while preserving branch isolation, dry-run defaults, secret isolation and a final human merge gate.

### Execution model

1. Agent or human creates a non-default branch.
2. Pull request is opened against `main`.
3. Branch-only verification runs with repository read permissions.
4. Preview verification is manually run against an explicit preview URL and uses no secrets.
5. Production smoke is disabled by default and can run only through `workflow_dispatch` with explicit write, cleanup and production confirmations.
6. Supabase service-role credentials are available only inside the protected production smoke job environment.
7. Main receives changes only through a final human merge.
8. Post-merge verification runs after the merge to confirm public visibility and no accidental committed secret strings.

### Confirmation-minimizing design

Repeated ChatGPT confirmations should be reduced by batching low-risk operations into branch-only commits and letting workflows produce evidence.

Confirmations remain required for:

- committing or merging to protected branches
- enabling production smoke writes
- using Supabase service-role credentials
- changing runtime code, public routes, auth, middleware, Supabase schema/RLS, dependencies or Vercel config
- deleting data, changing production configuration or exposing private data

### Branch-only dry-run verification

Workflow: `.github/workflows/low-friction-branch-verification.yml`

Required behavior:

- runs on pull requests
- uses read-only repository permissions
- checks changed-file scope for control-only PRs
- scans changed files and diffs for committed secret-looking values
- confirms dry-run posture
- does not use Supabase secrets
- does not perform production writes
- does not deploy

Expected evidence:

- workflow conclusion
- changed-file list
- secret scan result
- scope check result
- explicit dry-run statement

### Preview verification

Workflow: `.github/workflows/preview-verification.yml`

Required behavior:

- runs manually against an explicit preview URL
- uses no repository secrets
- treats preview verification as read-only
- runs public leakage probes when a preview URL is supplied
- records when preview verification is skipped because no preview URL exists

Expected evidence:

- target preview URL
- workflow conclusion
- public leakage/provenance probe result, if executed
- no secret exposure in logs

### Manual protected production smoke

Workflow: `.github/workflows/protected-production-smoke.yml`

Required behavior:

- runs only through `workflow_dispatch`
- requires exact typed confirmations for production target, write gate and cleanup gate
- uses GitHub environment protection where configured
- keeps `SUPABASE_SERVICE_ROLE_KEY` available only inside the job environment
- passes service-role access only to server-side Node smoke scripts
- never exposes service-role values to browser code or public output
- requires smoke cleanup or safe closed-state handling
- fails closed when any gate is missing

Required gates:

- `HARBOURVIEW_SMOKE_WRITE=1`
- `HARBOURVIEW_SMOKE_CLEANUP=1`
- `HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1`
- typed confirmation: `RUN_PRODUCTION_SMOKE`

Expected evidence:

- production URL
- branch/ref
- workflow run ID
- smoke command results
- cleanup result
- no logged secret values
- GO/HOLD decision

### Post-merge verification

Workflow: `.github/workflows/post-merge-verification.yml`

Required behavior:

- runs on push to `main`
- checks merged diff for committed secret-looking values
- optionally runs production public-visibility probe when `HARBOURVIEW_PUBLIC_BASE_URL` is configured
- performs no production writes
- records skipped checks with reasons

Expected evidence:

- merge commit
- changed-file list
- secret scan result
- production public-visibility result or skip reason
- final post-merge GO/HOLD recommendation

### Supabase service-role isolation

Service-role access is allowed only when all of the following are true:

- the job is manually triggered or protected by a GitHub environment
- the job is not running on untrusted fork code
- the service-role value is read from GitHub Secrets
- the value is not printed, uploaded as an artifact or passed into client-side code
- the script using it is server-side Node only
- the workflow has explicit production write gates
- cleanup is enabled or the workflow has an approved no-cleanup exception

### Control-only PR rule

A low-friction workflow-control PR must not modify:

- runtime app code
- app routes
- Supabase migrations, schema or RLS
- middleware
- auth logic
- dependencies or package files
- Vercel config
- public marketplace behavior
- admin runtime behavior

Allowed files for this control PR are limited to:

- `.github/pull_request_template.md`
- `docs/control/VERIFICATION_PLAN.md`
- `scripts/check-no-secret-strings.mjs`
- `scripts/check-changed-files-scope.mjs`
- `.github/workflows/low-friction-branch-verification.yml`
- `.github/workflows/preview-verification.yml`
- `.github/workflows/protected-production-smoke.yml`
- `.github/workflows/post-merge-verification.yml`
