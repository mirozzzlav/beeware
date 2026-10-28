import { useCallback, useReducer } from 'react'
import { createDraft } from '../domains/domain-draft'
import type { DomainRule } from '../domains/policy'
import type { Language } from '../language/i18n'
import type { VerificationSettings } from '../verification/verification'
import {
  createSettingsDraft,
  isSettingsDraftDirty,
  settingsDraftReducer,
  type SettingsDraftValues,
} from './settings-draft'

export function useSettingsDraft() {
  const [state, dispatch] = useReducer(
    settingsDraftReducer,
    undefined,
    createSettingsDraft,
  )
  const initialize = useCallback((values: SettingsDraftValues) => {
    dispatch({ type: 'initialize', values })
  }, [])

  function commit(values: SettingsDraftValues, revision: number) {
    dispatch({ type: 'commit', values, revision })
  }

  function edit(id: string, field: keyof DomainRule, value: string) {
    dispatch({ type: 'edit', id, field, value })
  }

  function add() {
    // Generate IDs in the event handler, keeping the reducer pure in StrictMode.
    dispatch({ type: 'add', row: createDraft({ domain: '', name: '' }) })
  }

  function remove(id: string) {
    dispatch({ type: 'remove', id })
  }

  function changeLanguage(value: Language) {
    dispatch({ type: 'change', field: 'language', value })
  }

  function changeVerification(value: VerificationSettings) {
    dispatch({ type: 'change', field: 'verification', value })
  }

  function changeVisitQuestionEnabled(value: boolean) {
    dispatch({ type: 'change', field: 'visitQuestionEnabled', value })
  }

  function changeVisitQuestionText(value: string) {
    dispatch({ type: 'change', field: 'visitQuestionText', value })
  }

  return {
    values: state.values,
    revision: state.revision,
    dirty: isSettingsDraftDirty(state),
    initialize,
    commit,
    edit,
    add,
    remove,
    changeLanguage,
    changeVerification,
    changeVisitQuestionEnabled,
    changeVisitQuestionText,
  }
}
