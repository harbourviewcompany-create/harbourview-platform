import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/network/rateLimit"
import { notifyLicenceNeedsReview } from "@/lib/hv/orgNotification"

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

  const supabase = await createSupabaseServiceClient()

  const { data: membership } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).eq("status", "active").single()
  if (!membership) return NextResponse.json({ error: "NO_ORGANIZATION" }, { status: 409 })
  const org_id = membership.workspace_id

  const country = jurisdiction_country.trim().toUpperCase().slice(0, 2)
  const normalizedNumber = normalizeLicenceNumber(licence_number)

  const { data: licence, error: licErr } = await supabase.from("hv_licences").insert({
    org_id, licence_number: licence_number.trim(), issuing_authority: issuing_authority.trim(),
    jurisdiction_country: country, jurisdiction_region: jurisdiction_region?.trim() || null,
    licence_type: licence_type.trim(), expires_at, status: "pending", verified: false,
  }).select("id").single()
  if (licErr || !licence) return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 })

  // Auto-verify against the public regulator-scraped registry we already maintain
  // (operator_licences) — same licence number + jurisdiction + currently active
  // there is treated as sufficient to skip human review entirely.
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

    // This enqueue must not fail silently. `supabase` is schema-pinned to `api`
    // and `api.hv_admin_review_queue` does not exist in production — the
    // relation is `public`-only, because 20260708214312 and the review-queue
    // API-surface migrations have never been applied there. Discarding the
    // result meant an unmatched licence flipped the org to `pending_review` and
    // was then never queued for anyone to review, with nothing logged.
    //
    // Surfacing it does not fix the missing relation; it stops the compliance
    // gap from being invisible while that is decided.
    const { error: queueError } = await supabase.from("hv_admin_review_queue").insert({
      queue_type: "licence_verification", target_entity_type: "licence", target_entity_id: licence.id,
      org_id, priority: "normal", status: "pending",
      notes: "No match found in public regulator registry for this licence number/jurisdiction.",
    })
    if (queueError) {
      console.error(
        "[licences/submit] failed to enqueue licence_verification review",
        { licence_id: licence.id, org_id, error: queueError.message },
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

  // Recompute the passport score either way — a pending licence still counts
  // toward completeness/evidence_count even before verification.
  const computeRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-passport-score`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-operator-secret": process.env.HARBOURVIEW_EDGE_OPERATOR_SECRET! }, body: JSON.stringify({ org_id }) },
  ).catch(() => null)

  return NextResponse.json({
    data: { licence_id: licence.id, auto_verified: isMatch, passport_recomputed: !!computeRes?.ok },
  }, { status: 201 })
}
