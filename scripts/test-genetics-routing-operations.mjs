import fs from 'fs'

const failures = []

const apiFile = fs.readFileSync('app/api/genetics-routing/requests/route.ts','utf-8')
const actionsFile = fs.readFileSync('app/api/genetics-routing/actions/route.ts','utf-8')
const operationsFile = fs.readFileSync('app/api/genetics-routing/operations/route.ts','utf-8')
const executionFile = fs.readFileSync('lib/introduction-routing/geneticsExecution.ts','utf-8')

if (!apiFile.includes('createGeneticsRoutingRecord')) {
  failures.push('API route not wired to routing execution')
}

if (apiFile.includes('success: true, record')) {
  failures.push('Public genetics request route must not return full internal record')
}

if (!apiFile.includes('requestId: record.id')) {
  failures.push('Public genetics request route must return narrow requestId DTO')
}

if (!executionFile.includes('randomUUID()')) {
  failures.push('Genetics routing records must use database-compatible UUIDs')
}

for (const [name, content] of [['actions', actionsFile], ['operations', operationsFile]]) {
  if (!content.includes('await requireAdminApiAuth()')) failures.push(`${name} route must require admin API auth`)
  if (content.indexOf('await requireAdminApiAuth()') > content.indexOf('const client = getClient()')) {
    failures.push(`${name} route must authenticate before creating service-role client`)
  }
  if (!content.includes("{ error: 'invalid_record_id' }, { status: 400 }")) failures.push(`${name} route must validate recordId`)
}

const migration = fs.readFileSync('supabase/migrations/20260306000000_genetics_routing_operations_v1.sql','utf-8')

if (!migration.includes('genetics_routing_records')) {
  failures.push('Routing records table missing')
}

if (!migration.includes('genetics_routing_events')) {
  failures.push('Routing events table missing')
}

if (failures.length) {
  console.error('Operations test failed')
  failures.forEach((f)=>console.error(f))
  process.exit(1)
}

console.log('ok genetics routing operations')
