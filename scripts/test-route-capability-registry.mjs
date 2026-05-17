import fs from 'node:fs'

const source = fs.readFileSync('lib/platform/capabilityRegistry.ts', 'utf8')

const requiredIds = [
  'home-platform-spine',
  'marketplace-hub',
  'marketplace-services',
  'marketplace-listings',
  'marketplace-wanted',
  'marketplace-sell',
  'marketplace-business-opportunities',
  'confidential-intake',
  'intelligence-hub',
  'intelligence-country-briefs',
  'intelligence-licensing-pathways',
  'intelligence-regulatory-pathways',
  'intelligence-counterparty',
  'intelligence-logistics-trade-routes',
  'signals-public',
  'education-hub',
  'clinical-education',
  'medical-cannabis-education',
  'eu-gmp-education',
  'gacp-education',
  'gdp-education',
  'qp-release-education',
  'import-export-education',
  'canada-germany-pathway',
  'quality-systems-education',
  'batch-evidence-education',
  'supplier-qualification-education',
  'compliance-hub',
  'compliance-country-pathways',
  'assessments-hub',
  'professionals-hub',
  'policy-standards',
  'source-methodology',
  'trust-governance',
  'reviewed-connections',
  'legal-privacy',
  'legal-terms',
  'admin-dashboard',
  'admin-sources',
  'admin-candidates',
  'admin-signals',
  'admin-inquiries',
  'admin-role-guard',
  'public-private-dto-boundary',
]

const requiredFields = [
  'requiredCapability',
  'visibility',
  'criticality',
  'status',
  'falseGoRisk',
  'evidenceFiles',
  'acceptanceTests',
]

const missingIds = requiredIds.filter((id) => !source.includes(`id: '${id}'`))
const missingFields = requiredFields.filter((field) => !source.includes(`${field}:`))
const missingLabels = ['public', 'private', 'admin-only', 'later-enabled', 'launch-critical'].filter((label) => !source.includes(label))

if (missingIds.length || missingFields.length || missingLabels.length) {
  console.error(JSON.stringify({ missingIds, missingFields, missingLabels }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, requiredIds: requiredIds.length }, null, 2))
