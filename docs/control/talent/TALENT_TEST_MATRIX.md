# Talent Test Matrix

Anchors: TAL-001–TAL-100; CTL-014–CTL-018, CTL-024; TAC-001–TAC-050.

Required layers: migration replay/schema/RLS; unit; API/integration; negative/leakage; concurrency/race; idempotency/retry; search evaluation; performance/SLO; accessibility/E2E; compatibility/shadow; restore/operations; independent final verification.

Mandatory race cases include: two users claim one imported profile; concurrent person/job/org resolution; job closes while apply commits; duplicate applications; block/consent revoked while recruiter action executes; credential state changes during match; two recruiters mutate same application; retrying ingestion/backfill/notification/document upload.

Cache/pagination tests cover cross-employer cache isolation, immediate privacy query enforcement, deterministic cursor order under concurrent inserts/updates and no duplicate/missing pages.

Authentication-assurance combinations: verified account+unverified employer; verified employer+unauthorized user; authorized recruiter+expired agency mandate; claimed profile+unverified credential; verified credential+unverified identity.

Independent verifier must rerun tests from exact verification SHA and inspect real implementation paths, not only mocks.