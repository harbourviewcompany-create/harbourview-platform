# Agent Pre-Flight Checklist

> **Run this before writing any code, migration, or handoff update — not after.**
> This exists because nearly every costly incident in `HANDOFF.md`'s session log traces back to an agent assuming state instead of checking it: fictional schemas, phantom tables, gutted functions, duplicate RLS policies, migration drift. This checklist turns "check first" from a norm into a required, checkable step.

Every session must complete Steps 1–4 and paste the output into the session's PR description or session log entry before any implementation work begins. If a step can't be completed, that is itself a HOLD condition (see `AGENT_HANDOFF.md`).

---

## 1. Confirm you're working from a clean migration baseline

```bash
supabase migration list --linked
```

Compare this against `ls supabase/migrations/`. If they don't match 1:1:
- **STOP.** Do not apply new migrations.
- This is drift — see `HANDOFF.md > MIGRATION DRIFT PROTOCOL`.
- Reconciling drift is its own task, not something to fix incidentally while doing something else.

If a CI drift check is running (see `migration-drift-check.yml`), also check its latest status on `main` before starting.

## 2. Check live schema for anything your task touches

Do not trust prior sessions' description of a table's columns, a function's signature, or an enum's values — verify directly:

```sql
-- Tables/columns
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('<tables your task touches>');

-- Enum values
select enumlabel from pg_enum
where enumtypid = '<enum_name>'::regtype;

-- Function existence + schema (check BOTH public and api — see ADR #9)
select p.proname, n.nspname
from pg_proc p join pg_namespace n on p.pronamespace = n.oid
where p.proname = '<function_name>';
```

Known repeat-offender assumptions to specifically re-verify, not trust from memory or old docs:
- `applicationsQuery.ts` exports (`listPendingProfessionals`, `decideProfessionalApplication`, `decideSupplierApplication`) and status value `pending_review` (not `pending`).
- Any function you plan to call via `.rpc()` — confirm it exists in the `api` schema, not just `public`. PostgREST only exposes `api` on this project.
- Any table under active "DO NOT TOUCH" rules in `HANDOFF.md` (`supplier_profiles`, `public-assets` bucket RLS).
- Any new `.hvm-*` class added to `MOBILE_CSS` in `components/dashboard/MobileCommandCentre.tsx` — it's a plain un-scoped `<style>` string (not CSS modules), so a duplicate selector will silently win/lose the cascade instead of erroring. `grep -n "^\.your-class-name {" components/dashboard/MobileCommandCentre.tsx` before adding one. This caused a real production bug (gold-block signal detail, fixed 2026-07-07 — see HANDOFF.md ADR #11).

## 3. Check for in-flight work on the same area

```bash
git branch -r --sort=-committerdate | head -30
```

For any branch that looks related to your task:
- Check last commit date and whether its last CI run passed.
- If it's >7 days stale with no PR, note it in your session log as likely-abandoned rather than silently ignoring or silently building on top of it.
- If it's active and overlapping, coordinate before duplicating work (this project has had 4+ same-task collisions between concurrent sessions, most recently `main` moving 14 commits mid-task across two separate windows on 2026-07-07 — diff the incoming changes directly before merging, don't trust a clean `git merge` exit code alone).

> **Note on `main` branch protection:** as of 2026-07-07, `enforce_admins` is `false` on this repo's `main` branch protection, and `required_approving_review_count` is `0`. This means a direct push (or a merge commit) to `main` with an admin-scoped token will be logged as "Bypassed rule violations" but **not blocked**. Do not treat the existence of branch-protection rules as evidence that a workflow step (PR, review, linear history) actually happened — verify what was actually done, same as any other claim in this checklist. See `HANDOFF.md` ADR #12.

## 4. Check current CI/deploy health before assuming a red check is your fault

```bash
gh pr checks <PR_NUMBER>
```

Cross-reference against the **"PRE-EXISTING FAILURES — Do Not Investigate These"** table in `HANDOFF.md`. If a failing check is already listed there (Netlify, stale Cloudflare Workers builds, GCP triggers, the vitest suite failing since Jun 23), it is not caused by your change — do not spend time debugging it.

Checks that DO matter and should block merge: Vercel Preview, Cloudflare Pages, Supabase Preview, `tsc --noEmit`, `Next.js Build`, `Smoke Tests`, `Security / Leakage`.

---

## 5. Before writing new code: two hard rules

- **Never commit placeholder comments as literal code** (e.g. `// Keep other functions as they were`, `// rest of file unchanged`). This has previously caused silent deletion of working functions. Write the real code or don't touch the file.
- **Every `apply_migration` call must be paired with a committed `.sql` file in the same session/PR.** No exceptions, no "I'll commit it later."

## 6. Before claiming anything is done

Do not write "GO," "build clean," or "routes verified" in `EVIDENCE_LOG.md` or a PR description unless you have just run the actual command/test and are recording a real result with a date. Update `EVIDENCE_LOG.md` itself if it's stale — check its last-updated date against the current migration/PR state first.

---

## Required session output (unchanged from `AGENT_HANDOFF.md`, restated for completeness)

1. Objective completed or not completed
2. Files changed
3. Commands run
4. Verification results
5. Evidence produced or linked
6. Assumptions made
7. Remaining risks
8. GO/HOLD verdict

**HOLD, don't proceed, if:** destructive schema/DB risk, production write risk without approval, credential/secret exposure, public/private data exposure risk, unclear target repo/branch/deployment/environment, irreversible workspace action, directly conflicting current instructions, or failed relevant build/test/deploy verification.
