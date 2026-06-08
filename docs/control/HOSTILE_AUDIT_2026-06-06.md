# Harbourview Hostile Audit — 2026-06-06

## Scope and method

This audit reviewed the Harbourview repository from the perspective of a hostile external actor and a malicious low-privilege operator. The local checkout has no Git remote configured in `.git/config`, so the GitHub-facing review was limited to the repository contents available in this workspace plus public search for an obvious public `harbourview-platform` GitHub repository. No production requests, live Supabase writes, credential brute force, or destructive probes were performed.

### Evidence commands

- `git status --short && git remote -v && cat .git/config` — confirmed a clean working tree before the audit and no configured remote URL in the local checkout.
- `find . -maxdepth 2 -type f | sed 's#^./##' | sort | head -200` — reviewed top-level repository structure without recursive large-tree listing.
- `find app -maxdepth 4 -type f | sort` and `find lib -maxdepth 3 -type f | sort` — mapped application/API/security-relevant files.
- `python - <<'PY' ... Path('app/api').rglob('route.ts') ... PY` — identified service-role API routes that do not call `requireAdminAuth()` or `getAdminAuthCheck()`.
- `rg -n "SUPABASE_SERVICE_ROLE_KEY|createClient\(|requireAdminAuth|getAdminAuthCheck|csrf|rateLimit|Authorization|x-cron|CRON|secret" app lib scripts --glob '!node_modules'` — reviewed auth, service-role, rate-limit, and secret-touching code paths.
- `npm run test:secret-scan` — passed; no high-confidence secret literals found.
- `npm audit --omit=dev` — failed with a moderate PostCSS advisory inherited through Next.
- `npm run lint:docs` — failed because no `lint:docs` script exists.
- `npm run test -- --passWithNoTests` — failed on existing globe foundation camera/orbit expectation drift.

## Executive verdict

**Remediation pass status: PARTIAL HOLD.** The follow-up fix pass locked down the unauthenticated service-role genetics mutation routes, narrowed the public genetics intake response, made the cron route fail closed when `CRON_SECRET` is missing, added a caller secret gate to the smoke-verification route, and added app-layer admin-login throttling/same-origin checks. Release posture remains HOLD for unresolved dependency-audit and configured test-suite drift until those are separately cleared.

The original hostile findings remain below as traceability records, with the critical/high application findings now carrying explicit remediation notes.

## Findings

### HV-HA-001 — Unauthenticated service-role genetics action endpoint can mutate routing state

- **Severity:** Critical
- **Attack class:** Broken authentication / authorization bypass / privileged backend mutation
- **Affected route:** `POST /api/genetics-routing/actions`
- **Evidence:** The route builds a Supabase client from `SUPABASE_SERVICE_ROLE_KEY` and returns it without any admin guard. The POST handler reads `recordId` and `action` directly from request JSON, maps selected actions to privileged statuses, updates `genetics_routing_records`, inserts a `genetics_routing_events` row, and returns success.
- **Hostile path:** A public actor who learns or guesses a routing record UUID can flip records to `ready_for_intro` or `introduced`, generating false internal event history and potentially triggering downstream operator workflows if those statuses are trusted elsewhere.
- **Impact:** Unauthorized manipulation of controlled-genetics deal workflow, corrupted audit trail, and possible business/compliance exposure if introductions are made based on forged state.
- **Remediation:** Implemented admin API auth before service-role client creation, JSON 401/403 handling, strict JSON/action/UUID validation, database error checks, and static regression coverage in `scripts/test-admin-role-guard.mjs` and `scripts/test-genetics-routing-operations.mjs`.

### HV-HA-002 — Unauthenticated service-role genetics operations endpoint can overwrite internal assignment and notes

- **Severity:** Critical
- **Attack class:** Broken authentication / privilege escalation / integrity attack
- **Affected route:** `POST /api/genetics-routing/operations`
- **Evidence:** The route creates a service-role Supabase client from public URL plus `SUPABASE_SERVICE_ROLE_KEY` without auth, reads `recordId`, `assignedOperator`, `internalNotes`, and date fields from JSON, updates `genetics_routing_records`, inserts an internal event, and returns success without checking database errors.
- **Hostile path:** A public caller can overwrite operator assignment, internal notes, and follow-up dates on any known routing record. Because the route does not check Supabase update/insert errors, failed writes can still appear successful to clients and monitoring.
- **Impact:** Silent corruption of deal operations, workflow manipulation, operator impersonation/confusion, and loss of reliability for internal case notes.
- **Remediation:** Implemented admin API auth before service-role client creation, UUID/type/date/length validation, database update/insert error checks, and static regression coverage in `scripts/test-admin-role-guard.mjs` and `scripts/test-genetics-routing-operations.mjs`.

### HV-HA-003 — Public genetics request endpoint returns full internal routing record

- **Severity:** High
- **Attack class:** Excessive data exposure / public reflection of internal scoring
- **Affected route:** `POST /api/genetics-routing/requests`
- **Evidence:** The route is public by design, creates a genetics routing record from request JSON, persists it with service-role credentials when configured, and returns `{ success: true, record }` to the caller.
- **Hostile path:** A submitter can send crafted request data and receive the full server-created routing record, which may include internal scoring, routing metadata, generated IDs, or fields that should be operator-only. If downstream logic adds internal enrichment to the record object, this endpoint will leak it by default.
- **Impact:** Disclosure of deal-scoring mechanics and internal routing metadata; easier enumeration and targeting of HV-HA-001/HV-HA-002 if returned IDs are later accepted by admin mutation routes.
- **Remediation:** The public route now returns a narrow DTO with `requestId`, `status`, and a reviewed-response message instead of echoing the internal routing record; records now use database-compatible UUIDs.

### HV-HA-004 — Cron scrape endpoint is fail-open when `CRON_SECRET` is unset

- **Severity:** High in misconfigured production; Medium otherwise
- **Attack class:** Missing mandatory auth under configuration drift / resource abuse
- **Affected route:** `GET /api/cron/scrape`
- **Evidence:** The handler checks `authorization` only when `CRON_SECRET` is truthy. If the secret is absent, the scrape engine runs for any caller.
- **Hostile path:** On any preview or production deployment missing `CRON_SECRET`, an unauthenticated caller can repeatedly trigger scraper runs, database writes, downstream digest email attempts, and long-running compute.
- **Impact:** Cost amplification, data pollution, rate-limit pressure against source sites, noisy operational alerts, and potential accidental production writes from public traffic.
- **Remediation:** The cron route now returns `503` when `CRON_SECRET` is missing and still returns `401` for incorrect bearer tokens.

### HV-HA-005 — Smoke marketplace endpoint is public and can query/close smoke inquiries when write flags are enabled

- **Severity:** Medium
- **Attack class:** Test/verification backdoor exposed to public traffic
- **Affected route:** `POST /api/smoke/marketplace`
- **Evidence:** The route does not require admin auth; it conditionally enables service-role-backed RPC calls based on `HARBOURVIEW_SMOKE_WRITE`, `HARBOURVIEW_SMOKE_CLEANUP`, and production write flags. Input is constrained to `smoke+...@harbourview.local` and marker prefixes, which limits blast radius but does not authenticate the caller.
- **Hostile path:** If smoke flags are accidentally left enabled, anyone can verify or close matching smoke inquiries and observe row metadata for those test artifacts.
- **Impact:** Publicly reachable operational test backdoor; low direct customer-data impact due to narrow input validation, but still undesirable for production posture.
- **Remediation:** The smoke route now requires `HARBOURVIEW_SMOKE_ROUTE_SECRET` via bearer token or `x-harbourview-smoke-secret` before checking write/cleanup gates and service-role configuration.

### HV-HA-006 — Admin password login has no route-local throttling or CSRF protection

- **Severity:** Medium
- **Attack class:** Brute-force amplification / cross-site form POST
- **Affected route:** `POST /admin/login/submit`
- **Evidence:** The route accepts form data, calls Supabase password grant, and sets or clears the admin session cookie. The handler does not apply the repository's rate-limit helper and does not verify a CSRF token or origin.
- **Hostile path:** An attacker can spray credential attempts through this route until Supabase upstream controls intervene. A cross-site form POST can also force a victim browser to attempt login/logout-like state changes, though `SameSite=Lax` and credential secrecy limit practical escalation.
- **Impact:** Increased auth noise, potential account lockouts, and reliance on upstream-only throttling rather than app-layer defense.
- **Remediation:** The admin login route now applies IP and email-identity rate limits, enforces same-origin `Origin`/`Referer` checks for form posts, and expires stale admin cookies on all failed attempts.

### HV-HA-007 — Dependency audit currently reports a moderate Next/PostCSS advisory

- **Severity:** Medium
- **Attack class:** Known vulnerable dependency
- **Affected package chain:** `next` depends on vulnerable `postcss <8.5.10` per `npm audit --omit=dev`.
- **Evidence:** `npm audit --omit=dev` reported `GHSA-qx2v-qp2m-jg93` for PostCSS, with Next in the affected chain. The automated force fix would downgrade/break Next, so this needs deliberate framework upgrade evaluation rather than blind `npm audit fix --force`.
- **Hostile path:** The published advisory concerns XSS through unescaped `</style>` in CSS stringify output. Exploitability depends on whether untrusted CSS reaches PostCSS stringify in this app or build pipeline.
- **Impact:** Currently moderate and likely build-time/context-dependent, but should block a clean production security posture until assessed and patched or documented as not exploitable.
- **Recommended fix:** Evaluate a safe Next version that pulls patched PostCSS; avoid `--force` downgrade; record dependency exception only if the app never stringifies attacker-controlled CSS.

## Positive controls observed

- Admin pages and many admin API routes call `requireAdminAuth()` or `getAdminAuthCheck()` before service-role operations.
- Marketplace capture and quote routes implement body validation, honeypot/challenge checks, and route/identity rate limiting.
- The public chat route validates shape but is intentionally disabled and does not process prompts.
- The local secret scanner passed with no high-confidence secret literals found.
- Public/private DTO and leakage test infrastructure exists and should be extended to the genetics routing request DTO.

## Prioritized remediation plan

1. **Remaining:** Resolve dependency and test drift by upgrading the vulnerable Next/PostCSS chain safely and fixing or intentionally updating the globe foundation expectations so security PR validation is trustworthy.
2. **Remaining:** Add runtime/integration tests for anonymous genetics action/operations POSTs once the route-test harness is available.
3. **Completed:** Genetics action/operations routes now require admin API auth and strict validation before service-role use.
4. **Completed:** Public genetics intake now returns a narrow DTO only.
5. **Completed:** Cron, smoke, and admin-login operational gates now fail closed or throttle suspicious traffic.

## Validation status

- `npm run test:secret-scan` — PASS.
- `npm audit --omit=dev` — FAIL: moderate PostCSS advisory through Next.
- `npm run lint:docs` — FAIL: script is not defined in `package.json`.
- `npm run test -- --passWithNoTests` — FAIL: pre-existing globe foundation expectation failures for camera distance and azimuth limits.

## Compliance and data handling

No secrets, private Supabase logs, JWTs, customer data, or production payloads were used or committed during this audit. Evidence is limited to local source review, package metadata, static scans, and local command output.
