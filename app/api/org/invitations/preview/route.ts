import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function isValidToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{64}$/i.test(token)
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const token = req.nextUrl.searchParams.get('token')
  if (!isValidToken(token)) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 422 })

  const email = user.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'ACCOUNT_EMAIL_REQUIRED' }, { status: 422 })

  const supabase = await createSupabaseServiceClient()
  const digest = hashToken(token)
  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .select('id,workspace_id,email,role,status,invited_by,created_at,expires_at')
    .eq('token_hash', digest)
    .maybeSingle()

  if (error || !invitation) return NextResponse.json({ error: 'INVITATION_NOT_FOUND' }, { status: 404 })
  if (invitation.email.trim().toLowerCase() !== email) {
    return NextResponse.json({ error: 'INVITATION_EMAIL_MISMATCH' }, { status: 403 })
  }

  if (invitation.status === 'pending' && new Date(invitation.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'INVITATION_EXPIRED' }, { status: 410 })
  }
  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: `INVITATION_${invitation.status.toUpperCase()}` }, { status: 409 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id,name,slug,verification_status,status')
    .eq('id', invitation.workspace_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!workspace) return NextResponse.json({ error: 'WORKSPACE_UNAVAILABLE' }, { status: 409 })

  return NextResponse.json({
    data: {
      workspace,
      role: invitation.role,
      invited_at: invitation.created_at,
      expires_at: invitation.expires_at,
    },
  })
}
