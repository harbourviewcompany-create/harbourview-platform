import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCrossBorderFormularyCheck } from '@/lib/server/clinicalCrossBorderQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z
  .object({
    destination: z.string().trim().length(2),
    brand: z.string().trim().max(120).optional(),
    profile: z.string().trim().max(160).optional(),
  })
  .refine((v) => Boolean(v.brand) || Boolean(v.profile), {
    message: 'At least one of ?brand= or ?profile= is required',
  })

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    destination: request.nextUrl.searchParams.get('destination') ?? '',
    brand: request.nextUrl.searchParams.get('brand') ?? undefined,
    profile: request.nextUrl.searchParams.get('profile') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'A 2-letter ?destination= plus ?brand= and/or ?profile= is required' },
      { status: 400 },
    )
  }

  const result = await getCrossBorderFormularyCheck({
    destinationCountryIso2: parsed.data.destination,
    brandName: parsed.data.brand,
    cannabinoidProfile: parsed.data.profile,
  })

  return NextResponse.json(result, {
    status: result.state === 'error' ? 503 : 200,
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
