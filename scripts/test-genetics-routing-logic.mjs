import { scoreGeneticsAccessRequest, canTriggerGeneticsIntroduction } from '../lib/introduction-routing/geneticsRouting.js'
import { geneticsProfiles } from '../lib/marketplace/geneticsProfiles.js'

const failures = []

const strongRequest = {
  intent: 'genetics_licensing',
  targetMarket: 'Germany',
  licenceStatus: 'licensed',
  hasClearUse: true,
  hasTimeline: true,
  hasScale: true,
  identityVerified: true,
  credibleCompany: true,
}

const weakRequest = {
  intent: '',
  targetMarket: '',
  licenceStatus: '',
  hasClearUse: false,
  hasTimeline: false,
  hasScale: false,
  identityVerified: false,
  credibleCompany: false,
}

const strongScore = scoreGeneticsAccessRequest(strongRequest)
const weakScore = scoreGeneticsAccessRequest(weakRequest)

if (strongScore.total < 70) failures.push('Strong request did not qualify')
if (weakScore.total >= 55) failures.push('Weak request incorrectly qualified')

const drop = geneticsProfiles[0].currentDrops[0]

if (!canTriggerGeneticsIntroduction(strongScore.total, drop)) {
  failures.push('Qualified request did not trigger intro')
}

if (canTriggerGeneticsIntroduction(40, drop)) {
  failures.push('Low score incorrectly triggered intro')
}

if (failures.length) {
  console.error('Routing test failed:')
  failures.forEach((f) => console.error(f))
  process.exit(1)
}

console.log('ok genetics routing logic')
