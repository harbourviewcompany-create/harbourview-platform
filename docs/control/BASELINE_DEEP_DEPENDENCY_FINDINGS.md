# Baseline deep dig — code ↔ migration dependency findings

Date: 2026-09-07. Method: repository search of `lib/`, `app/`, `components/` against unapplied baseline migration DDL (no live DB access from this agent).

## Highest material gap: Decision Intel stage0 (unapplied)

**App code calls RPCs that only exist in baselined-unapplied migrations.**

| Code | Calls |
|------|--------|
| `lib/intelligence-os/decisionDossier.ts` | `rpc('get_intel_event_dossier')`, `rpc('resolve_intel_event_route')` |
| Dashboard / Command Centre DecisionIntel surfaces | Routes and types under `lib/intelligence-os/*`, `components/dashboard/*` |

| Version | File | Creates (summary) |
|---------|------|-------------------|
| `20260808190000` | decision_intel_stage0_first_slice | `intel_evidence_refs`, `intel_assertions`, `intel_events`, assessments, recommendations, `api.intel_event_dossiers` |
| `20260808203000` | decision_intel_stage0_review_fixes | stamps/triggers, `api.get_intel_event_dossier`, `api.resolve_intel_event_route` |
| `20260810202000` | decision_intel_stage0_completion_hardening | customer visibility, `api.resolve_intel_dashboard_routes`, withdrawn-signal suppress |

**Only these three migrations define `intel_events` / `get_intel_event_dossier`.** No other applied migration creates them.

**Implication:** Decision Intel dossier UI will fail closed (RPC missing) until this chain is applied. Treat as product-critical, not optional backlog.

**Recommended apply order:** 190000 → 203000 → 10202000 (same as filename chronology).

---

## Clinical evidence — partial, not a greenfield gap

`lib/server/clinicalEvidenceQuery.ts` calls:

- `search_clinical_evidence_records`
- `clinical_evidence_claims_for_records`
- `clinical_evidence_study_families_for_records`
- `clinical_evidence_corpus_profile`

Spine migrations **not** in the baseline (likely already on production):

- `20260814121500` clinical_evidence_spine
- `20260819100621` clinical_evidence_spine_reconcile
- `20260818213000` clinical_prescriber_os_reconciliation

Still baselined (OS layer on top of spine):

- `20260816150000` clinical_evidence_operating_system (large)
- `20260816150100` retrieval hardening
- `20260816150200` domain separation

**Implication:** Core Ask Clinical may already work via spine; OS migrations add concepts/claims/study-family graph. Apply only after live preflight: `to_regprocedure` / function list for `search_clinical_evidence_records`. If live already has full OS signatures, mark equivalent or skip body.

---

## Marketplace card media — single-source unapplied view

| Version | Object |
|---------|--------|
| `20260822150000` | `public.marketplace_item_card_media_v1` (security_invoker view) |

Referenced by `lib/marketplace/images/public-query.ts` (`item_card_media`).

**Implication:** Card hero path may degrade or multi-row-fetch if view absent. Small, additive, good Wave U1 candidate after preflight on `marketplace_item_images`.

---

## Supply AU equipment extend + global catalog

| Version | Role |
|---------|------|
| `20260813010001` | UPDATE target_countries for equipment → Australia |
| `20260903100000` | Global ~195 ISO2 on sold_by_harbourview — **#1783** |

Code reads `target_countries` in supply pages. Global catalog apply remains the broader fix; AU extend is narrower additive data.

---

## Auto heatmap / market access proposals — unapplied subsystem

`20260816120000` creates `market_access_events`, `market_access_proposals`, `platform_feature_flags`, `api.promote_market_access_from_signals`, etc.

No direct string hit for `auto_heatmap` in app code; related commercial/globe paths use other APIs. **Medium priority** — enable only with product intent for auto-apply heatmap.

---

## Already queued (do not re-triage)

| PR | Versions |
|----|----------|
| #1783 | `20260903100000` |
| #1787 | five separately_authorized (clinical api views, role_family, quality columns, eval harden, cron vault) |

Note: `quality_label` appears in **14** app files; #1787’s `20260801150000` is what exposes those columns through `api.*` views the dashboard uses.

---

## Still low urgency after dig

| Class | Why |
|-------|-----|
| 28 RFR restore/foundation | Replay reconstruction; production objects exist under other history |
| Obsolete 5 | Superseded |
| 12 equivalents | Already live (prune in #1788) |
| Security policy scoping / grant tighteners | Need live audit; risk of over-revoke |
| performance_advisor_fixes | 81 CREATE INDEX style; optional |

---

## Suggested next operator actions

1. Finish Claude **#1783** + **#1787** (already authorized).
2. Authorize **Decision Intel stage0 trio** (this dig’s top gap) — runbook companion file.
3. Optional Wave U1: `20260822150000` marketplace media view; `20260831030000` site-suffix backfill; `20260813010001` AU equipment.
4. Clinical OS (`20260816150000`+) only after live function inventory.
5. Merge baseline prune **#1788** when green.
