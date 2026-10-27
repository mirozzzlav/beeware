import { useEffect, useState } from 'react'
import { type DomainRule } from './policy'
import { isExtension, readSites, sitesStorageKey } from './settings-store'
import { useLanguage } from './use-language'

export function useSites() {
  const { t } = useLanguage()
  const [sites, setSites] = useState<DomainRule[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const load = () => {
      void readSites()
        .then((value) => {
          if (active) {
            setSites(value)
            setFailed(false)
          }
        })
        .catch(() => {
          if (active) setFailed(true)
        })
    }
    const onStorage = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && sitesStorageKey in changes) load()
    }
    const onLocalStorage = (event: StorageEvent) => {
      if (event.key === sitesStorageKey || event.key === null) load()
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
  return { sites, error: failed ? t('loadError') : '' }
}
