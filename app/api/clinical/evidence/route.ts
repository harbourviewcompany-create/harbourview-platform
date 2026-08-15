import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchClinicalEvidence } from '@/lib/server/clinicalEvidenceQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(160).optional().default(''),
  jurisdiction: z.string().trim().min(2).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    jurisdiction: request.nextUrl.searchParams.get('jurisdiction') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid clinical evidence query' }, { status: 400 })
  }

  const result = await searchClinicalEvidence({
    query: parsed.data.q,
    jurisdiction: parsed.data.jurisdiction,
    limit: parsed.data.limit,
  })

  return NextResponse.json(result, {
    status: result.state === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}
