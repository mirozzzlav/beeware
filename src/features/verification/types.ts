import type { MessageKey } from '../language/i18n.ts'

export type VerificationConfig = Record<string, unknown>
export interface VerificationContext {
  getTotpSecret: () => Promise<string>
}

// Core definitions also run in the background; keep React and browser APIs out.
export interface VerificationMethod {
  label: MessageKey
  invalidCode: MessageKey
  errorCode: string
  normalizeConfig: (value: unknown, active: boolean) => VerificationConfig
  legacyConfig?: (settings: object) => unknown
  validateInput: (value: string) => MessageKey | null
  verify: (
    value: unknown,
    config: VerificationConfig,
    context: VerificationContext,
  ) => Promise<boolean>
}
