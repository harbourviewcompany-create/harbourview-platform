import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  searchClinicalFormulary,
  searchClinicalFormularySkus,
} from '@/lib/server/clinicalFormularyQuery'

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

  const [classes, skus] = await Promise.all([
    searchClinicalFormulary({
      q: parsed.data.q,
      countryIso2: parsed.data.country,
      limit: parsed.data.limit,
    }),
    searchClinicalFormularySkus({
      q: parsed.data.q,
      countryIso2: parsed.data.country,
      limit: parsed.data.limit,
    }),
  ])

  const status =
    classes.state === 'error' && skus.state === 'error'
      ? 503
      : 200

  return NextResponse.json(
    {
      state: classes.state === 'error' && skus.state === 'error' ? 'error' : 'loaded',
      products: classes.products,
      skus: skus.skus,
      productState: classes.state,
      skuState: skus.state,
      error: classes.error || skus.error,
    },
    {
      status,
      headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
    },
  )
}
