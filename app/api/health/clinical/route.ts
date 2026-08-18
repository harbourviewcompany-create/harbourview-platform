import { NextResponse } from 'next/server'
import { searchClinicalEvidence } from '@/lib/server/clinicalEvidenceQuery'
import { searchClinicalFormulary } from '@/lib/server/clinicalFormularyQuery'
import { searchClinicalInteractions } from '@/lib/server/clinicalInteractionQuery'

export const dynamic = 'force-dynamic'

/**
 * Production smoke for Clinical Command data path.
 * Does not require auth. Returns counts + sample state only.
 */
export async function GET() {
  const [evidence, formulary, interactions] = await Promise.all([
    searchClinicalEvidence({ query: '', jurisdiction: 'BR', limit: 5 }),
    searchClinicalFormulary({ countryIso2: 'BR', limit: 5 }),
    searchClinicalInteractions({ limit: 5 }),
  ])

  const ok =
    evidence.state !== 'error' &&
    evidence.state !== 'permission' &&
    formulary.state !== 'error' &&
    interactions.state !== 'error'

  return NextResponse.json(
    {
      ok,
      evidence: {
        state: evidence.state,
        recordCount: evidence.records?.length ?? 0,
        message: evidence.message,
      },
      formulary: {
        state: formulary.state,
        productCount: formulary.products.length,
      },
      interactions: {
        state: interactions.state,
        interactionCount: interactions.interactions.length,
      },
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}
