import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchClinicalInteractions } from '@/lib/server/clinicalInteractionQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid interaction query' }, { status: 400 })
  }

  const result = await searchClinicalInteractions(parsed.data)
  const interactions = result.interactions.map((ix) => ({
    id: ix.id,
    medicationIngredient: ix.medicationIngredient,
    cannabinoid: ix.cannabinoid,
    mechanism: ix.mechanism,
    clinicalSignificance: ix.clinicalSignificance,
    evidenceCertainty: ix.evidenceCertainty,
    uncertainty: ix.uncertainty,
    monitoringConsideration: ix.monitoringConsideration,
    verifiedAt: ix.verifiedAt,
    primarySourceTitle: ix.primarySourceTitle,
    primarySourceUrl: ix.primarySourceUrl,
    // Nested shape for mobile explorer
    primarySource: {
      publisher: ix.primarySourceTitle,
      url: ix.primarySourceUrl ?? undefined,
    },
  }))

  return NextResponse.json(
    { ...result, interactions },
    {
      status: result.state === 'error' ? 503 : 200,
      headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
    },
  )
}
