import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

async function resolveOrg(userId: string) {
  const svc = await createSupabaseServiceClient()
  const { data } = await svc
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  return { svc, orgId: data?.workspace_id ?? null }
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { svc, orgId } = await resolveOrg(user.id)
  if (!orgId) return NextResponse.json({ rules: [] })

  const { data, error } = await svc
    .from('cc_watch_rules')
    .select('id, rule_type, keywords, is_active, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rules: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rule_type, keywords } = body

  if (!rule_type || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: 'rule_type and keywords are required' }, { status: 400 })
  }

  const { svc, orgId } = await resolveOrg(user.id)
  if (!orgId) return NextResponse.json({ error: 'No organisation found' }, { status: 403 })

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

  return NextResponse.json({ rule: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { svc, orgId } = await resolveOrg(user.id)
  if (!orgId) return NextResponse.json({ error: 'No organisation found' }, { status: 403 })

  const { error } = await svc
    .from('cc_watch_rules')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
