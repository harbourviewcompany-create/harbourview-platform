export type CommandCentreDataState =
  | 'live'
  | 'partial'
  | 'fallback'
  | 'empty'
  | 'error'
  | 'stale'

export type CommandCentreDataAccess = 'public' | 'authenticated' | 'operator'

export type CommandCentreLoadContext = Readonly<{
  countryIso2: string | null
  regionLabel?: string | null
  roleId: string | null
  page: string | null
  userId: string | null
  userEmail?: string | null
  hasOrganization: boolean
}>

export type CommandCentreSourceMeta = Readonly<{
  key: string
  state: CommandCentreDataState
  access: CommandCentreDataAccess
  sourceLabel: string
  loadedAt: string
  freshAt: string | null
  staleAfterMs: number | null
  durationMs: number
  errorCode: string | null
}>

export type CommandCentreDataEnvelope<T> = Readonly<{
  data: T
  meta: CommandCentreSourceMeta
}>

export type CommandCentreDataBundle<T extends Record<string, unknown>> = Readonly<{
  context: CommandCentreLoadContext
  data: { [K in keyof T]: T[K] }
  sources: { [K in keyof T]: CommandCentreSourceMeta }
  loadedAt: string
  state: CommandCentreDataState
}>

export type CommandCentreSourceDefinition<T> = Readonly<{
  load: () => Promise<T>
  fallback: T
  sourceLabel: string
  access?: CommandCentreDataAccess
  staleAfterMs?: number
  freshAt?: (data: T) => string | Date | null | undefined
  isEmpty?: (data: T) => boolean
  classify?: (data: T) => Exclude<CommandCentreDataState, 'error' | 'stale'>
}>

export type CommandCentreSourceMap = Record<string, CommandCentreSourceDefinition<any>>

export type CommandCentreSourceData<TDefinitions extends CommandCentreSourceMap> = {
  [K in keyof TDefinitions]: TDefinitions[K] extends CommandCentreSourceDefinition<infer TValue>
    ? TValue
    : never
}
