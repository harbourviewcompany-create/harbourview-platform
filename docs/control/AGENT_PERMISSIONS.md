# Harbourview Agent Permissions

## Purpose

This file defines what coding, review and planning agents may do on Harbourview. It prevents uncontrolled edits, unsafe automation and scope drift.

## Universal rules

All agents must:

- Treat `docs/control/*` as operating authority
- Use verified repo state only
- Record exact files changed
- Record exact commands run
- Preserve Harbourview brand, scope and evidence rules
- Avoid destructive changes unless explicitly approved
- Never expose secrets, service-role keys, private buyer/seller data or unpublished intelligence

No agent may:

- Claim deployment, DB or test success without evidence
- Delete tests, migrations or evidence to make checks pass
- Add checkout, payments or direct buyer-seller contact by default
- Publish fake market intelligence or fake live activity
- Convert unknowns into completed facts

## Default agent roles

| Agent | Best role | Allowed by default | Not allowed by default |
|---|---|---|---|
| ChatGPT | Control-plane strategist, spec author, verification analyst | Tickets, audits, prompts, evidence summaries, PR reviews | Direct production writes without explicit approval/tool capability |
| v0 | UI mock and component ideation | Draft constrained UI against `DESIGN_SYSTEM.md` | Product scope, database, auth or release decisions |
| Cursor | Local code editor agent | Implement bounded tickets in named files | Broad rewrites or guessed requirements |
| Windsurf | Local code editor agent | Implement bounded tickets and local checks | Auth, DB or deployment changes without approval |
| Claude Code | Deep implementation and audit agent | Multi-file implementation, code review, test hardening | Scope expansion or unsupported product claims |
| Codex | Repo implementation and PR agent | Focused patches, branches, PRs, checks where available | Secrets, production data, unsafe merges |
| Devin | Longer-running engineering agent | Pre-scoped ticket sequences with checkpoints | Autonomous product direction or paid infrastructure |
| Lovable | Rapid prototype agent | Disposable prototypes and isolated UI experiments | Production repo/database/deployment changes |
| Replit | Runnable demo agent | Isolated demos, launchers and proof-of-concept builds | Replacing production architecture without review |
| GitHub Copilot | Inline coding assistant | Named file edits under supervision | Architecture, security, DB or release ownership |
| CodeRabbit | PR review agent | Review diffs for risk, tests, security and controls | Substitute review for actual verification |
| Qodo | Test and quality agent | Generate/improve tests for named behavior | Change product scope to satisfy tests |

## Permission classes

### A. Read-only audit

Allowed: inspect files, summarize state, identify gaps, draft tickets.  
Required output: files inspected, findings, evidence, unknowns, next ticket.

### B. Documentation-only change

Allowed: edit `docs/**`.  
Forbidden: app code, migrations, workflow files, package files and env files.  
Required output: files changed, commit hash, proof no implementation files changed.

### C. Bounded implementation

Allowed: edit files named in the ticket and add named tests.  
Forbidden: unrelated refactors, DB/auth/deployment changes unless approved.

### D. Database-affecting work

Allowed only with approval: migrations, RLS, seed data, service-role paths and data cleanup scripts.

### E. Deployment-affecting work

Allowed only with approval: production deployment settings, production smoke writes, Actions secrets, Vercel env changes and public route/domain changes.

## Human approval gates

Approval is required before:

- Production smoke writes
- Production database writes
- Destructive migrations
- Auth or RLS changes
- Public exposure of private fields
- Paid tooling or infrastructure
- External outreach
- Publishing market intelligence
- Merging with required checks failing or unrun

## Stop conditions

Agents must stop if the ticket exceeds its permission class, production state must be guessed, secrets are required but unavailable, or scope conflicts with `BUILD_CONTROL.md`.

## Forbidden vague language

Do not use: made it better, cleaned up, should be safe, no major issues, probably enough, tested manually without steps.

## Completion criteria

Agent work is complete only when permission class was followed, edited files are listed, commands/results are recorded, evidence or blockers are recorded and the next action is singular.
