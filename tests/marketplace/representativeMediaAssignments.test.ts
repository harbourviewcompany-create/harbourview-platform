import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const seedPath = path.join(process.cwd(), 'supabase', 'seeds', 'marketplace_representative_v2_assignments.sql')
const seed = fs.readFileSync(seedPath, 'utf8')

const assignmentPattern = /\('([0-9a-f-]{36})'::uuid, '([a-z0-9-]+\.png)'\)/g
const assignments = Array.from(seed.matchAll(assignmentPattern), match => ({ itemId: match[1], asset: match[2] }))

const EXPECTED_ASSETS = new Set([
  'advisory-services.png',
  'bulk-flower.png',
  'cultivation-inputs.png',
  'extraction-equipment.png',
  'facility-supplies.png',
  'grow-lighting.png',
  'hemp-biomass.png',
  'lab-qa.png',
  'packaging-equipment.png',
  'packaging-pouches.png',
  'product-inventory.png',
  'retail-facility.png',
  'warehouse-logistics.png',
])

describe('marketplace representative V2 assignment manifest', () => {
  it('pins every verified production listing exactly once', () => {
    expect(assignments).toHaveLength(151)
    expect(new Set(assignments.map(row => row.itemId)).size).toBe(151)
  })

  it('uses only the reviewed representative catalogue asset set', () => {
    expect(new Set(assignments.map(row => row.asset))).toEqual(EXPECTED_ASSETS)
  })

  it('keeps generated media illustrative and preserves higher-trust media precedence', () => {
    expect(seed).toContain("image_class='HARBOURVIEW_ILLUSTRATIVE'")
    expect(seed).toContain("'HARBOURVIEW_ILLUSTRATIVE','CARD','HARBOURVIEW_CREATED'")
    expect(seed).toContain("is_evidence_image=false")
    expect(seed).toContain("is_illustrative=true")
    expect(seed).toContain("'Representative image — not actual inventory.'")
    expect(seed).toContain("i.image_class in ('REAL_ITEM_EVIDENCE','MANUFACTURER_CATALOGUE')")
  })

  it('pins the semantic corrections made during the production rollout', () => {
    const byId = new Map(assignments.map(row => [row.itemId, row.asset]))
    expect(byId.get('b0959d9f-8a20-4d64-be2d-07841c21eead')).toBe('bulk-flower.png')
    expect(byId.get('08e59baa-69fc-41d9-8fe8-678d632ad114')).toBe('bulk-flower.png')
    expect(byId.get('a6b55ae7-deaa-4b05-b4e6-88f87e0c0564')).toBe('bulk-flower.png')
    expect(byId.get('2c01b346-f89a-41d3-b20c-f4c292e1e635')).toBe('packaging-equipment.png')
    expect(byId.get('87695f8a-3af6-4ceb-aa77-850b465cccbb')).toBe('packaging-equipment.png')
    expect(byId.get('4ae963af-c3d2-4d63-b971-52802db324e8')).toBe('packaging-equipment.png')
    expect(byId.get('11eecb63-7e8d-4906-bf71-6f542c95c2dd')).toBe('cultivation-inputs.png')
    expect(byId.get('5d678230-8bc5-4a0e-8ddc-66778d126b76')).toBe('facility-supplies.png')
  })
})
