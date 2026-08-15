# Talent Legacy Compatibility

Anchors: TAL-079–TAL-084 plus TAL-025, TAL-039, TAL-071, TAL-082, CTL-006–CTL-008, CTL-023.

| Legacy | Canonical destination | Rule |
|---|---|---|
| `JOB_LISTINGS` | fixture/test only | TAL-084: no production result may originate here after P0 cutover. |
| `public.talent_jobs` | `talent_job_opportunities` + direct source record | preserve deterministic legacy ID map and public redaction semantics. |
| `public.talent_candidates` | canonical applications; optional person link only when identity proven | never treat row as person master; do not invent missing historical stage transitions. |
| `hv_professionals` | `talent_people` + Passport compatibility projection | preserve public slugs/routes; map only supported fields; do not invent issuer/licence/expiry/scope facts. |
| `job_search.jobs` | source records/snapshots + job resolution | external ID/source/timestamps useful; legacy fit score/reasons excluded from canonical matching. |
| `job_search.companies` | organization source records | resolve to workspace only when supported; no automatic verification. |
| `job_search.applications/resume_versions/contacts/outreach_messages/settings` | legacy/operator unless deterministic ownership/semantics proven | never expose wholesale to generalized Talent clients. |
| `/api/talent/apply` | compatibility adapter to canonical application service | preserve anti-abuse/open-job validation while replacing direct legacy write. |
| `/talent*` | canonical JobOpportunity DTOs | preserve deep links or deterministic redirects and shadow-compare old/new outputs. |
| `/professionals*` | PublicProfessionalDTO | preserve verified public directory behavior independently of job-seeking visibility. |

Backfill reconciliation (`CTL-006`) must record source, mapped, unmapped, duplicates, conflicts, suppressed, error counts. No destructive legacy retirement until `CTL-023` criteria pass.