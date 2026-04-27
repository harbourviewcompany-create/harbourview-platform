import { NextRequest, NextResponse } from "next/server";
import { buildPublishPreview } from "@/lib/publish/validate";
import { createServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { attachSecurityHeaders } from "@/lib/security/http";

// Internal route — admin and analyst only.
// Middleware enforces session existence. This handler enforces platform_role.
// buildPublishPreview returns internal_notes and publish_events[].api_token —
// these are stripped before returning so client-role users cannot reach them
// even if role enforcement is ever relaxed upstream.

const INTERNAL_FIELDS = new Set([
  "internal_notes",
  "item_notes",
  "analyst_notes",
  "analyst_interpretation",
  "api_token",
  "snapshot_json",
  "reviewer_notes",
  "rejection_reason",
  "return_reason",
]);

function stripInternalFields(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripInternalFields);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!INTERNAL_FIELDS.has(k)) result[k] = stripInternalFields(v);
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dossierId: string }> }
) {
  try {
    const supabase = await createServerClient();
    // Throws 403-appropriate error if role is not admin or analyst.
    await requireRole(supabase, ["admin", "analyst"]);

    const { dossierId } = await params;
    const effectiveAt =
      request.nextUrl.searchParams.get("effective_at") ?? undefined;

    const raw = await buildPublishPreview(dossierId, effectiveAt);
    // Strip internal fields before returning — defense in depth.
    const safe = stripInternalFields(raw);

    return attachSecurityHeaders(NextResponse.json(safe));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forbidden";
    const status =
      msg.startsWith("Insufficient permissions") ? 403
      : msg === "Not authenticated" ? 401
      : msg === "Dossier not found" ? 404
      : 500;
    return attachSecurityHeaders(
      NextResponse.json({ error: msg }, { status })
    );
  }
}
