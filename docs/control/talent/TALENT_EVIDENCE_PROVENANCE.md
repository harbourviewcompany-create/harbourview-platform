# Talent Evidence and Provenance

Anchors: TAL-012–015, TAL-041–045, TAL-085, TAL-093; TAC-005,014,024,047.

Material facts are typed temporal assertions, not unqualified booleans. Each assertion can record subject, predicate/field, typed value, claim/source class, valid/effective period, observed/verified timestamps, taxonomy version, visibility class and evidence quality/confidence where meaningful.

Evidence items preserve source identity, retrieval/observation time, content hash/storage reference and classification. `talent_assertion_evidence` marks support or contradiction. Conflicts preserve both sides until resolved; no last-write-wins erasure.

Verification states are dimension-specific: candidate-claimed, employer-confirmed, authority-confirmed, Harbourview-reviewed, source-observed, unable-to-verify, conflicted, expired/revoked/restricted where applicable.

Derived data—search documents, embeddings, match explanations, aggregate signals—must inherit the strictest relevant privacy classification and provenance lineage (CTL-020). Public DTOs expose only allowlisted summaries, never raw evidence URLs or internal notes.