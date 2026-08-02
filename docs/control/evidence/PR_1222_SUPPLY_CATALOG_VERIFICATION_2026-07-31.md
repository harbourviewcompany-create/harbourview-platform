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

## Initial production deployment failure

Vercel automatically created a production deployment from the original merged main commit:

- Deployment ID: `dpl_9qjwuJUGKUPCSqxCh45f5JrPwLyL`
- Deployment URL: `https://harbourview-ojq600tyg-harbourview.vercel.app`
- Target: `production`
- Source branch: `main`
- `githubCommitSha`: `dc827cba55066ad812214734115cb6d31bded197`
- Final state: `ERROR`
- Error code: `lint_or_type_error`
- Failed command: `npm run build`

The failure exposed stale mobile jurisdiction-playbook rendering in `components/dashboard/MobileCommandCentre.tsx`: `steps` was typed as `string[]`, and `key_regulators` was typed as `{ primary: string; secondary: string[] }`, while the mobile renderer still consumed older object/array shapes.

## Focused production repair — PR #1236

Repair PR: `#1236`
Branch: `repair/mobile-playbook-steps-production`
Final verified head: `eb1f4ecc3aa014dff30ad3702402ac6ee56c90bc`
Merge method: squash
Merged production-repair commit: `58a1523c3e74d72a9ed5d6be12ffb03d2eefc4bb`

The final runtime diff was limited to:

- `components/dashboard/MobileCommandCentre.tsx`

The repair aligned:

- `jurisdictionPlaybook.steps` with the canonical `string[]` data shape; and
- `jurisdictionPlaybook.key_regulators` with the canonical `{ primary: string; secondary: string[] }` data shape.

No database, DTO, route, supply-catalog, dependency, migration, or persistent workflow change was included in the final PR diff.

### PR #1236 verification results

All required final-head workflows completed successfully:

| Workflow | Run ID | Conclusion |
|---|---:|---|
| Type check | `30726830673` | success |
| Migration Drift Check | `30726830680` | success |
| HAR-39 HAR-40 Public Surfaces | `30726830709` | success |
| Project Registry Discipline | `30726830691` | success |
| PR 166 New Products Equipment Verification | `30726830674` | success |
| Regulatory Signals Verify | `30726830684` | success |
| Branch Verification | `30726830711` | success |
| CI | `30726830710` | success |

Branch Verification included TypeScript validation, tests, public visibility and leakage checks, production build, and route/probe stages. Migration Drift Check completed successfully without any migration changes in the repair PR.

### Repair preview deployment

- Deployment ID: `dpl_58q788zC7W61w5vxZbPBZWZs1mDk`
- Deployment URL: `https://harbourview-5o3o3minz-harbourview.vercel.app`
- Target: `preview`
- `githubCommitSha`: `eb1f4ecc3aa014dff30ad3702402ac6ee56c90bc`
- Final state: `READY`

## Recovered production deployment

The squash merge of PR #1236 triggered a production deployment from the exact repair commit:

- Deployment ID: `dpl_GF9dqqSyxUissrotqFFG6hYBAB1U`
- Immutable deployment URL: `https://harbourview-3hjlc303w-harbourview.vercel.app`
- Production alias verified: `https://harbourview.vercel.app`
- Target: `production`
- Source branch: `main`
- `githubCommitSha`: `58a1523c3e74d72a9ed5d6be12ffb03d2eefc4bb`
- Final state: `READY`

Vercel build logs confirmed successful dependency installation, Next.js compilation, TypeScript validation, page-data collection, static generation, and deployment completion.

## Production route verification

### `/supply`

- Requested URL: `https://harbourview.vercel.app/supply`
- HTTP status: `200`
- Page title: `Supply Catalog | Harbourview | Harbourview`
- Required visible text confirmed:
  - `Harbourview Supply`
  - `Browse the catalog`
  - `Request a Quote`

### `/supply/cr-mylar-pouch-3-5g-matte-black`

- Requested URL: `https://harbourview.vercel.app/supply/cr-mylar-pouch-3-5g-matte-black`
- HTTP status: `200`
- Matched route: `/supply/[slug]`
- Page title: `Child-Resistant Mylar Pouch — 3.5g (Matte Black) | Harbourview Supply | Harbourview`
- Required visible text confirmed:
  - `Harbourview Supply`
  - `Child-Resistant Mylar Pouch — 3.5g (Matte Black)`
  - `Commercial review`

## Public-boundary and migration evidence

The final repair head passed:

- Public-surface and leakage verification: `30726830709`
- New-products/equipment public-boundary verification: `30726830674`
- Branch Verification, including public visibility/leakage and production build: `30726830711`
- Migration Drift Check: `30726830680`

The repair did not change the dedicated public supply DTO, migrations, database records, route contracts, or the 68 canonical supply slugs.

## Final release checklist

- [x] PR #1222 squash-merged to main
- [x] Original failed production deployment and blocking defect recorded
- [x] Focused repair PR #1236 limited to the confirmed component defect
- [x] Typecheck passed
- [x] Tests passed
- [x] Production build passed
- [x] Public leakage checks passed
- [x] Migration drift check passed
- [x] Repair preview reached READY with matching commit
- [x] PR #1236 squash-merged after all gates passed
- [x] Recovered production deployment reached READY with matching merge commit
- [x] Production `/supply` returned HTTP 200 with expected title and visible text
- [x] Production `/supply/cr-mylar-pouch-3-5g-matte-black` returned HTTP 200 with expected title and visible text

## Decision

**GO.**

The Harbourview Supply catalog is deployed to production from repaired main commit `58a1523c3e74d72a9ed5d6be12ffb03d2eefc4bb`. The production deployment is READY, both required Supply routes return HTTP 200 with the expected titles and visible content, and the final typecheck, test, build, public-boundary, leakage, and migration-drift gates are green.
