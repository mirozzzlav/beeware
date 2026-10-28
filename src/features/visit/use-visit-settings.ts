import {
  readVisitSettings,
  visitSettingsStorageKeys,
} from '../settings/settings-store'
import { useStoredSettings } from '../settings/use-stored-settings'
import { useLanguage } from '../language/use-language'

const visitSettingsSource = {
  keys: visitSettingsStorageKeys,
  read: readVisitSettings,
}

export function useVisitSettings() {
  const { t } = useLanguage()
  const { value, error } = useStoredSettings(visitSettingsSource)
  return {
    settings: value
      ? {
          sites: value.sites,
          mode: value.verification.mode,
          visitQuestionEnabled: value.visitQuestionEnabled,
          question: value.visitQuestionText ?? t('visitQuestion'),
        }
      : null,
    loading: !value && !error,
    error: error ? t(error.key, error.params) : '',
  }
}
