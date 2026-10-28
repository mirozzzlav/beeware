import { MessageError } from './i18n.ts'
import { initialSettings } from './initial-settings.ts'
import { pinMethod } from './verification/pin.ts'
import { totpMethod } from './verification/totp.ts'
import type {
  VerificationConfig,
  VerificationContext,
  VerificationMethod,
} from './verification/types.ts'

export const verificationMethods = {
  pin: pinMethod,
  totp: totpMethod,
} satisfies Record<string, VerificationMethod>

export type VerificationMode = keyof typeof verificationMethods
export interface VerificationSettings {
  mode: VerificationMode
  methods: Record<string, VerificationConfig>
}

export const verificationModes = Object.keys(
  verificationMethods,
) as VerificationMode[]

export function isVerificationMode(value: unknown): value is VerificationMode {
  return typeof value === 'string' && Object.hasOwn(verificationMethods, value)
}

export function normalizeVerification(value: unknown): VerificationSettings {
  const source = value ?? initialSettings.verification
  if (
    typeof source !== 'object' ||
    !('mode' in source) ||
    !isVerificationMode(source.mode)
  )
    throw new MessageError('verificationLoadError')
  const mode = source.mode
  const configs =
    'methods' in source && source.methods && typeof source.methods === 'object'
      ? source.methods
      : {}
  const methods: Record<string, VerificationConfig> = {}
  for (const id of verificationModes) {
    // Each method owns compatibility with its older storage format.
    const config = Object.hasOwn(configs, id)
      ? Reflect.get(configs, id)
      : verificationMethods[id].legacyConfig?.(source)
    methods[id] = verificationMethods[id].normalizeConfig(config, id === mode)
  }
  return { mode, methods }
}

export async function verifyCode(
  settings: VerificationSettings,
  code: unknown,
  context: VerificationContext,
) {
  const method = verificationMethods[settings.mode]
  const valid = await method.verify(
    code,
    settings.methods[settings.mode],
    context,
  )
  return valid ? { ok: true } : { ok: false, error: method.errorCode }
}
