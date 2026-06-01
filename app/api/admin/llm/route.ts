import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAdminAuthCheck } from '@/lib/auth/adminGuard';
import { getConfiguredProvider, getLlmRuntimeConfig } from '@/lib/llm/config';
import { callLlmProvider } from '@/lib/llm/providers';
import { checkLlmRateLimit } from '@/lib/llm/rateLimit';
import { LlmGatewayError } from '@/lib/llm/types';
import { parseLlmGatewayRequest } from '@/lib/llm/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function publicError(error: LlmGatewayError) {
  return json({ ok: false, code: (error as any).code, message: error.message, provider: error.provider }, error.status);
}

export async function POST(request: Request) {
  const auth = await getAdminAuthCheck();
  if (!auth.ok) {
    const forbidden = (auth as any).reason === 'missing_admin_role';
    return json(
      {
        ok: false,
        code: forbidden ? 'LLM_GATEWAY_FORBIDDEN' : 'LLM_GATEWAY_UNAUTHORIZED',
        message: forbidden ? 'Admin or operator role required.' : 'Authentication required.',
      },
      forbidden ? 403 : 401,
    );
  }

  const config = getLlmRuntimeConfig();
  if (!config.enabled) {
    return publicError(new LlmGatewayError('LLM_GATEWAY_DISABLED', 'The Harbourview LLM gateway is disabled.', 503));
  }

  const rateLimit = checkLlmRateLimit(auth.auth.user.id, config.rateLimitPerMinute);
  if (!rateLimit.allowed) {
    return json(
      {
        ok: false,
        code: 'LLM_GATEWAY_RATE_LIMITED',
        message: 'LLM gateway rate limit exceeded.',
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: 'LLM_GATEWAY_VALIDATION_FAILED', message: 'Request body must be valid JSON.' }, 400);
  }

  try {
    const payload = parseLlmGatewayRequest(body);
    const provider = getConfiguredProvider(config, payload.provider);

    if (!provider) {
      return publicError(new LlmGatewayError('LLM_GATEWAY_CONFIG_MISSING', 'Requested LLM provider is not configured.', 503, payload.provider));
    }

    const requestId = payload.requestId || randomUUID();
    const result = await callLlmProvider(provider, payload, config.timeoutMs, requestId);

    return json(result, 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return json(
        {
          ok: false,
          code: 'LLM_GATEWAY_VALIDATION_FAILED',
          message: 'Invalid LLM gateway request.',
          issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        },
        400,
      );
    }

    if (error instanceof LlmGatewayError) return publicError(error);

    return publicError(new LlmGatewayError('LLM_GATEWAY_INTERNAL_ERROR', 'LLM gateway request failed.', 500));
  }
}
