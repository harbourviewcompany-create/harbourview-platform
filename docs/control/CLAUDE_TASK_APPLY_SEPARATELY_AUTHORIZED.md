# Separately authorized migrations — status

**Live status as of 2026-09-10: all five are UNAPPLIED. None has been applied to
production.** Verified directly, not inferred:

```sql
select version from supabase_migrations.schema_migrations
where version in ('20260727163000','20260731120000','20260801150000',
                  '20260802080000','20260810222500');
-- 0 rows
```

## Why this file was rewritten

Two PRs created this path with contradictory content, and merging either as-written
would have silently settled the question:

- **#1786** said *"HOLD until operator explicitly authorizes each version… not
  auto-approved."*
- **#1787** said *"Operator authorized all five on 2026-09-07 ('Go on'). Claude owns
  production apply."*

Tyler resolved it on 2026-09-10: keep #1786's triage table and #1787's runbook, and
replace the status file with one accurate statement. This is that file.

## The accurate position

A prior session recorded an operator "Go on" for these five on 2026-09-07. That
authorization **was never exercised** — nothing was applied — and it has **not** been
re-confirmed since. So neither of the two original framings is safe to act on as-is:
"already authorized, go" overstates it, and "no authorization has ever existed"
understates it.

**Treat these five as requiring fresh per-version confirmation before any apply.** An
authorization recorded in a document by an earlier session is not a substitute for the
operator confirming the specific version now, at the moment of applying — especially
after this long a gap, and especially given the two entries below.

| Version | File | Standing risk |
|---------|------|---------------|
| `20260727163000` | `clinical_api_surface.sql` | Creates `api.clinical_*` invoker views. Stop if base tables are missing — do not create empty views. |
| `20260731120000` | `signal_role_family_routing.sql` | Additive columns + reference data. |
| `20260801150000` | `api_expose_quality_and_routing_columns.sql` | Exposes quality/routing columns to `api.*`. `quality_label` is read in 14 app files. |
| `20260802080000` | `harden_eval_labels_and_alert_delivery.sql` | Contains REVOKE/GRANT — read the full file and check dependent jobs first. |
| `20260810222500` | `harden_edge_function_cron_auth.sql` | **Highest risk.** Repoints cron helpers at Vault and fails closed. If `job_refresh_cron_secret`, `schema_drift_cron_secret` or `hv_source_pull_runner_secret` is absent, cron **hard-fails**. Verify all three exist before applying. |

## Procedure

Order, preflight, verify and baseline cleanup: → [`CLAUDE_TASK_APPLY_FIVE_SEPARATELY_AUTHORIZED.md`](./CLAUDE_TASK_APPLY_FIVE_SEPARATELY_AUTHORIZED.md)

Two rules that override anything in that runbook:

1. **Use the committed version.** Record the ledger row at the canonical filename
   version. Do not use `apply_migration` — it mints its own timestamp and manufactures a
   phantom version with no repository file (`AGENT_OPERATING_FACTS` §1).
2. **Preflight is not optional, even for a version the operator just named.** Check
   current state first; the data may already be in the target state, in which case
   record the ledger row and do not re-run the body. That is exactly what happened with
   `20260903100000` on 2026-09-10 — see `EVIDENCE_LOG.md`.

## Triage context

`docs/control/BASELINE_127_TRIAGE.md` (PR #1786), section C.
