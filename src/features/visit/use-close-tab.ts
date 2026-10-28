import { useEffect, useRef } from 'react'
import { MessageError, type MessageKey } from '../language/i18n'
import { isExtension } from '../settings/settings-store'
import { closeVisitTab } from './visit'

export function useCloseTab({
  onError,
  previewError,
  closeError,
}: {
  onError: (error: MessageError) => void
  previewError: MessageKey
  closeError: MessageKey
}) {
  const active = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      window.clearTimeout(timer.current)
    }
  }, [])

  return async () => {
    window.clearTimeout(timer.current)
    try {
      await closeVisitTab()
      if (active.current && !isExtension) {
        timer.current = window.setTimeout(() => {
          if (!window.closed) onError(new MessageError(previewError))
        }, 200)
      }
    } catch {
      if (active.current) onError(new MessageError(closeError))
    }
  }
}
