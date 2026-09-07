# Baselined committed-not-applied triage (127 versions)

Generated for operator/Claude disposition. **Do not bulk-apply.**

## Summary

| Bucket | Count | Disposition |
|--------|------:|-------------|
| Equivalent (live alias) | 12 | No apply — already live under different version |
| Obsolete / superseded | 5 | No apply — withdraw or keep baselined |
| Separately authorized | 5 | Apply only with explicit operator auth |
| Requiring forward reconciliation | 67 | Not direct apply — needs forward migration or proof |
| Unclassified (post decision-snapshot) | 38 | Case-by-case; one clear apply candidate |

## A. Equivalent — already applied (live alias)

- `20260807000900` → live `20260807181844` — `20260807000900_revoke_data_api_execute_on_secret_accessors.sql`
- `20260807001000` → live `20260807181907` — `20260807001000_revoke_data_api_default_privileges_on_public.sql`
- `20260807001100` → live `20260807182104` — `20260807001100_fix_promote_staging_null_object_class.sql`
- `20260808190400` → live `20260808202814` — `20260808190400_restore_harbourview_admin_guard.sql`
- `20260808190500` → live `20260808203859` — `20260808190500_reconcile_marketplace_image_trust_contract.sql`
- `20260812090000` → live `20260812143733` — `20260812090000_structured_tabular_authority_sources.sql`
- `20260819160000` → live `20260819232736` — `20260819160000_clinical_jurisdiction_supply_outlook.sql`
- `20260819190000` → live `20260820100423` — `20260819190000_clinical_cross_border_formulary_check.sql`
- `20260822172000` → live `20260822173834` — `20260822172000_talent_production_integration_repair.sql`
- `20260822174500` → live `20260822214001` — `20260822174500_talent_api_schema_exposure.sql`
- `20260828022000` → live `20260828111619` — `20260828022000_fix_counterparty_extraction_cte_scope.sql`
- `20260828143000` → live `20260828140346` — `20260828143000_signal_timeline_population_hardening.sql`

## B. Obsolete — do not apply

- `20260722030000` — analyze harvest timeout (superseded)
- `20260723180000` — revoke legacy briefings grants → live `20260727002735`
- `20260724000000` — entity decode blanking → live `20260724105120`
- `20260730110000` — dedup assign timeout → live `20260730104444`
- `20260730180000` — search_public_signals_rpc (superseded)

## C. Separately authorized — apply only with operator auth

See `docs/control/CLAUDE_TASK_APPLY_SEPARATELY_AUTHORIZED.md`.

- `20260727163000` — clinical_api_surface
- `20260731120000` — signal_role_family_routing
- `20260801150000` — api_expose_quality_and_routing_columns
- `20260802080000` — harden_eval_labels_and_alert_delivery
- `20260810222500` — harden_edge_function_cron_auth

## D. Clear product apply candidate (already queued)

- `20260903100000` — make_supply_catalog_globally_available — **PR #1783**

## E. Unclassified (post decision-snapshot) — preflight before any apply

Includes decision-intel stage0, baseline_capture_*, clinical evidence OS, heatmap, pipeline optimization, policy scoping, daily digest quality, grant tighteners, etc. Full list in repo history of this file; treat as **HOLD** until live object proof. Do not batch-apply.

Notable product-adjacent (still HOLD without preflight):

- `20260816150000` clinical_evidence_operating_system (+ 501/502 follow-ons)
- `20260816120000` auto_heatmap_from_signals
- `20260820130000` hv_pipeline_optimization
- `20260822150000` marketplace_item_card_media_v1
- `20260831023000` daily_digest_manual_fallback_content_quality
- `20260902220000` tighten_regulatory_signals_grants_to_intended_scope

## F. Requiring forward reconciliation (67) — do not blind-apply

Mostly `restore_*_foundation`, marketplace/catalog seeds, grant repairs, and early workspace replay. Classification is `fresh_snapshot_requires_disposition`. Production likely already has equivalent objects under other versions; applying these as-written risks duplicate objects or conflicts. Prefer forward repair migrations after live diff.

## Remote-only (not in this 127)

Deliberately **not** committed (secrets): `20260730112526`, `20260731090302` — see `historical-remote-migration-attestations.json`.
