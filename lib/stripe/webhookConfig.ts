export const HARBOURVIEW_STRIPE_WEBHOOK_PATH = '/api/stripe/webhook'

export const HARBOURVIEW_STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
] as const

export function harbourviewStripeWebhookUrl(appUrl: string) {
  return `${appUrl.replace(/\/$/, '')}${HARBOURVIEW_STRIPE_WEBHOOK_PATH}`
}
