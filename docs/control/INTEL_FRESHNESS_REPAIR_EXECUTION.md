# Intel freshness and briefing repair

As of 2026-08-28 UTC, this branch is the bounded repair path for the mobile Intel first-paint swap, signal freshness semantics, jurisdiction ranking, briefing binding, jurisdiction synthesis freshness, scheduler delivery, and the concrete build/deployment blockers required to ship those changes.

## Scope control

In scope: canonical signal timeline semantics; seven-day Weekly Signals freshness; duplicate suppression; exact jurisdiction identity; mobile realtime wiring; Personal Briefing binding to live briefing payloads; bounded jurisdiction synthesis; off-domain/cross-jurisdiction synthesis rejection; synthesis scheduling; targeted tests; production schema preflight; exact-head build/deployment verification.

Out of scope: unrelated marketplace behavior, unrelated database migrations, broad source-engine redesign, changes to `daily_digest`, and unrelated product surfaces.

## Execution boundary

Routine branch verification is read-only against production. Production briefing regeneration is permitted only through the explicit `Intel Freshness Production Closeout` gate after the timeline migrations are confirmed applied. The closeout workflow does not expose production credentials to dependency installation, tests, or build steps. A push runs the production-write job only when the commit message contains `[intel-production-closeout]`; manual dispatch remains available after the workflow is present on the default branch.

## Verification required for GO

- Targeted freshness/mobile tests green.
- Typecheck green.
- Isolated CI build green.
- Production-configuration build green.
- Timeline migrations confirmed in production and timeline columns queryable through the canonical API schema.
- Final exact-head bounded regeneration green across all configured synthesis markets.
- Vercel preview admitted and READY for the exact repair head.
- Mobile Intel verifies no stale first-paint swap and excludes the historical Slovenia/Texas examples as current developments.
- Production deployment READY after merge, with synthesis cron registered and current briefing timestamps re-queried.

## Production timeline state — 2026-08-28 14:03 UTC

- `20260827234500_signal_freshness_timeline` is applied in production.
- The population hardening repository migration was moved from the occupied `20260828130000` version to canonical version `20260828143000`; production already used `20260828130000` for the unrelated Network release hardening migration.
- `20260828143000_signal_timeline_population_hardening.sql` was applied through the connected Supabase migration API after exact-head targeted tests, typecheck, isolated build, production-config build, migration SQL parse, and migration-drift gates passed. Supabase recorded apply-time version `20260828140346`.
- The apply-time equivalence is recorded in `supabase/release-controls/migration-live-version-equivalences.json`, pinned to canonical blob `7ead22876aead1bfd567d228c5441d5ffce1abff`.
- Postflight found zero remaining valid `analysis.publication_date` or `analysis.effective_date` backfill candidates; populated explicit timeline counts became 81 source-publication timestamps and 48 event-effective timestamps.

## Exact-head closeout trigger — 2026-08-28 14:04 UTC

The current branch has the prompt-v6 bounded synthesis implementation. The prior code candidate passed the dedicated Intel freshness verification gates, and the production hardening migration is now applied and attested. This documentation-only checkpoint intentionally carries the `[intel-production-closeout]` marker so the guarded branch workflow reruns the exact-head regressions, typecheck and production-config build before any production briefing writes, re-confirms the production timeline contract, and then regenerates all configured synthesis markets from the prompt-v6 implementation.

This checkpoint is a trigger/evidence record, not a claim that production closeout has already passed.

## Current decision

HOLD until the final exact-head regeneration, Vercel READY preview, merge, and live production verification are complete.
