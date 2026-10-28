import type { ComponentType } from 'react'
import type { VerificationMode } from '../verification'
import type { VerificationConfig } from './types'
import TotpField from '../TotpField'
import PinKeypad from '../PinKeypad'
import TotpSettings from './TotpSettings'
import PinSettings from './PinSettings'

export interface VerificationInputProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export interface VerificationSettingsProps {
  config: VerificationConfig
  onChange: (config: VerificationConfig) => void
  disabled: boolean
  form: string
}

interface VerificationUI {
  Input: ComponentType<VerificationInputProps>
  Settings: ComponentType<VerificationSettingsProps>
}

// The mapped type requires UI for every registered core method.
export const verificationUI: Record<VerificationMode, VerificationUI> = {
  totp: { Input: TotpField, Settings: TotpSettings },
  pin: { Input: PinKeypad, Settings: PinSettings },
}
