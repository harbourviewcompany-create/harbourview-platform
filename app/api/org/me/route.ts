import { NextResponse } from "next/server"
import { getAuthenticatedUser, createSupabaseServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const supabase = await createSupabaseServiceClient()

  const [{ data: memberRows, error: memberErr }, { data: prefs }] = await Promise.all([
    supabase.from("workspace_members")
      .select("workspace_id,role,status,invited_by,invited_at,joined_at")
      .eq("user_id", user.id),
    supabase.from("user_dashboard_preferences")
      .select("active_workspace_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  if (memberErr) return NextResponse.json({ error: "MEMBERSHIP_LOOKUP_FAILED" }, { status: 500 })

  const rows = memberRows ?? []
  const workspaceIds = [...new Set(rows.map(row => row.workspace_id))]
  const { data: workspaces, error: workspaceErr } = workspaceIds.length
    ? await supabase.from("workspaces")
        .select("id,name,slug,legal_name,trade_name,org_type,jurisdiction_country,jurisdiction_region,verification_status,status")
        .in("id", workspaceIds)
    : { data: [], error: null }

  if (workspaceErr) return NextResponse.json({ error: "WORKSPACE_LOOKUP_FAILED" }, { status: 500 })

  const workspaceById = new Map((workspaces ?? []).map(workspace => [workspace.id, workspace]))
  const memberships = rows
    .map(row => ({
      workspace_id: row.workspace_id,
      role: row.role,
      status: row.status,
      invited_by: row.invited_by,
      invited_at: row.invited_at,
      joined_at: row.joined_at,
      workspace: workspaceById.get(row.workspace_id) ?? null,
    }))
    .sort((a, b) => {
      const aName = a.workspace?.name ?? ""
      const bName = b.workspace?.name ?? ""
      return aName.localeCompare(bName) || a.workspace_id.localeCompare(b.workspace_id)
    })

  const activeMemberships = memberships.filter(item => item.status === "active" && item.workspace?.status === "active")
  const requestedActiveId = prefs?.active_workspace_id ?? null
  const activeMembership = requestedActiveId
    ? activeMemberships.find(item => item.workspace_id === requestedActiveId) ?? null
    : null
  const staleActiveWorkspaceId = requestedActiveId && !activeMembership ? requestedActiveId : null

  let licences: unknown[] = []
  if (activeMembership) {
    const { data } = await supabase.from("hv_licences")
      .select("id,licence_number,licence_type,jurisdiction_country,status,verified,expires_at")
      .eq("org_id", activeMembership.workspace_id)
      .order("created_at", { ascending: false })
    licences = data ?? []
  }

  let invitations: unknown[] = []
  const normalizedEmail = user.email?.trim().toLowerCase()
  if (normalizedEmail) {
    const { data } = await supabase.from("workspace_invitations")
      .select("id,workspace_id,email,role,status,created_at,expires_at")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
    invitations = data ?? []
  }

  return NextResponse.json({
    data: {
      active_mode: activeMembership ? "organization" : "personal",
      active_workspace_id: activeMembership?.workspace_id ?? null,
      stale_active_workspace_id: staleActiveWorkspaceId,
      memberships,
      invitations,
      // Backward-compatible projection for existing single-org consumers.
      org: activeMembership?.workspace ?? null,
      licences,
    },
  })
}
