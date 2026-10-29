import { appSlug } from '../../app-info.ts'
import { initialSettings } from './initial-settings.ts'
import {
  normalizeRules,
  protectedSites,
  type DomainRule,
} from '../domains/policy.ts'
import { generateTotpSecret } from '../verification/totp/totp.ts'
import {
  MessageError,
  normalizeLanguage,
  type Language,
} from '../language/i18n.ts'
import {
  normalizeVerification,
  type VerificationSettings,
} from '../verification/verification.ts'

export const verificationStorageKey = 'verification'

export const visitQuestionStorageKey = 'visitQuestionEnabled'
export const visitQuestionTextStorageKey = 'visitQuestionText'

function normalizeQuestionText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeQuestionEnabled(value: unknown): boolean {
  return typeof value === 'boolean'
    ? value
    : initialSettings.visitQuestionEnabled
}

function normalizeSites(value: unknown): DomainRule[] {
  return value === undefined || value === null
    ? protectedSites.map((rule) => ({ ...rule }))
    : normalizeRules(value)
}

export async function readVisitQuestionEnabled(): Promise<boolean> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(visitQuestionStorageKey))[
        visitQuestionStorageKey
      ]
    : readPreviewSettings()[visitQuestionStorageKey]
  return normalizeQuestionEnabled(value)
}

export async function readVerification(): Promise<VerificationSettings> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(verificationStorageKey))[
        verificationStorageKey
      ]
    : readPreviewSettings()[verificationStorageKey]
  return normalizeVerification(value)
}

export const languageStorageKey = 'language'

export async function readLanguage(): Promise<Language> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(languageStorageKey))[languageStorageKey]
    : readPreviewSettings()[languageStorageKey]
  return normalizeLanguage(value)
}

export const sitesStorageKey = 'domainRules'
export const isExtension =
  typeof browser !== 'undefined' && Boolean(browser.runtime?.id)

export async function readSites(): Promise<DomainRule[]> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(sitesStorageKey))[sitesStorageKey]
    : readPreviewSettings()[sitesStorageKey]
  return normalizeSites(value)
}

export const visitSettingsStorageKeys = [
  sitesStorageKey,
  verificationStorageKey,
  visitQuestionStorageKey,
  visitQuestionTextStorageKey,
]

// Read one extension snapshot. Preview reads are synchronous before yielding,
// so a storage event cannot publish just one part of the visit configuration.
export async function readVisitSettings() {
  const values: Record<string, unknown> = isExtension
    ? await browser.storage.local.get(visitSettingsStorageKeys)
    : readPreviewSettings()
  return {
    sites: normalizeSites(values[sitesStorageKey]),
    verification: normalizeVerification(values[verificationStorageKey]),
    visitQuestionEnabled: normalizeQuestionEnabled(
      values[visitQuestionStorageKey],
    ),
    visitQuestionText: normalizeQuestionText(
      values[visitQuestionTextStorageKey],
    ),
  }
}

export const previewSettingsStorageKey = `${appSlug}-settings`

function readPreviewSettings(): Record<string, unknown> {
  const saved = window.localStorage.getItem(previewSettingsStorageKey)
  if (saved !== null) {
    const value: unknown = JSON.parse(saved)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Invalid preview settings')
    return value as Record<string, unknown>
  }
  // Read older preview installations until the first complete save.
  return {
    [sitesStorageKey]: JSON.parse(
      window.localStorage.getItem(sitesStorageKey) ?? 'null',
    ),
    [verificationStorageKey]: JSON.parse(
      window.localStorage.getItem(verificationStorageKey) ?? 'null',
    ),
    [visitQuestionStorageKey]: JSON.parse(
      window.localStorage.getItem(visitQuestionStorageKey) ?? 'null',
    ),
    [visitQuestionTextStorageKey]: window.localStorage.getItem(
      visitQuestionTextStorageKey,
    ),
    [languageStorageKey]: window.localStorage.getItem(languageStorageKey),
  }
}

interface SettingsValues {
  sites: DomainRule[]
  language: Language
  verification: VerificationSettings
  visitQuestionEnabled: boolean
  visitQuestionText: string | null
}

export async function saveSettings(settings: SettingsValues): Promise<void> {
  // Normalize everything before writing, then publish one complete configuration.
  const values = {
    [sitesStorageKey]: normalizeRules(settings.sites),
    [languageStorageKey]: normalizeLanguage(settings.language),
    [verificationStorageKey]: normalizeVerification(settings.verification),
    [visitQuestionStorageKey]: normalizeQuestionEnabled(
      settings.visitQuestionEnabled,
    ),
    [visitQuestionTextStorageKey]: normalizeQuestionText(
      settings.visitQuestionText,
    ),
  }
  if (isExtension) await browser.storage.local.set(values)
  else
    window.localStorage.setItem(
      previewSettingsStorageKey,
      JSON.stringify(values),
    )
}

export const totpStorageKey = 'totpSecret'
let secretInitialization: Promise<string> | undefined

// Extension pages delegate initialization to the background context so opening
// multiple pages at once cannot replace the shared secret.
export async function readTotpSecret(): Promise<string> {
  if (isExtension) {
    const response = (await browser.runtime.sendMessage({
      type: 'get-totp-secret',
    })) as { secret?: unknown }
    if (typeof response?.secret !== 'string')
      throw new MessageError('totpLoadError')
    return response.secret
  }
  return navigator.locks.request(`${appSlug}-totp-secret`, ensureTotpSecret)
}

export function ensureTotpSecret(): Promise<string> {
  if (!secretInitialization) {
    secretInitialization = (async () => {
      const value: unknown = isExtension
        ? (await browser.storage.local.get(totpStorageKey))[totpStorageKey]
        : window.localStorage.getItem(totpStorageKey)
      if (typeof value === 'string' && /^[A-Z2-7]{32}$/.test(value))
        return value
      if (value !== undefined && value !== null)
        throw new MessageError('totpDamaged')
      const secret = generateTotpSecret()
      if (isExtension)
        await browser.storage.local.set({ [totpStorageKey]: secret })
      else window.localStorage.setItem(totpStorageKey, secret)
      return secret
    })().finally(() => {
      secretInitialization = undefined
    })
  }
  return secretInitialization
}
