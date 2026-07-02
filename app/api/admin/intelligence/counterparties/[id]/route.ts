import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import {
  logIaCounterpartyInteraction,
  updateIaCounterpartyDocumentationStatus,
  deleteIaCounterparty,
} from '@/lib/intelligence-automation/db'

const VALID_DOC_STATUSES = ['complete', 'partial', 'missing'] as const
type DocStatus = (typeof VALID_DOC_STATUSES)[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth()
    const { id } = await params

    const body = await request.json()
    const { currentInteractionCount, documentationStatus } = body

    if (documentationStatus !== undefined) {
      if (!VALID_DOC_STATUSES.includes(documentationStatus as DocStatus)) {
        return NextResponse.json(
          { error: `documentationStatus must be one of: ${VALID_DOC_STATUSES.join(', ')}` },
          { status: 400 },
        )
      }
      const result = await updateIaCounterpartyDocumentationStatus(id, documentationStatus as DocStatus)
      if (!result.ok) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (typeof currentInteractionCount !== 'number') {
      return NextResponse.json(
        { error: 'Provide either documentationStatus or a numeric currentInteractionCount' },
        { status: 400 },
      )
    }

    const result = await logIaCounterpartyInteraction(id, currentInteractionCount)
    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAuth()
    const { id } = await params
    const result = await deleteIaCounterparty(id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
