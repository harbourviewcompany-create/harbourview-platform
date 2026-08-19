import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { buildAskClinicalResponse } from '@/lib/clinical/prescriber'
import { searchClinicalEvidence } from '@/lib/server/clinicalEvidenceQuery'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().min(2).max(400),
  jurisdiction: z.string().trim().min(2).max(12).optional(),
  limit: z.coerce.number().int().min(1).max(25).optional().default(12),
})

/**
 * Deterministic Ask Clinical retrieval.
 *
 * This endpoint does not ask a model to invent or complete a clinical answer.
 * It retrieves the existing governed evidence spine, removes records that fail
 * the prescriber-inspectable provenance contract, and returns the reviewed
 * summaries with exact source URLs. Patient-specific treatment recommendations
 * are deliberately outside this endpoint.
 */
export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
    jurisdiction: request.nextUrl.searchParams.get('jurisdiction') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        state: 'error',
        error: 'Invalid Ask Clinical query',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const evidence = await searchClinicalEvidence({
    query: parsed.data.q,
    jurisdiction: parsed.data.jurisdiction?.toUpperCase(),
    limit: parsed.data.limit,
  })

  if (evidence.state === 'permission') {
    return NextResponse.json(
      {
        state: 'permission',
        question: parsed.data.q,
        answer: 'Clinical evidence access is not permitted for this request.',
        citations: [],
        unresolved: ['Evidence permission must be resolved before a clinical answer can be assembled.'],
      },
      { status: 403, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    )
  }

  if (evidence.state === 'error') {
    return NextResponse.json(
      {
        state: 'error',
        question: parsed.data.q,
        answer: 'The governed evidence source is unavailable.',
        citations: [],
        unresolved: [evidence.message],
      },
      { status: 503, headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    )
  }

  return NextResponse.json(buildAskClinicalResponse(parsed.data.q, evidence.records), {
    status: 200,
    headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' },
  })
}
