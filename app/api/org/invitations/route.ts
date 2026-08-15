import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createSupabaseServiceClient } from '@/lib/supabase/server'
import { getOrgMembership } from '@/lib/hv/org-membership'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

const ROUTE_ID = '/api/org/invitations'
const INVITE_ROLES = new Set(['admin', 'operator', 'analyst', 'viewer'])
const INVITER_ROLES = new Set(['admin', 'operator'])
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 422 })

  const membership = await getOrgMembership(workspaceId, user.id)
  if (!membership || !INVITER_ROLES.has(membership.org_role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase.from('workspace_invitations')
    .select('id,workspace_id,email,role,status,created_at,expires_at,accepted_at,accepted_by')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'INVITATION_LOOKUP_FAILED' }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const rateLimit = await enforceRateLimit({
    route: ROUTE_ID,
    ip: getClientIp(req),
    identity: user.id,
    limit: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many invitations. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 }) }

  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  const email = normalizeEmail(body.email)
  const role = typeof body.role === 'string' ? body.role : 'viewer'

  if (!workspaceId || !email || !INVITE_ROLES.has(role)) {
    return NextResponse.json({ error: 'INVALID_INVITATION' }, { status: 422 })
  }

  const membership = await getOrgMembership(workspaceId, user.id)
  if (!membership || !INVITER_ROLES.has(membership.org_role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const supabase = await createSupabaseServiceClient()
  const { data: workspace } = await supabase.from('workspaces')
    .select('id,status')
    .eq('id', workspaceId)
    .eq('status', 'active')
    .maybeSingle()
  if (!workspace) return NextResponse.json({ error: 'WORKSPACE_UNAVAILABLE' }, { status: 409 })

  // Do not enumerate auth.users here. Existing-member handling is authoritative
  // at atomic acceptance time and is independent of auth population size.
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS).toISOString()
  const { data: invitation, error } = await supabase.from('workspace_invitations').insert({
    workspace_id: workspaceId,
    email,
    role,
    token_hash: hashToken(token),
    invited_by: user.id,
    status: 'pending',
    expires_at: expiresAt,
  }).select('id,workspace_id,email,role,status,created_at,expires_at').single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'INVITATION_ALREADY_PENDING' }, { status: 409 })
    return NextResponse.json({ error: 'INVITATION_CREATE_FAILED' }, { status: 500 })
  }

  await supabase.from('audit_events').insert({
    entity_type: 'workspace',
    entity_id: workspaceId,
    action: 'org.invitation.created',
    actor: user.id,
    actor_user_id: user.id,
    actor_org_id: workspaceId,
    metadata: { invitation_id: invitation.id, role, email },
  })

  return NextResponse.json({
    data: {
      ...invitation,
      accept_path: `/organization/join?token=${token}`,
    },
  }, { status: 201 })
}
