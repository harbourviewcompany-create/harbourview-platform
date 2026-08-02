// lib/observability/structuredLog.ts
// Structured JSON logging for all pipeline stages.
// Emits to console in development, Vercel Analytics in production.

export interface ScraperMetrics {
  runId: string
  totalSources: number
  processed: number
  failed: number
  avgFetchLatencyMs: number
  avgNormaliseLatencyMs: number
  aiApiCalls: number
  aiTokensConsumed: number
  passthroughRate: number
  topErrors: Array<{ error: string; count: number }>
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  event: string
  [key: string]: unknown
}

function emit(entry: LogEntry) {
  const json = JSON.stringify(entry)
  switch (entry.level) {
    case 'error':
      console.error(json)
      break
    case 'warn':
      console.warn(json)
      break
    case 'debug':
      console.debug(json)
      break
    default:
      console.log(json)
  }
}

export function structuredLog(
  event: string,
  payload: Record<string, unknown>,
  level: LogLevel = 'info',
) {
  emit({
    timestamp: new Date().toISOString(),
    level,
    service: 'harbourview-scraper',
    event,
    ...payload,
  })
}

export function logScraperMetrics(metrics: ScraperMetrics) {
  structuredLog('scraper.metrics', metrics as unknown as Record<string, unknown>)
}

export function logSourceHealth(
  sourceId: string,
  status: 'healthy' | 'degraded' | 'failing',
  consecutiveFailures: number,
  lastError?: string,
) {
  structuredLog('source.health', {
    sourceId,
    status,
    consecutiveFailures,
    lastError,
  }, status === 'failing' ? 'error' : status === 'degraded' ? 'warn' : 'info')
}

export function logIntelligenceExtract(
  stagingId: string,
  success: boolean,
  model: string,
  latencyMs: number,
  error?: string,
) {
  structuredLog('intelligence.extract', {
    stagingId,
    success,
    model,
    latencyMs,
    error,
  }, success ? 'info' : 'error')
}
