#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const route = readFileSync('app/api/smoke/marketplace/route.ts', 'utf8');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(route.includes("readEnv('SUPABASE_SERVICE_ROLE_KEY')"), 'route must read the server-only database key');
assert(route.includes('smoke verifier service role not configured'), 'route must fail closed when the server-only database key is absent');
assert(route.includes("HARBOURVIEW_SMOKE_ROUTE_SECRET"), 'route must require a caller smoke route secret');
assert(route.includes("smoke route secret not configured"), 'route must fail closed when caller smoke route secret is absent');
assert(route.includes("HARBOURVIEW_SMOKE_WRITE"), 'route must require the smoke write gate');
assert(route.includes("HARBOURVIEW_SMOKE_CLEANUP"), 'route must require the smoke cleanup gate');
assert(route.includes("HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES"), 'route must require the production smoke override');
assert(route.includes("apikey: serviceRoleKey"), 'RPC must use server-only credentials as apikey');
assert(route.includes("Authorization: 'Bearer ' + serviceRoleKey"), 'RPC must use server-only bearer credentials');
assert(!route.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'route must not use anon key');
assert(!route.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), 'route must not use publishable key');
assert(!route.includes('candidateClientKeys'), 'route must not fall back to client keys');

if (failures.length) {
  console.error('Smoke marketplace route guard test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok smoke route requires caller secret plus write and cleanup gates');
console.log('ok production smoke requires production override');
console.log('ok smoke route fails closed without server-only database key');
console.log('ok smoke RPC uses server-only credentials only');
