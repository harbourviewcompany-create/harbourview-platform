# Talent Traceability Matrix

Hardening control: CTL-001. Scope: TAL-001–TAL-100; acceptance: TAC-001–TAC-050.

A capability cannot become `VERIFIED` unless every required cell is populated and an independent verification SHA is recorded. This implementation pass deliberately records no `VERIFIED` status.

## Exact implementation bundles

- `B1-ID`: `supabase/migrations/20260815162000_talent_p0_taxonomy_identity_evidence.sql`.
- `B2-EMPLOYER-JOBS`: `supabase/migrations/20260815163000_talent_p0_employer_jobs_ingestion.sql`.
- `B3-PASSPORT-PRIVACY`: `supabase/migrations/20260815164000_talent_p0_passport_privacy.sql`.
- `B4-SEARCH-APP`: `supabase/migrations/20260815165000_talent_p0_search_match_application.sql`; `supabase/migrations/20260815170000_talent_p0_api_backfill_rls.sql`; `lib/talent/contracts.ts`; `lib/talent/application.ts`; `app/api/talent/**`.
- `B5-JOBSEARCH-BOUNDARY`: `supabase/migrations/20260815161000_talent_p0_job_search_security_boundary.sql`.
- `B6-MATCH`: `supabase/migrations/20260815174000_talent_p0_match_engine.sql`; `app/api/talent/match/route.ts`.
- `B7-OPS`: `supabase/migrations/20260815175000_talent_p0_operational_safety.sql`; `lib/talent/features.ts`.
- `B8-INGEST`: `supabase/migrations/20260815176000_talent_p0_governed_ingestion.sql`; `supabase/functions/talent-job-ingest/index.ts`.
- `B9-UI`: `app/talent/**`; `components/dashboard/mobile-command/sections/TalentSection.tsx`; `components/dashboard/mobile-command/sections/TalentSection.module.css`; `components/dashboard/mobile-command/Sections.tsx`; `components/dashboard/data/jobsBoard.ts`.
- `B10-COMPAT`: legacy `public.talent_jobs`, `public.talent_candidates`, `public.hv_professionals`, `job_search.*` mappings/backfills defined by B2/B3/B4/B5; no legacy destructive rewrite.

## Test/evidence bundles

- `T1`: `tests/talent/talentP0SchemaContracts.test.ts`.
- `T2`: `tests/talent/jobSearchSecurityBoundary.test.ts`.
- `T3`: `tests/talent/privacyCutover.test.ts`.
- `T4`: `tests/talent/searchQuality.test.ts`.
- `T5`: `tests/talent/matchGovernance.test.ts`.
- `T6`: `tests/talent/operationalSafety.test.ts`.
- `E1`: `docs/control/talent/TALENT_IMPLEMENTATION_EVIDENCE.md`.
- `E2`: `docs/control/talent/TALENT_CHANGE_RECORDS.md` / TCHG-001.

Implementation SHAs referenced below: `69fb9529182c836d9278a6fb08a443ffd69f9959` (canonical data/authority foundations), `2c5dafe8419b93810b2abcf9b1562d8d73be4632` (canonical APIs/Command discovery), `b99b22669856f854e7a9cd642eb0f23616c58d9c` (match/document/search-quality safety), `8e60ebe9ed127eea3aadbab51f07763f02b1a504` (governed ingestion/runtime gates). Final current-main reconciliation is recorded separately in E1 and does not turn any row VERIFIED.

| TAL | Status | Files/migrations | API/RPC | DTO/view | RLS/auth contract | Tests | Evidence | Implementation SHA | Verification SHA |
|---|---|---|---|---|---|---|---|---|---|
| TAL-001 | IMPLEMENTED_UNVERIFIED | B1-ID | identity internal | canonical person | owner/private | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-002 | IMPLEMENTED_UNVERIFIED | B1-ID | account claim/link | owner identity | authenticated owner | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-003 | IMPLEMENTED_UNVERIFIED | B1-ID | alias internal | alias history | restricted | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-004 | IMPLEMENTED_UNVERIFIED | B1-ID,B10-COMPAT | claim foundation | imported/unclaimed | no fake ownership | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-005 | IMPLEMENTED_UNVERIFIED | B1-ID | merge/reverse internal | identity events | staff/service scoped | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-006 | IMPLEMENTED_UNVERIFIED | B1-ID,B2-EMPLOYER-JOBS | org resolution internal | workspace/source link | canonical workspace; Talent authority separate | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-007 | IMPLEMENTED_UNVERIFIED | B1-ID | org relation internal | relationship projection | business-sensitive | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-008 | IMPLEMENTED_UNVERIFIED | B1-ID,B3-PASSPORT-PRIVACY | facility references | safe facility refs | mixed/restricted | T1 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-009 | IMPLEMENTED_UNVERIFIED | B1-ID | taxonomy internal | versioned terms | reference-safe | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-010 | IMPLEMENTED_UNVERIFIED | B1-ID | taxonomy governance | active/superseded terms | governed internal | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-011 | IMPLEMENTED_UNVERIFIED | B1-ID | reference internal | versioned reference | reference-safe | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-012 | IMPLEMENTED_UNVERIFIED | B1-ID | assertion internal | temporal assertion | classified | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-013 | IMPLEMENTED_UNVERIFIED | B1-ID | evidence internal | evidence links | highly restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-014 | IMPLEMENTED_UNVERIFIED | B1-ID | conflict internal | conflict state | restricted | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-015 | IMPLEMENTED_UNVERIFIED | B1-ID | temporal semantics | safe dates | mixed | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-016 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | employer profile | employer DTO | active workspace scoped | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-017 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | verification internal | verification summary | evidence-backed; no authority implication | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-018 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | domain verify foundation | domain status | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-019 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | team resolver | team role | Talent least privilege | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-020 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | recruiter resolver | authority status | active authority required | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-021 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | agency resolver | mandate scope | active scoped mandate | T1,T3 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-022 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B7-OPS | entitlement resolver | capability decision | server-side only | T1,T3,T6 | E1,E2 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-023 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | requisition foundation | private requisition | workspace/Talent authority | T1 | E1,E2 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-024 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | openings fields | safe opening count | publishable subset | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-025 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B4-SEARCH-APP,B9-UI | GET jobs/search | TalentJobDTO | public-safe canonical job | T1,T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-026 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | job version internal | current/history | mixed | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-027 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B6-MATCH | requirement version | requirement DTO | publishable subset | T1,T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-028 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | compensation projection | normalized+original | public-sensitive | T1,T4 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-029 | IMPLEMENTED_UNVERIFIED | B1-ID,B2-EMPLOYER-JOBS | location refs | location DTO | public/reference | T1,T4 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-030 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B4-SEARCH-APP | job search | workplace fields | public-safe | T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-031 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B9-UI | job detail/apply routing | application method | public-safe | T1,T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-032 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B8-INGEST | ingest internal | source registry | service-only | T1,T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-033 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B8-INGEST | source-right gate | rights decision | fail-closed service-only | T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-034 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B8-INGEST | ingest internal | immutable snapshot | private | T1,T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-035 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | resolution internal | job identity links | internal/reversible | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-036 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B8-INGEST | freshness internal | freshness DTO | public-safe subset | T1,T4,T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-037 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS | change internal | safe change state | mixed | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-038 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B7-OPS | projection state | internal generation | restricted | T4,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-039 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B10-COMPAT | Passport services | safe Passport DTO | owner/search scoped | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-040 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | experience internal | disclosed experience | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-041 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | capability projection | candidate-safe capability | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-042 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | authority lookup | credential authority | reference | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-043 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B6-MATCH | credential lifecycle | credential summary | highly restricted detail | T1,T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-044 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | verification-event foundation | normalized verification | restricted | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-045 | IMPLEMENTED_UNVERIFIED | B1-ID,B3-PASSPORT-PRIVACY | assurance state | assurance summary | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-046 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | language projection | proficiency data | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-047 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | availability projection | safe availability | restricted/stale-aware | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-048 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B6-MATCH | work-right projection | limited eligibility input | highly restricted | T1,T3,T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-049 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | mobility projection | candidate-safe mobility | restricted | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-050 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | disclosure grant only | contact excluded from search | highly restricted | T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-051 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | visibility policy | visibility mode | query-time exclusion | T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-052 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B7-OPS | disclosure policy | level summary | current grant required | T3,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-053 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B4-SEARCH-APP | people search | anti-enumerating projection | employer/affiliate block before retrieval | T3,T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-054 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY | consent policy | consent state | purpose/version scoped | T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-055 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B7-OPS | DSR foundation | request state | owner/restricted | T3,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-056 | IMPLEMENTED_UNVERIFIED | B7-OPS | hold foundation | hold state | restricted staff/service | T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-057 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B7-OPS | server policy | classification metadata | secret/sensitive excluded | T3,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-058 | IMPLEMENTED_UNVERIFIED | B7-OPS | internal classification | residency class | restricted | T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-059 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B9-UI | GET /api/talent/jobs/search | TalentJobSearchResponse | public-safe server search | T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-060 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B9-UI | POST /api/talent/people/search | TalentPeopleSearchResponse | auth+active workspace+Talent authority+block prefilter | T3,T4 | E1,E2 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-061 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | search APIs | lexical projection | inherited authorization | T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-062 | FOUNDATION_REQUIRED | B4-SEARCH-APP,B7-OPS | semantic safe-off | derivative metadata only | no global unauthorized corpus | T3,T4,T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-063 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | people search | privacy-aware result | anti-enumeration | T3,T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-064 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | test only | frozen corpus | synthetic | T4 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-065 | IMPLEMENTED_UNVERIFIED | B6-MATCH | match RPC/API | policy-versioned match | permissioned | T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-066 | IMPLEMENTED_UNVERIFIED | B6-MATCH | eligibility engine | satisfied/not/unresolved/NA | restricted | T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-067 | IMPLEMENTED_UNVERIFIED | B6-MATCH | match API | factor explanation | evidence-backed restricted | T5 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-068 | IMPLEMENTED_UNVERIFIED | B6-MATCH,B7-OPS | invalidation internal | stale match state | privacy/rule/job/profile invalidation | T5,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-069 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | save/delete job | owner save | authenticated owner | T1,T3 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-070 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | P1 activation foundation | saved query | owner private | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-071 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | application/apply APIs | canonical application | owner/employer scoped | T3,T6 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-072 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | apply idempotency | duplicate policy | server enforced | T6 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-073 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | application events | immutable status history | actor scoped | T1,T6 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-074 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP | apply/detail foundation | versioned question | classification-aware | T1,T6 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-075 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B7-OPS | documents API | private document grant | signed access + audit | T3,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-076 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B7-OPS | export entitlement foundation | entitled projection | authority+grant required | T3,T6 | E1,E2 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-077 | IMPLEMENTED_UNVERIFIED | B2-EMPLOYER-JOBS,B7-OPS | bulk entitlement foundation | internal | separate capability/rate control | T6 | E1,E2 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-078 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B7-OPS | send-time policy foundation | current authorization decision | rechecks authority/grant/block/consent | T3,T6 | E1,E2 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-079 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B9-UI,B10-COMPAT | /talent canonical read | canonical job ID | public-safe | T3,T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-080 | IMPLEMENTED_UNVERIFIED | B3-PASSPORT-PRIVACY,B10-COMPAT | compatibility projection | safe Passport/public-professional | public-safe | T1,T3 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-081 | IMPLEMENTED_UNVERIFIED | B4-SEARCH-APP,B10-COMPAT | /api/talent/apply | canonical application adapter | anti-bot + restricted write | T3,T6 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-082 | IMPLEMENTED_UNVERIFIED | B5-JOBSEARCH-BOUNDARY | no generalized client contract | none | anon/auth direct reads revoked; service compatibility retained | T2,T3 | E1 | 00d4bfb2457429673c3dcfb93b1317a7f5abf6f8 | independent verification pending |
| TAL-083 | IMPLEMENTED_UNVERIFIED | B9-UI | Command URL context | Command Talent DTO | user context preserved; people mode authority gated | T3,T4 | E1,E2 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-084 | IMPLEMENTED_UNVERIFIED | B9-UI | canonical Talent APIs | none from fixture | production fixture eliminated | T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-085 | IMPLEMENTED_UNVERIFIED | B1-ID,B7-OPS | audit internal | append-only audit | restricted | T1,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-086 | IMPLEMENTED_UNVERIFIED | B7-OPS | moderation foundation | case/action state | restricted | T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-087 | IMPLEMENTED_UNVERIFIED | B7-OPS | retention internal | retention/tombstone state | legal-hold aware | T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-088 | IMPLEMENTED_UNVERIFIED | B7-OPS | notification foundation | prefs/events | consent/private | T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-089 | IMPLEMENTED_UNVERIFIED | B1-ID,B2-EMPLOYER-JOBS | locale/time semantics | original+normalized fields | mixed | T1 | E1 | 69fb9529182c836d9278a6fb08a443ffd69f9959 | independent verification pending |
| TAL-090 | IMPLEMENTED_UNVERIFIED | B9-UI | UI contract | accessible semantic states | n/a | T4 | E1 | 2c5dafe8419b93810b2abcf9b1562d8d73be4632 | independent verification pending |
| TAL-091 | IN_PROGRESS | B4-SEARCH-APP,B7-OPS | search/application telemetry | latency/error telemetry | PII-minimized | T4,T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent SLO/performance evidence pending |
| TAL-092 | IMPLEMENTED_UNVERIFIED | B7-OPS | internal telemetry | structured Talent events | PII-minimized | T6 | E1 | 8e60ebe9ed127eea3aadbab51f07763f02b1a504 | independent verification pending |
| TAL-093 | IMPLEMENTED_UNVERIFIED | B7-OPS | analytics foundation | aggregate-safe metadata | derivative classification | T3,T6 | E1 | b99b22669856f854e7a9cd642eb0f23616c58d9c | independent verification pending |
| TAL-094 | DEFERRED_P2 | frozen P2 foundation retained | P2 | P2 | aggregate-sensitive controls preserved | pending P2 | E1 | N/A: phase-deferred P2 | independent verification pending |
| TAL-095 | DEFERRED_P2 | frozen P2 foundation retained | P2 | P2 | safe/reference dependency preserved | pending P2 | E1 | N/A: phase-deferred P2 | independent verification pending |
| TAL-096 | DEFERRED_P2 | frozen P2 foundation retained | P2 | P2 | mixed graph privacy boundaries preserved | pending P2 | E1 | N/A: phase-deferred P2 | independent verification pending |
| TAL-097 | DEFERRED_P1 | B2-EMPLOYER-JOBS foundation | P1 employer APIs | requisition/application foundation | employer authority preserved | pending P1 | E1,E2 | N/A: phase-deferred P1 | independent verification pending |
| TAL-098 | DEFERRED_P1 | B3-PASSPORT-PRIVACY,B7-OPS foundation | P1 messaging | send-time auth foundation | highly restricted | pending P1 | E1,E2 | N/A: phase-deferred P1 | independent verification pending |
| TAL-099 | DEFERRED_P1 | B2-EMPLOYER-JOBS,B4-SEARCH-APP foundation | P1 workflow | application/hiring authority foundation | highly restricted | pending P1 | E1,E2 | N/A: phase-deferred P1 | independent verification pending |
| TAL-100 | FOUNDATION_REQUIRED | frozen cutover/operations controls + B5/B10 compatibility | operational | compatibility maps | no retirement without independent gate | restore/retirement evidence pending | E1,E2 | N/A: recovery/retirement foundation incomplete | independent verification pending |

## Implementation-pass disposition

Rows marked `IMPLEMENTED_UNVERIFIED` are implementation claims only. `FOUNDATION_REQUIRED`, `IN_PROGRESS`, `DEFERRED_P1` and `DEFERRED_P2` remain non-verified. No row is `VERIFIED`; the independent verifier must run the frozen verification contract against an immutable reconciled SHA and record a distinct verification SHA.