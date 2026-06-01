import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { updateIaEvidenceReviewStatus } from '@/lib/intelligence-automation/db'

const VALID_STATUSES = ['pending', 'reviewed', 'needs_action', 'archived'] as const
type ReviewStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Evidence ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { reviewStatus } = body

    if (!reviewStatus || !VALID_STATUSES.includes(reviewStatus as ReviewStatus)) {
      return NextResponse.json(
        { error: `Invalid reviewStatus. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      )
    }

    const result = await updateIaEvidenceReviewStatus(
      id,
      reviewStatus as ReviewStatus,
      auth.user.id,
    )

    if (!result.ok) {
      return NextResponse.json({ error: (result as any).error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, evidenceId: id, reviewStatus })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
