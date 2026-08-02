# PR #1222 — Harbourview Supply Catalog Release Evidence

Date: 2026-08-01
PR: `#1222`
Merge method: squash
Merge status: merged to `main`
Merged main commit: `dc827cba55066ad812214734115cb6d31bded197`

## Merge result

PR #1222 was merged using the repository's established squash-merge method. GitHub returned `Pull Request successfully merged` with resulting main commit `dc827cba55066ad812214734115cb6d31bded197`.

## Pre-merge verification retained

The protected preview verification completed successfully before merge:

- Workflow: `PR 1222 Supply Visual Verification`
- Run ID: `30721698176`
- Verification head: `79c5771fd6d8df7a24870e5a48bf1f39b192a967`
- Protected-route artifact ID: `8825076280`
- Protected-route artifact SHA-256: `6b5feef3728332caf4f9eda467606ee5b17f6dd47e71942d53da945680c0a8e3`
- Responsive screenshot artifact ID: `8825076123`
- Responsive screenshot artifact SHA-256: `4f7b74ae9f567be4aadc54ba2e83de295828e1c04c8247030ee3d3ceb48e892a`

The preview routes returned HTTP 200, preserved their effective URLs, exposed the expected titles and visible text, and did not redirect to Vercel SSO.

## Production deployment attempt

Vercel automatically created a production deployment from the merged main commit:

- Deployment ID: `dpl_9qjwuJUGKUPCSqxCh45f5JrPwLyL`
- Deployment URL: `https://harbourview-ojq600tyg-harbourview.vercel.app`
- Target: `production`
- Source branch: `main`
- `githubCommitSha`: `dc827cba55066ad812214734115cb6d31bded197`
- Final state: `ERROR`
- Error code: `lint_or_type_error`
- Error step: `buildStep`
- Failed command: `npm run build`

The build cloned the correct main commit, installed dependencies, compiled the application bundle, and then failed during TypeScript validation.

### Blocking TypeScript defect

File:

`components/dashboard/MobileCommandCentre.tsx:3201`

Error:

`Property 'step' does not exist on type 'string'.`

The failing render maps `jurisdictionPlaybook.steps`, whose current type is `string[]`, while the component still accesses object properties including `s.step`, `s.title`, and `s.description`.

This is a production-release blocker because the merged main commit cannot complete `next build` and therefore cannot become the active production deployment.

## Production route requests

The production alias remained on the prior successful deployment because the new production deployment failed.

### `/supply`

- Requested URL: `https://harbourview-harbourview.vercel.app/supply`
- HTTP status: `404`
- Matched path: `/404`
- Page title included: `404: This page could not be found.`
- Required Supply catalog text was not present.

### `/supply/cr-mylar-pouch-3-5g-matte-black`

- Requested URL: `https://harbourview-harbourview.vercel.app/supply/cr-mylar-pouch-3-5g-matte-black`
- HTTP status observed through the authenticated Vercel fetch path: `302`
- Redirect target: Vercel SSO endpoint
- Application-level product response was not reached.

Production route verification therefore failed.

## Public leakage and migration-drift checks

The release sequence did not reach a deployable main build. The production public-leakage and migration-drift gates could not be accepted as post-merge production evidence.

Pre-merge branch evidence remains green, including:

- Public-surface and leakage workflow run `30721698156`
- Migration Drift Check run `30721698175`
- CI run `30721698172`
- Branch Verification run `30721698199`

Those runs validate the pre-merge verification head, not the failed merged production build. They cannot substitute for a successful post-merge production release gate.

## Release checklist

- [x] PR #1222 squash-merged to main
- [x] Resulting main commit recorded
- [x] Production Vercel deployment created from the exact merged commit
- [ ] Production Vercel deployment reached READY
- [ ] `npm run build` passed on merged main
- [ ] Production `/supply` returned HTTP 200 with expected title and visible text
- [ ] Production `/supply/cr-mylar-pouch-3-5g-matte-black` returned HTTP 200 with expected title and visible text
- [ ] Post-merge production public-leakage gate accepted
- [ ] Post-merge migration-drift gate accepted

## Decision

**HOLD.**

PR #1222 is merged, but the merged main commit is not production-releasable. The production deployment failed TypeScript validation in `components/dashboard/MobileCommandCentre.tsx`, and the active production alias does not serve the new Supply routes. A focused follow-up fix must align the mobile jurisdiction-playbook rendering with the current `string[]` step shape, pass the full main build and required checks, deploy successfully to Vercel production, and then repeat both production route probes and release gates.