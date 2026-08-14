import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function isValidToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{64}$/i.test(token)
}

type AcceptanceResult = {
  outcome?: string
  workspace_id?: string
  role?: string
}

function acceptanceError(outcome: string) {
  switch (outcome) {
    case 'not_found': return ['INVITATION_NOT_FOUND', 404] as const
    case 'email_mismatch': return ['INVITATION_EMAIL_MISMATCH', 403] as const
    case 'expired': return ['INVITATION_EXPIRED', 410] as const
    case 'declined': return ['INVITATION_DECLINED', 409] as const
    case 'revoked': return ['INVITATION_REVOKED', 409] as const
    case 'workspace_unavailable': return ['WORKSPACE_UNAVAILABLE', 409] as const
    case 'existing_membership_inactive': return ['EXISTING_MEMBERSHIP_INACTIVE', 409] as const
    case 'already_used': return ['INVITATION_ALREADY_USED', 409] as const
    default: return ['INVITATION_ACCEPT_FAILED', 500] as const
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 }) }

  const invitationCode = body.token
  const action = body.action === 'decline' ? 'decline' : 'accept'
  if (!isValidToken(invitationCode)) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 422 })

  const email = user.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'ACCOUNT_EMAIL_REQUIRED' }, { status: 422 })

  const supabase = await createSupabaseServiceClient()
  const invitationDigest = hashToken(invitationCode)

  if (action === 'decline') {
    const { data: invitation, error: inviteErr } = await supabase.from('workspace_invitations')
      .select('id,email,status,expires_at')
      .eq('token_hash', invitationDigest)
      .maybeSingle()

    if (inviteErr || !invitation) return NextResponse.json({ error: 'INVITATION_NOT_FOUND' }, { status: 404 })
    if (invitation.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ error: 'INVITATION_EMAIL_MISMATCH' }, { status: 403 })
    }
    if (new Date(invitation.expires_at).getTime() <= Date.now() && invitation.status === 'pending') {
      await supabase.from('workspace_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id)
        .eq('status', 'pending')
      return NextResponse.json({ error: 'INVITATION_EXPIRED' }, { status: 410 })
    }
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `INVITATION_${invitation.status.toUpperCase()}` }, { status: 409 })
    }

    const { data: declined, error: declineErr } = await supabase.from('workspace_invitations')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', invitation.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (declineErr) return NextResponse.json({ error: 'INVITATION_DECLINE_FAILED' }, { status: 500 })
    if (!declined) return NextResponse.json({ error: 'INVITATION_ALREADY_USED' }, { status: 409 })
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  const { data, error } = await supabase.rpc('accept_workspace_invitation', {
    ['p_token_hash']: invitationDigest,
    p_user_id: user.id,
    p_user_email: email,
  })

  if (error) return NextResponse.json({ error: 'INVITATION_ACCEPT_FAILED' }, { status: 500 })
  const result = (data ?? {}) as AcceptanceResult
  const outcome = result.outcome ?? 'failed'

  if (!['accepted', 'already_member', 'already_accepted'].includes(outcome) || !result.workspace_id) {
    const [code, status] = acceptanceError(outcome)
    return NextResponse.json({ error: code }, { status })
  }

  const joinedAt = new Date().toISOString()
  await supabase.from('user_dashboard_preferences').upsert({
    user_id: user.id,
    active_workspace_id: result.workspace_id,
    updated_at: joinedAt,
  }, { onConflict: 'user_id' })

  const { data: workspace } = await supabase.from('workspaces')
    .select('id,name,slug,verification_status,status')
    .eq('id', result.workspace_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!workspace) return NextResponse.json({ error: 'WORKSPACE_UNAVAILABLE' }, { status: 409 })

  if (outcome !== 'already_accepted') {
    await supabase.from('audit_events').insert({
      entity_type: 'workspace',
      entity_id: result.workspace_id,
      action: 'org.invitation.accepted',
      actor: user.id,
      actor_user_id: user.id,
      actor_org_id: result.workspace_id,
      metadata: { role: result.role ?? null, outcome },
    })
  }

  return NextResponse.json({
    data: {
      workspace_id: result.workspace_id,
      workspace,
      role: result.role ?? null,
      active_workspace_id: result.workspace_id,
      already_accepted: outcome === 'already_accepted',
      already_member: outcome === 'already_member',
    },
  })
}
