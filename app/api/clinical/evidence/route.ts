import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { clinicalEvidenceHttpStatus } from '@/lib/clinical/runtime'
import { searchClinicalEvidence } from '@/lib/server/clinicalEvidenceQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(160).optional().default(''),
  jurisdiction: z.string().trim().min(2).max(120).optional(),
  country: z.string().trim().min(2).max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    jurisdiction: request.nextUrl.searchParams.get('jurisdiction') ?? undefined,
    country: request.nextUrl.searchParams.get('country') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid clinical evidence query', category: 'invalid-query' },
      { status: 400, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    )
  }

  const jurisdiction = parsed.data.jurisdiction ?? parsed.data.country

  const result = await searchClinicalEvidence({
    query: parsed.data.q,
    jurisdiction,
    limit: parsed.data.limit,
  })
  const headers: Record<string, string> = {
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'X-Harbourview-Clinical-State': result.state,
  }
  if (result.diagnostic?.category) headers['X-Harbourview-Clinical-Diagnostic'] = result.diagnostic.category

  return NextResponse.json(result, {
    status: clinicalEvidenceHttpStatus(result),
    headers,
  })
}
