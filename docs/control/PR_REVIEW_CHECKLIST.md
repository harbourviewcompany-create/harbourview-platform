# Harbourview PR Review Checklist

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This checklist controls Harbourview pull request review. It helps human reviewers, CodeRabbit, Qodo, Claude Code, Codex and ChatGPT reject unsafe, vague or unverified changes.

## Required PR summary fields

Every PR must include:

- Objective
- Source authority
- Branch and base commit
- Files changed
- Scope classification: docs, UI, marketplace, globe, database, RLS, deployment, security or mixed
- Database impact
- Deployment impact
- Public/private data impact
- Commands run
- Evidence updated
- Remaining risks
- Rollback path

## Review gates by change type

### Documentation-only PR

Approve only if:

- Only `docs/**` changed.
- No implementation or deployment claims are made without evidence.
- Control files remain stricter or equally strict.
- No generic filler replaces project-specific rules.

### UI PR

Approve only if:

- `DESIGN_SYSTEM.md` is followed.
- Mobile and desktop behavior are considered.
- Accessibility basics are preserved.
- No fake live data or unsupported market claims appear.
- CTA hierarchy remains clear.

### Marketplace PR

Approve only if:

- No checkout, cart or payment behavior is introduced unless explicitly approved.
- No direct buyer-seller contact is exposed by default.
- Public listing views are redacted.
- Submission flows validate input.
- Smoke or targeted tests cover changed capture paths.

### Globe homepage PR

Approve only if:

- Globe remains V1 scope.
- Marketplace CTA is primary.
- Intelligence CTA is secondary.
- Reduced-motion and static fallback are preserved.
- No fake country intelligence or fake live demand is shown.
- Mobile tap behavior is specified.

### Database or RLS PR

Approve only if:

- Migration order is clear.
- RLS impact is stated.
- Public/private field exposure is reviewed.
- Service role paths are server-only.
- Rollback or forward-fix plan exists.
- Production writes have human approval.

### Deployment PR

Approve only if:

- Target environment is stated.
- Environment variables are named but values are not exposed.
- Required checks passed or blockers are explicit.
- Rollback path exists.
- Production smoke or equivalent verification is defined.

## Public leakage checklist

Reject if public users can see any of:

- `View source listing`
- Source URLs
- Evidence captured
- Provenance logs
- Internal review workflow
- Internal notes
- Raw submitter contact fields
- Buyer identity fields
- Seller private contact fields
- Admin-only status history
- Service-role diagnostics

Admin/operator visibility must be behind auth and role checks.

## Security checklist

Reject if:

- Secret values appear in code, docs, logs or screenshots.
- Service role keys can reach client bundles.
- Public routes return private fields.
- Input validation is missing on public forms or server routes.
- Error messages expose internal details.
- RLS is broadened without proof.
- Production smoke writes lack explicit gate.

## Verification checklist

Reviewer must confirm:

- Required commands are listed.
- Results are pass, fail or blocked.
- Failure logs are not hidden.
- Evidence was added when state changed.
- `PROJECT_STATE.md` was updated when status changed.
- Claims do not exceed evidence.

Minimum command expectations for code PRs:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

Additional checks are required for marketplace, database, RLS, deployment and globe behavior changes.

## Review comment template

```md
## Harbourview PR Review

Decision: approve / request changes / comment only

### Scope match

- Claimed scope:
- Actual diff scope:
- Scope drift found:

### Evidence

- Commands run:
- Evidence files updated:
- Missing evidence:

### Public/private data risk

- Public leakage risk:
- Admin/operator visibility preserved:
- Secret exposure risk:

### Required changes

1. [Specific file and issue]
2. [Specific file and issue]

### Merge readiness

- Ready to merge: yes/no
- Reason:
```

## Common rejection reasons

Request changes if the PR:

- Says tests passed but does not list commands.
- Changes code without updating relevant evidence.
- Adds vague generic docs over strict controls.
- Touches unrelated files.
- Makes public claims not supported by product authority.
- Broadens public visibility of private fields.
- Adds new dependencies without cost or security rationale.
- Modifies workflows without deployment risk notes.
- Changes database schema without RLS analysis.

## Forbidden vague language

Do not approve comments that say:

- looks good
- nice cleanup
- no issues
- safe change
- seems fine
- should pass
- ship it

Use evidence-based approval language only.

## Completion criteria

A PR review is complete only when:

- The decision is explicit.
- Scope match is checked.
- Evidence is checked.
- Public/private data risk is checked.
- Merge blockers are named.
- Remaining risk is either accepted by a human or assigned to a follow-up ticket.
