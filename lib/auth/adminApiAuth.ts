import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'

function isNavigationInterrupt(error: unknown, digest: string) {
  return typeof error === 'object'
    && error !== null
    && 'digest' in error
    && typeof error.digest === 'string'
    && error.digest.startsWith(digest)
}

export async function requireAdminApiAuth() {
  try {
    await requireAdminAuth()
    return null
  } catch (error) {
    if (isNavigationInterrupt(error, 'NEXT_HTTP_ERROR_FALLBACK;401')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    if (isNavigationInterrupt(error, 'NEXT_HTTP_ERROR_FALLBACK;403')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    throw error
  }
}
