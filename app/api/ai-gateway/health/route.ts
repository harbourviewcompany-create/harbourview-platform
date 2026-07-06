import { NextResponse } from 'next/server';

import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth';
import { getUnifiedAiGatewayHealth } from '@/lib/env/unifiedAiGatewayEnv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Admin-only: the detailed health payload exposes gateway configuration,
  // limits, and issue diagnostics that shouldn't be publicly enumerable.
  const authFailure = await requireAdminApiAuth();
  if (authFailure) return authFailure;

  const health = getUnifiedAiGatewayHealth();

  return NextResponse.json(
    {
      status: health.ok ? 'ok' : 'hold',
      service: 'unified-ai-gateway',
      enabled: health.enabled,
      marketplaceEnabled: health.marketplaceEnabled,
      configured: health.configured,
      limits: health.limits,
      issues: health.issues,
    },
    {
      status: health.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Surrogate-Control': 'no-store',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
