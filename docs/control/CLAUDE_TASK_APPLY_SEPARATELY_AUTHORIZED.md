# Separately authorized migrations — status

**Operator authorized all five on 2026-09-07 (“Go on”).**

Full apply runbook (order, preflight, verify, baseline cleanup):

→ [`CLAUDE_TASK_APPLY_FIVE_SEPARATELY_AUTHORIZED.md`](./CLAUDE_TASK_APPLY_FIVE_SEPARATELY_AUTHORIZED.md)

| Version | File |
|---------|------|
| `20260727163000` | `clinical_api_surface.sql` |
| `20260731120000` | `signal_role_family_routing.sql` |
| `20260801150000` | `api_expose_quality_and_routing_columns.sql` |
| `20260802080000` | `harden_eval_labels_and_alert_delivery.sql` |
| `20260810222500` | `harden_edge_function_cron_auth.sql` |

Claude owns production apply. After live ledger confirms each version, remove it from `committed-not-applied-baseline.json` in the same or follow-up PR.
