import { geneticsProfiles, toPublicGeneticsProfile } from '../lib/marketplace/geneticsProfiles.js'

const failures = []

for (const profile of geneticsProfiles) {
  const pub = toPublicGeneticsProfile(profile)

  if (profile.disclosureLevel === 'level_1_public_showcase_approved') {
    if (!pub.profileName) failures.push('Missing public profile name')
    if (pub.contactName || pub.email) failures.push('Leaked contact fields')
  }

  if (profile.disclosureLevel === 'level_0_anonymous_opportunity') {
    if (pub.profileName === profile.profileName) failures.push('Anonymous profile leaked identity')
  }
}

if (failures.length) {
  console.error('Genetics redaction failed:')
  failures.forEach((f) => console.error(f))
  process.exit(1)
}

console.log('ok genetics profile redaction')
