# PR-triggered workflow privilege audit, 2026-09-17

**Status: findings only, nothing fixed. The two `governance-gate` checks this
document covers (`PR PRODUCTION SECRET`, `PR TRUST-BOUNDARY`) fail on main
today and have not been remediated. Nothing in this document has been applied.**

## Background

While bringing `governance-gate` up to a working state (see the ruleset fix in
PR #1961 and the `main-protection` ruleset itself, updated live via the
GitHub API on 2026-09-17), two of the script's checks kept failing
independent of anything this session touched:

- `PR PRODUCTION SECRET` — a `pull_request`-triggered workflow references one
  of `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_SERVICE_ROLE_KEY`, or `VERCEL_AUTOMATION_BYPASS_SECRET`.
- `PR TRUST-BOUNDARY` — a workflow both (a) explicitly handles PR head
  content (`github.event.pull_request.head.sha`,
  `.head.repo.full_name`, or a `refs/pull/.../merge|head` fetch) and (b) has
  `contents: write` or one of the same five secrets.

Confirmed both fail identically on current main — this is pre-existing, not
introduced by anything in this session's PRs.

## Why this matters here specifically

Checked rather than assumed: **this repository is public**
(`private: false`) **and forking is enabled** (`allow_forking: true`),
confirmed directly via the GitHub API on 2026-09-17. That matters because
GitHub's standard protection against exactly this class of risk —
`pull_request`-triggered workflows do not receive repository secrets when the
PR comes from a fork, by default — only holds if that default hasn't been
overridden. I could not confirm one way or the other via the API whether it
has been (the relevant toggle, "Send secrets to workflows from fork pull
requests," doesn't appear to be exposed on the `actions/permissions` or
`actions/permissions/workflow` endpoints I checked; it may only be visible in
the repo's Settings > Actions UI). A spot check of the 20 most recent PRs
(#1957-#1980) found all of them opened from branches in this same repository,
not forks — consistent with the observed pattern that all current activity is
internal (Claude/Codex sessions pushing directly to
`harbourviewcompany-create/harbourview-platform` branches) — but that is
current practice, not a structural guarantee: the repo's own settings permit
an external fork PR at any time. **Whether these findings are "pre-existing
but currently inert" or "pre-existing and live" turns on that one setting,
and I couldn't verify it.**

## The two findings

### 10 workflows reference production secrets on `pull_request`

```
.github/workflows/decision-intel-first-slice-verify.yml
.github/workflows/clinical-prescriber-os-reconciliation-visual.yml
.github/workflows/mobile-command-centre-v2-visual.yml
.github/workflows/jurisdiction-command-visual.yml
.github/workflows/mobile-genetics-command-visual.yml
.github/workflows/clinical-evidence-v1-1-verify.yml
.github/workflows/p0-org-onboarding-regression-verify.yml
.github/workflows/migration-drift-check.yml
.github/workflows/clinical-evidence-operating-system-verify.yml
.github/workflows/education-command-visual.yml
```

`migration-drift-check.yml` is the one file in this list that is *not* also
in the trust-boundary list below: its `check-drift` job uses
`SUPABASE_ACCESS_TOKEN` (a Supabase management-API token) to compare the
local migration list against the live ledger, but the job runs code from the
base repository, not from the PR's own branch — the secret is used by
trusted code, only the *trigger* is PR-controlled. Lower severity than the
other nine, but still worth someone deciding whether a read-only drift
comparison needs to run on every PR versus on a schedule or a labeled
trigger.

### 9 of those also check out untrusted PR head content in the same job

```
.github/workflows/decision-intel-first-slice-verify.yml
.github/workflows/clinical-prescriber-os-reconciliation-visual.yml
.github/workflows/mobile-command-centre-v2-visual.yml
.github/workflows/jurisdiction-command-visual.yml
.github/workflows/mobile-genetics-command-visual.yml
.github/workflows/clinical-evidence-v1-1-verify.yml
.github/workflows/p0-org-onboarding-regression-verify.yml
.github/workflows/clinical-evidence-operating-system-verify.yml
.github/workflows/education-command-visual.yml
```

These are the "visual evidence" / "exact-head verify" workflows this session
ran into repeatedly (#1702, #1863, #1867) while trying and failing to reach
their logs — they check out the PR's own head commit, build it, stand up a
local Supabase instance, and compare rendered output against live production
data for visual-regression evidence. That's exactly the combination the
check flags: code from the PR's own branch, running with production-adjacent
credentials, in the same job. If the fork-secrets default is intact, this is
inert today (no fork PR has ever run one) but would activate the moment one
did. If that default has been overridden, it's live now.

## What this is not

Not a claim that any of this has been exploited, and not a claim that the
intended design (visual evidence built from the PR's own changes, compared
against real data) is wrong — the risk is specifically the *combination* of
untrusted-checkout and secret-access in one job, not the evidence-gathering
goal itself. Not a recommendation to rip out the visual-evidence workflows
this session spent real effort understanding; several plausible fixes
preserve the goal (see below).

## Possible remediations, not evaluated in depth

Left for whoever picks this up, since choosing between them requires product
context this document doesn't have:

- Turn off "send secrets to fork PR workflows" explicitly at the repo level
  (if it's on) or confirm it's off (if it's already the default) — settles
  the "inert vs. live" question directly and may be the whole fix.
- Split each flagged workflow into two jobs: an unprivileged job that builds
  and renders from the PR's own code (no secrets), and a privileged job that
  only reads already-produced, non-executable artifacts (screenshots, JSON)
  to compare against production data — the standard fix for this exact
  GitHub Actions pattern.
- Restrict these workflows to `pull_request_target` with an explicit
  approval gate for first-time/external contributors, if same-repo-only PRs
  stop being a safe assumption.
- Move `migration-drift-check.yml`'s live comparison off the `pull_request`
  trigger entirely (schedule, or `workflow_dispatch` after merge).

## Evidence

See `EVIDENCE_LOG.md` 2026-09-17 entry for the pointer into this file.
