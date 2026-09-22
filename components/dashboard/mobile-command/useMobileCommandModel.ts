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
  type NextAction,
} from '@/components/dashboard/mobile-command/contracts'
import { getRoleCommandDefault } from '@/lib/dashboard/roleCommandDefaults'
import type { CommandPage } from '@/components/dashboard/CommandCentre'


/** Lower score = higher priority. Role pages boost matching action hrefs/ids. */
function roleActionScore(action: NextAction, priorities: readonly CommandPage[]): number {
  const href = (action.href ?? '').toLowerCase()
  const id = (action.id ?? '').toLowerCase()
  const label = (action.label ?? '').toLowerCase()
  const hay = `${href} ${id} ${label}`

  const pageHints: Record<string, string[]> = {
    marketplace: ['marketplace', 'listing', 'wanted', 'commercial', 'deal'],
    signals: ['signal', 'weekly-signals', 'intelligence'],
    regulatory: ['regulatory', 'watch', 'signal'],
    clinical: ['clinical', 'formulary', 'physician'],
    compliance: ['compliance', 'licence', 'gmp'],
    licences: ['licence', 'license', 'permit'],
    genetics: ['genetics', 'cultivar'],
    evidence: ['evidence', 'review-gate', 'coa'],
    education: ['education', 'module', 'track'],
    'access-pathway': ['pathway', 'jurisdiction', 'access'],
    'trade-calc': ['landed', 'trade-calc', 'corridor'],
    logistics: ['logistics', 'corridor', 'freight'],
    prices: ['price', 'market-intelligence'],
    kyb: ['kyb', 'organization', 'verify'],
    banking: ['banking', 'financ'],
    countries: ['countr', 'jurisdiction'],
    briefing: ['briefing', 'overview', 'digest'],
  }

  for (let i = 0; i < priorities.length; i++) {
    const page = priorities[i]
    const hints = pageHints[page] ?? [page]
    if (hints.some((h) => hay.includes(h))) return i
  }
  // Role prompt and org setup trail operational work unless nothing else matches
  if (id.includes('choose-role')) return 80
  if (id.includes('organization')) return 90
  if ((action as { kind?: string }).kind === 'tool') return 70
  return 40
}

function orderActionsForRole(actions: NextAction[], roleShort: string | null | undefined): NextAction[] {
  const { priorities } = getRoleCommandDefault(roleShort)
  return [...actions].sort((a, b) => roleActionScore(a, priorities) - roleActionScore(b, priorities))
}

const SIGNALS_LIVE_SURFACES = new Set([
  'overview',
  'market-intelligence',
  'weekly-signals',
  'personal-briefing',
  'search',
  'regulatory',
])

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
  const signalsLiveSurface = SIGNALS_LIVE_SURFACES.has(model.activeSection)
  const { signals: effectiveSignals, status: signalsStatus } = useDashboardSignalsRealtime(
    props.signals,
    signalScope,
    { enabled: signalsLiveSurface },
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

  // Operational next-actions first; at most one org onboarding CTA, appended last.
  // Previously create+join monopolized the two priority slots on overview.
  const organizationActions = useMemo(() => {
    const organizationAction = model.nextActions.find(action => action.id === 'organization')
    const operational = model.nextActions.filter(action => action.id !== 'organization')
    if (!organizationAction) return operational

    const returnParam = encodeURIComponent(commandReturnTo)
    const onboarding = {
      ...organizationAction,
      id: 'organization-create',
      label: 'Create an organization profile',
      detail: 'Required for marketplace submissions and reviewed introductions. Join via invitation from org settings if you already have one.',
      href: `/organization/new?country=${encodeURIComponent(countryParam)}&returnTo=${returnParam}`,
      tone: 'warn' as const,
    }

    return [...operational, onboarding]
  }, [commandReturnTo, countryParam, model.nextActions])

  /** High-confidence signals become priority rows so Command is not org-setup-only. */
  const signalPriorityActions = useMemo<NextAction[]>(() => {
    const ranked = [...effectiveSignals]
      .filter(s => typeof s.confidence === 'number' ? s.confidence >= 70 : true)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 3)

    return ranked.map((s, index) => {
      const conf = typeof s.confidence === 'number' ? s.confidence : 0
      const when = s.timeAgo || s.sourceLabel || ''
      const impact = (typeof s.commercialImpact === 'string' && s.commercialImpact.trim())
        || 'Open intelligence for reviewed context.'
      return {
        id: `signal-priority-${s.id || index}`,
        label: (s.title || 'Material intelligence update').slice(0, 96),
        detail: [s.market, when, impact].filter(Boolean).join(' · ').slice(0, 160),
        href: model.commandHref('weekly-signals'),
        tone: (conf >= 85 ? 'warn' : 'gold') as 'warn' | 'gold',
      }
    })
  }, [effectiveSignals, model.commandHref])

  const rolePromptActions = useMemo<NextAction[]>(() => {
    if (model.currentRole) return []
    return [{
      id: 'choose-role',
      label: 'Choose your operating role',
      detail: 'Role focuses priority actions (marketplace, clinical, compliance) for this jurisdiction.',
      href: model.commandHref('overview'),
      tone: 'gold' as const,
    }]
  }, [model])

  const commercialActions = useMemo<NextAction[]>(() => buildCommercialNextActions(
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

  const corridorActions = useMemo<NextAction[]>(() => {
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
        kind: 'tool' as const,
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
        kind: 'tool' as const,
      },
    ]
  }, [commandReturnTo, countryParam, model.currentRole])

  const roleDefault = getRoleCommandDefault(model.roleShort ?? model.currentRole)

  const unorderedNextActions = [
    ...corridorActions,
    ...rolePromptActions,
    ...signalPriorityActions,
    ...commercialActions,
    ...organizationActions,
  ]

  // Role-ordered priority so Importer/Compliance/Clinical see relevant work first.
  const nextActions = orderActionsForRole(unorderedNextActions, model.roleShort ?? model.currentRole)

  return {
    ...model,
    signals: effectiveSignals,
    signalsStatus,
    geneticsRecords,
    roleFocus: roleDefault.focus,
    nextActions,
  }
}
