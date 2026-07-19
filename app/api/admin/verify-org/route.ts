import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase/server"
import { isPlatformStaff } from "@/lib/hv/org-membership"

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  if (!(await isPlatformStaff(user.id))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  const { org_id, verification_status, queue_id, notes, licence_id } = await req.json()
  if (!org_id || !verification_status) return NextResponse.json({ error: "org_id and verification_status required" }, { status: 422 })
  const supabase = await createSupabaseServerClient()

  if (licence_id) {
    // Licence-level review item: this decision is about one submitted licence,
    // not a blanket re-judgment of the whole org.
    await supabase.from("hv_licences").update({
      status: verification_status === "verified" ? "active" : "revoked",
      verified: verification_status === "verified",
      verified_at: verification_status === "verified" ? new Date().toISOString() : null,
      verified_by: verification_status === "verified" ? user.id : null,
    }).eq("id", licence_id)

    if (verification_status === "verified") {
      const { data: org } = await supabase.from("workspaces").select("verification_status").eq("id", org_id).single()
      if (org?.verification_status === "unverified" || org?.verification_status === "pending_review") {
        await supabase.from("workspaces").update({
          verification_status: "verified", verified_at: new Date().toISOString(), verified_by: user.id,
        }).eq("id", org_id)
      }
    }
  } else {
    await supabase.from("workspaces").update({
      verification_status,
      verified_at: verification_status === "verified" ? new Date().toISOString() : null,
      verified_by: verification_status === "verified" ? user.id : null,
    }).eq("id", org_id)
  }

  if (queue_id) {
    await supabase.from("hv_admin_review_queue").update({
      status: "resolved", resolved_at: new Date().toISOString(),
      notes: notes ?? null, updated_at: new Date().toISOString(),
    }).eq("id", queue_id)
  }
  await supabase.from("audit_events").insert({
    entity_type: licence_id ? "hv_licences" : "workspace", entity_id: licence_id ?? org_id,
    action: licence_id ? "licence.verification_status.changed" : "org.verification_status.changed",
    actor: user.id, actor_user_id: user.id,
    metadata: { verification_status, queue_id: queue_id ?? null, org_id },
  })
  const computeRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-passport-score`,
    { method: "POST", headers: { "Content-Type": "application/json", "x-operator-secret": process.env.HARBOURVIEW_EDGE_OPERATOR_SECRET! }, body: JSON.stringify({ org_id }) }
  )
  return NextResponse.json({ data: { org_id, verification_status, passport_recomputed: computeRes.ok } }, { status: 200 })
}
