import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const completionMigration = readFileSync('supabase/migrations/20260810202000_decision_intel_stage0_completion_hardening.sql', 'utf8')
const dossierLoader = readFileSync('lib/intelligence-os/decisionDossier.ts', 'utf8')
const dossierPage = readFileSync('app/dashboard/intel/events/[id]/page.tsx', 'utf8')

describe('Decision Intelligence canonical jurisdiction navigation', () => {
  it('projects a stable canonical jurisdiction id and ISO-2 navigation key', () => {
    expect(completionMigration).toContain('e.jurisdiction_id')
    expect(completionMigration).toContain('max(jx.canonical_iso2) as jurisdiction_iso2')
    expect(completionMigration).toContain('left join public.jurisdiction_crossref jx on jx.jurisdictions_id = e.jurisdiction_id')
    expect(dossierLoader).toContain('jurisdictionId: text(row.jurisdiction_id)')
    expect(dossierLoader).toContain('jurisdictionIso2: text(row.jurisdiction_iso2)')
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
