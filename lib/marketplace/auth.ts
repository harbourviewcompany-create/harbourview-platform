import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET
const ADMIN_SESSION_SIGNING_KEY = process.env.ADMIN_SESSION_SIGNING_KEY

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours
const ADMIN_SESSION_COOKIE = 'hv_admin_session'
const JWT_ALG = 'HS256'

type AdminSessionClaims = {
  sub: 'admin'
  iat: number
  exp: number
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = ''
  for (const byte of input) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function getAdminSessionSigningKey(): string | null {
  return ADMIN_SESSION_SIGNING_KEY ?? ADMIN_SECRET ?? null
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createAdminSessionToken(nowSeconds = Math.floor(Date.now() / 1000)): Promise<string | null> {
  const secret = getAdminSessionSigningKey()
  if (!secret) return null

  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: JWT_ALG, typ: 'JWT' })))
  const payload: AdminSessionClaims = { sub: 'admin', iat: nowSeconds, exp: nowSeconds + ADMIN_SESSION_TTL_SECONDS }
  const payloadEncoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))

  const key = await importSigningKey(secret)
  const signingInput = `${header}.${payloadEncoded}`
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))

  return `${signingInput}.${base64UrlEncode(new Uint8Array(sig))}`
}

export async function verifyAdminSessionToken(token: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const secret = getAdminSessionSigningKey()
  if (!secret) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [header, payload, signature] = parts

  let decodedHeader: { alg?: string; typ?: string }
  let decodedPayload: Partial<AdminSessionClaims>

  try {
    decodedHeader = JSON.parse(new TextDecoder().decode(base64UrlDecode(header)))
    decodedPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)))
  } catch {
    return false
  }

  if (decodedHeader.alg !== JWT_ALG || decodedHeader.typ !== 'JWT') return false
  if (decodedPayload.sub !== 'admin') return false
  if (typeof decodedPayload.iat !== 'number' || typeof decodedPayload.exp !== 'number') return false
  if (decodedPayload.exp <= nowSeconds || decodedPayload.iat > nowSeconds) return false

  const key = await importSigningKey(secret)
  const signatureBytes = base64UrlDecode(signature)
  const signatureBuffer = signatureBytes.buffer.slice(signatureBytes.byteOffset, signatureBytes.byteOffset + signatureBytes.byteLength)
  return crypto.subtle.verify('HMAC', key, signatureBuffer, new TextEncoder().encode(`${header}.${payload}`))
}

export function validateAdminRequest(req: NextRequest): NextResponse | null {
  if (!ADMIN_SECRET) {
    console.error('[Admin] ADMIN_SECRET is not configured')
    return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 })
  }

  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = auth.slice(7)
  if (token !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function hasAdminCookie(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)
  if (!cookie) return false
  return verifyAdminSessionToken(cookie.value)
}

export { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS }
