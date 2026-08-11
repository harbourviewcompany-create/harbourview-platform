# Russia Globe Incident — Final Closeout

Date: 2026-08-10
Status: **CLOSED / GO**
Scope: Harbourview interactive globe — Russia top-face triangulation / black interior void regression
Production URL: `https://harbourview.vercel.app`

## Final state

The Russia globe incident is closed. The production deployment built from merge commit `4533c9223377eb2e60c0fc8d3be48bd522d15806` (PR #1322) passed final live WebGL verification at all required mobile viewports and both required camera states.

Acceptance result across all six live production screenshots:

- no black interior void;
- no triangular cutout;
- no blown/seam triangulation artifact;
- no recurrence after manual globe rotation;
- no new visual regression relative to the verified pre-merge branch render.

Final incident verdict: **GO**.

## Defect baseline — PR #1306 production verification

The final broken baseline is the production visual artifact generated before the definitive spherical-triangulation correction:

- workflow run: `31408538270`
- artifact: `9070776475`
- artifact name: `harbourview-pr1306-russia-production-visual`
- artifact digest: `sha256:a6a2025bed8ef2c1e766d27dbfade94fe962f706d6a7f2af4536087c21cd91d5`
- verification branch/head: `verify/pr1306-production-russia-visual-20260810` / `b3e409fc4ab83381213cb5e2fa00b8d5e1e2aff9`

The six baseline screenshots and their SHA-256 identities are recorded in `docs/control/evidence/russia-globe-20260810/SCREENSHOT_SHA256.txt`. This baseline is the canonical visual proof of the pre-fix Russia interior-void / triangular-cutout failure.

## Definitive fix — PR #1322

PR #1322, `fix(globe): eliminate Russia spherical triangulation void`, merged successfully:

- PR: `#1322`
- PR head: `7ab9813cdafe84e6a6f254ba44f98bee1a5152b4`
- merge commit / production source SHA: `4533c9223377eb2e60c0fc8d3be48bd522d15806`
- production fix: long Earcut top-face edges are conformingly refined before projection to the globe so long planar chords cannot dip below the ocean sphere and appear as black wedges.
- deterministic regression coverage includes Russia plus antimeridian-sensitive geometries.

Verified pre-merge visual evidence:

- workflow run: `31425772532`
- artifact: `9077223807`
- artifact name: `russia-preview-before-after-webgl`
- artifact digest: `sha256:7360ba79ec5cca8beeb587df78f89c4228d4f6a4ca614145a50525c00cc37d4b`

The six passing pre-merge screenshot hashes are also recorded in the screenshot checksum ledger.

## Final production verification

A fresh post-production Playwright/WebGL run targeted the canonical production alias after PR #1322 was merged and deployed.

- production SHA: `4533c9223377eb2e60c0fc8d3be48bd522d15806`
- GitHub verification run: `31437155015`
- artifact: `9081533583`
- artifact name: `harbourview-pr1322-russia-production-final`
- artifact digest: `sha256:713843e97bcf3a132b266ce0628b59b50b051c68a9a5c128607e32105ab0ffc0`
- Vercel production deployment: `dpl_9J9WdJkikqLRoRM9q2mgN4gKgBzc`
- Vercel deployment URL: `harbourview-hcc1jra12-harbourview.vercel.app`
- canonical alias: `harbourview.vercel.app`
- deployment state: `READY`
- target: `production`

The production run generated exactly six PASS screenshots:

1. `russia-375x812-focused.png`
2. `russia-375x812-rotated.png`
3. `russia-390x844-focused.png`
4. `russia-390x844-rotated.png`
5. `russia-430x932-focused.png`
6. `russia-430x932-rotated.png`

Exact SHA-256 values for all six production screenshots are recorded in `docs/control/evidence/russia-globe-20260810/SCREENSHOT_SHA256.txt` so the evidence can be identity-checked independently of GitHub Actions artifact retention.

## Temporary verification branch audit

Two branches were created solely to execute one-off production visual verification and were inspected against current `main` before cleanup:

### `verify/pr1306-production-russia-visual-20260810`

`main...branch` comparison showed the only branch-only file was `.github/workflows/pr1306-production-russia-visual-oneoff.yml`. The branch contained no unique application implementation. Its merge base was the already-landed #1306 commit; subsequent application changes are on `main`.

### `verify/pr1322-production-russia-final-20260810`

`main...branch` comparison showed the only branch-only file was `.github/workflows/pr1322-production-russia-final-oneoff.yml`. The branch contained no unique application implementation and was based directly on production source SHA `4533c9223377eb2e60c0fc8d3be48bd522d15806`.

These one-off workflow definitions were verification harnesses only and are not required for runtime, CI, deployment, or regression coverage. Durable regression coverage remains in the normal repository tests introduced by PR #1322.

## Cleanup performed

After preserving the evidence identities above, both temporary one-off workflow files were removed from their verification branches:

- removed `.github/workflows/pr1306-production-russia-visual-oneoff.yml` on `verify/pr1306-production-russia-visual-20260810`; cleanup commit `109644e2a9fbad3c3e25ff060260fc854ba75b09`;
- removed `.github/workflows/pr1322-production-russia-final-oneoff.yml` on `verify/pr1322-production-russia-final-20260810`; cleanup commit `b5b22382ead575f5af4c086dd65e7340bab90459`.

Post-cleanup comparisons against `main` reported **zero changed files** for both temporary verification branches. No unique implementation work was discarded.

The branch refs were then physically deleted by one-off GitHub Actions cleanup run `31450370154` using repository-scoped `GITHUB_TOKEN` permissions with `Contents: write`. The runner recorded:

- `verify/pr1322-production-russia-final-20260810`: pre-delete GET `200`, DELETE `204`, post-delete GET `404`;
- `verify/pr1306-production-russia-visual-20260810`: pre-delete GET `200`, DELETE `204`, post-delete GET `404`;
- final marker: `RUSSIA_REF_CLEANUP=FULLY_CLEANED`.

Both exact ref endpoints were independently re-queried after the workflow and returned `404 Not Found`. The temporary verification refs are therefore fully removed; no Russia incident branch-ref hygiene residue remains from those two one-off verification branches.

## Change boundary

This closeout is evidence/control cleanup only. It makes no application-code change, no database/schema change, no Vercel deployment change, no production configuration change, and no production write.

The evidence record remains staged in PR #1326 rather than merged directly to `main`, preserving the existing production-change boundary while retaining the durable GitHub evidence record.

## Incident disposition

**CLOSED / GO — the Russia globe rendering defect is fixed, deployed, verified live in production, and its two temporary verification refs are fully deleted.**
