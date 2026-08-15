# Agent Operating Facts — Harbourview Platform

Verified facts about how this repository and its production project actually
behave. Each one cost a session to discover. Read this before working here.

Every claim below was checked live on the date given. Re-check before relying on
one — that is Rule 3 in `CLAUDE.md`, and this file is not exempt from it.

---

## 1. Merging a migration does NOT apply it to production

**Verified 2026-08-13.** There is no continuous deployment for database
migrations. Merging to `main` changes the repository only.

`.github/workflows/supabase-migrate.yml` looks like a general applier. It is
not. It is `workflow_dispatch`-only and bound to a single named release via
`supabase/release-controls/elite-digest-production-activation.json`, whose
`approved_migrations` list contains three specific migrations from 2026-08-02.

Consequence: production runs behind the repository, silently and indefinitely.
On 2026-08-13 the gap was **25 migrations**, the oldest committed 2026-08-01 —
including security hardening that had been written, reviewed, merged and never
applied.

The `Compare repository and live migration ledgers` gate does **not** catch
this. It fails only on `applied_not_committed` (production ahead of repo). The
reverse direction, `committed_not_applied`, is tolerated by design.

**Before claiming a schema change is done, check that it is applied:**

```sql
select version, name from supabase_migrations.schema_migrations
where version = '<the version you merged>';
```

**To measure the whole gap:** diff `supabase/migrations/` filenames (first 14
chars) against `supabase_migrations.schema_migrations.version`.

## 2. Dependabot pull requests never run `Next.js Build`

**Verified 2026-08-13 on #1374.** In `.github/workflows/ci.yml` the `build` job
declares `needs: [smoke, env-check]`, and `env-check` ("Critical Env Secrets")
reads seven repository secrets. GitHub does not expose repository secrets to
Dependabot-triggered `pull_request` runs, so `env-check` fails and `build` is
skipped — along with `E2E`.

No dependency bump in this repository had ever been built before merge. That
blind spot was actively hiding a real break: `eslint` 10.8.1 aborts `eslint .`
with `contextOrFilename.getFilename is not a function`, because
`eslint-plugin-react` calls a rule-context method ESLint 10 removed.

**Verify dependency bumps locally** (`npm ci && npx eslint . && npx tsc --noEmit
&& npx next build && npm run test`) against a baseline built the same way, so
failures can be attributed rather than assumed. Landing several bumps as one
converged branch gets them a real CI build, because a branch in this repository
does receive secrets.

## 3. The evidence-log / migration-isolation deadlock

**Verified 2026-08-13 across #1386, #1387, #1388.** `AGENTS.md` asks every PR to
record a `docs/control/EVIDENCE_LOG.md` row. The Global Reg OS control workflow
triggers on changes to that file, and one of its jobs then asserts
`git diff --exit-code … -- supabase/migrations`.

A single PR that carries both a migration and its evidence row therefore fails
by construction. The two requirements are individually reasonable and jointly
unsatisfiable.

**Resolution that does not touch the control plane:** split into two PRs — the
migration alone, then the evidence row alone. Confirmed empirically:
`contracts-and-control` never appeared on the migration-only PRs and both
triggered and passed on the docs-only PR.

### 3a. The evidence log is not the only door into this deadlock

**Verified 2026-08-15 on #1368.** The paragraph above names
`docs/control/EVIDENCE_LOG.md` as the trigger, which is how the deadlock was
first met. It is not the only path. `global-reg-os-phase0-replacement.yml`
triggers on five paths:

```
docs/control/global-regulatory-os/**
scripts/global-reg-os/**
.github/workflows/global-reg-os-phase0-replacement.yml
docs/control/DATABASE_CONTROL.md
docs/control/EVIDENCE_LOG.md
```

#1368 does **not** touch `EVIDENCE_LOG.md`. It touches
`docs/control/DATABASE_CONTROL.md` and three migrations
(`20260808190000`, `20260808203000`, `20260810202000`), and
`contracts-and-control` fails on the same
`git diff --exit-code … -- supabase/migrations` assertion.

This matters more than the evidence-log case, not less. Recording a schema
change in `DATABASE_CONTROL.md` is arguably the *most* obligatory documentation
a migration PR can carry — so the gate is at its tightest exactly where a
migration is most correctly documented. Diagnosing this from the job log alone
is slow: the failing step prints the entire migration diff and then exits 1,
with no message naming the isolation rule, so it reads like a SQL error rather
than a policy assertion.

The same split resolution applies. Check the trigger list above, not just the
evidence log, before concluding a PR is safe from this.

## 4. `main` branch protection is documentation, not configuration

**Verified 2026-08-13.** `docs/control/MAIN_BRANCH_PROTECTION_SPEC.md` (merged
in #1371) records the required status checks. It has **not** been applied to the
GitHub repository settings, which is a dashboard action no agent can perform.

Until it is applied, nothing prevents direct pushes to `main`, and several have
happened — including a same-day push restoring an edge function, and four
transient `ci:` commits that staged and then removed verification workflows.

## 5. Mobile Command rail: single row, no scroll-snap

**Verified 2026-08-13 in #1391.** `tests/e2e/mobile-command-centre-v2.spec.ts`
enforces the rail contract through `assertSingleRowHorizontalRail`
(`flex-wrap: nowrap`, `overflow-x: auto|scroll`, one row, and real overflow) and
`expectHorizontallyOnScreen` (every destination fully inside the viewport after
`scrollIntoViewIfNeeded`).

Two ways this has been broken:

- **Adding `scroll-snap`.** `scroll-snap-type: x proximity` with
  `scroll-snap-align: center` makes the snap engine re-snap *after* the
  programmatic scroll, leaving a destination clipped. This produced
  `Command rail "Clinical" is still clipped after rail scroll at 320px wide`.
- **Making the rail wrap.** `flex-wrap: wrap` fails the contract outright. Note
  the Market rail (`[data-active-destination="marketplace"]`) is subject to the
  same assertion.

Neither behaviour exists on `main`. Do not reintroduce them.

## 6. A local Chromium harness is not font-faithful — CI is the oracle

**Verified 2026-08-13.** A standalone page built from this repo's real CSS is
reliable for **computed style** questions (`flex-wrap`, `overflow-x`,
`security_invoker`-style structural facts) and for **relative** before/after
comparison.

It is *not* reliable for pixel geometry. It failed to reproduce a 9px clipping
failure at all, and separately produced a false negative on a `requireOverflow`
assertion, because system fonts differ from the application's.

State which of those two categories a result belongs to, and defer to CI for
anything geometry-dependent.

## 7. Reviewing a large migration PR: execute it, do not read it

**Method used on #1367 (2035 lines, 7 migrations), 2026-08-13.**

1. `initdb` a local PostgreSQL 16 as a non-root user (`initdb` refuses root).
2. Create the Supabase role and schema shims the migrations assume: `anon`,
   `authenticated`, `service_role`, schema `auth` with `auth.uid()`,
   `auth.role()` and `auth.users`, plus `extension vector` and a minimal
   `storage.buckets` / `storage.objects`.
3. Replay all of `main`'s migrations in filename order to build the baseline,
   then apply the PR's on top.
4. Audit the result rather than the diff — per table: `relrowsecurity`, policy
   count, and grants to `anon`/`authenticated`; per view:
   `security_invoker` in `reloptions`.

On vanilla PostgreSQL 16 with pgvector installed, 824 of `main`'s 851 migrations
replay; the 27 failures are Supabase platform objects absent locally, not
defects. That is close enough to audit a PR against and should be stated as an
approximation.

This method found a real defect a diff-read would not: 32 policies calling a
`STABLE SECURITY DEFINER` helper unwrapped, re-evaluated per row.

## 8. RLS policies: wrap `auth.*` and STABLE helpers in a scalar subselect

`auth.uid()`, `auth.role()`, and any `STABLE` helper that calls them are
re-evaluated **once per candidate row** when called bare inside a policy
expression. Wrapping the call in `(SELECT …)` lets Postgres hoist it into an
InitPlan evaluated once per query. The value is identical, so this is a planner
change, not a policy change.

```sql
-- per row
USING (auth.uid() = user_id)
-- once per query
USING ((SELECT auth.uid()) = user_id)
```

`get_advisors(performance)` reports these as `auth_rls_initplan`. The count went
13 → 0 on 2026-08-13 once the fix was **applied** (see §1 — merging it had no
effect).

## 9. Known-standing issues an agent cannot fix

These are dashboard or account actions. Do not attempt code workarounds.

- **Duplicate Cloudflare Workers integration** on account
  `4a7c450c9c94195aa9c338f87fb4fb04` fails every build while the canonical
  account `c9bde393b456a8311bb15a6661ebf3c2` succeeds on the same commit. Fix is
  to disconnect the duplicate.

  Proven account-side, not code-side: the same failure occurred on the pull
  request that introduced *this file*, whose entire diff is two Markdown files.
  A documentation-only change cannot break a Worker build, and the canonical
  account built the identical commit successfully. Do not attempt an in-repo
  workaround, and do not treat a red `Workers Builds` check as evidence about
  the diff until the duplicate integration is disconnected — every PR carries
  one, which trains reviewers to ignore a check that could one day be real.
- **Vercel free-plan cap** (`api-deployments-free-per-day`, >100/day). When
  exhausted it blocks *production* deploys, not only previews.

  `scripts/vercel-ignore-wbcc-only.sh` skips builds for build-inert paths, which
  slows the burn — but it cannot rescue an already-exhausted account, because
  the cap is enforced when the deployment is *created*, before the ignore
  command runs. Observed on one pull request minutes apart, both commits
  documentation-only: the first reported `Canceled by Ignored Build Step`
  (the script ran and skipped), the second reported
  `Resource is limited - try again in 24 hours` (the script never ran).
  Treat the script as prevention, never as mitigation.
- **~350 stale branches.** Deleting them returns HTTP 403 for session tokens.
- **`20260810222500_harden_edge_function_cron_auth.sql`** fails
  `scripts/check-pending-production-migration-decisions.mjs` with a git blob
  mismatch — a pending migration edited after its content hash was bound. Needs
  a re-hash or a revert.

## 10. The pg_cron estate is production state with no version history

**Verified 2026-08-14.** The scheduled jobs in `cron.job` are live production
configuration that exists **nowhere in git**. The repository says so itself, in
`20260720200000_intel_editorial_pipeline_reconcile.sql`:

> the pg_cron jobs are environment state, not created here

So enabling, disabling or rescheduling a job leaves no commit, no diff, no
author and no reason. There is no way to tell a deliberate change from an
accident after the fact.

**The run history is not a substitute.** `cron.job_run_details` is pruned daily
by job `prune-cron-job-run-details` (03:23). A job that has not run recently has
no rows at all, so you cannot date a change from it either.

**What this cost.** On 2026-08-14, `hv-embed-every-30min` (jobid 13,
`SELECT public.hv_trigger_embed()`) was found at `active = false`, with no record
of when or why. `hv-extract` and `hv-score` stayed active, so signals kept
arriving and the feed looked alive. Nothing was red.

The disable could not be dated or attributed, which mattered:
`INTELLIGENCE_ARCHITECTURE_SPEC.md` §10 lists cron cadence versus the Nano
disk-I/O budget as an open owner decision, and §9 Guardrail 8 exists because
cron load degraded this database for two hours. Re-enabling therefore required
the owner, not an agent's judgement — purely because the record was missing.

**And a second lesson, which is why this paragraph is longer than it looks.**
The disabled job was initially assumed to be the writer of the stalled
`public.signals.embedding_1024` column, because 133 signals had accumulated
unembedded since 2026-08-11 and a disabled embed cron is the obvious culprit.
**That was wrong.** Re-enabling it returned HTTP 200 with
`processed: 10, errored: 0` — against `artifact_id` rows at **384 dimensions**,
via `provider: supabase_onnx`. `signals.embedding_1024` is **1024** dimensions
and is written by `lib/hf/pipeline/signalEmbedder.ts`, driven by
`/api/cron/embed-signals` and `/api/cron/embed-artifacts` — **neither of which
appears in any `vercel.json` cron or workflow.** The one scheduled route,
`/api/cron/intelligence-embed`, contains zero references to `embedding_1024`.

So there were two unrelated stalls, and the plausible-looking one was not the
reported one. This is Guardrail 1 in the spec — *verify the consumer/writer
before changing anything; check which column is actually populated, not which
function looks responsible.* A job name matching the symptom is not evidence.
The 1024-dim routing gap remains open and is not fixed by that cron.

**Baseline at 2026-08-14, so a future drift is detectable.** Inactive jobs:

| jobid | jobname | note |
|---|---|---|
| 13 | `hv-embed-every-30min` | re-enabled 2026-08-14 on owner instruction |
| 14 | `claude-signal-extraction` | still inactive; provenance unknown |
| 26 | `airtable-tier-pull` | still inactive; provenance unknown |

**Do this:**

- Before concluding the intelligence pipeline is healthy, check `cron.job.active`
  — not just whether rows are arriving. A downstream stage can be dead while
  upstream stages keep the feed looking live.
- Treat enabling or disabling a job as an owner decision, not a fix, unless it is
  actively harming the database. There is no record to tell you why it is in the
  state it is in.
- Record any change to cron state here, with the date and the reason. This
  section is the only audit trail that exists.

```sql
-- the check that would have caught it
select jobid, jobname, schedule, active from cron.job order by active, jobname;
```

## 10. A gate will fire on the prose that explains it

**Verified 2026-08-15, seven times in one session.** Two of the seven reached
`main` and turned the whole pull-request queue red.

Several gates here are literal greps over the working tree. They do not
distinguish a defect from a description of a defect:

| Gate | Matches on | Excludes |
|---|---|---|
| `check-placeholder-landmines` | five placeholder phrases | `docs/`, `node_modules`, `.next` |
| `check-no-secret-strings.mjs` | assignments to sensitive identifiers | — (reads committed `HEAD`) |
| `check-environment-manifest.mjs` | `secrets.NAME` / env references in workflows | — |
| `check-project-registry-discipline.mjs` | literal checklist phrases in the PR body | — |

What actually happened, all on the same day:

- A comment in `scripts/reconstruct-stub-migrations.mjs` **quoted two of the
  five placeholder phrases** while listing which gates the stub migrations
  slipped past. Merged. `check-placeholder-landmines` went red on `main`.
- A comment in `.github/workflows/reconstruct-stub-migrations.yml` wrote
  `secrets.X` inline while explaining that the `secrets` context is
  unavailable in a step-level `if:`. The manifest checker read `X` as an
  unclassified variable.
- Rewording a PR body for style dropped the phrase `no registry change
  required`, which `check-project-registry-discipline.mjs` greps for verbatim.
  `Enforce registry impact discipline` went from green to red with **no code
  change at all**.

**Rules that follow:**

1. **Prose about a grep-based gate belongs under `docs/`.** Every one of these
   gates excludes `docs/`. A comment in a `.mjs`, `.ts`, `.sql` or workflow
   file does not have that protection. Describe the rule and link to its
   implementation; never quote its patterns inline.
2. **PR-body checklist wording is load-bearing.** It is matched by literal
   phrase. Add explanation *after* the canonical phrase, never in place of it.
3. **`check-no-secret-strings.mjs` reads committed `HEAD`, not the working
   tree.** Running it after editing but before committing reports the *old*
   result. This produced a commit message in this session that claimed
   `secret scan GO` on a commit where the scanner exits 1.

**Second-order effect worth expecting.** Fixing one gate can feed another. The
secret scanner rejects `export SENSITIVE_NAME="${VAR}"` — it unwraps the quotes
and tests the result as a literal without re-checking its own
`shellVariableReference` rule, so the *safer quoted form* is the one that fails.
The workaround (`export TEST_EMAIL TEST_PASSWORD`, exporting names already
assigned) is correct, but it put two new names on the workflow's environment
surface and broke `check-environment-manifest.mjs`. Budget for the second gate
when you satisfy the first.

**Diagnostic shortcut.** If a gate fails on a pull request whose diff cannot
plausibly affect it — a docs-only or comment-only change — suspect `main`
rather than the branch. These gates run on pull requests, so a broken `main`
presents as a broken branch. That is how all three of this session's `main`
regressions were found: on #1367, which was green before being refreshed and
showed four failures immediately after, three of which were never its own.
