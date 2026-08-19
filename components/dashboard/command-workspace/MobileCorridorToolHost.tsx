'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseMobileCommandTool } from '@/components/dashboard/mobile-command/contracts'
import { CorridorPlanWorkspace } from './CorridorPlanWorkspace'
import { LandedCostWorkspace } from './LandedCostWorkspace'
import './CorridorWorkspace.css'

/**
 * Mobile Command Centre does not mount DesktopCommandWorkspace.
 * This host reads the same ?tool= URL contract and opens corridor tools full-screen.
 */
export function MobileCorridorToolHost() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tool = parseMobileCommandTool(searchParams.get('tool'))

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tool')
    params.delete('listing')
    const q = params.toString()
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  if (tool !== 'corridor-plan' && tool !== 'landed-cost') return null

  return (
    <div className="hvm-corridor-tool-layer" role="presentation" data-mobile-corridor-tool={tool}>
      {tool === 'corridor-plan' ? (
        <CorridorPlanWorkspace onClose={close} />
      ) : (
        <LandedCostWorkspace onClose={close} />
      )}
    </div>
  )
}
