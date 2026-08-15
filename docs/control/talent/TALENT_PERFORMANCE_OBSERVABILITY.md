# Talent Performance and Observability

Anchors: TAL-038, TAL-091–092; CTL-011, CTL-012, CTL-015, CTL-016; TAC-034,041,047.

Measure and release-record: DB execution, search API p50/p95, candidate authorization overhead, semantic overhead, payload size, queries/search, index refresh latency, privacy-change propagation latency, application success/error rate, LCP/INP/CLS and background job reliability.

Initial SLOs are established from representative P0 load tests before production GO and then frozen as accepted budgets. Error budget consumption and critical SLO breach are release/incident signals, not hidden logs.

Capacity/cost telemetry tracks job/source-snapshot/profile/embedding/application/document cardinality, searches/day, provider calls/day, storage growth and background work. Capacity planning must cover representative scale, not fixtures only.

Structured events must avoid raw email/phone/resume/application text/credential IDs. Private responses use authorization-aware cache keys or no shared cache. Visibility/block changes are enforced query-time and trigger cache/index invalidation.