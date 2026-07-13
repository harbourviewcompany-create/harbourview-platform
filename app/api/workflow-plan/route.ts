/**
 * GET /api/workflow-plan?origin={iso2}&destination={iso2}
 *
 * Corridor Workflow Engine (prototype) — merges the origin (export-side) and
 * destination (import-side) jurisdiction playbooks into one ordered execution
 * plan, instead of returning two separate playbooks a human has to reconcile
 * themselves. See lib/intelligence/workflowEngine.ts for what this does and
 * — just as importantly — what it doesn't do yet (no real dependency-modeled
 * critical path).
 *
 * Built and tested against CA \u2192 DE only; the underlying function accepts
 * any two ISO2 codes, but only pairs where both sides have a published
 * jurisdiction_playbooks row will resolve.
 *
 * Public, read-only, same trust level as /api/intelligence/graph and the
 * existing /intelligence/playbooks pages this reuses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { deriveCorridorPlan } from '@/lib/intelligence/workflowEngine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get('origin')?.trim()
  const destination = searchParams.get('destination')?.trim()

  if (!origin || !destination || !/^[A-Za-z]{2}$/.test(origin) || !/^[A-Za-z]{2}$/.test(destination)) {
    return NextResponse.json(
      {
        error: 'origin and destination query params are required 2-letter ISO codes',
        example: '/api/workflow-plan?origin=CA&destination=DE',
      },
      { status: 400 },
    )
  }

  try {
    const plan = await deriveCorridorPlan(origin, destination)

    if (!plan) {
      return NextResponse.json(
        {
          error: `No published playbook for ${origin.toUpperCase()} and/or ${destination.toUpperCase()} yet`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(plan, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[/api/workflow-plan] error:', err)
    return NextResponse.json({ error: 'Workflow plan derivation failed' }, { status: 500 })
  }
}
