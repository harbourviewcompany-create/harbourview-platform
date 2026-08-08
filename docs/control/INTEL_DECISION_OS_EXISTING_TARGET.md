# Harbourview Decision Intelligence OS — Stage 0 Existing → Target

Status: implementation control document for `build/decision-intel-stage0-first-slice`.
Base: main `646aee613e9cf20d24535462001b0caf9b19bd4b`.

## Objective

Establish one canonical intelligence spine without creating a third ingestion/scoring estate. The first production slice is additive and limited to:

`source_registry/source_snapshots → evidence reference → assertion → event → assessment → recommendation → authenticated dossier`.

Existing `public.signals` and Pipeline B remain upstream. `/signals`, Marketplace, Clinical, Actions, the mobile shell and unrelated routes remain compatible.

## Canonical ownership decisions

| Object | Canonical owner for this slice | Existing systems retained | Decision |
| --- | --- | --- | --- |
| Source | `public.source_registry` | `ia_sources`, legacy registries | `source_registry` remains canonical acquisition identity. No new source master. |
| Evidence | `public.hv_evidence` for private evidence; `public.source_snapshots` for acquisition captures; `intel_evidence_refs` is a thin pointer/projection only | `evidence_records`, `ia_evidence_vault`, `hv_evidence_documents` | Do not duplicate raw evidence. The new ref records lineage to existing evidence/snapshot stores and carries only safe provenance metadata. |
| Jurisdiction | `public.jurisdictions` | `country_intel`, local-intel tables | `public.jurisdictions` owns geographic identity. Intelligence tables reference its `jurisdiction_id` text where available. |
| Entity | Existing durable platform/counterparty identity where available; signal entity references remain external in slice 1 | `signal_entities`, `ia_graph_entities`, `ia_counterparties` | No new entity master in slice 1. Entity unification is deferred to Stage 4 to avoid name-based duplicate identities. |
| Event | `public.intel_events` | `signals`, regulatory editorial signals | `signals` becomes upstream observation/input, not the future event object. Cluster representative or signal ID seeds deterministic event keys. |
| Assessment | `public.intel_assessments` + immutable versions | `signals.analysis`, briefings | Existing `signals.analysis` may seed an assessment but does not imply verification. |
| Recommendation | `public.intel_recommendations` | signal `recommended_action`, `ia_agent_tasks` | Recommendation is a separate decision object with `act_now`, `investigate`, `monitor`, `no_action`. |
| Watch | existing `cc_watchlist_*` | watch rules/notifications | Preserve. Future watch targets link canonical event/entity/pathway objects; no duplicate watch system now. |
| Action | existing Command/operational action system; IA tasks remain internal | `ia_agent_tasks`, `intelligence_jobs` | Do not merge operational actions, background jobs and analyst tasks. Slice 1 only exposes contextual links. |

## Authenticated intelligence exposure

Raw canonical tables are not anon-readable. Staff roles (`admin`, `operator`, `analyst`) can inspect canonical rows. Authenticated product users receive a deliberately allowlisted `intel_event_dossiers` view containing approved internal intelligence fields only. The view excludes raw snapshot text, storage paths, private evidence bodies, internal analyst notes, Marketplace private/provenance fields and service-role data.

Public `/signals` remains a separate editorial/distribution surface and is not replaced by `/dashboard/intel/events/[id]`.

## Verification semantics

Legacy `signals.reviewed=true` is an upstream surfaceability gate only. It MUST NOT map to `verified` on assertions, events, assessments or recommendations. Backfilled slice-1 records use `review_status='migrated_reviewed'` or `needs_review` and retain provenance to the upstream signal.

## Event consolidation

The first backfill groups surfaceable reviewed signals by `coalesce(cluster_rep_id,id)`. That grouping is an event candidate, not proof that the clustered sources describe a legally identical event. The event records therefore preserve `consolidation_status='candidate'` until reviewed.

## Deprecated-as-canonical concepts

- `ia_signals` — fallback/migration source only.
- `ia_graph_entities` / `ia_graph_edges` — useful legacy graph data, not canonical identity.
- `ia_evidence_vault` — legacy metadata, not canonical evidence storage.
- `signals.score` — never restored as an intelligence quality measure.
- static Weekly Signals cards — replaced by tappable event rows.

## Stage boundary

Slice 1 does not create regulatory-requirement, market-access, opportunity, PIR, hypothesis, scenario, forecast, pricing or outcome schemas. Those remain required target architecture, but depend on stable assertion/event/assessment identity.
