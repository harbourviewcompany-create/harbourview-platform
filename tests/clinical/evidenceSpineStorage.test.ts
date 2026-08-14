import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260814121500_clinical_evidence_spine.sql'), 'utf8')
const explorer = fs.readFileSync(path.join(root, 'components/dashboard/mobile-command/ClinicalEvidenceExplorer.tsx'), 'utf8')
const query = fs.readFileSync(path.join(root, 'lib/server/clinicalEvidenceQuery.ts'), 'utf8')
const route = fs.readFileSync(path.join(root, 'app/api/clinical/evidence/route.ts'), 'utf8')

describe('clinical evidence storage and public boundary', () => {
  it('requires provenance, verification and supersession metadata', () => {
    for (const field of [
      'primary_source_title',
      'primary_source_publisher',
      'primary_source_url',
      'verified_at',
      'supersession_state',
      'evidence_strength',
      'conflict_status',
    ]) expect(migration).toContain(field)
  })

  it('keeps the evidence spine separate from patient, marketplace and genetics storage', () => {
    expect(migration).not.toMatch(/references\s+public\.clinical_patients/i)
    expect(migration).not.toMatch(/references\s+public\.(marketplace|listings|cultivar|genetics)/i)
    expect(query).not.toMatch(/clinical_patients|marketplace|cultivar|genetics/i)
  })

  it('publishes only reviewed records and change events through RLS', () => {
    expect(migration).toContain('alter table public.clinical_evidence_records enable row level security')
    expect(migration).toContain('alter table public.clinical_evidence_change_events enable row level security')
    expect(migration).toContain("review_status = 'published'")
    expect(migration).toContain('grant select on public.clinical_evidence_records to anon, authenticated')
    expect(migration).toContain('grant all on public.clinical_evidence_records to service_role')
  })

  it('uses a complete RLS-preserving server-side search contract', () => {
    expect(migration).toContain('function public.search_clinical_evidence_records')
    expect(migration).toContain('security invoker')
    expect(migration).toContain('function public.clinical_condition_term_known')
    expect(query).toContain("rpc<Row[]>('search_clinical_evidence_records'")
    expect(query).toContain("rpc<boolean>('clinical_condition_term_known'")
  })

  it('does not expose profession filtering before role vocabulary reconciliation', () => {
    expect(query).toContain('Profession relevance remains evidence metadata only')
    expect(query).not.toContain('profession_relevance,cs')
    expect(route).not.toContain('profession:')
    expect(route).not.toContain("searchParams.get('profession')")
    expect(explorer).not.toContain("params.set('profession'")
  })

  it('exposes accessible search and source links', () => {
    expect(explorer).toContain('role="search"')
    expect(explorer).toContain('aria-live="polite"')
    expect(explorer).toContain('htmlFor="clinical-evidence-query"')
    expect(explorer).toContain('rel="noreferrer"')
    expect(explorer).toContain('Primary source ↗')
  })
})
