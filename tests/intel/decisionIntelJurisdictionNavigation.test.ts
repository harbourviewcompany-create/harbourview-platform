import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const withdrawnBaselines = readFileSync('supabase/release-controls/withdrawn-baseline-migrations.json', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')

describe('Decision Intelligence canonical jurisdiction navigation', () => {
  it('records the historical Stage 0 completion migration as withdrawn rather than requiring an unavailable SQL body', () => {
    expect(withdrawnBaselines).toContain('20260810202000')
    expect(withdrawnBaselines).toContain('"disposition":"withdrawn_historical_body"')
    expect(withdrawnBaselines).toContain('Do not reconstruct or replay')
  })

  it('links only canonically resolved jurisdictions into the existing country command context', () => {
    expect(dossierPage).toContain('const jurisdictionHref = dossier.jurisdictionIso2')
    expect(dossierPage).toContain('/dashboard?page=countries&country=')
    expect(dossierPage).toContain('encodeURIComponent(dossier.jurisdictionIso2)')
    expect(dossierPage).toContain('{jurisdictionHref ? (')
  })

  it('does not fabricate canonical navigation metadata for legacy or IA fallbacks', () => {
    const nullAssignments = dossierLoader.match(/jurisdictionId: null,/g) ?? []
    const isoNullAssignments = dossierLoader.match(/jurisdictionIso2: null,/g) ?? []
    expect(nullAssignments).toHaveLength(2)
    expect(isoNullAssignments).toHaveLength(2)
  })
})
