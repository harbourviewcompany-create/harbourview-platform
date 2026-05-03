# Harbourview Deployment Runbook

## Purpose

This runbook controls deployment-related work for Harbourview and prevents accidental production writes, unverifiable deployments and unsupported release claims.

## Required deployment entry fields

- Objective
- Branch and commit
- Target environment
- Deployment platform
- Environment variables by name only
- Database impact
- Production write impact
- Pre-deployment checks
- Deployment action
- Post-deployment verification
- Rollback path
- Human approval status
- Evidence location

## Verified current deployment evidence

`docs/control/PROJECT_STATE.md` records the current durable marketplace capture and Vercel/Supabase environment hygiene evidence. That evidence applies only to the stated workflow runs, branches, commits and production URL recorded there.

## Environment variable names referenced by current marketplace controls

Do not record secret values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HARBOURVIEW_SMOKE_BASE_URL`
- `HARBOURVIEW_SMOKE_WRITE`
- `HARBOURVIEW_SMOKE_CLEANUP`
- `HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES`
- `NEXT_PUBLIC_SITE_URL`
- `VERCEL_ENV`

## Deployment readiness checklist

Before production deployment, confirm:

- Branch is current or intentionally based on a reviewed commit
- PR diff contains only intended files
- `npm ci` succeeded
- `npm run typecheck` succeeded
- `npm run lint` succeeded or blocker recorded
- `npm run build` succeeded
- Relevant smoke tests passed or are explicitly blocked
- DB/RLS impact reviewed where relevant
- No public private-data leakage is present
- Rollback path is documented
- Human approval is recorded for production database writes

## Controlled production smoke process

Use only when production smoke writes are approved.

1. Confirm target URL.
2. Confirm required secrets are configured by name only.
3. Run workflow with the required production write gate or approved controlled branch.
4. Confirm the three inquiry types are created.
5. Confirm smoke rows are closed or cleaned up.
6. Confirm no secret values were printed.
7. Record run ID, logs and artifacts in evidence.

## Rollback rules

- Documentation-only change: revert commit or update docs in a follow-up PR
- UI regression: revert UI commit or redeploy last known good commit
- API regression: revert route/server action commit and rerun build plus smoke
- Additive migration issue: prefer forward-fix after production migration
- Destructive migration issue: stop and perform explicit DB review before action
- Workflow regression: revert workflow commit and validate with controlled trigger

## Approval gates

Human approval is required for production write tests, production DB migrations, RLS changes, auth/admin role changes, public exposure of new data fields, domain changes, paid infrastructure and merging with required checks failing or unrun.

## Completion criteria

Deployment work is complete only when target environment and commit, checks, post-deployment verification, rollback path, approval gates and evidence updates are recorded.
