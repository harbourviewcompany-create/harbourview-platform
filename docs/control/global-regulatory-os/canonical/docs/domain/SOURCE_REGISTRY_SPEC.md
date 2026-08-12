# Source Registry Specification

The source registry is the only authority permitted to authorize external acquisition.

## Required record groups

1. Identity: source key, name, authority, jurisdiction, source class, official status and canonical URI.
2. Rights: collection, storage, transformation, redistribution, attribution, restricted fields, terms URI and review date.
3. Access: method, endpoints, HTTP method, allowed hosts, content types, authentication reference and rate limits.
4. Operations: schedule, freshness SLA, criticality, owner, parser, fallback source and escalation.
5. Coverage: topics, legal authority, date range, languages, known omissions and historical depth.
6. Quality: identifier stability, expected publication pattern, representative fixtures and source-health score.
7. Lifecycle: draft, review, approval, suspension, termination and archival.

## Invariants

- A source cannot be scheduled until rights and endpoint security are approved.
- Credentials are references to a secret manager, never values.
- Redirects and discovered links remain subject to host policy.
- Secondary sources are leads unless the claim is explicitly an attributed interpretation.
- Source limitations are user-visible through the coverage registry.
- Termination triggers acquisition shutdown, rights-based retention handling and derived-output review.

Machine contract: `schemas/json/source-registry.schema.json`.  
Canonical tables: `source_ops.sources`, `source_ops.source_endpoints`, `source_ops.acquisition_runs`, `source_ops.source_health`.

## Rights enforcement minimum

Every source record must explicitly state collection basis, storage, transformation, redistribution, retention, termination action, licence reference and territorial scope. Unknown redistribution or retention rights force HOLD and prohibit public publication.

