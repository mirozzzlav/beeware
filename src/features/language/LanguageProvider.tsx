import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  defaultLanguage,
  translate,
  type Language,
  type MessageKey,
  type MessageParams,
} from './i18n'
import { LanguageContext } from './language-context'
import { languageStorageKey, readLanguage } from '../settings/settings-store'
import { observeSettings } from '../settings/observe-settings'

const languageSource = { keys: [languageStorageKey], read: readLanguage }

export default function LanguageProvider({
  children,
}: {
  children: ReactNode
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [ready, setReady] = useState(false)
  useEffect(
    () =>
      observeSettings(
        languageSource,
        (value) => {
          setLanguage(value)
          setReady(true)
        },
        () => {
          setLanguage(defaultLanguage)
          setReady(true)
        },
      ),
    [],
  )

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) =>
      translate(language, key, params),
    [language],
  )
  useEffect(() => {
    document.documentElement.lang = language
    document.title = t(
      window.location.pathname.endsWith('/settings.html')
        ? 'settingsPageTitle'
        : 'appTitle',
    )
  }, [language, t])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {ready ? (
        children
      ) : (
        <main>
          <p role="status">{t('loading')}</p>
        </main>
      )}
    </LanguageContext.Provider>
  )
}
