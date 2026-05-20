# Harbourview Verification Plan

## Purpose

This file defines minimum verification before Harbourview changes are called complete.

## Required verification entry fields

Each entry must include:

- Date/time
- Agent or human
- Branch and commit
- Environment
- Command or workflow
- Inputs used
- Result: pass, fail or blocked
- Exact failure if any
- Artifact/log location
- Follow-up ticket if failed

## Verification levels

### Level 0: Documentation-only

Use when only `docs/**` files changed.

Required:

- File list
- Confirmation no code, config, workflow, migration or package files changed
- No implementation or deployment claims

Runtime commands may be omitted when no markdown tooling exists. State not run and why.

### Level 1: Static implementation

Required for code changes:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

### Level 2: Functional route/UI verification

Required for route, form, UI or server action changes:

- Level 1 checks
- Relevant route exercised locally or in preview
- Success and failure states tested where applicable
- Public/private field exposure reviewed

### Level 3: Marketplace capture verification

Required for listing submission, wanted request, quote routing or marketplace inquiry changes:

```bash
npm run typecheck
npm run build
npm run smoke:marketplace
npm run smoke:marketplace:rls
npm run smoke:marketplace:browser
```

Production browser smoke requires explicit write gate or controlled branch policy.

Expected evidence:

- `quote_routing` row created
- `listing_submission` row created
- `wanted_request_submission` row created
- Smoke rows cleaned up or marked `closed`
- Logs/artifacts captured
- No secret values exposed

### Level 4: Database and RLS verification

Required for migrations, RLS, service-role paths or private/public visibility changes:

- Level 1 checks
- Migration review
- RLS review
- Public leakage test
- Admin/operator visibility test where private fields exist
- Data-path test
- Human approval for production writes

### Level 5: Deployment verification

Required for production deployment, env changes, workflow changes or public domain changes:

- Lower-level checks for changed surfaces
- Deployment target and commit stated
- Production smoke or equivalent verification
- Rollback path
- Evidence update

## Source-of-truth verification pass — 2026-05-16

A read-only Harbourview source-of-truth verification pass inspected repository files and connected evidence without changing runtime code, workflows, package files, migrations, schemas, RLS, Vercel settings, or Supabase settings.

Verified as repo/control evidence:

- App Router structure is present through `app/layout.tsx`, app route files, protected admin route groups, and API route files.
- `docs/control/DESIGN_SYSTEM.md` is the current documented design-system authority.
- Tailwind and global CSS define Harbourview navy/gold/off-white style tokens.
- Playfair Display is not verified as an implemented/imported runtime font. It remains design-direction only until a font import, Tailwind font mapping, global CSS rule, or asset source proves implementation.
- Admin role names are `admin`, `operator`, `analyst`, and `viewer`.
- Admin authorization evidence supports `user_roles` table lookup and the custom `hv-admin-session` cookie path. It does not prove custom JWT claims.
- Protected admin pages use server-side `requireAdminAuth()` before rendering private admin surfaces.
- Public marketplace DTO allowlisting exists in `lib/marketplace/publicListings.ts`.
- Production public-leakage probe script exists and checks forbidden provenance/evidence/internal-review/source strings, but existence of the script is not current pass evidence.
- Smoke-write gates exist in scripts and server smoke verifier paths.

Still-HOLD verification items:

- Current production public leakage pass against `https://harbourview.vercel.app`.
- Current anonymous admin denial proof against `https://harbourview.vercel.app`.
- Full admin role matrix: anonymous, no-role, viewer, analyst, operator, and admin.
- Live Supabase RLS verification for the canonical project.
- Branch protection and required GitHub status contexts.
- Vercel Project ID, Vercel Org ID, and GitHub secret mapping.
- Preview/staging safety and Supabase environment separation.
- Current route map verification for canonical production.
- Resolution of `harbourview-platform.vercel.app` default/reference drift.

## Public leakage checklist

Public pages must not show source URLs, evidence captured, provenance logs, internal notes, admin status history, raw contact fields or service-role diagnostics.

## Globe homepage checklist

Verify text and CTAs render before delayed globe, Marketplace CTA appears in the first mobile viewport, reduced motion disables animation, static fallback is usable and no fake live data appears.

## Evidence quality

Acceptable:

- Command output
- Workflow run ID/link
- Test artifact
- Smoke JSON
- Screenshot with route and branch context
- Commit hash

Unacceptable:

- `tested manually` without steps
- passing claim without command output
- local-only proof for production claim
- agent confidence

## Stop conditions

Stop if dependencies fail to install, required secrets are missing, production write gate is not satisfied, public route leaks private fields or DB state cannot be safely inspected.

## Completion criteria

Verification is complete only when commands/workflows are listed, results are pass/fail/blocked, evidence location is recorded and failures have a next ticket.

## Live Source Intake V0 Verification

Required for changes to private source intake, marketplace candidates or the consumables category foundation:

```bash
npm run typecheck
npm run build
npm run test:admin-guard
npm run test:visibility
npm run test:live-source-intake
```

If deployment authority is present, also run:

```bash
npm run probe:production-visibility
```

Required checks:

- migration `007_live_source_intake_v0_consumables.sql` creates only private intake/candidate tables
- RLS is enabled and deny-by-default for anonymous users
- admin/operator-only access uses existing `public.user_roles`
- `/admin/sources` and `/admin/candidates` are directly guarded with `requireAdminAuth()`
- V0 source capture remains manual-only and stores `fetch_status = skipped`
- candidate workflow never publishes publicly
- restricted/excluded consumables and licence-review candidates cannot reach `approved_draft`
- public consumables UI uses only safe inquiry-first labels
- public leakage probes include private source/candidate table and field names
