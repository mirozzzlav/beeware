import { normalizeDrafts } from '../domains/domain-draft.ts'
import { asMessageError, MessageError } from '../language/i18n.ts'
import { normalizeVerification } from '../verification/verification.ts'
import type { SettingsDraftValues } from './settings-draft.ts'

type SettingsTab = 'general' | 'domains' | 'verification'
type ValidationResult =
  | { valid: true; values: SettingsDraftValues }
  | { valid: false; tab: SettingsTab; error: MessageError }

export function validateSettings(
  values: SettingsDraftValues,
): ValidationResult {
  let tab: SettingsTab = 'general'
  try {
    if (
      values.visitQuestionEnabled &&
      values.visitQuestionText !== null &&
      !values.visitQuestionText.trim()
    )
      throw new MessageError('visitQuestionRequired')

    tab = 'domains'
    const sites = normalizeDrafts(values.rows)
    tab = 'verification'
    const verification = normalizeVerification(values.verification)
    return {
      valid: true,
      values: {
        ...values,
        verification,
        visitQuestionText: values.visitQuestionText?.trim() || null,
        rows: sites.map((site, index) => ({ ...values.rows[index], ...site })),
      },
    }
  } catch (cause) {
    return { valid: false, tab, error: asMessageError(cause, 'saveError') }
  }
}
