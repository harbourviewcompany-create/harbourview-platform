# `main` Branch Protection — Required Configuration

Status: **Draft spec — not yet applied.** Applying it changes GitHub repository settings and is Tyler's decision.
Authority: concrete configuration for the branch-protection step deferred as Stage 3 in `docs/control/RELEASE_SAFETY_ADOPTION.md`.
Scope: the `main` branch of `harbourviewcompany-create/harbourview-platform` only.

## Why this exists

`AGENTS.md` records that `main` has no branch-protection rule and treats that as an open gap. On 2026-08-12 the gap produced a real outage:

- Four PRs merged to `main` within 20 seconds (15:00:35–15:00:55 EDT).
- `main`'s CI run for `a8c05ed9` completed as **`failure`** at 19:00:59 UTC. Nothing blocked it and nothing alerted.
- `main` was left unable to `next build`, so no production deployment succeeded from it. Production served older code for roughly 2.5 hours until #1369 merged.
- Every open PR inherited the failure and reported `mergeable_state: blocked`, which is why "branches were not merging".

CI concurrency was the second half of the same incident and is fixed separately in `ci.yml`, `migration-drift-check.yml` and `mobile-command-centre-v2-visual.yml`. That fix guarantees every commit on `main` *gets* a verdict; this spec is what makes a bad verdict actually stop a merge.

## Required status checks

Use these exact context names — they are the `name:` values of the `ci.yml` jobs, not the job ids.

| Context | Job id |
|---|---|
| `Install` | `install` |
| `Type Check` | `typecheck` |
| `Critical Env Secrets` | `env-check` |
| `Security / Leakage` | `security` |
| `Domain Logic` | `domain` |
| `Intake & Listings` | `intake` |
| `Signal Engine Runtime` | `signal-engine` |
| `Smoke Tests` | `smoke` |
| `Next.js Build` | `build` |

Settings:

- **Require status checks to pass before merging** — on.
- **Require branches to be up to date before merging** — on. Without it a PR can be green against a stale base and still break `main`, which is exactly the state #1365–#1368 were in after `main` was fixed.
- **Do not** include `E2E (Playwright)`. It is push-to-`main`-only, so it never reports on a PR and would block every merge permanently.

### Required-check footgun: skipped counts as passed

GitHub treats a **skipped** required check as satisfied. `ci.yml` is a `needs` chain:

```
install → typecheck → {security, domain, intake, signal-engine} → smoke → build → e2e
```

When `Type Check` fails, everything downstream reports `skipped`, not `failure`. If only downstream jobs such as `Next.js Build` were required, a typecheck failure would present as a set of satisfied skipped checks and merge anyway — the same masking that hid the stale-test failure on 2026-08-12 until the typecheck was fixed.

**Therefore the whole chain above must be required, including `Install` and `Type Check`.** Requiring only the leaves is worse than requiring nothing, because it looks protected.

## Deliberately not required

These are red for reasons unrelated to code quality; requiring them would block all merges.

- `Workers Builds: harbourview-platform` on Cloudflare account `4a7c450c…` — a duplicate integration that fails on essentially every PR regardless of content. The primary account `c9bde393…` succeeds. This wants cleanup, not enforcement.
- `postgres-17` / `contracts-and-control` — these run only on paths under `docs/control/global-regulatory-os/**` and related control files, so they do not report on most PRs.
- Third-party reviewers (`Sourcery review`, `CodeRabbit`, Codex) — these rate-limit and report `skipped` or advisory states.

## Open question for Tyler

Whether to also enable **Require a pull request before merging**. `AGENTS.md` already forbids direct pushes to `main` as policy; enforcing it in settings would make the policy technical rather than honour-system. The trade-off is that it removes the ability to hotfix `main` directly during an incident.

## Verification once applied

1. Open a throwaway PR containing a deliberate type error; confirm `Type Check` fails and the merge button is blocked.
2. Confirm the downstream `skipped` jobs do **not** present as satisfying the gate.
3. Revert the throwaway PR without merging.
4. Record the result in `docs/control/EVIDENCE_LOG.md`.
