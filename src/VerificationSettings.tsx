import {
  isVerificationMode,
  verificationMethods,
  verificationModes,
  type VerificationSettings as Settings,
} from './verification'
import { verificationUI } from './verification/ui'
import SettingsBlock from './SettingsBlock'
import SelectField from './SelectField'
import { useLanguage } from './use-language'

export default function VerificationSettings({
  value,
  onChange,
  disabled,
  form,
}: {
  value: Settings
  onChange: (value: Settings) => void
  disabled: boolean
  form: string
}) {
  const { t } = useLanguage()
  const MethodSettings = verificationUI[value.mode].Settings
  return (
    <SettingsBlock
      title={t('verificationMethod')}
      description={t('verificationHelp')}
    >
      <SelectField
        label={t('verificationMethod')}
        hideLabel
        value={value.mode}
        disabled={disabled}
        onChange={(event) => {
          const mode = event.target.value
          if (isVerificationMode(mode)) onChange({ ...value, mode })
        }}
      >
        {verificationModes.map((mode) => (
          <option key={mode} value={mode}>
            {t(verificationMethods[mode].label)}
          </option>
        ))}
      </SelectField>
      <div className="verification-method-settings">
        <MethodSettings
          key={value.mode}
          config={value.methods[value.mode]}
          onChange={(config) =>
            onChange({
              ...value,
              methods: { ...value.methods, [value.mode]: config },
            })
          }
          disabled={disabled}
          form={form}
        />
      </div>
    </SettingsBlock>
  )
}
