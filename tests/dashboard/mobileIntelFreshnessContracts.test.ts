import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mobileModel = readFileSync('components/dashboard/mobile-command/useMobileCommandModel.ts', 'utf8')
const realtimeHook = readFileSync('components/dashboard/useDashboardSignalsRealtime.ts', 'utf8')
const signalRoute = readFileSync('app/api/dashboard/signals/route.ts', 'utf8')
const sections = readFileSync('components/dashboard/mobile-command/Sections.tsx', 'utf8')
const personal = readFileSync('components/dashboard/mobile-command/sections/PersonalBriefingLiveSection.tsx', 'utf8')
const synth = readFileSync('lib/intelligence/jurisdictionSynthesisFresh.ts', 'utf8')
const synthBridge = readFileSync('lib/intelligence/jurisdictionSynthesis.ts', 'utf8')
const synthCron = readFileSync('app/api/cron/synthesize-jurisdictions/route.ts', 'utf8')
const migration = readFileSync('supabase/migrations/20260827234500_signal_freshness_timeline.sql', 'utf8')

describe('Mobile Intel freshness and briefing contracts', () => {
  it('uses one canonical realtime signal feed instead of an enriched second-pass swap', () => {
    expect(mobileModel).toContain('useDashboardSignalsRealtime')
    expect(mobileModel).toContain('props.signals')
    expect(mobileModel).not.toContain('setEnrichedSignals')
    expect(mobileModel).not.toContain("fetch(`/api/dashboard/signals")
    expect(realtimeHook).toContain('canonicalizeDashboardSignals')
    expect(realtimeHook).toContain("cache: 'no-store'")
    expect(realtimeHook).toContain("{ event: '*', schema: 'public', table: 'signals' }")
  })

  it('keeps API candidate order recency-first and final selection freshness-gated', () => {
    const dateOrder = signalRoute.indexOf(".order('date'")
    const confidenceOrder = signalRoute.indexOf(".order('quality_confidence'")
    expect(dateOrder).toBeGreaterThan(-1)
    expect(confidenceOrder).toBeGreaterThan(dateOrder)
    expect(signalRoute).toContain('canonicalizeDashboardSignals')
    expect(signalRoute).toContain('WEEKLY_SIGNAL_WINDOW_DAYS')
    expect(signalRoute).toContain("'Cache-Control': 'private, no-store, max-age=0'")
  })

  it('binds the mobile Personal briefing route to actual personal, synth and static API outputs', () => {
    expect(sections).toContain("export { PersonalBriefingSection } from './sections/PersonalBriefingLiveSection'")
    expect(personal).toContain("fetch('/api/dashboard/my-briefings'")
    expect(personal).toContain('state.data?.personal?.narrative')
    expect(personal).toContain('state.data?.synthBriefings')
    expect(personal).toContain('state.data?.staticBriefings')
    expect(personal).toContain('generated_at')
    expect(personal).toContain('week_ending')
    expect(personal).toContain("isStale ? 'Stale' : 'Current'")
  })

  it('bounds synthesis evidence and rotates fixed-time daily cron batches by day rather than hour', () => {
    expect(synthBridge).toContain("export * from './jurisdictionSynthesisFresh'")
    expect(synth).toContain('PRIMARY_WINDOW_DAYS = 30')
    expect(synth).toContain('FALLBACK_WINDOW_DAYS = 45')
    expect(synth).toContain(".gte('created_at', createdCutoff)")
    expect(synth).not.toContain('regardless of date')
    expect(synth).toContain('const dayIndex = Math.floor(Date.now() / DAY_MS)')
    expect(synth).not.toContain('new Date().getUTCHours()')
    expect(synthCron).toContain('synthesiseJurisdictionBatch')
    expect(synthCron).toContain('DEFAULT_BATCH = 4')
  })

  it('keeps current briefings publishable without inventing facts when the LLM provider is unavailable', () => {
    expect(synth).toContain("DETERMINISTIC_MODEL = 'deterministic-bounded-v1'")
    expect(synth).toContain('deterministicBriefing')
    expect(synth).toContain("legal_status: 'unknown'")
    expect(synth).toContain("market_maturity: 'unknown'")
    expect(synth).toContain('Older developments were intentionally not reused')
    expect(synth).toContain('claudeCircuitOpen')
    expect(synth).toContain('model_used: modelUsed')
  })

  it('adds separate publication, event, observation and ingestion timestamps without deleting history', () => {
    for (const column of ['source_published_at', 'event_effective_at', 'observed_at', 'ingested_at']) {
      expect(migration).toContain(column)
    }
    expect(migration).toContain('https://sibiz.eu/slovenia-legalizes-medical-cannabis-marijuana-new-law-effective-from-august-20-2025/')
    expect(migration).toContain("source_published_at = '2025-08-22T00:00:00Z'")
    expect(migration).toContain("event_effective_at = '2025-08-20T00:00:00Z'")
    expect(migration).not.toContain('delete from public.signals')
    expect(migration).toContain('create or replace view api.signals_with_quality')
  })
})
