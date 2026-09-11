# Remaining baseline workthrough (after #1783/#1787 queues)

## Actions taken in this PR

- **Removed 12 equivalent versions** from `committed-not-applied-baseline.json` (already live under aliased timestamps; gate already treats them as applied).
- Baseline count **127 → 115**.

## Still queued for production apply (do not prune yet)

- `20260727163000` — PR #1787
- `20260731120000` — PR #1787
- `20260801150000` — PR #1787
- `20260802080000` — PR #1787
- `20260810222500` — PR #1787
- `20260903100000` — PR #1783

## Obsolete (5) — keep baselined; do not apply

- `20260722030000` — analyze harvest timeout
- `20260723180000` — revoke legacy briefings → live `20260727002735`
- `20260724000000` — entity decode blanking → live `20260724105120`
- `20260730110000` — dedup assign timeout → live `20260730104444`
- `20260730180000` — search_public_signals_rpc

## RFR restore/foundation (28) — HOLD as direct apply

Replay-only foundation. Keep baselined; idempotent migration/prep fixes only if Preview/CI needs them.

## RFR seed/catalog (3) — HOLD

`20260730220000`, `20260730220100`, `20260730220200`

## RFR grants (5) — HOLD unless live grant audit proves gap

`20260722031500`, `20260729000002`, `20260729010000`, `20260729020000`, `20260805234000`

## RFR other (31) — HOLD / forward-repair only

Includes early marketplace conversion, workspace, pipeline promote, countries repair, etc.

## Unclassified (37) — optional future waves

### Wave U1 — lower risk / small (after live preflight)

- `20260811140000` seed_jurisdictions_identity_from_countries
- `20260813010001` extend_supply_catalog_equipment_to_australia
- `20260815213000` daily_brief_delta_history_backfill
- `20260815222000` jurisdiction_command_canada_refresh
- `20260816150200` clinical_evidence_domain_separation
- `20260818151000` clinical_sku_bootstrap_snapshots
- `20260822010000` scope_anon_unsatisfiable_policies
- `20260822150000` marketplace_item_card_media_v1
- `20260831030000` backfill_strip_leaked_site_suffix_from_signals

### Wave U2 — product features (explicit operator + preflight)

- decision_intel stage0 trio, clinical evidence OS, auto_heatmap, pipeline optimization, daily_brief/digest, heatmap freeze, etc.

### Wave U3 — security / grants / destructive (security review)

- baseline_capture_*, release_closure_security_hardening, lock_down_api_schema_drift_rpcs, p0_p2_canonical_finish, tighten_regulatory_signals_grants, etc.

Full version lists: see commit / prior triage `BASELINE_127_TRIAGE.md`.

## What this does **not** do

- Does not apply remaining ~114 to production
- Does not authorize Wave U2/U3 without a new operator message
- Does not delete obsolete migration files
