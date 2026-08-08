import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/server'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import {
  HARBOURVIEW_STRIPE_WEBHOOK_EVENTS,
  harbourviewStripeWebhookUrl,
} from '@/lib/stripe/webhookConfig'

export const dynamic = 'force-dynamic'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })
}

function sameEvents(actual: string[]) {
  return (
    actual.length === HARBOURVIEW_STRIPE_WEBHOOK_EVENTS.length &&
    HARBOURVIEW_STRIPE_WEBHOOK_EVENTS.every((event) => actual.includes(event))
  )
}

export default async function StripeHealthPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://harbourview.vercel.app'
  const canonicalUrl = harbourviewStripeWebhookUrl(appUrl)

  let endpointStatus: 'healthy' | 'degraded' = 'degraded'
  let endpointId: string | null = null
  let endpointEnabled = false
  let eventContractMatches = false
  let endpointError: string | null = null

  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const endpoint = endpoints.data.find((candidate) => candidate.url === canonicalUrl)
    endpointId = endpoint?.id ?? null
    endpointEnabled = endpoint?.status === 'enabled'
    eventContractMatches = endpoint ? sameEvents(endpoint.enabled_events) : false
    endpointStatus = endpointEnabled && eventContractMatches ? 'healthy' : 'degraded'
  } catch (error) {
    endpointError = error instanceof Error ? error.message : 'Unable to query Stripe webhook state.'
  }

  const supabase = adminClient()
  let lastProcessedAt: string | null = null
  let lastEventType: string | null = null
  let persistenceError: string | null = null

  if (supabase) {
    const { data, error } = await supabase
      .from('stripe_webhook_events')
      .select('type,processed_at')
      .order('processed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) persistenceError = error.message
    lastProcessedAt = data?.processed_at ?? null
    lastEventType = data?.type ?? null
  } else {
    persistenceError = 'Supabase admin environment is incomplete.'
  }

  const webhookSecretPresent = Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  const overallHealthy = endpointStatus === 'healthy' && webhookSecretPresent && !persistenceError

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c6a86b]">Payments operations</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#f5f1e8]">Stripe Webhook Health</h1>
        <p className="mt-1 text-sm text-white/50">
          Read-only production evidence for Harbourview subscription webhook routing. Secrets are never displayed.
        </p>
      </div>

      <div className={`rounded-lg border p-5 ${overallHealthy ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Overall</div>
        <div className={`mt-1 text-xl font-semibold ${overallHealthy ? 'text-emerald-300' : 'text-amber-300'}`}>
          {overallHealthy ? 'Healthy' : 'Needs attention'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <HealthCard label="Canonical endpoint" value={canonicalUrl} ok={endpointStatus === 'healthy'} />
        <HealthCard label="Endpoint enabled" value={endpointEnabled ? 'Yes' : 'No'} ok={endpointEnabled} />
        <HealthCard label="Required event contract" value={eventContractMatches ? 'Matches' : 'Mismatch'} ok={eventContractMatches} />
        <HealthCard label="Webhook secret configured" value={webhookSecretPresent ? 'Yes' : 'No'} ok={webhookSecretPresent} />
        <HealthCard label="Endpoint ID" value={endpointId ?? 'Not found'} ok={Boolean(endpointId)} />
        <HealthCard
          label="Last persisted event"
          value={lastProcessedAt ? `${lastEventType ?? 'unknown'} · ${new Date(lastProcessedAt).toLocaleString()}` : 'No persisted event recorded'}
          ok={!persistenceError}
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">Required Stripe events</h2>
        <ul className="mt-3 space-y-2 font-mono text-sm text-white/65">
          {HARBOURVIEW_STRIPE_WEBHOOK_EVENTS.map((event) => <li key={event}>{event}</li>)}
        </ul>
      </div>

      {(endpointError || persistenceError) && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {endpointError && <p>Stripe check: {endpointError}</p>}
          {persistenceError && <p>Persistence check: {persistenceError}</p>}
        </div>
      )}

      <p className="text-xs leading-5 text-white/35">
        The separate Wurx Stripe/Supabase webhook is intentionally outside this Harbourview health contract and is not modified by this page.
      </p>
    </div>
  )
}

function HealthCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-2 break-words text-sm text-white/80">{value}</div>
      <div className={`mt-3 text-xs font-semibold uppercase tracking-wider ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
        {ok ? 'OK' : 'Check'}
      </div>
    </div>
  )
}
