# Talent Identity Resolution

Anchors: TAL-001–008, TAL-035, TAL-045; CTL-014, CTL-015; TAC-002,003,036,044.

Person, job and organization resolution is candidate-based and reversible. Inputs may include stable provider IDs, verified account/contact evidence, canonical organization, normalized names, explicit profile claims, source URLs, posting dates, descriptions and relationship evidence. Email/name similarity alone is never global proof.

Resolution outcomes: `confirmed_same`, `probable_same`, `unresolved`, `confirmed_distinct`.

Every merge/link event stores actor, rule/algorithm version, evidence, source entities, target, timestamp and before-state mappings. Source rows are not deleted. Reversal restores prior mappings exactly.

Concurrency controls must prevent double-claim, conflicting concurrent merges and double canonicalization. Identity operations require idempotency keys or deterministic conflict handling (`CTL-014/015`).

Human overrides use reason codes and append audit events; see CTL-021 and TAL-085.