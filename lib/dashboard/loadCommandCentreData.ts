import 'server-only'

import type {
  CommandCentreDataBundle,
  CommandCentreDataEnvelope,
  CommandCentreDataState,
  CommandCentreLoadContext,
  CommandCentreSourceData,
  CommandCentreSourceDefinition,
  CommandCentreSourceMap,
  CommandCentreSourceMeta,
} from '@/lib/dashboard/commandCentreDataTypes'

function defaultIsEmpty(value: unknown): boolean {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Map || value instanceof Set) return value.size === 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0
  return false
}

function normalizeDate(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function sourceState<T>(
  definition: CommandCentreSourceDefinition<T>,
  data: T,
  freshAt: string | null,
  now: number,
): CommandCentreDataState {
  const classified = definition.classify?.(data)
  let state: CommandCentreDataState = classified
    ?? ((definition.isEmpty ?? defaultIsEmpty)(data) ? 'empty' : 'live')

  if (
    freshAt
    && definition.staleAfterMs
    && now - new Date(freshAt).getTime() > definition.staleAfterMs
    && state !== 'empty'
  ) {
    state = 'stale'
  }

  return state
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    for (const key of ['code', 'name', 'status']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value.slice(0, 80)
      if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    }
  }
  return 'SOURCE_LOAD_FAILED'
}

export async function loadCommandCentreData<TDefinitions extends CommandCentreSourceMap>(
  context: CommandCentreLoadContext,
  definitions: TDefinitions,
): Promise<CommandCentreDataBundle<CommandCentreSourceData<TDefinitions>>> {
  type TData = CommandCentreSourceData<TDefinitions>
  const keys = Object.keys(definitions) as Array<keyof TDefinitions>
  const startedAt = Date.now()
  const loadedAt = new Date(startedAt).toISOString()

  const settled = await Promise.allSettled(
    keys.map(async key => {
      const definition = definitions[key]
      const sourceStartedAt = Date.now()
      const data = await definition.load()
      return { key, data, durationMs: Date.now() - sourceStartedAt }
    }),
  )

  const data = {} as TData
  const sources = {} as CommandCentreDataBundle<TData>['sources']

  settled.forEach((result, index) => {
    const key = keys[index]
    const definition = definitions[key]
    const dataKey = key as keyof TData

    if (result.status === 'fulfilled') {
      const freshAt = normalizeDate(definition.freshAt?.(result.value.data))
      data[dataKey] = result.value.data as TData[keyof TData]
      sources[dataKey] = Object.freeze({
        key: String(key),
        state: sourceState(definition, result.value.data, freshAt, startedAt),
        access: definition.access ?? 'authenticated',
        sourceLabel: definition.sourceLabel,
        loadedAt,
        freshAt,
        staleAfterMs: definition.staleAfterMs ?? null,
        durationMs: result.value.durationMs,
        errorCode: null,
      }) as CommandCentreSourceMeta
      return
    }

    data[dataKey] = definition.fallback as TData[keyof TData]
    const code = errorCode(result.reason)
    sources[dataKey] = Object.freeze({
      key: String(key),
      state: defaultIsEmpty(definition.fallback) ? 'error' : 'fallback',
      access: definition.access ?? 'authenticated',
      sourceLabel: definition.sourceLabel,
      loadedAt,
      freshAt: null,
      staleAfterMs: definition.staleAfterMs ?? null,
      durationMs: Date.now() - startedAt,
      errorCode: code,
    }) as CommandCentreSourceMeta

    console.error('[command-centre-source]', {
      source: String(key),
      code,
      countryIso2: context.countryIso2,
      roleId: context.roleId,
      page: context.page,
    })
  })

  const states = Object.values(sources).map(source => source.state)
  const state: CommandCentreDataState = states.some(value => value === 'error')
    ? (states.some(value => value === 'live' || value === 'stale' || value === 'fallback') ? 'partial' : 'error')
    : states.some(value => value === 'fallback')
      ? 'partial'
      : states.some(value => value === 'stale')
        ? 'stale'
        : states.every(value => value === 'empty')
          ? 'empty'
          : 'live'

  return Object.freeze({
    context,
    data,
    sources,
    loadedAt,
    state,
  })
}

export async function loadCommandCentreSource<T>(
  key: string,
  context: CommandCentreLoadContext,
  definition: CommandCentreSourceDefinition<T>,
): Promise<CommandCentreDataEnvelope<T>> {
  const bundle = await loadCommandCentreData(context, {
    [key]: definition,
  })

  return Object.freeze({
    data: bundle.data[key] as T,
    meta: bundle.sources[key],
  })
}
