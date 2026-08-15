/**
 * Cloudflare Workers entrypoint for the intelligence engine.
 *
 * wrangler.toml's `main` points here, not at start-worker.ts.
 * start-worker.ts is a Node.js daemon (infinite poll loop, intended for a
 * persistent host like Docker/ECS/Cloud Run/Fly/Railway). Cloudflare
 * Workers have no persistent process: each Cron Trigger invokes this
 * Worker's scheduled() handler as its own isolated, bounded execution
 * (up to 15 minutes wall time, up to 30s CPU time on Workers Paid Standard
 * usage -- CPU time only counts active processing, not time spent waiting
 * on the network requests/Supabase calls that make up almost all of this
 * worker's actual work, so 30s of CPU time covers a meaningfully large
 * batch even though it sounds small). There is no http.createServer()
 * here -- Workers don't bind to a port; HTTP is handled via the exported
 * fetch handler instead.
 *
 * wrangler.toml previously defined 4 cron schedules. They have been REMOVED
 * (2026-08-15) and scheduled() is therefore currently unreachable in
 * production -- only the /healthz fetch route below is live.
 *
 * Three of those crons were never implemented. The fourth, "Ingestion run",
 * was -- and that is precisely why they had to go: it calls
 * WorkerNode.runOnce(), which writes source_registry, source_snapshots,
 * source_documents and crawl_domain_circuit_state -- the same tables the live
 * Supabase edge-function pipeline writes, on the same 30-minute cadence (live
 * pg_cron job hv-source-pull-runner-safe-rss). Running both would
 * double-ingest. See wrangler.toml for the measured evidence and
 * INTELLIGENCE_ARCHITECTURE_SPEC.md Guardrail 10.
 *
 * Note the cron expression for that job is deliberately NOT written out here:
 * a literal star-slash sequence terminates this block comment. That is the
 * same hazard the paragraph at the end of this comment describes, and writing
 * it out is exactly how this file got broken while being edited.
 *
 * scheduled() is kept rather than deleted so the Cloudflare path stays
 * recoverable if it ever legitimately replaces the pg_cron path in the spec.
 * It cannot fire without a trigger, so leaving it is inert, not latent.
 *
 * The cron table below is kept as line comments, not a block comment, since
 * the cron expressions themselves contain "*" + "/" sequences that would
 * close a /* block early.
 */
//
// schedule        label                 status
// --------------  --------------------  --------------------------------
// every 15 min    Discovery sweep       NOT IMPLEMENTED -- would need new
//                                       logic to find/add sources to
//                                       source_registry; nothing in this
//                                       codebase does that today
// every 30 min    Ingestion run         implemented: WorkerNode.runOnce()
// hourly          Deep discovery        NOT IMPLEMENTED -- unclear how this
//                                       should differ from Discovery sweep
//                                       without a spec
// every 6 hours   Source health sweep   NOT IMPLEMENTED -- per-source
//                                       backoff/network_status already
//                                       happens inside every ingestion run
//                                       via DistributedTaskQueue; if this is
//                                       meant to do something additional
//                                       (re-test long-offline sources, send
//                                       a digest) that needs a real spec
//                                       before being built
//

import { WorkerNode } from '../../lib/intelligence-engine/worker-node';

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  INTELLIGENCE_WORKER_ID?: string;
  WORKER_BATCH_SIZE?: string;
}

// Minimal local shapes for exactly what's used below, rather than
// `/// <reference types="@cloudflare/workers-types" />`, which redefines
// global Request/Response/Headers (notably Response.prototype.json()'s
// return type, any -> unknown) for the *entire* TypeScript program, not
// just this file -- confirmed by it breaking 70+ unrelated .json() call
// sites elsewhere in the app on a full typecheck. Request/Response/fetch
// themselves are the same Web-standard globals every API route in this
// app already uses; only these two Workers-runtime-specific shapes need
// a stand-in.
interface ScheduledController {
  cron: string;
  scheduledTime: number;
  noRetry?: () => void;
}
interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException?: () => void;
}

const CRON_INGESTION_RUN = '*/30 * * * *';

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // nodejs_compat_populate_process_env (default for this Worker's
    // compatibility_date) already mirrors these bindings onto process.env,
    // which is what WorkerNode's constructor reads -- no manual copying
    // needed. Falling back to copying explicitly here only as a defensive
    // measure in case that flag is ever turned off.
    if (env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    }

    const workerId = env.INTELLIGENCE_WORKER_ID || 'cf-worker-01';

    if (controller.cron !== CRON_INGESTION_RUN) {
      console.log(`[cloudflare-worker] cron "${controller.cron}" has no implementation yet -- skipping.`);
      return;
    }

    const batchSize = Number(env.WORKER_BATCH_SIZE) || 10;
    const workerNode = new WorkerNode(workerId);

    console.log(`[cloudflare-worker] Ingestion run starting (worker=${workerId}, batchSize=${batchSize}, scheduledTime=${new Date(controller.scheduledTime).toISOString()})`);

    // The runtime already awaits this returned promise (up to the 15-minute
    // duration limit) -- ctx.waitUntil isn't needed for a single task like
    // this, only for fire-and-forget work alongside a fetch response.
    const result = await workerNode.runOnce(batchSize);
    console.log(`[cloudflare-worker] Ingestion run complete: ${result.targetsProcessed} targets processed.`);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/healthz') {
      return new Response('Not found', { status: 404 });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const workerId = env.INTELLIGENCE_WORKER_ID || 'cf-worker-01';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ ok: false, reason: 'config_missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Plain fetch to PostgREST rather than the @supabase/supabase-js client
    // here -- this is a single, simple read, and avoids any uncertainty
    // about that client's behavior in the Workers runtime for what's meant
    // to be the most-likely-to-be-hit, least-likely-to-break endpoint.
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/worker_heartbeats?worker_id=eq.${encodeURIComponent(workerId)}&select=*`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        },
      );

      if (!response.ok) {
        return new Response(JSON.stringify({ ok: false, reason: 'heartbeat_query_failed', status: response.status }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const rows = (await response.json()) as Array<{ status: string; last_seen_at: string; targets_processed_total: number; last_error: string | null }>;
      const heartbeat = rows[0];

      if (!heartbeat) {
        return new Response(JSON.stringify({ ok: false, reason: 'no_heartbeat_yet', workerId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Flag as stale if the last ingestion run is older than 2x the cron
      // interval (30min cadence -> 60min staleness threshold) -- a single
      // missed cron tick can happen; two in a row is worth surfacing.
      const lastSeenMs = Date.parse(heartbeat.last_seen_at);
      const staleMs = 60 * 60 * 1000;
      const isStale = Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs > staleMs;

      return new Response(JSON.stringify({ ok: !isStale, workerId, ...heartbeat, stale: isStale }), {
        status: isStale ? 503 : 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ ok: false, reason: 'unexpected_error', message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
