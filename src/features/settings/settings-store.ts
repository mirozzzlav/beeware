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

export async function readVisitQuestionText(): Promise<string | null> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(visitQuestionTextStorageKey))[
        visitQuestionTextStorageKey
      ]
    : window.localStorage.getItem(visitQuestionTextStorageKey)
  return normalizeQuestionText(value)
}

export async function saveVisitQuestionText(
  value: string | null,
): Promise<void> {
  const text = value?.trim() || null
  if (isExtension)
    await browser.storage.local.set({ [visitQuestionTextStorageKey]: text })
  else if (text === null)
    window.localStorage.removeItem(visitQuestionTextStorageKey)
  else window.localStorage.setItem(visitQuestionTextStorageKey, text)
}

export async function readVisitQuestionEnabled(): Promise<boolean> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(visitQuestionStorageKey))[
        visitQuestionStorageKey
      ]
    : JSON.parse(window.localStorage.getItem(visitQuestionStorageKey) ?? 'null')
  return normalizeQuestionEnabled(value)
}

export async function saveVisitQuestionEnabled(value: boolean): Promise<void> {
  if (isExtension)
    await browser.storage.local.set({ [visitQuestionStorageKey]: value })
  else
    window.localStorage.setItem(visitQuestionStorageKey, JSON.stringify(value))
}

export async function readVerification(): Promise<VerificationSettings> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(verificationStorageKey))[
        verificationStorageKey
      ]
    : JSON.parse(window.localStorage.getItem(verificationStorageKey) ?? 'null')
  return normalizeVerification(value)
}

export async function saveVerification(
  value: VerificationSettings,
): Promise<void> {
  const normalized = normalizeVerification(value)
  if (isExtension)
    await browser.storage.local.set({ [verificationStorageKey]: normalized })
  else
    window.localStorage.setItem(
      verificationStorageKey,
      JSON.stringify(normalized),
    )
}

export const languageStorageKey = 'language'

export async function readLanguage(): Promise<Language> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(languageStorageKey))[languageStorageKey]
    : window.localStorage.getItem(languageStorageKey)
  return normalizeLanguage(value)
}

export async function saveLanguage(language: Language): Promise<void> {
  const normalized = normalizeLanguage(language)
  if (isExtension)
    await browser.storage.local.set({ [languageStorageKey]: normalized })
  else window.localStorage.setItem(languageStorageKey, normalized)
}

export const sitesStorageKey = 'domainRules'
export const isExtension =
  typeof browser !== 'undefined' && Boolean(browser.runtime?.id)

export async function readSites(): Promise<DomainRule[]> {
  const value: unknown = isExtension
    ? (await browser.storage.local.get(sitesStorageKey))[sitesStorageKey]
    : JSON.parse(window.localStorage.getItem(sitesStorageKey) ?? 'null')
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
    : {
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
      }
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

export async function saveSites(sites: DomainRule[]): Promise<void> {
  const normalized = normalizeRules(sites)
  if (isExtension)
    await browser.storage.local.set({ [sitesStorageKey]: normalized })
  else window.localStorage.setItem(sitesStorageKey, JSON.stringify(normalized))
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
