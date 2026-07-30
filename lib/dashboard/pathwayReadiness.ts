import type { PathwayData } from './dashboardLiveData'
import type { CountryIntelProfile } from './dashboardLiveData'

/**
 * Merge org pathway progress with the public/generic template.
 * When the org has no curated template (or no progress rows), the public
 * structure is used so the Pathway tab is never empty.
 */
export function mergePathwayData(
  org: PathwayData | null | undefined,
  pub: PathwayData | null | undefined,
): PathwayData {
  const empty: PathwayData = {
    template: null,
    steps: [],
    requirements: [],
    progress: null,
    requirementStatuses: [],
  }

  // Prefer org when it has a real template + steps
  if (org?.template && org.steps.length > 0) {
    return {
      template: org.template,
      steps: org.steps,
      requirements: org.requirements,
      progress: org.progress,
      requirementStatuses: org.requirementStatuses ?? [],
    }
  }

  // Fall back to public / generic template
  if (pub?.template && pub.steps.length > 0) {
    return {
      template: pub.template,
      steps: pub.steps,
      requirements: pub.requirements,
      progress: org?.progress ?? null,
      // Carry over any org statuses that happen to match requirement ids
      requirementStatuses: org?.requirementStatuses?.length
        ? org.requirementStatuses
        : [],
    }
  }

  return empty
}

/**
 * Derive initial requirement statuses from country intelligence when the user
 * has no saved org progress. This turns the Pathway tab from a static
 * "Not Started" wall into something that reflects real market conditions.
 *
 * Mapping (conservative — only mark items that country data clearly supports):
 * - import_status / export_status in {open, limited, regulated, permitted} →
 *   licence + authorisation items → 'verified' or 'in_review'
 * - market_access_status present → market-connection style items → 'in_review'
 * - Everything else stays 'pending'
 */
export function deriveRequirementStatusesFromIntel(
  pathway: PathwayData,
  intel: CountryIntelProfile | null | undefined,
): PathwayData {
  if (!pathway.template || pathway.requirements.length === 0) return pathway
  // Don't overwrite real org statuses
  if (pathway.requirementStatuses.length > 0) return pathway
  if (!intel) return pathway

  const importOk = isAccessibleStatus(intel.import_status)
  const exportOk = isAccessibleStatus(intel.export_status)
  const marketOk = isAccessibleStatus(intel.market_access_status)

  const statuses: PathwayData['requirementStatuses'] = pathway.requirements.map((req) => {
    const title = req.title.toLowerCase()
    const evidence = (req.evidence_type || '').toLowerCase()

    let status: PathwayData['requirementStatuses'][number]['status'] = 'pending'

    // Licence / authorisation items
    if (
      evidence === 'licence' ||
      title.includes('licence') ||
      title.includes('license') ||
      title.includes('authorisation') ||
      title.includes('authorization') ||
      title.includes('registration')
    ) {
      if (importOk || exportOk) status = 'in_review'
    }

    // Good-standing / declaration items
    if (
      evidence === 'declaration' &&
      (title.includes('good standing') || title.includes('confirmation'))
    ) {
      if (importOk || exportOk) status = 'in_review'
    }

    // Product / tariff / HS classification
    if (
      title.includes('tariff') ||
      title.includes('hs code') ||
      title.includes('classification') ||
      title.includes('product category')
    ) {
      // Classification still requires operator action — leave pending
      status = 'pending'
    }

    // Market / counterpart connection
    if (
      title.includes('counterpart') ||
      title.includes('market route') ||
      title.includes('buyer') ||
      title.includes('supplier') ||
      title.includes('distribution')
    ) {
      if (marketOk) status = 'in_review'
    }

    // Import/export permit items
    if (
      title.includes('import') ||
      title.includes('export') ||
      title.includes('permit') ||
      title.includes('quota')
    ) {
      if (importOk || exportOk) status = 'in_review'
    }

    return {
      requirement_id: req.id,
      status,
      submitted_at: null,
      reviewed_at: null,
    }
  })

  const verifiedCount = statuses.filter((s) => s.status === 'verified').length
  const inReviewCount = statuses.filter((s) => s.status === 'in_review').length
  const total = statuses.length
  const currentStep = computeCurrentStep(pathway, statuses)

  return {
    ...pathway,
    requirementStatuses: statuses,
    progress: {
      current_step: currentStep,
      status: verifiedCount === total && total > 0 ? 'complete' : inReviewCount > 0 ? 'in_progress' : 'not_started',
      last_action_at: new Date().toISOString(),
    },
  }
}

function isAccessibleStatus(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.toLowerCase().trim()
  return [
    'open',
    'limited',
    'regulated',
    'permitted',
    'allowed',
    'active',
    'available',
    'yes',
    'partial',
    'conditional',
  ].some((k) => v.includes(k))
}

function computeCurrentStep(
  pathway: PathwayData,
  statuses: PathwayData['requirementStatuses'],
): number {
  const statusByReq = new Map(statuses.map((s) => [s.requirement_id, s.status]))
  for (const step of pathway.steps) {
    const reqs = pathway.requirements.filter((r) => r.step_id === step.id && r.is_required)
    if (reqs.length === 0) continue
    const allDone = reqs.every((r) => {
      const st = statusByReq.get(r.id)
      return st === 'verified' || st === 'waived'
    })
    if (!allDone) return step.step_number
  }
  return pathway.steps.length > 0 ? pathway.steps[pathway.steps.length - 1].step_number : 1
}

/** Per-step summary for UI: met / total required + overall label */
export type StepReadiness = {
  stepId: string
  stepNumber: number
  title: string
  met: number
  total: number
  label: 'Not started' | 'In progress' | 'Complete'
  percent: number
}

export function computeStepReadiness(pathway: PathwayData): StepReadiness[] {
  const statusByReq = new Map(
    (pathway.requirementStatuses ?? []).map((s) => [s.requirement_id, s.status]),
  )

  return pathway.steps.map((step) => {
    const reqs = pathway.requirements.filter((r) => r.step_id === step.id && r.is_required)
    const total = reqs.length
    const met = reqs.filter((r) => {
      const st = statusByReq.get(r.id)
      return st === 'verified' || st === 'waived' || st === 'in_review'
    }).length

    let label: StepReadiness['label'] = 'Not started'
    if (total > 0 && met === total) label = 'Complete'
    else if (met > 0) label = 'In progress'

    return {
      stepId: step.id,
      stepNumber: step.step_number,
      title: step.title,
      met,
      total,
      label,
      percent: total === 0 ? 0 : Math.round((met / total) * 100),
    }
  })
}

/** Overall pathway progress 0–100 */
export function computeOverallProgress(pathway: PathwayData): number {
  const steps = computeStepReadiness(pathway)
  if (steps.length === 0) return 0
  const sum = steps.reduce((acc, s) => acc + s.percent, 0)
  return Math.round(sum / steps.length)
}
