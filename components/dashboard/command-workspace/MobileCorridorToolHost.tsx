'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  buildCorridorPlanToolHref,
  buildLandedCostToolHref,
  parseMobileCommandTool,
} from '@/components/dashboard/mobile-command/contracts'

/**
 * Legacy bridge: Command Centre used to open corridor tools via `?tool=` on
 * `/dashboard`. Phase 2 owns dedicated routes under `/dashboard/tools/*` with
 * permanent chrome. This host only redirects so old bookmarks and action hrefs
 * still work until fully retired.
 */
export function MobileCorridorToolHost() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tool = parseMobileCommandTool(searchParams.get('tool'))

  useEffect(() => {
    if (tool !== 'corridor-plan' && tool !== 'landed-cost') return

    const origin = searchParams.get('origin') ?? 'CA'
    const destination = searchParams.get('destination') ?? 'DE'
    const product = searchParams.get('product') ?? undefined
    const volume = searchParams.get('volume') ?? undefined
    const country = searchParams.get('country') ?? undefined
    const role = searchParams.get('role') ?? undefined

    const returnParams = new URLSearchParams(searchParams.toString())
    returnParams.delete('tool')
    returnParams.delete('listing')
    const returnTo = `/dashboard?${returnParams.toString()}`

    const href =
      tool === 'corridor-plan'
        ? buildCorridorPlanToolHref({ origin, destination, product, country, role, returnTo })
        : buildLandedCostToolHref({
            origin,
            destination,
            product: product ?? 'flower-premium',
            volume,
            country,
            role,
            returnTo,
          })

    router.replace(href)
  }, [router, searchParams, tool])

  return null
}
