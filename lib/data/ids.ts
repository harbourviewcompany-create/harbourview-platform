import type { HarbourviewId, HarbourviewIdPrefix } from './contracts'

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function randomToken(length = 26): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function createHarbourviewId(prefix: HarbourviewIdPrefix): HarbourviewId {
  return `${prefix}_${randomToken()}`
}

export function isHarbourviewId(value: string): value is HarbourviewId {
  return /^(usr|org|wrk|jur|reg|sig|src|evd|cmp|lic|doc|job|evt)_[0-9A-HJKMNP-TV-Z]{10,}$/.test(value)
}
