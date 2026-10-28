import { isExtension } from './settings-store.ts'

export interface SettingsSource<T> {
  keys: readonly string[]
  read: () => Promise<T>
}

function subscribeToSettings(keys: readonly string[], reload: () => void) {
  if (isExtension) {
    const onStorage = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && keys.some((key) => key in changes)) reload()
    }
    browser.storage.onChanged.addListener(onStorage)
    return () => browser.storage.onChanged.removeListener(onStorage)
  }

  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea === window.localStorage &&
      (event.key === null || keys.includes(event.key))
    )
      reload()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

// Subscribe before the initial read, and only publish the latest request.
// Cleanup also invalidates pending reads (including StrictMode's first mount).
export function observeSettings<T>(
  source: SettingsSource<T>,
  onValue: (value: T) => void,
  onError: (cause: unknown) => void,
) {
  let active = true
  let revision = 0
  const load = async () => {
    const request = ++revision
    try {
      const value = await source.read()
      if (active && request === revision) onValue(value)
    } catch (cause) {
      if (active && request === revision) onError(cause)
    }
  }
  const unsubscribe = subscribeToSettings(source.keys, () => void load())
  void load()
  return () => {
    active = false
    unsubscribe()
  }
}
