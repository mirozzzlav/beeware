import TextField from '../../../components/TextField'
import { useLanguage } from '../../language/use-language'
import type { VerificationSettingsProps } from '../ui'

export default function PinSettings({
  config,
  onChange,
  disabled,
}: VerificationSettingsProps) {
  const { t } = useLanguage()
  return (
    <TextField
      label={t('pinCode')}
      description={t('pinSettingsHelp')}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      minLength={4}
      maxLength={12}
      value={typeof config.pin === 'string' ? config.pin : ''}
      disabled={disabled}
      onChange={(event) =>
        onChange({ ...config, pin: event.target.value.replace(/\D/g, '') })
      }
    />
  )
}
