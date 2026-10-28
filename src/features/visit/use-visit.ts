import { useState } from 'react'
import { countWords, minimumWords } from '../domains/policy'
import { approveVisit } from './visit'
import { useCloseTab } from './use-close-tab'
import { MessageError } from '../language/i18n'
import { useLanguage } from '../language/use-language'
import {
  verificationMethods,
  verificationModes,
  type VerificationMode,
} from '../verification/verification'

export function useVisit(
  target: string,
  preview: boolean,
  mode: VerificationMode,
  visitQuestionEnabled: boolean,
) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<MessageError[]>([])
  const [finished, setFinished] = useState(false)
  const closeTab = useCloseTab({
    onError: (error) => setErrors([error]),
    previewError: 'closePreview',
    closeError: 'closeError',
  })

  async function continueToSite() {
    if (busy) return
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
    setCode('')
    setFinished(false)
    setErrors([])
  }

  async function closeWindow() {
    if (busy) return
    setErrors([])
    await closeTab()
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
