# AI Chat Route Environment

Route:
- `app/api/chat/route.ts`

Required environment variables:

```env
OPENAI_API_KEY=
AI_MODEL=openai/gpt-5
```

Example request:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is the weather in Ottawa and what activities should I do there?"}'
```

Expected behavior:
- Route validates request JSON
- Empty prompts return HTTP 400
- AI SDK may trigger both `weather` and `activities` tools
- Development responses include `steps`
- Production responses include only `finalAnswer`

Verification targets:
- `npm run typecheck`
- `npm run build`
- POST request returns `finalAnswer`
- Tool chain can invoke both demo tools in one request
