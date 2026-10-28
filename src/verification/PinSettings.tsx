import { useId } from 'react'
import TextField from '../TextField'
import { useLanguage } from '../use-language'
import type { VerificationSettingsProps } from './ui'

export default function PinSettings({
  config,
  onChange,
  disabled,
  form,
}: VerificationSettingsProps) {
  const { t } = useLanguage()
  const helpId = useId()
  return (
    <div className="pin-settings">
      <TextField
        label={t('pinCode')}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        minLength={4}
        maxLength={12}
        value={typeof config.pin === 'string' ? config.pin : ''}
        disabled={disabled}
        form={form}
        aria-describedby={helpId}
        onChange={(event) =>
          onChange({ ...config, pin: event.target.value.replace(/\D/g, '') })
        }
      />
      <p id={helpId}>{t('pinSettingsHelp')}</p>
    </div>
  )
}
