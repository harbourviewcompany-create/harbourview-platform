# Harbourview Evidence Log

This file records release evidence for Harbourview Marketplace production gates.

## 2026-05-05: Marketplace Buy/Sell Conversion V1

**Evidence ID:** `HV-MARKETPLACE-BUY-SELL-CONVERSION-V1`

**Branch:** `marketplace-buy-sell-conversion-v1`

**Agent:** Claude (automated)

**Claim being verified:** Public marketplace pages have been converted from a quote/supply funnel to a controlled buy/sell marketplace. Seller-side fee disclosure has been added to the seller intake page. Normal buyer inquiries do not display fee language. Buyer-side commercial terms are reserved for active sourcing/mandate paths only. No schema, RLS, admin auth or capture route changes were made.

**Files changed**

| File | Change |
|---|---|
| `app/marketplace/page.tsx` | Rewritten — buy/sell hero ("Buy and sell equipment, supplies, services and commercial opportunities"), "How deals work" 4-step block, "List Something for Sale" / "Browse Marketplace" / "Post What You Want to Buy" CTAs, category grid reordered to prioritise Used & Surplus, Business Opportunities |
| `app/marketplace/sell/page.tsx` | Seller flow — default headline "List Something for Sale", seller fee disclosure box, accepted detail checklist, seller acknowledgment statement, seller-side fee language only; wanted path "Post What You Want to Buy" with wanted-request instruction, no fee language |
| `app/marketplace/quote/page.tsx` | Renamed to buyer inquiry — headline "Inquire to Buy", buyer routing copy, no fee language |
| `app/marketplace/quote/QuoteRequestForm.tsx` | Buyer inquiry form — labels, fields, success message updated to buyer inquiry framing; added Intended Use field; `inquiry_type` remains `quote_routing`; success message updated |
| `app/marketplace/consumables/page.tsx` | Buy/sell framing — "Inquire to Buy" primary CTA, "Post What You Want to Buy" secondary, "List Supply for Sale" tertiary; no fee language |
| `app/marketplace/wanted/page.tsx` | "Post What You Want to Buy" headline and CTAs; guidance blocks reworded; active-sourcing caveat added only to the private-routing step |
| `app/marketplace/consumables/[id]/page.tsx` | **New file** — 8 static listing detail pages pre-rendered via `generateStaticParams`; buyer section, seller section, compliance note, "Inquire to Buy" / "List Similar Item" / "Post What You Want to Buy" CTAs; no fee language; "Representative image" badge |
| `components/ListingCard.tsx` | Default CTA label changed from "Request Quote" to "Inquire to Buy"; removed consumables-specific "Request Supply Information" branch |
| `components/InquiryLink.tsx` | Default label changed from "Request Quote" to "Inquire to Buy" |
| `components/Nav.tsx` | "Submit Supply" → "List for Sale"; "Source-Backed Listings" dropdown item → "Marketplace Listings" (visibility fix) |

**New routes added**

- `/marketplace/consumables/cons-001` through `/marketplace/consumables/cons-008` (8 static detail pages)

**Before/after CTA behavior**

| Location | Before | After |
|---|---|---|
| `/marketplace` hero | Submit Supply, Post Wanted Request, Request Confidential Support | List Something for Sale, Browse Marketplace, Post What You Want to Buy |
| `/marketplace/sell` (default) | Submit Supply for Review | List Something for Sale + seller fee disclosure |
| `/marketplace/sell?type=wanted` | Post a Wanted Request | Post What You Want to Buy + wanted instruction |
| `/marketplace/quote` | Request Quote | Inquire to Buy |
| `/marketplace/consumables` | Request Supply Information | Inquire to Buy |
| Listing cards | Request Quote | Inquire to Buy |
| Nav | Submit Supply | List for Sale |

**Fee model correction**

- Seller listing page (`/marketplace/sell`): seller fee disclosure box added. Seller acknowledgment statement added. No buyer fee language.
- Buyer inquiry page (`/marketplace/quote`): no fee language. Only routing/privacy note.
- Wanted request path: no default fee language. Active-sourcing caveat only in the private-routing step description.
- Listing detail pages (`/marketplace/consumables/[id]`): no fee language.
- Listing cards: no fee language.

**Confirmation: normal buyer inquiries do not show fee language**

CONFIRMED. Fee language appears only on `/marketplace/sell` (seller path). No fee language on `/marketplace/quote`, listing cards, listing detail pages, `/marketplace/consumables`, or `/marketplace/wanted`.

**Admin triage labeling**

Submitted inquiries continue to use existing `inquiry_type` values:
- Seller listing submissions: `listing_submission`
- Buyer inquiries: `quote_routing`
- Wanted requests: `wanted_request_submission`
- Confidential intake / sourcing mandate: `sourcing_mandate`

Submitted message content for seller listings now includes "Harbourview action requested: Review listing fit, verify required details…". Buyer inquiry message includes "Harbourview action requested: Review buyer inquiry, assess fit, and coordinate introduction or transaction follow-up where appropriate."

**Post-launch operator workflow (evidence doc)**

Seller submission → review listing → confirm seller authority → confirm seller-side commercial terms where appropriate → approve/publish or route privately → buyer inquiry received → qualify buyer seriousness → coordinate introduction or follow-up through Harbourview → track negotiating / closed / lost

**Tests run**

| Test | Command | Result |
|---|---|---|
| Next.js build | `npm run build` | PASS — 41 pages compiled; all 8 `consumables/[id]` paths pre-rendered |
| Public provenance visibility | `npm run test:visibility` | PASS — all 4 checks pass after fixing "Source-Backed" → "Marketplace Listings" in Nav |
| TypeScript typecheck | `npm run typecheck` | Pre-existing env-level type errors only (same as `main`). No new errors from these changes. |

**Leakage result**

PASS. No forbidden strings exposed in any public render file after "Source-Backed" nav label fix.

**Hard boundaries confirmed**

- No migrations, schema or RLS changes
- No admin auth or adminGuard changes
- No protected admin route changes
- No `/api/marketplace/capture` behavior changes
- No seller private contact details exposed publicly
- No buyer private contact details exposed publicly
- No verified/guaranteed/confirmed buyer language used
- No fake prices, fake seller identities or fake availability added
- No source/provenance/admin fields exposed publicly

**Final verdict:** READY TO MERGE

## 2026-05-04: Marketplace Commercial Polish V1

**Evidence ID:** `HV-MARKETPLACE-COMMERCIAL-POLISH-V1`

**Branch:** `marketplace-commercial-polish-v1`

**Commit:** `dd6fee681edff33d28eae2b757684d771b4a0162`

**Environment:** Local built Next.js app at `http://127.0.0.1:3100`

**Claim being verified:** Public marketplace copy, CTA routing and consumables/wanted-request framing improve supplier acquisition and inbound deal-flow conversion without changing schema, RLS, admin authorization, protected admin routes, Supabase helpers or capture API behavior.

**Files changed**

- `app/marketplace/page.tsx`: marketplace hero, CTAs, inquiry handling block and supplier acquisition section
- `app/marketplace/consumables/page.tsx`: consumables hero copy, CTA routes and metadata
- `app/marketplace/wanted/page.tsx`: wanted-request copy, metadata and direct wanted CTA
- `app/marketplace/sell/page.tsx`: submit/wanted copy, metadata and wanted-request instruction state
- `components/ListingCard.tsx`: public-safe consumables CTA label
- `components/Nav.tsx`: public nav label changed from submit listing to submit supply
- `lib/fixtures/consumables.ts`: opportunity-style consumables fixture titles and descriptions
- `docs/control/EVIDENCE_LOG.md`: this evidence entry
- `docs/control/PROJECT_STATE.md`: branch state note

**Routes affected**

- `/marketplace`
- `/marketplace/consumables`
- `/marketplace/wanted`
- `/marketplace/sell`
- `/marketplace/sell?type=wanted`
- `/marketplace/quote?listing=Consumables%20and%20Operating%20Supplies`
- `/intake`

**CTA map**

| Source | CTA | Target | Evidence |
|---|---|---|---|
| `/marketplace` | Submit Supply | `/marketplace/sell` | `data-testid="marketplace-submit-supply"` found |
| `/marketplace` | Post Wanted Request | `/marketplace/sell?type=wanted` | `data-testid="marketplace-post-wanted-request"` found |
| `/marketplace` | Request Confidential Support | `/intake` | `data-testid="marketplace-request-confidential-support"` found |
| `/marketplace` | Submit Supply for Review | `/marketplace/sell` | `data-testid="marketplace-submit-supply-secondary"` found |
| `/marketplace/consumables` | Request Supply Information | `/marketplace/quote?listing=Consumables%20and%20Operating%20Supplies` | `data-testid="consumables-request-supply-info"` found |
| `/marketplace/consumables` | Post a Wanted Request | `/marketplace/sell?type=wanted` | `data-testid="wanted-post-request"` found |
| `/marketplace/wanted` | Post a Wanted Request | `/marketplace/sell?type=wanted` | `data-testid="wanted-post-request"` found |

**Route QA result**

Local built app route inventory:

- `/marketplace`: `200`, submit supply CTA found, post wanted CTA found, inquiry-route copy found, supplier section found
- `/marketplace/consumables`: `200`, supply information CTA found, consumables cards found
- `/marketplace/wanted`: `200`, wanted CTA found
- `/marketplace/sell`: `200`
- `/marketplace/sell?type=wanted`: `200`, wanted headline found, wanted instruction found
- `/marketplace/quote?listing=Consumables%20and%20Operating%20Supplies`: `200`
- `/intake`: `200`

**Mobile QA result**

Responsive implementation inspection passed for requested viewport targets:

- `390px`: CTA groups use `flex-col` stacking before `sm`; primary CTA remains near the first viewport on `/marketplace`; wanted instruction appears before the form.
- `768px`: CTA groups and cards move into tablet-safe `sm` layouts without fixed widths.
- `1440px`: category and card grids use constrained `page-container` layouts and responsive grid columns.

Screenshot capture was documented instead of written because this local Windows environment exposes no Chrome/Edge executable and the project does not include Playwright or Puppeteer. No browser package was added for this rollback-safe copy patch.

**Duplicate-content check result**

Consumables fixture titles are unique by source inspection, generic `Category` titles were removed from `lib/fixtures/consumables.ts`, and `/marketplace/consumables` returned `200` with opportunity-style card copy. No schema or database presentation logic was changed.

**Tests run**

- `npm run typecheck`: PASS
- `npm run build`: PASS, with existing non-blocking `<img>` optimization warnings in `components/ListingCard.tsx` and `components/MarketplaceCard.tsx`
- `npm run test:visibility`: PASS
- `npm run test:admin-guard`: PASS

**Leakage result**

`npm run test:visibility` passed. Public render/projection checks retained the forbidden source/provenance/admin/private field set, including `View source listing`, `sourceUrl`, `sourceName`, `Evidence captured`, `provenanceSummary`, `sourceEvidence`, `verificationStatus`, `availabilityStatus`, `sellerAuthorizationStatus`, `internalReviewNotes`, `reviewedBy`, `lastReviewedAt`, `nextReviewDueAt`, `source_registry`, `source_snapshots`, `marketplace_candidates` and `candidate_review_events`.

**Final local verdict**

`READY_TO_MERGE_LOCAL`

## 2026-05-04: Live Source Intake V0 and Consumables Foundation implementation

**Evidence ID:** `HV-LIVE-SOURCE-INTAKE-V0-CONSUMABLES`

**Branch:** `feature/live-source-intake-v0-consumables`

**Claim being verified:** The repo contains a private admin/operator-only source intake and candidate review foundation, with a public-safe `Consumables & Operating Supplies` category and no automatic publication.

**Implementation evidence**

- Migration: `supabase/migrations/007_live_source_intake_v0_consumables.sql`
- Admin routes: `/admin/sources`, `/admin/sources/new`, `/admin/sources/[id]`, `/admin/candidates`, `/admin/candidates/[id]`
- Private tables: `source_registry`, `source_snapshots`, `marketplace_candidates`, `candidate_review_events`
- Public category: `Consumables & Operating Supplies`

**Limitations**

- Automatic fetch is deferred in V0 because SSRF-safe fetching is intentionally out of scope.
- No `candidate_publication_links` table is created in V0.
- No production migration or deployment is implied by this evidence entry.

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
