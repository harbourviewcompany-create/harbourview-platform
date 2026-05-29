import { execSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const compiledPath = resolve('.tmp/genetics-profile-redaction/geneticsProfiles.js')

try {
  mkdirSync(dirname(compiledPath), { recursive: true })
  execSync(
    `npx tsc lib/marketplace/geneticsProfiles.ts --target ES2022 --module ES2022 --moduleResolution bundler --outDir ${dirname(compiledPath)} --skipLibCheck --noEmitOnError false`,
    { stdio: 'pipe' },
  )

  const { geneticsProfiles } = await import(pathToFileURL(compiledPath).href)

  const forbiddenFields = ['contactName', 'contactEmail', 'phone', 'sourceUrl', 'internalReviewNotes']
  const serialized = JSON.stringify(geneticsProfiles)

  const leaks = forbiddenFields.filter((field) => serialized.includes(field))

  if (leaks.length > 0) {
    console.error(`genetics profile redaction failed: ${leaks.join(', ')}`)
    process.exit(1)
  }

  for (const profile of geneticsProfiles) {
    if (!profile.slug || !profile.title || !profile.summary) {
      console.error(`genetics profile missing public fields: ${profile.id ?? 'unknown'}`)
      process.exit(1)
    }
  }
} finally {
  rmSync(resolve('.tmp/genetics-profile-redaction'), { recursive: true, force: true })
}

console.log('ok genetics profile redaction')
