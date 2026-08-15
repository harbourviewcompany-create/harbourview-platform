'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { MobileCommandCentreProps } from './props'
import { useMobileCommandModel as useBaseMobileCommandModel } from './useMobileCommandModel.base'
import { buildCommercialNextActions } from '@/lib/dashboard/buildCommercialActions'

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
 * Preserves organization onboarding and Genetics behavior, adds the authenticated
 * safe signal-presentation refresh, then derives jurisdiction-matched commercial follow-ups.
 * Raw signal analysis/provenance JSON never crosses this client boundary.
 */
export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const model = useBaseMobileCommandModel(props)
  const searchParams = useSearchParams()
  const [enrichedSignals, setEnrichedSignals] = useState<MobileCommandCentreProps['signals'] | null>(null)

  useEffect(() => {
    setEnrichedSignals(null)
    if (model.commandDataState === 'empty') return

    const controller = new AbortController()
    const params = new URLSearchParams({ country: model.countryLabel, limit: '25' })

    void fetch(`/api/dashboard/signals?${params.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        if (!response.ok) return null
        const payload = await response.json() as { signals?: unknown }
        return Array.isArray(payload.signals) ? payload.signals as MobileCommandCentreProps['signals'] : null
      })
      .then(signals => {
        if (!controller.signal.aborted && signals && signals.length > 0) setEnrichedSignals(signals)
      })
      .catch(() => {
        // Preserve the SSR/session payload on network or auth refresh failure.
      })

    return () => controller.abort()
  }, [model.commandDataState, model.countryLabel])

  const effectiveSignals = enrichedSignals ?? model.signals

  const commandReturnTo = useMemo(() => {
    const params = new URLSearchParams()
    params.set('country', model.currentCountry)
    if (model.currentRole) params.set('role', model.currentRole)

    for (const key of COMMAND_RETURN_PARAM_KEYS) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }

    if (!params.has('page')) params.set('page', 'briefing')
    if (!params.has('section')) params.set('section', model.activeSection)
    return `/dashboard?${params.toString()}`
  }, [model.activeSection, model.currentCountry, model.currentRole, searchParams])

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

  return {
    ...model,
    signals: effectiveSignals,
    geneticsRecords,
    nextActions: [...organizationActions, ...commercialActions],
  }
}
