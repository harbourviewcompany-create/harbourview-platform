# Command Centre Integration — PR #1257 Final Review Evidence

Date opened: 2026-08-02  
Final remediation and evidence pass: 2026-08-03  
Draft PR: #1257  
Canonical feature branch: `agent/command-centre-integration-rule`  
Verified application/workflow source head: `ee4faaef61b1df60ce5e7d26dc574e5779b51546`  
Authenticated evidence commit: [`72d6b770938d1dab0c70b3d53b23b846668525a6`](https://github.com/harbourviewcompany-create/harbourview-platform/commit/72d6b770938d1dab0c70b3d53b23b846668525a6)

## Final execution state

PR #1257 remains the only active implementation path for this work and remains draft, open and unmerged.

The authenticated customer architecture is shell-only:

- desktop capabilities render inside `CommandCentre` and `.cc-main`;
- mobile capabilities render inside `MobileCommandCentre` and `.hvm-main`;
- shared modules render through `CommandCentreIntegrationGateway` inside the mounted canonical shell;
- authenticated feature roots and descendants resolve into `/dashboard` with preserved `page`, `module`, `action`, `focus` and original query state after authentication and tier checks;
- Marketplace sell, intake, financing and my-listings workflows render inside Marketplace shell state rather than standalone authenticated workspaces.

No paid Supabase development branch was created. Authenticated verification used an isolated local Supabase stack inside GitHub Actions, a disposable local-only user and temporary local schema fixtures. Production Auth, production data, migrations, secrets and aliases were not touched.

## Review remediation

Every review thread present during the final pass was classified, remediated where valid and resolved. Final unresolved review-thread count: **0**. No item required an operator product or architecture decision.

### Valid findings fixed

1. Command Centre module normalization now resolves aliases through own properties only and rejects inherited keys such as `constructor`, `toString` and `valueOf`; the registry accessor fails explicitly for unknown modules.
2. Authentication redirects and Cloudflare route assertions preserve complete destination query state.
3. `/network/clinical-education/request` reaches its intended `/contact?topic=clinical-education` route instead of being swallowed by the parent Command Centre rule.
4. `/intelligence/watchlists` and the clinical request route use exact-path public exceptions; descendants remain protected.
5. Local Supabase verification is rejected in Vercel production and requires GitHub Actions CI, the explicit local flag, HTTP and a loopback hostname.
6. Credential-bearing GitHub Actions are pinned to immutable reviewed SHAs; checkout credentials are not persisted.
7. The authenticated visual workflow runs read-only verification in one job and grants `contents: write` only to the separate evidence-commit job. Authentication is introduced only for the final push step.
8. Evidence commits run only after successful push-triggered authenticated verification.
9. The focused workflow includes `navigationRoutes.test.ts` and executable route-output coverage now checks `page`, `module`, `action` and descendant `focus` values.
10. The module launcher uses a native modal dialog with initial focus, Escape/cancel handling and trigger-focus restoration.
11. Supply memoization closes over the exact dependency, the Talent query is limited to 60 rows, and portal attachment retries terminate with an in-shell error state.
12. Playwright serialization is scoped to the authenticated visual invocation instead of the shared configuration.
13. Cloudflare compatibility date and the pinned Wrangler verification runtime are aligned.
14. Personal briefing generation is cached by user and canonical watch-rule fingerprint for a five-minute bounded window with failure eviction and a 250-entry ceiling.
15. Runtime source-patching and temporary remediation/hotfix workflows were removed.
16. Initial-shell browser errors remain asserted in the authenticated Playwright suite.

### Review disposition

- Valid and fixed: all Critical, Major, Minor and Trivial findings that remained applicable.
- Already fixed: the initial shell browser-error assertion.
- Outdated: comments whose original code lines were replaced by the verified fixes; these were resolved after confirming the current implementation.
- False positives: none required a separate exemption.
- Operator decision required: none.

A consolidated disposition review was posted to PR #1257 before the threads were resolved.

## Remediation-specific changed files

- `.github/workflows/cloudflare-workers-preview-verify.yml`
- `.github/workflows/command-centre-authenticated-visual.yml`
- `.github/workflows/command-centre-integration-verify.yml`
- `components/dashboard/CommandCentreIntegrationGateway.tsx`
- `lib/dashboard/commandCentreIntegration.ts`
- `lib/dashboard/personalBriefingsData.ts`
- `lib/supabase/env.ts`
- `middleware.ts`
- `playwright.config.js`
- `tests/dashboard/commandCentreIntegration.test.ts`
- `tests/dashboard/commandCentreRouteContracts.test.ts`
- `wrangler.jsonc`
- `docs/control/evidence/COMMAND_CENTRE_INTEGRATION_2026-08-02.md`
- `docs/control/evidence/command-centre-integration/verification-run.json`
- six bounded PNG files and six matching JSON reports under `docs/control/evidence/command-centre-integration/`

The complete PR currently contains 59 changed files because it also includes the original Command Centre integration, route consolidation, Cloudflare preview support and supporting tests/docs.

## Source-head verification

The complete relevant verification set passed on the remediated source head `ee4faaef61b1df60ce5e7d26dc574e5779b51546`.

| Workflow | Run | Result |
|---|---:|---|
| Branch Verification | [`30808599590`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599590) | PASS |
| CI | [`30808599628`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599628) | PASS |
| Command Centre Integration Verify | [`30808599776`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599776) | PASS |
| Cloudflare Workers Preview Verify | [`30808599585`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599585) | PASS |
| Project Registry Discipline | [`30808599731`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599731) | PASS |
| Install Only Verification | [`30808599927`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599927) | PASS |
| Type Check | [`30808599576`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599576) | PASS |
| Supply Imagery Validation | [`30808599574`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599574) | PASS |
| Regulatory Signals Verify | [`30808599652`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599652) | PASS |
| HAR-39 HAR-40 Public Surfaces | [`30808599638`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599638) | PASS |
| PR 166 New Products Equipment Verification | [`30808599689`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808599689) | PASS |
| PR 1222 Supply Visual Verification | [`30809842735`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30809842735) | SKIPPED — unrelated path scope on final documentation head |

The successful partitions cover dependency installation, lint, typecheck, the full test suite, focused Command Centre and middleware/route tests, production build, branch probes, public-surface and leakage checks, Cloudflare/OpenNext preview execution, registry discipline and related repository verification.

## Authenticated six-width verification

Workflow: [`Command Centre Authenticated Visual`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808598022)  
Run: [`30808598022`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808598022)  
Verified source SHA: `ee4faaef61b1df60ce5e7d26dc574e5779b51546`  
Visual job: [`91669747975`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808598022/job/91669747975) — success  
Evidence-commit job: [`91670356958`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808598022/job/91670356958) — success  
Evidence commit: [`72d6b770938d1dab0c70b3d53b23b846668525a6`](https://github.com/harbourviewcompany-create/harbourview-platform/commit/72d6b770938d1dab0c70b3d53b23b846668525a6)  
Artifact: [`command-centre-authenticated-visual-30808598022`](https://github.com/harbourviewcompany-create/harbourview-platform/actions/runs/30808598022/artifacts/8854002997) (`8854002997`, 14-day retention)

Successful stages:

- dependency installation;
- lint;
- typecheck;
- complete test suite;
- isolated local Supabase startup and disposable user creation;
- production build against the local verification environment;
- authenticated browser-state creation;
- six-width Playwright suite with one worker and no retries;
- artifact upload;
- production migration-tree restoration;
- local process and Supabase teardown;
- bounded evidence commit.

## Screenshot and JSON inspection

| Width | Shell | PNG | JSON | Inspection |
|---:|---|---|---|---|
| 320 | Mobile Command Centre | `command-centre-320.png` | `command-centre-320.json` | PASS — shell, launcher and bottom navigation contained; no clipping or obstruction |
| 375 | Mobile Command Centre | `command-centre-375.png` | `command-centre-375.json` | PASS — safe-area spacing and module surface contained |
| 390 | Mobile Command Centre | `command-centre-390.png` | `command-centre-390.json` | PASS — consistent mobile shell and navigation |
| 430 | Mobile Command Centre | `command-centre-430.png` | `command-centre-430.json` | PASS — no viewport clipping or fixed-element collision |
| 768 | Desktop Command Centre | `command-centre-768.png` | `command-centre-768.json` | PASS — desktop rail, header, scrollable module navigation and launcher contained |
| 1440 | Desktop Command Centre | `command-centre-1440.png` | `command-centre-1440.json` | PASS — full desktop shell and module surface consistent |

Every JSON report records:

- 16 canonical modules exercised;
- 3 Marketplace actions exercised;
- state counts: `ready: 11`, `empty: 7`, `error: 1`;
- maximum horizontal overflow: `0`;
- fixed-position obstruction violations: `0`;
- browser page errors: `0`.

The one explicit component error state is Personal Briefings against the deliberately minimal local verification schema. It remains inside the canonical shell and does not produce a browser error, shell failure, navigation failure or production-data dependency. Market and Talent render explicit empty states rather than blank surfaces.

All six regenerated screenshots were visually inspected after the remediation. No additional overflow, safe-area, navigation, loading, error, empty-state or desktop/mobile consistency defect was found.

## Main-branch relationship

At final inspection:

- current `main`: `34eb8113418180dfb63b8d7ce67ae0c59a05b0f8`;
- feature branch status: diverged, 115 commits ahead and 2 commits behind;
- GitHub PR mergeability: `true`;
- no merge conflict was reported.

Merging or rebasing current `main` was therefore not required to remove a conflict or validate the PR. No unrelated main-branch changes were pulled into this dedicated branch.

## Preview and production boundary

The remediated source preview `dpl_HnsyNiESLCpnwrfujzM8v71oRvQ4` completed READY for source SHA `ee4faaef61b1df60ce5e7d26dc574e5779b51546` with `target: null`. It is a non-production Git preview.

No manual Vercel deployment command was run. No production deployment, production alias movement, database migration, secret change, production data write, production Auth write or paid Supabase branch occurred.

## Registry decision

The existing Harbourview Platform registry row remains canonical. No project-registry change is required for this PR. Project Registry Discipline passed on the remediated source.

## Final status

**GO — implementation, review remediation, source verification and authenticated six-width evidence are complete for review.**

**HOLD — PR #1257 must remain draft, open, unmerged and undeployed to production until explicit merge and production-deployment authorization is provided.**
