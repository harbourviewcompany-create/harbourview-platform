# Talent Scope Ledger — CONTROLLING

Audited base: `04e306d520d69d746a5099bf778dc253296710a3`.

This file is the controlling Talent scope. Supporting documents elaborate these rows; they cannot narrow them. `TAL-001`–`TAL-084` preserve the previously approved capability scope. `TAL-085`–`TAL-100` mechanically represent cross-cutting capabilities already approved in the architecture but not previously assigned stable rows.

Columns: ID | capability | current state | target | primary entities/contracts | API/DTO/RLS | UI/worker | privacy/provenance | required tests/evidence | dependency | phase | status.

| ID | Capability | Current state | Target | Primary entities/contracts | API/DTO/RLS | UI/worker | Privacy/provenance | Tests/evidence | Dependency | Phase | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TAL-001 | Canonical person identity | fragmented | one durable person | talent_people | owner/search DTO; scoped RLS | Passport | restricted; source-linked | identity/duplicate proof | taxonomy | P0 | APPROVED |
| TAL-002 | Auth-person ownership | partial | verified account↔person link | person_accounts | me/claim | Passport | restricted; assurance | claim/unclaim tests | 001 | P0 | APPROVED |
| TAL-003 | Person aliases | missing | temporal aliases | person_aliases | internal | admin later | restricted; assertion | alias tests | 001 | P0 | APPROVED |
| TAL-004 | Imported/unclaimed person | partial | explicit claim lifecycle | source_records/profile_claims | claim API | claim UI P1 | restricted; source provenance | no fake ownership | 001/002 | P0 foundation | APPROVED |
| TAL-005 | Reversible person dedup | missing | reversible merge | identity_candidates/merge_events | internal | staff later | private; decision evidence | merge/reverse | 001 | P0 | APPROVED |
| TAL-006 | Canonical organization resolution | partial workspaces | workspace + external source identity | org_source_records/link_events | safe org DTO | employer context | business-sensitive | reversible links | workspace | P0 | APPROVED |
| TAL-007 | Parent/subsidiary/affiliate graph | missing | evidence-backed relationships | org_relationships | safe relationship projection | privacy/company context | business-sensitive | affiliate block tests | 006 | P0 foundation | APPROVED |
| TAL-008 | Facility/site identity | fragmented | canonical site references | facilities/mappings | safe facility projection | job/passport | mixed | site linkage | 006 | P0 foundation | APPROVED |
| TAL-009 | Versioned taxonomy | missing unified | canonical versioned terms | taxonomy_versions/terms | search metadata | filters | reference | version tests | baseline | P0 | APPROVED |
| TAL-010 | Taxonomy governance | missing | propose/review/deprecate/supersede | aliases/edges/change_events | active-term DTO | admin later | governance provenance | supersession tests | 009 | P0 | APPROVED |
| TAL-011 | Reference-data provenance | partial constants | versioned jurisdiction/currency/language | reference mappings | reference DTO | filters | public/reference | locale/version tests | 009 | P0 | APPROVED |
| TAL-012 | Field-level assertions | missing generalized | temporal typed claims | talent_assertions | summaries only | evidence badges | classified | assertion tests | 001/009 | P0 | APPROVED |
| TAL-013 | Evidence | platform patterns | Talent evidence links | evidence_items/assertion_evidence | internal-evidence DTO | evidence indicators | highly restricted | leakage/trace tests | 012 | P0 | APPROVED |
| TAL-014 | Conflicting evidence | missing | explicit conflicts | assertion_conflicts | unresolved summary | status | restricted | conflict/no-overwrite | 012/013 | P0 | APPROVED |
| TAL-015 | Temporal validity | partial | valid/observed/verified semantics | assertions/domain timestamps | safe dates | freshness/status | mixed | expiry/stale | 012 | P0 | APPROVED |
| TAL-016 | Employer Talent profile | partial workspace | Talent employer extension | employer_profiles | employer DTO | employer | business | cross-workspace | 006 | P0 | APPROVED |
| TAL-017 | Employer verification | generic workspace | multi-dimensional verification | employer_verifications | public/private status DTO | badges | evidence-backed | no overclaim | 016 | P0 | APPROVED |
| TAL-018 | Employer domain verification | missing | separate domain proof | domain_verifications | verification API | setup later | restricted | spoof tests | 016 | P0 | APPROVED |
| TAL-019 | Talent hiring-team roles | missing | Talent-specific least privilege | hiring_team_members | team scope resolver | employer P1 | private | actor matrix | workspace | P0 foundation | APPROVED |
| TAL-020 | Recruiter authorization | missing | active authority | recruiter_authorizations | permission resolver | Find Talent | restricted | expired/unauth tests | 019 | P0 | APPROVED |
| TAL-021 | Agency engagements | missing | scoped mandate | agency_engagements | resolver | Find Talent | restricted | agency scope | 020 | P0 foundation | APPROVED |
| TAL-022 | Entitlement boundary | missing | capability resolver | entitlement mapping | server resolver | gated UI | internal | entitlement tests | 019 | P0 | APPROVED |
| TAL-023 | Requisitions | missing | internal hiring demand | requisitions/versions | employer API P1 | P1 | private | lifecycle | 016/019 | P0 foundation | APPROVED |
| TAL-024 | Multiple openings | missing | headcount integrity | requisition/job fields | safe fields | detail | mixed | multi-hire | 023 | P0 | APPROVED |
| TAL-025 | Canonical JobOpportunity | fragmented | single canonical job | job_opportunities | jobs search/detail DTO | Find Jobs | public-safe | canonical-ID proof | 006/009 | P0 | APPROVED |
| TAL-026 | Job versions | partial | immutable material versions | job_versions | current/history limited | change indicator | mixed | historical version | 025 | P0 | APPROVED |
| TAL-027 | Job requirement versions | missing | immutable requirement versions | job_requirements/versions | requirement DTO | match/detail | safe if publishable | change/invalidation | 025/009 | P0 | APPROVED |
| TAL-028 | Structured compensation | fixture strings | normalized+original | job_compensation | safe DTO | search/card | public-sensitive | normalization/no-inference | 025 | P0 | APPROVED |
| TAL-029 | Jurisdiction hierarchy | partial | country/subdivision/local | reference/location | location DTO | filters | public | region tests | 011 | P0 | APPROVED |
| TAL-030 | Work-mode/location rules | remote bool partial | remote/hybrid/on-site scope | job_locations | job DTO | filters | public | location tests | 025/029 | P0 | APPROVED |
| TAL-031 | Application method | direct form | direct/external/agency distinction | application_methods | job DTO | CTA | public | routing tests | 025 | P0 | APPROVED |
| TAL-032 | Source governance | partial | provider registry | ingestion_sources | internal | admin later | internal | source-policy tests | 025 | P0 | APPROVED |
| TAL-033 | Provider usage rights | missing | storage/display/derived/commercial rights | source_rights | ingest guard | none | internal legal/ops | disabled-on-fail | 032 | P0 | APPROVED |
| TAL-034 | Raw source preservation | basic job_search | immutable snapshots | job_snapshots | internal | worker | private | hash/snapshot | 032 | P0 | APPROVED |
| TAL-035 | Job dedup | source ID only | reversible multi-source identity | job_identity_* | internal | resolver | internal | duplicate/reverse | 025/034 | P0 | APPROVED |
| TAL-036 | Freshness lifecycle | partial fetched/effective | confirmed/recent/stale/etc | observations/freshness_events | freshness DTO | cards/refresh worker | public-safe | stale/source loss | 032/034 | P0 | APPROVED |
| TAL-037 | Job-change semantics | missing | typed material change events | job_change_events | safe changes | alerts P1 | mixed | title/comp/req/status diffs | 026 | P0 foundation | APPROVED |
| TAL-038 | Search-index freshness | missing | projection generation state | projection_state | internal status | indexer | restricted | privacy propagation | 051/059/060 | P0 | APPROVED |
| TAL-039 | Professional Passport | hv_professionals partial | durable Passport | professional_profiles | owner/search DTO | Find Talent | restricted | legacy compatibility | 001 | P0 | APPROVED |
| TAL-040 | Employment history | partial strings | typed org/site/function/time | experiences/context | disclosure DTO | profile | restricted | temporal/source | 006/008/039 | P0 | APPROVED |
| TAL-041 | Capabilities | specialty strings | taxonomy-linked claims | professional_capabilities | candidate DTO | result/profile | restricted | claimed vs verified | 009/039 | P0 | APPROVED |
| TAL-042 | Credential authorities | strings/missing | canonical authorities | credential_authorities | lookup/summary | filters | reference | alias tests | 009 | P0 | APPROVED |
| TAL-043 | Credential lifecycle | partial credential_type | full state lifecycle | professional_credentials | credential summary | profile/match | highly restricted detail | expiry/revoke | 039/042 | P0 | APPROVED |
| TAL-044 | Credential verification adapters | missing | normalized adapter result | verification_events | internal | verifier | restricted | unavailable≠invalid | 042/043 | P0 foundation | APPROVED |
| TAL-045 | Identity assurance | missing explicit | account/person assurance levels | assurance_events | me/status | profile | restricted | assurance combinations | 001/002 | P0 | APPROVED |
| TAL-046 | Languages | arrays | typed proficiency | professional_languages | search DTO | filters | restricted | no invented proficiency | 039 | P0 | APPROVED |
| TAL-047 | Availability | missing structured | temporal availability | professional_availability | search summary | Find Talent | restricted | stale confirmation | 039 | P0 | APPROVED |
| TAL-048 | Work authorization | missing | separate work-right claims | work_authorizations | limited search summary | filters | highly restricted | separate from credential | 039 | P0 | APPROVED |
| TAL-049 | Mobility | missing | relocation/travel/remote prefs | mobility_preferences | candidate-safe | filters | restricted | disclosure tests | 039 | P0 | APPROVED |
| TAL-050 | Contact points | candidate/app fields | private canonical contacts | contact_points | grant-only DTO | profile P1 | highly restricted | no search leak | 001/052 | P0 | APPROVED |
| TAL-051 | Profile visibility | missing generalized | private/anonymous/verified/public | profile_visibility | visibility API | Find Talent | highly restricted | immediate exclusion | 039 | P0 | APPROVED |
| TAL-052 | Progressive disclosure | missing | levels 0–5 grants | disclosure_grants | disclosure API | candidate detail | highly restricted | level tests | 051 | P0 | APPROVED |
| TAL-053 | Current-employer blocks | missing | employer/affiliate blocks | employer_blocks | block API | privacy settings | highly restricted | anti-enumeration | 007/051 | P0 | APPROVED |
| TAL-054 | Consent | missing purpose model | purpose/versioned consent | consents/events | consent API | settings | highly restricted | revoke/send-time | 001 | P0 | APPROVED |
| TAL-055 | Data subject rights | missing | access/correct/suppress/delete | DSR records | request API | settings P1 | highly restricted | export/suppress | 054 | P0 foundation | APPROVED |
| TAL-056 | Legal hold | missing | retention override | legal_holds | internal | staff later | highly restricted | hold prevents purge | 055 | P0 | APPROVED |
| TAL-057 | Encryption classification | implicit | field-level policy | control metadata | server only | none | highly restricted | logs/secret-field tests | privacy | P0 | APPROVED |
| TAL-058 | Data residency classification | missing | dataset processing class | residency_classifications | internal | none | highly restricted | classification tests | privacy | P0 foundation | APPROVED |
| TAL-059 | Find Jobs search | public list only | structured server search | job_search_documents | /jobs/search | Find Jobs | public | retrieval/latency | 025/036 | P0 | APPROVED |
| TAL-060 | Find Talent search | missing | permissioned employer search | person_search_documents | /people/search | Find Talent | restricted | blocked/unrelated deny | 020/051/053 | P0 | APPROVED |
| TAL-061 | Lexical search | missing Talent-wide | FTS/trigram | search projections | search APIs | both modes | inherited | corpus eval | 059/060 | P0 | APPROVED |
| TAL-062 | Semantic search | missing | authorization-safe optional vector retrieval | search_embeddings | server search | same UI | restricted derivative | prefilter leakage tests | 060/061 | P0 foundation | APPROVED |
| TAL-063 | Anti-enumeration search | missing | privacy-aware counts/errors | search policy | search DTO | Find Talent | highly restricted | narrow-query tests | 053/060 | P0 | APPROVED |
| TAL-064 | Search-quality corpus | missing | frozen expected/forbidden dataset | test fixtures | test only | none | synthetic | precision/recall/privacy | 059/060 | P0 | APPROVED |
| TAL-065 | Match policy versioning | legacy fit strings | reproducible policies | match_policy_versions | match service | result | restricted | replay same explanation | 027/039 | P0 | APPROVED |
| TAL-066 | Hard eligibility factors | missing generalized | satisfied/not/unresolved/NA | eligibility tables | eligibility DTO | result | restricted | missing-evidence tests | 027/043 | P0 | APPROVED |
| TAL-067 | Match factor explanations | legacy personal score | evidence-backed factors | matches/factors/evidence | explanation DTO | result | restricted | factor trace | 065/066 | P0 | APPROVED |
| TAL-068 | Match invalidation | missing | invalidate on relevant change | match_invalidations | internal | stale indicator | restricted | job/profile/privacy/rule changes | 065/067 | P0 | APPROVED |
| TAL-069 | Saved jobs | noncanonical concept | candidate-owned saves | saved_jobs | save/delete | Find Jobs | private | cross-user deny | 059/auth | P0 | APPROVED |
| TAL-070 | Saved searches | legacy settings-like | structured reusable queries | saved_searches | P1 activation | P1 | private | ownership/scope | 059/060 | P0 foundation | APPROVED |
| TAL-071 | Applications | two partial models | canonical application | talent_applications | apply/mine | Apply | highly restricted | workflow/ownership | 025/001 | P0 | APPROVED |
| TAL-072 | Application idempotency | missing explicit | deterministic duplicate/reapply policy | idempotency fields | apply | Apply | restricted | concurrent duplicate tests | 071 | P0 | APPROVED |
| TAL-073 | Application history | current stage only | immutable events | status_events | actor projections | My apps P1 | restricted | immutable history | 071 | P0 foundation | APPROVED |
| TAL-074 | Application questions | missing | typed versioned questions | question tables | apply/detail | Apply | variable classification | knockout trace | 027/071 | P0 | APPROVED |
| TAL-075 | Documents | external resume URL | private managed storage | documents/grants/access_events | upload/access | Apply/Profile | highly restricted | signed URL/access audit | 071/privacy | P0 | APPROVED |
| TAL-076 | Candidate data export | missing control | entitled audited export | export service | export P1 | P1 | highly restricted | row/field/bulk abuse | 022/052 | P0 foundation | APPROVED |
| TAL-077 | Bulk recruiter actions | missing | separate bulk entitlements/rates | permission/audit controls | P1 endpoints | P1 | highly restricted | bulk abuse/races | 020/022 | P0 foundation | APPROVED |
| TAL-078 | Contact send-time authorization | missing | re-evaluate consent/block/authority/grant | auth policy | messaging P1 | P1 | highly restricted | revoke/block race | 020/052/053/054 | P0 foundation | APPROVED |
| TAL-079 | Public `/talent` canonical convergence | DB board separate | same canonical job IDs | compatibility mapping | canonical job DTO | /talent | public-safe | old/new shadow comparison | 025/059 | P0 | APPROVED |
| TAL-080 | Professional-directory compatibility | hv_professionals direct | safe Passport compatibility DTO | legacy map | PublicProfessionalDTO | /professionals* | public-safe | route/slug parity | 039 | P0 | APPROVED |
| TAL-081 | `/api/talent/apply` compatibility adapter | direct candidate insert | canonical application service | compatibility adapter | apply API | existing form | restricted | anti-bot preserved + canonical write | 071/075 | P0 | APPROVED |
| TAL-082 | `job_search.*` client boundary | broad client SELECT | isolated legacy/operator boundary | grants/RLS | no generalized client contract | none | restricted | direct-read negative tests | security baseline | P0 | APPROVED |
| TAL-083 | Command context/navigation preservation | current country/role/global nav | preserve Talent domain + Command/Market/Intel/Actions | Command contracts | URL state | Command | user-context | context/deeplink tests | 059/060 | P0 | APPROVED |
| TAL-084 | `JOB_LISTINGS` production elimination | active production source | fixture-only/nonproduction | compatibility fixture | none production | Command | public | import/runtime proof | 025/059 | P0 | APPROVED |
| TAL-085 | Immutable Talent audit | fragmented patterns | append-only sensitive-action ledger | talent_audit_events | safe/internal audit DTO | staff later | restricted | immutability/event coverage | cross-cutting | P0 | APPROVED |
| TAL-086 | Abuse reporting and moderation | missing Talent-specific | report/case/action/suppression | abuse/moderation tables | report/internal | P1/staff | restricted | suppression/authority tests | 085 | P0 foundation | APPROVED |
| TAL-087 | Retention, erasure and audit pseudonymization | missing Talent-specific | policy/events/tombstones | retention tables | internal | none | highly restricted | erase/hold/restore chain | 055/056/085 | P0 | APPROVED |
| TAL-088 | Notifications foundation | missing generalized | preferences/events/deliveries | notification tables | preferences/P1 delivery | P1 | private | consent/preference tests | 054/085 | P0 foundation | APPROVED |
| TAL-089 | Timezone and internationalization semantics | partial | source/original/localized/TZ-safe contract | reference/locale fields | localized DTO later | filters/deadlines | mixed | DST/original preservation | 011/029 | P0 foundation | APPROVED |
| TAL-090 | Accessibility | partial general UI | formal Talent WCAG contract | UI/test contract | n/a | P0 UI | n/a | keyboard/screen-reader/mobile | UI | P0 | APPROVED |
| TAL-091 | Performance, SLO and error budget | unspecified | measured budgets + release SLOs | indexes/telemetry | search/app APIs | all | n/a | p50/p95/LCP/INP/failure | search/apps | P0 | APPROVED |
| TAL-092 | Observability | partial logs | structured Talent telemetry | telemetry contract | internal | workers/UI errors | PII-minimized | failure-path telemetry | cross-cutting | P0 | APPROVED |
| TAL-093 | Analytics privacy | missing | cohort suppression and derivative classification | analytics policy | aggregate DTO P2 | P2 | aggregated-sensitive | small-cell tests | events/privacy | P0 foundation | APPROVED |
| TAL-094 | Talent-market analytics | missing | supply/demand intelligence | derived analytics | analytics API P2 | P2 | aggregated | lineage/threshold | 093 | P2 | DEFERRED_P2 |
| TAL-095 | Education capability-gap routing | Education separate | requirement gap→authoritative education | typed refs | routing P2 | P2 | safe/reference | no false credential promise | 027/041/043 | P2 | DEFERRED_P2 |
| TAL-096 | Full Capability Graph | partial graph pieces | Person↔Org↔Site↔Licence↔Product↔Market | graph relations/assertions | intelligence API P2 | P2 | mixed | path/provenance | identity/evidence | P2 | DEFERRED_P2 |
| TAL-097 | Employer ATS workflow | basic current | requisition/post/pipeline management | P1 workflow | employer APIs | P1 | private | lifecycle/authorization | 023/071 | P1 | DEFERRED_P1 |
| TAL-098 | Talent messaging | legacy outreach only | participant-scoped messaging | threads/messages | messaging APIs | P1 | highly restricted | send-time auth/cross-thread | 078/088 | P1 | DEFERRED_P1 |
| TAL-099 | Interviews, assessments and offers | missing | versioned scheduling/evaluation/offer lifecycle | interview/assessment/offer tables | P1 APIs | P1 | highly restricted | concurrency/version/access | 071/019 | P1 | DEFERRED_P1 |
| TAL-100 | Disaster recovery and legacy retirement | implicit | restore-tested recovery + explicit retirement gates | runbook/compat maps | operational | none | mixed | restore drill/retirement proof | all compatibility | P0 foundation/P1+ | APPROVED |

## Hardening controls
`CTL-001`–`CTL-025` are cross-cutting controls in `TALENT_TRACEABILITY_MATRIX.md`, `TALENT_CHANGE_CONTROL.md`, `TALENT_CUTOVER_ROLLBACK.md`, `TALENT_OPERATIONS_RUNBOOK.md`, `TALENT_TEST_MATRIX.md`, and `TALENT_RELEASE_CHECKLIST.md`. They do not replace any TAL row.