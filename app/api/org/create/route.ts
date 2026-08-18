import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/network/rateLimit"
import { ORG_TYPES } from "@/lib/hv/orgTypes"

const ROUTE_ID = "/api/org/create"

function safeErrorDetail(err: { message?: string; code?: string; details?: string } | null): string {
  if (!err) return ""
  const parts = [err.code, err.message, err.details].filter(Boolean)
  return parts.join(" — ").slice(0, 240)
}

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
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  const { legal_name, trade_name, org_type, jurisdiction_country, jurisdiction_region } = body
  if (!legal_name?.trim()) {
    return NextResponse.json({ error: "Legal name is required." }, { status: 422 })
  }
  if (!org_type || !(ORG_TYPES as readonly string[]).includes(org_type)) {
    return NextResponse.json({ error: "Select a valid organization type." }, { status: 422 })
  }
  if (!jurisdiction_country?.trim() || jurisdiction_country.trim().length !== 2) {
    return NextResponse.json({ error: "Country code must be a 2-letter ISO code (e.g. BR, CA)." }, { status: 422 })
  }

  const legal = legal_name.trim()
  const trade = trade_name?.trim() || null
  const country = jurisdiction_country.trim().toUpperCase().slice(0, 2)
  const region = jurisdiction_region?.trim() || null

  const slug =
    (trade || legal)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) +
    "-" +
    Math.random().toString(36).slice(2, 7)

  let supabase
  try {
    supabase = await createSupabaseServiceClient()
  } catch {
    return NextResponse.json(
      { error: "Organization service is not configured." },
      { status: 503 },
    )
  }

  // 1) Workspace (organization entity)
  const { data: ws, error: wsErr } = await supabase
    .from("workspaces")
    .insert({
      name: trade || legal,
      slug,
      legal_name: legal,
      trade_name: trade,
      org_type,
      jurisdiction_country: country,
      jurisdiction_region: region,
      verification_status: "unverified",
      is_public: false,
      settings: {},
      status: "active",
    })
    .select("id,slug,name,legal_name,trade_name,org_type,jurisdiction_country,jurisdiction_region,verification_status,status")
    .single()

  if (wsErr || !ws) {
    if (wsErr?.code === "23505") {
      return NextResponse.json({ error: "That organization name is already taken. Try a different legal or trade name." }, { status: 409 })
    }
    return NextResponse.json(
      { error: "Organization could not be created.", code: "CREATE_FAILED", detail: safeErrorDetail(wsErr) },
      { status: 500 },
    )
  }

  const now = new Date().toISOString()

  // 2) Membership — user owns/admin this org (required for profile to "stick")
  const { error: mErr } = await supabase.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: "admin",
    status: "active",
    invited_at: now,
    joined_at: now,
  })
  if (mErr) {
    await supabase.from("workspaces").delete().eq("id", ws.id)
    return NextResponse.json(
      { error: "Organization was created but membership failed. Nothing was kept — please retry.", code: "MEMBERSHIP_FAILED", detail: safeErrorDetail(mErr) },
      { status: 500 },
    )
  }

  // 3) Org passport profile (identity / readiness shell)
  let passportCreated = false
  const passportPayload = {
    org_id: ws.id,
    verification_level: "none",
    completeness_band: "incomplete",
    recall_exposure_flag: false,
    public_snapshot: {
      legal_name: legal,
      trade_name: trade,
      org_type,
      jurisdiction_country: country,
      jurisdiction_region: region,
      created_via: "org.create",
    },
  }
  const { error: passportErr } = await supabase.from("hv_passports").upsert(passportPayload, {
    onConflict: "org_id",
  })
  if (!passportErr) {
    passportCreated = true
  } else {
    // Non-fatal for membership, but surface so the client can show partial success
    console.error("org.create passport", passportErr)
  }

  // 4) Bind operating context to this org on the user profile (when column exists)
  let activeContextSet = false
  const { error: prefErr } = await supabase.from("user_dashboard_preferences").upsert(
    {
      user_id: user.id,
      active_workspace_id: ws.id,
      updated_at: now,
    },
    { onConflict: "user_id" },
  )
  if (!prefErr) {
    activeContextSet = true
  } else {
    // Column may be missing in environments without P0 migration; still keep membership.
    const { error: prefFallbackErr } = await supabase.from("user_dashboard_preferences").upsert(
      {
        user_id: user.id,
        updated_at: now,
      },
      { onConflict: "user_id" },
    )
    if (prefFallbackErr) console.error("org.create preferences", prefErr, prefFallbackErr)
    else console.warn("org.create preferences: active_workspace_id not persisted", safeErrorDetail(prefErr))
  }

  // 5) Audit (best-effort)
  await supabase.from("audit_events").insert({
    entity_type: "workspace",
    entity_id: ws.id,
    action: "org.created",
    actor: user.id,
    actor_user_id: user.id,
    actor_org_id: ws.id,
    metadata: { org_type, jurisdiction_country: country, passport: passportCreated, active_context: activeContextSet },
  }).then(({ error }) => {
    if (error) console.error("org.create audit", error)
  })

  return NextResponse.json(
    {
      data: {
        org_id: ws.id,
        slug: ws.slug,
        name: ws.name,
        legal_name: ws.legal_name,
        trade_name: ws.trade_name,
        org_type: ws.org_type,
        jurisdiction_country: ws.jurisdiction_country,
        verification_status: ws.verification_status,
        status: ws.status,
        active_workspace_id: activeContextSet ? ws.id : null,
        role: "admin",
        passport: passportCreated,
        profile_bound: true,
      },
    },
    { status: 201 },
  )
}
