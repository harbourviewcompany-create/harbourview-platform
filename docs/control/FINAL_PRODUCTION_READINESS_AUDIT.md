# Harbourview Final Production Readiness Audit

Status: HOLD  
Scope: no-code production-readiness control document for `harbourviewcompany-create/harbourview-platform` on current `main`  
Task classification: verification / deployment / RLS-auth / public-private-leakage / admin / marketplace / intelligence  
Change policy: this document does not authorize runtime changes, Supabase migrations, Vercel changes, Netlify changes, package/dependency changes, auth changes, marketplace data changes, workflow changes, production writes, branch-protection changes, or deletion of branches/projects. Each closure item that requires a change must be handled in a separate scoped PR.

## Control Objective

Move Harbourview from an existing regulated-market intelligence platform with a controlled marketplace layer to complete final production readiness without reducing the platform to a generic marketplace, ecommerce site, SaaS dashboard, cannabis listing board, or lead-generation website.

Final production readiness requires proof that the canonical app, canonical production domain, deployment path, Supabase target, admin controls, RLS role model, public marketplace DTOs, intelligence/private evidence boundaries, production routes, intake flows, and public leakage protections are all working on the same release commit.

## Non-Negotiable Public / Private Boundary

Public surfaces may expose only public-safe, review-safe copy and public DTO/projection fields. Public surfaces include the homepage, marketplace hub, marketplace category/listing pages, seller listing intake, buyer wanted-request intake, confidential intake, signals entry surfaces, intelligence entry surfaces, legal pages, and other non-admin routes.

Private surfaces include admin dashboard, listing review, source/evidence review, jurisdiction queues, counterparty intelligence, signals review, reports, audit/evidence logs, source intake, candidate review, Network review items, internal intelligence summaries, and admin-only operational screens.

The following must not appear in public HTML, public API responses, public client bundles where practical, public route source imports, public DTOs, public RSC payloads, public screenshots, public generated reports, or public logs: source URLs, source names where they identify private sourcing, provenance, evidence, raw captured text, captured URLs, source snapshots, internal review notes, analyst notes, review status, availability status, seller authorization status, reviewedBy, lastReviewedAt, nextReviewDueAt, private contact emails, service-role diagnostics, raw Supabase errors, audit payloads, counterparty intelligence, jurisdiction review queues, or unapproved internal signal summaries.

## Required Owner Roles

- Operator: Tyler or approved Harbourview operator. Owns merge/deploy decisions, Vercel/Supabase secret confirmation, production write approval, and GO/HOLD decisions.
- Implementation agent: makes scoped code or documentation changes only when explicitly assigned.
- Verification agent: runs commands, collects artifacts, and records evidence without changing runtime unless explicitly assigned.
- Reviewer: checks public/private leakage, changed-file scope, evidence quality, and production readiness.

## Sequenced Closure Plan

### Gate 1 — Build Recovery Baseline

Status: HOLD.

Objective: establish a clean current-main build before any broader production certification.

Known issue: `next.config.ts` currently contains an unconditional Cloudflare dev initializer. Build recovery must remove or neutralize only that issue in a separate minimal runtime PR.

Owner: implementation agent for the code PR; reviewer/operator for merge.

Allowed closure PR scope: `next.config.ts` only, unless the failing build log proves another file is required.

Required commands:

```bash
npm ci
npm run typecheck
npm run build
```

Evidence required:

- PR number.
- Exact changed files.
- Exact command output for `npm ci`, `npm run typecheck`, and `npm run build`.
- Confirmation no Supabase, RLS, auth, admin, middleware, marketplace model, DTO, dependency, Vercel, Netlify, or unrelated UI files changed.

GO criteria:

- Build succeeds on the reviewed commit.
- Runtime changes are limited to the proven build blocker.

HOLD criteria:

- Build output is missing.
- PR touches unrelated systems.
- Cloudflare/Vercel build behavior remains ambiguous.

### Gate 2 — Canonical Deployment Target Confirmation

Status: HOLD.

Objective: prove that GitHub, Vercel, production domain, and deployment workflow all point to the same Harbourview production app.

Owner: operator with verification agent.

Required checks:

- Confirm canonical GitHub repo: `harbourviewcompany-create/harbourview-platform`.
- Confirm canonical production domain: `https://harbourview.vercel.app`.
- Confirm canonical Vercel project: `harbourview` under account/team `harbourviewcompany`.
- Record exact Vercel Project ID.
- Record exact Vercel Org ID.
- Confirm GitHub secrets `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, and `VERCEL_TOKEN` target the canonical project.
- Confirm whether Vercel Git deployments are intentionally disabled and whether controlled deployment workflow is the production release path.

Required commands or evidence:

```bash
vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
vercel pull --yes --environment=production --token=$VERCEL_TOKEN
```

If CLI output cannot be shared, provide redacted evidence showing project name, project ID, org/team, environment, linked repo, and branch.

GO criteria:

- Project, org, domain, branch, repo, and secrets are recorded in `docs/control/PROJECT_REGISTRY.md` or a dated evidence log.

HOLD criteria:

- Project ID or Org ID is missing.
- Secrets may point to a duplicate or stale Vercel project.
- Production release path is not documented.

### Gate 3 — Branch Protection and Stale Context Cleanup

Status: HOLD.

Objective: ensure required checks represent the canonical Harbourview app only.

Owner: operator and verification agent.

Required checks:

- List required branch-protection checks for `main`.
- Classify each Vercel and Netlify context as canonical, stale, non-required, or intentionally retained.
- Do not delete branches, disconnect projects, or remove checks without a separate approved cleanup action.

Evidence required:

- Screenshot or exported text of required checks.
- List of stale/non-canonical contexts.
- Confirmation whether any stale Netlify context blocks merge.

GO criteria:

- Only canonical checks block production merge, or stale checks are documented as non-required.

HOLD criteria:

- Any stale Vercel/Netlify check remains required.
- Branch protection is unknown.

### Gate 4 — Static Verification Baseline

Status: HOLD.

Objective: prove the repository passes static and build-time verification after build recovery.

Owner: verification agent.

Required commands:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:visibility
npm run test:admin-guard
npm run test:public-images
npm run test:listing-quality
npm run test:intelligence-fixtures
npm run test:intelligence-os
npm run test:regulatory-signals-public-leakage
npm run test:regulatory-signals-contract
npm run test:services-public-leakage
npm run test:used-surplus-public-leakage
npm run test:genetics-profile-redaction
npm run test:genetics-routing
```

Notes:

- If `npm run lint` fails because the script itself is obsolete, record that as a tooling blocker. Do not skip silently.
- Do not auto-mutate `package-lock.json` as part of verification evidence.

GO criteria:

- All required commands pass or a documented obsolete-tooling blocker is fixed in a separate PR.

HOLD criteria:

- Any command fails.
- Any command is skipped without rationale.
- Evidence lacks exact output or workflow run links.

### Gate 5 — Production Route Map Verification

Status: HOLD.

Objective: prove every public route has intentional runtime behavior on the canonical production deployment.

Owner: verification agent.

Required production base:

```bash
HARBOURVIEW_PUBLIC_BASE_URL=https://harbourview.vercel.app
```

Required public route coverage:

- `/`
- `/about`
- `/contact`
- `/signals`
- `/intelligence`
- `/intake`
- `/legal/terms`
- `/legal/privacy`
- `/marketplace`
- `/marketplace/listings`
- `/marketplace/consumables`
- `/marketplace/new-products`
- `/marketplace/used-surplus`
- `/marketplace/services`
- `/marketplace/business-opportunities`
- `/marketplace/cannabis-inventory`
- `/marketplace/wanted`
- `/marketplace/sell`
- `/marketplace/sell?type=wanted`
- all active listing detail routes generated from public listing slugs
- all active public Network routes
- all active public genetics routes
- all active compliance/clinical education routes if retained

Required evidence:

- Route.
- HTTP status.
- Final URL after redirect.
- Byte count.
- Expected behavior.
- Pass/fail.

GO criteria:

- Every public route returns the intended 200, 301/302/303/307/308, 404, or 410.
- No route leaks private fields.

HOLD criteria:

- Any public route errors unexpectedly.
- Any public route is missing from the scan.

### Gate 6 — Production Public Leakage Verification

Status: HOLD.

Objective: prove public production surfaces do not expose private source, evidence, provenance, review, contact, admin, RLS, or service-role material.

Owner: verification agent and reviewer.

Required command:

```bash
HARBOURVIEW_PUBLIC_BASE_URL=https://harbourview.vercel.app npm run probe:production-visibility
```

Required probe improvements before final certification:

- Include all routes listed in Gate 5.
- Inspect final URL and redirect chain for protected routes.
- Fail on any forbidden field/string in public HTML or public API GET response.
- Include public-safe route evidence in JSON artifact.

Required forbidden classes:

- `sourceUrl`, `sourceName`, `sourceEvidence`, `provenanceSummary`, `internalReviewNotes`.
- `verificationStatus`, `availabilityStatus`, `sellerAuthorizationStatus`.
- `reviewedBy`, `lastReviewedAt`, `nextReviewDueAt`.
- `source_registry`, `source_snapshots`, `marketplace_candidates`, `candidate_review_events`.
- `captured_url`, `captured_text`, `raw_html_hash`.
- `privateContactEmail`, `contactEmail` where not explicitly public-safe.
- `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, raw Supabase error diagnostics.
- analyst notes, raw evidence, audit events, internal queue fields, counterparty intelligence.

GO criteria:

- Zero forbidden matches across production public route set.

HOLD criteria:

- Any forbidden match appears publicly.
- Probe route coverage is incomplete.

### Gate 7 — Admin Denial and Role Matrix Verification

Status: HOLD.

Objective: prove `/admin` and private admin child routes are inaccessible to anonymous, missing-role, viewer, and analyst users, and accessible only to admin/operator.

Owner: verification agent with operator-provided test accounts or controlled fixtures.

Required routes:

- `/admin`
- `/admin/inquiries`
- `/admin/listings`
- `/admin/sources`
- `/admin/candidates`
- any Network review/admin routes
- any signals review/admin routes
- any reports/admin routes

Required role matrix:

- anonymous
- authenticated no-role
- viewer
- analyst
- operator
- admin

Required evidence:

- Request identity.
- Route.
- HTTP status or redirect.
- Final URL.
- Whether protected content rendered.
- Whether forbidden private strings appeared.

GO criteria:

- Anonymous and disallowed roles are denied or redirected without private content.
- Admin/operator access works.

HOLD criteria:

- Any disallowed role can view private content.
- Admin denial proof is absent.

### Gate 8 — Marketplace Capture and RLS Verification

Status: HOLD.

Objective: prove public marketplace intake works without public/private leakage and that rows are protected by RLS.

Owner: verification agent with operator approval for write gates.

Required commands:

```bash
npm run smoke:marketplace
npm run smoke:marketplace:rls
npm run smoke:marketplace:browser
```

Production smoke requires explicit gates:

```bash
HARBOURVIEW_SMOKE_WRITE=1
HARBOURVIEW_SMOKE_CLEANUP=1
HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1
HARBOURVIEW_PUBLIC_BASE_URL=https://harbourview.vercel.app
```

Required flows:

- quote or inquiry routing
- seller listing submission
- buyer wanted request submission
- browser-level form submit where supported
- cleanup or controlled closure of smoke rows
- anon cannot read protected rows
- admin/operator can review protected rows

GO criteria:

- All smoke flows pass.
- Test rows are cleaned up or clearly marked closed.
- No secrets or private fields appear publicly.

HOLD criteria:

- Write gates are missing.
- Any smoke row remains uncontrolled.
- Any RLS expectation fails.

### Gate 9 — Supabase Canonical Database and RLS Hardening

Status: HOLD.

Objective: prove the production app points at the intended Supabase project and that launch-blocking advisor/RLS issues are triaged or fixed.

Owner: operator and verification agent.

Required checks:

- Confirm canonical project ref: `zvxdgdkukjrrwamdpqrg`.
- Confirm production env URL points to the canonical project.
- Confirm anon key and service-role key belong to the canonical project.
- Confirm service-role key is never imported into client code.
- Confirm migrations applied to the canonical project.
- Run Supabase advisor and classify each warning.
- Triage known warnings: public smoke RPC grants, anonymous insert policy review, JWT-disabled edge function, vector extension in public schema, leaked password protection, deny-by-default table documentation.

Required evidence:

- Redacted env status.
- Migration state.
- Advisor report summary.
- Role/RLS matrix result.

GO criteria:

- Canonical DB is confirmed.
- Launch-blocking advisor items are fixed or explicitly accepted with rationale.
- RLS proof passes.

HOLD criteria:

- Canonical DB remains provisional.
- Public grants or anonymous policies remain unexplained.

### Gate 10 — Network / Intelligence Public Projection Verification

Status: HOLD.

Objective: prove private Network/intelligence records cannot leak and public projections are explicitly allowlisted.

Owner: implementation agent for any missing test PR; verification agent for proof.

Required checks:

- Private tables are admin/operator-only.
- Public projection table exposes only reviewed public fields.
- Viewer/analyst/no-role cannot read private review items or private intelligence summaries.
- Public routes consume only public projections/DTOs.
- Private evidence, suppressed fields, analyst notes, source refs, review events, and internal summaries do not appear publicly.

Required evidence:

- RLS test matrix.
- DTO exact-key test.
- Runtime public leakage probe.
- Admin route access proof.

GO criteria:

- Public projection is safe by schema, RLS, DTO, route import boundary, and runtime output.

HOLD criteria:

- Network server-side access utilities are missing or unmerged.
- Public projection path is not tested.

### Gate 11 — Marketplace DTO and Import Boundary Verification

Status: HOLD.

Objective: prove public marketplace UI cannot import private listing fixtures or expose private fields by accident.

Owner: implementation agent for missing tests; reviewer for changed-file scope.

Required checks:

- Public marketplace routes import only public listing DTO/projection utilities.
- Public DTO has exact expected keys.
- Private listing fixtures with source/provenance fields are not imported into public render files.
- Category routes use public-safe data only.

Required evidence:

- Static import-boundary test.
- DTO exact-key test.
- Existing `test:visibility` output.
- Production leakage probe output.

GO criteria:

- Public route imports are clean.
- Public DTO cannot drift to include private fields unnoticed.

HOLD criteria:

- Any public route imports private marketplace source fixture directly.
- DTO exact-key test is missing.

### Gate 12 — Legacy Data and Parallel Project Classification

Status: HOLD.

Objective: prevent production ambiguity from legacy Supabase data, parallel repos, preview branches, and public sidecar repos.

Owner: operator.

Required classifications:

- legacy Supabase signal project with 430 signal rows: migrate, archive, freeze, or sandbox.
- `harbourview-network`: feeder, replacement candidate, or separate incubation.
- `hv-telnyx-webhook`: active/private, archive, or unrelated.
- `chatbot`: separate product unless explicitly integrated.
- `ops/` or non-runtime files in canonical repo: retained non-runtime, moved out, or separately governed.
- stale preview branches: keep, close, or delete after evidence.

GO criteria:

- Every adjacent asset has a registry status and no asset is treated as production Harbourview by accident.

HOLD criteria:

- Legacy/private intelligence data remains unclassified.
- Public sidecar repo risk is unknown.

### Gate 13 — Browser QA and Visual/UX Production Pass

Status: HOLD.

Objective: prove user-facing surfaces are production-usable on desktop and mobile without leaking private content.

Owner: verification agent and reviewer.

Required surfaces:

- homepage
- marketplace hub
- category pages
- listing detail pages
- seller listing intake
- buyer wanted intake
- confidential intake
- signals entry
- intelligence entry
- legal pages
- admin login
- anonymous admin denial
- admin allowed-role dashboard routes

Required checks:

- desktop layout
- mobile layout
- navigation
- CTA behavior
- form validation
- success/error states
- empty states
- no fake proof claims
- no private field exposure
- no broken images
- acceptable performance baseline

GO criteria:

- Browser QA passes with screenshots or artifact notes.

HOLD criteria:

- Any critical layout, route, form, or leakage issue remains.

### Gate 14 — Evidence Log and Release Decision

Status: HOLD.

Objective: record final proof in the control system before calling Harbourview production-ready.

Owner: operator and verification agent.

Required evidence entry fields:

- date/time
- agent or human
- branch and commit
- deployment ID
- production URL
- environment
- command or workflow
- inputs used
- result: pass, fail, or blocked
- exact failure if any
- artifact/log location
- follow-up ticket if failed
- public/private leakage assessment
- GO/HOLD decision

GO criteria:

- Evidence log contains current command-backed evidence for Gates 1 through 13.
- Remaining risks are explicitly accepted or deferred with owner and date.

HOLD criteria:

- Evidence is stale, missing, manually asserted without steps, or tied to a different commit/deployment.

## Final Production GO Definition

Harbourview is production-ready only when all gates above are GO on the same release commit and canonical production deployment, with evidence recorded. A green build alone is not enough. A live Vercel deployment alone is not enough. Public route `200` responses alone are not enough. Final readiness requires build, deployment target, route map, admin denial, role matrix, RLS, marketplace smoke, public leakage, Network/intelligence projection, Supabase hardening, browser QA, and evidence-log closure.

## Current Decision

HOLD for complete final production.

Narrow GO is allowed only for scoped closure tasks that reduce risk without widening runtime scope, such as build recovery, documentation-only control updates, read-only verification, stale-context classification, or evidence-log updates.

Any implementation PR must state its gate, changed files, verification performed, public/private leakage impact, rollback path, and GO/HOLD decision.
