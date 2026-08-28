# Migration Pending Audit — 2026-08-27

Status: **MIGRATION-DRIFT / VERCEL REPAIR GO; BROADER MIGRATION ACTIVATION HOLD**

## Scope and guardrails

This control record classifies the fixed 120-version `unexpected_pending` universe produced by the migration ledger manifest. It is an activation-governance audit only. No migration was applied, repaired, deleted, renamed, attested, or otherwise mutated by this audit, and no application behavior was changed.

Fixed manifest:
- Generated: `2026-08-27T23:17:28.660Z`
- Source SHA: `4501e84d80847839e2f7bf02f93262a982f4edf3`
- Mode: `reconcile`
- Repository versions: 989
- Remote ledger rows: 869
- Historical remote-only rows filtered by existing attestations: 2
- Remote versions after historical filter: 867
- Committed-not-applied: 120
- Unexpected pending: 120
- Unexpected remote versions: 0
- Equivalence mismatches: 0
- Approved migrations: 3
- Approved migration issues: 0
- Execution gate: PASS
- Activation gate: not evaluated

A read-only production query against Supabase project `zvxdgdkukjrrwamdpqrg` checked all 120 versions directly against `supabase_migrations.schema_migrations`: requested 120, applied 0, applied version set empty.

## Classification result

| Disposition | Count |
|---|---:|
| intentionally unapplied/historical | 0 |
| superseded or withdrawn | 5 |
| awaiting explicit production approval | 115 |
| genuinely required in production | 0 |
| **Total** | **120** |

The 5 retired rows are supported by `supabase/release-controls/release-closure-migration-classification-20260814.json`. The remaining 115 are committed and live-absent but have no active production approval. This classification does **not** assert that those 115 are safe, necessary, or ready to apply; each remains activation-HOLD until separately approved and verified. No row is classified `genuinely required in production` because the current control state does not authorize that production-necessity decision.

Evidence keys:
- **M** — fixed manifest contains the version in the 120 committed-not-applied / unexpected-pending set, with zero unexpected remote versions and zero equivalence mismatches.
- **L** — read-only live query confirms the version is absent from `supabase_migrations.schema_migrations`; all 120 were absent.
- **A** — active migration control does not authorize this version for production activation; the manifest has `allowed_pending = 0`, and its 3 approved migrations are outside this 120-version universe.
- **R** — existing August 14 release-closure control explicitly records the migration as retired, with the stated repository rationale.

## Complete 120-version classification

| Version | Classification | Supporting evidence |
|---|---|---|
| `20260430000003` | awaiting explicit production approval | M + L + A |
| `20260528033001` | awaiting explicit production approval | M + L + A |
| `20260611103000` | awaiting explicit production approval | M + L + A |
| `20260611150000` | awaiting explicit production approval | M + L + A |
| `20260613080000` | awaiting explicit production approval | M + L + A |
| `20260613170000` | awaiting explicit production approval | M + L + A |
| `20260615091139` | awaiting explicit production approval | M + L + A |
| `20260618210800` | awaiting explicit production approval | M + L + A |
| `20260618210830` | awaiting explicit production approval | M + L + A |
| `20260618210840` | awaiting explicit production approval | M + L + A |
| `20260618210850` | awaiting explicit production approval | M + L + A |
| `20260618211000` | awaiting explicit production approval | M + L + A |
| `20260621220515` | awaiting explicit production approval | M + L + A |
| `20260622162300` | awaiting explicit production approval | M + L + A |
| `20260624032500` | awaiting explicit production approval | M + L + A |
| `20260624171409` | awaiting explicit production approval | M + L + A |
| `20260626110922` | awaiting explicit production approval | M + L + A |
| `20260626110923` | awaiting explicit production approval | M + L + A |
| `20260626110924` | awaiting explicit production approval | M + L + A |
| `20260630233906` | awaiting explicit production approval | M + L + A |
| `20260708214306` | awaiting explicit production approval | M + L + A |
| `20260708214307` | awaiting explicit production approval | M + L + A |
| `20260708214309` | awaiting explicit production approval | M + L + A |
| `20260708214310` | awaiting explicit production approval | M + L + A |
| `20260708214311` | awaiting explicit production approval | M + L + A |
| `20260708214312` | awaiting explicit production approval | M + L + A |
| `20260708214313` | awaiting explicit production approval | M + L + A |
| `20260708214314` | awaiting explicit production approval | M + L + A |
| `20260708214315` | awaiting explicit production approval | M + L + A |
| `20260708214316` | awaiting explicit production approval | M + L + A |
| `20260708214317` | awaiting explicit production approval | M + L + A |
| `20260709085216` | awaiting explicit production approval | M + L + A |
| `20260710094129` | awaiting explicit production approval | M + L + A |
| `20260710114720` | awaiting explicit production approval | M + L + A |
| `20260710235323` | awaiting explicit production approval | M + L + A |
| `20260719190928` | awaiting explicit production approval | M + L + A |
| `20260722021500` | awaiting explicit production approval | M + L + A |
| `20260722021600` | awaiting explicit production approval | M + L + A |
| `20260722021700` | awaiting explicit production approval | M + L + A |
| `20260722022000` | awaiting explicit production approval | M + L + A |
| `20260722022100` | awaiting explicit production approval | M + L + A |
| `20260722030000` | superseded or withdrawn | R — admin_debug_find_objects — unused admin debug RPC; no runtime references |
| `20260722031500` | awaiting explicit production approval | M + L + A |
| `20260722120002` | awaiting explicit production approval | M + L + A |
| `20260723180000` | superseded or withdrawn | R — create_billing_views — orphan billing views experiment |
| `20260724000000` | superseded or withdrawn | R — create_claims_system — orphan claims-processing experiment |
| `20260727163000` | awaiting explicit production approval | M + L + A |
| `20260728201439` | awaiting explicit production approval | M + L + A |
| `20260729000000` | awaiting explicit production approval | M + L + A |
| `20260729000002` | awaiting explicit production approval | M + L + A |
| `20260729010000` | awaiting explicit production approval | M + L + A |
| `20260729020000` | awaiting explicit production approval | M + L + A |
| `20260729130000` | awaiting explicit production approval | M + L + A |
| `20260730110000` | superseded or withdrawn | R — list_migrations — unused admin RPC exposing migration metadata |
| `20260730123000` | awaiting explicit production approval | M + L + A |
| `20260730180000` | superseded or withdrawn | R — env_check — unused admin RPC exposing database configuration |
| `20260730215959` | awaiting explicit production approval | M + L + A |
| `20260730220000` | awaiting explicit production approval | M + L + A |
| `20260730220050` | awaiting explicit production approval | M + L + A |
| `20260730220100` | awaiting explicit production approval | M + L + A |
| `20260730220200` | awaiting explicit production approval | M + L + A |
| `20260730221500` | awaiting explicit production approval | M + L + A |
| `20260730222000` | awaiting explicit production approval | M + L + A |
| `20260731013000` | awaiting explicit production approval | M + L + A |
| `20260731120000` | awaiting explicit production approval | M + L + A |
| `20260801150000` | awaiting explicit production approval | M + L + A |
| `20260802080000` | awaiting explicit production approval | M + L + A |
| `20260804233000` | awaiting explicit production approval | M + L + A |
| `20260804234000` | awaiting explicit production approval | M + L + A |
| `20260804234500` | awaiting explicit production approval | M + L + A |
| `20260804235000` | awaiting explicit production approval | M + L + A |
| `20260804235500` | awaiting explicit production approval | M + L + A |
| `20260805000000` | awaiting explicit production approval | M + L + A |
| `20260805233500` | awaiting explicit production approval | M + L + A |
| `20260805234000` | awaiting explicit production approval | M + L + A |
| `20260808120000` | awaiting explicit production approval | M + L + A |
| `20260808190000` | awaiting explicit production approval | M + L + A |
| `20260808203000` | awaiting explicit production approval | M + L + A |
| `20260810202000` | awaiting explicit production approval | M + L + A |
| `20260810222500` | awaiting explicit production approval | M + L + A |
| `20260810223000` | awaiting explicit production approval | M + L + A |
| `20260811010000` | awaiting explicit production approval | M + L + A |
| `20260811011000` | awaiting explicit production approval | M + L + A |
| `20260811012000` | awaiting explicit production approval | M + L + A |
| `20260811013000` | awaiting explicit production approval | M + L + A |
| `20260811014000` | awaiting explicit production approval | M + L + A |
| `20260811015000` | awaiting explicit production approval | M + L + A |
| `20260811015100` | awaiting explicit production approval | M + L + A |
| `20260811140000` | awaiting explicit production approval | M + L + A |
| `20260813000000` | awaiting explicit production approval | M + L + A |
| `20260813010000` | awaiting explicit production approval | M + L + A |
| `20260813010001` | awaiting explicit production approval | M + L + A |
| `20260813020000` | awaiting explicit production approval | M + L + A |
| `20260813030000` | awaiting explicit production approval | M + L + A |
| `20260814122000` | awaiting explicit production approval | M + L + A |
| `20260814124500` | awaiting explicit production approval | M + L + A |
| `20260814220000` | awaiting explicit production approval | M + L + A |
| `20260815013000` | awaiting explicit production approval | M + L + A |
| `20260815140000` | awaiting explicit production approval | M + L + A |
| `20260815204500` | awaiting explicit production approval | M + L + A |
| `20260815213000` | awaiting explicit production approval | M + L + A |
| `20260815222000` | awaiting explicit production approval | M + L + A |
| `20260815234000` | awaiting explicit production approval | M + L + A |
| `20260816120000` | awaiting explicit production approval | M + L + A |
| `20260816150000` | awaiting explicit production approval | M + L + A |
| `20260816150100` | awaiting explicit production approval | M + L + A |
| `20260816150200` | awaiting explicit production approval | M + L + A |
| `20260818110000` | awaiting explicit production approval | M + L + A |
| `20260818133500` | awaiting explicit production approval | M + L + A |
| `20260818133600` | awaiting explicit production approval | M + L + A |
| `20260818133700` | awaiting explicit production approval | M + L + A |
| `20260818151000` | awaiting explicit production approval | M + L + A |
| `20260820100000` | awaiting explicit production approval | M + L + A |
| `20260820120000` | awaiting explicit production approval | M + L + A |
| `20260820130000` | awaiting explicit production approval | M + L + A |
| `20260820131000` | awaiting explicit production approval | M + L + A |
| `20260821100000` | awaiting explicit production approval | M + L + A |
| `20260822123000` | awaiting explicit production approval | M + L + A |
| `20260822134500` | awaiting explicit production approval | M + L + A |
| `20260822150000` | awaiting explicit production approval | M + L + A |

## Control-model defect

`scripts/migration-ledger-manifest.mjs` derives `committedNotApplied` from repository versions absent from the remote ledger, then treats only versions in `controlled-migrations.json` `approved_migrations` as allowed pending. It does not ingest `supabase/release-controls/release-closure-migration-classification-20260814.json` or another durable deferred/retired disposition source. As a result, a deliberately deferred or retired migration that remains committed is structurally emitted as `unexpected_pending` unless it is also put into `approved_migrations`.

That conflates two different states:
1. committed but intentionally not activated; and
2. approved for production activation.

The defect explains why legitimate deferred/retired repository migrations appear as unexpected pending. It is documented here only; the generator/control model is not changed by this closeout.

## #1661 / #1659 closeout relationship

The completed #1661 migration-ledger reconciliation and #1659 Vercel repair are **GO**. That GO means the two remote-only claim-map migrations were committed exactly without SQL replay, migration equivalence drift was cleared, required checks passed, and the Vercel Hobby cron admission failure was repaired and deployed.

The broader 120-version migration activation set remains **HOLD**. Repair GO is not production-activation approval.

## Refreshed closeout evidence

Evidence capture for this documentation closeout:
- Protected `main`: `9d68bccd45b820302b68f8bb269a6906a13d87d1`.
- Current READY Vercel production deployment: `dpl_6c695cr6gMzKJYqdgTHWzmuWKSZi`.
- Deployment Git SHA: `9d68bccd45b820302b68f8bb269a6906a13d87d1` (exact match to protected `main` at capture).
- Canonical `https://harbourview.vercel.app/`: HTTP 200; ETag `W/"8ade790100fe3cc75a6abd2988f50e5a"`.
- Vercel runtime-error query for the preceding 24 hours: no runtime-error clusters.
- #1661 merge SHA: `87c171309f6c74f5ddb22848cebd4db67785fb51`.
- #1659 merge SHA: `e702f875458fcceee927fe753ad50f561beceefe`.
- Original #1659 repair deployment: `dpl_9A4c3uwKnrWX3RJkPWghhpvkr23D`, READY on `e702f875458fcceee927fe753ad50f561beceefe` and previously verified HTTP 200.

The original #1659 deployment proves the repair event. The refreshed deployment above proves the later current production state at this evidence capture.

## Final control matrix

| Control surface | Status |
|---|---|
| #1661 exact migration reconciliation | GO |
| Remote-only migration drift after reconciliation | GO — 0 |
| Migration equivalence mismatches | GO — 0 |
| Explicitly approved migrations | GO — 3/3 applied |
| #1659 Vercel repair | GO |
| Canonical production HTTP | GO |
| Current Vercel runtime-error check | GO if no error clusters at evidence capture |
| 5 retired/superseded pending migrations | HOLD from activation; classified |
| 115 unapproved repository-only pending migrations | HOLD pending explicit production approval |
| Broader migration activation | **HOLD** |
