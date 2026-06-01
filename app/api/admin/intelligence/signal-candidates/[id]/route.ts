import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { advanceSignalCandidateStatus } from '@/lib/intelligence-automation/db'

const VALID_STATUSES = [
  'needs_review',
  'needs_source_check',
  'needs_contact_enrichment',
  'needs_compliance_review',
  'needs_pricing_check',
  'priority_review',
  'approved',
  'rejected',
  'duplicate',
  'archived',
  'ready_for_outreach',
  'outreach_sent',
  'converted_to_listing',
  'converted_to_supplier',
  'converted_to_wanted_request',
  'converted_to_dossier',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, reviewNotes } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const result = await advanceSignalCandidateStatus(id, status, reviewNotes ?? undefined)

    if (!result.ok) {
      return NextResponse.json({ error: (result as any).error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, candidateId: id, status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
