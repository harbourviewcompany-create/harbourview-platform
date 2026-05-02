# Harbourview Build Control

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform  
Repository: harbourviewcompany-create/harbourview-platform  
Base branch reviewed: main  
Base commit reviewed: f835cd4d04a2550c19dfb4b313a82f59591ff15d

## Purpose

This file controls what may be built, changed, verified and released for Harbourview. It prevents agent drift, scope expansion, undocumented implementation changes and false production-readiness claims.

## Required fields for every build ticket

- Ticket ID
- Objective
- Source authority
- In scope
- Out of scope
- Files allowed to edit
- Files forbidden to edit
- Database impact
- Deployment impact
- Required commands
- Required evidence
- Rollback path
- Human approval gate
- Stop conditions
- Completion criteria

## Product authority hierarchy

When instructions conflict, apply this order:

1. User's latest explicit instruction in the active workstream
2. Harbourview Project Control Pack V1
3. Locked Harbourview Globe Homepage V2 Addendum and Natural UX Addendum for globe homepage work
4. Locked Harbourview Marketplace V1 scope for marketplace work
5. Existing repository code and tests
6. Agent judgment

Agent judgment never overrides explicit scope, safety gates or evidence requirements.

## Current locked product lanes

### Marketplace V1

Allowed work:

- Public marketplace routes
- Listing submission
- Wanted request submission
- Buyer quote or intro capture
- Admin-mediated matching controls where already scoped
- Smoke verification for capture paths
- Evidence and status logging

Forbidden unless separately approved:

- Checkout
- Direct buyer-seller messaging by default
- Payment processing
- Public exposure of seller contact data
- Claims of guaranteed buyers, active deal flow or live demand without evidence
- Unreviewed public listing publication from user input

### Globe Homepage V1

Allowed work:

- Premium Harbourview homepage shell
- Navy, black and gold visual system
- Lighthouse, subtle water and globe-led hero
- Marketplace primary CTA
- Intelligence secondary CTA
- Interactive globe UX only within locked V1 behavior
- Reduced motion and static fallback states

Forbidden unless separately approved:

- Fake live data
- Fake country intelligence
- Crypto, gaming, NASA dashboard or neon styling
- Marketplace grid above the fold
- Extra product modules outside the locked V1 build scope

### Research tools and intelligence support

Allowed work:

- Source logging
- Evidence confidence fields
- Primary-source retrieval workflows
- Exportable research artifacts
- Non-public internal intelligence tools

Forbidden unless separately approved:

- Fabricated source claims
- Uncited legal or regulatory conclusions
- Automated outreach without human review
- Public publication of unreviewed intelligence

## Verified technical baseline

From `package.json` on `main` at the reviewed commit:

- App name: `harbourview-platform`
- Next: `^15.3.1`
- React: `^19.0.0`
- TypeScript: `^5.4.5`
- Tailwind: `^3.4.17`
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `smoke:marketplace`, `smoke:marketplace:rls`, `smoke:marketplace:browser`

Do not assume additional tooling exists unless inspected.

## Change rules

### Documentation-only changes

Allowed without implementation tests when:

- Only `docs/**` files are changed.
- The PR states that no implementation code was changed.
- No deployment, database or test-pass claims are made.

Required evidence:

- File list
- Branch name
- Commit hash
- Statement that no code, migration or config files were changed

### Implementation changes

Required before merge:

- `npm ci`
- `npm run typecheck`
- `npm run lint` if the script is valid in the current repo
- `npm run build`
- Targeted test or smoke command relevant to the changed path
- Evidence log update

If a command fails because a script is broken or unsupported, record the exact error and either repair the command or mark the ticket blocked. Do not ignore it.

### Database changes

Required before merge:

- Migration file or SQL patch identified
- RLS impact stated
- Backward compatibility reviewed
- Rollback or forward-fix path documented
- Service role usage reviewed
- No destructive operation without explicit human approval

### Deployment changes

Required before merge:

- Environment variables listed by name only, never by secret value
- Rollback path documented
- Production smoke or equivalent verification defined
- Human approval for production writes

## Production safety gates

The following require explicit human approval:

- Production database writes outside controlled smoke tests
- Destructive database migrations
- RLS policy changes
- Auth or role changes
- Public route exposure of previously private data
- Direct buyer-seller contact changes
- Any claim of real-time intelligence, active buyers or guaranteed route access
- Production deployment when verification is failing or unavailable

## Cost-control rules

- Do not add paid third-party services unless approved.
- Do not add cloud compute, queues, vector databases, paid maps, paid APIs or hosted observability without approval.
- Prefer existing stack and repository scripts.
- Prefer small reversible patches over large rewrites.
- Keep globe performance within browser-friendly V1 scope before adding visual ambition.

## Stop conditions

Stop and report instead of continuing when:

- A requested change conflicts with this build control file.
- A required secret or credential is missing.
- A production write gate is not satisfied.
- A test fails and the root cause is unclear.
- A change would expose confidential contact, buyer, seller, admin or intelligence data.
- Database migration impact cannot be assessed.
- The agent would need to guess repo, database or deployment state.

## Forbidden vague language

Do not use:

- polish pass
- cleanup
- improve everything
- production ready unless all gates passed
- harmless change unless rollback is clear
- quick fix unless failure is reproduced
- wire up without naming exact files and data flow
- integrate without naming the integration boundary

## Completion criteria

A build ticket is complete only when:

- The exact files changed are listed.
- Commands run and results are recorded.
- Evidence is added to `EVIDENCE_LOG.md`.
- `PROJECT_STATE.md` is updated if project state changed.
- No forbidden claims are made.
- Any remaining risk is explicit and assigned to the next ticket.
