'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { MobileCommandCentreProps } from './props'
import { useMobileCommandModel as useBaseMobileCommandModel } from './useMobileCommandModel.base'
import { useDashboardSignalsRealtime } from '@/components/dashboard/useDashboardSignalsRealtime'
import { buildCommercialNextActions } from '@/lib/dashboard/buildCommercialActions'
import {
  buildCorridorPlanToolHref,
  buildLandedCostToolHref,
} from '@/components/dashboard/mobile-command/contracts'

const COMMAND_RETURN_PARAM_KEYS = [
  'page',
  'section',
  'marketView',
  'tool',
  'listing',
  'search',
  'cultivar',
] as const

/**
 * Canonical activation wrapper over the current-main Command Centre model.
 * The mobile Intel surface deliberately uses `props.signals` as its initial
 * source rather than `model.signals`, because the base model may substitute a
 * daily digest for the live feed. From first paint onward the existing realtime
 * hook owns one country-scoped, freshness-gated signal array.
 */
export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const model = useBaseMobileCommandModel(props)
  const searchParams = useSearchParams()
  const signalScope = model.currentCountry ? model.countryLabel : 'all'
  const { signals: effectiveSignals, status: signalsStatus } = useDashboardSignalsRealtime(
    props.signals,
    signalScope,
  )
  const countryParam = model.currentCountry ?? 'CA'

  const commandReturnTo = useMemo(() => {
    const params = new URLSearchParams()
    if (model.currentCountry) params.set('country', model.currentCountry)
    if (model.currentRole) params.set('role', model.currentRole)

    for (const key of COMMAND_RETURN_PARAM_KEYS) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }

    if (!params.has('page')) params.set('page', 'briefing')
    if (!params.has('section')) params.set('section', model.activeSection)
    return `/dashboard?${params.toString()}`
  }, [model.currentCountry, model.activeSection, model.currentRole, searchParams])

  const organizationActions = useMemo(() => {
    const organizationAction = model.nextActions.find(action => action.id === 'organization')
    if (!organizationAction) return model.nextActions

    const returnParam = encodeURIComponent(commandReturnTo)
    const onboarding = [
      {
        ...organizationAction,
        id: 'organization-create',
        label: 'Create an organization profile',
        detail: 'Create the operating entity used for marketplace submissions, evidence and reviewed introductions.',
        href: `/organization/new?country=${encodeURIComponent(model.currentCountry)}&returnTo=${returnParam}`,
      },
      {
        ...organizationAction,
        id: 'organization-join',
        label: 'Join an organization',
        detail: 'Use an invitation to connect an existing Harbourview organization to your operating context.',
        href: `/organization/join?returnTo=${returnParam}`,
      },
    ]

    return [
      ...onboarding,
      ...model.nextActions.filter(action => action.id !== 'organization'),
    ]
  }, [commandReturnTo, model.currentCountry, model.nextActions])

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

  const corridorActions = useMemo(() => {
    const origin = countryParam
    const destination = origin === 'DE' ? 'CA' : 'DE'
    return [
      {
        id: 'corridor-plan',
        label: 'Open corridor execution plan',
        detail: `Map GMP recognition, workstreams and failure modes for ${origin} → ${destination} (change pair in the tool).`,
        href: buildCorridorPlanToolHref({
          origin,
          destination,
          country: origin,
          role: model.currentRole ?? undefined,
          returnTo: commandReturnTo,
        }),
        tone: 'gold' as const,
      },
      {
        id: 'landed-cost',
        label: 'Run landed cost + sensitivity',
        detail: 'Orientation USD stack and freight/volume scenarios for the active corridor.',
        href: buildLandedCostToolHref({
          origin,
          destination,
          product: 'flower-premium',
          volume: '10',
          country: origin,
          role: model.currentRole ?? undefined,
          returnTo: commandReturnTo,
        }),
        tone: 'gold' as const,
      },
    ]
  }, [commandReturnTo, countryParam, model.currentRole])

  return {
    ...model,
    signals: effectiveSignals,
    signalsStatus,
    geneticsRecords,
    nextActions: [...corridorActions, ...organizationActions, ...commercialActions],
  }
}
