import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchClinicalMonitoringProtocols } from '@/lib/server/clinicalMonitoringQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  context: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    context: request.nextUrl.searchParams.get('context') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid monitoring protocol query' }, { status: 400 })
  }

  const result = await searchClinicalMonitoringProtocols(parsed.data)
  const protocols = result.protocols.map((p) => ({
    id: p.id,
    protocolName: p.protocolName,
    context: p.context,
    cannabinoid: p.cannabinoid,
    monitoringParameter: p.monitoringParameter,
    baselineRequired: p.baselineRequired,
    followUpInterval: p.followUpInterval,
    rationale: p.rationale,
    evidenceCertainty: p.evidenceCertainty,
    verifiedAt: p.verifiedAt,
    primarySourceTitle: p.primarySourceTitle,
    primarySourceUrl: p.primarySourceUrl,
    // Nested shape for mobile explorer, matching /api/clinical/interactions
    primarySource: {
      publisher: p.primarySourceTitle,
      url: p.primarySourceUrl ?? undefined,
    },
  }))

  return NextResponse.json(
    { ...result, protocols },
    {
      status: result.state === 'error' ? 503 : 200,
      headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
    },
  )
}
