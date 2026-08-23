# Apply P0–P2 canonical pipeline — production (scaffold)

**Status:** SCAFFOLD on branch / pending merge — **production execution remains HOLD** until preflight is green and an operator explicitly authorizes apply.  
**Canonical workflow:** `.github/workflows/apply-p0-p2-canonical-pipeline.yml`  
**Runbook:** `docs/control/INTEL_PIPELINE_P0_P2_LIVE_RUNBOOK.md`  
**Checklist:** `docs/control/INTEL_PIPELINE_P0_P2_APPLY_CHECKLIST.md`

## Why this exists

Unscoped `supabase db push --linked --include-all` would apply the entire pending repository set (~100+ versions), not only the three canonical P0–P2 migrations. This workflow applies **only**:

| Version | File | Reviewed blob |
|---------|------|---------------|
| `20260820130000` | `..._hv_pipeline_optimization.sql` | `6ae416933e669df5d1f303fd85a91438c66fec26` |
| `20260820131000` | `..._hv_review_queue_resolve.sql` | `0c9cf6ebd19801767b305c4fb9a61f1b114f593f` |
| `20260821100000` | `..._p0_p2_canonical_finish.sql` | `c262859bfb6b79aa4d9ced469159b3563fbe2a06` |

**Forbidden:** `20260820180000` (removed PR #1606 path).

## Dispatch modes

| Input | Effect |
|-------|--------|
| `HOLD` | No database access |
| `PREFLIGHT_ONLY` | Read-only: blob pins, ledger, #1606 remnants, UTC, resume matrix, cron identity |
| `APPLY_PRODUCTION_MIGRATIONS` | Pause+drain quality crons → apply missing of the three → structural gates → **leave crons paused** |

Staggered cron restore (`hv-quality-pipeline` then `hv-quality-promote`) is **not** automated here. Use runbook §10–11 after structural GO.

## Example

```bash
# 1) Preflight only (safe)
gh workflow run apply-p0-p2-canonical-pipeline.yml \
  --ref main \
  -f production_action=PREFLIGHT_ONLY

# 2) Apply only after preflight green + checklist sign-off
gh workflow run apply-p0-p2-canonical-pipeline.yml \
  --ref main \
  -f production_action=APPLY_PRODUCTION_MIGRATIONS
```

Approve the `production-database` environment when prompted. Dispatch **from `main` only**.

## Scaffold limits (follow-ups)

- Does not prove the global “no other pending migrations” dry-run; it **never** runs unscoped push, so unrelated pendings are simply not applied.
- Does not automate timestamp-scoped cron smoke or 8-minute pipeline runtime proof.
- Does not auto-restore crons (fail-closed: apply leaves both inactive).
- Full ACL/RPC matrix and promotion semantic query remain operator steps in the runbook.

## Non-goals

- No `db push --include-all`
- No ledger repair / `migration repair`
- No manual insert of failed versions
- No production data rewrites beyond the three migration bodies
