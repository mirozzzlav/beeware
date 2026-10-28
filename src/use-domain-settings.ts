import { useEffect, useState, type FormEvent, type SetStateAction } from 'react'
import type { DomainRule } from './policy'
import {
  createDraft,
  editDraft,
  normalizeDrafts,
  type DraftRule,
} from './domain-draft'
import {
  isExtension,
  readSites,
  saveSites,
  saveLanguage,
  readVerification,
  saveVerification,
  readVisitQuestionEnabled,
  saveVisitQuestionEnabled,
  readVisitQuestionText,
  saveVisitQuestionText,
} from './settings-store'
import { initialSettings } from './initial-settings'
import {
  normalizeVerification,
  type VerificationSettings,
} from './verification'
import { closeVisitTab } from './visit'
import { asMessageError, MessageError, type Language } from './i18n'
import { useLanguage } from './use-language'

export function useDomainSettings() {
  const { language, setLanguage, t } = useLanguage()
  const [rows, setRows] = useState<DraftRule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<MessageError | null>(null)
  const [saved, setSaved] = useState(false)
  const [visitQuestionText, setVisitQuestionText] = useState<string | null>(
    null,
  )
  const [visitQuestionEnabled, setVisitQuestionEnabled] = useState(
    initialSettings.visitQuestionEnabled,
  )
  const [verification, setVerification] = useState<VerificationSettings>(() =>
    normalizeVerification(undefined),
  )
  useEffect(() => {
    let active = true
    void Promise.all([
      readSites(),
      readVerification(),
      readVisitQuestionEnabled(),
      readVisitQuestionText(),
    ])
      .then(
        ([sites, verification, visitQuestionEnabled, visitQuestionText]) => {
          if (active) {
            setVisitQuestionText(visitQuestionText)
            setVisitQuestionEnabled(visitQuestionEnabled)
            setVerification(verification)
            setRows(sites.map(createDraft))
            setLoading(false)
          }
        },
      )
      .catch(() => {
        if (active) {
          setError(new MessageError('loadError'))
          setLoadFailed(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  function edit(id: string, field: keyof DomainRule, value: string) {
    updateRows((previous) =>
      previous.map((row) =>
        row.id === id ? editDraft(row, field, value) : row,
      ),
    )
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || loading || loadFailed) return
    setError(null)
    setSaved(false)
    try {
      if (
        visitQuestionEnabled &&
        visitQuestionText !== null &&
        !visitQuestionText.trim()
      )
        throw new MessageError('visitQuestionRequired')
      const sites = normalizeDrafts(rows)
      const normalizedVerification = normalizeVerification(verification)
      setBusy(true)
      // Request access directly from the submit gesture before any async work.
      if (isExtension && sites.length > 0) {
        const granted = await browser.permissions.request({
          origins: sites.map(({ domain }) => `*://*.${domain}/*`),
        })
        if (!granted) throw new MessageError('permissionError')
      }
      await saveSites(sites)
      await saveLanguage(language)
      await saveVerification(normalizedVerification)
      await saveVisitQuestionEnabled(visitQuestionEnabled)
      await saveVisitQuestionText(visitQuestionText)
      setVisitQuestionText(visitQuestionText?.trim() || null)
      setRows((previous) =>
        sites.map((site, index) => ({ ...previous[index], ...site })),
      )
      setSaved(true)
    } catch (cause) {
      setError(asMessageError(cause, 'saveError'))
    } finally {
      setBusy(false)
    }
  }

  function updateRows(update: SetStateAction<DraftRule[]>) {
    setRows(update)
    setSaved(false)
    setError(null)
  }

  function add() {
    updateRows((previous) => [
      ...previous,
      createDraft({ domain: '', name: '' }),
    ])
  }

  function remove(id: string) {
    updateRows((previous) => previous.filter((row) => row.id !== id))
  }

  async function closeWindow() {
    if (busy) return
    setError(null)
    try {
      await closeVisitTab()
      if (!isExtension) {
        window.setTimeout(() => {
          if (!window.closed) setError(new MessageError('settingsClosePreview'))
        }, 200)
      }
    } catch {
      setError(new MessageError('settingsCloseError'))
    }
  }

  function changeLanguage(value: Language) {
    setLanguage(value)
    setSaved(false)
    setError(null)
  }

  function changeVerification(value: VerificationSettings) {
    setVerification(value)
    setSaved(false)
    setError(null)
  }

  function changeVisitQuestionEnabled(value: boolean) {
    setVisitQuestionEnabled(value)
    setSaved(false)
    setError(null)
  }

  function changeVisitQuestionText(value: string) {
    setVisitQuestionText(value)
    setSaved(false)
    setError(null)
  }

  return {
    rows,
    loading,
    loadFailed,
    busy,
    error: error ? t(error.key, error.params) : '',
    saved,
    verification,
    visitQuestionEnabled,
    visitQuestionText,
    changeVisitQuestionText,
    changeVisitQuestionEnabled,
    changeVerification,
    edit,
    add,
    remove,
    closeWindow,
    save,
    changeLanguage,
  }
}
