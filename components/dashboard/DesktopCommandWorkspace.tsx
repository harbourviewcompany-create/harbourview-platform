'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { MarketView } from './CommandCentre'
import {
  FinancingWorkspacePanel,
  MarketplaceWorkspacePanel,
} from './mobile-command/WorkspacePanels'
import type { MobileCommandTool } from './mobile-command/contracts'
import { CorridorPlanWorkspace } from './command-workspace/CorridorPlanWorkspace'
import { LandedCostWorkspace } from './command-workspace/LandedCostWorkspace'
import './DesktopCommandWorkspace.css'
import './command-workspace/CorridorWorkspace.css'

const MARKET_VIEWS = new Set<MarketView>([
  'cannabis',
  'equipment',
  'consumables',
  'new-products',
  'services',
  'opportunities',
  'wanted',
])
const WORKSPACE_TOOLS = new Set<MobileCommandTool>([
  'wanted-intake',
  'supply-intake',
  'introduction',
  'financing-intake',
  'corridor-plan',
  'landed-cost',
])

function parseTool(value: string | null): MobileCommandTool | null {
  return value && WORKSPACE_TOOLS.has(value as MobileCommandTool)
    ? value as MobileCommandTool
    : null
}

function parseMarketView(value: string | null): MarketView {
  return value && MARKET_VIEWS.has(value as MarketView)
    ? value as MarketView
    : 'cannabis'
}

export default function DesktopCommandWorkspace() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tool = parseTool(searchParams.get('tool'))
  const activeMarketView = parseMarketView(searchParams.get('marketView'))

  if (!tool) return null

  const replaceParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
  const close = () => replaceParams(params => {
    params.delete('tool')
    params.delete('listing')
  })
  const viewSubmissions = () => replaceParams(params => {
    params.set('page', 'marketplace')
    params.delete('tool')
    params.delete('listing')
  })

  return (
    <div className="desktop-command-workspace-layer" data-desktop-command-workspace={tool}>
      {tool === 'corridor-plan' ? (
        <CorridorPlanWorkspace onClose={close} />
      ) : tool === 'landed-cost' ? (
        <LandedCostWorkspace onClose={close} />
      ) : (
        <>
          <MarketplaceWorkspacePanel
            tool={tool}
            selectedListing={null}
            activeMarketView={activeMarketView}
            onClose={close}
            onViewSubmissions={viewSubmissions}
          />
          <FinancingWorkspacePanel open={tool === 'financing-intake'} onClose={close} />
        </>
      )}
    </div>
  )
}
