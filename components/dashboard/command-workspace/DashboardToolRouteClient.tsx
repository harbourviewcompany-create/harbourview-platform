'use client'

import { useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardToolChrome } from '@/components/dashboard/DashboardToolChrome'
import { CorridorPlanWorkspace } from './CorridorPlanWorkspace'
import { LandedCostWorkspace } from './LandedCostWorkspace'
import './CorridorWorkspace.css'

type ToolId = 'corridor-plan' | 'landed-cost'

function ToolBody({ tool }: { tool: ToolId }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onClose = useCallback(() => {
    const returnTo = searchParams.get('returnTo')
    if (returnTo && returnTo.startsWith('/dashboard')) {
      router.push(returnTo)
      return
    }
    const params = new URLSearchParams()
    const country = searchParams.get('country') ?? searchParams.get('origin')
    const role = searchParams.get('role')
    params.set('section', 'next-actions')
    if (country) params.set('country', country)
    if (role) params.set('role', role)
    router.push(`/dashboard?${params.toString()}`)
  }, [router, searchParams])

  if (tool === 'corridor-plan') {
    return (
      <DashboardToolChrome activeTab="next-actions" title="Corridor execution plan">
        <CorridorPlanWorkspace onClose={onClose} />
      </DashboardToolChrome>
    )
  }

  return (
    <DashboardToolChrome activeTab="next-actions" title="Landed cost + sensitivity">
      <LandedCostWorkspace onClose={onClose} />
    </DashboardToolChrome>
  )
}

export function DashboardToolRouteClient({ tool }: { tool: ToolId }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-[#020814] px-4 py-8 text-[#f5f1e8]">
          <p className="text-xs uppercase tracking-widest text-[#c6a55a]">Harbourview</p>
          <p className="mt-3 text-sm text-white/50">Loading tool…</p>
        </main>
      }
    >
      <ToolBody tool={tool} />
    </Suspense>
  )
}
