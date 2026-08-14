# Talent Open Decisions

Control: CTL-005. Open items are not silently resolved by implementation.

Current decision classes requiring evidence at runtime head if encountered:
- TOD-001 — whether an existing canonical facility/site entity already satisfies TAL-008; reuse it if verified rather than create duplicate truth.
- TOD-002 — exact provider/source rights for each external job source before enabling public/commercial ingestion (TAL-032/033).
- TOD-003 — exact current production ownership semantics for legacy `job_search.applications/resume_versions/contacts/outreach_messages` before any migration (TAL-071/075/082).
- TOD-004 — authoritative credential registries/adapters to enable by jurisdiction; P0 may preserve adapter contract without unsupported live verification (TAL-042–044).
- TOD-005 — concrete entitlement-to-commercial-plan mapping; P0 freezes capability keys but not speculative pricing (TAL-022/076/077).
- TOD-006 — production data residency requirements per jurisdiction/data class before region-routing behavior is activated (TAL-058).

Each item must become `RESOLVED` with evidence/TDEC link or remain explicitly deferred without weakening its P0 foundation.