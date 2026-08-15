import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const peopleRoute = readFileSync('app/api/talent/people/search/route.ts','utf8')
const jobsRoute = readFileSync('app/api/talent/jobs/search/route.ts','utf8')
const talentSection = readFileSync('components/dashboard/mobile-command/sections/TalentSection.tsx','utf8')
const sections = readFileSync('components/dashboard/mobile-command/Sections.tsx','utf8')
const fixtures = readFileSync('components/dashboard/data/jobsBoard.ts','utf8')
const apiMigration = readFileSync('supabase/migrations/20260815170000_talent_p0_api_backfill_rls.sql','utf8')
const authorityMigration = readFileSync('supabase/migrations/20260815172000_talent_p0_authority_contract_fixes.sql','utf8')
const professionalCompat = readFileSync('supabase/migrations/20260815173000_talent_p0_professional_compatibility.sql','utf8')

describe('Talent P0 privacy and cutover contracts', () => {
  it('does not serialize candidate contacts or evidence in Find Talent DTO construction', () => {
    expect(peopleRoute).not.toMatch(/row\.(email|phone|contact|source_url|storage_path|evidence)/)
    expect(peopleRoute).toContain('TalentCandidateDTO')
  })

  it('enforces verified employer authority and blocks before candidate retrieval', () => {
    expect(authorityMigration).toContain("w.verification_status = 'verified'")
    expect(authorityMigration).toContain("public.talent_has_entitlement(p_workspace_id, 'talent.people.search'")
    expect(authorityMigration).toContain('NOT EXISTS (\n      SELECT 1 FROM public.talent_employer_blocks')
  })

  it('keeps canonical public job reads allowlisted and source-governed', () => {
    expect(apiMigration).toContain('api.talent_job_opportunities_public')
    expect(apiMigration).not.toMatch(/CREATE OR REPLACE VIEW api\.talent_job_opportunities_public[\s\S]{0,200}SELECT\s+\*/i)
    expect(jobsRoute).toContain("Cache-Control': 'no-store")
  })

  it('eliminates fixture jobs from the production Command result path', () => {
    expect(fixtures).toContain('export const JOB_LISTINGS: JobListing[] = []')
    expect(sections).toContain("export { TalentSection } from './sections/TalentSection'")
    expect(sections).not.toMatch(/TalentSection,[\s\S]*from '\.\/sections\/OperationsSections'/)
    expect(talentSection).toContain('/api/talent/jobs/search')
  })

  it('preserves the clinical professional directory through the Passport-backed compatibility view', () => {
    expect(professionalCompat).toContain('CREATE VIEW api.hv_professionals')
    expect(professionalCompat).toContain("p.legacy_verification_status='verified'")
    expect(professionalCompat).toContain("v.visibility_mode='public'")
  })
})
