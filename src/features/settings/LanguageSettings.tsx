import { languages, normalizeLanguage, type Language } from '../language/i18n'
import { useLanguage } from '../language/use-language'
import SettingsBlock from './SettingsBlock'
import SelectField from '../../components/SelectField'

type LanguageSettingsProps = {
  value: Language
  disabled?: boolean
  onChange: (language: Language) => void
}

export default function LanguageSettings({
  value,
  disabled,
  onChange,
}: LanguageSettingsProps) {
  const { t } = useLanguage()
  return (
    <SettingsBlock title={t('language')} description={t('languageHelp')}>
      <SelectField
        label={t('language')}
        hideLabel
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(normalizeLanguage(event.target.value))}
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </SelectField>
    </SettingsBlock>
  )
}
