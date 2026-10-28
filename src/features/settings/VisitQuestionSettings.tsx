import SettingsBlock from './SettingsBlock'
import TextField from '../../components/TextField'
import Switch from '../../components/Switch'
import { useLanguage } from '../language/use-language'

type VisitQuestionSettingsProps = {
  enabled: boolean
  text: string | null
  disabled: boolean
  onEnabledChange: (enabled: boolean) => void
  onTextChange: (text: string) => void
}

export default function VisitQuestionSettings({
  enabled,
  text,
  disabled,
  onEnabledChange,
  onTextChange,
}: VisitQuestionSettingsProps) {
  const { t } = useLanguage()
  return (
    <SettingsBlock
      title={t('visitQuestionSettings')}
      description={t('visitQuestionHelp')}
    >
      <Switch
        label={t('visitQuestionToggle')}
        checked={enabled}
        disabled={disabled}
        onChange={onEnabledChange}
      />
      <TextField
        label={t('visitQuestionText')}
        value={text ?? t('visitQuestion')}
        placeholder={t('visitQuestion')}
        disabled={disabled || !enabled}
        maxLength={500}
        onChange={(event) => onTextChange(event.target.value)}
      />
    </SettingsBlock>
  )
}
