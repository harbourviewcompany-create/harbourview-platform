import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveWorkspace } from '@/lib/hv/active-workspace'
import {
  getCannabisOperators,
  getComparisonCountryScores,
  getCountryIntelProfile,
  getEvidenceData,
  getJurisdictionEvidenceStatus,
  getMarketMetrics,
  getProfessionals,
  getPublicPathwayTemplate,
  getSourceCoverage,
  getTradeFlows,
  type PathwayData,
} from '@/lib/dashboard/dashboardLiveData'
import {
  aggregateDependencyState,
  humanizeJurisdictionStatus,
  normalizeJurisdictionAccessState,
  requirementStatusToDependencyState,
  type JurisdictionAccessLane,
  type JurisdictionActivity,
  type JurisdictionCommandDTO,
  type JurisdictionDependencyState,
  type JurisdictionPathwayStepDTO,
} from '@/lib/dashboard/jurisdictionCommandContract'

const ACTIVITIES = new Set<JurisdictionActivity>(['market-entry', 'import', 'export', 'medical', 'adult-use'])
const COUNTRY_RE = /^[A-Z]{2}$/
const ROLE_RE = /^[a-z0-9_-]{1,64}$/i

function safeParam(value: string | null, max = 80): string | null {
  const normalized = value?.trim().replace(/[<>]/g, '').slice(0, max) ?? ''
  return normalized || null
}

function isStale(date: string | null | undefined, days = 120): boolean {
  if (!date) return true
  const parsed = Date.parse(date)
  if (!Number.isFinite(parsed)) return true
  return Date.now() - parsed > days * 24 * 60 * 60 * 1000
}

function fieldLabel(field: string): string {
  return field
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function changeKind(field: string): 'regulatory' | 'commercial' | 'access' | 'other' {
  const normalized = field.toLowerCase()
  if (/import|export|access|medical|adult|licen[cs]e|permit/.test(normalized)) return 'access'
  if (/market|price|sales|opportunity|trade/.test(normalized)) return 'commercial'
  if (/regulat|law|policy|framework|status/.test(normalized)) return 'regulatory'
  return 'other'
}

function buildAccessLanes(intel: Awaited<ReturnType<typeof getCountryIntelProfile>>): JurisdictionAccessLane[] {
  const lane = (
    id: JurisdictionActivity,
    label: string,
    rawStatus: string | null | undefined,
    detail: string,
  ): JurisdictionAccessLane => ({
    id,
    label,
    rawStatus: rawStatus ?? null,
    state: normalizeJurisdictionAccessState(rawStatus),
    detail,
  })

  return [
    lane('market-entry', 'Market access', intel?.market_access_status, 'Country-level market-access posture. Open a scoped route before relying on it for a transaction.'),
    lane('import', 'Import', intel?.import_status, 'Country-level import posture. Product, counterparty market and permit evidence refine this state when trade-flow records exist.'),
    lane('export', 'Export', intel?.export_status, 'Country-level export posture. Destination, product and permit evidence refine this state when trade-flow records exist.'),
    lane('medical', 'Medical', intel?.medical_status, 'Medical framework status at the jurisdiction level.'),
    lane('adult-use', 'Adult use', intel?.adult_use_status, 'Adult-use framework status at the jurisdiction level.'),
  ]
}

function buildPathwaySteps(
  pathway: PathwayData,
  statusMap: Map<string, string>,
): JurisdictionPathwayStepDTO[] {
  const requirementsByStep = new Map<string, PathwayData['requirements']>()
  for (const requirement of pathway.requirements) {
    const list = requirementsByStep.get(requirement.step_id) ?? []
    list.push(requirement)
    requirementsByStep.set(requirement.step_id, list)
  }

  return pathway.steps.map(step => {
    const requirements = (requirementsByStep.get(step.id) ?? []).map(requirement => {
      const rawStatus = statusMap.get(requirement.id) ?? null
      const state = requirementStatusToDependencyState(rawStatus, requirement.is_required)
      return {
        id: requirement.id,
        title: requirement.title,
        description: requirement.description,
        evidenceType: requirement.evidence_type || null,
        required: requirement.is_required,
        state,
        statusLabel: rawStatus ? humanizeJurisdictionStatus(rawStatus) : 'Not assessed',
      }
    })

    const states = requirements.map(item => item.state)
    const stepState: JurisdictionDependencyState = states.length > 0
      ? aggregateDependencyState(states)
      : 'unknown'

    return {
      id: step.id,
      number: step.step_number,
      title: step.title,
      description: step.description,
      state: stepState,
      requirements,
    }
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawCountry = (searchParams.get('country') ?? '').trim().toUpperCase()
  const countryIso2 = rawCountry.includes('-') ? rawCountry.split('-')[0] : rawCountry
  const roleId = safeParam(searchParams.get('role'), 64)
  const rawActivity = (searchParams.get('activity') ?? 'market-entry') as JurisdictionActivity
  const activity: JurisdictionActivity = ACTIVITIES.has(rawActivity) ? rawActivity : 'market-entry'
  const counterpartyMarket = safeParam(searchParams.get('market'), 12)?.toUpperCase() ?? null
  const product = safeParam(searchParams.get('product'), 100)

  if (!COUNTRY_RE.test(countryIso2)) {
    return NextResponse.json({ error: 'A valid ISO2 country is required.' }, { status: 400 })
  }
  if (roleId && !ROLE_RE.test(roleId)) {
    return NextResponse.json({ error: 'Invalid role context.' }, { status: 400 })
  }

  try {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const [
      intel,
      metrics,
      tradeFlows,
      professionals,
      operators,
      evidenceData,
      evidenceStatus,
      sourceCoverage,
      comparisons,
      publicPathway,
    ] = await Promise.all([
      getCountryIntelProfile(countryIso2),
      getMarketMetrics(countryIso2),
      getTradeFlows(countryIso2),
      getProfessionals(countryIso2),
      getCannabisOperators(countryIso2),
      getEvidenceData(null, countryIso2),
      getJurisdictionEvidenceStatus(countryIso2),
      getSourceCoverage(countryIso2),
      getComparisonCountryScores(countryIso2, 6),
      roleId ? getPublicPathwayTemplate(countryIso2, roleId) : Promise.resolve<PathwayData>({ template: null, steps: [], requirements: [], progress: null, requirementStatuses: [] }),
    ])

    let workspaceId: string | null = null
    let workspaceState: 'personal' | 'active' | 'stale' = 'personal'
    let workspaceClient: Awaited<ReturnType<typeof resolveActiveWorkspace>>['supabase'] | null = null
    try {
      const active = await resolveActiveWorkspace(user.id)
      workspaceClient = active.supabase
      workspaceId = active.workspaceId
      workspaceState = active.stale ? 'stale' : active.workspaceId ? 'active' : 'personal'
    } catch {
      workspaceState = 'stale'
    }

    let availableRoleIds: string[] = []
    if (workspaceClient) {
      const { data: roleTemplates } = await workspaceClient
        .from('cc_pathway_templates')
        .select('role_id')
        .eq('country_iso2', countryIso2)
        .limit(100)
      availableRoleIds = Array.from(new Set((roleTemplates ?? []).map(row => row.role_id).filter(Boolean))).sort()
    }

    const requirementStatusMap = new Map<string, string>()
    let progressStatus: string | null = null
    const templateId = publicPathway.template?.id ?? null
    const isGenericPathway = Boolean(templateId?.startsWith('generic-'))

    if (workspaceClient && workspaceId && templateId && !isGenericPathway) {
      const requirementIds = publicPathway.requirements.map(requirement => requirement.id)
      const [progressRes, requirementsRes] = await Promise.all([
        workspaceClient
          .from('cc_org_pathway_progress')
          .select('status')
          .eq('org_id', workspaceId)
          .eq('template_id', templateId)
          .maybeSingle(),
        requirementIds.length > 0
          ? workspaceClient
              .from('cc_org_requirement_status')
              .select('requirement_id,status')
              .eq('org_id', workspaceId)
              .in('requirement_id', requirementIds)
          : Promise.resolve({ data: [] as Array<{ requirement_id: string; status: string }> }),
      ])
      progressStatus = progressRes.data?.status ?? null
      for (const row of requirementsRes.data ?? []) requirementStatusMap.set(row.requirement_id, row.status)
    }

    const lanes = buildAccessLanes(intel)
    const activeLane = lanes.find(lane => lane.id === activity) ?? lanes[0]
    const scopedFlows = tradeFlows.filter(flow => {
      if (activity === 'import') return flow.destination_iso2 === countryIso2
      if (activity === 'export') return flow.origin_iso2 === countryIso2
      return flow.origin_iso2 === countryIso2 || flow.destination_iso2 === countryIso2
    })

    const counterpartMarkets = Array.from(new Set(scopedFlows.map(flow =>
      flow.origin_iso2 === countryIso2 ? flow.destination_iso2 : flow.origin_iso2,
    ).filter(Boolean))).sort()
    const products = Array.from(new Set(scopedFlows.map(flow => flow.product_category).filter((value): value is string => Boolean(value)))).sort()

    const matchedFlow = scopedFlows.find(flow => {
      const counterpart = flow.origin_iso2 === countryIso2 ? flow.destination_iso2 : flow.origin_iso2
      const marketMatches = !counterpartyMarket || counterpart === counterpartyMarket
      const productMatches = !product || (flow.product_category ?? '').localeCompare(product, undefined, { sensitivity: 'base' }) === 0
      return marketMatches && productMatches
    }) ?? null

    const scopedRequested = Boolean((activity === 'import' || activity === 'export') && (counterpartyMarket || product))
    let routeState = activeLane.state
    let routeCoverage: JurisdictionCommandDTO['access']['route']['coverage'] = 'jurisdiction-baseline'
    let routeDetail = activeLane.detail
    let permitRequired: boolean | null = null
    let permitAuthority: string | null = null

    if (scopedRequested && matchedFlow) {
      routeState = normalizeJurisdictionAccessState(matchedFlow.legal_status)
      if (matchedFlow.permit_required && routeState === 'available') routeState = 'conditional'
      routeCoverage = 'trade-flow-match'
      permitRequired = matchedFlow.permit_required
      permitAuthority = matchedFlow.permit_authority
      routeDetail = [
        matchedFlow.product_category || 'Reviewed trade-flow record',
        `${matchedFlow.origin_iso2} → ${matchedFlow.destination_iso2}`,
        matchedFlow.legal_status ? humanizeJurisdictionStatus(matchedFlow.legal_status) : 'Legal status under review',
        matchedFlow.permit_required === true ? 'Permit required' : matchedFlow.permit_required === false ? 'No permit flag on this record' : 'Permit requirement not recorded',
      ].join(' · ')
    } else if (scopedRequested) {
      routeState = 'unknown'
      routeCoverage = 'unsupported'
      routeDetail = 'No reviewed trade-flow record matches this product and counterparty-market combination. Harbourview will not infer a transaction route from the country-level status.'
    }

    const recentChanges = (intel?.recentChanges ?? []).slice(0, 8).map(change => ({
      id: change.id,
      title: fieldLabel(change.field_name),
      detail: `${change.old_value ? humanizeJurisdictionStatus(change.old_value) : 'Not recorded'} → ${change.new_value ? humanizeJurisdictionStatus(change.new_value) : 'Not recorded'}`,
      changedAt: change.changed_at,
      sourceLabel: change.source_label,
      kind: changeKind(change.field_name),
    }))

    const latestSourceCheck = evidenceData.sources
      .map(source => source.last_checked)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null
    const lastVerifiedAt = evidenceStatus.lastVerifiedAt ?? intel?.briefing_last_reviewed ?? latestSourceCheck
    const gaps: string[] = []
    if (!intel) gaps.push('Country intelligence profile is unavailable.')
    if (!evidenceStatus.verified) gaps.push('No published jurisdiction playbook is currently verified.')
    if (evidenceData.sources.length === 0) gaps.push('No active evidence sources are registered for this jurisdiction.')
    if (!roleId) gaps.push('Role-specific pathway dependencies are not selected; country baseline remains available.')
    if (roleId && publicPathway.steps.length === 0) gaps.push('No role pathway is available for the selected role.')
    if (isGenericPathway) gaps.push('The selected role is using a generic pathway rather than a curated jurisdiction-specific template.')

    const dataState = gaps.some(gap => /unavailable|No active evidence|No role pathway/.test(gap))
      ? 'incomplete'
      : isStale(lastVerifiedAt)
        ? 'stale'
        : 'loaded'

    const officialSourceCount = sourceCoverage
      .filter(row => row.tier === 1)
      .reduce((sum, row) => sum + row.count, 0)

    const pathwayState: JurisdictionCommandDTO['pathway']['state'] = !roleId
      ? 'role-required'
      : publicPathway.steps.length === 0
        ? 'unavailable'
        : isGenericPathway
          ? 'generic'
          : 'curated'

    const verifiedOperators = operators
      .filter(operator => (operator.verification_status ?? '').toLowerCase() === 'verified')
      .slice(0, 8)
      .map(operator => ({
        id: operator.id,
        kind: 'operator' as const,
        name: operator.legal_name,
        detail: operator.operator_type || 'Verified cannabis operator',
        verificationStatus: 'verified' as const,
      }))
    const verifiedProfessionals = professionals.slice(0, 6).map(professional => ({
      id: professional.id,
      kind: 'professional' as const,
      name: professional.full_name,
      detail: [professional.title, professional.institution, professional.specialties.slice(0, 2).join(', ')].filter(Boolean).join(' · ') || 'Verified professional',
      verificationStatus: 'verified' as const,
    }))

    const dto: JurisdictionCommandDTO = {
      country: {
        iso2: countryIso2,
        name: intel?.country_name ?? countryIso2,
        region: intel?.region ?? null,
        regulator: intel?.regulator_label ?? intel?.briefing_regulatory_body ?? null,
        reviewStatus: intel?.review_status ?? 'pending',
        lastReviewedAt: intel?.briefing_last_reviewed ?? null,
        publicSummary: intel?.public_summary ?? null,
        regulatoryOutlook: intel?.briefing_regulatory_outlook ?? null,
        marketDynamics: intel?.briefing_market_dynamics ?? null,
      },
      operatingContext: {
        roleId,
        workspaceId,
        workspaceState,
      },
      dataQuality: {
        state: dataState,
        lastVerifiedAt,
        evidenceVerified: evidenceStatus.verified,
        evidenceLabel: evidenceStatus.confidenceLabel,
        registeredSourceCount: evidenceData.sources.length,
        officialSourceCount,
        conflictAssessment: 'not-modeled',
        gaps,
      },
      access: {
        lanes,
        route: {
          activity,
          counterpartyMarket,
          product,
          state: routeState,
          coverage: routeCoverage,
          detail: routeDetail,
          permitRequired,
          permitAuthority,
        },
        routeOptions: { counterpartMarkets, products },
      },
      pathway: {
        state: pathwayState,
        name: publicPathway.template?.name ?? null,
        roleId,
        availableRoleIds,
        progressStatus,
        steps: buildPathwaySteps(publicPathway, requirementStatusMap),
      },
      changes: recentChanges,
      calendar: (intel?.calendarEvents ?? []).slice(0, 6).map(event => ({
        id: event.id,
        title: event.title,
        summary: event.summary,
        expectedDate: event.expected_date,
        confidence: event.confidence,
        status: event.status,
        sourceLabel: event.source_label,
        sourceUrl: event.source_url,
      })),
      evidenceSources: evidenceData.sources.slice(0, 12).map(source => ({
        id: source.id,
        name: source.name,
        category: source.category,
        reliability: source.reliability,
        lastChecked: source.last_checked,
      })),
      marketMetrics: metrics.slice(0, 8).map(metric => ({
        name: metric.metric_name,
        value: metric.metric_value,
        unit: metric.metric_unit,
        period: metric.period_label,
        dataType: metric.data_type,
        sourceName: metric.source_name,
      })),
      tradeFlows: tradeFlows.slice(0, 12).map(flow => ({
        originIso2: flow.origin_iso2,
        destinationIso2: flow.destination_iso2,
        productCategory: flow.product_category,
        legalStatus: flow.legal_status,
        permitRequired: flow.permit_required,
        permitAuthority: flow.permit_authority,
      })),
      counterparties: [...verifiedOperators, ...verifiedProfessionals].slice(0, 12),
      comparisons: comparisons.map(item => ({
        iso2: item.iso2,
        name: item.name,
        opportunityScore: item.opportunity_score,
        marketAccessStatus: item.market_access_status,
        dataCompleteness: item.data_completeness,
      })),
    }

    return NextResponse.json(dto, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=30' },
    })
  } catch (error) {
    console.error('[/api/dashboard/jurisdiction-command] unexpected error', error)
    return NextResponse.json({ error: 'Jurisdiction command data is temporarily unavailable.' }, { status: 500 })
  }
}
