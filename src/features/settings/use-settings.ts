import { useEffect, useState } from 'react'
import { createDraft, normalizeDrafts } from '../domains/domain-draft'
import {
  isExtension,
  readLanguage,
  readVisitSettings,
  saveSites,
  saveLanguage,
  saveVerification,
  saveVisitQuestionEnabled,
  saveVisitQuestionText,
} from './settings-store'
import { normalizeVerification } from '../verification/verification'
import { useCloseTab } from '../visit/use-close-tab'
import { asMessageError, MessageError, type Language } from '../language/i18n'
import { useLanguage } from '../language/use-language'
import { useSettingsDraft } from './use-settings-draft'

export function useSettings() {
  const { setLanguage, t } = useLanguage()
  const draft = useSettingsDraft()
  const { values, revision, initialize } = draft
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{
    revision: number
    error?: MessageError
    saved?: boolean
  }>({ revision: 0 })
  // Every edit invalidates feedback in one place, including async save results.
  const currentFeedback = feedback.revision === revision ? feedback : null
  const closeTab = useCloseTab({
    onError: (error) => setFeedback({ revision, error }),
    previewError: 'settingsClosePreview',
    closeError: 'settingsCloseError',
  })

  useEffect(() => {
    let active = true
    void Promise.all([readVisitSettings(), readLanguage()])
      .then(([{ sites, ...settings }, language]) => {
        if (active) {
          initialize({ ...settings, language, rows: sites.map(createDraft) })
          setLoadStatus('ready')
        }
      })
      .catch(() => {
        if (active) {
          setFeedback({ revision: 0, error: new MessageError('loadError') })
          setLoadStatus('failed')
        }
      })
    return () => {
      active = false
    }
  }, [initialize])

  async function save() {
    if (busy || loadStatus !== 'ready') return
    setFeedback({ revision })
    try {
      if (
        values.visitQuestionEnabled &&
        values.visitQuestionText !== null &&
        !values.visitQuestionText.trim()
      )
        throw new MessageError('visitQuestionRequired')
      const sites = normalizeDrafts(values.rows)
      const verification = normalizeVerification(values.verification)
      const normalized = {
        ...values,
        verification,
        visitQuestionText: values.visitQuestionText?.trim() || null,
        rows: sites.map((site, index) => ({ ...values.rows[index], ...site })),
      }
      setBusy(true)
      // Request access directly from the submit gesture before any async work.
      if (isExtension && sites.length > 0) {
        const granted = await browser.permissions.request({
          origins: sites.map(({ domain }) => `*://*.${domain}/*`),
        })
        if (!granted) throw new MessageError('permissionError')
      }
      await saveSites(sites)
      await saveLanguage(normalized.language)
      await saveVerification(normalized.verification)
      await saveVisitQuestionEnabled(normalized.visitQuestionEnabled)
      await saveVisitQuestionText(normalized.visitQuestionText)
      draft.commit(normalized, revision)
      setFeedback({ revision, saved: true })
    } catch (cause) {
      setFeedback({ revision, error: asMessageError(cause, 'saveError') })
    } finally {
      setBusy(false)
    }
  }

  async function closeWindow() {
    if (busy) return
    setFeedback({ revision })
    await closeTab()
  }

  function changeLanguage(value: Language) {
    draft.changeLanguage(value)
    setLanguage(value)
  }

  const error = currentFeedback?.error
  return {
    ...values,
    dirty: draft.dirty,
    loading: loadStatus === 'loading',
    loadFailed: loadStatus === 'failed',
    busy,
    error: error ? t(error.key, error.params) : '',
    saved: currentFeedback?.saved ?? false,
    changeVisitQuestionText: draft.changeVisitQuestionText,
    changeVisitQuestionEnabled: draft.changeVisitQuestionEnabled,
    changeVerification: draft.changeVerification,
    edit: draft.edit,
    add: draft.add,
    remove: draft.remove,
    closeWindow,
    save,
    changeLanguage,
  }
}
