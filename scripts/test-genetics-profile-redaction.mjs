import { execSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const outDir = '.tmp/genetics-profile-redaction-test'
rmSync(outDir, { recursive: true, force: true })
mkdirSync(`${outDir}/empty-types`, { recursive: true })
execSync(
  `npx tsc lib/marketplace/geneticsProfiles.ts --module commonjs --target es2020 --moduleResolution node --esModuleInterop --skipLibCheck --typeRoots ${outDir}/empty-types --outDir ${outDir}`,
  { stdio: 'inherit' },
)

const { geneticsProfiles, toPublicGeneticsProfile } = await import(
  pathToFileURL(`${process.cwd()}/${outDir}/geneticsProfiles.js`)
)

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
  failures.forEach((failure) => console.error(failure))
  process.exit(1)
}

console.log('ok genetics profile redaction')
