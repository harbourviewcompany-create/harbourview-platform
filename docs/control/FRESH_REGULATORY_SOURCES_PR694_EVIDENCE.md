# PR #694 Fresh Regulatory Sources Evidence

Updated by ChatGPT on 2026-06-11.

## Branch state

- PR: #694 Fresh regulatory sources engine
- Branch: fresh-regulatory-sources-engine
- Head after public-feed cleanup: ec5093804db559db9333cb84c0b1201102eeedd7
- Branch was updated using GitHub merge commit f5e64cb13e8b56279f0d15ea8333b026f89166fa before the public-feed cleanup commit.
- CI trigger-only update: 2026-06-11T16:28:00Z, documentation-only, no product/runtime scope change.

## Completed in branch

- Preserved Fresh Sources Engine files already in PR.
- Removed fallback regulatory signal fixtures from lib/regulatory-signals/public.ts.
- Public signal feed now reads only from regulatory_signals.public_signals.
- Added private source snapshot and source check-run tables in migration.
- Added watcher library and seed/check scripts.
- Added admin signal summary, sources, and review pages.
- Added watcher unit test file.
- Added package.json scripts for source-regulatory:seed, source-regulatory:check, and test:regulatory-sources.
- Hardened lib/regulatory-signals/public.ts to use no-store dynamic public reads and safe empty-state behavior when Supabase public env/data is unavailable.

## Public DTO/static leakage check

lib/regulatory-signals/public.ts now selects only:

- id
- slug
- headline
- signal_type
- confidence
- impact_level
- country_code
- country_name
- region
- jurisdiction
- regulator_name
- signal_date
- source_tier
- source_type
- canonical_source_url
- public_summary
- public_implication
- published_at
- last_reviewed_at

It does not select raw_text, storage_path, watcher errors, analyst notes, private notes, internal review fields, source snapshots, source check runs, or evidence bodies.

## CI evidence available from GitHub

- Type check workflow: success on prior PR run before latest trigger-only doc commit.
- Regulatory Signals Verify workflow: failure at Build step on an older PR merge ref after Typecheck passed; downstream regulatory leakage/contract steps were skipped.
- Branch Verification workflow: failure at Build step on an older branch head after install, typecheck, public visibility, listing quality, public images, and services public leakage passed.
- Low-Friction Branch Verification: failure at changed-file scope check, expected for a runtime/schema/package PR.
- Project Registry Discipline: failure at project registry discipline check because PR registry impact metadata remains incomplete.
- New Products Equipment workflow: typecheck and public visibility passed; new-products-equipment intake failed.

## Not completed

- Local/runtime commands were not executed in this environment.
- Supabase seed/check commands were not executed in this environment because no runtime checkout plus Supabase env was available.
- Current-head GitHub Actions verification for the no-store hardening patch is pending this trigger-only documentation commit.

## Required manual/runtime commands

```bash
npx vitest run tests/regulatory-sources/watcher.test.ts
npm run typecheck
npm run build
npx tsx scripts/seed-regulatory-sources.ts
HARBOURVIEW_SOURCE_CHECK_LIMIT=5 npx tsx scripts/check-regulatory-sources.ts
```

## GO/HOLD

HOLD for production merge until:

- build failure in Regulatory Signals Verify is fixed or current-head Build passes,
- Supabase seed/check evidence proves at least five successful source checks,
- source_snapshots row count and IDs are captured,
- draft regulatory signal count and IDs are captured,
- public DTO leakage test runs after build,
- PR registry impact metadata is completed or explicitly waived.
