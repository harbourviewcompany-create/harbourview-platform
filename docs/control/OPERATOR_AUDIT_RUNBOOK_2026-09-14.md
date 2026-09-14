# Operator Audit Runbook — 2026-09-14

**Status:** Active  
**Source:** Deep audit of `harbourview-platform` main  
**Audience:** Tyler / operator with Supabase + Vercel + GitHub dashboard access  

This runbook implements the **operator-only** half of the audit backlog. Code/CI guards ship separately in-repo.

---

## P0-2 — Live security probes

### A. Anonymous admin denial

```bash
curl -sI "https://harbourview.vercel.app/admin"
curl -sI "https://harbourview.vercel.app/admin/applications"
curl -s "https://harbourview.vercel.app/admin" | head -c 500
```

Expect: redirect to login (3xx) or 401/403 — never admin shell HTML for anonymous.

### B. Public leakage probe

```bash
HARBOURVIEW_SMOKE_BASE_URL=https://harbourview.vercel.app npm run probe:production-visibility
# or
node scripts/probe-public-leakage.mjs
```

Record results in `docs/control/EVIDENCE_LOG.md` with timestamp and production deployment commit SHA.

### C. Role matrix (spot)

| Actor | `/admin` | `/admin/applications` | `/api/clinical/admin/review` |
|-------|----------|------------------------|------------------------------|
| Anonymous | deny | deny | 401 |
| Logged-in non-admin | deny (403) | deny | 403 |
| Admin/operator | allow | allow | 200 |

---

## P0-3 — Intelligence / cron health

### A. pg_cron active flags (Supabase SQL)

```sql
select jobid, jobname, schedule, active
from cron.job
order by active, jobname;
```

Flag any inactive job the product still depends on. **Do not re-enable bulk quality ticks without Nano I/O budget review** (INTELLIGENCE_ARCHITECTURE_SPEC §2.8).

### B. Feed freshness

```sql
select
  max(reviewed_at) filter (where reviewed) as last_promo,
  count(*) filter (where quality_label is null and created_at > now() - interval '14 days') as unclassified_14d,
  count(*) filter (where reviewed and reviewed_at > now() - interval '7 days') as reviewed_7d
from public.signals;
```

### C. Vercel cron logs

Confirm recent success for: intelligence-ingest → extract → embed → notify; intelligence-health.

### D. Env for health alerts

Production: `CRON_SECRET`, `RESEND_API_KEY`, `HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL` (or `HARBOURVIEW_TO_EMAIL`), `HARBOURVIEW_FROM_EMAIL`.

---

## P0-1 — Migration lag triage

1. Diff live `schema_migrations` vs `supabase/migrations/` and release-controls baselines.
2. Process: security/RLS/clinical first, then features.
3. Apply only with operator approval; ledger row at **committed** version.
4. Evidence each apply in EVIDENCE_LOG.md.

See also: `committed-not-applied-baseline.json`, `pending-production-migration-decisions.json`.

---

## P1-5 — Unscheduled cron routes

See `docs/control/CRON_ROUTE_DISPOSITION_2026-09-14.md`. Edit `vercel.json` only after Pro plan / quota check.

---

## P2 — Dashboard / CI (operator)

| Item | Action |
|------|--------|
| Branch protection | Apply per MAIN_BRANCH_PROTECTION_SPEC |
| Dependabot | Converged branch or limited secrets |
| Cloudflare / Netlify / GCP | Disconnect stale integrations |

---

## Sign-off template

```md
## Audit runbook execution — YYYY-MM-DD
- Production commit: …
- Anonymous /admin: PASS/FAIL
- Leakage probe: PASS/FAIL
- pg_cron snapshot: …
- Migration triage: N applied, M remaining
- Cron disposition: …
- Operator: …
```
