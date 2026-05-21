# HAR-39 / HAR-40 Public Surfaces Evidence

## Scope

Clean follow-up from current `main` for remaining Track 2 public-platform scope after merged PR #317.

## Forbidden systems not touched by this PR

- Supabase migrations or policies
- RLS
- Auth/session logic
- Environment variables
- Vercel config/settings
- Package manager files
- Lockfiles
- Production data
- Secrets
- Admin authorization
- Private evidence records
- Source URL/provenance storage
- Marketplace DTO allowlists

## HAR-39 public-surface coverage

This PR adds/links public-safe intelligence request workflows:

- Source-engine request workflow
- Watchlist request and triage concepts
- Market, company, policy, counterparty, category and route monitoring paths
- Boundary language preventing raw evidence, source URLs, sourceEvidence, provenanceSummary, internal review notes, private contacts or live counterparty intelligence from being public content

## HAR-40 public-surface coverage

This PR adds/links public-safe education/compliance/professional surfaces:

- Compliance readiness
- Export/import readiness
- Pharmaceutical and medical cannabis education boundaries
- Cannabis history and market-development library surface
- Regulatory change tracking entry point
- Copy-safety language against legal, medical, investment, regulatory and compliance-advice overclaiming

## Verification commands required before merge

```bash
node scripts/test-har39-har40-public-surfaces.mjs
npm run typecheck
npm test
npm run build
```

Run the available public leakage probe for the preview URL before closure.

## GO/HOLD

HOLD until CI or reviewer-run evidence confirms typecheck, tests, build, HAR-39/HAR-40 route/copy guard, leakage/public visibility scan, and changed-file review against forbidden systems.
