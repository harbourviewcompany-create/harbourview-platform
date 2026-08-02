# Test Strategy

## Test pyramid

1. Schema, enum and static contract tests.
2. Unit tests for parsers, normalization, DSL, scoring and authorization.
3. Property-based tests for dates, quantities, jurisdiction trees and rule expressions.
4. Contract tests for APIs, events, connectors and data feeds.
5. Integration tests with PostgreSQL, object storage, search, event fabric and workflow engine.
6. End-to-end role, analyst, publication, obligation and corridor workflows.
7. Security, privacy, leakage, resilience, performance and recovery tests.
8. Human-reviewed domain benchmark evaluations.

## Mandatory suites

| Suite | Required proof |
|---|---|
| Migration | Fresh database and upgrade-path execution; rollback/roll-forward notes |
| RLS/authorization | Every role × resource × action × classification × tenant combination |
| Public leakage | Forbidden private fields absent from HTML, APIs, bundles, logs and search indexes |
| Evidence lineage | Published claim reconstructs exact source snapshot and passage |
| Snapshot integrity | Hash mismatch blocks processing and publication |
| Acquisition | Idempotency, rate limit, retry, lock, dead letter, rights block and SSRF rejection |
| Document processing | PDF, HTML, XML, JSON, scan, tables, language and malformed input fixtures |
| Diff | Insert, delete, move, effective-date change and metadata-only cases |
| AI evaluation | Citation entailment, unsupported claims, injection, translation and jurisdiction benchmarks |
| Obligation | Subject/action/object/condition/deadline/evidence completeness and supersession |
| Applicability | Truth table, missing inputs, conflicts, historical dates and explanation trace |
| Entity resolution | Precision benchmark, reversible merge/split and evidence requirements |
| Licence | Status history, scope, facility, expiry and duplicate identifiers |
| Corridor | All mandatory gates, transit, expiry, product change, quantity change and specialist review |
| Market data | Reconciliation, units, currencies, actual/estimate/forecast labels and revision lineage |
| Alerts | Deduplication, materiality, routing, acknowledgement, correction and quiet hours |
| API/event | OpenAPI/AsyncAPI validation, compatibility, idempotency, signing and rate limits |
| Performance | Search, dashboards, bulk exports, acquisition throughput and alert latency |
| Resilience | Dependency failures, replay, backup restoration and regional failover |
| Accessibility | WCAG 2.2 AA automated and manual keyboard/screen-reader checks |

## Release-blocking thresholds

- Zero known cross-tenant reads or writes.
- Zero private fields in public projection probes.
- Zero published claims without evidence.
- Zero critical unsupported AI claims in benchmark.
- At least 98% recall and 95% precision on approved material-change benchmark.
- At least 99% precision for high-confidence automatic entity merges.
- One hundred percent mandatory-gate completeness for reviewed corridors.
- All market reconciliation exceptions resolved or explicitly published with explanation.
- No unresolved critical/high penetration-test findings.

## Fixture strategy

Fixtures must cover regulatory archetypes, not just countries:

- Federal/state adult-use and medical system.
- Unitary medical system.
- Supranational pharmaceutical system.
- Controlled import/export-only system.
- Hemp/cannabinoid system.
- Prohibition system.
- Multilingual gazette.
- Scanned PDF and table-heavy register.
- Conflicting official sources.
- Retroactive effective date.
- Licence suspension and reinstatement.
- Product reclassification and transit-country restriction.

## Evidence output

Every CI/release run writes:

- `evidence/test-results/`
- `evidence/contracts/`
- `evidence/security/`
- `evidence/data-quality/`
- `evidence/ai-evaluations/`
- `evidence/screenshots/`
- `evidence/coverage/`
- `evidence/GO_HOLD_REPORT.md`

Evidence must include commit, artifact digest, environment, command, exit code, timestamps and responsible reviewer.
