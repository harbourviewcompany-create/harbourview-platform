# Harbourview Evidence Log

This file records release evidence for Harbourview Marketplace production gates.

## 2026-05-02: Automated production marketplace capture smoke passed

**Objective:** Prove that Tyler no longer needs to manually test marketplace quote, listing submission or wanted request capture after deployment.

**Evidence status:** PASS

**Primary verified GitHub Actions run**

- Workflow run ID: `25262919514`
- Workflow: `.github/workflows/marketplace-browser-smoke.yml`
- Job: `Browser-submit marketplace capture and verify Supabase rows`
- Job conclusion: `success`
- Production write gate: accepted through controlled smoke branch
- Production URL tested: `https://harbourview-platform.vercel.app`
- Deployed production commit tested: `c4d8f2db8362c1e479aa0ffa318a1cabec427bb2`
- Smoke branch: `smoke/marketplace-browser-20260502-2156`

**Production flows verified**

- `/marketplace/quote` submitted successfully and created `marketplace_inquiries.inquiry_type = 'quote_routing'`
- `/marketplace/sell` submitted a standard listing and created `marketplace_inquiries.inquiry_type = 'listing_submission'`
- `/marketplace/sell` submitted a wanted request and created `marketplace_inquiries.inquiry_type = 'wanted_request_submission'`

**Database verification and cleanup**

- Verification was performed through the controlled production smoke verifier.
- All smoke rows were marked `closed` after verification.
- GitHub job log confirms: `ok cleanup:closed 3 browser smoke rows`.

**Corroborating result artifact**

The controlled smoke branch also contains `smoke-results/marketplace-browser-smoke-latest.json`, reporting:

- Status: `passed`
- Exit code: `0`
- Artifact workflow run ID: `25262956566`
- Branch: `smoke/marketplace-browser-20260502-2156`
- Production URL: `https://harbourview-platform.vercel.app`
- Expected inquiry types: `quote_routing`, `listing_submission`, `wanted_request_submission`
- Expected cleanup status: `closed`

The requested source-of-truth run ID was `25262919514`. The result artifact on the branch was later updated by another successful controlled run, `25262956566`. Both GitHub Actions job records are successful. This entry anchors release evidence to `25262919514` and treats `25262956566` as corroborating evidence.

**Known remaining risk**

Vercel environment key drift was observed during hardening. The automated browser smoke loop is no longer blocked by manual form testing, but Vercel Supabase environment variables should still be cleaned up in a separate environment hygiene ticket to remove stale or duplicate keys.

**Release decision**

Automated production marketplace capture verification is passing for quote routing, listing submission and wanted request submission. This evidence supports marking the marketplace capture smoke gate as passed.
