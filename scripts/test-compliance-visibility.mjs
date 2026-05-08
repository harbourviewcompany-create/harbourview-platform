const routes = [
  '/compliance',
  '/compliance/regions/europe',
  '/compliance/regions/north-america',
  '/compliance/regions/latin-america',
  '/compliance/regions/caribbean',
  '/compliance/regions/africa',
  '/compliance/regions/middle-east',
  '/compliance/regions/asia-pacific',
  '/compliance/country-pathways/germany',
  '/compliance/country-pathways/netherlands',
  '/compliance/country-pathways/france',
  '/compliance/country-pathways/canada',
  '/compliance/country-pathways/united-states',
  '/compliance/country-pathways/brazil',
  '/compliance/country-pathways/colombia',
  '/compliance/country-pathways/south-africa',
  '/compliance/country-pathways/morocco',
  '/compliance/country-pathways/israel',
  '/compliance/country-pathways/australia',
  '/compliance/country-pathways/new-zealand',
  '/compliance/country-pathways/japan',
  '/compliance/explainers/eu-gmp',
  '/compliance/explainers/gacp',
  '/compliance/explainers/gdp-distribution',
  '/compliance/explainers/import-export',
  '/compliance/explainers/facility-environment',
  '/compliance/explainers/documentation-audit',
  '/compliance/explainers/testing-coa',
  '/compliance/service-support',
  '/compliance/products',
  '/compliance/request-support',
]

const forbidden = [
  'privateContactEmail',
  'privateContactPhone',
  'providerInternalNotes',
  'commercialTermsNotes',
  'matchedProvider',
  'recommendedProviderIds',
  'sourceEvidence',
  'internalReviewNotes',
  'reviewedBy',
  'credentialNotes',
  'conflictNotes',
  'providerMatchScore',
  'inquiryRiskRating',
  'licenceDocumentUrl',
  'batchRecordUrl',
  'coaPrivateUrl',
  'evidencePacket',
  'routingNotes',
  'referralEconomics',
  'client inquiry',
  'draft country',
  'unpublished compliance signal',
  'service role',
  'SUPABASE_SERVICE_ROLE_KEY',
]

async function run() {
  const base = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://localhost:3000'
  const failures = []

  for (const route of routes) {
    const url = `${base}${route}`
    let res
    let text

    try {
      res = await fetch(url)
      text = await res.text()
    } catch (error) {
      failures.push(`${route}: fetch failed: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }

    if (res.status !== 200) {
      failures.push(`${route}: expected 200, received ${res.status}`)
    }

    for (const token of forbidden) {
      if (text.includes(token)) {
        failures.push(`${route}: leaked forbidden token ${token}`)
      }
    }
  }

  if (failures.length > 0) {
    console.error('Compliance visibility failures:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`Compliance visibility test passed for ${routes.length} routes.`)
}

run()
