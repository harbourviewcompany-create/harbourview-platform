import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('app/api/ai-gateway/route.ts', 'utf8');
const client = readFileSync('components/ai-gateway-client.tsx', 'utf8');
const page = readFileSync('app/ai-gateway/page.tsx', 'utf8');
const migration = readFileSync('supabase/migrations/20260512_002_ai_gateway_rate_limits.sql', 'utf8');

assert.match(route, /export const runtime = 'edge'/, 'route must explicitly use Edge runtime');
assert.match(route, /verifySupabaseUser/, 'route must validate Supabase user before Gateway call');
assert.match(route, /auth\/v1\/user/, 'route must verify token against Supabase Auth user endpoint');
assert.match(route, /extractAccessToken/, 'route must extract Supabase session tokens server-side');
assert.match(route, /resolveLockedSupabaseUrl/, 'route must use the locked Harbourview Supabase project URL');
assert.match(route, /requireSupabasePublishableKey/, 'route must use Harbourview Supabase publishable key helper');
assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/, 'route must require server-only service role key for RPCs');
assert.match(route, /consume_ai_gateway_rate_limit/, 'route must consume Supabase-backed rate limits');
assert.match(route, /user:\$\{user\.id\}/, 'route must apply per-user rate limiting');
assert.match(route, /ip:\$\{ipHash\}/, 'route must apply per-IP rate limiting');
assert.match(route, /log_ai_gateway_request/, 'route must write metadata-only request logs');
assert.match(route, /role: 'system', content: config\.systemPrompt/, 'route must prepend a server-owned system prompt');
assert.match(route, /client_system_message_rejected/, 'route must reject client-supplied system messages');
assert.match(route, /AI_GATEWAY_ALLOWED_MODELS/, 'route must use a model allowlist');
assert.match(route, /AI_GATEWAY_FALLBACK_MODEL/, 'route must expose an explicit fallback model setting');
assert.match(route, /max_completion_tokens: config\.maxOutputTokens/, 'route must cap output tokens');
assert.match(route, /stream: true/, 'route must force streaming requests to the Gateway');
assert.match(route, /AbortController/, 'route must include timeout control');
assert.match(route, /sanitizeGatewayError/, 'route must sanitize Gateway errors');
assert.match(route, /hashIp/, 'route must hash client IPs before logging');
assert.match(route, /gatewayApiKey/, 'route must read Gateway API key server-side');
assert.match(route, /jsonError\(401, 'auth_required'/, 'anonymous requests must return sanitized 401');
assert.match(route, /jsonError\(429, 'rate_limited'/, 'rate limit failures must return sanitized 429');
assert.match(route, /jsonError\(503, 'rate_limit_unavailable'/, 'rate-limit backend outage must fail closed');

assert.doesNotMatch(client, /AI_GATEWAY_API_KEY|SUPABASE_SERVICE_ROLE_KEY|AI_GATEWAY_LOG_HASH_SECRET/, 'client must never reference server-only secrets');
assert.doesNotMatch(client, /ai-gateway\.vercel\.sh/, 'client must never call the Vercel Gateway directly');
assert.doesNotMatch(client, /accessToken|JWT|paste.*token/i, 'client must not ask users to paste bearer tokens');
assert.match(client, /credentials: 'same-origin'/, 'client must rely on same-origin auth cookies');
assert.match(client, /fetch\('\/api\/ai-gateway'/, 'client must call the protected server route');
assert.match(client, /ReadableStream<Uint8Array>/, 'client must read a streaming response');
assert.match(page, /robots:[\s\S]*index: false/, 'AI Gateway page must be noindex');

assert.match(migration, /create table if not exists public\.ai_gateway_rate_limits/, 'migration must create rate limit table');
assert.match(migration, /create table if not exists public\.ai_gateway_request_logs/, 'migration must create metadata log table');
assert.match(migration, /enable row level security/, 'migration must enable RLS');
assert.match(migration, /revoke all on public\.ai_gateway_rate_limits from anon, authenticated/, 'rate limit table must not be directly exposed to public roles');
assert.match(migration, /revoke all on public\.ai_gateway_request_logs from anon, authenticated/, 'log table must not be directly exposed to public roles');
assert.match(migration, /to service_role/, 'RPC functions must be service-role only');
assert.match(migration, /Does not store raw prompts or model output/, 'migration must document metadata-only logging boundary');

const forbiddenRouteSnippets = [
  'gatewayResponse.text()',
  'console.log(',
  'console.error(',
  'prompt_text',
  'response_body',
  'raw_prompt',
  'raw_output',
];

for (const snippet of forbiddenRouteSnippets) {
  assert.equal(route.includes(snippet), false, `route must not expose or print raw Gateway/client details: ${snippet}`);
}

console.log('AI Gateway route verification passed');
