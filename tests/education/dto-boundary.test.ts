import { describe, expect, it } from 'vitest'
import { toPublicEducationArticleDto } from '@/lib/dto/education'
import type { EducationArticle } from '@/lib/education/models'

describe('education public dto boundary', () => {
  it('only exposes safe fields', () => {
    const input: EducationArticle = {
      id: '1', slug: 'a', title: 'A', summary: 'B', state: 'published', sourceBasis: 'official-source', sensitivity: 'clinical', audience: ['clinician'], reviewerRequired: true,
      lastReviewedAt: null, nextReviewDueAt: null, disclaimerType: 'clinical', countryApplicability: ['global'], restrictedLanguageFlags: ['x'], publicationConfidence: 'high',
    }
    const dto = toPublicEducationArticleDto(input)
    expect(dto).not.toHaveProperty('reviewerNotes')
    expect(dto.controlledTopic).toBe(true)
  })
})
