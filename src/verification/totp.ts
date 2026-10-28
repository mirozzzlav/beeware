import { verifyTotp } from '../totp.ts'
import type { VerificationMethod } from './types.ts'

export const totpMethod: VerificationMethod = {
  label: 'totpMethod',
  invalidCode: 'invalidTotp',
  errorCode: 'invalid-totp',
  normalizeConfig: () => ({}),
  validateInput: (value) =>
    /^\d{6}$/.test(value) ? null : 'invalidTotpFormat',
  verify: async (value, _config, context) =>
    verifyTotp(await context.getTotpSecret(), value),
}
