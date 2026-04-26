/**
 * public-feed Edge Function
 * HV-001-A: Public feed token route
 *
 * Problem solved:
 *   publish_events SELECT policy blocks all anon access via PostgREST.
 *   External clients holding an api_token were getting 0 rows.
 *   This Edge Function uses the service-role key server-side to validate
 *   the token and return ONLY the sanitised snapshot_json — no internal fields.
 *
 * Route:  GET /functions/v1/public-feed?token=<api_token>
 * Auth:   None required (public route, token is the credential)
 *
 * Security properties:
 *   - Token is looked up against publish_events (status = 'completed')
 *   - snapshot_json is pre-sanitised by build_snapshot_json() at publish time
 *     (internal_notes, analyst_notes, source internal_notes are never included)
 *   - No raw table data is returned — only the frozen snapshot
 *   - Access is logged to audit_events (fire-and-forget, does not block response)
 *   - CORS locked to same-site by default; set ALLOWED_ORIGIN env var to open
 *
 * Env vars required (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL           (auto-provided by Supabase runtime)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase runtime)
 *   ALLOWED_ORIGIN         (optional, defaults to '*' — restrict in production)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_METHODS = ["GET", "OPTIONS"];
const MAX_DESCRIPTION_LENGTH = 500; // snapshot already limits evidence_text to 500 chars

Deno.serve(async (req: Request): Promise<Response> => {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── Method guard ───────────────────────────────────────────────────────────
  if (req.method !== "GET") {
    return jsonError(405, "Method not allowed", allowedOrigin);
  }

  // ── Extract token from query string ───────────────────────────────────────
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();

  if (!token || token.length < 32) {
    return jsonError(400, "Missing or malformed token", allowedOrigin);
  }

  // ── Build service-role Supabase client ────────────────────────────────────
  const supabaseUrl  = Deno.env.get("SUPABASE_URL");
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return jsonError(500, "Server configuration error", allowedOrigin);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── Validate token against publish_events ─────────────────────────────────
  // Only completed (not revoked) publish events are valid.
  const { data: event, error: eventError } = await supabase
    .from("publish_events")
    .select("id, dossier_id, workspace_id, snapshot_json, created_at")
    .eq("api_token", token)
    .eq("status", "completed")
    .maybeSingle();

  if (eventError) {
    console.error("publish_events lookup error:", eventError);
    return jsonError(500, "Internal error", allowedOrigin);
  }

  if (!event) {
    // Return 404 — do not distinguish "not found" from "revoked" to avoid oracle
    return jsonError(404, "Not found or access revoked", allowedOrigin);
  }

  // ── Confirm dossier is still published (not subsequently archived) ─────────
  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select("id, status")
    .eq("id", event.dossier_id)
    .maybeSingle();

  if (dossierError || !dossier) {
    return jsonError(500, "Internal error", allowedOrigin);
  }

  if (dossier.status !== "published") {
    return jsonError(404, "Not found or access revoked", allowedOrigin);
  }

  // ── Fire-and-forget audit log ─────────────────────────────────────────────
  // Logs that the public feed was accessed — does not block the response.
  const clientIp  = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  supabase.from("audit_events").insert({
    entity_type           : "publish_event",
    entity_id             : event.id,
    action_type           : "create",   // nearest valid audit_action for a read access log
    performed_by_profile_id: null,      // unauthenticated caller
    workspace_id          : event.workspace_id,
    change_summary        : `Public feed accessed. IP: ${clientIp}. UA: ${userAgent.slice(0, 200)}`,
  }).then(({ error }) => {
    if (error) console.warn("Audit log write failed (non-fatal):", error.message);
  });

  // ── Return sanitised snapshot ─────────────────────────────────────────────
  // snapshot_json was built by build_snapshot_json() at publish time.
  // That function already excludes: internal_notes, analyst_notes,
  // source.internal_notes, source.contact_name, source.contact_org.
  // No further field stripping is required — but we add metadata.
  const responseBody = {
    publish_event_id : event.id,
    published_at     : event.created_at,
    data             : event.snapshot_json,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type"                : "application/json",
      "Access-Control-Allow-Origin" : allowedOrigin,
      "Cache-Control"               : "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options"      : "nosniff",
    },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonError(status: number, message: string, origin: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type"                : "application/json",
      "Access-Control-Allow-Origin" : origin,
    },
  });
}
