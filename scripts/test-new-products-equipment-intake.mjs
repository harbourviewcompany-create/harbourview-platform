#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20260308000000_new_products_equipment_intake.sql', 'utf8');
const projection = readFileSync('lib/marketplace/newProductsPublic.ts', 'utf8');
const page = readFileSync('app/marketplace/new-products/page.tsx', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(migration.includes('image_reviewed_at'), 'reviewed image validation missing');
assert(migration.includes("marketplace_category in ('Consumables & Operating Supplies', 'New Products')"), 'category extension missing');
assert(migration.includes('equipment_supply'), 'equipment candidate type missing');
assert(projection.includes('approved_draft'), 'approved-only projection missing');
assert(projection.includes('Price on request'), 'source pricing suppression missing');
assert(projection.includes('Available on inquiry'), 'supplier exposure suppression missing');
assert(page.includes('getApprovedEquipmentListings'), 'new products page not wired to approved equipment pipeline');
assert(page.includes('approvedEquipment.length > 0'), 'fixture fallback preservation missing');
assert(packageJson.includes('test:new-products-equipment-intake'), 'equipment intake test script missing');

for (const forbidden of ['sourceUrl','sourceName','contactEmail','provenance','evidence','pricing metadata','internal notes','review metadata']) {
  assert(!projection.includes(forbidden), `public projection leaked ${forbidden}`);
}

if (failures.length) {
  console.error('FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PASS controlled equipment intake leakage regression checks');
