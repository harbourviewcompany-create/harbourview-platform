# Harbourview Task Ticket Template

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This template turns requests into bounded execution tickets that agents can run without drifting scope or inventing state.

## Required fields

Every Harbourview ticket must complete every field below. If a field is unknown, write `Unknown, do not assume` and define how to verify it.

```md
# Ticket: HV-[AREA]-[NUMBER] - [Short imperative title]

## Objective

[One sentence. What must be true when done.]

## Source authority

- User instruction:
- Control file:
- Product scope:
- Branch:
- Base commit:

## Verified current state

- [Fact 1 with source]
- [Fact 2 with source]
- [Fact 3 with source]

## Assumptions forbidden

- [State what must not be assumed]

## In scope

- [Specific item]
- [Specific item]

## Out of scope

- [Specific non-goal]
- [Specific non-goal]

## Files allowed to edit

- `path/to/file`
- `path/to/file`

## Files forbidden to edit

- `path/to/file`
- `path/to/file`

## Database impact

- None, or
- Tables:
- Columns:
- RLS:
- Migration:
- Production write approval:

## Deployment impact

- None, or
- Target environment:
- Environment variable names:
- Workflow/deploy action:
- Human approval required:

## Implementation instructions

1. [Step]
2. [Step]
3. [Step]

## Required verification

Run or record as blocked:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

Additional commands:

```bash
[command]
```

## Evidence to update

- `docs/control/EVIDENCE_LOG.md`
- `docs/control/PROJECT_STATE.md` if state changes

## Stop conditions

Stop if:

- [Condition]
- [Condition]

## Completion criteria

Complete only when:

- [Measurable criterion]
- [Measurable criterion]
- Exact files changed are listed.
- Exact commands and results are listed.
- Remaining risks are stated.

## Required final response format

- Objective:
- Files changed:
- Commands run:
- Results:
- Evidence updated:
- Conflicts found:
- Remaining unverified assumptions:
- Next single ticket:
```

## Area codes

Use one of:

- `DOCS`
- `MARKETPLACE`
- `GLOBE`
- `DB`
- `RLS`
- `SMOKE`
- `DEPLOY`
- `ADMIN`
- `INTEL`
- `UI`
- `SECURITY`

## First next ticket from current state

```md
# Ticket: HV-SMOKE-001 - Run controlled marketplace browser smoke verification

## Objective

Verify whether the deployed Harbourview marketplace capture loop creates and closes production smoke rows for quote routing, listing submission and wanted request submission without exposing secrets.

## Source authority

- User instruction: Create Harbourview control files and identify next execution ticket.
- Control file: `docs/control/VERIFICATION_PLAN.md`
- Product scope: Marketplace V1 capture verification
- Branch: `main`
- Base commit: `f835cd4d04a2550c19dfb4b313a82f59591ff15d`

## Verified current state

- Browser smoke workflow exists at `.github/workflows/marketplace-browser-smoke.yml`.
- Workflow default target is `https://harbourview-platform.vercel.app`.
- Workflow requires exact manual confirmation `ALLOW_PRODUCTION_SMOKE_WRITES` or controlled smoke branch.
- Browser smoke script exercises `quote_routing`, `listing_submission` and `wanted_request_submission`.
- Latest smoke result artifact was not found on `main` during the control-file pass.

## Assumptions forbidden

- Do not assume GitHub Actions secrets are configured.
- Do not assume production deployment is current.
- Do not assume Supabase RLS is correct.
- Do not assume browser smoke passes.

## In scope

- Check whether workflow dispatch or controlled branch trigger is available.
- Run the marketplace browser smoke only with proper production write gate.
- Collect workflow logs and artifacts.
- Confirm row creation and cleanup from workflow output.
- Update `EVIDENCE_LOG.md` and `PROJECT_STATE.md`.

## Out of scope

- Changing marketplace implementation code unless smoke fails and a separate repair ticket is created.
- Changing database schema or RLS.
- Changing Vercel settings.
- Adding new marketplace features.

## Files allowed to edit

- `docs/control/EVIDENCE_LOG.md`
- `docs/control/PROJECT_STATE.md`

## Files forbidden to edit

- Application code
- Migrations
- Workflow files unless a separate ticket approves it
- Package files

## Database impact

Production smoke writes are expected if approved. Created smoke rows must be closed by cleanup. Human approval is required before running.

## Deployment impact

No deployment change expected.

## Required verification

- GitHub Actions workflow run or blocked reason
- Workflow logs
- Artifact if produced
- Verification of created and closed smoke row types from logs

## Stop conditions

Stop if production write approval is missing, secrets are unavailable, workflow dispatch is unavailable and no controlled trigger is approved, or smoke fails for unknown reasons.

## Completion criteria

- Workflow run ID or blocked reason recorded.
- Smoke result recorded as pass, fail or blocked.
- Evidence log updated.
- Project state updated only if verification changes status.
```

## Forbidden vague language

Do not use:

- fix everything
- make operator grade
- clean up
- wire up
- polish
- finalize
- verify it without specifying what `it` is

## Completion criteria

A ticket is valid only when:

- It names exact files and commands.
- It contains explicit stop conditions.
- It separates verified state from assumptions.
- It has a single measurable objective.
- It can be executed by Codex, Claude Code, Cursor or a reviewer without guessing scope.
