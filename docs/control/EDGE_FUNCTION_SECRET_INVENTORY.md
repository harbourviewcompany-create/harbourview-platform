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

## Security notes

- Function secrets must be read with `Deno.env.get(...)` inside Edge Functions only.
- Secret values, token prefixes, request authorization headers, and Supabase secret digests must not be committed.
- Functions with `verify_jwt: false` require explicit header-secret or operator-secret controls and should remain documented here.
- `github-bridge` remains a separate security follow-up because it is still `verify_jwt: false` and can use `GITHUB_PAT` from runtime env.

## GO / HOLD

GO requires:

1. `HV_DEV_BYPASS_SECRET`, `ANTHROPIC_API_KEY`, `BULK_SOURCE_UPSERT_SECRET`, and `GITHUB_PR_INSPECT_KEY` exist in Supabase Edge Function secrets.
2. `bulk-source-upsert` rejects requests without `x-function-secret` and with an incorrect `x-function-secret`.
3. `github-pr-inspect` rejects requests without `x-inspect-key` and with an incorrect `x-inspect-key`.
4. No deployed Edge Function response exposes a secret value, token, header value, digest, or provider credential.

HOLD if any required custom secret is absent, if a deployed function still contains a hardcoded function secret, or if a required secret is exposed to browser/client code.
