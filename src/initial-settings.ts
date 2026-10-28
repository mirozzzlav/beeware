import type { Language } from './i18n.ts'
import type { VerificationSettings } from './verification.ts'

// Used only when no saved preference exists. User choices take precedence.
export const initialSettings: {
  language: Language
  visitQuestionEnabled: boolean
  verification: VerificationSettings
} = {
  language: 'en',
  visitQuestionEnabled: true,
  verification: {
    mode: 'pin',
    methods: { pin: { pin: '1234' }, totp: {} },
  },
}
