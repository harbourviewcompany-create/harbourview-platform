# Harbourview Project State

This file tracks durable project readiness state for Harbourview Marketplace.

## Marketplace capture verification

**Status:** PASS

**Last verified:** 2026-05-03

**Verification method:** Automated production browser smoke through GitHub Actions and Playwright.

**Primary source of truth**

- Workflow run ID: `25268527754`
- Workflow: `.github/workflows/marketplace-browser-smoke.yml`
- Branch: `smoke/marketplace-browser-20260502-envhygiene`
- Deployed production commit: `b740c4486615c18dd73b50ad1ca21b3119d68140`
- Production URL: `https://harbourview-platform.vercel.app`
- Job conclusion: `success`

**Inquiry types verified**

- `quote_routing`
- `listing_submission`
- `wanted_request_submission`

**Cleanup confirmation**

All three smoke rows were marked `closed` after verification.

**Operational impact**

Manual browser testing by Tyler is no longer required for the marketplace quote, standard listing submission or wanted request submission capture path. The automated production smoke workflow verifies browser submission, database row creation and smoke-row cleanup.

## Vercel/Supabase environment hygiene

**Status:** PASS

**Last verified:** 2026-05-03

**Verification method:** Post-cleanup automated production browser smoke against current main.

**Source of truth**

- GitHub Issue: `#37`
- Workflow run ID: `25268527754`
- Smoke branch: `smoke/marketplace-browser-20260502-envhygiene`
- Tested commit: `b740c4486615c18dd73b50ad1ca21b3119d68140`
- Production URL: `https://harbourview-platform.vercel.app`
- Result artifact status: `passed`
- Result artifact exit code: `0`

**Canonical environment conclusion**

- `NEXT_PUBLIC_SUPABASE_URL` remains required for production and preview public Supabase access.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains required and is the primary public client key used by marketplace capture and smoke verification.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` remains optional fallback only.
- `SUPABASE_SERVICE_ROLE_KEY` is not required by the production marketplace browser smoke loop. Current main includes admin role gating from PR #36 that may use `SUPABASE_SERVICE_ROLE_KEY` as a server-only helper for admin role lookup, so it should be treated as intentionally retained only if supporting deployed admin routes.

**Post-cleanup smoke result**

- `quote_routing`: PASS
- `listing_submission`: PASS
- `wanted_request_submission`: PASS
- Smoke cleanup to `closed`: PASS

## Admin access and provenance visibility closure

**Status:** DEPLOYMENT_TRIGGERED

**Last updated:** 2026-05-03

**Source of truth**

- PR #36 merged admin/operator role gate and production public provenance visibility probe.
- Migration `005_user_roles_admin_gate.sql` applied to production Supabase.
- PR #44 added a direct page-level `requireAdminAuth()` guard to `/admin/listings` after production verification found denied anonymous HTML still contained admin-only provenance labels.
- This update exists only to trigger production deployment of the PR #44 main-branch closure commit.

## Current readiness label

`MARKETPLACE_CAPTURE_AND_ENV_HYGIENE_PASSING`
