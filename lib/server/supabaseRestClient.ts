type SupabaseResponse<T = unknown> = {
  data: T | null
  error: unknown
}

type QueryParams = Record<string, string>

function trimUrl(value: string) {
  return value.replace(/\/$/, '')
}

class SupabaseRestQuery<T = unknown> implements PromiseLike<SupabaseResponse<T>> {
  private method = 'GET'
  private body: unknown
  private selectColumns = '*'
  private filters: QueryParams = {}
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

  update(payload: unknown) {
    this.method = 'PATCH'
    this.body = payload
    return this
  }

  eq(column: string, value: string) {
    this.filters[column] = value
    return this
  }

  single() {
    this.returnSingle = true
    return this.execute()
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
      params.set(column, `eq.${value}`)
    })

    const endpoint = `${trimUrl(this.url)}/rest/v1/${this.table}?${params.toString()}`

    const response = await fetch(endpoint, {
      method: this.method,
      cache: 'no-store',
      headers: {
        apikey: this.key,
        authorization: `Bearer ${this.key}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
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

export function createClient(url: string, key: string) {
  return {
    from<T = unknown>(table: string) {
      return new SupabaseRestQuery<T>(url, key, table)
    },
  }
}
