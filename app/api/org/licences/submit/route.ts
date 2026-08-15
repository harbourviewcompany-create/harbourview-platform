import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/network/rateLimit"
import { notifyLicenceNeedsReview } from "@/lib/hv/orgNotification"
import { resolveActiveWorkspace } from "@/lib/hv/active-workspace"

const ROUTE_ID = "/api/org/licences/submit"

function normalizeLicenceNumber(v: string) {
  return v.trim().toUpperCase().replace(/\s+/g, "")
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const rateLimit = await enforceRateLimit({
    route: ROUTE_ID, ip: getClientIp(req), identity: user.id, limit: 10, windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } })
  }

  let body: Record<string, string>
  try { body = await req.json() } catch { return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 }) }
  const { licence_number, issuing_authority, jurisdiction_country, jurisdiction_region, licence_type, expires_at } = body
  if (!licence_number?.trim()) return NextResponse.json({ error: "licence_number required" }, { status: 422 })
  if (!issuing_authority?.trim()) return NextResponse.json({ error: "issuing_authority required" }, { status: 422 })
  if (!jurisdiction_country?.trim() || jurisdiction_country.trim().length !== 2) return NextResponse.json({ error: "jurisdiction_country must be 2-letter ISO code" }, { status: 422 })
  if (!licence_type?.trim()) return NextResponse.json({ error: "licence_type required" }, { status: 422 })
  if (!expires_at) return NextResponse.json({ error: "expires_at required" }, { status: 422 })

  const context = await resolveActiveWorkspace(user.id)
  if (context.error) return NextResponse.json({ error: "OPERATING_CONTEXT_UNAVAILABLE" }, { status: 500 })
  if (!context.workspaceId) {
    return NextResponse.json({ error: context.stale ? "ACTIVE_ORGANIZATION_UNAVAILABLE" : "NO_ACTIVE_ORGANIZATION" }, { status: 409 })
  }
  const org_id = context.workspaceId
  const supabase = await createSupabaseServiceClient()

  const country = jurisdiction_country.trim().toUpperCase().slice(0, 2)
  const normalizedNumber = normalizeLicenceNumber(licence_number)

  const { data: licence, error: licErr } = await supabase.from("hv_licences").insert({
    org_id, licence_number: licence_number.trim(), issuing_authority: issuing_authority.trim(),
    jurisdiction_country: country, jurisdiction_region: jurisdiction_region?.trim() || null,
    licence_type: licence_type.trim(), expires_at, status: "pending", verified: false,
  }).select("id").single()
  if (licErr || !licence) return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 })

  const { data: registryMatches } = await supabase.from("operator_licences")
    .select("licence_number,country_iso2,licence_status")
    .eq("country_iso2", country)
    .eq("licence_status", "active")
  const isMatch = (registryMatches ?? []).some(
    r => normalizeLicenceNumber(r.licence_number) === normalizedNumber,
  )

  const { data: org } = await supabase.from("workspaces")
    .select("name,legal_name,trade_name,verification_status").eq("id", org_id).single()

  if (isMatch) {
    await supabase.from("hv_licences").update({
      status: "active", verified: true, verified_at: new Date().toISOString(), verified_by: null,
    }).eq("id", licence.id)

    if (org?.verification_status === "unverified") {
      await supabase.from("workspaces").update({
        verification_status: "verified", verified_at: new Date().toISOString(), verified_by: null,
      }).eq("id", org_id)
    }

    await supabase.from("audit_events").insert({
      entity_type: "hv_licences", entity_id: licence.id, action: "licence.auto_verified",
      actor: user.id, actor_user_id: user.id, actor_org_id: org_id,
      metadata: { licence_number: licence_number.trim(), jurisdiction_country: country, matched_registry: true },
    })
  } else {
    if (org?.verification_status === "unverified") {
      await supabase.from("workspaces").update({ verification_status: "pending_review" }).eq("id", org_id)
    }

    const { error: queueError } = await supabase.from("hv_admin_review_queue").insert({
      queue_type: "licence_verification", target_entity_type: "licence", target_entity_id: licence.id,
      org_id, priority: "normal", status: "pending",
      notes: "No match found in public regulator registry for this licence number/jurisdiction.",
    })
    if (queueError) {
      console.error(
        "[licences/submit] failed to enqueue licence_verification review",
        { jurisdiction_country: country, error: queueError.message },
      )
    }

    await supabase.from("audit_events").insert({
      entity_type: "hv_licences", entity_id: licence.id, action: "licence.submitted_for_review",
      actor: user.id, actor_user_id: user.id, actor_org_id: org_id,
      metadata: { licence_number: licence_number.trim(), jurisdiction_country: country, matched_registry: false },
    })

    await notifyLicenceNeedsReview({
      org_id, org_name: org?.trade_name || org?.legal_name || org?.name || "Unknown organization",
      jurisdiction_country: country, licence_number: licence_number.trim(), licence_type: licence_type.trim(),
      reason: "no_registry_match",
    }).catch(() => { /* best-effort */ })
  }

  const computeRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-passport-score`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-operator-secret": process.env.HARBOURVIEW_EDGE_OPERATOR_SECRET! }, body: JSON.stringify({ org_id }) },
  ).catch(() => null)

  return NextResponse.json({
    data: { licence_id: licence.id, auto_verified: isMatch, passport_recomputed: !!computeRes?.ok, workspace_id: org_id },
  }, { status: 201 })
}
