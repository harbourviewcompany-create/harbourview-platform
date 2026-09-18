import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(process.cwd(), 'supabase/migrations')
const file = readdirSync(dir).find((name) => name.startsWith('20260912103805_') && name.endsWith('.sql'))
if (!file) throw new Error('canonical pipeline-hardening migration is missing')
const migration = readFileSync(join(dir, file), 'utf8').toLowerCase()

describe('pipeline hardening migration', () => {
  it('restricts the ground-truth mutation and preserves an admin/operator wrapper', () => {
    expect(migration).toContain('revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)')
    expect(migration).toContain('grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)')
    expect(migration).toContain('create or replace function api.admin_add_signal_to_eval_set')
    expect(migration).toContain("ur.role in ('admin', 'operator')")
  })
  it('only stamps notified_at after harvesting a successful HTTP response', () => {
    expect(migration).toContain('select net.http_post(')
    expect(migration).toContain('join net._http_response r on r.id = l.delivery_request_id')
    expect(migration).toContain("notified_at = case when r.status_code between 200 and 299 then now() else l.notified_at end")
    expect(migration).not.toContain('notified_at = now()')
  })
  it('never persists provider response bodies and bounds retries', () => {
    expect(migration).not.toContain('r.content')
    expect(migration).toContain("'provider_rejected:http_' || coalesce(r.status_code::text, 'unknown')")
    expect(migration).toContain("'provider_timeout:no_pg_net_response_after_2h'")
    expect(migration).toContain('delivery_attempts < 5')
  })
  it('uses one locked id set for body construction and queuing', () => {
    expect(migration).toContain('for update skip locked')
    expect(migration).toContain('v_alert_ids')
    expect(migration.match(/where id = any \(v_alert_ids\)/g)).toHaveLength(2)
  })
})
