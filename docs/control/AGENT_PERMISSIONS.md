# Harbourview Agent Permissions

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This file defines what each coding or review agent may do on Harbourview. It prevents uncontrolled edits, unsafe automation, scope drift and unsupported production claims.

## Required fields for agent handoff

Every agent task must state:

- Agent name
- Role for this ticket
- Branch
- Source authority
- Allowed files
- Forbidden files
- Allowed commands
- Required evidence
- Human approval gates
- Stop conditions
- Expected output format

## Universal rules for all agents

All agents must:

- Treat `docs/control/*` as controlling authority.
- Use only verified repo state.
- Avoid implementation assumptions.
- Keep public claims commercially conservative.
- Preserve Harbourview spelling and brand direction.
- Record exact files changed.
- Record exact commands run.
- Record failures without softening them.
- Avoid destructive changes unless explicitly approved.
- Never expose secrets, service role keys, private buyer data, private seller data or unpublished intelligence.

No agent may:

- Merge its own risky production change without verification.
- Delete migrations, tests or evidence files to make checks pass.
- Replace strict controls with broad generic text.
- Add checkout, payments or direct buyer-seller contact by default.
- Publish fake market intelligence or fake live activity.
- Convert unknowns into completed facts.

## Default agent roles

| Agent | Best role | Allowed by default | Not allowed by default |
|---|---|---|---|
| ChatGPT | Control-plane strategist, spec author, verification analyst, PR reviewer | Create tickets, control files, audits, prompts, review plans and evidence summaries | Direct production writes without explicit user instruction and tool capability |
| v0 | UI mock and component ideation | Generate constrained UI drafts against `DESIGN_SYSTEM.md` | Decide product scope, database schema, auth or production behavior |
| Cursor | Local code editor agent | Implement bounded tickets in an existing branch | Make uncontrolled broad rewrites or infer missing requirements |
| Windsurf | Local code editor agent | Implement bounded tickets, refactor inside named files, run local checks | Change database, deployment or auth controls without approval |
| Claude Code | Deep implementation and audit agent | Multi-file implementation, code review, failure repair and test hardening | Expand V1 scope or make product claims without evidence |
| Codex | Repo implementation and PR agent | Apply focused patches, create branches, open PRs, run code checks if available | Skip verification, alter secrets, change production data or merge unsafe PRs |
| Devin | Longer-running engineering agent | Execute pre-scoped ticket sequences with verification checkpoints | Autonomous product direction, unapproved paid infrastructure or destructive DB changes |
| Lovable | Rapid app prototype agent | Build disposable prototypes or UI experiments from constrained specs | Touch production repo, database or deployment unless explicitly approved |
| Replit | Runnable app prototype and local demo agent | Build isolated demos, launchers and proof-of-concept packages | Replace production architecture or create live systems without review |
| GitHub Copilot | Inline coding assistant | Assist in named file edits under human supervision | Own architecture, security, database, evidence or release decisions |
| CodeRabbit | PR review agent | Review diffs for risk, tests, security, maintainability and control compliance | Auto-approve risky changes or substitute review for tests |
| Qodo | Test and quality agent | Generate and improve tests for named behavior | Change product scope or production behavior to satisfy tests |

## Permission classes

### Class A: Read-only audit

Allowed:

- Inspect files
- Summarize repo state
- Identify gaps
- Draft tickets
- Draft review comments

Required output:

- Files inspected
- Findings
- Evidence
- Unknowns
- Next ticket

### Class B: Documentation-only change

Allowed:

- Edit `docs/**`
- Add templates, runbooks, evidence logs and checklists

Forbidden:

- Implementation code
- Migrations
- Workflow files
- Package files
- Environment files

Required output:

- Files changed
- Commit hash
- Statement that no implementation code changed

### Class C: Bounded implementation

Allowed:

- Edit files named in the ticket
- Add tests named in the ticket
- Run required commands

Forbidden:

- Touching unrelated files
- Refactoring broad architecture without approval
- Changing database or auth unless ticket permits it

Required output:

- Diff summary
- Commands and results
- Evidence file update
- Remaining risks

### Class D: Database-affecting work

Allowed only with human approval:

- Migrations
- RLS policies
- Seed data
- Service role paths
- Data cleanup scripts

Required output:

- SQL diff
- Migration order
- RLS review
- Rollback or forward-fix plan
- Production write approval status

### Class E: Deployment-affecting work

Allowed only with human approval:

- Production deployment settings
- Production smoke writes
- GitHub Actions secrets
- Vercel environment changes
- Domain or public route changes

Required output:

- Deployment target
- Variables by name only
- Workflow run link or run ID when available
- Verification result
- Rollback path

## Human approval gates

Human approval is required before:

- Production smoke writes
- Production database writes
- Destructive migrations
- Auth or RLS changes
- Public exposure of confidential data
- Paid third-party tooling
- External outreach
- Publishing market intelligence
- Merging a PR with failing or unrun required checks

## Stop conditions

Agents must stop when:

- Required files are missing and cannot be inspected.
- The ticket asks for an action outside the allowed permission class.
- Production state must be guessed.
- A test failure cannot be diagnosed from available evidence.
- A change would require secrets.
- Scope conflicts with `BUILD_CONTROL.md`.

## Forbidden vague language

Do not use:

- made it better
- cleaned up the code
- should be safe
- no major issues
- production-grade by default
- probably enough
- seems okay
- tested manually without saying how

## Completion criteria

Agent work is complete only when:

- Permission class was followed.
- All edited files are listed.
- Commands and results are recorded.
- Evidence was added or a blocker was recorded.
- No hidden assumptions remain unlabelled.
- The next action is singular and specific.
