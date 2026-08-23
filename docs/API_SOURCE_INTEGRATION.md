# API Source Integration (Legal-Tech & Regulatory)

**Status:** Merged via PR #1202 (2026-07-30) · **Follow-up:** ETag / unchanged on `feat/api-adapter-etag-unchanged`  
**Owner:** Harbourview Intelligence

The Intelligence Engine routes `source_registry.adapter = 'api'` to `APIDataAdapter`. API sources flow through the same snapshot → extract → classify → promote pipeline as HTML/RSS sources.

## Adapter contract

| Field | Source | Notes |
|-------|--------|-------|
| `adapter` | `source_registry.adapter` | Must be exactly `'api'` |
| `source_url` | `source_registry.source_url` | Full JSON endpoint URL |
| `metadata` | `source_registry.metadata` (jsonb) | Optional config (see below) |
| `crawl_cadence` | existing column | `'daily'`, `'weekly'`, or numeric hours |
| `tier` | existing | Prefer `1` for official license/regulatory APIs |
| `content_type` | existing array | Prefer `'{regulatory}'` or `'{scientific}'` |
| `language` | existing | Usually `'en'` for structured APIs |
| `requires_translation` | existing | Almost always `false` for JSON APIs |

### `metadata` shape (all optional)

```json
{
  "headers": {
    "X-Custom-Header": "value"
  },
  "accept": "application/json",
  "timeout_ms": 20000,
  "auth_env": "CANNABIZ_API_KEY",
  "last_etag": "\"W/\\\"abc123\\\"\""
}
```

- **`headers`** — static headers. Never put secrets here.
- **`auth_env`** — name of a process.env variable. The adapter injects `Authorization: Bearer ${process.env[auth_env]}`. Secrets stay in Vercel/Supabase env, never in the registry.
- **`timeout_ms`** — capped at 60 s; default 15 s.
- **`accept`** — overrides the default `application/json`.
- **`last_etag`** — written by the orchestrator after a successful API crawl that returned an `ETag` header. Sent as `If-None-Match` on the next request.

Orchestrator-injected per request (not stored):

- **`previous_hash`** — last successful `source_snapshots.raw_html_hash`; adapter returns `status: 'unchanged'` when body hash matches. Stripped before any metadata write-back.

### Change detection

| Result | Meaning |
|--------|---------|
| `success` | Valid JSON, body differs from previous hash → snapshot with `pending_extraction`; response ETag persisted to `metadata.last_etag` when present |
| `unchanged` | 304 or hash match → schedule advanced, **no** extraction queue; ETag refreshed when the server returns one |
| `failed` | HTTP error, invalid JSON, missing `auth_env` secret |

`unchanged` is treated as a successful crawl for circuit-breaker and cadence backoff (1.5× base when content does not change).

## Seeded public API rows (migration `20260729130000`)

All no-auth. Idempotent inserts via `source_url` uniqueness check.

| Name | URL | Cadence | Tier |
|------|-----|---------|------|
| Texas COA — 50-state hemp compliance matrix | `https://texascoa.com/api/v1/coa/public/states` | daily | 1 |
| Texas COA — TX flower state-check | `https://texascoa.com/api/v1/compliance/state-check?state=TX&product_type=flower` | daily | 1 |
| Nabis UCAPI well-known | `https://platform-api.nabis.pro/ucapi/.well-known/cannabis-api.json` | weekly | 2 |
| Colorado CIM — Marijuana Sales Revenue | `https://data.colorado.gov/resource/j7a3-jgd3.json?$limit=5000` | weekly | 1 |
| Colorado CIM — Marijuana tax retained-by-state | `https://data.colorado.gov/resource/v9m8-x8dh.json?$limit=5000` | weekly | 1 |
| Open Definition — open licenses catalog | `https://licenses.opendefinition.org/licenses/groups/all.json` | monthly | 3 |

## Additional seeds (manual / after contract)

```sql
-- Example: env-backed commercial verification API
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata, source_type
) VALUES (
  'Cannabiz Media License Verification',
  'https://api.example.com/v1/verify',  -- replace after contract
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{"auth_env": "CANNABIZ_API_KEY", "timeout_ms": 20000}'::jsonb,
  'regulatory'
);
```

After insert, the next `intelligence-ingest` cron run will pick the row up via `acquire_crawl_targets` (or the fallback path).

## What this deliberately does *not* do

- No authentication bypass, CAPTCHA solving, or anti-bot evasion.
- No storage of API keys in `source_registry`.
- No separate pipeline — API sources use the same hash → extract → classify → promote path.
- Metrc Connect and other gated track-and-trace systems require formal integrator status before any production seed.
- No distributed per-source rate limiter (serverless-local only is unreliable); rely on circuit breaker + `Retry-After`.

## Verification checklist

1. Adapter returns `status: 'success'` and a stable `content_hash` for unchanged payloads; second run returns `unchanged` when body is identical.
2. `source_snapshots.changed` is true only when the JSON body changes; unchanged does not enqueue `pending_extraction`.
3. After a 200 with `ETag`, `source_registry.metadata.last_etag` is set; the next crawl sends `If-None-Match`.
4. Downstream signals receive correct `source_id` / provenance.
5. Per-source yield metrics (Source Expansion Plan §4) include the new API rows.
6. No private headers or secrets appear in public DTOs or logs.

## Related code

- `lib/intelligence-engine/adapters/api-fetcher.ts`
- `lib/intelligence-engine/orchestrator.ts` (`selectAdapter` → `'api'`, previous_hash injection, last_etag persist)
- `lib/intelligence-engine/queue/task-queue.ts` (passes `metadata`)
- `docs/SOURCE_EXPANSION_PLAN.md` (Tier-1 primary sources)
- Migration: `supabase/migrations/20260729130000_source_registry_metadata_and_api_seeds.sql`
