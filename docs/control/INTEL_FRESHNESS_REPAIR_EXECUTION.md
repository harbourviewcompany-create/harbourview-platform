# Intel freshness and briefing repair

As of 2026-08-28 UTC, this branch is the bounded repair path for the mobile Intel first-paint swap, signal freshness semantics, jurisdiction ranking, briefing binding, jurisdiction synthesis freshness, scheduler delivery, and the concrete build/deployment blockers required to ship those changes.

## Scope control

In scope: canonical signal timeline semantics; seven-day Weekly Signals freshness; duplicate suppression; exact jurisdiction identity; mobile realtime wiring; Personal Briefing binding to live briefing payloads; bounded jurisdiction synthesis; off-domain/cross-jurisdiction synthesis rejection; synthesis scheduling; targeted tests; production schema preflight; exact-head build/deployment verification.

Out of scope: unrelated marketplace behavior, unrelated database migrations, broad source-engine redesign, changes to `daily_digest`, and unrelated product surfaces.

## Execution boundary

Routine branch verification is read-only against production. Production briefing regeneration is permitted only through the explicit `Intel Freshness Production Closeout` gate after the timeline migration is confirmed applied. The closeout workflow does not expose production credentials to dependency installation, tests, or build steps. A push runs the production-write job only when the commit message contains `[intel-production-closeout]`; manual dispatch remains available after the workflow is present on the default branch.

## Verification required for GO

- Targeted freshness/mobile tests green.
- Typecheck green.
- Isolated CI build green.
- Production-configuration build green.
- Timeline migration confirmed in production and timeline columns queryable through the canonical API schema.
- Final exact-head bounded regeneration green across all configured synthesis markets.
- Vercel preview admitted and READY for the exact repair head.
- Mobile Intel verifies no stale first-paint swap and excludes the historical Slovenia/Texas examples as current developments.
- Production deployment READY after merge, with synthesis cron registered and current briefing timestamps re-queried.

## Exact-head closeout trigger — 2026-08-28 04:01 UTC

The immediately preceding repair head `e89e67f95a1e5515a3f7042a29bf116ea6fd9b31` passed `Intel Freshness and Briefing Verify` run `33138103527`, including the targeted freshness/mobile regressions, typecheck, isolated CI build, and production-configuration build. `Project Registry Discipline` subsequently passed in run `33138203761`, and all inline CodeRabbit review threads on PR #1662 were resolved after verifying the current branch implementations.

This documentation-only checkpoint intentionally carries the `[intel-production-closeout]` commit marker so the guarded branch workflow reruns the same exact-head gates, re-confirms the production timeline contract, and only then performs the bounded prompt-v5 jurisdiction briefing regeneration. This checkpoint is a trigger/evidence record, not a claim that production closeout has already passed.

## Current decision

HOLD until the final exact-head regeneration, Vercel READY preview, merge, and live production verification are complete.
