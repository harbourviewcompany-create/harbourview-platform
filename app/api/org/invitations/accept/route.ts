import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function isValidToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{64}$/i.test(token)
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 }) }

  const token = body.token
  const action = body.action === 'decline' ? 'decline' : 'accept'
  if (!isValidToken(token)) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 422 })

  const email = user.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'ACCOUNT_EMAIL_REQUIRED' }, { status: 422 })

  const supabase = await createSupabaseServiceClient()
  const { data: invitation, error: inviteErr } = await supabase.from('workspace_invitations')
    .select('id,workspace_id,email,role,status,invited_by,created_at,expires_at,accepted_at,accepted_by')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (inviteErr || !invitation) return NextResponse.json({ error: 'INVITATION_NOT_FOUND' }, { status: 404 })
  if (invitation.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: 'INVITATION_EMAIL_MISMATCH' }, { status: 403 })
  }

  const now = new Date()
  if (new Date(invitation.expires_at).getTime() <= now.getTime() && invitation.status === 'pending') {
    await supabase.from('workspace_invitations').update({ status: 'expired', updated_at: now.toISOString() }).eq('id', invitation.id)
    return NextResponse.json({ error: 'INVITATION_EXPIRED' }, { status: 410 })
  }

  if (action === 'decline') {
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `INVITATION_${invitation.status.toUpperCase()}` }, { status: 409 })
    }
    await supabase.from('workspace_invitations').update({ status: 'declined', updated_at: now.toISOString() }).eq('id', invitation.id)
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  if (invitation.status === 'accepted') {
    const { data: existing } = await supabase.from('workspace_members')
      .select('workspace_id,role,status')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ data: { workspace_id: invitation.workspace_id, already_accepted: true } })
    }
    return NextResponse.json({ error: 'INVITATION_ALREADY_USED' }, { status: 409 })
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: `INVITATION_${invitation.status.toUpperCase()}` }, { status: 409 })
  }

  const joinedAt = now.toISOString()
  const { error: membershipErr } = await supabase.from('workspace_members').upsert({
    workspace_id: invitation.workspace_id,
    user_id: user.id,
    role: invitation.role,
    status: 'active',
    invited_by: invitation.invited_by,
    invited_at: invitation.created_at,
    joined_at: joinedAt,
  }, { onConflict: 'workspace_id,user_id' })

  if (membershipErr) return NextResponse.json({ error: 'MEMBERSHIP_ACCEPT_FAILED' }, { status: 500 })

  const { error: inviteUpdateErr } = await supabase.from('workspace_invitations').update({
    status: 'accepted',
    accepted_at: joinedAt,
    accepted_by: user.id,
    updated_at: joinedAt,
  }).eq('id', invitation.id).eq('status', 'pending')

  if (inviteUpdateErr) return NextResponse.json({ error: 'INVITATION_FINALIZE_FAILED' }, { status: 500 })

  await supabase.from('user_dashboard_preferences').upsert({
    user_id: user.id,
    active_workspace_id: invitation.workspace_id,
    updated_at: joinedAt,
  }, { onConflict: 'user_id' })

  const { data: workspace } = await supabase.from('workspaces')
    .select('id,name,slug,verification_status,status')
    .eq('id', invitation.workspace_id)
    .single()

  await supabase.from('audit_events').insert({
    entity_type: 'workspace',
    entity_id: invitation.workspace_id,
    action: 'org.invitation.accepted',
    actor: user.id,
    actor_user_id: user.id,
    actor_org_id: invitation.workspace_id,
    metadata: { invitation_id: invitation.id, role: invitation.role },
  })

  return NextResponse.json({
    data: {
      workspace_id: invitation.workspace_id,
      workspace,
      role: invitation.role,
      active_workspace_id: invitation.workspace_id,
    },
  })
}
