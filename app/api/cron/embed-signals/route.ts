/**
 * app/api/cron/embed-signals/route.ts — Ticket 7
 *
 * Vercel cron endpoint: embeds un-processed signals via BGE-M3.
 * Protected by CRON_SECRET. Service-role only.
 *
 * Schedule: daily at 06:00 UTC (after intelligence-extract at 04:00 UTC).
 * Max duration: 300s (Vercel Pro limit) — processes 200 signals per run.
 */

import { NextResponse } from 'next/server';

import { createHarbourviewServiceRoleSupabaseClient } from '@/lib/harbourview/supabase/service-role';
import { embedUnprocessedSignals } from '@/lib/hf/pipeline/signalEmbedder';
import { probeEmbedEndpoint } from '@/lib/hf/embeddings';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SIGNALS_PER_RUN = 200;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Quick endpoint probe before full run — surface config issues clearly
  const probe = await probeEmbedEndpoint();
  if (!probe.reachable) {
    return NextResponse.json(
      {
        ok: false,
        error: probe.configured
          ? `BGE-M3 endpoint unreachable: ${probe.error}`
          : 'HF_ENDPOINT_EMBED_BGE_M3 not configured — provision the HuggingFace endpoint and add env var',
        probe,
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createHarbourviewServiceRoleSupabaseClient();
    const result = await embedUnprocessedSignals(supabase, { limit: SIGNALS_PER_RUN });

    return NextResponse.json({ ok: true, ...result, probeLatencyMs: probe.latencyMs });
  } catch (err) {
    console.error('[embed-signals] Fatal error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        probe,
      },
      { status: 500 },
    );
  }
}
