import { useEffect, useState } from 'react'
import {
  isExtension,
  readVisitQuestionEnabled,
  visitQuestionStorageKey,
  readVisitQuestionText,
  visitQuestionTextStorageKey,
} from './settings-store'
import { useLanguage } from './use-language'

export function useVisitQuestion() {
  const { t } = useLanguage()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = () => {
      void Promise.all([readVisitQuestionEnabled(), readVisitQuestionText()])
        .then(([value, text]) => {
          if (active) {
            setText(text)
            setEnabled(value)
            setFailed(false)
          }
        })
        .catch(() => {
          if (active) setFailed(true)
        })
    }
    const onStorage = (changes: Record<string, unknown>, area: string) => {
      if (
        area === 'local' &&
        (visitQuestionStorageKey in changes ||
          visitQuestionTextStorageKey in changes)
      )
        load()
    }
    const onLocalStorage = (event: StorageEvent) => {
      if (
        event.key === visitQuestionStorageKey ||
        event.key === visitQuestionTextStorageKey ||
        event.key === null
      )
        load()
    }
    load()
    if (isExtension) browser.storage.onChanged.addListener(onStorage)
    else window.addEventListener('storage', onLocalStorage)
    return () => {
      active = false
      if (isExtension) browser.storage.onChanged.removeListener(onStorage)
      else window.removeEventListener('storage', onLocalStorage)
    }
  }, [])

  return {
    enabled,
    question: text ?? t('visitQuestion'),
    error: failed ? t('loadError') : '',
  }
}
