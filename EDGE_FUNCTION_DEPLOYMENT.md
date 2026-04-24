# Supabase Edge Function Deployment

## Status

The repository now contains a hardened `supabase/functions/chatgpt-connector/index.ts` implementation. The currently deployed Supabase Edge Function source was not available in this repository, so the live function must be exported or replaced before production readiness can be verified.

## Required secrets

Set these in Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CHATGPT_CONNECTOR_API_KEY_SHA256`
- `CHATGPT_CONNECTOR_ALLOWED_ORIGINS`

`CHATGPT_CONNECTOR_API_KEY_SHA256` must be the SHA-256 hex hash of the raw API key. Do not store the raw connector API key.

Generate a hash locally:

```bash
node -e "const {createHash,randomBytes}=require('crypto'); const key='hv_conn_'+randomBytes(32).toString('base64url'); console.log({key, hash:createHash('sha256').update(key).digest('hex')})"
```

Store only the hash in Supabase secrets. Send the raw key once through an approved secure channel.

## Deploy

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set CHATGPT_CONNECTOR_API_KEY_SHA256=<sha256-hex>
supabase secrets set CHATGPT_CONNECTOR_ALLOWED_ORIGINS=https://chat.openai.com,https://chatgpt.com
supabase functions deploy chatgpt-connector --no-verify-jwt
```

The function performs its own API-key validation. `--no-verify-jwt` is acceptable only because the function fails closed on `CHATGPT_CONNECTOR_API_KEY_SHA256` validation.

## Verify

Invalid key must fail:

```bash
curl -i https://<PROJECT_REF>.functions.supabase.co/chatgpt-connector/health \
  -H 'Authorization: Bearer invalid'
```

Expected: `401 Unauthorized`.

Valid key must pass:

```bash
curl -i https://<PROJECT_REF>.functions.supabase.co/chatgpt-connector/health \
  -H 'Authorization: Bearer <RAW_CONNECTOR_KEY>'
```

Expected: `200 OK` and `{"ok":true,"service":"chatgpt-connector"}`.

## Live source export requirement

Before declaring production ready, export or retrieve the currently deployed function source and compare it to this repository version. If the deployed source differs, replace it with the repo version or perform a line-by-line security review.
