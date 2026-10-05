import type { DataHealth, DependencyHealth } from './contracts'

const CRITICAL = new Set(['core', 'identity'])

export function platformHealth(dependencies: DependencyHealth[]): DataHealth {
  if (dependencies.some((d) => CRITICAL.has(d.name) && d.status === 'unavailable')) return 'unavailable'
  if (dependencies.some((d) => d.status !== 'healthy')) return 'degraded'
  return 'healthy'
}

export function canServeAuthenticatedApp(dependencies: DependencyHealth[]): boolean {
  return !dependencies.some((d) => CRITICAL.has(d.name) && d.status === 'unavailable')
}

export function canServeIntelligence(dependencies: DependencyHealth[]): boolean {
  return canServeAuthenticatedApp(dependencies) &&
    !dependencies.some((d) => d.name === 'intelligence' && d.status === 'unavailable')
}
