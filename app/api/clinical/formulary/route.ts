import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchClinicalFormulary } from '@/lib/server/clinicalFormularyQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(160).optional().default(''),
  country: z.string().trim().min(2).max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(30),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    country: request.nextUrl.searchParams.get('country') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid formulary query' }, { status: 400 })
  }

  const result = await searchClinicalFormulary({
    q: parsed.data.q,
    countryIso2: parsed.data.country,
    limit: parsed.data.limit,
  })

  return NextResponse.json(result, {
    status: result.state === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}
