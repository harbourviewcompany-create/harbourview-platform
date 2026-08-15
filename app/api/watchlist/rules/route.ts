import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { resolveActiveWorkspace } from '@/lib/hv/active-workspace'

async function resolveOrg(userId: string) {
  const { supabase, workspaceId, stale, error } = await resolveActiveWorkspace(userId)
  return { svc: supabase, orgId: workspaceId, stale, error }
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { svc, orgId, stale, error: contextError } = await resolveOrg(user.id)
  if (contextError) return NextResponse.json({ error: 'Operating context unavailable' }, { status: 500 })
  if (!orgId) return NextResponse.json({ rules: [], operating_mode: 'personal', stale_context: stale })

  const { data, error } = await svc
    .from('cc_watch_rules')
    .select('id, rule_type, keywords, is_active, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rules: data ?? [], operating_mode: 'organization', workspace_id: orgId })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rule_type, keywords } = body

  if (!rule_type || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: 'rule_type and keywords are required' }, { status: 400 })
  }

  const { svc, orgId, stale, error: contextError } = await resolveOrg(user.id)
  if (contextError) return NextResponse.json({ error: 'Operating context unavailable' }, { status: 500 })
  if (!orgId) {
    return NextResponse.json(
      { error: stale ? 'Selected organization is no longer available' : 'Select an organization before creating organization-scoped watch rules' },
      { status: 409 },
    )
  }

  const { data, error } = await svc
    .from('cc_watch_rules')
    .insert({
      org_id: orgId,
      created_by: user.id,
      rule_type,
      keywords,
      is_active: true,
    })
    .select('id, rule_type, keywords, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rule: data, workspace_id: orgId }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { svc, orgId, stale, error: contextError } = await resolveOrg(user.id)
  if (contextError) return NextResponse.json({ error: 'Operating context unavailable' }, { status: 500 })
  if (!orgId) {
    return NextResponse.json(
      { error: stale ? 'Selected organization is no longer available' : 'Select an organization before changing organization-scoped watch rules' },
      { status: 409 },
    )
  }

  const { error } = await svc
    .from('cc_watch_rules')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, workspace_id: orgId })
}
