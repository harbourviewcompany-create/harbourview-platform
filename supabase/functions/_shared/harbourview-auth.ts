export function matchesRequiredSecret(
  expected: string | null | undefined,
  provided: string | null | undefined,
): boolean {
  return Boolean(expected) && provided === expected
}

export function isOperatorOrServiceRoleAuthorized(input: {
  operatorSecret: string | null | undefined
  serviceRoleKey: string | null | undefined
  callerSecret: string | null | undefined
  authorization: string | null | undefined
}): boolean {
  if (matchesRequiredSecret(input.operatorSecret, input.callerSecret)) return true
  return Boolean(input.serviceRoleKey) && input.authorization === `Bearer ${input.serviceRoleKey}`
}
