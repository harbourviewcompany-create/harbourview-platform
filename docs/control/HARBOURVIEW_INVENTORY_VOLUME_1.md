# Harbourview Platform Inventory — Volume 1

Status: PROVISIONAL / CONTROL INVENTORY
Mode: INVENTORY
Source frame: patched Harbourview Platform Operating Prompt
Authorized sources used: current user instruction and uploaded/patched operating prompt. No runtime code inspection was performed for this volume.
Repo-dependent facts: PROVISIONAL until verified against `harbourviewcompany-create/harbourview-platform`.
Supabase: not touched. Schema proposal required before any Supabase write.

## Objective
Create the first full-scope control inventory for the current Harbourview platform universe so every section, route, workflow, boundary, admin surface, intelligence surface, marketplace surface, deployment control, and commercial/network layer can be verified, built, or marked HOLD without narrowing Harbourview into a generic website, SaaS dashboard, listing board, or MVP marketplace.

## Universe definition
The Harbourview platform universe includes the public institutional website, country-first globe/router, marketplace, intelligence, signals, compliance/education, admin/operator systems, source/evidence workflows, Supabase/Auth/RLS boundaries, deployment controls, commercial/network operating layer, and review/governance systems.

Jurisdiction universe is repo-dependent. Candidate universes to reconcile in later volumes: all UN member states; all countries and territories; legal cannabis markets only; import/export-relevant jurisdictions; Harbourview-defined priority markets.

## Scope boundary
Included: routes, sections, workflows, data objects, DTO boundaries, API contracts, admin surfaces, evidence/source systems, production/deployment controls, commercial/network workflows, and verification requirements.

Excluded from this volume: code changes, Supabase schema writes, production smoke writes, Vercel changes, runtime claims, legal sufficiency claims, and GO-PRODUCTION claims.

## Coverage ledger
Volume 1: platform universe and completion index starter.
Volume 2: route/workflow matrix with proposed canonical paths, classifications, required DTOs, data objects, API contracts, verification commands, and HOLD criteria.
Volume 3: repo-verification checklist and evidence matrix.
Later volumes: repo-verified completion state, issue breakdown, build sequencing, and production release gates.

## Completion index starter

| ID | Section / workflow | Route or boundary | Classification | Current state | Required evidence | GO/HOLD |
|---|---|---|---|---|---|---|
| HV-PUB-001 | Main homepage | `/` | Public | UNKNOWN / REQUIRES REPO EVIDENCE | route file, screenshots, route smoke, mobile/reduced-motion checks, leakage probe | HOLD |
| HV-PUB-002 | Country-first globe/router | `/` and country deep links TBD | Public | UNKNOWN | dataset/source proof, deep-link contract, WebGL/static fallback proof | HOLD |
| HV-PUB-003 | Marketplace hub | `/marketplace` | Public | UNKNOWN | DTO ledger, public-safe copy, route smoke | HOLD |
| HV-PUB-004 | Marketplace listings | `/marketplace/listings` or `/marketplace` | Public | UNKNOWN | listing DTO allowlist, pagination, empty/error/loading states | HOLD |
| HV-PUB-005 | Listing detail | `/marketplace/listings/[slug]` | Public | UNKNOWN | slug rules, redaction proof, quote/contact path | HOLD |
| HV-PUB-006 | Seller listing intake | `/marketplace/sell` or `/submit-listing` | Public form | UNKNOWN | validation, spam/rate/origin controls, audit event, admin visibility | HOLD |
| HV-PUB-007 | Buyer wanted requests | `/marketplace/wanted` | Public form | UNKNOWN | validated intake, qualification fields, admin review path | HOLD |
| HV-PUB-008 | Quote/contact routing | `/marketplace/quote`, `/contact`, or listing CTA | Public workflow | UNKNOWN | routing proof, no fake transaction/compliance clearance | HOLD |
| HV-PUB-009 | Business opportunities / distressed assets | `/opportunities` or `/marketplace/opportunities` | Public/private hybrid | UNKNOWN | visibility rules, safe public DTO, review workflow | HOLD |
| HV-PUB-010 | Confidential intake | `/intake` | Public confidential form | UNKNOWN | privacy/consent copy, validation, admin-only visibility | HOLD |
| HV-INT-001 | Signals hub | `/signals` | Public/protected hybrid | UNKNOWN | published-signal DTO, lifecycle proof, leakage probe | HOLD |
| HV-INT-002 | Intelligence hub | `/intelligence` | Public/protected hybrid | UNKNOWN | private evidence suppression, safe copy, route smoke | HOLD |
| HV-INT-003 | Country briefs | `/intelligence/countries/[country]` or `/countries/[country]` | Public/protected | UNKNOWN | date/source/review state, stale-content behavior | HOLD |
| HV-INT-004 | Licensing pathways | `/licensing` or country-specific | Public education/compliance | UNKNOWN | source-backed pathway, non-advisory boundary | HOLD |
| HV-INT-005 | Regulatory pathways | `/regulatory` or country-specific | Public education/compliance | UNKNOWN | source-backed pathway, date/reviewer proof | HOLD |
| HV-INT-006 | Counterparty intelligence | `/admin/intelligence/counterparties` or equivalent | Admin/private | UNKNOWN | admin route guard, private-only DTO, audit events | HOLD |
| HV-INT-007 | Logistics/trade routes | `/intelligence/logistics` | Public/protected | UNKNOWN | source basis, compliance boundary, visibility rules | HOLD |
| HV-EDU-001 | Education hub | `/education` | Public | UNKNOWN | indexed education system, category boundaries | HOLD |
| HV-EDU-002 | Clinical education | `/education/clinical` | Public education | UNKNOWN | non-patient-facing boundary, reviewed/source-backed status | HOLD |
| HV-EDU-003 | Medical cannabis education | `/education/medical-cannabis` | Public education | UNKNOWN | non-advisory copy, jurisdiction/date/source controls | HOLD |
| HV-EDU-004 | Quality/import education | `/education/eu-gmp`, `/education/gacp`, `/education/gdp`, `/education/qp-release` | Public education | UNKNOWN | source-backed standards, import/export boundaries | HOLD |
| HV-COMP-001 | Compliance hub | `/compliance` | Public/protected | UNKNOWN | non-advisory boundary, route proof | HOLD |
| HV-COMP-002 | Compliance country pathways | `/compliance/[country]` | Public/protected | UNKNOWN | jurisdiction-specific source/date proof | HOLD |
| HV-COMP-003 | Assessments | `/assessments` | Public workflow | UNKNOWN | request-only or operator-reviewed flow, no fake clearance | HOLD |
| HV-COMP-004 | Professionals | `/professionals` | Public/network | UNKNOWN | qualification/review boundaries | HOLD |
| HV-COMP-005 | Policy and standards | `/policy`, `/standards` | Public governance | UNKNOWN | source-backed, no private-methodology leakage | HOLD |
| HV-GOV-001 | Source methodology | `/methodology` | Public governance | UNKNOWN | public-safe methodology only | HOLD |
| HV-GOV-002 | Trust and governance | `/trust`, `/governance` | Public governance | UNKNOWN | source standards, corrections/privacy boundaries | HOLD |
| HV-GOV-003 | Legal/privacy/terms | `/legal`, `/privacy`, `/terms` | Public legal | UNKNOWN | reviewed/approved or draft-labeled status | HOLD |
| HV-ADM-001 | Admin dashboard | `/admin` | Admin-only | UNKNOWN | server-side role proof, anonymous denial | HOLD |
| HV-ADM-002 | Admin sources | `/admin/sources` | Admin-only | UNKNOWN | source registry/snapshot workflow, private storage | HOLD |
| HV-ADM-003 | Admin candidates | `/admin/candidates` | Admin-only | UNKNOWN | candidate lifecycle, audit/status events | HOLD |
| HV-ADM-004 | Admin signals | `/admin/signals` | Admin-only | UNKNOWN | signal lifecycle, publication gate | HOLD |
| HV-ADM-005 | Admin inquiries | `/admin/inquiries` | Admin-only | UNKNOWN | PII access controls, intake review | HOLD |
| HV-ADM-006 | Admin role guard | middleware/API/auth boundary | Security | UNKNOWN | anonymous/no-role/viewer/analyst denial, admin/operator success | HOLD |
| HV-DATA-001 | Public/private DTO boundary | route/API contract layer | Security/data | UNKNOWN | DTO allowlist and private denylist | HOLD |
| HV-DATA-002 | Supabase/Auth/RLS | DB/auth/storage | Security/data | UNKNOWN | policy inspection, role query attempts, storage policy proof | HOLD |
| HV-DATA-003 | Source registry and snapshots | DB/storage/admin | Private evidence | UNKNOWN | hash/timestamp/source/license/storage/review proof | HOLD |
| HV-DATA-004 | Audit events/status history/internal notes | DB/admin | Private/admin | UNKNOWN | event coverage and role visibility proof | HOLD |
| HV-DEP-001 | Project registry | `docs/control/PROJECT_REGISTRY.md` | Control doc | UNKNOWN | repo-verified canonical deployment registry | HOLD |
| HV-DEP-002 | Production verification | control docs/workflows | Deployment | UNKNOWN | canonical domain, route smoke, leakage, admin denial, RLS, rollback | HOLD |
| HV-DEP-003 | Public leakage probes | tests/scripts/workflows | Security verification | UNKNOWN | HTML/API/bundle/metadata/sitemap/robots checks | HOLD |
| HV-DEP-004 | Marketplace smoke tests | tests/scripts/workflows | Workflow verification | UNKNOWN | safe gated write/cleanup for quote/listing/wanted | HOLD |
| HV-DEP-005 | Vercel/GitHub/CI controls | workflows/deploy settings | Deployment | UNKNOWN | branch/deploy policy, artifacts, stale context registry | HOLD |
| HV-NET-001 | Supplier acquisition | commercial/network workflow | Private/operator | UNKNOWN | workflow, qualification criteria, owner/reviewer | HOLD |
| HV-NET-002 | Supplier qualification | commercial/network workflow | Private/operator | UNKNOWN | evidence, cadence, relationship status | HOLD |
| HV-NET-003 | Buyer qualification | commercial/network workflow | Private/operator | UNKNOWN | buyer qualification and inquiry routing proof | HOLD |
| HV-NET-004 | Reviewed connections | commercial/network object | Hybrid/private-controlled | UNKNOWN | review status, evidence, expiration, visibility rules | HOLD |
| HV-NET-005 | Relationship/review status workflow | admin/operator | Private | UNKNOWN | cadence, reviewer, expiration, audit events | HOLD |
| HV-NET-006 | Notification/email workflow | integration | Private/public boundary | UNKNOWN | no sensitive leakage, admin/user notification proof | HOLD |
| HV-NET-007 | Analytics/observability | integration | Public/admin boundary | UNKNOWN | structured events without PII/private leakage | HOLD |
| HV-NET-008 | Privacy/data-retention controls | policy/data | Governance/security | UNKNOWN | PII/sensitive field inventory, retention/deletion/export path | HOLD |

## False-GO controls
No item may be marked complete until repo evidence proves route presence, data/API contracts, DTO boundary, auth/RLS status where applicable, public leakage safety, verification command result, and last verified timestamp. Static, placeholder, fixture-only, fallback-only, request-only, or demo surfaces remain HOLD unless explicitly approved as complete-static.

## Immediate repo-verification evidence required next
1. Route tree from app/, pages/, route handlers, middleware, sitemap/robots, and API directories.
2. Control docs under docs/control/.
3. Public DTO ledger and forbidden-field leakage tests.
4. Supabase migrations/RLS policies/storage policy files.
5. Admin route/API role guard proof.
6. Marketplace form/API smoke tests and safe production-write gates.
7. Vercel/GitHub workflow and canonical production registry.
8. Current deployment/domain evidence.
9. Commercial/network object/workflow evidence.

## Status
Final status: PROVISIONAL / HOLD for runtime completeness. GO-DOCS-ONLY is allowed only for creation of this inventory as an external control artifact after object IDs/URLs are returned.
