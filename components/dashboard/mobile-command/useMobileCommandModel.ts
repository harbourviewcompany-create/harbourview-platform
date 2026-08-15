'use client'

import { useMemo } from 'react'
import type { MobileCommandCentreProps } from './props'
import { useMobileCommandModel as useBaseMobileCommandModel } from './useMobileCommandModel.base'
import { buildCommercialNextActions } from '@/lib/dashboard/buildCommercialActions'

/**
 * Canonical activation wrapper over the current-main Command Centre model.
 * Keeps the already-merged #1358/#1359 session intelligence/action behavior intact,
 * then adds deterministic jurisdiction-matched commercial follow-ups.
 */
export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const model = useBaseMobileCommandModel(props)

  const commercialActions = useMemo(() => buildCommercialNextActions(
    model.signals.map(signal => ({
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
  ), [model.commandHref, model.countryLabel, model.currentRole, model.marketRows, model.signals])

  const geneticsRecords = useMemo(() => Object.assign(
    (props.cultivarPassports ?? []).map(passport => ({
      ...passport,
      kind: 'Cultivar passport',
      title: passport.displayName,
      subtitle: passport.publicSummary,
      status: passport.claimStatus,
    })),
    {
      serviceProviders: props.serviceProviders ?? [],
      collaborationProjects: props.collaborationProjects ?? [],
      sourceMeta: props.geneticsSourceMeta,
    },
  ), [props.collaborationProjects, props.cultivarPassports, props.geneticsSourceMeta, props.serviceProviders])

  return {
    ...model,
    geneticsRecords,
    nextActions: [...model.nextActions, ...commercialActions],
  }
}
