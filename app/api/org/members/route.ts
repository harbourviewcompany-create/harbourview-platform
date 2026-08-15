import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { getOrgMembership } from '@/lib/hv/org-membership'

const MEMBER_VIEW_ROLES = new Set(['admin', 'operator'])

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 422 })

  const membership = await getOrgMembership(workspaceId, user.id)
  if (!membership || !MEMBER_VIEW_ROLES.has(membership.org_role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const supabase = await createSupabaseServiceClient()
  const { data: rows, error } = await supabase.from('workspace_members')
    .select('workspace_id,user_id,role,status,invited_by,invited_at,joined_at')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'MEMBER_LOOKUP_FAILED' }, { status: 500 })

  const members = [] as Array<Record<string, unknown>>
  for (const row of rows ?? []) {
    const { data } = await supabase.auth.admin.getUserById(row.user_id)
    members.push({
      ...row,
      email: data.user?.email ?? null,
    })
  }

  return NextResponse.json({ data: members })
}
