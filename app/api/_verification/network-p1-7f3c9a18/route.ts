import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const target = 'https://harbourview.vercel.app/api/network/introduction-requests/00000000-0000-4000-8000-000000000000'
  const response = await fetch(target, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      toStatus: 'review',
      detail: { verification: 'network-p1-unauthenticated-smoke' },
    }),
    cache: 'no-store',
  })

  const body = await response.text()
  const forbidden = [
    'sourceUrl',
    'sourceName',
    'Evidence captured',
    'provenanceSummary',
    'sourceEvidence',
    'verificationStatus',
    'availabilityStatus',
    'sellerAuthorizationStatus',
    'internalReviewNotes',
    'reviewedBy',
    'lastReviewedAt',
    'nextReviewDueAt',
    'SUPABASE_SERVICE_ROLE_KEY',
    'service_role',
    'postgresql://',
    'DATABASE_URL',
    'workspace_id',
    'user_id',
    'auth.uid',
    'NETWORK_INTRODUCTION_',
    'stack trace',
  ]
  const lower = body.toLowerCase()
  const leakedTerms = forbidden.filter((term) => lower.includes(term.toLowerCase()))
  const jwtLike = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/.test(body)
  const exactBody = body === '{"error":"Unauthorized"}'

  return NextResponse.json(
    {
      target,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
      body,
      bodyBytes: Buffer.byteLength(body, 'utf8'),
      bodySha256: createHash('sha256').update(body).digest('hex'),
      exactBody,
      leakedTerms,
      jwtLike,
      pass: response.status === 401 && exactBody && leakedTerms.length === 0 && !jwtLike,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
