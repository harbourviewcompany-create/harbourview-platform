# Phase 2 — Environment wiring

Required for shipped spines to deliver value in production. Code paths no-op or degrade safely when unset.

| Variable | Used by | Effect if missing |
|----------|---------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Playbooks, inquiries, auth | Plans/coverage empty; forms fail |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public REST + client | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Crons, cadence upsert | Cron synthesis/email fail |
| `CRON_SECRET` | All `/api/cron/*` | 401 Unauthorized |
| `RESEND_API_KEY` | Signal digests + personal briefings | Email skipped |
| `HARBOURVIEW_FROM_EMAIL` | Resend from | Defaults `signals@harbourview.co` |
| `NEXT_PUBLIC_SITE_URL` | Email links | Defaults `https://harbourview.co` |
| `NEXT_PUBLIC_HARBOURVIEW_BNPL_EMBED_URL` | Financing partner iframe | Empty state (inquiry only) |
| `NEXT_PUBLIC_ENABLE_SW` | Service worker in development | SW off in dev unless `1` |
| `MELTWATER_API_KEY` | meltwater-enrich cron + connector | Connector no-ops; cron skips fetch |
| `MELTWATER_SEARCH_IDS` | meltwater-enrich cron | Cron returns skipped (comma-separated IDs) |
| `MELTWATER_LOOKBACK_HOURS` | meltwater-enrich | Defaults to 48 |
| `BIGQUERY_PROJECT` | BigQuery enrichment connector | Connector no-ops |
| `GOOGLE_APPLICATION_CREDENTIALS` / `GCP_SERVICE_ACCOUNT_JSON` | BigQuery + Google Calendar | Connectors no-op |
| `HUBSPOT_ACCESS_TOKEN` / `HUBSPOT_API_KEY` | HubSpot preference stub | Stub no-ops |
| `GOOGLE_CALENDAR_ID` | Google Calendar stub | Stub no-ops |
| `GOOGLE_CALENDAR_CREDENTIALS` | Google Calendar stub | Stub no-ops |

## Vercel cron paths (vercel.json)

| Schedule (UTC) | Path |
|----------------|------|
| 02:00 | `/api/cron/intelligence-ingest` |
| 03:00 | `/api/cron/meltwater-enrich` |
| 03:00 | `/api/cron/prune-client-errors` |
| 04:00 | `/api/cron/intelligence-extract` |
| 06:00 | `/api/cron/intelligence-embed` |
| 07:00 | `/api/cron/intelligence-notify` |
| 08:30 | `/api/cron/personal-briefings-tick` |
| … | See `vercel.json` for full list |

## Operator actions

1. Confirm all rows above on Vercel Production env.
2. Run `personal-briefings-tick?dry=1` with Bearer secret.
3. Run `meltwater-enrich?dry=1` after setting `MELTWATER_API_KEY` + `MELTWATER_SEARCH_IDS`.
4. Set BNPL embed URL only after partner contract + HTTPS endpoint review.
