import { describe, expect, it } from 'vitest'
import { buildClinicalReviewQueueMetrics } from '@/lib/clinical/reviewQueueMetrics'

describe('buildClinicalReviewQueueMetrics', () => {
  it('tallies backlog and live volume', () => {
    const m = buildClinicalReviewQueueMetrics({
      evidence: [
        { review_status: 'published' },
        { review_status: 'under-review' },
        { review_status: 'under-review' },
      ],
      formulary: [
        { review_status: 'published' },
        { review_status: 'retired' },
      ],
      skus: [{ review_status: 'under-review' }],
      jurisdictions: [{ review_status: 'published' }],
    })
    expect(m.evidence.underReview).toBe(2)
    expect(m.evidence.published).toBe(1)
    expect(m.backlog).toBe(3) // 2 evidence + 1 sku
    expect(m.live).toBe(3) // 1 evidence + 1 formulary + 1 jurisdiction
  })
})
