import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  defaultLanguage,
  normalizeLanguage,
  translate,
  type Language,
  type MessageKey,
  type MessageParams,
} from './i18n'
import { LanguageContext } from './language-context'
import { isExtension, languageStorageKey, readLanguage } from './settings-store'

export default function LanguageProvider({
  children,
}: {
  children: ReactNode
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    const load = () => {
      void readLanguage()
        .catch(() => defaultLanguage)
        .then((value) => {
          if (active) {
            setLanguage(value)
            setReady(true)
          }
        })
    }
    const onStorage = (
      changes: Record<string, browser.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && languageStorageKey in changes)
        setLanguage(normalizeLanguage(changes[languageStorageKey].newValue))
    }
    const onLocalStorage = (event: StorageEvent) => {
      if (event.key === languageStorageKey || event.key === null) load()
    }
    if (isExtension) browser.storage.onChanged.addListener(onStorage)
    else window.addEventListener('storage', onLocalStorage)
    load()
    return () => {
      active = false
      if (isExtension) browser.storage.onChanged.removeListener(onStorage)
      else window.removeEventListener('storage', onLocalStorage)
    }
  }, [])

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
