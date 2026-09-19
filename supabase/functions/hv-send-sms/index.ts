/**
 * hv-send-sms — sends a critical-alert SMS via Twilio (2026-09-18)
 *   Internal use only, called from hv_alert_tick() for newly-detected
 *   critical-severity pipeline alerts. Not a general-purpose SMS endpoint.
 *
 *   Twilio's Messages REST API requires application/x-www-form-urlencoded
 *   request bodies -- pg_net's net.http_post only supports a jsonb body
 *   (always sent as application/json), so this call can't be made directly
 *   from Postgres. This function exists specifically to bridge that gap:
 *   Deno's native fetch() correctly form-encodes a URLSearchParams body,
 *   which pg_net cannot do.
 *
 *   Gracefully no-ops (returns 200, ok:true, skipped:true) if Twilio
 *   credentials aren't configured in vault yet (twilio_account_sid,
 *   twilio_auth_token, twilio_from_number, alert_sms_to) -- same pattern
 *   hv_alert_tick() already uses for its Resend email path, so this is
 *   safe to deploy and call before those secrets exist.
 *
 *   verify_jwt=true is the only auth gate. Twilio SMS costs real money per
 *   message but nowhere near github-bridge's admin-PAT blast radius, so
 *   this matches hv-classify's security posture (a valid Supabase JWT is
 *   enough) rather than adding a separate shared-secret layer.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface TwilioCreds {
  account_sid: string
  auth_token: string
  from_number: string
  to_number: string
}

async function getTwilioCreds(): Promise<TwilioCreds | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/hv_get_twilio_creds`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'api',
      },
      body: JSON.stringify({}),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.account_sid || !data.auth_token || !data.from_number || !data.to_number) return null
    return data as TwilioCreds
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(null, 204)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { body?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!body.body || typeof body.body !== 'string') {
    return json({ error: 'body.body (message text) is required' }, 400)
  }

  const creds = await getTwilioCreds()
  if (!creds) {
    return json({
      ok: true,
      skipped: true,
      reason: 'twilio credentials not configured in vault (need twilio_account_sid, twilio_auth_token, twilio_from_number, alert_sms_to)',
    })
  }

  const form = new URLSearchParams()
  form.set('From', creds.from_number)
  form.set('To', creds.to_number)
  form.set('Body', body.body.slice(0, 1500))

  const auth = btoa(`${creds.account_sid}:${creds.auth_token}`)

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return json({ ok: false, error: `Twilio ${res.status}: ${JSON.stringify(data)}` }, 502)
    }
    return json({ ok: true, sid: data.sid, status: data.status })
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
