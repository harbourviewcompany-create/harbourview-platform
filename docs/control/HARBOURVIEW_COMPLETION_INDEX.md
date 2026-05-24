# Harbourview Completion Index

Status: HOLD  
Permission class: Documentation-only control artifact  
Repository: `harbourviewcompany-create/harbourview-platform`  
Purpose: Canonical completion-control document for building Harbourview section by section without scope drift or false GO claims.

## Control Rule

This document is not approval to change runtime code, UI, routes, database schema, auth, RLS, workflows, dependencies, Vercel, Supabase, environment variables, branch protection, or deployment settings. Build order is sequencing only; it does not remove any item from scope.

## Source-of-Truth Hierarchy

1. Active operator instruction.
2. Current repo evidence.
3. `docs/control/PROJECT_REGISTRY.md`.
4. `docs/control/PROJECT_STATE.md`.
5. `docs/control/BUILD_CONTROL.md`.
6. `docs/control/AGENT_PERMISSIONS.md`.
7. Existing `docs/control/*.md`.
8. `lib/platform/capabilityRegistry.ts` and `scripts/test-route-capability-registry.mjs`.
9. Connected GitHub/Vercel/Supabase/Linear/Notion evidence only when explicitly authorized.
10. Labeled inference only where evidence is unavailable.

Do not use stale domains, old workflow runs, memory, or script existence as completion proof.

## Global Status

HOLD. Current controls still require fresh canonical-domain route proof, public leakage proof, anonymous admin-denial proof, marketplace smoke proof, live Supabase RLS verification, branch-protection/stale-context review, and GitHub/Vercel secret mapping.

## Forbidden Public Leakage Concepts

Public routes must not expose private/admin source, evidence, provenance, review, counterparty, inquiry, or operator material, including source URLs, raw source names where not intentionally public, evidence captures, provenance summaries, source evidence, verification status, availability status, seller authorization status, internal review notes, reviewed-by metadata, last-reviewed metadata, review due dates, private counterparty intelligence, private inquiry details, admin-only candidate fields, admin-only source fields, admin-only signal fields, Supabase service-role diagnostics, or raw private database errors.

## Completion Evidence Standard

Every item requires repo or connected-tool evidence, current canonical-domain proof where production behavior is claimed, explicit public/private/admin visibility, DTO allowlisting where public pages consume controlled data, admin/operator-only proof for protected surfaces, live RLS proof for database-backed private workflows, and exact commands/logs/artifacts/screenshots/workflow runs/route results/database proof where applicable.

## Harbourview Completion Index

| # | Section/module | Category | Current known state | Intended full-completion state | Missing work | Dependencies | Leakage/security risks | Data/model requirements | UI/UX requirements | Verification requirements | Required artifacts/evidence | GO/HOLD criteria | Build order |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---:|
| 1 | Homepage platform spine `/`, `/platform` | public | Partial | Complete public control spine for Network, Exchange, Intelligence, Education, Professionals, Trust, Reviewed Connections | Route labels, route status, downstream consistency, globe QA | Route registry, nav, globe | False completeness | Capability/content registry | Premium globe/router | route/content/visibility/browser proof | Route map, screenshots, leakage result | HOLD until proven | 1 |
| 2 | Public/private DTO boundary | security | Partial | Public pages expose allowlisted fields only | Forbidden-string/bundle coverage, production proof | DTOs, public routes, private data | Critical leakage | DTO schemas, allowlists | No internal terminology | visibility and bundle probes | Leakage logs | HOLD until zero leak | 1 |
| 3 | Admin role guard | auth/RLS | Admin-backed | Admin/operator allowed; anonymous/viewer/analyst denied | Production denial and role matrix | user_roles, guard, cookies | Runtime auth drift | Role table/lookup | Safe denial UX | admin guard and production denial | Role matrix | HOLD until live proof | 1 |
| 4 | Supabase canonical DB | Supabase/database | Provisional canonical | Live RLS, migrations, role policies, server-only service role | Schema/RLS/advisor/public execute review | Canonical project, migrations, env | RLS drift/service-role exposure | Listings, inquiries, roles, sources, snapshots, candidates, signals, audit | N/A | RLS/migration/secret verification | Policy evidence | HOLD until live proof | 1 |
| 5 | Vercel/GitHub production controls | verification/deployment | Mapping recorded; proof incomplete | Clean main-to-canonical deployment path | Secret mapping, branch protection, stale context cleanup | Vercel, GitHub secrets, workflows | Stale deployment false GO | Deployment metadata | N/A | Deployment logs/route proof | Checks matrix | HOLD until current proof | 1 |
| 6 | Privacy policy `/legal/privacy` | legal | Partial | Linked public privacy route for all forms | Retention/contact/inquiry context | Forms | Data collection without context | Retention and inquiry definitions | Linked legal page | Route/link tests | Privacy route proof | HOLD until linked | 2 |
| 7 | Terms `/legal/terms` | legal | Partial | Terms route linked from footer/workflows | Marketplace/education/intelligence/reviewed-connection boundaries | Public workflows | Undefined terms | Terms content | Footer/workflow links | Route tests | Terms proof | HOLD until linked | 2 |
| 8 | Source methodology `/source-methodology` | documentation/control | Static orientation | Public method without raw evidence exposure | Correction workflow, evidence boundary | Evidence archive, trust | Raw source leakage | Source/status definitions | Transparent restrained copy | Visibility tests | Method proof | HOLD until boundary proven | 3 |
| 9 | Trust governance `/trust-governance` | documentation/control | Static orientation | Public trust/confidentiality/rules/correction layer | Proof alignment and rules | Legal, source method, DTO | Overstated controls | Governance policy | Institutional trust page | Content/proof tests | Governance proof | HOLD until proof-backed | 3 |
| 10 | Confidential intake `/intake` | commercial-network | Partial | Private-context capture with no automatic advice/conclusion | Privacy links, taxonomy, ownership | Capture API, admin inquiries | Advice/dealroom assumption | Inquiry type/status | High-trust review boundary | intake safety tests | Capture/admin proof | HOLD until proven | 4 |
| 11 | Marketplace hub `/marketplace` | marketplace | Partial | Controlled exchange hub with category status and inquiry paths | Maturity labels, live/fallback clarity | Category map, DTO, intake | Implied live inventory/access | Category/listing/service projections | Inquiry-first routing | marketplace and visibility tests | Route/leak proof | HOLD until proven | 5 |
| 12 | Reviewed listings `/marketplace/listings` | marketplace | Partial | Public-safe approved listings | Detail coverage, pagination, status, field suppression | Listings, DTO, admin approval | Source/review leakage | Listings/profile/status | Institutional cards | DTO/leakage tests | Listing proof | HOLD until no-leak | 6 |
| 13 | Listing detail pages | marketplace | Partial | Public-safe approved detail pages | Slugs, redaction, inquiry CTA | Listings, slug rules, DTO | Private field leakage | Detail projection | Premium detail | Route/leakage tests | Detail proof | HOLD until all active details proven | 6 |
| 14 | Submit listing `/marketplace/sell` | marketplace | Request-only | Seller submission with review boundary | Validation, candidate creation/triage | Capture, candidates, RLS | Automatic publication implication | Submission/candidate fields | Seller conversion copy | Smoke/intake tests | Submission proof | HOLD until capture/admin proven | 7 |
| 15 | Wanted requests `/marketplace/wanted` | marketplace | Request-only | Buyer demand capture through private review | Validation, lifecycle, queue | Capture, inquiries, RLS | Public buyer-board implication | Buyer request records | Low-friction form | Smoke/intake tests | Wanted proof | HOLD until capture/admin proven | 7 |
| 16 | Quote/contact routing | marketplace/commercial-network | Partial | Private-reviewed quote/introduction routing | Form inventory, statuses, ownership | Capture API, admin inquiries | Commercial data leakage | Inquiry/routing/notes | Clear review UX | Marketplace smoke | Smoke/cleanup proof | HOLD until canonical smoke | 7 |
| 17 | Marketplace services `/marketplace/services` | marketplace | Fallback-backed | Reviewed service listings or explicit orientation | Live service model, fallback labels | Services projection/admin/DTO | Fixture mistaken as approved | Service/provider model | Status clarity | services leakage/fallback tests | Services proof | HOLD until status proven | 8 |
| 18 | Business opportunities `/marketplace/business-opportunities` | marketplace | Request-only | Confidential opportunity intake | Deal taxonomy, NDA/confidentiality workflow | Intake/admin/private opportunity fields | Public dealroom implication | Opportunity/inquiry fields | Serious confidential framing | Route/leakage smoke | Opportunity proof | HOLD until private boundary proven | 9 |
| 19 | Intelligence hub `/intelligence` | intelligence | Static orientation | Public-safe intelligence IA excluding private evidence | Product tiers, request workflow, boundary | Content inventory, evidence system | Analyst product overclaim | Intelligence objects/source status | Editorial UI | fixture/leakage tests | Intelligence proof | HOLD until boundary proven | 10 |
| 20 | Country briefs `/intelligence/country-briefs`, `/markets` | intelligence | Static orientation | Country market context with source/freshness labels | Country model and coverage | Compliance, signals, source registry | Verified-brief implication | Country market fields | Dossier cards/map | Route/compliance tests | Country proof | HOLD until maturity labels | 11 |
| 21 | Compliance hub `/compliance` | compliance | Partial | Compliance orientation with source/legal boundary | Pathway routing, review labels | Countries, copy constants | Legal advice implication | Compliance country fields | Jurisdiction dashboard | compliance visibility tests | Compliance proof | HOLD until boundary proven | 11 |
| 22 | Licensing pathways | compliance | Request-only | Licensing orientation separated from legal advice | Jurisdiction schema/review metadata | Compliance/admin review | Legal conclusion risk | Licensing records | Caveated cards | Route tests | Pathway proof | HOLD until metadata | 12 |
| 23 | Regulatory pathways | compliance | Request-only | No eligibility/approval/compliance guarantee | Source-backed content/review | Compliance/legal copy | Official guidance risk | Regulatory model/sources | Orientation labels | Visibility tests | Regulatory proof | HOLD until source labels | 12 |
| 24 | Compliance country pathways | compliance | Draft orientation | Country pages with maturity/source/review labels | Complete data/route generation | countries.ts, source registry | Skeleton mistaken as verified | Country pathway model | Country dossiers | Full compliance tests | Country pathway proof | HOLD until classified | 12 |
| 25 | Logistics/trade routes | intelligence | Request-only | Chain-of-custody/logistics orientation with route review | Trade-route model and feasibility fields | Compliance/country briefs | Shipment feasibility implication | Route/permit/custody fields | Route diagrams | Route tests | Trade proof | HOLD until caveats | 13 |
| 26 | Public signals `/signals` | intelligence/signals | Fallback-backed | Public-safe live/fallback signals disclosure | Origin labels, contract stability, production scan | Signal projection | Fallback mistaken as live | Public signal filters | Signal cards | leakage/contract tests | Signals proof | HOLD until projection proven | 14 |
| 27 | Admin signals `/admin/signals` | admin/intelligence | Admin-backed | Admin signal review/publication workflow | Lifecycle/publication controls | Signal model/admin guard | Private fields publish | Signal safety projection | Admin publishing UI | contract/leakage/admin tests | Admin signal proof | HOLD until guarded | 15 |
| 28 | Counterparty intelligence | intelligence/admin-private | Request-only | Private counterparty review, no public dossier | Dossier model, admin UI, suppression | Auth/RLS/evidence/admin | Public counterparty DB risk | Counterparty/risk/evidence links | Public request only | leakage/admin/RLS tests | No-leak proof | HOLD until private model/RLS | 16 |
| 29 | Education hub `/education` | education | Static orientation | Non-promotional education across clinical/quality/compliance tracks | Content library/review metadata | Content inventory | Accreditation implication | Topic/review status | Track hierarchy | Content tests | Education inventory | HOLD until status clear | 17 |
| 30 | Clinical education `/network/clinical-education` | medical/education | Partial | Non-promotional clinical education with reviewer/patient boundary | Reviewer workflow and patient boundary | Clinical fixtures/components | Medical advice risk | Topic/source/reviewer metadata | Clinical cards/disclaimers | Guardrail tests | Clinical proof | HOLD until boundaries | 18 |
| 31 | Medical cannabis education | medical/education | Partial | Professional orientation, no patient guidance | Topic depth/review status | Clinical education | Treatment-claim risk | Audience labels | Non-prescriptive UX | Education tests | Medical proof | HOLD until non-claim boundary | 18 |
| 32 | EU GMP education | compliance/education | Static | EU GMP orientation separated from QP/import conclusions | Source-backed packs/reviewer metadata | Compliance/quality | Shipment/QP readiness implication | GMP topics | Dossier cards | Compliance tests | EU GMP proof | HOLD until status proven | 19 |
| 33 | GACP education | education | Static | Cultivation/export compliance orientation | Source-backed jurisdiction labels | Compliance/source method | Certification implication | GACP topics | Boundary copy | Content tests | GACP proof | HOLD until boundary | 19 |
| 34 | GDP education | education | Static | Logistics orientation with route validation boundary | Trade route link/source content | Logistics routes | Distributor qualification implication | GDP topics | Route-aware modules | Content tests | GDP proof | HOLD until caveats | 19 |
| 35 | QP release education | compliance | Static | Specialist-reviewed QP orientation | Jurisdiction/QP source review | EU GMP/pathways | QP guidance implication | QP topics | Specialist labels | Content tests | QP proof | HOLD until specialist review | 19 |
| 36 | Import/export education | compliance | Static | Jurisdiction/permit orientation with caveats | Permit taxonomy/country integration | Country/regulatory pathways | Eligibility implication | Permit/pathway fields | Explainer UX | Compliance tests | Import/export proof | HOLD until caveats | 19 |
| 37 | Quality systems education | education | Static | Quality documentation education without certification claims | Modules/review workflow | EU GMP/supplier qualification | Audit-readiness implication | Quality topics | Checklist but non-certifying | Content tests | Quality proof | HOLD until no-certification boundary | 19 |
| 38 | Canada-to-Germany pathway | compliance | Draft/later-enabled | Source-backed pathway pack with QP/importer distinction | Germany evidence/review | Country pathways/EU GMP | Shipment-readiness implication | Germany pathway pack | Dossier UX | Compliance tests | Germany artifact | HOLD until source-backed | 20 |
| 39 | Batch evidence education | education | Partial | Batch/COA education without private batch publication | Examples/redaction/review metadata | Clinical/evidence archive | Private batch exposure | Public examples vs private evidence | Documentation explainer | Education tests | Batch proof | HOLD until redaction boundary | 20 |
| 40 | Supplier qualification education | diligence/education | Request-only | Education separated from endorsement | Assessment workflow/review states | Assessments/counterparty intel | Supplier endorsement implication | Qualification criteria | Assessment CTA | Content tests | Supplier proof | HOLD until no-endorsement | 20 |
| 41 | Assessments hub `/assessments` | commercial-network | Request-only | Reviewed assessment request paths | Taxonomy/capture/admin review | Intake/admin/supplier qualification | Instant conclusion risk | Assessment request model | Selector/review boundary | Route tests | Assessment proof | HOLD until capture/review proven | 21 |
| 42 | Professionals hub `/professionals` | education/public | Static | Role-specific routing for professional cohorts | Role pages/workflows/disclaimers | Education/compliance/intake | Credential endorsement risk | Role taxonomy | Role cards | Route tests | Professionals proof | HOLD until boundaries | 22 |
| 43 | Policy and standards `/policy-standards` | compliance/public | Static | Neutral policy/standards orientation | Source status/update cadence | Source method/compliance | Official endorsement risk | Policy topic model | Editorial layout | Route tests | Policy proof | HOLD until labels | 23 |
| 44 | Reviewed connections `/reviewed-connections` | commercial-network | Request-only | Protected introductions, no automatic access | NDA/confidentiality states/admin routing | Intake/counterparty/admin | Public counterparty exposure | Connection request model | Protected network positioning | Leakage tests | No-leak proof | HOLD until private workflow | 24 |
| 45 | Admin dashboard `/admin` | admin | Admin-backed | Operator dashboard with private summary | Dashboard completeness/production denial | Auth/RLS/roles | Admin leakage | Workflow counts/private data | Operator UI | Admin guard/prod denial | Dashboard proof | HOLD until denial proven | 25 |
| 46 | Admin source registry `/admin/sources` | admin/ingestion | Admin-backed | Private source registry/snapshot queue | Source workflow/evidence/review states | Source tables/RLS/admin | Raw source leakage | source_registry/source_snapshots | Admin queue | Admin/RLS/leak tests | Source proof | HOLD until proven | 26 |
| 47 | Admin candidate review `/admin/candidates` | admin/marketplace | Admin-backed | Candidate queue with audited transitions | Approve/reject/publish semantics | candidates/review events/DTO | Candidate field leakage | marketplace_candidates/review_events/audit | Review queue | Admin/leak tests | Candidate proof | HOLD until lifecycle proven | 27 |
| 48 | Admin inquiries `/admin/inquiries` | admin/commercial-network | Admin-backed | Private triage for captured submissions | Ownership/status/notes/routing | Capture/API/inquiries | PII/commercial leakage | marketplace_inquiries/status/notes | Admin inbox | Intake/admin tests | Inquiry proof | HOLD until private triage | 28 |
| 49 | Source registry/snapshots | ingestion/evidence | Foundation present | Controlled private source capture | Fetch rules, snapshot keys, retry/backoff, locks | Admin sources/RLS/storage | Source/raw capture leakage | source_registry/source_snapshots | Admin-only workflow | RLS/leak/source tests | Source evidence | HOLD until workflow/RLS | 29 |
| 50 | Marketplace candidates/review events | marketplace/admin | Foundation present | Candidate pipeline to public projection | Lifecycle/audit/projection/rejection | Admin candidates/DTO/RLS | Candidate leakage | candidates/review_events | Admin queue | Candidate/leak tests | Lifecycle proof | HOLD until lifecycle proven | 29 |
| 51 | Audit events/status history/internal notes | admin/database | Intended tables | Audited private workflow history | Event taxonomy/write paths/retention | Admin workflows/RLS | Internal-note leakage | Audit/status/internal note models | Admin history UI | RLS/admin tests | Audit proof | HOLD until write/read proof | 29 |
| 52 | Legacy Supabase signal project | Supabase/database | Legacy/prototype pending inspection | Export/classify/migrate/archive | Schema/row export decision | Legacy access | Duplicate data confusion | Legacy signal/source tables | No public UI | Read-only export evidence | Classification artifact | HOLD until inspected | 30 |
| 53 | Production route map | verification/deployment | Historical evidence only | Current canonical-domain route proof | Fresh route smoke | Vercel/route registry | Missing route/stale evidence | Route registry/live responses | N/A | Route status artifact | Route map | HOLD until checked | 31 |
| 54 | Marketplace browser smoke | verification/deployment | Historical evidence superseded | Current quote/listing/wanted smoke with cleanup | Rerun with gates | Supabase env/prod URL | Uncontrolled test writes | Inquiry rows/cleanup status | N/A | Smoke artifacts | Smoke proof | HOLD until passes | 32 |
| 55 | Verification script registry | verification/deployment | Scripts exist; ambiguity possible | One authoritative verification matrix | Deduplicate/normalize separately | package scripts/workflows | Wrong script/domain false green | QA/route registry | N/A | CI/script audit | Script matrix | HOLD until verified | 33 |
| 56 | Commercial/network operating layer | commercial-network | Partially represented | Supplier acquisition, buyer demand, reviewed introductions, sourcing mandates, private deal routing | SOPs/statuses/owners/evidence standards | Intake/admin/reviewed connections/marketplace | Public counterparty/opportunity exposure | Supplier/buyer/opportunity/status/audit | Operator triage/conversion | Workflow proof | Ops artifact | HOLD until modeled | 34 |
| 57 | Documentation/control pack | documentation/control | Present but HOLD remains | Control docs updated after every proof/change | Index adoption/evidence log/registry sync | docs/control | Stale assumptions | Evidence log/registry/decisions | N/A | PR evidence/doc diff | Updated docs | HOLD until evidence loop current | 35 |

## Completion Matrix

| Group | Items | Current read | Completion condition |
|---|---|---|---|
| Foundation controls | 1-10 | Partial / HOLD | Source hierarchy, legal/trust/methodology, route map, DTO boundary, admin guard, Supabase RLS, deployment controls proven |
| Marketplace | 11-18 | Partial / request-only / fallback-backed | Buyer, seller, listing, service, wanted, quote, opportunity workflows with DTO/admin/smoke/no-leak proof |
| Intelligence/signals | 19-28 | Static / request-only / fallback-backed | Public-safe IA, signals projection, country/pathway coverage, counterparty privacy, admin signal controls proven |
| Education/compliance | 29-43 | Static / partial / draft | Review metadata, source status, medical/legal boundaries, country maturity labels, route/content proof |
| Admin/ingestion | 44-51 | Admin-backed / foundation present | Admin/operator workflows, audit events, source/candidate lifecycle, inquiry triage, live RLS proof |
| Production verification | 52-55 | Incomplete / stale proof | Current canonical-domain route, leakage, admin-denial, marketplace smoke, script matrix proof |
| Commercial/network ops | 56 | Partially modeled | Supplier/buyer/opportunity/reviewed-connection operating model with statuses and admin ownership |
| Documentation/control | 57 | Present but incomplete | Control docs, registry, state, evidence log updated from fresh proof |

## Dependency Map

1. Public/private DTO boundary, admin role guard, Supabase RLS, deployment mapping, and verification script authority are the first control layer.
2. Legal/privacy/terms/source methodology/trust governance must precede launch-ready public workflows.
3. Marketplace routes depend on DTOs, capture API, admin inquiry/candidate review, and smoke cleanup gates.
4. Intelligence/signals depend on methodology, signal projections, admin review, country/compliance data, and evidence separation.
5. Education/compliance depends on content inventory, clinical guardrails, country data, copy constants, review metadata, and source labels.
6. Admin workflows depend on role guard, RLS, audit/status history, and server-only private data access.
7. Commercial operations depend on intake, reviewed connections, admin inquiries, counterparty intelligence, confidentiality, and statuses.
8. Launch depends on canonical-domain deployment, route proof, public leakage proof, admin denial proof, live RLS proof, and marketplace smoke proof.

## Risk Register

| Risk | Severity | Closure |
|---|---:|---|
| Public/private leakage through HTML or bundles | Critical | Current canonical-domain leakage scan and bundle probe |
| Admin route false protection | Critical | Anonymous denial and full role matrix in production |
| Live Supabase RLS drift | Critical | Live RLS and policy audit |
| Stale production-domain evidence | High | Fresh canonical-domain proof |
| Marketplace false completeness | High | Maturity labels, request/review boundaries, smoke proof |
| Intelligence false authority | High | Source maturity, review status, live/fallback labels |
| Medical/legal/regulatory advice implication | High | Guardrails, review metadata, route tests |
| Public dealroom/counterparty exposure | High | Private models, admin-only views, leakage tests |
| Verification script ambiguity | High | Script authority cleanup and required-check matrix |
| Commercial ops gap | Medium-high | Operating model, statuses, ownership, evidence artifacts |
| Legacy Supabase data confusion | Medium-high | Export, classify, migrate/archive decision |
| Branch protection/stale contexts | Medium-high | Required-check audit and cleanup |

## Recommended Build Sequence

1. Keep this index and project registry synchronized.
2. Normalize verification command matrix in a separately approved pass.
3. Prove DTO boundary, admin denial, full role matrix, and live RLS.
4. Complete legal/privacy/terms/source methodology/trust governance.
5. Prove canonical-domain route map.
6. Complete marketplace core.
7. Complete admin marketplace workflows.
8. Complete signals and intelligence.
9. Complete compliance and education.
10. Complete commercial/network operating layer.
11. Classify legacy Supabase signal project.
12. Produce final launch evidence and update control docs.

## Required Verification Commands

Documentation-only changes require at minimum:

```bash
npm run test:full-scope:routes
npm run test:full-scope:content
npm run test:full-scope:marketplace
npm run test:visibility
npm run verify:admin-auth
npm run typecheck
```

Implementation, security, database, or deployment changes require targeted commands from the affected surface, including marketplace smoke, production visibility probes, RLS verification, Playwright route/browser checks, and migration checks where applicable.

## Final Status

HOLD. This index is a control artifact and does not prove completion of the Harbourview platform. GO can only be granted item-by-item after current evidence satisfies the corresponding GO/HOLD criteria above.
