import { useState, type FormEvent } from 'react'
import { countWords, minimumWords, type DomainRule } from './policy'
import { isExtension } from './settings-store'
import { approveVisit, closeVisitTab } from './visit'
import { MessageError } from './i18n'
import { useLanguage } from './use-language'
import {
  verificationMethods,
  verificationModes,
  type VerificationMode,
} from './verification'

export function useVisit(
  target: string,
  site: DomainRule | undefined,
  preview: boolean,
  mode: VerificationMode | null,
  visitQuestionEnabled: boolean | null,
) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [codeEntry, setCode] = useState({ mode, value: '' })
  const code = codeEntry.mode === mode ? codeEntry.value : ''
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<MessageError[]>([])
  const [finished, setFinished] = useState(false)

  async function continueToSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !site || !mode || visitQuestionEnabled === null) return
    const errors: MessageError[] = []
    if (visitQuestionEnabled && countWords(reason) < minimumWords) {
      errors.push(new MessageError('reasonTooShort', { count: minimumWords }))
    }
    const inputError = verificationMethods[mode].validateInput(code)
    if (inputError) errors.push(new MessageError(inputError))
    if (errors.length > 0) {
      setErrors(errors)
      return
    }
    setBusy(true)
    setErrors([])
    try {
      const response = await approveVisit({ target, reason, code }, preview)
      const rejectedMethod = verificationModes.find(
        (id) => verificationMethods[id].errorCode === response?.error,
      )
      if (rejectedMethod) {
        setErrors([
          new MessageError(verificationMethods[rejectedMethod].invalidCode),
        ])
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
    setCode({ mode, value: '' })
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
    setCode({ mode, value })
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
