# Audit 2026-09-14 — Implementation Evidence

**Date:** 2026-09-14  
**Branch:** `chore/audit-2026-09-14-admin-auth-guards`  
**PR:** https://github.com/harbourviewcompany-create/harbourview-platform/pull/1861  
**Scope:** In-repo CI guards, control docs, issue drafts. **No** production schema, env, cron schedule, or dashboard changes.

## What landed

| Artifact | Purpose |
|----------|---------|
| `tests/harbourview/admin-route-auth-guard.test.ts` | P1-1: admin pages under `(protected)` or explicit `requireAdminAuth` |
| `tests/harbourview/admin-api-auth-guard.test.ts` | P1-4: `app/api/**/admin/**` must call admin auth helper |
| `tests/harbourview/public-safety-forbidden-list.test.ts` | P2-5 partial: critical forbidden field regression |
| `scripts/check-admin-auth-inventory.mjs` | Local/CI inventory dump |
| `docs/control/ADMIN_ROUTE_AUTH_POLICY.md` | Canonical admin auth rules |
| `docs/control/OPERATOR_AUDIT_RUNBOOK_2026-09-14.md` | P0 live probes + migration/cron operator steps |
| `docs/control/CRON_ROUTE_DISPOSITION_2026-09-14.md` | P1-5 schedule vs retire recommendations |
| `docs/audits/GITHUB_ISSUES_AUDIT_2026-09-14.md` | Backlog issue bodies |
| `package.json` | `test:admin-auth-inventory`, `check:admin-auth-inventory`; three tests appended to `test:security` |

## Explicitly not done in this PR

- Live anonymous `/admin` denial or leakage probe on production
- Migration apply / schema_migrations reconciliation
- pg_cron or Vercel cron schedule changes
- Moving marketplace/dossiers under `(protected)/`
- Filing GitHub Issues from the draft doc
- Dependency upgrades (sharp/hono)
- Branch protection / Dependabot secrets / CF cleanup

## Verification commands (local / CI)

```bash
npm run test:admin-auth-inventory
npm run check:admin-auth-inventory
npm run test:security   # now includes the three new files
```

Exact-head CI results: record on the PR checks tab after push.

## Registry

No PROJECT_REGISTRY status change claimed. Operator runbook remains the path to close HOLD gates with live evidence.

## Rollback

Revert PR commits. No production side effects.
