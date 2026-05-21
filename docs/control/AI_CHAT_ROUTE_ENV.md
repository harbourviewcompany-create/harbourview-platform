# AI Chat Route Environment

Route:
- `app/api/chat/route.ts`

Status:
- Public endpoint is intentionally disabled.
- Route still validates request JSON and prompt shape for deterministic client-side error handling.
- Valid requests return HTTP `501 Not Implemented` and do not process prompt content.

Example request:

```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is the weather in Ottawa and what activities should I do there?"}'
```

Expected behavior:
- Invalid JSON returns HTTP 400
- Missing/empty prompt returns HTTP 400
- Valid payload returns HTTP 501 with an error message indicating the route is disabled

Verification targets:
- `npm run typecheck`
- `npm run build`
- POST request with valid prompt returns HTTP 501
