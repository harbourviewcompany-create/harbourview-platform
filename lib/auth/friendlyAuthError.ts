export type AuthErrorLike = {
  message?: string
  status?: number
  code?: string
}

export function friendlyAuthError(error: unknown) {
  const details: AuthErrorLike =
    typeof error === 'object' && error !== null ? (error as AuthErrorLike) : {}
  const message = typeof error === 'string' ? error : details.message ?? ''
  const lower = message.toLowerCase()
  const status = details.status

  if (
    (typeof status === 'number' && status >= 500) ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('service unavailable') ||
    lower.includes('connection refused') ||
    lower.includes('database connection') ||
    lower.includes('upstream')
  ) {
    return 'Authentication service is temporarily unavailable. Please try again shortly.'
  }

  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account already exists for this email. Try signing in instead.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'That email or password was not recognized.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in — check your inbox for the confirmation link.'
  }
  if (lower.includes('password should be at least') || lower.includes('at least 8')) {
    return 'Password must be at least 8 characters.'
  }
  if (lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return 'We could not complete that authentication request. Please try again.'
}
