import { describe, expect, it } from 'vitest'
import { toPublicEducationArticleDto } from '@/lib/dto/education'

describe('education DTO boundary', () => {
  it('does not expose private fields', () => {
    const dto = toPublicEducationArticleDto({
      id: 'a', slug: 'x', title: 't', summary: 's', state: 'published', audience: ['clinician'], sensitivity: 'medical',
      sourceBasis: 'official-source', reviewStatus: 'reviewed', lastReviewed: '2026-05-01', nextReviewDue: '2026-08-01',
      publicationConfidence: 'high', reviewerType: 'clinical', controlledTopic: true,
    })
    expect(dto).not.toHaveProperty('id')
    expect(Object.keys(dto).sort()).toEqual(['controlledTopic','lastReviewed','nextReviewDue','publicationConfidence','reviewStatus','reviewerType','slug','sourceBasis','summary','title'].sort())
  })
})
