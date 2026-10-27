import { useState, type FormEvent } from 'react'
import { countWords, minimumWords, type DomainRule } from './policy'
import { isExtension } from './settings-store'
import { approveVisit, closeVisitTab } from './visit'
import { MessageError } from './i18n'
import { useLanguage } from './use-language'

export function useVisit(
  target: string,
  site: DomainRule | undefined,
  preview: boolean,
) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<MessageError[]>([])
  const [finished, setFinished] = useState(false)

  async function continueToSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !site) return
    const errors: MessageError[] = []
    if (countWords(reason) < minimumWords) {
      errors.push(new MessageError('reasonTooShort', { count: minimumWords }))
    }
    if (!/^\d{6}$/.test(code)) {
      errors.push(new MessageError('invalidTotpFormat'))
    }
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setBusy(true)
    setErrors([])
    try {
      const response = await approveVisit({ target, reason, code }, preview)
      if (response?.error === 'invalid-totp') {
        setErrors([new MessageError('invalidTotp')])
        return
      }
      if (!response?.ok) throw new Error('Approval failed')
      if (preview) setFinished(true)
    } catch {
      setErrors([new MessageError('openError')])
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setReason('')
    setCode('')
    setFinished(false)
    setErrors([])
  }

  async function closeWindow() {
    setErrors([])
    try {
      await closeVisitTab()
      if (!isExtension) {
        window.setTimeout(() => {
          if (!window.closed) setErrors([new MessageError('closePreview')])
        }, 200)
      }
    } catch {
      setErrors([new MessageError('closeError')])
    }
  }

  function changeReason(value: string) {
    setReason(value)
    setErrors([])
  }

  function changeCode(value: string) {
    setCode(value)
    setErrors([])
  }

  return {
    reason,
    code,
    busy,
    error: errors.map((error) => t(error.key, error.params)).join(' '),
    finished,
    changeReason,
    changeCode,
    continueToSite,
    reset,
    closeWindow,
  }
}
