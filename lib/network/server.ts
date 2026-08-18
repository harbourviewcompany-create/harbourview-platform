import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  getCannabisOperators,
  getProfessionals,
  type CannabisOperator,
  type HvProfessional,
} from '@/lib/dashboard/dashboardLiveData'
import { getOperatorLicenceMatrix, type OperatorLicenceMatrix } from '@/lib/intelligence/operatorIntelligence'
import { getPublicCollaborationProjects, getPublicServiceProviders } from '@/lib/genetics/queries'
import { attachNetworkFit, sortNetworkCandidates } from './commandMatching'
import type {
  NetworkActivityDTO,
  NetworkCandidateDTO,
  NetworkCommandDTO,
  NetworkInteractionRecord,
  NetworkIntroductionRecord,
  NetworkMissionDTO,
  NetworkRequirementDTO,
  NetworkSourceCandidate,
  NetworkWatchRecord,
} from './types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type ServiceProvider = Awaited<ReturnType<typeof getPublicServiceProviders>>[number]
type CollaborationProject = Awaited<ReturnType<typeof getPublicCollaborationProjects>>[number]

type NetworkContext = {
  supabase: SupabaseClient
  userId: string
  workspaceId: string | null
  countryIso2: string | null
  roleId: string | null
}

function upperIso2(value: string | null | undefined): string | null {
  const candidate = value?.trim().toUpperCase() ?? ''
  return /^[A-Z]{2}$/.test(candidate) ? candidate : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map(value => value?.trim()).filter((value): value is string => Boolean(value)))]
}

export async function resolveActiveNetworkContext(input?: {
  countryIso2?: string | null
  roleId?: string | null
}): Promise<NetworkContext | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: preferences } = await supabase
    .from('user_dashboard_preferences')
    .select('country_iso2,role_id,active_workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const preferredWorkspaceId = typeof preferences?.active_workspace_id === 'string'
    ? preferences.active_workspace_id
    : null

  let workspaceId: string | null = null
  if (preferredWorkspaceId) {
    const [{ data: membership }, { data: workspace }] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', preferredWorkspaceId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('workspaces')
        .select('id,status')
        .eq('id', preferredWorkspaceId)
        .eq('status', 'active')
        .maybeSingle(),
    ])
    if (membership && workspace) workspaceId = preferredWorkspaceId
  }

  return {
    supabase,
    userId: user.id,
    workspaceId,
    countryIso2: upperIso2(input?.countryIso2) ?? upperIso2(preferences?.country_iso2),
    roleId: input?.roleId?.trim() || preferences?.role_id || null,
  }
}

function mapRequirement(row: {
  id: string
  requirement_type: string
  label: string
  description: string | null
  hard_requirement: boolean
  capability_code: string | null
  licence_activity: string | null
  country_iso2: string | null
  expected_value: unknown
  status: string
  sort_order: number
}): NetworkRequirementDTO {
  return {
    id: row.id,
    requirementType: row.requirement_type,
    label: row.label,
    description: row.description,
    hardRequirement: row.hard_requirement,
    capabilityCode: row.capability_code,
    licenceActivity: row.licence_activity,
    countryIso2: row.country_iso2,
    expectedValue: asRecord(row.expected_value),
    status: row.status,
    sortOrder: row.sort_order,
  }
}

async function loadWorkspaceState(context: NetworkContext): Promise<{
  missions: NetworkMissionDTO[]
  interactions: NetworkInteractionRecord[]
  introductions: NetworkIntroductionRecord[]
  watches: NetworkWatchRecord[]
  activity: NetworkActivityDTO[]
  warnings: string[]
}> {
  if (!context.workspaceId) {
    return { missions: [], interactions: [], introductions: [], watches: [], activity: [], warnings: [] }
  }

  const warnings: string[] = []
  const { supabase, workspaceId } = context
  const [missionResult, interactionResult, introductionResult, watchResult] = await Promise.all([
    supabase
      .from('network_missions')
      .select('id,name,objective,status,country_iso2,target_country_iso2s,target_date,confidentiality,created_at,updated_at')
      .eq('workspace_id', workspaceId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('network_interactions')
      .select('id,entity_id,source_kind,source_id,occurred_at,summary,outcome')
      .eq('workspace_id', workspaceId)
      .order('occurred_at', { ascending: false })
      .limit(200),
    supabase
      .from('network_introductions')
      .select('id,target_entity_id,target_source_kind,target_source_id,status,updated_at')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('cc_watchlist_items')
      .select('id,ref_id,watch_status')
      .eq('org_id', workspaceId)
      .eq('watch_status', 'active')
      .limit(500),
  ])

  if (missionResult.error) warnings.push('Mission state is temporarily unavailable.')
  if (interactionResult.error) warnings.push('Relationship history is temporarily unavailable.')
  if (introductionResult.error) warnings.push('Introduction state is temporarily unavailable.')
  if (watchResult.error) warnings.push('Watch state is temporarily unavailable.')

  const missionRows = missionResult.data ?? []
  const missionIds = missionRows.map(row => row.id)
  let requirementRows: Array<{
    id: string
    mission_id: string
    requirement_type: string
    label: string
    description: string | null
    hard_requirement: boolean
    capability_code: string | null
    licence_activity: string | null
    country_iso2: string | null
    expected_value: unknown
    status: string
    sort_order: number
  }> = []

  if (missionIds.length > 0) {
    const result = await supabase
      .from('network_mission_requirements')
      .select('id,mission_id,requirement_type,label,description,hard_requirement,capability_code,licence_activity,country_iso2,expected_value,status,sort_order')
      .in('mission_id', missionIds)
      .neq('status', 'archived')
      .order('sort_order', { ascending: true })
    if (result.error) warnings.push('Mission requirements are temporarily unavailable.')
    else requirementRows = result.data ?? []
  }

  const requirementsByMission = new Map<string, NetworkRequirementDTO[]>()
  for (const row of requirementRows) {
    const list = requirementsByMission.get(row.mission_id) ?? []
    list.push(mapRequirement(row))
    requirementsByMission.set(row.mission_id, list)
  }

  const missions: NetworkMissionDTO[] = missionRows.map(row => ({
    id: row.id,
    name: row.name,
    objective: row.objective,
    status: row.status,
    countryIso2: row.country_iso2,
    targetCountryIso2s: Array.isArray(row.target_country_iso2s) ? row.target_country_iso2s : [],
    targetDate: row.target_date,
    confidentiality: row.confidentiality === 'restricted' ? 'restricted' : 'workspace',
    requirements: requirementsByMission.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  const interactions: NetworkInteractionRecord[] = (interactionResult.data ?? []).map(row => ({
    id: row.id,
    entityId: row.entity_id,
    sourceKind: row.source_kind,
    sourceId: row.source_id,
    occurredAt: row.occurred_at,
    summary: row.summary,
    outcome: row.outcome,
  }))

  const introductions: NetworkIntroductionRecord[] = (introductionResult.data ?? []).map(row => ({
    id: row.id,
    targetEntityId: row.target_entity_id,
    targetSourceKind: row.target_source_kind,
    targetSourceId: row.target_source_id,
    status: row.status,
    updatedAt: row.updated_at,
  }))

  const watches: NetworkWatchRecord[] = (watchResult.data ?? []).map(row => ({
    id: row.id,
    refId: row.ref_id,
    watchStatus: row.watch_status,
  }))

  const activity: NetworkActivityDTO[] = [
    ...interactions.slice(0, 20).map(interaction => ({
      id: interaction.id,
      kind: 'interaction' as const,
      subjectId: interaction.entityId ?? (interaction.sourceKind && interaction.sourceId ? `${interaction.sourceKind}:${interaction.sourceId}` : null),
      summary: interaction.summary,
      status: interaction.outcome,
      occurredAt: interaction.occurredAt,
    })),
    ...introductions.slice(0, 20).map(introduction => ({
      id: introduction.id,
      kind: 'introduction' as const,
      subjectId: introduction.targetEntityId ?? (introduction.targetSourceKind && introduction.targetSourceId ? `${introduction.targetSourceKind}:${introduction.targetSourceId}` : null),
      summary: 'Introduction request',
      status: introduction.status,
      occurredAt: introduction.updatedAt,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 20)

  return { missions, interactions, introductions, watches, activity, warnings }
}

function baseRelationship(
  candidate: NetworkSourceCandidate,
  interactions: NetworkInteractionRecord[],
) {
  const matched = interactions.filter(interaction =>
    (candidate.entityId && interaction.entityId === candidate.entityId)
    || (interaction.sourceKind === candidate.sourceKind && interaction.sourceId === candidate.sourceId),
  )
  return {
    state: matched.length > 0 ? 'recorded' as const : 'no_recorded_relationship' as const,
    interactionCount: matched.length,
    lastInteractionAt: matched[0]?.occurredAt ?? null,
    lastOutcome: matched[0]?.outcome ?? null,
  }
}

function introductionFor(candidate: NetworkSourceCandidate, introductions: NetworkIntroductionRecord[]) {
  const record = introductions.find(introduction =>
    (candidate.entityId && introduction.targetEntityId === candidate.entityId)
    || (introduction.targetSourceKind === candidate.sourceKind && introduction.targetSourceId === candidate.sourceId),
  )
  return { introductionId: record?.id ?? null, status: record?.status ?? null }
}

function watchFor(candidate: NetworkSourceCandidate, watches: NetworkWatchRecord[]) {
  const refId = `${candidate.sourceKind}:${candidate.sourceId}`
  const record = watches.find(watch => watch.refId === refId && watch.watchStatus === 'active')
  return { watched: Boolean(record), watchId: record?.id ?? null }
}

function actionSet(input: {
  hasWorkspace: boolean
  watched: boolean
  introductionStatus: string | null
}): NetworkCandidateDTO['availableActions'] {
  const actions: NetworkCandidateDTO['availableActions'] = ['view']
  if (!input.hasWorkspace) return actions
  actions.push(input.watched ? 'unwatch' : 'watch')
  if (!input.introductionStatus || ['declined', 'expired', 'closed'].includes(input.introductionStatus)) {
    actions.push('request_introduction')
  }
  actions.push('log_interaction')
  return actions
}

function professionalCandidate(professional: HvProfessional): NetworkSourceCandidate {
  return {
    id: `professional:${professional.id}`,
    entityId: null,
    sourceKind: 'professional',
    sourceId: professional.id,
    kind: 'professional',
    name: professional.full_name,
    subtitle: unique([professional.title, professional.credential_type, professional.institution]).join(' · ') || null,
    countryIso2: professional.countries[0] ?? null,
    jurisdictionLabel: professional.countries.join(', ') || null,
    capabilities: unique(professional.specialties),
    verificationStatus: 'verified',
    lastVerifiedAt: null,
    summary: professional.institution ? `Professional affiliated with ${professional.institution}.` : null,
    availability: {
      referrals: professional.accepts_referrals,
      consultation: professional.consultation_available,
    },
    licences: [],
    evidenceSummary: [{ label: 'Reviewed professional record', status: 'verified', verifiedAt: null }],
    unknowns: ['Canonical entity resolution is not yet recorded for this professional.'],
    warnings: [],
  }
}

function operatorCandidate(operator: CannabisOperator, matrix: OperatorLicenceMatrix): NetworkSourceCandidate {
  const licenceRows = matrix.entitled ? (matrix.byOperatorId[operator.id] ?? []) : []
  const capabilities = unique(licenceRows.flatMap(licence => licence.authorizedActivities ?? []))
  return {
    id: `cannabis_operator:${operator.id}`,
    entityId: null,
    sourceKind: 'cannabis_operator',
    sourceId: operator.id,
    kind: 'operator',
    name: operator.legal_name,
    subtitle: operator.operator_type,
    countryIso2: operator.country_iso2,
    jurisdictionLabel: operator.country_iso2,
    capabilities,
    verificationStatus: operator.verification_status ?? 'unknown',
    lastVerifiedAt: null,
    summary: null,
    availability: null,
    licences: licenceRows.map(licence => ({
      licenceClass: licence.licenceClass,
      issuingRegulator: licence.issuingRegulator,
      authorizedActivities: licence.authorizedActivities ?? [],
      status: 'active' as const,
      gmpCertified: licence.gmpCertified,
      gacpCertified: licence.gacpCertified,
      facilityCity: licence.facilityCity,
      facilityProvinceState: licence.facilityProvinceState,
      lastVerifiedAt: null,
    })),
    evidenceSummary: licenceRows.length > 0
      ? [{ label: 'Active operator licence projection', status: 'active', verifiedAt: null }]
      : [{ label: 'Public operator record', status: operator.verification_status ?? 'unknown', verifiedAt: null }],
    unknowns: [
      ...(licenceRows.length === 0 ? ['No active licence detail is available in the current authorized projection.'] : []),
      'Canonical entity resolution is not exposed in the customer Network projection.',
    ],
    warnings: matrix.entitled ? [] : ['Licence detail is not available for this account.'],
  }
}

function serviceProviderCandidate(provider: ServiceProvider): NetworkSourceCandidate {
  return {
    id: `genetics_service_provider:${provider.id}`,
    entityId: null,
    sourceKind: 'genetics_service_provider',
    sourceId: provider.id,
    kind: 'service_provider',
    name: provider.displayName,
    subtitle: provider.service_category,
    countryIso2: upperIso2(provider.country_code),
    jurisdictionLabel: provider.jurisdiction_label,
    capabilities: unique([provider.service_category]),
    verificationStatus: provider.verification_level,
    lastVerifiedAt: null,
    summary: provider.service_summary,
    availability: null,
    licences: [],
    evidenceSummary: [{ label: 'Genetics service-provider projection', status: provider.verification_level, verifiedAt: null }],
    unknowns: ['General Network capability coverage is limited to the explicit Genetics service category for this record.'],
    warnings: [],
  }
}

function collaborationCandidate(project: CollaborationProject): NetworkSourceCandidate {
  return {
    id: `genetics_collaboration:${project.id}`,
    entityId: null,
    sourceKind: 'genetics_collaboration',
    sourceId: project.id,
    kind: 'collaboration',
    name: project.title,
    subtitle: project.projectType,
    countryIso2: upperIso2(project.countryCode),
    jurisdictionLabel: project.jurisdictionLabel,
    capabilities: unique([project.projectType]),
    verificationStatus: project.status,
    lastVerifiedAt: null,
    summary: project.publicSummary,
    availability: null,
    licences: [],
    evidenceSummary: [{ label: 'Public Genetics collaboration', status: project.status, verifiedAt: null }],
    unknowns: project.evidenceNeeded ? [`Evidence still needed: ${project.evidenceNeeded}`] : [],
    warnings: [],
  }
}

export async function getNetworkCommandDTO(input: {
  userId: string
  workspaceId: string | null
  countryIso2: string | null
  roleId: string | null
  supabase?: SupabaseClient
}): Promise<NetworkCommandDTO> {
  const supabase = input.supabase ?? await createClient()
  const context: NetworkContext = {
    supabase,
    userId: input.userId,
    workspaceId: input.workspaceId,
    countryIso2: upperIso2(input.countryIso2),
    roleId: input.roleId,
  }

  const [professionals, operators, serviceProviders, collaborationProjects, workspaceState] = await Promise.all([
    getProfessionals(context.countryIso2),
    getCannabisOperators(context.countryIso2),
    getPublicServiceProviders(),
    getPublicCollaborationProjects(),
    loadWorkspaceState(context),
  ])

  const licenceMatrix = await getOperatorLicenceMatrix(operators.map(operator => operator.id))
  const activeCountry = context.countryIso2
  const scopedProviders = serviceProviders.filter(provider => !activeCountry || !provider.country_code || upperIso2(provider.country_code) === activeCountry)
  const scopedCollaborations = collaborationProjects.filter(project => !activeCountry || !project.countryCode || upperIso2(project.countryCode) === activeCountry)

  const sourceCandidates: NetworkSourceCandidate[] = [
    ...professionals.map(professionalCandidate),
    ...operators.map(operator => operatorCandidate(operator, licenceMatrix)),
    ...scopedProviders.map(serviceProviderCandidate),
    ...scopedCollaborations.map(collaborationCandidate),
  ]

  const activeMission = workspaceState.missions.find(mission => mission.status === 'active') ?? workspaceState.missions[0] ?? null
  const hasWorkspace = Boolean(context.workspaceId)

  const candidates = sortNetworkCandidates(sourceCandidates.map(sourceCandidate => {
    const relationship = baseRelationship(sourceCandidate, workspaceState.interactions)
    const watch = watchFor(sourceCandidate, workspaceState.watches)
    const introduction = introductionFor(sourceCandidate, workspaceState.introductions)
    return attachNetworkFit({
      ...sourceCandidate,
      relationship,
      watch,
      introduction,
      availableActions: actionSet({
        hasWorkspace,
        watched: watch.watched,
        introductionStatus: introduction.status,
      }),
    }, activeMission)
  }))

  const unresolvedIdentityCount = sourceCandidates.filter(candidate => candidate.entityId === null).length
  const warnings = workspaceState.warnings.slice()
  if (!hasWorkspace) warnings.push('Connect an active organization to create missions, watch counterparties, request introductions, or record interactions.')

  return {
    version: 'network-command-p0',
    context: {
      countryIso2: context.countryIso2,
      roleId: context.roleId,
      workspaceId: context.workspaceId,
      hasActiveWorkspace: hasWorkspace,
    },
    permissions: {
      canCreateMission: hasWorkspace,
      canWatch: hasWorkspace,
      canRequestIntroduction: hasWorkspace,
      canLogInteraction: hasWorkspace,
    },
    dataState: candidates.length === 0
      ? (hasWorkspace ? 'empty' : 'permission_required')
      : warnings.length > (hasWorkspace ? 0 : 1) ? 'partial' : 'live',
    dataWarnings: warnings,
    missions: workspaceState.missions,
    activeMissionId: activeMission?.id ?? null,
    candidates,
    coverage: {
      professionals: professionals.length,
      serviceProviders: scopedProviders.length,
      licensedOperators: operators.length,
      collaborations: scopedCollaborations.length,
      totalCandidates: candidates.length,
      unresolvedIdentityCount,
    },
    activity: workspaceState.activity,
  }
}

export async function getNetworkCommandForCurrentUser(input?: {
  countryIso2?: string | null
  roleId?: string | null
}): Promise<NetworkCommandDTO | null> {
  const context = await resolveActiveNetworkContext(input)
  if (!context) return null
  return getNetworkCommandDTO({
    userId: context.userId,
    workspaceId: context.workspaceId,
    countryIso2: context.countryIso2,
    roleId: context.roleId,
    supabase: context.supabase,
  })
}
