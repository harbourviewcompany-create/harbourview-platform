# API Source Integration (Legal-Tech & Regulatory)

**Status:** Live on `feat/api-adapter-legal-tech` · **Owner:** Harbourview Intelligence

The Intelligence Engine already routes `source_registry.adapter = 'api'` to `APIDataAdapter`. This document describes how to register cannabis legal-tech and regulatory APIs so they flow through the same snapshot → extract → classify → promote pipeline as HTML/RSS sources.

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
  "auth_env": "CANNABIZ_API_KEY"
}
```

- **`headers`** — static headers. Never put secrets here.
- **`auth_env`** — name of a process.env variable. The adapter injects `Authorization: Bearer ${process.env[auth_env]}`. Secrets stay in Vercel/Supabase env, never in the registry.
- **`timeout_ms`** — capped at 60 s; default 15 s.
- **`accept`** — overrides the default `application/json`.

## Recommended Tier-1 seeds (public or easily licensed)

Insert via SQL or admin tooling. Verify each URL at load time; regulators change paths.

```sql
-- Example: California-style public license directory (replace with live URL)
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata
) VALUES (
  'CA DCC License Directory API',
  'https://example-dcc-api.example/v1/licenses',  -- replace with real endpoint
  'US',
  'api',
  'daily',
  1,
  ARRAY['regulatory'],
  'en',
  false,
  true,
  true,
  '{}'::jsonb
);

-- Example: env-backed commercial verification API
INSERT INTO public.source_registry (
  source_name, source_url, iso, adapter, crawl_cadence, tier,
  content_type, language, requires_translation, is_active, crawl_allowed,
  metadata
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
  '{"auth_env": "CANNABIZ_API_KEY", "timeout_ms": 20000}'::jsonb
);
```

After insert, the next `intelligence-ingest` cron run will pick the row up via `acquire_crawl_targets` (or the fallback path). Snapshots land in `source_snapshots` with `processing_status = 'pending_extraction'` and continue through the existing quality brain.

## What this deliberately does *not* do

- No authentication bypass, CAPTCHA solving, or anti-bot evasion.
- No storage of API keys in `source_registry`.
- No separate pipeline — API sources use the same hash → extract → classify → promote path.
- Metrc Connect and other gated track-and-trace systems require formal integrator status before any production seed.

## Verification checklist

1. Adapter returns `status: 'success'` and a stable `content_hash` for unchanged payloads.
2. `source_snapshots.changed` is true only when the JSON body changes.
3. Downstream signals receive correct `source_id` / provenance.
4. Per-source yield metrics (Source Expansion Plan §4) include the new API rows.
5. No private headers or secrets appear in public DTOs or logs.

## Related code

- `lib/intelligence-engine/adapters/api-fetcher.ts`
- `lib/intelligence-engine/orchestrator.ts` (`selectAdapter` → `'api'`)
- `lib/intelligence-engine/queue/task-queue.ts` (passes `metadata`)
- `docs/SOURCE_EXPANSION_PLAN.md` (Tier-1 primary sources)
