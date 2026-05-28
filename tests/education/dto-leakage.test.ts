import { describe, expect, it } from 'vitest'
import { toPublicEducationArticleDto } from '@/lib/dto/education'

describe('education public DTO', () => {
  it('does not leak internal provenance fields', () => {
    const dto = toPublicEducationArticleDto({
      id: '1', slug: 's', title: 't', publicationState: 'published', publicSummary: 'sum',
      sourceBasis: 'official-source', reviewStatus: 'approved', lastReviewed: '2026-05-28', nextReviewDue: '2026-06-28',
      publicationConfidence: 0.9, reviewerType: 'clinical', controlledTopic: false, sections: [],
      internal: { rawSourceUrls: ['secret'], reviewerNotes: 'private notes' },
    }) as Record<string, unknown>

    expect(dto.internal).toBeUndefined()
    expect(Object.keys(dto)).not.toContain('rawSourceUrls')
  })
})
