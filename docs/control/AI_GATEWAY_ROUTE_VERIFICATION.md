# AI Gateway Route Verification

## Scope

This gate covers the protected `app/api/ai-gateway` App Router route, the minimal `/ai-gateway` client page, Supabase-backed rate limiting and metadata-only request logging.

## Required environment variables

Server-only:

- `AI_GATEWAY_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_GATEWAY_LOG_HASH_SECRET`
- `AI_GATEWAY_ALLOWED_MODELS` — comma-separated allowlist, defaults to `openai/gpt-5.5` if unset
- `AI_GATEWAY_FALLBACK_MODEL` — optional; must also appear in `AI_GATEWAY_ALLOWED_MODELS`
- `AI_GATEWAY_SYSTEM_PROMPT` — optional server-owned prompt override
- `AI_GATEWAY_MAX_OUTPUT_TOKENS` — optional, bounded from 256 to 2000
- `AI_GATEWAY_TIMEOUT_MS` — optional, bounded from 5000 to 60000
- `AI_GATEWAY_USER_WINDOW_SECONDS` / `AI_GATEWAY_USER_MAX_REQUESTS`
- `AI_GATEWAY_IP_WINDOW_SECONDS` / `AI_GATEWAY_IP_MAX_REQUESTS`

Public Supabase URL/key already expected by the app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Verification commands

Run from a clean checkout of the PR branch:

```bash
npm ci
npm run typecheck
npm run build
npm run test:ai-gateway-route
```

Expected result: all commands exit `0`.

## Required behavioral gates

- Anonymous request to `POST /api/ai-gateway` returns `401` with sanitized JSON only.
- Client-supplied `system` messages return `400` and are not forwarded.
- Non-allowlisted models return `400` and are not forwarded.
- Valid authenticated requests are rate-limited by both user id and hashed client IP.
- Rate-limit backend failure fails closed with `503`.
- Gateway failures are sanitized; raw Gateway response bodies are never returned to the client.
- Streaming responses are proxied as `text/event-stream`/Gateway content type with `no-store` caching.
- Browser code never references `AI_GATEWAY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_LOG_HASH_SECRET` or `ai-gateway.vercel.sh`.
- Request logs contain metadata only: request id, user id, hashed IP, model, fallback model, status, HTTP status, prompt character count, client message count and error class.

## Production deployment gates

Return `GO` only when:

1. `npm ci` passes.
2. `npm run typecheck` passes.
3. `npm run build` passes.
4. `npm run test:ai-gateway-route` passes.
5. The Supabase migration has been applied in the target environment.
6. Required Vercel Preview/Production environment variables are configured.
7. Vercel preview reaches `READY`.
8. `GET /ai-gateway` loads.
9. Anonymous `POST /api/ai-gateway` returns sanitized `401`.

Return `HOLD` if any command fails, if the Supabase migration has not been applied in the target environment, if required server environment variables are missing, or if Vercel canonical project mapping is not confirmed.
