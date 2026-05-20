import { describe, expect, it } from 'vitest'

import { getComplianceCountry } from '@/lib/compliance/countries'
import { toSafeCountry } from '@/lib/compliance/safePublicCompliance'

describe('compliance public country projection', () => {
  it('returns only safe public fields for country pathways', () => {
    const country = getComplianceCountry('germany')
    expect(country).toBeTruthy()

    const projected = toSafeCountry(country!)
    const keys = Object.keys(projected).sort()

    expect(keys).toEqual([
      'commercialRelevance',
      'complianceTags',
      'country',
      'cultivationManufacturingRelevance',
      'disclaimer',
      'facilityEnvironmentSecurityRelevance',
      'gmpGacpGdpRelevance',
      'harbourviewSupportAvailability',
      'importExportRelevance',
      'knownBottlenecks',
      'lastReviewed',
      'maturityLevel',
      'packagingLabellingRelevance',
      'pathwaySummary',
      'region',
      'regulatoryBodies',
      'relatedExplainers',
      'reviewStatus',
      'slug',
      'sourceConfidence',
      'testingCoaRelevance',
    ])
  })
})
