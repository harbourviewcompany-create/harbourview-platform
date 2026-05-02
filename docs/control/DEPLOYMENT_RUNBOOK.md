# Harbourview Deployment Runbook

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This runbook controls deployment-related work for Harbourview. It prevents accidental production writes, unverifiable deployments and unsupported release claims.

## Required fields for deployment entries

Every deployment entry must include:

- Deployment objective
- Branch
- Commit
- Target environment
- Deployment platform
- Environment variables required by name only
- Database impact
- Production write impact
- Pre-deployment checks
- Deployment action
- Post-deployment verification
- Rollback path
- Human approval status
- Evidence location

## Verified deployment-adjacent facts

The following are verified from repository files only:

- The marketplace browser smoke workflow exists at `.github/workflows/marketplace-browser-smoke.yml`.
- The workflow default target is `https://harbourview-platform.vercel.app`.
- The workflow requires exact manual confirmation `ALLOW_PRODUCTION_SMOKE_WRITES` for manual production smoke writes.
- The workflow may also run on controlled branches matching `smoke/marketplace-browser-*`.
- The browser smoke script requires write and cleanup gates before inserting and closing smoke rows.
- The smoke verifier expects the Supabase project host `zvxdgdkukjrrwamdpqrg.supabase.co`.

The current deployment status of Vercel, production environment variables and production smoke result were not verified in this control-file pass.

## Environment variable names referenced by verified files

Do not record secret values in this file.

| Variable | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL, verifier validates/falls back to locked project host |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only smoke verifier service role key |
| `HARBOURVIEW_SMOKE_BASE_URL` | Browser smoke target base URL |
| `HARBOURVIEW_SMOKE_WRITE` | Enables smoke writes when set to `1` |
| `HARBOURVIEW_SMOKE_CLEANUP` | Requires smoke cleanup when set to `1` |
| `HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES` | Allows production browser smoke writes when set to `1` in script environment |
| `NEXT_PUBLIC_SITE_URL` | Fallback base URL for smoke script if smoke base URL is not provided |
| `VERCEL_ENV` | Used to detect production target in smoke script |

## Deployment readiness checklist

Before production deployment, confirm:

- Branch is current or intentionally based on a reviewed commit.
- PR diff only contains intended files.
- `npm ci` succeeded.
- `npm run typecheck` succeeded.
- `npm run build` succeeded.
- `npm run lint` succeeded or exact known lint tooling blocker is recorded.
- Relevant smoke tests passed or are explicitly blocked.
- Database migration impact is reviewed.
- RLS impact is reviewed where relevant.
- No public private-data leakage is present.
- Rollback path is documented.
- Human approval is recorded for production database writes.

## Controlled production smoke process

Use only when production smoke writes are approved.

1. Confirm target URL is `https://harbourview-platform.vercel.app` unless intentionally testing another deployment.
2. Confirm service role secret is configured in the execution environment by name only.
3. Run workflow dispatch with `allow_production_writes` set exactly to `ALLOW_PRODUCTION_SMOKE_WRITES`, or use a controlled branch matching `smoke/marketplace-browser-*`.
4. Confirm the script created one row for each inquiry type:
   - `quote_routing`
   - `listing_submission`
   - `wanted_request_submission`
5. Confirm cleanup closed the created rows.
6. Confirm no secret values were printed.
7. Save workflow run ID, log summary and artifact reference in `EVIDENCE_LOG.md`.
8. Update `PROJECT_STATE.md` only after evidence exists.

## Rollback rules

Use the safest available rollback path:

- Documentation-only change: revert commit or update docs in a follow-up PR.
- UI regression: revert UI commit or redeploy last known good commit.
- API regression: revert route/server action commit and rerun build plus smoke.
- Database additive migration issue: apply forward-fix migration if production has already moved forward.
- Destructive migration issue: stop, do not improvise rollback without explicit database review and human approval.
- Workflow regression: revert workflow commit and validate with non-production or controlled branch trigger.

## Production incident rules

If production breaks:

- Stop feature work.
- Record affected surface.
- Record deployment commit.
- Record observed failure.
- Preserve logs.
- Avoid destructive database fixes until reviewed.
- Prefer reverting the smallest risky change.
- Update `EVIDENCE_LOG.md` after mitigation.

## Deployment approval gates

Human approval is required for:

- Production write tests
- Production database migrations
- RLS changes
- Auth or admin role changes
- Public exposure of new data fields
- Domain changes
- Paid infrastructure changes
- Merging while required checks are failing or unrun

## Forbidden vague language

Do not use:

- deployed successfully without deployment ID or evidence
- live now without target URL and commit
- production ready without gates passed
- env configured without naming where and how verified
- rollback simple without exact rollback action
- smoke done without row evidence

## Completion criteria

Deployment work is complete only when:

- Target environment and commit are recorded.
- Pre-deployment checks are recorded.
- Post-deployment verification is recorded.
- Rollback path is stated.
- Human approval gates are satisfied or marked blocked.
- `PROJECT_STATE.md` and `EVIDENCE_LOG.md` are updated.
