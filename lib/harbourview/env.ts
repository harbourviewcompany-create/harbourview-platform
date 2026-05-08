export function getEnvFlag(key: string, defaultValue = false) {
  const val = process.env[key]
  if (val === 'true') return true
  if (val === 'false') return false
  return defaultValue
}
