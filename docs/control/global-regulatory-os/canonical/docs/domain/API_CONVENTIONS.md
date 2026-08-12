# API Conventions

- Base path `/v1`.
- JSON uses snake_case.
- UUID identifiers; RFC 3339 UTC timestamps; ISO calendar dates.
- Opaque cursor pagination.
- `request_id` on every response.
- Idempotency keys on writes.
- ETags or explicit version for optimistic concurrency.
- Evidence links exposed only after authorization.
- Resource-not-found responses do not disclose hidden record existence.

## Error contract

```json
{
  "error": {
    "code": "insufficient_evidence",
    "message": "The determination cannot be published because required evidence is missing.",
    "request_id": "00000000-0000-0000-0000-000000000000",
    "details": [],
    "retryable": false
  }
}
```

## Resource groups

Jurisdictions, authorities, coverage, sources, snapshots, documents, instruments, provisions, changes, interpretations, obligations, applicability rules/evaluations, entities, people, facilities, licences, certifications, enforcement, counterparties, products, corridors, market-entry projects, metrics, observations, forecasts, watchlists, alerts, tasks, evidence requests, reports, corrections, models, evaluations and audit events.

## Authorization declaration

Every endpoint declares authentication, required action, resource scope, tenant behavior, entitlement, data classification, evidence-download rights and specialist authority.

Large exports, source replay, bulk evaluations, reports and corridor analyses use operation resources with progress, cancellation and evidence semantics.
