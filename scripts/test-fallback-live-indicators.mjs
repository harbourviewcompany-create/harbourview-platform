import fs from 'node:fs'

const serviceLib = fs.readFileSync('lib/marketplace/liveServices.ts', 'utf8')
const servicePage = fs.readFileSync('app/marketplace/services/page.tsx', 'utf8')
const signalsLib = fs.readFileSync('lib/regulatory-signals/public.ts', 'utf8')
const signalsPage = fs.readFileSync('app/signals/page.tsx', 'utf8')

const requiredServiceLib = ['source:', 'live-approved', 'fallback-fixture', 'publicLabel', 'reviewBoundary']
const requiredServicePage = ['ContentStatusNotice', 'serviceFeed.publicLabel', 'serviceFeed.reviewBoundary']
const requiredSignalsLib = ['PublicRegulatorySignalFeed', 'live-approved', 'fallback-fixture', 'publicLabel', 'reviewBoundary']
const requiredSignalsPage = ['ContentStatusNotice', 'signalFeed.publicLabel', 'signalFeed.reviewBoundary']

const missingServiceLib = requiredServiceLib.filter((text) => !serviceLib.includes(text))
const missingServicePage = requiredServicePage.filter((text) => !servicePage.includes(text))
const missingSignalsLib = requiredSignalsLib.filter((text) => !signalsLib.includes(text))
const missingSignalsPage = requiredSignalsPage.filter((text) => !signalsPage.includes(text))

if (missingServiceLib.length || missingServicePage.length || missingSignalsLib.length || missingSignalsPage.length) {
  console.error(JSON.stringify({ missingServiceLib, missingServicePage, missingSignalsLib, missingSignalsPage }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true }, null, 2))
