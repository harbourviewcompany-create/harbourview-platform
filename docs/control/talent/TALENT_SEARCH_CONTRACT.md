# Talent Search Contract

Anchors: TAL-038, TAL-059–064, TAL-091–093; CTL-016–018; TAC-021–023,041,042,047.

Find Jobs and Find Talent share infrastructure but not authorization assumptions. Search state is URL-addressable and cursor-paginated; clients do not download the universe.

Find Talent mandatory order: authenticate → employer/recruiter authority → entitlement → profile visibility → employer/affiliate blocks → disclosure/search eligibility → authorized candidate universe → structured/lexical/semantic retrieval → ranking → allowlisted DTO.

Semantic retrieval must operate on authorization-safe projections; never global candidate vector search followed by post-filtering. Embeddings store source entity, projection/model/taxonomy version and privacy scope. Derivatives inherit source classification.

Search caches are authorization-aware and must never share private candidate payloads between employers. Privacy/block changes are enforced query-time and invalidate cache/index projections.

Cursor ordering must be deterministic and stable under concurrent inserts/updates. API versioning/deprecation rules are defined in TALENT_API_DTO_CONTRACT.md.