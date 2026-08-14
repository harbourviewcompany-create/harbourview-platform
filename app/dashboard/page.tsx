import type { Metadata } from 'next'
import DashboardResponsiveShell from '@/components/dashboard/DashboardResponsiveShell'
import CommandCentreDataBoundary from '@/components/dashboard/CommandCentreDataBoundary'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { getEduCategoriesForRole } from '@/lib/dashboard/dashboardServerData'
import { buildDashboardCommandSources } from '@/lib/dashboard/buildDashboardCommandSources'
import { loadCommandCentreData } from '@/lib/dashboard/loadCommandCentreData'
import {
  getActiveEvidenceData,
  getActiveOrgPathwayProgress,
  getActiveWatchlistData,
} from '@/lib/dashboard/activeWorkspaceDashboardData'
import { mergePathwayData, deriveRequirementStatusesFromIntel } from '@/lib/dashboard/pathwayReadiness'
import { checkFeatureAccess } from '@/lib/billing/entitlements'
import { normalizeCommandPage } from '@/lib/platform/commandCentreRegistry'
import { createClient } from '@/lib/supabase/server'
import type { RoleId } from '@/types/globe-router'

export const metadata: Metadata = {
  title: 'Dashboard | Harbourview',
  description: 'Harbourview universal dashboard — Marketplace, Intel Signals, and Education in one view.',
}

export const dynamic = 'force-dynamic'

const ROLE_ALIASES: Record<string, RoleId> = {
  buyer: 'importer',
  importer: 'importer',
  importer_buyer: 'importer',
  supplier: 'exporter',
  exporter: 'exporter',
  seller: 'exporter',
  producer: 'cultivator_producer',
  cultivator: 'cultivator_producer',
  processor: 'processor_extractor',
  extractor: 'processor_extractor',
  doctor: 'doctor_prescriber',
  prescriber: 'doctor_prescriber',
  pharmacist: 'pharmacist',
  compliance: 'regulatory_compliance',
  regulator: 'government_regulator',
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeCountryParam(raw: string | null): string | null {
  if (!raw) return null
  const first = raw.split(',')[0]?.trim().toUpperCase()
  if (!first) return null
  const subMatch = first.match(/^([A-Z]{2})-[A-Z0-9]{2,3}$/)
  if (subMatch) return subMatch[1]
  return first.match(/^[A-Z]{2}$/)?.[0] ?? null
}

function normalizeRoleParam(raw: string | null): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const resolved = ROLE_ALIASES[key] ?? (key as RoleId)
  return ROLE_PROFILES[resolved] ? resolved : null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const urlCountry = normalizeCountryParam(firstParam(params.country) ?? firstParam(params.countries))
  const urlRole = normalizeRoleParam(firstParam(params.role))
  const urlPage = normalizeCommandPage(firstParam(params.page))

  let userId: string | null = null
  let userEmail: string | null = null
  let userAppMetadata: Record<string, unknown> | undefined
  let storedCountryIso2: string | null = null
  let storedRoleId: string | null = null
  let activeWorkspaceId: string | null = null
  let hasOrg = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      userEmail = user.email ?? null
      userAppMetadata = user.app_metadata
      const { data: prefs } = await supabase
        .from('user_dashboard_preferences')
        .select('country_iso2, role_id, active_workspace_id')
        .eq('user_id', user.id)
        .maybeSingle()
      storedCountryIso2 = normalizeCountryParam(prefs?.country_iso2 ?? null)
      storedRoleId = normalizeRoleParam(prefs?.role_id ?? null)
      activeWorkspaceId = prefs?.active_workspace_id ?? null

      if (activeWorkspaceId) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('workspace_id', activeWorkspaceId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        hasOrg = Boolean(membership)
        if (!membership) activeWorkspaceId = null
      }
    }
  } catch (error) {
    console.error('[command-centre-auth-context]', {
      code: error instanceof Error ? error.name : 'AUTH_CONTEXT_FAILED',
    })
  }

  const countryIso2 = urlCountry ?? storedCountryIso2
  const roleId = urlRole ?? storedRoleId
  const loadContext = {
    countryIso2,
    roleId,
    page: urlPage,
    userId,
    hasOrganization: hasOrg,
  } as const

  const defaultSources = buildDashboardCommandSources(loadContext)
  const commandSources = {
    ...defaultSources,
    orgPathway: {
      ...defaultSources.orgPathway,
      load: () => getActiveOrgPathwayProgress(activeWorkspaceId, countryIso2, roleId),
    },
    watchlistData: {
      ...defaultSources.watchlistData,
      load: () => getActiveWatchlistData(activeWorkspaceId, userId),
    },
    evidenceData: {
      ...defaultSources.evidenceData,
      load: () => getActiveEvidenceData(activeWorkspaceId, countryIso2),
    },
  }

  const commandData = await loadCommandCentreData(loadContext, commandSources)

  const {
    signals,
    dailyDigest,
    wantedCount,
    marketplaceRows: marketplaceProjection,
    pipeline,
    wantedListings,
    countryIntel,
    liveEduTiles,
    orgPathway,
    publicPathway,
    watchlistData,
    evidenceData,
    recentEduModules,
    localIntel,
    sourceCoverage,
    registryCoverageSummary,
    jurisdictionPlaybook,
    educationTracks,
    marketMetrics,
    tradeFlows,
    professionals,
    cannabisOperators,
    operatorLicenceMatrix,
    cultivarPassports,
    serviceProviders,
    collaborationProjects,
    mySubmissions,
    countryEducationOverlays,
    pathwayMatrix,
  } = commandData.data

  const watchlistAccess = checkFeatureAccess({ app_metadata: userAppMetadata }, 'watchlist')

  const pathwayData = deriveRequirementStatusesFromIntel(
    mergePathwayData(orgPathway, publicPathway),
    countryIntel,
  )

  const staticEduCategories = getEduCategoriesForRole(roleId ?? undefined)
  const eduCategories = liveEduTiles.length > 0 ? liveEduTiles : staticEduCategories

  return (
    <CommandCentreDataBoundary
      state={commandData.state}
      sources={commandData.sources}
      loadedAt={commandData.loadedAt}
    >
      <DashboardResponsiveShell
        key={`${countryIso2 ?? 'none'}-${roleId ?? 'none'}-${activeWorkspaceId ?? 'personal'}-${urlPage ?? 'none'}`}
        hasOrg={hasOrg}
        signals={signals}
        digestSignals={dailyDigest.signals}
        digestWindow={dailyDigest.window}
        eduCategories={eduCategories}
        liveTiles={liveEduTiles.length > 0 ? liveEduTiles : undefined}
        initialCountryIso2={countryIso2}
        initialRoleId={roleId}
        initialPage={urlPage}
        wantedCount={wantedCount}
        marketplaceRows={marketplaceProjection.rows}
        marketplaceMediaById={marketplaceProjection.mediaById}
        pipeline={pipeline}
        wantedListings={wantedListings}
        countryIntel={countryIntel ?? undefined}
        localIntel={localIntel ?? undefined}
        pathwayData={pathwayData}
        watchlistData={watchlistData}
        watchlistAccess={watchlistAccess}
        evidenceData={evidenceData}
        recentEduModules={recentEduModules}
        sourceCoverage={sourceCoverage}
        registryCoverageSummary={registryCoverageSummary ?? undefined}
        jurisdictionPlaybook={jurisdictionPlaybook ?? undefined}
        pathwayMatrix={pathwayMatrix}
        educationTracks={educationTracks}
        marketMetrics={marketMetrics}
        tradeFlows={tradeFlows}
        professionals={professionals}
        cannabisOperators={cannabisOperators}
        operatorLicenceMatrix={operatorLicenceMatrix}
        userEmail={userEmail}
        cultivarPassports={cultivarPassports}
        serviceProviders={serviceProviders}
        collaborationProjects={collaborationProjects}
        mySubmissions={mySubmissions}
        countryEducationOverlays={countryEducationOverlays}
      />
    </CommandCentreDataBoundary>
  )
}
