import { useEffect, useState } from 'react'
import {
  isExtension,
  readVerification,
  verificationStorageKey,
} from './settings-store'
import type { VerificationMode } from './verification'
import { useLanguage } from './use-language'

export function useVerification() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<VerificationMode | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const load = () => {
      void readVerification()
        .then((settings) => {
          if (active) {
            setMode(settings.mode)
            setFailed(false)
          }
        })
        .catch(() => {
          if (active) setFailed(true)
        })
    }
    const onStorage = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && verificationStorageKey in changes) load()
    }
    const onLocalStorage = (event: StorageEvent) => {
      if (event.key === verificationStorageKey || event.key === null) load()
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
  return { mode, error: failed ? t('verificationLoadError') : '' }
}
