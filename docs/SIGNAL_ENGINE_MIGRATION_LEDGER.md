# Signal Engine migration ledger

| Migration | Purpose | Production effect |
|-----------|---------|-------------------|
| `20260923120000_signal_engine_autonomy_foundations.sql` | `autonomy_policies` + `signal_decision_events` | Tables only; **no** Full Auto enablement; RLS deny client roles |
| `20260923140000_signal_autonomy_columns_and_decision_log.sql` | Columns on `signals` + AFTER UPDATE decision log | Observability only; promote path unchanged |
| `20260923160000_source_yield_metrics.sql` | `source_yield_metrics` + private 7d refresh | Observability; no promote |
| Existing `classifier_validation` | Mechanical promote gate | Unchanged by this work |

## Application code

| Module | Role |
|--------|------|
| `lib/signals/autonomyEvaluate.ts` | Pure evaluator stub — proposes levels, **never promotes** |
| `tests/signals/autonomyEvaluate.test.ts` | Fail-closed policy tests |

## Rules

1. Additive only (`CREATE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
2. Never flip `gate_passed` / `requires_human` without stratified eval evidence + owner sign-off.
3. Client roles (`anon`, `authenticated`) have no grants on autonomy tables; use service role / security definer for writers.
4. Do not rewrite `hv_promote_signals` in autonomy PRs unless the change is a verified reconstruction of the live body.
5. See `docs/SIGNALS_MAX_AUTOMATION_DESIGN.md` for autonomy levels and gate stack.

## Next (not yet shipped)

- Wire evaluator into a cron job that **writes scores only** (still calls existing promote RPC separately)
- Cron schedule for `private.refresh_source_yield_metrics_7d()`
- Admin UI list of decision events
