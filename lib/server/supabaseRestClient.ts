type SupabaseError = {
  status?: number
  statusText?: string
  message: string
}

type SupabaseResponse<T = Record<string, unknown>[]> = {
  data: T | null
  error: SupabaseError | null
}

type QueryParams = Record<string, string>
type SingleResult<T> = T extends Array<infer Item> ? Item : T

type OrderOptions = { ascending?: boolean }
type UpsertOptions = { onConflict?: string; ignoreDuplicates?: boolean }

function trimUrl(value: string) {
  return value.replace(/\/$/, '')
}

class SupabaseRestQuery<T = Record<string, unknown>[]> implements PromiseLike<SupabaseResponse<T>> {
  private method = 'GET'
  private body: unknown
  private selectColumns = '*'
  private filters: QueryParams = {}
  private orderBy: string | null = null
  private rowLimit: number | null = null
  private onConflict: string | null = null
  private preferResolution: string | null = null
  private returnSingle = false

  constructor(
    private readonly url: string,
    private readonly key: string,
    private readonly table: string,
  ) {}

  select(columns = '*') {
    this.selectColumns = columns
    return this
  }

  insert(payload: unknown) {
    this.method = 'POST'
    this.body = payload
    return this
  }

  upsert(payload: unknown, options: UpsertOptions = {}) {
    this.method = 'POST'
    this.body = payload
    this.onConflict = options.onConflict ?? null
    this.preferResolution = options.ignoreDuplicates ? 'ignore-duplicates' : 'merge-duplicates'
    return this
  }

  update(payload: unknown) {
    this.method = 'PATCH'
    this.body = payload
    return this
  }

  eq(column: string, value: string) {
    this.filters[column] = `eq.${value}`
    return this
  }

  not(column: string, operator: string, value: string | null) {
    this.filters[column] = `not.${operator}.${value ?? 'null'}`
    return this
  }

  order(column: string, options: OrderOptions = {}) {
    this.orderBy = `${column}.${options.ascending === false ? 'desc' : 'asc'}`
    return this
  }

  limit(count: number) {
    this.rowLimit = count
    return this
  }

  single(): Promise<SupabaseResponse<SingleResult<T>>> {
    this.returnSingle = true
    return this.execute() as Promise<SupabaseResponse<SingleResult<T>>>
  }

  then<TResult1 = SupabaseResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<SupabaseResponse<T>> {
    const params = new URLSearchParams()
    params.set('select', this.selectColumns)

    Object.entries(this.filters).forEach(([column, value]) => {
      params.set(column, value)
    })

    if (this.orderBy) params.set('order', this.orderBy)
    if (this.rowLimit !== null) params.set('limit', String(this.rowLimit))
    if (this.onConflict) params.set('on_conflict', this.onConflict)

    const endpoint = `${trimUrl(this.url)}/rest/v1/${this.table}?${params.toString()}`
    const prefer = ['return=representation', this.preferResolution ? `resolution=${this.preferResolution}` : null]
      .filter(Boolean)
      .join(',')

    const response = await fetch(endpoint, {
      method: this.method,
      cache: 'no-store',
      headers: {
        apikey: this.key,
        authorization: `Bearer ${this.key}`,
        'content-type': 'application/json',
        prefer,
      },
      body: this.method === 'GET' ? undefined : JSON.stringify(this.body),
    })

    if (!response.ok) {
      return {
        data: null,
        error: {
          status: response.status,
          statusText: response.statusText,
          message: await response.text(),
        },
      }
    }

    if (response.status === 204) return { data: null, error: null }

    const payload = (await response.json()) as unknown
    const data = this.returnSingle && Array.isArray(payload) ? payload[0] ?? null : payload

    return { data: data as T, error: null }
  }
}

export function createClient(url: string, key: string, _options?: unknown) {
  void _options

  return {
    from<T = Record<string, unknown>[]>(table: string) {
      return new SupabaseRestQuery<T>(url, key, table)
    },
  }
}
