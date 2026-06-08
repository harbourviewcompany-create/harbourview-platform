# Marketplace Smoke Tests

## Purpose

These smoke tests verify the marketplace capture spine without relying only on manual browser clicks. They focus on the Supabase REST payloads used by `/marketplace/quote` and listing detail inquiry forms, plus anon RLS behavior for `marketplace_inquiries`.

The current Harbourview schema and capture code use `quote_routing` for quote/general marketplace inquiries. Admin review surfaces label that value as `Quote/general inquiry`; `listing_submission` and `wanted_request_submission` are used for listing and wanted-request capture.

## Scripts

```bash
npm run smoke:marketplace
npm run smoke:marketplace:rls
```

`smoke:marketplace` is dry-run by default. It validates the quote-request and listing-inquiry payload shapes locally and does not call Supabase unless write mode is enabled.

`smoke:marketplace:rls` is a write-based RLS probe. It exits without writes unless `HARBOURVIEW_SMOKE_WRITE=1` is set.

## Required Environment Variables

Read-only payload checks do not require Supabase env vars.

Supabase REST write checks require:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional cleanup requires:

- `SUPABASE_SERVICE_ROLE_KEY`
- `HARBOURVIEW_SMOKE_CLEANUP=1`
- `HARBOURVIEW_SMOKE_ROUTE_SECRET=<random smoke caller secret>`

Never print or commit these values. The scripts do not log keys or real PII.

## Test Data

All write probes use clearly marked synthetic data:

- `contact_email = smoke-test@harbourview.local`
- `contact_name = Harbourview Smoke Test`
- `contact_company = Harbourview Smoke Test`
- `message` contains a unique marker in the format `HV_MARKETPLACE_ACTIVATION_V1_SMOKE_YYYYMMDD_HHMMSS`

## Production-Safe Checks

Safe for production by default:

```bash
npm run smoke:marketplace
```

This validates payload shape only. It confirms quote/general, listing submission and wanted-request submission flows use production columns:

- `listing_id`
- `buyer_request_id`
- `contact_name`
- `contact_email`
- `contact_company`
- `contact_phone`
- `inquiry_type`
- `message`
- `status`

It also fails if old or unsafe columns are present, including `listing_slug`, `listing_title`, `source_url`, `name`, `email`, `company`, `country`, `phone` or `internal_notes`.

## Write Checks

Run write checks only against preview/staging unless production write verification is intentionally approved:

```bash
$env:HARBOURVIEW_SMOKE_WRITE = '1'
npm run smoke:marketplace
```

This inserts one `quote_routing` row, one `listing_submission` row and one `wanted_request_submission` row through the anon Supabase REST path. By default, these rows remain in `marketplace_inquiries` with `status = received`.

To close smoke rows after insertion, provide the server-only service role key and cleanup flag:

```bash
$env:HARBOURVIEW_SMOKE_WRITE = '1'
$env:HARBOURVIEW_SMOKE_CLEANUP = '1'
$env:HARBOURVIEW_SMOKE_ROUTE_SECRET = '<random smoke caller secret>'
npm run smoke:marketplace
```

Cleanup patches inserted smoke rows to `status = closed` and writes an internal note marking smoke cleanup. It does not delete rows.

## RLS Checks

Run RLS checks against preview/staging:

```bash
$env:HARBOURVIEW_SMOKE_WRITE = '1'
npm run smoke:marketplace:rls
```

The RLS script verifies:

- anon valid insert is allowed
- anon select is blocked
- anon update is blocked
- anon insert with `internal_notes` is blocked

If `VERCEL_ENV=production`, the RLS script refuses to run writes unless this explicit override is present:

```bash
$env:HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES = '1'
```

Use that override only when a production smoke row is approved and cleanup expectations are understood.

## Diagnostic UI Selectors

The public forms expose stable selectors for future browser checks:

- `/marketplace/quote`: `data-testid="quote-diagnostic-message"`
- listing detail inquiry form: `data-testid="inquiry-diagnostic-message"`

The visible success codes remain:

- `QUOTE_OK`
- `INQUIRY_OK`

Playwright is not currently installed in this repository. Browser e2e can be added later using these selectors without changing the capture payload contract.

## Remaining Manual Checks

- Confirm the target environment has the intended Supabase URL and anon key.
- Confirm smoke rows appear in admin review surfaces when admin review is enabled.
- Confirm deployment logs contain diagnostic events without secrets or real PII.
- Confirm any production write probe has an explicit approval and cleanup decision.
