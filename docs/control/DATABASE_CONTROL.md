# Harbourview Database Control

Authority: Harbourview Project Control Pack V1  
Project: Harbourview Platform

## Purpose

This file controls all Harbourview database, Supabase, RLS, service-role and data-model work. It prevents unsafe migrations, unverifiable schema assumptions and public leakage of private marketplace or intelligence data.

## Required fields for database work

Every database-affecting ticket must state:

- Database target
- Environment: local, preview, staging or production
- Tables affected
- Columns affected
- RLS policies affected
- Functions, triggers or views affected
- Service role paths affected
- Public API routes affected
- Migration file name
- Backward compatibility impact
- Rollback or forward-fix path
- Required test commands
- Human approval status

## Verified database-adjacent facts from reviewed repo files

The following are verified from code references only. They are not proof of live database state.

| Fact | Source |
|---|---|
| Smoke verifier route exists at `app/api/smoke/marketplace/route.ts`. | Repo file on `main` |
| Smoke verifier uses Supabase REST against table `marketplace_inquiries`. | Repo file on `main` |
| Smoke verifier selects `id`, `inquiry_type`, `status`, `contact_email`, `message` and `created_at`. | Repo file on `main` |
| Smoke verifier patches `status` and `internal_notes` during smoke cleanup. | Repo file on `main` |
| Accepted smoke inquiry types are `quote_routing`, `listing_submission` and `wanted_request_submission`. | Repo file on `main` |
| Smoke verifier expects a service role key from `SUPABASE_SERVICE_ROLE_KEY`. | Repo file on `main` |
| Smoke verifier falls back to locked host `zvxdgdkukjrrwamdpqrg.supabase.co` if public Supabase URL is missing or mismatched. | Repo file on `main` |

## Explicitly unverified database state

Do not claim any of the following until directly verified:

- `marketplace_inquiries` table exists in production
- Column types and constraints
- RLS enabled or disabled state
- RLS policy correctness
- Migration history
- Whether `internal_notes` exists in the live table
- Whether smoke rows are created and closed in production
- Whether service role key is configured in GitHub Actions or Vercel
- Whether public anon access is safely restricted
- Whether admin/operator views expose provenance only to authorized users

## Data classification

| Data class | Examples | Public visibility |
|---|---|---|
| Public listing display fields | Approved listing title, category, general description, location range if approved | Allowed only after review |
| Submission contact data | Name, email, phone, company, private notes | Never public by default |
| Buyer inquiry data | Quote request, target market, budget, requirements, buyer identity | Never public by default |
| Wanted request submitter data | Contact fields and internal negotiation details | Never public by default |
| Source/provenance data | Source URLs, evidence captured, internal review workflow, provenance logs | Admin/operator only |
| Admin workflow data | Status history, internal notes, review decisions | Admin/operator only |
| Secrets | Supabase keys, service role key, tokens | Never logged or exposed |

## Public visibility rule

Public users must not see:

- Source URLs
- `View source listing`
- Evidence captured
- Provenance logs
- Internal review workflow
- Internal notes
- Admin status history
- Raw submitter contact data
- Service role diagnostics

Admin/operator views may show these only after auth and role checks are verified.

## Migration rules

Every migration must:

- Be additive where possible.
- Be named clearly.
- Include RLS implications.
- Avoid destructive operations unless approved.
- Preserve existing data unless approved.
- Include rollback or forward-fix notes.
- Avoid writing real confidential seed data.
- Be testable locally or in a controlled environment.

Forbidden without explicit approval:

- Dropping tables
- Dropping columns
- Disabling RLS
- Broadening public select policies
- Granting write access to anon users
- Exposing service-role behavior through public routes
- Backfilling production data without dry-run evidence

## RLS rules

Default posture:

- Public read is deny-by-default unless a route or view is explicitly designed for public display.
- Public insert may exist for controlled intake forms only, with validation and no public readback of private fields.
- Admin/operator access must be role-gated.
- Service role access must remain server-only.
- Provenance and evidence fields are private by default.

## Service role rules

Service role code must:

- Run server-side only.
- Never ship to browser bundles.
- Never log raw key values.
- Validate target Supabase project host.
- Validate request inputs.
- Return only minimal safe diagnostics.
- Be covered by tests or smoke verification where feasible.

## Required verification for database changes

At minimum:

- Static code review of all affected server routes/actions
- Migration review
- RLS review
- Typecheck
- Build
- Targeted data-path test or smoke test
- Public leakage test where public routes are affected
- Admin visibility test where admin/private fields are affected

## Forbidden vague language

Do not use:

- database is wired
- RLS handled
- secure table
- admin only without naming the policy or gate
- source hidden without a public leakage test
- migration safe without rollback analysis
- service role protected without server-only proof

## Completion criteria

Database work is complete only when:

- Live or local environment inspected is named.
- SQL or migration files are listed.
- RLS impact is explicit.
- Public/private field exposure is reviewed.
- Tests or smoke evidence are recorded.
- Any production write had human approval.
