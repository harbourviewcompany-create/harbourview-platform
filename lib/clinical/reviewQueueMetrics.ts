/**
 * Clinical review queue metrics — operator volume + backlog signals.
 */

export type ReviewStatusBucket = {
  published: number
  underReview: number
  retired: number
  other: number
  total: number
}

export type ClinicalReviewQueueMetrics = {
  evidence: ReviewStatusBucket
  formulary: ReviewStatusBucket
  skus: ReviewStatusBucket
  jurisdictions: ReviewStatusBucket
  /** Items needing human attention (under-review) */
  backlog: number
  /** Published surface volume */
  live: number
  computedAt: string
}

function emptyBucket(): ReviewStatusBucket {
  return { published: 0, underReview: 0, retired: 0, other: 0, total: 0 }
}

function tally(
  rows: Array<{ review_status?: string | null }>,
): ReviewStatusBucket {
  const b = emptyBucket()
  for (const row of rows) {
    const s = String(row.review_status ?? '').toLowerCase()
    b.total += 1
    if (s === 'published') b.published += 1
    else if (s === 'under-review' || s === 'under_review') b.underReview += 1
    else if (s === 'retired') b.retired += 1
    else b.other += 1
  }
  return b
}

export function buildClinicalReviewQueueMetrics(input: {
  evidence: Array<{ review_status?: string | null }>
  formulary: Array<{ review_status?: string | null }>
  skus?: Array<{ review_status?: string | null }>
  jurisdictions?: Array<{ review_status?: string | null }>
}): ClinicalReviewQueueMetrics {
  const evidence = tally(input.evidence)
  const formulary = tally(input.formulary)
  const skus = tally(input.skus ?? [])
  const jurisdictions = tally(input.jurisdictions ?? [])
  const backlog =
    evidence.underReview + formulary.underReview + skus.underReview + jurisdictions.underReview
  const live =
    evidence.published + formulary.published + skus.published + jurisdictions.published
  return {
    evidence,
    formulary,
    skus,
    jurisdictions,
    backlog,
    live,
    computedAt: new Date().toISOString(),
  }
}
