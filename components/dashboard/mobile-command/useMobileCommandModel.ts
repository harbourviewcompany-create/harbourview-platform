'use client'

import { useMemo } from 'react'
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
 * Keeps the already-merged #1358/#1359 session intelligence/action behavior intact,
 * then adds deterministic jurisdiction-matched commercial follow-ups.
 */
export function useMobileCommandModel(props: MobileCommandCentreProps) {
  const model = useBaseMobileCommandModel(props)
  const searchParams = useSearchParams()

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
    const returnParam = encodeURIComponent(commandReturnTo)
    return model.nextActions.flatMap(action => {
      if (action.id !== 'organization') return [action]
      return [
        {
          ...action,
          id: 'organization-create',
          label: 'Create an organization profile',
          detail: 'Create the operating entity used for marketplace submissions, evidence and reviewed introductions.',
          href: `/organization/new?country=${encodeURIComponent(model.currentCountry)}&returnTo=${returnParam}`,
        },
        {
          ...action,
          id: 'organization-join',
          label: 'Join an organization',
          detail: 'Use an invitation to connect an existing Harbourview organization to your operating context.',
          href: `/organization/join?returnTo=${returnParam}`,
        },
      ]
    })
  }, [commandReturnTo, model.currentCountry, model.nextActions])

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

  return {
    ...model,
    nextActions: [...organizationActions, ...commercialActions],
  }
}
