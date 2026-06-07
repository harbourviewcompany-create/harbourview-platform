import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync('supabase/migrations/20260607120000_cannabis_data_contract_v1_p0_p1.sql', 'utf8')
const seed = readFileSync('supabase/seeds/cannabis_data_contract_v1_taxonomy.sql', 'utf8')

const requiredTables = [
  'jurisdictions',
  'jurisdiction_aliases',
  'jurisdiction_relationships',
  'plant_product_categories',
  'product_forms',
  'activity_product_matrix',
  'source_documents',
  'evidence_claims',
  'data_gaps',
  'legal_regimes',
  'regulatory_authorities',
  'legal_thresholds',
  'laws_regulations',
  'authority_responsibilities',
  'licence_types',
  'licence_registers',
  'licensed_entities',
  'entity_licences',
  'medical_access_pathways',
  'import_export_rules',
  'contradictions',
  'review_tasks',
  'fact_evidence_links',
]

const requiredEnums = [
  'jurisdiction_type',
  'sovereignty_status',
  'activity_type',
  'legal_status',
  'operational_status',
  'regulator_type',
  'licence_category',
  'licence_status',
  'entity_type',
  'source_type',
  'source_reliability_tier',
  'evidence_status',
  'exposure_level',
  'gap_type',
  'contradiction_status',
  'review_status',
  'update_frequency',
]

const confidenceTables = [
  'evidence_claims',
  'data_gaps',
  'legal_regimes',
  'regulatory_authorities',
  'legal_thresholds',
  'laws_regulations',
  'authority_responsibilities',
  'licence_types',
  'licence_registers',
  'licensed_entities',
  'entity_licences',
  'medical_access_pathways',
  'import_export_rules',
]

describe('cannabis data-contract migration', () => {
  it('defines all required stable enums and P0/P1 tables', () => {
    for (const enumName of requiredEnums) {
      expect(migration).toContain(`create type cannabis_intelligence.${enumName}`)
    }

    for (const tableName of requiredTables) {
      expect(migration).toContain(`create table if not exists cannabis_intelligence.${tableName}`)
    }
  })

  it('uses confidence constraints, foreign keys, indexes, and non-destructive creation', () => {
    for (const tableName of confidenceTables) {
      const tableBlock = migration.slice(
        migration.indexOf(`create table if not exists cannabis_intelligence.${tableName}`),
        migration.indexOf(');', migration.indexOf(`create table if not exists cannabis_intelligence.${tableName}`)),
      )
      expect(tableBlock).toMatch(/confidence_score[\s\S]*check \(confidence_score between 0 and 100\)/)
    }

    expect(migration).toContain('references cannabis_intelligence.jurisdictions(id)')
    expect(migration).toContain('references cannabis_intelligence.source_documents(id)')
    expect(migration).toContain('references cannabis_intelligence.evidence_claims(id)')
    expect(migration).toContain('idx_ci_legal_regimes_jurisdiction_category_activity_status')
    expect(migration).not.toMatch(/\bdrop\s+table\b|\balter\s+table[\s\S]*\bdrop\s+column\b|\btruncate\b/i)
  })

  it('enables RLS and does not create anon-readable raw-table policies', () => {
    for (const tableName of requiredTables) {
      expect(migration).toContain(`alter table cannabis_intelligence.${tableName} enable row level security`)
    }

    expect(migration).toContain('revoke all on schema cannabis_intelligence from anon')
    expect(migration).toContain('revoke all on all tables in schema cannabis_intelligence from anon')
    expect(migration).not.toMatch(/create\s+policy[\s\S]+to\s+anon/i)
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i)
  })

  it('stores unknowns as generated data gaps for arbitrary inserted jurisdictions', () => {
    expect(migration).toContain('create or replace function cannabis_intelligence.generate_mandatory_data_gaps(target_jurisdiction_id uuid)')
    expect(migration).toContain('from cannabis_intelligence.activity_product_matrix apm')
    expect(migration).toContain("'Auto-generated mandatory coverage gap; no legal fact has been populated.'")
    expect(migration).toContain('after insert on cannabis_intelligence.jurisdictions')
    expect(migration).toContain('for each row execute function cannabis_intelligence.generate_mandatory_data_gaps_for_new_jurisdiction()')
  })

  it('requires contradictions and multi-source provenance instead of overwriting claims', () => {
    expect(migration).toContain("subject_table text not null check (subject_table in ('legal_regimes'")
    expect(migration).toContain("relationship_type cannabis_intelligence.evidence_relationship_type not null")
    expect(migration).toContain("'supports','contradicts','supersedes','clarifies','background'")
    expect(migration).toContain('supersedes_record_id uuid references cannabis_intelligence.legal_regimes(id)')
    expect(migration).toContain('Contradictory claims are recorded here rather than overwritten')
  })

  it('keeps licence types, licence registers, and licensed entities structurally separate', () => {
    expect(migration).toContain('create table if not exists cannabis_intelligence.licence_types')
    expect(migration).toContain('create table if not exists cannabis_intelligence.licence_registers')
    expect(migration).toContain('create table if not exists cannabis_intelligence.licensed_entities')
    expect(migration).toContain('create table if not exists cannabis_intelligence.entity_licences')
    expect(migration).toContain('extraction_status cannabis_intelligence.coverage_status not null default')
  })
})

describe('cannabis data-contract taxonomy seed', () => {
  it('seeds only required taxonomy and coverage matrix values', () => {
    for (const slug of [
      'cannabis_high_thc',
      'medical_cannabis',
      'pharmaceutical_cannabinoid',
      'cbd',
      'industrial_hemp',
      'intoxicating_hemp_derived_cannabinoid',
      'other_cannabis_plant_related',
    ]) {
      expect(seed).toContain(`'${slug}'`)
    }

    for (const form of ['dried_flower', 'hashish', 'vape_cartridge', 'api_active_pharmaceutical_ingredient', 'finished_medicine']) {
      expect(seed).toContain(`'${form}'`)
    }

    for (const activity of ['adult_use_sale', 'medical_use', 'import', 'export', 'public_procurement']) {
      expect(seed).toContain(`'${activity}'::cannabis_intelligence.activity_type`)
    }

    expect(seed).toContain('cross join cannabis_intelligence.plant_product_categories')
  })

  it('does not seed fake jurisdictions, regulators, legal facts, registers, licensees, or commercial claims', () => {
    expect(seed).not.toMatch(/insert\s+into\s+cannabis_intelligence\.(jurisdictions|legal_regimes|regulatory_authorities|licence_registers|licensed_entities|entity_licences|medical_access_pathways|import_export_rules)/i)
    const seedWithoutComments = seed.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')
    expect(seedWithoutComments).not.toMatch(/\b(germany|canada|uruguay|colorado)\b/i)
  })
})
