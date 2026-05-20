import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_TTL_SECONDS = 60 * 60 * 8

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

export function createAdminSessionToken(secret: string): string {
  const payload = JSON.stringify({
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })
  const payloadB64 = b64url(payload)
  const signature = sign(payloadB64, secret)
  return `${payloadB64}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined, secret: string | undefined): boolean {
  if (!token || !secret) return false

  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return false

  const expected = sign(payloadB64, secret)
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (sigBuffer.length !== expectedBuffer.length) return false
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return false

  let payload: { sub?: string; exp?: number }
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  } catch {
    return false
  }

  if (payload.sub !== 'admin' || typeof payload.exp !== 'number') return false
  return payload.exp > Math.floor(Date.now() / 1000)
}

export function getAdminSessionMaxAge(): number {
  return SESSION_TTL_SECONDS
}

export function isAllowedOrigin(origin: string | null, siteUrl: string | undefined): boolean {
  if (!origin || !siteUrl) return false
  try {
    return new URL(origin).origin === new URL(siteUrl).origin
  } catch {
    return false
  }
}
