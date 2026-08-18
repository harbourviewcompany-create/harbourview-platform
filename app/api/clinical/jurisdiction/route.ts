import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClinicalJurisdictionProfile } from '@/lib/server/clinicalJurisdictionQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  country: z.string().trim().min(2).max(8),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    country: request.nextUrl.searchParams.get('country') ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'country required (ISO2)' }, { status: 400 })
  }

  const result = await getClinicalJurisdictionProfile(parsed.data.country)
  return NextResponse.json(result, {
    status: result.state === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}
