import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Temporary preview-only, read-only diagnostic. No Auth mutation methods are called.
const TARGET_EMAIL_SHA256 = 'ca9eddf04f3cacda649c2d1873707ad01b00e8b0754b8e9ac8d0b852373b54ac'

function hashEmail(value: unknown) {
  return createHash('sha256')
    .update(String(value ?? '').trim().toLowerCase())
    .digest('hex')
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!baseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, diagnosis: 'required_server_credentials_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const parsed = new URL(baseUrl)
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
    return NextResponse.json(
      { ok: false, diagnosis: 'noncanonical_supabase_url' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let found: Record<string, unknown> | null = null
  let page = 1

  while (!found && page <= 100) {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/auth/v1/admin/users?page=${page}&per_page=1000`,
      {
        method: 'GET',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, diagnosis: 'auth_admin_read_failed', status: response.status },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const body = (await response.json()) as { users?: Record<string, unknown>[]; next_page?: number } | Record<string, unknown>[]
    const users = Array.isArray(body) ? body : Array.isArray(body.users) ? body.users : []
    found = users.find((user) => hashEmail(user.email) === TARGET_EMAIL_SHA256) ?? null

    const nextPage = Array.isArray(body) ? 0 : Number(body.next_page ?? 0)
    if (found || users.length < 1000 || !nextPage) break
    page = nextPage
  }

  if (!found) {
    return NextResponse.json(
      {
        ok: true,
        projectRef: parsed.hostname.split('.')[0],
        targetUserFound: false,
        diagnosis: 'no_matching_auth_user_in_canonical_project',
        mutationPerformed: false,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const identities = Array.isArray(found.identities)
    ? (found.identities as Array<{ provider?: string }>)
    : []
  const providers = [...new Set(identities.map((identity) => identity.provider).filter(Boolean))].sort()
  const bannedUntil = typeof found.banned_until === 'string' ? Date.parse(found.banned_until) : Number.NaN

  return NextResponse.json(
    {
      ok: true,
      projectRef: parsed.hostname.split('.')[0],
      targetUserFound: true,
      emailConfirmed: Boolean(found.email_confirmed_at || found.confirmed_at),
      emailPasswordIdentity: providers.includes('email'),
      providers,
      userBanned: Number.isFinite(bannedUntil) && bannedUntil > Date.now(),
      lastSignInRecorded: Boolean(found.last_sign_in_at),
      diagnosis: 'auth_user_exists_password_hash_not_readable_by_design',
      mutationPerformed: false,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
