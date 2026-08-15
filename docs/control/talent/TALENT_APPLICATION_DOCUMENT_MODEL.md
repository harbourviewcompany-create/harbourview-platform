# Talent Application and Document Model

Anchors: TAL-071–078, TAL-081, TAL-087–088, TAL-097–099; CTL-014,015,020; TAC-026–029,044,047.

Canonical application lifecycle: `draft`, `submitted`, `screening`, `interview`, `offer`, `hired`, plus `rejected`, `withdrawn`, `closed`. Status history is append-only. Legacy rows with only current stage are migrated truthfully; unavailable historical transitions are not synthesized.

Application creation validates canonical/open/publishable job state, typed question set/version, candidate identity snapshot, consent and deterministic duplicate/reapply policy. Concurrent close/apply and duplicate submissions require transactional/idempotent handling.

Documents use private storage, validated type/size, scanner integration point, owner/application/workspace scope, signed short-lived access and access audit. Permanent public resume URLs are not canonical storage.

Employer-private notes/assessments and candidate-visible application state use separate DTOs. Contact/export/document actions re-evaluate disclosure/authority at execution time.