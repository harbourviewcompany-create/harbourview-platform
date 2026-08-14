import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/network/rateLimit"
import { ORG_TYPES } from "@/lib/hv/orgTypes"

const ROUTE_ID = "/api/org/create"

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const rateLimit = await enforceRateLimit({
    route: ROUTE_ID,
    ip: getClientIp(req),
    identity: user.id,
    limit: 5,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    )
  }

  let body: Record<string, string>
  try { body = await req.json() } catch { return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 }) }
  const { legal_name, trade_name, org_type, jurisdiction_country, jurisdiction_region } = body
  if (!legal_name?.trim()) return NextResponse.json({ error: "legal_name required" }, { status: 422 })
  if (!org_type || !(ORG_TYPES as readonly string[]).includes(org_type)) return NextResponse.json({ error: "invalid org_type" }, { status: 422 })
  if (!jurisdiction_country?.trim() || jurisdiction_country.trim().length !== 2) return NextResponse.json({ error: "jurisdiction_country must be 2-letter ISO code" }, { status: 422 })

  const slug = (trade_name?.trim() || legal_name.trim())
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 48)
    + "-" + Math.random().toString(36).slice(2, 7)
  const supabase = await createSupabaseServiceClient()

  // workspace_members is intentionally many-to-many. A user may create another
  // organization even when they already belong to one or more workspaces.
  const { data: ws, error: wsErr } = await supabase.from("workspaces").insert({
    name: trade_name?.trim() || legal_name.trim(), slug, legal_name: legal_name.trim(),
    trade_name: trade_name?.trim() || null, org_type,
    jurisdiction_country: jurisdiction_country.trim().toUpperCase().slice(0, 2),
    jurisdiction_region: jurisdiction_region?.trim() || null,
    verification_status: "unverified", is_public: false, settings: {}, status: "active",
  }).select("id,slug,name").single()
  if (wsErr || !ws) {
    if (wsErr?.code === "23505") return NextResponse.json({ error: "SLUG_CONFLICT" }, { status: 409 })
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 })
  }

  const now = new Date().toISOString()
  const { error: mErr } = await supabase.from("workspace_members").insert({
    workspace_id: ws.id, user_id: user.id, role: "admin", status: "active",
    invited_at: now, joined_at: now,
  })
  if (mErr) {
    await supabase.from("workspaces").delete().eq("id", ws.id)
    return NextResponse.json({ error: "MEMBERSHIP_FAILED" }, { status: 500 })
  }

  await supabase.from("hv_passports").insert({
    org_id: ws.id,
    verification_level: "none",
    completeness_band: "incomplete",
    recall_exposure_flag: false,
  })

  // Creating an organization is an explicit choice to operate as it. Persist
  // that context while preserving nullable active_workspace_id as Personal.
  await supabase.from("user_dashboard_preferences").upsert({
    user_id: user.id,
    active_workspace_id: ws.id,
    updated_at: now,
  }, { onConflict: "user_id" })

  await supabase.from("audit_events").insert({
    entity_type: "workspace", entity_id: ws.id, action: "org.created",
    actor: user.id, actor_user_id: user.id, actor_org_id: ws.id,
    metadata: { org_type, jurisdiction_country },
  })

  return NextResponse.json({
    data: {
      org_id: ws.id,
      slug: ws.slug,
      name: ws.name,
      active_workspace_id: ws.id,
    },
  }, { status: 201 })
}
