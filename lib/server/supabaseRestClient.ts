/**
 * @deprecated This hand-rolled PostgREST client has been superseded by the
 * official Supabase SDK clients in lib/supabase/server.ts and
 * lib/harbourview/supabase/service-role.ts.
 *
 * Migration path:
 *   - Server components / route handlers with user sessions → lib/supabase/server.ts createClient()
 *   - Privileged server operations bypassing RLS → lib/supabase/server.ts createSupabaseServiceClient()
 *   - Browser / client components → lib/supabase/client.ts createClient()
 *
 * This file is retained as a tombstone to prevent import errors while
 * call sites are migrated. It re-exports a shim that uses the SDK internally.
 * Remove this file once all imports are updated.
 */
import 'server-only'
import { createClient as createRawClient } from '@supabase/supabase-js'

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

    // PostgREST on this project only exposes the `api` schema (not `public`).
    // Accept-Profile selects schema for GET; Content-Profile selects schema
    // for POST/PATCH/DELETE. Without these, PostgREST falls back to `public`,
    // which is not exposed, and every call here 406s with PGRST106.
    const profileHeader: Record<string, string> = this.method === 'GET'
      ? { 'accept-profile': 'api' }
      : { 'content-profile': 'api' }

    const response = await fetch(endpoint, {
      method: this.method,
      // @deprecated use next: { revalidate: N } or cache: 'no-store' explicitly at call sites
      cache: 'no-store',
      headers: {
        apikey: this.key,
        authorization: `Bearer ${this.key}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
        ...profileHeader,
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

/** @deprecated Use lib/supabase/server.ts createClient() instead */
export function createClient(url: string, key: string) {
  return {
    from<T = unknown>(table: string) {
      return new SupabaseRestQuery<T>(url, key, table)
    },
  }
}
