# GitHub issue drafts — Harbourview platform audit 2026-09-14

Copy each block into a new GitHub issue. Labels: `audit`, `security`, `ops`, `intelligence`.

---

## P0-1 — Triage committed-not-applied migrations

**Labels:** `ops`, `database`, `security`, `priority:p0`

Production has a large set of repository migrations committed but not applied. Merging does not apply migrations. Prior incident: globe reading unapplied columns.

**Acceptance**
- [ ] Snapshot live schema_migrations vs repo
- [ ] Triage baseline: apply / withdraw / equivalence
- [ ] Prioritize security/RLS/clinical grants
- [ ] EVIDENCE_LOG for each apply

**Refs:** `supabase/release-controls/committed-not-applied-baseline.json`, `docs/control/OPERATOR_AUDIT_RUNBOOK_2026-09-14.md`

---

## P0-2 — Live anonymous admin denial + leakage probe

**Labels:** `security`, `priority:p0`

Close PROJECT_REGISTRY HOLD gates with live evidence on `https://harbourview.vercel.app`.

**Acceptance**
- [ ] Anonymous curl of /admin routes
- [ ] probe:production-visibility / leakage script
- [ ] Role matrix anon / non-admin / admin
- [ ] EVIDENCE_LOG with deployment ID

---

## P0-3 — Intelligence pipeline live health check

**Labels:** `intelligence`, `ops`, `priority:p0`

Verify pg_cron active flags, feed freshness, Vercel cron success, intelligence-health alerting config.

---

## P1-1 — CI: admin route requireAdminAuth inventory

**Labels:** `security`, `ci`, `priority:p1`

Land `tests/harbourview/admin-route-auth-guard.test.ts` (this PR).

---

## P1-2 — Align admin marketplace + dossiers under (protected)

**Labels:** `security`, `refactor`, `priority:p1`

Optional structural move; explicit guards already present.

---

## P1-3 — Verify /admin/login anonymous reachability

**Labels:** `security`, `ux`, `priority:p1`

---

## P1-4 — CI: admin API routes must call admin auth

**Labels:** `security`, `ci`, `priority:p1`

Land `tests/harbourview/admin-api-auth-guard.test.ts` (this PR).

---

## P1-5 — Schedule or retire unscheduled cron routes

**Labels:** `intelligence`, `ops`, `priority:p1`

See `docs/control/CRON_ROUTE_DISPOSITION_2026-09-14.md`.

---

## P1-7 — Intelligence-health alert email config

**Labels:** `ops`, `intelligence`, `priority:p1`

---

## P2-1 — Upgrade sharp/hono in intelligence-engine-studio

**Labels:** `security`, `dependencies`, `priority:p2`

---

## P2-2 — Dependabot never runs Next.js Build

**Labels:** `ci`, `priority:p2`

---

## P2-3 — PROJECT_REGISTRY live re-verification

**Labels:** `ops`, `docs`, `priority:p2`

---

## P2-5 — Sync forbidden public field lists

**Labels:** `security`, `priority:p2`

Partial: `tests/harbourview/public-safety-forbidden-list.test.ts` (this PR).
