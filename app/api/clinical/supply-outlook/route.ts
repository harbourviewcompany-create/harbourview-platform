import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClinicalSupplyOutlook } from '@/lib/server/clinicalSupplyOutlookQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  country: z.string().trim().length(2),
  lookbackDays: z.coerce.number().int().min(7).max(720).optional().default(180),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    country: request.nextUrl.searchParams.get('country') ?? '',
    lookbackDays: request.nextUrl.searchParams.get('lookbackDays') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A 2-letter ?country= is required' },
      { status: 400 },
    )
  }

  const result = await getClinicalSupplyOutlook({
    countryIso2: parsed.data.country,
    lookbackDays: parsed.data.lookbackDays,
  })

  return NextResponse.json(result, {
    status: result.state === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
