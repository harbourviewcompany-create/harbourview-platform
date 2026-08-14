# Talent Migration Plan

Anchors: TAL-001–TAL-088, TAL-100; CTL-006–CTL-008, CTL-015; TAC-003,008–013,020,026–032,039,045.

Semantic order:
01 security boundary; 02 taxonomy/reference; 03 identity/org/facility; 04 assertions/evidence/conflicts/audit; 05 employer/recruiter authority/entitlements; 06 requisitions/jobs/requirements/compensation; 07 ingestion/snapshots/freshness; 08 Passport/experience/capabilities; 09 credentials/work-auth/mobility/availability; 10 privacy/consent/blocks/claim/data-rights; 11 search/index/match/eligibility; 12 applications/questions/documents; 13 moderation/retention/notifications; 14 compatibility mappings/backfills; 15 API views/RPC/final RLS; 16 indexes/performance as needed.

Every legacy backfill emits reconciliation: source count, mapped, unmapped, duplicate-resolution, conflict, suppressed, error. Counts must reconcile deterministically; successful SQL execution alone is insufficient.

Required proof: fresh full migration replay, schema/RLS/grants/index snapshots, second replay where designed replay-safe, orphan check, compatibility counts and repository/live migration-ledger comparison. Production migrations are separately authorized; this document does not authorize execution.