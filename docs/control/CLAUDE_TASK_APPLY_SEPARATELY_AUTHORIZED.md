# Claude task — separately authorized migrations (baseline)

**Status:** HOLD until operator explicitly authorizes each version.

These five versions are in `committed-not-applied-baseline.json` and classified
`separately_authorized` / `independent_release_not_authorized` in
`pending-production-migration-decisions.json`. They are **not** auto-approved.

## Versions

| Version | File |
|---------|------|
| `20260727163000` | `clinical_api_surface.sql` |
| `20260731120000` | `signal_role_family_routing.sql` |
| `20260801150000` | `api_expose_quality_and_routing_columns.sql` |
| `20260802080000` | `harden_eval_labels_and_alert_delivery.sql` |
| `20260810222500` | `harden_edge_function_cron_auth.sql` |

## Per-version procedure (only after operator names the version)

1. Read the full SQL file in `supabase/migrations/`.
2. Preflight on production `zvxdgdkukjrrwamdpqrg`: confirm objects/columns/grants the migration expects; dry-run risk (DROP/REVOKE especially on `20260810222500` cron auth).
3. If safe: apply statements via Supabase MCP/`apply_migration` **or** SQL editor, using the **canonical filename version** when possible.
4. Insert/confirm `schema_migrations` row for that version (or record equivalence if Supabase mints a new timestamp — then update `migration-live-version-equivalences.json`).
5. Remove the version from `committed-not-applied-baseline.json` in a follow-up PR only after live ledger confirms.
6. Do **not** apply the other four in the same session unless operator authorized the batch.

## Do not

- Bulk-apply all five without per-file preflight
- Apply any of the 67 `requiring_forward_reconciliation` restore/foundation files from this task
- Commit secret-bearing remote-only migrations

## Related

- Full triage: `docs/control/BASELINE_127_TRIAGE.md`
- Global catalog apply (separate): PR #1783 / `CLAUDE_TASK_APPLY_20260903100000.md`
