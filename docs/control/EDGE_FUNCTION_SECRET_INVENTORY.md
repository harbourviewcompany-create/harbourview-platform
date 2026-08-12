# Harbourview Edge Function Secret Inventory

Status: required-secrets inventory for Supabase project `zvxdgdkukjrrwamdpqrg` (`Harbourview Platform`).

This file documents secret names only. Do not commit secret values, token prefixes, authorization headers, digests, or provider key material.

## Required custom Edge Function secrets

| Secret name | Required by | Purpose | Current status |
|---|---|---|---|
| `GITHUB_PAT` | `github-bridge`, `github-pr-inspect` | GitHub API access for repo/PR operations. | Present in observed Supabase custom secrets. |
| `HARBOURVIEW_EDGE_OPERATOR_SECRET` | `compute-passport-score`, `generate-org-snapshot` | Operator-secret gate for passport scoring and public snapshot generation. | Present in observed Supabase custom secrets. |
| `OPENAI_API_KEY` | `hv-embed-worker` | Optional OpenAI embedding upgrade path; worker falls back to Supabase local ONNX if unavailable. | Present in observed Supabase custom secrets. |
| `RESEND_API_KEY` | Email/messaging functions where applicable. | Outbound email provider credential. | Present in observed Supabase custom secrets. |
| `HV_DEV_BYPASS_SECRET` | `source-engine-fetch`, `hv-extract`, `hv-score`, `hv-pipeline-orchestrator` | Operator/dev bypass header validation for controlled non-cron function runs. | Required; not confirmed present by available tools. |
| `ANTHROPIC_API_KEY` | `hv-extract` | Claude extraction API key for structured source signal extraction. | Required; not confirmed present by available tools. |
| `BULK_SOURCE_UPSERT_SECRET` | `bulk-source-upsert` | Header-secret gate for bulk source upsert after hardcoded secret removal. | Required; smoke evidence shows missing as of 2026-06-10. |
| `GITHUB_PR_INSPECT_KEY` | `github-pr-inspect` | Header-secret gate for PR inspection after hardcoded secret removal. | Required; smoke evidence shows missing as of 2026-06-10. |
| `ADZUNA_APP_ID` | `job-refresh` | Provider application identifier. | Production replacement required before redeploy; no value belongs in GitHub. |
| `ADZUNA_APP_KEY` | `job-refresh` | Provider API credential. | Production replacement/rotation required before redeploy; the prior deployed literal must be treated as exposed. |
| `JOB_REFRESH_CRON_SECRET` | `job-refresh` | Authenticates the scheduled production job-refresh invocation. | New; must be provisioned before function/cron cutover. |
| `SCHEMA_DRIFT_CRON_SECRET` | `schema-drift-monitor` | Authenticates the hourly schema-drift cron invocation. | New; must be provisioned before function/cron cutover. |
| `HV_SOURCE_PULL_RUNNER_SECRET` | `hv-source-pull-runner` | Authenticates the half-hourly source-pull runner invocation. | New; must be provisioned before function/cron cutover. |
| `HV_PRIVATE_PIPELINE_RUNNER_SECRET` | `hv-private-pipeline-runner` | Authenticates the private extract/score runner. | New; source patch only. Production caller remains unresolved, so deployment is HOLD. |

## Vault scheduler counterparts

The cron-side values are stored in Supabase Vault, not migration SQL or `cron.job.command`.

| Vault secret name | Edge runtime counterpart | Scheduler helper |
|---|---|---|
| `job_refresh_cron_secret` | `JOB_REFRESH_CRON_SECRET` | `public.invoke_job_refresh()` |
| `schema_drift_cron_secret` | `SCHEMA_DRIFT_CRON_SECRET` | `public.invoke_schema_drift_monitor()` |
| `hv_source_pull_runner_secret` | `HV_SOURCE_PULL_RUNNER_SECRET` | `public.hv_trigger_source_pull_runner()` |

No Vault helper is installed for `HV_PRIVATE_PIPELINE_RUNNER_SECRET` until its production caller is identified.

## Reserved/default Supabase secrets used by functions

These are supplied by Supabase and are not expected to appear under custom secrets:

| Secret name | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | Most database-backed Edge Functions. | Reserved/default Supabase runtime value. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role function clients. | Reserved/default Supabase runtime value. Never expose to browser code. |
| `SUPABASE_ANON_KEY` | Authenticated user-scoped client in `generate-signed-url`. | Reserved/default/legacy runtime value. |

## Deployed remediation

- `bulk-source-upsert` was redeployed to read `BULK_SOURCE_UPSERT_SECRET` from `Deno.env.get(...)` instead of comparing against a hardcoded literal.
- `github-pr-inspect` was redeployed to read `GITHUB_PR_INSPECT_KEY` from `Deno.env.get(...)` instead of comparing against a hardcoded literal.
- Both functions fail closed with `missing_edge_function_secret` when the required secret is absent.

## Pending remediation on branch `agent/edge-function-production-auth-hardening`

- `job-refresh` is canonicalized in GitHub and reads provider credentials only from `Deno.env`; it rejects non-POST and unauthenticated requests and supports `dry_run=true`.
- `schema-drift-monitor` is canonicalized in GitHub and requires `SCHEMA_DRIFT_CRON_SECRET`.
- `hv-source-pull-runner` and `hv-private-pipeline-runner` replace source-visible caller labels with high-entropy runtime secrets.
- `compute-passport-score` and `generate-org-snapshot` retain the operator-secret path but replace substring matching on `service_role` with exact bearer equality against `SUPABASE_SERVICE_ROLE_KEY`.
- `20260810222500_harden_edge_function_cron_auth.sql` rewires only known cron callers through Vault-backed helper functions; it contains no secret values.

## `job-refresh` credential rotation order

1. Create a replacement provider credential through the provider control plane.
2. Store the replacement as `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` Edge Function secrets.
3. Provision matching `JOB_REFRESH_CRON_SECRET` / `job_refresh_cron_secret` values in Edge secrets and Vault respectively.
4. Verify the patched function rejects missing/wrong auth and passes an authorized dry run.
5. Apply the scheduler cutover and perform one controlled live run.
6. Revoke the previously exposed provider credential immediately after the replacement path is proven.
7. Verify the revoked credential cannot authenticate. Never roll back to it.

## Security notes

- Function secrets must be read with `Deno.env.get(...)` inside Edge Functions only.
- Secret values, token prefixes, request authorization headers, and Supabase secret digests must not be committed.
- Functions with `verify_jwt: false` require explicit header-secret or operator-secret controls and should remain documented here.
- `github-bridge` remains a separate security follow-up because it is still `verify_jwt: false` and can use `GITHUB_PAT` from runtime env.
- Cron jobs must call Vault-backed helpers rather than embed secret values in `cron.job.command`.
- A literal or partial string such as `service_role` is never proof of possession of the service-role credential.

## GO / HOLD

GO requires:

1. Existing required secrets are present for their active functions.
2. `ADZUNA_APP_ID` and replacement `ADZUNA_APP_KEY` are provisioned before `job-refresh` redeployment.
3. `JOB_REFRESH_CRON_SECRET`, `SCHEMA_DRIFT_CRON_SECRET`, and `HV_SOURCE_PULL_RUNNER_SECRET` are provisioned with matching Vault counterparts before the associated cron migration is activated.
4. Missing/wrong-auth tests fail closed for all hardened functions.
5. Fake `Authorization: Bearer service_role` and arbitrary bearer strings containing `service_role` are rejected by passport/snapshot functions.
6. No deployed Edge Function response, repository file, migration, cron command, test artifact, or log exposes a secret value, token, header value, digest, or provider credential.
7. `hv-private-pipeline-runner` remains undeployed until its caller is identified or the function is formally retired.

HOLD if any required custom secret is absent, if a deployed function still contains a hardcoded function/provider secret, if scheduler authentication is source-visible rather than secret-backed, or if a required secret is exposed to browser/client code.
