#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

function fail(message) {
  console.error(`Cloudflare architecture HOLD: ${message}`)
  process.exitCode = 1
}

const worker = read('wrangler.toml')
const preview = read('config/cloudflare/wrangler.web-preview.example.toml')
const targets = read('docs/control/DEPLOYMENT_TARGETS.md')
const manifest = JSON.parse(read('config/environment-manifest.json'))

if (!/^name\s*=\s*"harbourview"\s*$/m.test(worker)) fail('root wrangler.toml must target Worker name "harbourview"')
if (!/^main\s*=\s*"scripts\/engine\/cloudflare-worker\.ts"\s*$/m.test(worker)) fail('root wrangler.toml must keep the intelligence/health entrypoint')
if (/^\s*\[triggers\]\s*$/m.test(worker) || /^\s*crons\s*=/m.test(worker)) fail('root Worker must not declare Cron Triggers while Supabase pg_cron owns ingestion')
if (/\.open-next\/worker\.js/.test(worker)) fail('root Worker must not be repurposed as the OpenNext web application')
if (/GOOGLE_GENAI_API_KEY|wrangler secret put ANTHROPIC_API_KEY/.test(worker)) fail('root Worker contains stale provider-secret guidance unrelated to /healthz')

if (!/^name\s*=\s*"harbourview-platform-web-preview"\s*$/m.test(preview)) fail('reserved web-preview Worker name changed')
if (!/^main\s*=\s*"\.open-next\/worker\.js"\s*$/m.test(preview)) fail('web-preview template must point at OpenNext worker output')
if (!/^binding\s*=\s*"ASSETS"\s*$/m.test(preview) || !/^directory\s*=\s*"\.open-next\/assets"\s*$/m.test(preview)) fail('web-preview template must declare the OpenNext ASSETS binding')
if (/^\s*\[triggers\]\s*$/m.test(preview) || /^\s*crons\s*=/m.test(preview)) fail('web-preview template must not declare Cron Triggers')
if (/^\s*(routes?|route)\s*=/m.test(preview)) fail('web-preview template must not attach routes/custom domains')

if (!targets.includes('Vercel | Primary production web target')) fail('Vercel production-web authority is no longer explicit')
if (!targets.includes('Cloudflare web production GO | **HOLD**')) fail('Cloudflare web production HOLD control is missing')
if (!targets.includes('Supabase Edge Functions + `pg_cron` remain the production intelligence-ingestion authority')) fail('Supabase ingestion authority is not explicit')

const healthUrl = manifest.variables.find((entry) => entry.name === 'NEXT_PUBLIC_SUPABASE_URL')
const healthKey = manifest.variables.find((entry) => entry.name === 'SUPABASE_SERVICE_ROLE_KEY')
if (healthUrl?.cloudflare?.intelligenceHealthWorker !== 'Settings → Variables and Secrets → Variable') fail('health Worker Supabase URL placement is incorrect')
if (healthKey?.cloudflare?.intelligenceHealthWorker !== 'Settings → Variables and Secrets → Secret') fail('health Worker service-role placement is incorrect')

const assets = (manifest.cloudflareBindings ?? []).find((binding) => binding.name === 'ASSETS')
if (!assets || assets.target !== 'future-next-web-preview') fail('future OpenNext ASSETS binding is not declared in the environment manifest')

if (process.exitCode) process.exit(process.exitCode)
console.log('Cloudflare architecture GO: health Worker and future OpenNext web-preview target remain separate; ingestion stays Supabase-authoritative.')
