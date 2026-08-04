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

const DEFAULT_SOURCE_TIMEOUT_MS = 8_000

class CommandCentreSourceFailure extends Error {
  readonly durationMs: number
  readonly original: unknown

  constructor(error: unknown, durationMs: number) {
    super(error instanceof Error ? error.message : 'Command Centre source failed')
    this.name = errorCode(error)
    this.durationMs = durationMs
    this.original = error
  }
}

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

function withTimeout<T>(load: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let complete = false
    const timer = setTimeout(() => {
      if (complete) return
      complete = true
      const error = new Error('Command Centre source timed out')
      error.name = 'SOURCE_TIMEOUT'
      reject(error)
    }, timeoutMs)

    Promise.resolve()
      .then(load)
      .then(
        value => {
          if (complete) return
          complete = true
          clearTimeout(timer)
          resolve(value)
        },
        error => {
          if (complete) return
          complete = true
          clearTimeout(timer)
          reject(error)
        },
      )
  })
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
      if (definition.enabled === false) {
        return { key, data: definition.fallback, durationMs: 0, requested: false }
      }

      const sourceStartedAt = Date.now()
      try {
        const data = await withTimeout(
          definition.load,
          definition.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS,
        )
        return { key, data, durationMs: Date.now() - sourceStartedAt, requested: true }
      } catch (error) {
        throw new CommandCentreSourceFailure(error, Date.now() - sourceStartedAt)
      }
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
        requested: result.value.requested,
      }) as CommandCentreSourceMeta
      return
    }

    data[dataKey] = definition.fallback as TData[keyof TData]
    const failure = result.reason instanceof CommandCentreSourceFailure
      ? result.reason
      : new CommandCentreSourceFailure(result.reason, 0)
    const code = errorCode(failure.original)
    sources[dataKey] = Object.freeze({
      key: String(key),
      state: defaultIsEmpty(definition.fallback) ? 'error' : 'fallback',
      access: definition.access ?? 'authenticated',
      sourceLabel: definition.sourceLabel,
      loadedAt,
      freshAt: null,
      staleAfterMs: definition.staleAfterMs ?? null,
      durationMs: failure.durationMs,
      errorCode: code,
      requested: true,
    }) as CommandCentreSourceMeta

    console.error('[command-centre-source]', {
      source: String(key),
      code,
      countryIso2: context.countryIso2,
      roleId: context.roleId,
      page: context.page,
    })
  })

  const states = Object.values(sources).filter(source => source.requested).map(source => source.state)
  const state: CommandCentreDataState = states.length === 0
    ? 'live'
    : states.some(value => value === 'error')
    ? (states.some(value => value !== 'error') ? 'partial' : 'error')
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
