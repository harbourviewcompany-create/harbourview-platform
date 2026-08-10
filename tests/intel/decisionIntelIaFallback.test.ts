import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const iaDb = readFileSync('lib/intelligence-automation/db.ts', 'utf8')

describe('Decision Intelligence IA fallback compatibility', () => {
  it('uses the exact-id IA accessor rather than the 200-row list window', () => {
    expect(iaDb).toContain('export async function getIaSignalById')
    expect(iaDb).toContain('/rest/v1/ia_signals?id=eq.${encodeURIComponent(id)}&select=*&limit=1')
    expect(dossierLoader).toContain("import { getIaSignalById } from '@/lib/intelligence-automation/db'")
    expect(dossierLoader).toContain('const result = await getIaSignalById(signalId)')
    expect(dossierLoader).not.toContain('const result = await listIaSignals()')
  })

  it('still suppresses archived IA records after the exact lookup', () => {
    expect(dossierLoader).toContain("result.data.stage === 'archived'")
    expect(dossierLoader).toContain('return mapIaSignal(result.data, eventId)')
  })
})
