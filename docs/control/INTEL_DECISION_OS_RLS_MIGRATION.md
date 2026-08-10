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

A later read-only production check found zero surfaceable snapshot IDs currently shared by multiple surfaceable signals. That allows the original migration and corrective migration to be applied in sequence to the current production-shaped estate, while the corrective migration still removes the invalid one-snapshot/one-signal uniqueness assumption for future valid pipeline output.

## RLS model

### Staff-controlled canonical data

The canonical base objects remain staff-controlled through existing `user_roles` authorization for `admin`, `operator`, and `analyst`. Product subscribers do not receive direct canonical base-table privileges merely because they hold an Intel/operator subscription tier.

The staff-controlled canonical objects are:

- `intel_evidence_refs`
- `intel_assertions`
- `intel_assertion_evidence`
- `intel_events`
- `intel_event_assertions`
- `intel_assessments`
- `intel_assessment_versions`
- `intel_recommendations`

Assessment versions are append-only after the corrective migration: authenticated staff may SELECT/INSERT under RLS, while UPDATE/DELETE are revoked and a database trigger rejects mutation even through a more privileged application path.

### Product Data API security boundary

The customer/product execution boundary is the pair of allowlisted `SECURITY DEFINER` RPCs in the exposed `api` schema:

- `api.get_intel_event_dossier(text)` — returns the allowlisted dossier projection for one canonical event.
- `api.resolve_intel_event_route(text)` — resolves a displayable upstream signal identifier to its canonical event identifier.

Each RPC performs its own authenticated subscription-entitlement check and permits only `intel` or `operator` tier access. Anonymous callers and free-tier callers are rejected. The functions execute with a fixed safe `search_path` and expose only their declared return columns.

The earlier security-invoker-view design is superseded by this RPC boundary. Product subscribers are not granted direct SELECT on the canonical base tables, `public.intel_event_dossiers`, or `public.intel_event_route_map`; those relations are implementation details behind the RPCs. This prevents customer queries from bypassing the allowlisted dossier projection to obtain lineage IDs, review metadata, or other staff-operational columns.

Raw evidence bodies, storage paths, private notes, Marketplace-private data, and service credentials are not projected by either RPC.

### Evidence boundary

Raw evidence remains in the pre-existing stores under their existing boundaries. `intel_evidence_refs` stores pointers plus safe source metadata; it does not copy raw evidence text, storage paths, private notes, OCR output, private Marketplace fields or service credentials.

Each migrated evidence reference stores the exact `source_signal_id`. Assertion-to-evidence linkage uses that identifier directly. Publisher/URL matching is not used as a fallback because two unrelated legacy signals can share the same publisher or a null URL and would otherwise acquire false provenance.

The corrective migration deliberately removes the foreign key from the legacy `source_signal_id` lineage field so the canonical evidence reference survives deletion of an upstream legacy signal. Canonical assertion/evidence links remain intact and the source signal ID remains as a tombstone provenance key.

## Backfill rules

Backfill source is `public.signals` only when all conditions hold:

1. `reviewed = true`
2. action is not `rejected`
3. classifier label is not `spam`, `boilerplate`, `nav`, or `duplicate`
4. content type is not `story`, `research`, or `noise`

`reviewed=true` maps to `migrated_reviewed`, never `verified`.

Candidate event identity is `event:` + `coalesce(cluster_rep_id,id)`. All cluster members attach assertions to the event. The event remains `consolidation_status='candidate'` until independently reviewed. The corrective migration adds deterministic signal-to-event routing so any displayable cluster-member signal resolves to one canonical event rather than fragmenting into a separate legacy dossier.

Displayed source counts are derived from the same eligible, displayable assertion/evidence set used by the dossier. Rejected or superseded assertions therefore cannot remain counted after their evidence is suppressed. Distinct provenance identity uses URL first, publisher second, and signal ID only as the final fallback; the count must not be described as proof of source independence.

Existing `signals.analysis` is used only where populated. Its recommended action seeds an `investigate` posture rather than `act_now` because the old analysis is not independent verification.

New events created after the backfill default to `needs_review`; `migrated_reviewed` is a legacy-backfill state only. Assertion and assessment confidence values are constrained to the probability range 0–1.

Rejected/superseded assertions and recommendations are excluded from the authenticated product dossier. Evidence relationships are retained in the projection, including `contradicts`, so contradictory evidence cannot be silently presented as ordinary support.

## Migration safety

The implementation uses two ordered additive migrations:

1. `20260808190000_decision_intel_stage0_first_slice.sql`
2. `20260808203000_decision_intel_stage0_review_fixes.sql`

They do not mutate or delete `signals`, `ia_signals`, source acquisition tables, Marketplace tables, watchlists, Actions, Clinical data or public `/signals` projections.

Production application remains intentionally separate from committing the migration files because the current production database has previously experienced resource pressure from intelligence jobs. Backfill and index cost must be observed at the deployment gate rather than silently applied while the application branch is still under review.

The repository-level database control and evidence records for PR #1309 are also recorded in `docs/control/DATABASE_CONTROL.md` and `docs/control/EVIDENCE_LOG.md`; this file does not replace those canonical control logs.

## Required deployment evidence

Before merge/deploy:

1. Both SQL migrations parse and apply in order against a production-shaped database.
2. Row counts after backfill reconcile to the surfaceability predicate.
3. No canonical evidence, assertion, event, assessment or recommendation is marked `verified` by migration.
4. Every event has at least one event-assertion link.
5. Every migrated assertion has exactly one evidence reference for its source signal.
6. Multiple signal evidence refs can reference the same source snapshot without migration failure.
7. Every assessment has exactly one event and every recommendation has exactly one assessment.
8. Assessment versions reject UPDATE and DELETE.
9. Rejected/superseded assertions and recommendations are absent from product dossiers and their evidence is excluded from displayed source counts.
10. Contradicting evidence relationships remain distinguishable in the dossier projection.
11. Anonymous and free-tier access to the two product RPCs fails.
12. Intel/operator tier can call the allowlisted dossier and route RPCs.
13. Product subscribers cannot directly read canonical base tables or bypass the RPC allowlist.
14. Raw `hv_evidence`, storage paths and private notes remain unavailable through dossier projection.
15. Existing `/signals`, Marketplace, Clinical and Actions regression checks stay green.
16. The authenticated dossier passes Playwright at 320×700, 375×812, 390×844, 430×932 and desktop.
