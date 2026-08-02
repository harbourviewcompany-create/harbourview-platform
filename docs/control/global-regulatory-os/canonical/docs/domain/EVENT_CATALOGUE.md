# Event Catalogue

## Envelope

`specversion`, `id`, `type`, `source`, `subject`, `time`, `datacontenttype`, `dataschema`, `tenant_id`, `jurisdiction_id`, `actor_id`, `correlation_id`, `causation_id`, `trace_id`, `classification`, `evidence_ids`, `data`.

## Source operations

`source.registered.v1`, `source.updated.v1`, `source.suspended.v1`, `source.rights_changed.v1`, `source.health_degraded.v1`, `source.health_restored.v1`, `acquisition.scheduled.v1`, `acquisition.started.v1`, `acquisition.completed.v1`, `acquisition.failed.v1`, `snapshot.captured.v1`, `snapshot.duplicate_detected.v1`, `snapshot.integrity_failed.v1`.

## Documents and regulatory intelligence

`document.created.v1`, `document.version_created.v1`, `document.parsed.v1`, `document.translation_created.v1`, `document.diff_created.v1`, `document.material_change_detected.v1`, `citation.anchor_created.v1`, `evidence.bundle_created.v1`, `instrument.created.v1`, `instrument.status_changed.v1`, `instrument.effective_date_changed.v1`, `provision.created.v1`, `provision.superseded.v1`, `regulatory_change.candidate_created.v1`, `regulatory_change.approved.v1`, `interpretation.requested.v1`, `interpretation.approved.v1`, `publication.released.v1`, `publication.corrected.v1`, `publication.retracted.v1`.

## Obligations and applicability

`obligation.candidate_created.v1`, `obligation.approved.v1`, `obligation.superseded.v1`, `applicability_rule.approved.v1`, `applicability.evaluation_requested.v1`, `applicability.evaluated.v1`, `applicability.review_required.v1`, `control.mapping_changed.v1`, `deadline.created.v1`, `deadline.changed.v1`.

## Entities and licences

`entity.created.v1`, `entity.merge_proposed.v1`, `entity.merge_approved.v1`, `entity.split_completed.v1`, `relationship.created.v1`, `licence.created.v1`, `licence.status_changed.v1`, `licence.scope_changed.v1`, `facility.authorization_changed.v1`, `certification.expiring.v1`, `enforcement.record_created.v1`, `recall.created.v1`, `counterparty.risk_changed.v1`.

## Corridors and transactions

`corridor.created.v1`, `corridor.version_created.v1`, `corridor.evaluation_requested.v1`, `corridor.gate_evaluated.v1`, `corridor.determination_changed.v1`, `market_entry.project_created.v1`, `permit.status_changed.v1`, `shipment.readiness_changed.v1`, `shipment.milestone_recorded.v1`, `deal_room.condition_changed.v1`, `transaction.readiness_changed.v1`.

## Markets, alerts and governance

`metric.definition_created.v1`, `metric.definition_changed.v1`, `observation.ingested.v1`, `observation.revised.v1`, `metric.reconciliation_failed.v1`, `estimate.approved.v1`, `forecast.published.v1`, `commercial_signal.detected.v1`, `watchlist.created.v1`, `alert.rule_created.v1`, `alert.triggered.v1`, `alert.suppressed.v1`, `alert.delivered.v1`, `alert.acknowledged.v1`, `task.created.v1`, `task.assigned.v1`, `task.completed.v1`, `evidence.requested.v1`, `evidence.accepted.v1`, `approval.requested.v1`, `approval.decided.v1`, `model.registered.v1`, `model.approved.v1`, `model.suspended.v1`, `prompt.version_created.v1`, `model.run_completed.v1`, `model.output_rejected.v1`, `evaluation.completed.v1`, `human.override_recorded.v1`, `data_quality.rule_failed.v1`, `security.incident_created.v1`.

## Delivery semantics

At-least-once delivery; consumers idempotent by event ID; ordering guaranteed only within an aggregate partition; sensitive payloads carry references instead of unrestricted data; breaking changes require a new event version.
