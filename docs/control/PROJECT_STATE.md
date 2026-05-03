# Harbourview Project State

This file tracks durable project readiness state for Harbourview Marketplace.

## Marketplace capture verification

**Status:** PASS

**Last verified:** 2026-05-02

**Verification method:** Automated production browser smoke through GitHub Actions and Playwright.

**Primary source of truth**

- Workflow run ID: `25262919514`
- Workflow: `.github/workflows/marketplace-browser-smoke.yml`
- Branch: `smoke/marketplace-browser-20260502-2156`
- Deployed production commit: `c4d8f2db8362c1e479aa0ffa318a1cabec427bb2`
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

**Known remaining risk**

Vercel environment key drift still exists and should be cleaned up separately. The smoke loop is no longer blocked by manual form testing, but environment hygiene remains a follow-up risk.

## Current readiness label

`MARKETPLACE_CAPTURE_SMOKE_PASSING`
