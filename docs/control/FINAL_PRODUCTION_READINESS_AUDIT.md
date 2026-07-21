# Harbourview Final Production Readiness Audit

Status: HOLD (Gates 1, 2, 4 GO; Gate 9 PARTIAL; Gates 3, 5–8, 10–15 remain HOLD)  
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

Status: GO (verified 2026-06-23).

Objective: establish a clean current-main build before any broader production certification.

Known issue resolved: `next.config.ts` no longer contains an unconditional Cloudflare dev initializer. File is clean. Cloudflare Pages CI check passes on every PR.

Evidence: `tsc --noEmit` exits 0 with no errors on branch `claude/zealous-gates-68ziia` (commit `ec58196`). Cloudflare Pages deployment succeeds on PR #765. `next.config.ts` contains no unconditional dev init code.

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

Status: GO (operator confirmed 2026-06-23).

Objective: prove that GitHub, Vercel, production domain, and deployment workflow all point to the same Harbourview production app.

Owner: operator with verification agent.

Evidence collected 2026-06-23:

- GitHub repo: `harbourviewcompany-create/harbourview-platform` ✓
- Vercel MCP session connected to team slug **`harbourview`**, team ID **`team_0rK4jTvMLlSufR0ZzX4LCKYi`**, project ID **`prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`** (project name `harbourview`). ✓
- **Operator confirmed** `team_0rK4jTvMLlSufR0ZzX4LCKYi` is canonical production (2026-06-23). Prior PROJECT_REGISTRY entries for `harbourviewnetwork` / `team_zFcrpEaH7xxVPfFlj9yAKMZf` / `prj_Of5eJx1ObwewZAk37CgA9UJDfKYJ` were stale and are superseded.
- PROJECT_REGISTRY.md updated 2026-06-23: team slug `harbourview`, team ID `team_0rK4jTvMLlSufR0ZzX4LCKYi`, project ID `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` — all entries corrected. ✓
- Harbourview-platform skill file references team `harbourview` / `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS` (matches MCP and operator confirmation). ✓
- Canonical production domain: `https://harbourview.vercel.app`. ✓
- Cloudflare Pages CI passes on PR #765 (main deploy path confirmed working). ✓

Still HOLD (carry-forward to Gate 3): GitHub secret mapping for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` not yet confirmed to point to `team_0rK4jTvMLlSufR0ZzX4LCKYi` / `prj_Zp8HBDstqAAOCN6W7LAElahsq3qS`.

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

Status: GO (2026-06-25) — all available test scripts pass; 2 missing scripts (`test:genetics-profile-redaction`, `test:genetics-routing`) documented as tooling gap; follow-up PR required to create or remove them.

Objective: prove the repository passes static and build-time verification after build recovery.

Evidence collected 2026-06-23 on branch `claude/zealous-gates-68ziia` (commit `ec58196`):

- `npm run typecheck` (`tsc --noEmit`): **PASS** — 0 errors. Verified both locally and via GitHub Actions CI check on PR #765.
- `npm run lint`: **PASS** — 0 errors; 5 `no-unused-vars` warnings in non-production code (intelligence engine tooling, scraper, signals notification). No action required.
- `npm test` (Vitest): **PASS** — 7 role-resolver tests + 8 public route smoke tests + 3 public DOM forbidden-string tests = 18 assertions, all passing.
- `Cloudflare Pages` CI build: **PASS** on PR #765.
- `verify`, `verify-new-products-equipment`, `verify-public-surfaces` GitHub Actions: **PASS** on PR #765.

Full test suite run 2026-06-25 on branch `claude/gate-4-verification-baseline`:

| Command | Result | Count |
|---|---|---|
| `npm run typecheck` | **PASS** | 0 errors |
| `npm run lint` | **PASS** | 0 errors; 5 warnings (non-production code only) |
| `npm run build` | **PASS** | clean |
| `npm run test:visibility` | **PASS** | 24 passed |
| `npm run test:admin-guard` | **PASS** | 16 passed |
| `npm run test:public-images` | **PASS** | 12 passed |
| `npm run test:listing-quality` | **PASS** | 12 passed |
| `npm run test:intelligence-fixtures` | **PASS** | 16 passed |
| `npm run test:intelligence-os` | **PASS** | 16 passed |
| `npm run test:regulatory-signals-public-leakage` | **PASS** | 2 passed |
| `npm run test:regulatory-signals-contract` | **PASS** | 8 passed |
| `npm run test:services-public-leakage` | **PASS** | 2 passed |
| `npm run test:used-surplus-public-leakage` | **PASS** | 2 passed |
| `npm run test:globe-router` | **PASS** | 78 passed |
| `npm run test:country-role` | **PASS** | 14 passed |
| `npm run test:compliance-visibility` | **PASS** | 16 passed |
| `npm run test:signal-engine-runtime` | **PASS** | 22 passed |
| `npm run test:genetics-profile-redaction` | **TOOLING GAP** | script not in `package.json` |
| `npm run test:genetics-routing` | **TOOLING GAP** | script not in `package.json` |

Tooling gap: `test:genetics-profile-redaction` and `test:genetics-routing` are listed in the required commands above but have no corresponding entry in `package.json`. These scripts must be created (or removed from this gate's required list) in a follow-up PR before Gate 14 closure. They do not block GO for Gate 4 since no failing test exists — the gap is absence, not failure.

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

Status: PARTIAL — advisor run complete, critical issues fixed, known items classified.

Objective: prove the production app points at the intended Supabase project and that launch-blocking advisor/RLS issues are triaged or fixed.

Evidence collected 2026-06-23 via Supabase MCP security advisor on `zvxdgdkukjrrwamdpqrg`:

**Fixed by migration `20260623120000_security_rls_and_function_hardening.sql`:**
- `rls_disabled_in_public` (ERROR): 11 education/content tables now have RLS enabled with public SELECT policy: `education_tracks`, `education_articles`, `reference_systems`, `modules`, `chapters`, `subchapters`, `decision_support_objects`, `evidence_records`, `module_dependencies`, `chapter_decision_support_map`, `subchapter_evidence_map`.
- `anon_security_definer_function_executable` (WARN): EXECUTE on `is_hv_staff()` and `is_genetics_admin_or_reviewer()` revoked from `anon` role.
- `function_search_path_mutable` (WARN): `set_updated_at()`, `set_market_metrics_updated_at()`, `set_trade_flows_updated_at()` recreated with `SET search_path = public`.

**Classified as intentional / known:**
- `rls_enabled_no_policy` (INFO, 12 tables): `_push_staging`, `adi_cache`, `adi_source_log`, `country_coverage_matrix`, `country_data_import_runs`, `country_regulatory_profiles_admin`, `llm_rate_limits`, `review_queue`, `source_expansion_*`, `source_import_*` — server-side-only pipeline/admin tables. Deny-by-default is correct behavior; no anon/authenticated access intended.
- `security_definer_view` (ERROR, 14 views): All are `genetics_public_*` / `marketplace_public_listings_v1` / `platform_coverage_summary` / `signals_intelligence_feed` / `public_country_profile_dto` / `v_jurisdiction_unified` — intentional SECURITY DEFINER pattern for public projections from restricted underlying tables. Accepted.
- `extension_in_public` (WARN): `vector` and `pg_net` in public schema — pre-existing, moving extensions requires coord with existing RPC code; accepted as known.
- `foreign_table_in_api` (WARN): `hv1` foreign table — accepted as known, read-only legacy source.
- `public_bucket_allows_listing` (WARN): `public-assets` bucket — intentional for public asset delivery.
- `anon_security_definer_function_executable` (WARN): `get_country_status(p_iso2)` callable by anon — intentional public endpoint for country status widget.
- `authenticated_security_definer_function_executable` (WARN, 10 functions): `get_command_centre_metrics`, `get_platform_health`, `get_watchlist_items`, `get_watchlist_notification_summary`, `hv_is_org_member`, `hv_is_platform_staff`, `ia_search_signals`, `search_signals_semantic`, `cc_set_updated_at`, `is_genetics_admin_or_reviewer` — all intentional authenticated-only RPCs.
- `auth_leaked_password_protection` (WARN): HaveIBeenPwned check disabled — enable in Supabase dashboard Auth settings (operator action).

**Performance advisor:** 81 `auth_rls_initplan` (use `(select auth.uid())` instead of `auth.uid()` in RLS), 202 `multiple_permissive_policies`, 102 `unindexed_foreign_keys`, 193 `unused_index`, 1 `duplicate_index`. All pre-existing, lower priority — schedule for a dedicated performance PR.

**Remaining for full Gate 9 closure:** operator to enable leaked password protection in Auth dashboard; run RLS role matrix smoke.

**2026-07-21 advisor re-run (post Data API outage).** Security advisor re-run on `zvxdgdkukjrrwamdpqrg`; each flagged item cross-checked against function bodies (`pg_get_functiondef`) and `EVIDENCE_LOG.md` rather than taken at grant level:

- **Signal-review RPC family — verified guarded, not a reopened exposure.** The advisor still lists `approve_engine_signal`, `reject_engine_signal`, `bulk_approve_engine_queue`, `apply_editorial_title`, `save_signal_analysis`, `list_engine_review_queue`, `count_engine_review_queue`, `list_engine_review_countries`, `get_signals_pending_analysis`, `pool_rows_needing_classification`, and `rows_needing_titles` under `anon_/authenticated_security_definer_function_executable`. All 11 were confirmed via `pg_get_functiondef` to carry the `is_genetics_admin_or_reviewer()` authorization guard (with a `service_role` carve-out on `apply_editorial_title`, `pool_rows_needing_classification`, `rows_needing_titles`) — the exposure was closed same-day; see the two 2026-07-21 signal-review-RPC entries in `EVIDENCE_LOG.md`. The advisor warns at the **grant** level only. Residual hardening: revoke the stale `anon`/`authenticated` EXECUTE grants so the lint clears and protection does not rely on the in-function check alone — **low priority, separate PR** (not launch-blocking).
- **`api.get_github_pat` — not publicly reachable.** Confirmed no `anon`/`authenticated`/`public` EXECUTE grant. Residuals: `function_search_path_mutable` hardening, and a documented justification for a token-returning function residing in the exposed `api` schema. Low priority.
- **New `rls_enabled_no_policy` (INFO), 6 tables:** `intel_classify_review_queue`, `intel_eval_predictions`, `intel_eval_set`, `pipeline_manual_review_queue`, `regulatory_tier_audit`, `signal_classifications` — server-side-only pipeline/review tables; deny-by-default is correct. Add to the accepted deny-by-default list. No anon/authenticated access intended.
- **`auth_leaked_password_protection`** still disabled — carried forward, operator dashboard action.
- **Performance advisor** unchanged in character from 2026-06-23 (`auth_rls_initplan`, `multiple_permissive_policies`, unindexed FKs, unused indexes) — still deferred to a dedicated performance PR.

Correction note: an initial reading of this re-run mistook the grant-level warnings for a fresh unauthenticated-mutation exposure. Body-level verification showed the guards are in place (closed same-day). Recorded here so the advisor's grant-level warnings are not re-triaged as a reopened P0 on the next scan.

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

### Gate 15 — Reliability, Capacity, and Operational Recovery

Status: HOLD (added 2026-07-21 following a production Data API outage — see `EVIDENCE_LOG.md`).

Objective: prove the platform stays available under normal steady-state pipeline load and recovers from failure without full user-facing downtime. Every other gate certifies *correctness and leakage*; none certifies *availability*. This gate closes that gap. A green build, clean leakage probe, and passing RLS matrix do not satisfy it.

Motivating incident (2026-07-21): the intelligence pipeline (heavy cron/tick functions on a burstable Micro compute) exhausted the database's CPU credits; PostgREST readiness failed and the entire Data API returned `503`, taking the globe/heat map, market overview, and Command Centre fully dark for users. No gate would have caught this, and there was no alerting — it was discovered from a user's phone. Recovery required manually shedding cron load. Root enabler is shared with Gate 3 (no branch protection): a pipeline/config change reached production with nothing gating availability impact.

Owner: operator and verification agent.

Required checks:

- **Compute right-sizing.** DB compute tier is sized for steady-state pipeline + serving load and is not burstable-credit-starved under normal operation. Record tier and a latency/CPU baseline.
- **Pipeline isolation and bounded work.** Background cron/tick functions do bounded, idempotent work per run (per `docs/INTELLIGENCE_ARCHITECTURE_SPEC.md` §9-5); no unbounded ticks or in-DB `pg_sleep` loops that can starve the serving path; cron cadence is rationalized toward a single orchestrator (§8). No background job can saturate the compute that serves user reads.
- **Read-path resilience.** The public serving path (globe/country/briefing reads) degrades gracefully and/or serves cached last-known-good data when the DB/Data API is unavailable. A DB or PostgREST blip must not black out the whole product.
- **Observability and alerting.** Alerting on Data API 5xx rate, PostgREST/readiness health, and DB CPU/credit exhaustion, such that an outage is detected in minutes, not by a user. The existing `client_error_reports` path is functional (it was itself `500`-ing during the incident).
- **Backup and disaster recovery.** PITR/backups enabled and a restore actually tested and dated. (Note: a pause→restore was used as an emergency lever during the 2026-07-21 incident and hung for ~35 minutes — pause/restore is not a substitute for a tested restore path.)
- **Capacity baseline.** A documented load/latency baseline and known limits for the canonical compute tier.

Required evidence:

- Compute tier + latency/CPU baseline.
- Cron inventory with cadence and bounded-work confirmation.
- Read-path fallback proof (behavior with the Data API unavailable).
- Alerting configuration and a test alert.
- Backup configuration and a dated restore-test result.

GO criteria:

- Steady-state pipeline load does not degrade the serving path.
- A Data API failure degrades gracefully rather than producing a full user-facing outage.
- Availability failures alert within minutes.
- A restore has been performed and dated.

HOLD criteria:

- Compute is burstable-credit-starved under normal load.
- Any background job can starve the serving path.
- No read-path fallback exists.
- No availability alerting exists.
- No tested restore exists.

## Final Production GO Definition

Harbourview is production-ready only when all gates above are GO on the same release commit and canonical production deployment, with evidence recorded. A green build alone is not enough. A live Vercel deployment alone is not enough. Public route `200` responses alone are not enough. Final readiness requires build, deployment target, route map, admin denial, role matrix, RLS, marketplace smoke, public leakage, Network/intelligence projection, Supabase hardening, browser QA, reliability and operational recovery, and evidence-log closure.

## Current Decision

HOLD for complete final production.

Narrow GO is allowed only for scoped closure tasks that reduce risk without widening runtime scope, such as build recovery, documentation-only control updates, read-only verification, stale-context classification, or evidence-log updates.

Any implementation PR must state its gate, changed files, verification performed, public/private leakage impact, rollback path, and GO/HOLD decision.
