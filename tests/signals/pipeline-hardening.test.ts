import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260802080000_harden_eval_labels_and_alert_delivery.sql',
  'utf8',
).toLowerCase()

describe('pipeline hardening migration', () => {
  it('restricts the ground-truth mutation and preserves an admin/operator wrapper', () => {
    expect(migration).toContain(
      'revoke execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)\n  from public, anon, authenticated',
    )
    expect(migration).toContain(
      'grant execute on function api.add_signal_to_eval_set(text,text,text,text,text,text)\n  to service_role',
    )
    expect(migration).toContain('create or replace function api.admin_add_signal_to_eval_set')
    expect(migration).toContain("ur.role in ('admin', 'operator')")
    expect(migration).toContain("'user:' || v_user_id::text")
    expect(migration).toContain(
      'grant execute on function api.admin_add_signal_to_eval_set(text,text,text,text,text)\n  to authenticated, service_role',
    )
  })

  it('only stamps notified_at after harvesting a successful HTTP response', () => {
    const queueStart = migration.indexOf('select net.http_post(')
    const queueEnd = migration.indexOf("return jsonb_build_object('ok', true", queueStart)
    expect(queueStart).toBeGreaterThan(-1)
    expect(queueEnd).toBeGreaterThan(queueStart)

    const queueStatement = migration.slice(queueStart, queueEnd)
    expect(migration).toContain('join net._http_response r on r.id = l.delivery_request_id')
    expect(migration).toContain(
      "notified_at = case when r.status_code between 200 and 299 then now() else l.notified_at end",
    )
    expect(queueStatement).not.toContain('notified_at = now()')
  })

  it('never persists provider response bodies and bounds retries', () => {
    expect(migration).not.toContain('r.content')
    expect(migration).toContain("'provider_rejected:http_' || coalesce(r.status_code::text, 'unknown')")
    expect(migration).toContain("'provider_timeout:no_pg_net_response_after_2h'")
    expect(migration).toContain('delivery_attempts < 5')
    expect(migration).toMatch(/least\(\s*interval '6 hours'/)
    expect(migration).toContain("'permanently_failed', v_permanently_failed")
  })

  it('uses one locked id set for body construction and queuing', () => {
    expect(migration).toContain('for update skip locked')
    expect(migration).toMatch(/v_alert_ids\s+bigint\[\]\s*:=\s*'\{\}'::bigint\[\]/)
    expect(migration.match(/where id = any \(v_alert_ids\)/g)).toHaveLength(2)
  })

  it('adds the delivery-status constraint without a blocking validation in the add statement', () => {
    expect(migration).toContain(
      "check (delivery_status in ('pending', 'queued', 'delivered', 'failed')) not valid",
    )
    expect(migration).toContain('validate constraint hv_alert_log_delivery_status_check')
  })
})
