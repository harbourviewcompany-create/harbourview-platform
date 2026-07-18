# Harbourview PR Review Checklist

## Purpose

This checklist controls Harbourview PR review. It helps reviewers and review agents reject unsafe, vague or unverified changes.

## Required PR summary fields

Every PR must include:

- Objective
- Source authority
- Branch and base commit
- Files changed
- Scope classification
- Database impact
- Deployment impact
- Public/private data impact
- Commands run
- Evidence updated
- Remaining risks
- Rollback path

## Review gates

### All PR types (baseline gate — check before any type-specific gate below)

Reject if:

- The change was pushed directly to `main` rather than opened as a PR (see `AGENTS.md` Merge Discipline)
- No `docs/control/EVIDENCE_LOG.md` entry exists for this change — a one-line entry (date, scope, command/source, result, PR link, status) is sufficient for docs-only or trivial changes; production-impacting work needs the fuller trail
- The QA commands claimed in the PR body were not actually run, or no output/evidence is attached to back the claim

### Documentation-only PR

Approve only if:

- Only `docs/**` changed
- No implementation/deployment claims are made without evidence
- Control files remain stricter or equally strict
- No generic filler replaces project-specific rules

### UI PR

Approve only if:

- `DESIGN_SYSTEM.md` is followed
- Mobile and desktop behavior are considered
- Accessibility basics are preserved
- No fake live data or unsupported market claims appear
- CTA hierarchy remains clear

### Marketplace PR

Approve only if:

- No checkout/cart/payment behavior is introduced unless approved
- No direct buyer-seller contact is exposed by default
- Public listing views are redacted
- Submission flows validate input
- Smoke or targeted tests cover changed capture paths

### Globe homepage PR

Approve only if:

- Globe remains V1 scope
- Marketplace CTA is primary
- Intelligence CTA is secondary
- Reduced-motion and static fallback are preserved
- No fake country intelligence or fake live demand is shown
- Mobile tap behavior is specified

### Database or RLS PR

Approve only if:

- Migration order is clear
- RLS impact is stated
- Public/private exposure is reviewed
- Service role paths are server-only
- Rollback or forward-fix plan exists
- Production writes have human approval

### Deployment PR

Approve only if:

- Target environment is stated
- Environment variables are named without values
- Required checks passed or blockers are explicit
- Rollback path exists
- Production smoke or equivalent verification is defined

## Public leakage rejection list

Reject if public users can see source URLs, evidence captured, provenance logs, internal notes, raw contact fields, buyer identity fields, admin-only status history or service-role diagnostics.

## Security rejection list

Reject if secret values appear, service role keys can reach client bundles, public routes return private fields, validation is missing, errors expose internals or RLS is broadened without proof.

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

### Merge readiness

- Ready to merge: yes/no
- Reason:
```

## Forbidden approval language

Do not approve with: looks good, nice cleanup, no issues, safe change, seems fine, should pass, ship it.

## Completion criteria

A PR review is complete only when the decision is explicit, scope/evidence/data risk are checked, merge blockers are named, remaining risk is either accepted or assigned to a follow-up ticket, and a `docs/control/EVIDENCE_LOG.md` entry is confirmed to exist for the change.

## QA bundle expectations for review

Reviewers should require the smallest relevant QA bundle and escalate to broader bundles for cross-cutting changes.

- Public route/content/data exposure changes: `npm run qa:public-surface`
- Compliance or regulatory signal changes: `npm run qa:compliance`
- Marketplace capture, admin access, or smoke-sensitive flows: `npm run qa:smoke`
- Multi-domain, release, or deployment-risk PRs: `npm run qa:all`

If a bundle is skipped, the PR must include an explicit blocker reason and follow-up verification plan.

Reviewers may also request a single standalone script (without a bundle) when debugging one failure mode, but merge evidence should still reference the smallest relevant bundle.
