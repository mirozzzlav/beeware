import { editDraft, type DraftRule } from '../domains/domain-draft.ts'
import type { DomainRule } from '../domains/policy.ts'
import type { Language } from '../language/i18n.ts'
import { initialSettings } from './initial-settings.ts'
import {
  normalizeVerification,
  type VerificationSettings,
} from '../verification/verification.ts'

export interface SettingsDraftValues {
  rows: DraftRule[]
  language: Language
  verification: VerificationSettings
  visitQuestionEnabled: boolean
  visitQuestionText: string | null
}

export interface SettingsDraftState {
  values: SettingsDraftValues
  revision: number
}

type FieldChange = {
  [K in Exclude<keyof SettingsDraftValues, 'rows'>]: {
    type: 'change'
    field: K
    value: SettingsDraftValues[K]
  }
}[Exclude<keyof SettingsDraftValues, 'rows'>]

type SettingsDraftAction =
  | { type: 'initialize'; values: SettingsDraftValues }
  | { type: 'commit'; values: SettingsDraftValues; revision: number }
  | { type: 'edit'; id: string; field: keyof DomainRule; value: string }
  | { type: 'add'; row: DraftRule }
  | { type: 'remove'; id: string }
  | FieldChange

export function createSettingsDraft(): SettingsDraftState {
  return {
    values: {
      rows: [],
      language: initialSettings.language,
      verification: normalizeVerification(undefined),
      visitQuestionEnabled: initialSettings.visitQuestionEnabled,
      visitQuestionText: null,
    },
    revision: 0,
  }
}

export function settingsDraftReducer(
  state: SettingsDraftState,
  action: SettingsDraftAction,
): SettingsDraftState {
  if (action.type === 'initialize')
    return { values: action.values, revision: 0 }
  if (action.type === 'commit') {
    return {
      ...state,
      // A save acknowledges its snapshot, never edits made while it was pending.
      values: action.revision === state.revision ? action.values : state.values,
    }
  }

  let values: SettingsDraftValues
  switch (action.type) {
    case 'change':
      values = { ...state.values, [action.field]: action.value }
      break
    case 'edit':
      values = {
        ...state.values,
        rows: state.values.rows.map((row) =>
          row.id === action.id
            ? editDraft(row, action.field, action.value)
            : row,
        ),
      }
      break
    case 'add':
      values = { ...state.values, rows: [...state.values.rows, action.row] }
      break
    case 'remove':
      values = {
        ...state.values,
        rows: state.values.rows.filter((row) => row.id !== action.id),
      }
  }
  return { ...state, values, revision: state.revision + 1 }
}
