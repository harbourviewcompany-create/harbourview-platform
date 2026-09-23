# Signal Engine migration ledger

| Migration | Purpose | Production effect |
|-----------|---------|-------------------|
| `20260923120000_signal_engine_autonomy_foundations.sql` | `autonomy_policies` + `signal_decision_events` | Tables only; **no** Full Auto enablement; RLS deny client roles |
| Existing `classifier_validation` | Mechanical promote gate | Unchanged by this work |

## Rules

1. Additive only (`CREATE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
2. Never flip `gate_passed` / `requires_human` without stratified eval evidence + owner sign-off.
3. Client roles (`anon`, `authenticated`) have no grants; use service role / security definer for writers.
4. See `docs/SIGNALS_MAX_AUTOMATION_DESIGN.md` for autonomy levels and gate stack.

## Next (not in this migration)

- Optional columns on `signals`: `autonomy_level`, `gate_scores`, `promotion_path`
- `source_yield_metrics`
- Admin read UI for decision events
- AFTER UPDATE logging trigger (only when promote path is ready)
