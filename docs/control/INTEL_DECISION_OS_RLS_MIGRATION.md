# Decision Intelligence Stage 0 — RLS, backfill and verification

## Production evidence captured before implementation

Read-only production queries on project `zvxdgdkukjrrwamdpqrg` established the existing estate before any DDL:

- `signals`: 12,581 rows
- `ia_signals`: 641
- `source_registry`: 1,736
- `source_snapshots`: 15,841
- `source_documents`: 0
- `source_chunks`: 0
- `signal_candidates`: 0
- `signal_entities`: 2,895
- `ia_graph_entities`: 1,712
- `ia_graph_edges`: 197
- `ia_counterparties`: 77
- `country_intel`: 284
- `local_subdivisions_intel`: 124
- `market_metrics`: 154
- `cc_watchlist_items`: 6
- `cc_watch_rules`: 2
- `intelligence_jobs`: 313

The exact slice-1 surfaceability predicate currently yields:

- 3,143 reviewed/surfaceable upstream signals
- 2,839 distinct cluster-aware event candidates
- 16 signals with direct `snapshot_id` lineage
- 426 signals with existing `analysis`
- 426 with `analysis.what_changed`
- 426 with `analysis.recommended_action`
- 3,103 with Pipeline B `quality_confidence`

These are planning/backfill counts only. They are not evidence that the migration has been applied.

Production schema reconciliation also verified that `signals.id` and `signals.cluster_rep_id` are `text`, `signals.snapshot_id`, `source_snapshots.id`, `source_registry.id`, and `hv_evidence.id` are `uuid`, and `jurisdictions.jurisdiction_id` is `text`. The first-slice foreign keys therefore match the live schema.

## RLS model

### Staff-controlled canonical data

The following canonical base objects are writable only to existing platform staff roles (`admin`, `operator`, `analyst`) through `user_roles`:

- `intel_evidence_refs`
- `intel_assertions`
- `intel_assertion_evidence`
- `intel_events`
- `intel_event_assertions`
- `intel_assessments`
- `intel_assessment_versions`
- `intel_recommendations`

The derived objects required to render an approved dossier also have narrowly scoped SELECT policies for authenticated `user_profiles.tier IN ('intel','operator')`. The migration explicitly grants authenticated SELECT on those RLS-protected relations because production default privileges for tables created by `postgres` do not grant authenticated access automatically.

### Data API exposure

Production PostgREST exposes the `api` schema, not `public`. The canonical tables remain physically in `public` and are not projected wholesale into `api`.

The only Stage-0 Data API projection is:

- `api.intel_event_dossiers` → security-invoker projection of `public.intel_event_dossiers`

Both views rely on the underlying RLS policies. `anon` is explicitly revoked. Raw evidence bodies are not projected.

### Evidence boundary

Raw evidence remains in the pre-existing stores under their existing boundaries. `intel_evidence_refs` stores pointers plus safe source metadata; it does not copy raw evidence text, storage paths, private notes, OCR output, private Marketplace fields or service credentials.

Each migrated evidence reference now stores the exact `source_signal_id`. Assertion-to-evidence linkage uses that identifier directly. Publisher/URL matching is not used as a fallback because two unrelated legacy signals can share the same publisher or a null URL and would otherwise acquire false provenance.

## Backfill rules

Backfill source is `public.signals` only when all conditions hold:

1. `reviewed = true`
2. action is not `rejected`
3. classifier label is not `spam`, `boilerplate`, `nav`, or `duplicate`
4. content type is not `story`, `research`, or `noise`

`reviewed=true` maps to `migrated_reviewed`, never `verified`.

Candidate event identity is `event:` + `coalesce(cluster_rep_id,id)`. All cluster members attach assertions to the event. The event remains `consolidation_status='candidate'` until independently reviewed.

`source_count` counts distinct source references using URL first, publisher second, and signal ID only as the final fallback. It is not a raw cluster-row count and must not be described as proof of source independence.

Existing `signals.analysis` is used only where populated. Its recommended action seeds an `investigate` posture rather than `act_now` because the old analysis is not independent verification.

## Migration safety

The migration is additive. It does not mutate or delete `signals`, `ia_signals`, source acquisition tables, Marketplace tables, watchlists, Actions, Clinical data or public `/signals` projections.

Production application of the migration is intentionally separate from committing the migration file because the current production database has previously experienced resource pressure from intelligence jobs. Backfill and index cost must be observed at the deployment gate rather than silently applied while the application branch is still under review.

## Required deployment evidence

Before merge/deploy:

1. SQL migration parses and applies against a production-shaped database.
2. Row counts after backfill reconcile to the surfaceability predicate.
3. No canonical evidence, assertion, event, assessment or recommendation is marked `verified` by migration.
4. Every event has at least one event-assertion link.
5. Every migrated assertion has exactly one evidence reference for its source signal.
6. Every assessment has exactly one event.
7. Every recommendation has exactly one assessment.
8. Anonymous access to `api.intel_event_dossiers` fails.
9. Intel/operator tier can read allowlisted dossier rows through the exposed `api` schema.
10. Raw `hv_evidence`, storage paths and private notes remain unavailable through dossier projection.
11. Existing `/signals`, Marketplace, Clinical and Actions regression checks stay green.
