# Talent Retention and Data Rights

Anchors: TAL-054–058, TAL-075, TAL-085, TAL-087, TAL-100; CTL-008, CTL-020, CTL-022; TAC-020,047,048.

Sensitive Talent data resolves to a retention class and policy. Candidate rights include access/export, correction, suppression, erasure and processing restriction subject to valid retention/legal-hold requirements.

Automated retention actions are idempotent, auditable and legal-hold aware. Erasure does not corrupt immutable security/audit history: compatible records use pseudonymized/tombstoned subject references while preserving event integrity.

Backups/restores must preserve canonical identity mappings, applications, documents, disclosure grants and audit consistency. DR validation requires restore drill evidence under CTL-022; existence of a backup alone is not proof.

Derivative data (embeddings, match explanations, analytics, cached DTOs) inherits deletion/suppression obligations where the source privacy contract requires it.