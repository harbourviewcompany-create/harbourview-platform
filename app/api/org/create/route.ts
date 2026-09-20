import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/network/rateLimit"
import { ORG_TYPES } from "@/lib/hv/orgTypes"

const ROUTE_ID = "/api/org/create"

function safeDbError(err: { message?: string; code?: string } | null): string {
  if (!err) return ""
  const code = err.code ?? ""
  const message = err.message ?? ""
  if (code === "23505" || /duplicate key|already exists/i.test(message)) {
    return "That organization name is already taken. Try a different legal or trade name."
  }
  if (code === "23514" || /check constraint/i.test(message)) {
    return "Some organization details are invalid. Check the organization type and country code."
  }
  return "Organization could not be created. Please try again."
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const legal = typeof body.legal_name === "string" ? body.legal_name.trim() : ""
  const trade = typeof body.trade_name === "string" ? body.trade_name.trim() : ""
  const orgType = typeof body.org_type === "string" ? body.org_type : ""
  const country = typeof body.jurisdiction_country === "string"
    ? body.jurisdiction_country.trim().toUpperCase()
    : ""
  const region = typeof body.jurisdiction_region === "string"
    ? body.jurisdiction_region.trim()
    : ""

  if (!legal) {
    return NextResponse.json({ error: "Legal name is required." }, { status: 422 })
  }
  if (!(ORG_TYPES as readonly string[]).includes(orgType)) {
    return NextResponse.json({ error: "Select a valid organization type." }, { status: 422 })
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json(
      { error: "Country code must be exactly 2 letters (e.g. CA, US, GB)." },
      { status: 422 },
    )
  }

  let supabase
  try {
    supabase = await createSupabaseServiceClient()
  } catch {
    return NextResponse.json(
      { error: "Organization service is not configured." },
      { status: 503 },
    )
  }

  // Organization creation is a single database transaction. This guarantees
  // workspace + admin membership + passport + active operating context are
  // either all created together or none are kept.
  const { data, error } = await supabase.rpc("create_workspace_for_user", {
    p_user_id: user.id,
    p_legal_name: legal,
    p_trade_name: trade || null,
    p_org_type: orgType,
    p_jurisdiction_country: country,
    p_jurisdiction_region: region || null,
  })

  if (error || !data) {
    console.error("org.create", {
      code: error?.code,
      message: error?.message,
      userId: user.id,
    })
    return NextResponse.json(
      { error: safeDbError(error), code: "CREATE_FAILED" },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      data: {
        ...data,
      },
    },
    { status: 201 },
  )
}
