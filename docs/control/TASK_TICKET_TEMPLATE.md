# Harbourview Task Ticket Template

## Purpose

This template converts Harbourview requests into bounded execution tickets that agents can run without guessing scope.

## Required template

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

- [Fact with source]
- [Fact with source]

## Assumptions forbidden

- [What must not be assumed]

## In scope

- [Specific item]

## Out of scope

- [Specific non-goal]

## Files allowed to edit

- `path/to/file`

## Files forbidden to edit

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

## Completion criteria

Complete only when:

- [Measurable criterion]
- Exact files changed are listed
- Exact commands and results are listed
- Remaining risks are stated

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

## Forbidden vague language

Do not use: fix everything, make operator grade, clean up, wire up, polish, finalize, verify it.

## Completion criteria

A ticket is valid only when it names exact files and commands, contains stop conditions, separates verified state from assumptions, has one measurable objective and can be executed without guessing scope.
