import { MessageError } from '../../language/i18n.ts'
import type { VerificationMethod } from '../types.ts'

export function isValidPin(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4,12}$/.test(value)
}

export const pinMethod: VerificationMethod = {
  label: 'pinMethod',
  invalidCode: 'invalidPin',
  errorCode: 'invalid-pin',
  legacyConfig: (settings) =>
    'pin' in settings ? { pin: settings.pin } : undefined,
  normalizeConfig: (value, active) => {
    const pin =
      value &&
      typeof value === 'object' &&
      'pin' in value &&
      typeof value.pin === 'string'
        ? value.pin
        : ''
    if (active && !isValidPin(pin)) throw new MessageError('invalidPinFormat')
    return { pin }
  },
  validateInput: (value) => (isValidPin(value) ? null : 'invalidPinFormat'),
  verify: async (value, config) =>
    isValidPin(config.pin) && value === config.pin,
}

export function shuffledDigits(): string[] {
  const digits = Array.from({ length: 10 }, (_, index) => String(index))
  for (let index = digits.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[digits[index], digits[other]] = [digits[other], digits[index]]
  }
  return digits
}
