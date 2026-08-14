'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MobileCommandCentreProps } from './props'
import { useMobileCommandModel as useBaseMobileCommandModel } from './useMobileCommandModel.base'
import { buildCommercialNextActions } from '@/lib/dashboard/buildCommercialActions'

/**
 * Canonical activation wrapper over the current-main Command Centre model.
 * Keeps the already-merged #1358/#1359 session intelligence/action behavior intact,
 * then adds deterministic jurisdiction-matched commercial follow-ups.
 *
 * Authenticated signal presentation is refreshed through the dedicated dashboard
 * DTO route after hydration. That route owns the explicit safe allowlist for
 * source, verification, commercial, counterparty, facility, licence/product and
 * market-access metadata, so raw `signals.analysis` never crosses this client
 * boundary.
 */
export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const model = useBaseMobileCommandModel(props)
  const [enrichedSignals, setEnrichedSignals] = useState<MobileCommandCentreProps['signals'] | null>(null)

  useEffect(() => {
    setEnrichedSignals(null)

    // An empty Command state is an explicit whole-surface contract: the SSR
    // payload intentionally contains no loaded records. Rehydrating only the
    // signal feed here would make the root remain `empty` while intelligence
    // silently becomes populated, and it breaks the isolated empty-state proof.
    // Loaded/stale/error states keep the authenticated safe-DTO refresh below.
    if (model.commandDataState === 'empty') return

    const controller = new AbortController()
    const params = new URLSearchParams({
      country: model.countryLabel,
      limit: '25',
    })

    void fetch(`/api/dashboard/signals?${params.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        if (!response.ok) return null
        const payload = await response.json() as { signals?: unknown }
        return Array.isArray(payload.signals)
          ? payload.signals as MobileCommandCentreProps['signals']
          : null
      })
      .then(signals => {
        if (!controller.signal.aborted && signals && signals.length > 0) {
          setEnrichedSignals(signals)
        }
      })
      .catch(() => {
        // Preserve the SSR/session payload on network or auth refresh failure.
      })

    return () => controller.abort()
  }, [model.commandDataState, model.countryLabel])

  const effectiveSignals = enrichedSignals ?? model.signals

  const commercialActions = useMemo(() => buildCommercialNextActions(
    effectiveSignals.map(signal => ({
      id: signal.id,
      title: signal.title,
      market: signal.market,
      commercialImpact: signal.commercialImpact,
      analysis: signal.analysis,
    })),
    model.marketRows.map(row => ({
      id: row.id,
      title: row.title,
      jurisdiction: row.jurisdiction,
      category: row.category,
      view: row.view,
      summary: row.summary,
    })),
    model.countryLabel,
    model.commandHref,
    { limit: 4, roleId: model.currentRole },
  ), [effectiveSignals, model.commandHref, model.countryLabel, model.currentRole, model.marketRows])

  return {
    ...model,
    signals: effectiveSignals,
    nextActions: [...model.nextActions, ...commercialActions],
  }
}