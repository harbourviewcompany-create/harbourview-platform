import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const identity = readFileSync('supabase/migrations/20260815162000_talent_p0_taxonomy_identity_evidence.sql', 'utf8')
const jobs = readFileSync('supabase/migrations/20260815163000_talent_p0_employer_jobs_ingestion.sql', 'utf8')
const passport = readFileSync('supabase/migrations/20260815164000_talent_p0_passport_privacy.sql', 'utf8')
const workflow = readFileSync('supabase/migrations/20260815165000_talent_p0_search_match_application.sql', 'utf8')
const api = readFileSync('supabase/migrations/20260815170000_talent_p0_api_backfill_rls.sql', 'utf8')

describe('Talent P0 canonical schema controls', () => {
  it('separates canonical people from application participation', () => {
    expect(identity).toContain('CREATE TABLE IF NOT EXISTS public.talent_people')
    expect(workflow).toContain('CREATE TABLE IF NOT EXISTS public.talent_applications')
    expect(workflow).toContain('person_id uuid REFERENCES public.talent_people')
  })

  it('keeps person/job identity resolution reversible', () => {
    expect(identity).toContain('talent_person_merge_events')
    expect(identity).toContain('before_snapshot jsonb NOT NULL')
    expect(jobs).toContain('talent_job_identity_events')
    expect(jobs).toContain("'reversed'")
  })

  it('models source rights, freshness and immutable source snapshots separately', () => {
    expect(jobs).toContain('talent_source_rights')
    expect(jobs).toContain('talent_job_snapshots')
    expect(jobs).toContain('talent_job_freshness_events')
    expect(api).toContain('UNREVIEWED legacy source; public/derived use disabled')
  })

  it('preserves professional-directory facts without manufacturing credential authority', () => {
    expect(api).toContain('legacy_credential_type')
    expect(api).not.toMatch(/INSERT INTO public\.talent_professional_credentials[\s\S]*FROM public\.hv_professionals/i)
  })

  it('authorizes candidate retrieval before returning discoverable records', () => {
    expect(api).toContain('public.talent_can_search_people')
    expect(api).toContain('TALENT_SEARCH_FORBIDDEN')
    expect(api).toContain('talent_employer_blocks')
    expect(api).not.toContain('GRANT SELECT ON public.talent_person_search_documents TO authenticated')
  })

  it('does not expose private Talent base tables directly to browser roles', () => {
    for (const migration of [identity, jobs, passport, workflow]) {
      expect(migration).toContain('REVOKE ALL ON TABLE public.%I FROM public, anon, authenticated')
    }
  })

  it('keeps the legacy public job DTO allowlisted during canonical convergence', () => {
    expect(api).toContain('CREATE VIEW api.talent_jobs_public')
    expect(api).toContain('CREATE OR REPLACE VIEW api.talent_job_opportunities_public')
    expect(api).not.toMatch(/SELECT\s+j\.\*/i)
  })

  it('moves public apply to the canonical application service and freezes direct legacy insert', () => {
    expect(api).toContain('api.talent_submit_application')
    expect(api).toContain('DROP POLICY IF EXISTS talent_candidates_public_apply')
    expect(api).toContain('LEGACY_CURRENT_STATE_ONLY')
  })
})
