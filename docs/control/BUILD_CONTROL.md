# Harbourview Build Control

## Purpose

This file controls what may be built, changed, verified and released for Harbourview. It exists to stop scope drift, undocumented implementation changes and unsupported production-readiness claims.

## Authority order

1. Latest explicit instruction from Tyler in the active workstream
2. This control pack
3. Surface-specific control files in `docs/control/`
4. Existing repository code, tests and production evidence
5. Agent judgment

Agent judgment never overrides explicit scope, safety gates or evidence requirements.

## Locked Harbourview lanes

### Marketplace V1

Allowed:

- Public marketplace hub and category/listing cards
- Listing submission
- Wanted request submission
- Buyer quote or introduction capture
- Admin-mediated review and routing where scoped
- Smoke verification and evidence logging

Forbidden unless separately approved:

- Checkout, cart or payment processing
- Direct buyer-seller contact by default
- Unreviewed public listing publication from user input
- Claims of guaranteed buyers, live demand or active deal flow without evidence

### Globe Homepage V1

Allowed:

- Premium navy, black and gold Harbourview homepage shell
- Marketplace primary CTA
- Intelligence secondary CTA
- Globe-led hero within locked V1 UX rules
- Reduced-motion and static fallback behavior

Forbidden unless separately approved:

- Fake live data
- Fake country intelligence
- Crypto, gaming, NASA dashboard or neon styling
- Marketplace grid above the fold
- Extra modules outside the locked V1 scope

## Required ticket fields

Every implementation ticket must state:

- Objective
- Source authority
- In scope
- Out of scope
- Files allowed to edit
- Files forbidden to edit
- Database impact
- Deployment impact
- Commands to run
- Evidence to update
- Rollback path
- Human approval gates
- Stop conditions
- Completion criteria

## Documentation-only changes

Allowed without runtime checks when:

- Only `docs/**` files change
- No implementation or deployment claims are made
- File list and commit hash are returned
- PR states that no application code, migrations, workflows, package files or env files changed

## Implementation changes

Required unless explicitly blocked and documented:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

Add targeted tests or smoke checks for the changed surface.

## Database and auth changes

Required:

- Migration or SQL file identified
- RLS impact stated
- Service-role use reviewed
- Public/private field visibility reviewed
- Rollback or forward-fix path documented
- Human approval for destructive or production DB changes

## Deployment changes

Required:

- Target environment named
- Environment variables listed by name only
- Deployment target and commit recorded
- Rollback path documented
- Human approval for production writes

## Stop conditions

Stop and report if:

- Required repo, database or deployment state would need to be guessed
- A required secret is unavailable
- Production write approval is missing
- A change could expose private buyer, seller, admin or intelligence data
- A test fails and root cause is outside the ticket
- Scope conflicts with this control file

## Forbidden vague language

Do not use:

- should work
- likely complete
- simple cleanup
- production ready without evidence
- harmless change without rollback
- wire up without naming the exact files and data flow

## Completion criteria

A build ticket is complete only when:

- Exact files changed are listed
- Commands run and results are recorded
- Evidence is updated where state changed
- Remaining risks are explicit
- The next action is singular and specific
