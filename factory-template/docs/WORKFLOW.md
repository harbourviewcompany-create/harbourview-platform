# Software Factory Workflow

## Stage 0: Project intake

Required fields:

- Project name
- Target user
- Core job to be done
- Primary workflow
- Data objects
- Permission levels
- Integration needs
- Local or web deployment target
- Must-have acceptance test

## Stage 1: Product definition

Produce:

- One-line product thesis
- User roles
- Primary workflow
- Out-of-scope list
- MVP acceptance standard

## Stage 2: Technical definition

Produce:

- App routes
- API routes
- Database tables
- Access policies
- Server actions
- Background jobs if needed
- Audit events
- Error states

## Stage 3: Scaffold

Create:

- package.json
- app shell
- route structure
- Supabase client helpers
- migrations
- tests
- env example
- README runbook
- PowerShell init script

## Stage 4: Implementation

Rules:

- Build the smallest complete vertical slice first.
- Every feature needs a contract test or smoke test.
- Every public surface must be checked for internal field leakage.
- Every database table with user data must have row-level access controls.

## Stage 5: Hardening

Checklist:

- Typecheck passes
- Tests pass
- Build passes
- Env validation exists
- No secrets committed
- Public routes do not expose private fields
- Row-level policy risk reviewed
- Installer or launcher exists
- Release packet written
