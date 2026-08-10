# Cron / Pipeline Dependency Map

Built 2026-07-22 by tracing every active `cron.job` to its actual function
source (`pg_get_functiondef`) and the tables it reads/writes — not inferred
from job names. Written because the platform has accumulated several
independent pipelines with no single owner or shared documentation, which
made a Market Routing latency incident hard to diagnose (see
`docs/control/*` diagnosis notes / chat history 2026-07-21/22).

## Headline finding: there are (at least) four independent content systems

| System | Core table(s) | Populated by |
|---|---|---|
| Regulatory intel feed | `public.signals` (+ `signal_classifications`, `editorial_title/blurb`) | `hv-classify` edge fn + `intel_pipeline_tick()` (not in the active-cron list below as of 2026-07-21 — see note) |
| "Intelligence OS" | `ia_signals`, `ia_counterparties`, `ia_scoring_records`, `ia_graph_entities/edges` | jobs 11,12,16,17,18,21 below |
| Country briefings | `cc_jurisdiction_briefings`, `country_intel` | job 19 (`run_country_intel_enrichment`) enriches `country_intel`; `cc_jurisdiction_briefings` population source not traced in this pass |
| Daily Wire / editorial digest | `editorial_items`, `daily_digest.editorial_headlines` | `run_editorial_digest` (job 23) *consumes* `editorial_items` but **nothing in the active cron list populates it** — 469 rows, newest today, so something else is feeding it (open question, not traced) |

These do not currently share data with each other. Treat them as separate
products when reasoning about "the pipeline" — there isn't one.

## Confirmed sequential pipeline (leave alone — already correctly staggered)

Daily, 6:00am–7:00am, deliberately ordered:

```
6:00 job1 source-engine-daily-pass1  ─┐
6:15 job2 source-engine-daily-pass2   │  source-engine-fetch edge fn,
6:30 job3 source-engine-daily-pass3   │  writes source_snapshots
6:45 job4 source-engine-daily-pass4  ─┘  (processing_status='pending')
6:50 job8 source-engine-daily-extract    hv_extract_signals_from_captured_text(400)
                                          reads pending snapshots, writes
                                          signal_candidates, sets 'extracted'
7:00 job5 source-engine-daily-promote    promote_all_extracted_snapshots()
                                          reads 'extracted' snapshots, calls
                                          promote_snapshot_to_signals() per row
```
Each step's 10–15 min gap is load-bearing. Do not collapse or reorder.

## Half-hourly "Intelligence OS" jobs — confirmed real dependencies

- `sync_ia_scoring` (job 18, sync-scoring, `:35`) writes `ia_scoring_records`
  from `ia_counterparties`.
- `run_counterparty_enrichment` (job 21, counterparty-enrichment) **reads**
  `ia_scoring_records` to build each counterparty's LLM profile.
  These were both scheduled at `:35` — a same-minute race with no guaranteed
  order. **Fixed 2026-07-22**: job 21 moved to `7,37 * * * *` (2 min after
  job 18), which also removes it from the `:05`/`:35` collision clusters
  noted in the earlier housekeeping pass (PR #1213).
- `run_signal_counterparty_extraction` (job 17, counterparty-extraction,
  `:10,:40`) is the **only** writer of new rows into `ia_counterparties`
  (extracts named entities from `ia_signals`). `run_counterparty_enrichment`
  (job 21) only processes counterparties with no profile yet, so the ~25 min
  natural lag between a `:40` extraction and the next `:07/:37` enrichment
  pass is harmless — it just means a brand-new counterparty gets profiled on
  the following cycle, not instantly.
- `run_country_intel_enrichment` (job 19, country-intel-enrichment,
  `:15,:45`) reads `ia_signals` (stage qualified/converted), `signals`
  (unrelated `public.signals` table, read-only here), and
  `jurisdiction_playbooks`; writes `country_intel.public_summary` /
  `commercial_pathway_summary`. Same fire-then-collect async pattern as the
  others (see below). Collides at `:15/:45` with `schema-drift-monitor`
  (unrelated function, harmless collision, not touched).

## The fire-then-collect pattern (shared by 5 functions)

`run_country_intel_enrichment`, `run_counterparty_enrichment`,
`run_signal_counterparty_extraction`, `run_daily_digest`, and
`run_editorial_digest` all use the same two-phase design: on each cron tick,
if a prior LLM request for today/this-cycle hasn't been collected yet, try
to collect it from `net._http_response`; otherwise fire a new one. Provider
fallback is anthropic → openai → gemini via `vault.decrypted_secrets`,
gated by a rolling failure-rate check against each provider's own
`_..._jobs` tracking table. This is a deliberate, consistent design — do
not "fix" the two-phase shape without understanding it; it's why these
functions look like they do nothing on alternating runs.

## Confirmed NOT-yet-understood (flagged, not traced further this pass)

- What populates `editorial_items` (469 rows, actively updated) — not any
  job in the active cron list. Could be a webhook, an external service, or
  a job triggered outside `pg_cron`.
- What populates `cc_jurisdiction_briefings` (302 rows) — `run_country_intel_
  enrichment` only touches `country_intel`, a different table.
- What `job 11` (`hv-extract-every-30min`, `:10,:40`, calls the `hv-extract`
  edge function) actually writes — its edge function source wasn't pulled
  in this pass. It collides on the same minutes as job 17
  (counterparty-extraction); unclear if that's meaningful contention or two
  unrelated things that happen to share a minute.
- Whether the four systems above are meant to converge into one product
  surface eventually, or are intentionally independent workstreams.

## Housekeeping (see also PR #1213, 2026-07-22)

- `cron.job_run_details` and `net._http_response` now have daily retention
  (7 days / 24h) — see `prune_cron_job_run_details()` / `prune_net_http_
  response()`.
- `schema-drift-monitor` reduced from every 15 min (24/7) to hourly at `:12`.

## Edge Function caller-auth hardening — 2026-08-10

Read-only production tracing before the remediation branch established these exact caller paths:

| Edge Function | Verified caller | Current cadence | Hardened path in `20260810222500_harden_edge_function_cron_auth.sql` |
|---|---|---|---|
| `job-refresh` | `cron.job` 57 (`job-refresh-daily`) | `0 12 * * *` | `cron.job` → `public.invoke_job_refresh()` → Vault `job_refresh_cron_secret` → `x-harbourview-cron-secret` |
| `schema-drift-monitor` | `cron.job` 24 (`schema-drift-monitor`) | `12 * * * *` | `cron.job` → `public.invoke_schema_drift_monitor()` → Vault `schema_drift_cron_secret` → `x-harbourview-cron-secret` |
| `hv-source-pull-runner` | `cron.job` 9 (`hv-source-pull-runner-safe-rss`) → `public.hv_trigger_source_pull_runner()` | `*/30 * * * *` | existing trigger is replaced in place and reads Vault `hv_source_pull_runner_secret` |
| `hv-private-pipeline-runner` | **unresolved** | none found in active `cron.job` or production SQL URL references | source is hardened, but no cron/helper is installed until the caller is identified |

The first three cron schedules keep their existing cadence and job names. The hardening migration changes only their command path and helper implementation; secret values never appear in migration SQL or `cron.job.command`.

### Passport/snapshot call chain

Two application routes currently call `compute-passport-score` with `HARBOURVIEW_EDGE_OPERATOR_SECRET`:

- `/api/admin/verify-org`
- `/api/org/licences/submit`

`compute-passport-score` then calls `generate-org-snapshot` with the same operator secret. Both Edge Functions retain that valid operator-secret contract. The remediation removes only the unsafe fallback that accepted any Authorization header containing the text `service_role`; an exact service-role bearer remains an optional trusted server path.

### Deployment ordering constraint

1. Provision runtime/Vault secret pairs first.
2. Deploy `generate-org-snapshot`, then `compute-passport-score`.
3. Deploy `hv-source-pull-runner` and apply its cron-helper migration atomically.
4. Deploy/fix `schema-drift-monitor` with its authenticated cron helper.
5. Deploy canonical `job-refresh` with replacement provider credentials and authenticated cron helper, then revoke the exposed prior provider credential.
6. Keep `hv-private-pipeline-runner` on HOLD until its caller is identified or it is formally retired.

No production changes are authorized by this document alone.
