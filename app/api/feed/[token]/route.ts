// app/api/feed/[token]/route.ts
// Public JSON feed endpoint. Uses hashed token lookup, expiry, revocation and recursive field sanitization.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { attachSecurityHeaders, jsonError } from "@/lib/security/http";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { constantTimeEqualHex, isValidBearerTokenShape, sha256Hex } from "@/lib/security/tokens";
import { sanitizeFeedSnapshot } from "@/lib/feed/sanitize";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function feedJson(body: unknown, status = 200): NextResponse {
  return attachSecurityHeaders(
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
        "X-Harbourview-Feed": "v2",
      },
    })
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const ip = getClientIp(request);

  try {
    const rateLimit = await checkRateLimit(ip, { namespace: "public-feed", limit: 60, windowSeconds: 60 });
    if (!rateLimit.allowed) return jsonError("Too many requests", 429);
  } catch {
    return jsonError("Feed temporarily unavailable", 503);
  }

  const { token } = await context.params;
  const candidateToken = typeof token === "string" ? token.trim() : "";

  if (!isValidBearerTokenShape(candidateToken)) {
    return jsonError("Feed not found", 404);
  }

  const tokenHash = sha256Hex(candidateToken);
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: feedToken, error } = await supabase
    .from("public_feed_tokens")
    .select("id, token_hash, status, expires_at, revoked_at, snapshot, created_at")
    .eq("token_hash", tokenHash)
    .eq("status", "active")
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !feedToken) {
    // Distinguish revoked/expired tokens from genuinely unknown ones.
    // Return 410 Gone (with revoked:true) so callers know the feed existed
    // and was explicitly revoked, rather than treating it as never-existing.
    const { data: anyToken } = await supabase
      .from("public_feed_tokens")
      .select("id, status, revoked_at, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (anyToken) {
      const isRevoked = anyToken.status === "revoked" || anyToken.revoked_at !== null;
      const isExpired = anyToken.expires_at && anyToken.expires_at <= now;
      if (isRevoked) {
        return attachSecurityHeaders(
          NextResponse.json(
            { revoked: true, error: "This feed has been revoked." },
            { status: 410, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } }
          )
        );
      }
      if (isExpired) {
        return attachSecurityHeaders(
          NextResponse.json(
            { expired: true, error: "This feed has expired." },
            { status: 410, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } }
          )
        );
      }
    }

    return jsonError("Feed not found", 404);
  }

  const storedHash = typeof feedToken.token_hash === "string" ? feedToken.token_hash : "";
  if (!constantTimeEqualHex(tokenHash, storedHash)) {
    return jsonError("Feed not found", 404);
  }

  const sanitized = sanitizeFeedSnapshot(feedToken.snapshot);

  await supabase.from("public_feed_token_access_events").insert({
    public_feed_token_id: feedToken.id,
    accessed_at: now,
    ip_hash: sha256Hex(ip),
    user_agent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
  });

  return feedJson({
    meta: {
      feed_id: feedToken.id,
      issued_at: feedToken.created_at,
      expires_at: feedToken.expires_at,
      version: 2,
    },
    dossier: sanitized,
  });
}
