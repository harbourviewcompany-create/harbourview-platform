import 'server-only'

import { ALL_COUNTRIES } from '@/lib/dashboard/countries'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardShared'
import { fetchDashboardSignals } from '@/lib/dashboard/dashboardServerData'
import { getCountryIntelProfile, getOrgPathwayProgress, getPublicPathwayTemplate } from '@/lib/dashboard/dashboardLiveData'
import { createClient } from '@/lib/supabase/server'
import {
  educationEvidenceState,
  educationGoalForTrack,
  moduleMatchesRole,
  practiceKind,
  type EducationCommandModule,
  type EducationCommandPath,
  type EducationCommandResponse,
  type EducationImpact,
  type EducationPracticeItem,
} from '@/lib/education/command'

const TRACK_LABELS: Record<string, string> = {
  clinical: 'Clinical',
  compliance: 'Compliance & Quality',
  export: 'Export Readiness',
  genetics: 'Genetics & Cultivar IP',
  import: 'Import & Distribution',
  logistics: 'Logistics & Cold Chain',
  market: 'Market Access',
  quality: 'Lab & QA',
  regulatory: 'Regulatory Intelligence',
}

const VERIFIED_REVIEW_STATUSES = new Set([
  'verified_primary_source',
  'verified_professional_body',
  'verified_peer_reviewed',
  'verified_secondary_source',
])

type ModuleRow = {
  id: string
  slug: string
  title: string
  description: string | null
  audience: string[] | null
  sensitivity: string | null
  track_id: string | null
  updated_at: string | null
}

type SectionRow = {
  module_id: string
  heading: string
  body: string
  block_type: string | null
  section_order: number | null
}

type OverlayRow = {
  module_key: string
  topics: string[] | null
  action_label: string | null
  review_status: string | null
  role_id: string | null
}

type ArticleRow = {
  module_id: string | null
  review_status: string | null
  last_reviewed: string | null
  next_review_due: string | null
  publication_confidence: string | null
  controlled_topic: boolean | null
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function moduleKeywords(module: EducationCommandModule): string[] {
  const ignored = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'readiness', 'essentials', 'guide', 'strategy', 'frameworks', 'intelligence'])
  return `${module.title} ${module.description} ${module.overlayTopics.join(' ')}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 4 && !ignored.has(token))
}

function matchImpactModule(text: string, modules: EducationCommandModule[]): EducationCommandModule | null {
  const normalized = text.toLowerCase()
  let winner: EducationCommandModule | null = null
  let best = 0
  for (const module of modules) {
    let score = 0
    for (const token of moduleKeywords(module)) {
      if (normalized.includes(token)) score += module.overlayTopics.some(topic => topic.toLowerCase().includes(token)) ? 3 : 1
    }
    if (module.jurisdictionMatch) score += 1
    if (score > best) {
      winner = module
      best = score
    }
  }
  return best >= 2 ? winner : null
}

function stepState(requirements: EducationCommandPath['steps'][number]['requirements']): EducationCommandPath['steps'][number]['state'] {
  if (requirements.length === 0) return 'unknown'
  if (requirements.some(item => item.state === 'rejected')) return 'rejected'
  if (requirements.every(item => item.state === 'verified' || item.state === 'waived')) return 'verified'
  if (requirements.some(item => item.state === 'in_review')) return 'in_review'
  if (requirements.some(item => item.state === 'pending')) return 'pending'
  return 'unknown'
}

function buildOperationalPath(pathway: Awaited<ReturnType<typeof getPublicPathwayTemplate>>): EducationCommandPath | null {
  if (!pathway.template) return null
  const statuses = new Map(pathway.requirementStatuses.map(item => [item.requirement_id, item.status]))
  const requirementsByStep = new Map<string, EducationCommandPath['steps'][number]['requirements']>()

  for (const requirement of pathway.requirements) {
    const list = requirementsByStep.get(requirement.step_id) ?? []
    list.push({
      id: requirement.id,
      title: requirement.title,
      description: requirement.description,
      evidenceType: requirement.evidence_type,
      required: requirement.is_required,
      state: statuses.get(requirement.id) ?? 'unknown',
    })
    requirementsByStep.set(requirement.step_id, list)
  }

  const steps = pathway.steps.map(step => {
    const requirements = requirementsByStep.get(step.id) ?? []
    return {
      id: step.id,
      order: step.step_number,
      title: step.title,
      description: step.description,
      state: stepState(requirements),
      requirements,
    }
  })

  return {
    id: pathway.template.id,
    title: pathway.template.name,
    kind: 'operational_pathway',
    description: 'Existing market-access requirements for the selected jurisdiction and role. Requirement states are organization evidence states, not learner qualifications.',
    goal: 'market_access',
    modules: [],
    steps,
  }
}

export async function getEducationCommand(userId: string, countryIso2: string, roleId: string | null): Promise<EducationCommandResponse> {
  const supabase = await createClient()
  const countryCode = countryIso2.toUpperCase()
  const countryLabel = ALL_COUNTRIES.find(country => country.iso2 === countryCode)?.displayName ?? countryCode
  const roleProfile = roleId ? ROLE_PROFILES[roleId as keyof typeof ROLE_PROFILES] : null
  const roleLabel = roleProfile?.label ?? (roleId ? roleId.replace(/_/g, ' ').replace(/\b\w/g, value => value.toUpperCase()) : 'All roles')
  const failures: string[] = []

  const modulesResult = await supabase
    .from('education_modules')
    .select('id,slug,title,description,audience,sensitivity,track_id,updated_at')
    .eq('publication_state', 'published')
    .order('sort_order', { ascending: true })
    .limit(100)

  if (modulesResult.error) failures.push('published modules')
  const allModules = (modulesResult.data ?? []) as ModuleRow[]
  const visibleRows = allModules.filter(row => moduleMatchesRole(Array.isArray(row.audience) ? row.audience : [], roleId))
  const moduleIds = visibleRows.map(row => row.id)

  const [sectionsResult, tracksResult, overlaysResult, articlesResult, countryIntel, signals, orgPathway, publicPathway] = await Promise.all([
    moduleIds.length
      ? supabase.from('education_module_sections').select('module_id,heading,body,block_type,section_order').in('module_id', moduleIds).order('section_order', { ascending: true })
      : Promise.resolve({ data: [] as SectionRow[], error: null }),
    supabase.from('education_tracks').select('id,title').eq('publication_state', 'published').limit(100),
    supabase.from('country_education_overlay').select('module_key,topics,action_label,review_status,role_id').eq('country_iso2', countryCode).limit(200),
    moduleIds.length
      ? supabase.from('education_articles').select('module_id,review_status,last_reviewed,next_review_due,publication_confidence,controlled_topic').eq('publication_state', 'published').in('module_id', moduleIds).limit(300)
      : Promise.resolve({ data: [] as ArticleRow[], error: null }),
    getCountryIntelProfile(countryCode),
    fetchDashboardSignals(30, countryLabel),
    roleId ? getOrgPathwayProgress(userId, countryCode, roleId) : Promise.resolve(null),
    roleId ? getPublicPathwayTemplate(countryCode, roleId) : Promise.resolve(null),
  ])

  if (sectionsResult.error) failures.push('module sections')
  if (tracksResult.error) failures.push('education tracks')
  if (overlaysResult.error) failures.push('jurisdiction overlays')
  if (articlesResult.error) failures.push('education article review metadata')

  const trackLabels = new Map<string, string>(Object.entries(TRACK_LABELS))
  for (const row of tracksResult.data ?? []) trackLabels.set(String(row.id), cleanText(row.title) || String(row.id))

  const sectionsByModule = new Map<string, SectionRow[]>()
  for (const row of (sectionsResult.data ?? []) as SectionRow[]) {
    const list = sectionsByModule.get(row.module_id) ?? []
    list.push(row)
    sectionsByModule.set(row.module_id, list)
  }

  const overlaysByModule = new Map<string, OverlayRow[]>()
  for (const row of (overlaysResult.data ?? []) as OverlayRow[]) {
    if (row.role_id && roleId && row.role_id !== roleId) continue
    if (row.role_id && !roleId) {
      // All roles is an aggregate view: role-specific overlays remain relevant and
      // are shown without pretending one role is active.
    }
    const list = overlaysByModule.get(row.module_key) ?? []
    list.push(row)
    overlaysByModule.set(row.module_key, list)
  }

  const articlesByModule = new Map<string, ArticleRow[]>()
  for (const row of (articlesResult.data ?? []) as ArticleRow[]) {
    if (!row.module_id) continue
    const list = articlesByModule.get(row.module_id) ?? []
    list.push(row)
    articlesByModule.set(row.module_id, list)
  }

  const modules: EducationCommandModule[] = visibleRows.map(row => {
    const audience = Array.isArray(row.audience) ? row.audience : []
    const overlays = overlaysByModule.get(row.slug) ?? []
    const verifiedOverlays = overlays.filter(item => item.review_status && VERIFIED_REVIEW_STATUSES.has(item.review_status))
    const articles = articlesByModule.get(row.id) ?? []
    const statuses = [...overlays.map(item => item.review_status), ...articles.map(item => item.review_status)]
    const mostRecentArticle = [...articles].sort((a, b) => (b.last_reviewed ?? '').localeCompare(a.last_reviewed ?? ''))[0]
    const trackId = row.track_id ?? 'unclassified'
    const sections = (sectionsByModule.get(row.id) ?? []).map(section => ({
      heading: section.heading,
      body: section.body,
      blockType: section.block_type,
    }))

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: cleanText(row.description) || 'Published Harbourview education module.',
      trackId,
      trackLabel: trackLabels.get(trackId) ?? trackId.replace(/[_-]/g, ' ').replace(/\b\w/g, value => value.toUpperCase()),
      audience,
      sensitivity: row.sensitivity ?? 'standard',
      updatedAt: row.updated_at,
      goal: educationGoalForTrack(trackId),
      roleMatch: moduleMatchesRole(audience, roleId),
      generalAudience: audience.includes('general'),
      jurisdictionMatch: verifiedOverlays.length > 0,
      evidenceState: educationEvidenceState(statuses),
      reviewStatus: mostRecentArticle?.review_status ?? verifiedOverlays[0]?.review_status ?? overlays[0]?.review_status ?? null,
      lastReviewedAt: mostRecentArticle?.last_reviewed ?? null,
      nextReviewDueAt: mostRecentArticle?.next_review_due ?? null,
      publicationConfidence: mostRecentArticle?.publication_confidence ?? null,
      controlledTopic: articles.some(article => article.controlled_topic === true) || row.sensitivity === 'controlled',
      overlayTopics: Array.from(new Set(verifiedOverlays.flatMap(item => Array.isArray(item.topics) ? item.topics : []))),
      overlayActionLabel: verifiedOverlays.find(item => cleanText(item.action_label))?.action_label ?? null,
      sections,
    }
  })

  const educationPaths: EducationCommandPath[] = Array.from(new Map(modules.map(module => [module.trackId, module.trackLabel])).entries())
    .map(([trackId, label]) => {
      const trackModules = modules.filter(module => module.trackId === trackId)
      return {
        id: `track:${trackId}`,
        title: label,
        kind: 'education_track' as const,
        description: `${trackModules.length} published module${trackModules.length === 1 ? '' : 's'} in this track for the current role context.`,
        goal: educationGoalForTrack(trackId),
        modules: trackModules.map(module => module.slug),
        steps: [],
      }
    })

  const selectedPathway = orgPathway?.template ? orgPathway : publicPathway
  const operationalPath = selectedPathway ? buildOperationalPath(selectedPathway) : null
  const paths = operationalPath ? [operationalPath, ...educationPaths] : educationPaths

  const impacts: EducationImpact[] = []
  for (const change of countryIntel?.recentChanges ?? []) {
    const title = `${change.field_name.replace(/_/g, ' ')} changed`
    const whatChanged = [change.old_value ? `From ${change.old_value}` : null, change.new_value ? `to ${change.new_value}` : null]
      .filter(Boolean)
      .join(' ')
    const matched = matchImpactModule(`${title} ${whatChanged}`, modules)
    impacts.push({
      id: `field:${change.id}`,
      kind: 'regulatory_change',
      title,
      whatChanged: whatChanged || 'The jurisdiction intelligence record changed; the loaded record does not contain a textual delta.',
      whyItMatters: null,
      recommendedAction: null,
      occurredAt: change.changed_at,
      sourceLabel: change.source_label,
      confidence: null,
      moduleSlug: matched?.slug ?? null,
      moduleMatchBasis: matched ? 'topic_match' : null,
    })
  }

  for (const signal of signals) {
    const isRegulatory = signal.type === 'regulatory_change' || signal.signalContentType?.toLowerCase().includes('regulatory')
    if (!isRegulatory) continue
    const whatChanged = cleanText(signal.analysis?.what_changed) || signal.title
    const matched = matchImpactModule(`${signal.title} ${whatChanged} ${signal.commercialImpact}`, modules)
    impacts.push({
      id: `signal:${signal.id}`,
      kind: 'signal',
      title: signal.title,
      whatChanged,
      whyItMatters: cleanText(signal.commercialImpact) || null,
      recommendedAction: cleanText(signal.analysis?.recommended_action) || null,
      occurredAt: signal.timeAgo || null,
      sourceLabel: signal.sourceLabel ?? null,
      confidence: Number.isFinite(signal.confidence) ? signal.confidence : null,
      moduleSlug: matched?.slug ?? null,
      moduleMatchBasis: matched ? 'topic_match' : null,
    })
  }

  const dedupedImpacts = Array.from(new Map(impacts.map(impact => [`${impact.kind}:${impact.title.toLowerCase()}`, impact])).values()).slice(0, 8)

  const practice: EducationPracticeItem[] = []
  for (const module of modules) {
    module.sections.forEach((section, index) => {
      const kind = practiceKind(section.heading)
      if (!kind) return
      practice.push({
        id: `${module.id}:${index}`,
        moduleSlug: module.slug,
        moduleTitle: module.title,
        heading: section.heading,
        body: section.body,
        kind,
      })
    })
  }

  const hasOrgPathwayProgress = Boolean(orgPathway?.progress || orgPathway?.requirementStatuses.length)
  const limitations = [
    'The current repository has no learner assessment-attempt, competency-observation, qualification, credential, or team qualification-matrix contract wired to Education Command.',
    'Education modules do not encode module-to-module prerequisites or product/activity scope, so this release does not fabricate prerequisite completion or activity-specific qualification states.',
    'Regulatory-change-to-module links use transparent topic matching only; they are contextual suggestions, not assertions that a regulator mandated retraining.',
  ]

  return {
    sourceState: modules.length === 0 ? 'empty' : failures.length > 0 ? 'degraded' : 'loaded',
    generatedAt: new Date().toISOString(),
    context: {
      countryIso2: countryCode,
      countryLabel,
      roleId,
      roleLabel,
      allRoles: roleId === null,
    },
    impacts: dedupedImpacts,
    paths,
    modules,
    practice,
    capabilities: {
      learnerProgress: false,
      assessmentAttempts: false,
      qualificationRecords: false,
      credentialRecords: false,
      scenarioEngine: practice.some(item => item.kind === 'scenario'),
      teamQualificationMatrix: false,
      organizationPathwayProgress: hasOrgPathwayProgress,
      explanation: hasOrgPathwayProgress
        ? 'Organization pathway evidence states are available. They are shown separately from learner competency because the repository does not currently connect them.'
        : 'No learner qualification model is connected. Education Command reports unknown/not assessed rather than inventing completion or competency.',
    },
    limitations: failures.length > 0 ? [...limitations, `Degraded sources in this request: ${failures.join(', ')}.`] : limitations,
  }
}
