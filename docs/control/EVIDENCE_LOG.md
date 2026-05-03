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

## Evidence control standard

This section is part of Harbourview Project Control Pack V1. It preserves the existing production evidence above and adds the durable standard for future evidence entries.

### Purpose

If a fact is not recorded here, in `PROJECT_STATE.md` or in a directly referenced PR/workflow artifact, it must not be treated as verified.

### Required evidence fields

Every future evidence entry must include:

- Evidence ID
- Date/time UTC
- Agent or human
- Branch and commit
- Environment
- Claim being verified
- Method: command, workflow, file inspection or source
- Result: pass, fail, blocked or informational
- Key output
- Artifact/log location
- Follow-up action

### Evidence quality levels

| Level | Evidence type | Use |
|---|---|---|
| E0 | User instruction or locked context | Product/brand authority, not implementation proof |
| E1 | File inspection | Repository content only |
| E2 | Local command output | Local branch behavior |
| E3 | CI workflow result | CI branch behavior |
| E4 | Preview deployment verification | Preview behavior |
| E5 | Production verification | Production behavior for stated target and commit |

### Acceptable evidence

- Command output summary with exact command and result
- Workflow run ID or URL
- Test artifact
- Smoke result JSON
- Screenshot with route, viewport, branch and commit context
- PR diff and commit hash

### Unacceptable evidence

- Agent confidence
- `tested manually` without steps
- Screenshot without branch/route context
- Passing claim without command or workflow output
- Local-only evidence for a production claim
- Secret values in logs or docs

### Forbidden vague language

Do not use:

- verified in spirit
- evidence pending but complete
- logs unavailable but passed
- checked quickly
- production confirmed without target and commit

### Completion criteria

Evidence is acceptable only when it names exactly what was checked, states pass/fail/blocked/informational, does not prove more than it actually proves and points to a file, command, workflow, log or artifact.
