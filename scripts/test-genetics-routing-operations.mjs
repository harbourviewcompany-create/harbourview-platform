import fs from 'fs'

const failures = []

const apiFile = fs.readFileSync('app/api/genetics-routing/requests/route.ts','utf-8')

if (!apiFile.includes('createGeneticsRoutingRecord')) {
  failures.push('API route not wired to routing execution')
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
