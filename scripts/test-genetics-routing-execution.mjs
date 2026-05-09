import { createGeneticsRoutingRecord } from '../lib/introduction-routing/geneticsExecution.js'

const failures = []

const record = createGeneticsRoutingRecord({
  profileSlug: 'andes-origin',
  dropId: 'sierra',
  company: 'Real Operator GmbH',
  contactName: 'Hans',
  email: 'hans@operator.de',
  country: 'Germany',
  intent: 'territory_discussion',
  targetMarket: 'Germany',
  licenceStatus: 'licensed',
  targetUse: 'Commercial rollout',
  quantityOrScale: 'large',
  timeline: '2026',
  canShareInquiryWithGeneticsHolder: true,
})

if (record.score < 70) failures.push('Expected high score')
if (!record.introductionReady) failures.push('Expected intro readiness')
if (record.status !== 'ready_for_intro') failures.push('Expected ready_for_intro status')

if (failures.length) {
  console.error('Execution test failed')
  failures.forEach((f) => console.error(f))
  process.exit(1)
}

console.log('ok genetics routing execution')
