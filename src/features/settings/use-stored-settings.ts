import { useEffect, useState } from 'react'
import { observeSettings, type SettingsSource } from './observe-settings'
import { asMessageError, type MessageError } from '../language/i18n'

// Define sources at module scope so ordinary renders do not restart the effect.
export function useStoredSettings<T>(source: SettingsSource<T>) {
  const [state, setState] = useState<{
    value: T | undefined
    error: MessageError | null
  }>({ value: undefined, error: null })

  useEffect(
    () =>
      observeSettings(
        source,
        (value) => setState({ value, error: null }),
        (cause) =>
          setState((previous) => ({
            ...previous,
            error: asMessageError(cause, 'loadError'),
          })),
      ),
    [source],
  )

  return state
}
