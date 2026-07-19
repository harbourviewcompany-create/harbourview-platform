import { NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const supabase = await createSupabaseServiceClient()
  const { data: membership } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).eq("status", "active").single()
  if (!membership) return NextResponse.json({ data: { org: null, licences: [] } })

  const [{ data: org }, { data: licences }] = await Promise.all([
    supabase.from("workspaces")
      .select("id,name,legal_name,trade_name,org_type,jurisdiction_country,verification_status")
      .eq("id", membership.workspace_id).single(),
    supabase.from("hv_licences")
      .select("id,licence_number,licence_type,jurisdiction_country,status,verified,expires_at")
      .eq("org_id", membership.workspace_id)
      .order("created_at", { ascending: false }),
  ])

  return NextResponse.json({ data: { org, licences: licences ?? [] } })
}
