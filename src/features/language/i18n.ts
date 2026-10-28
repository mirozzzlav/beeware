import locales from './locales.json' with { type: 'json' }
import { appName } from '../../app-info.ts'
import { initialSettings } from '../settings/initial-settings.ts'

export type Language = keyof typeof locales
export type MessageKey = keyof typeof locales.sk.messages
export type MessageParams = Record<string, string | number>
export const defaultLanguage: Language = initialSettings.language

// All languages must provide the same keys. Adding a locale also adds its option.
const dictionaries: Record<
  Language,
  { name: string; messages: Record<MessageKey, string> }
> = locales
export const languages = Object.entries(dictionaries)
  .map(([code, locale]) => ({
    code: code as Language,
    name: locale.name,
  }))
  .sort((a, b) => {
    if (a.code === defaultLanguage) return -1
    if (b.code === defaultLanguage) return 1
    return a.name.localeCompare(b.name, defaultLanguage)
  })

export function normalizeLanguage(value: unknown): Language {
  return typeof value === 'string' && Object.hasOwn(dictionaries, value)
    ? (value as Language)
    : defaultLanguage
}

export function translate(
  language: Language,
  key: MessageKey,
  params: MessageParams = {},
): string {
  const message =
    dictionaries[language]?.messages[key] ??
    dictionaries[defaultLanguage].messages[key]
  const values: MessageParams = { ...params, appName }
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  )
}

export class MessageError extends Error {
  key: MessageKey
  params: MessageParams

  constructor(key: MessageKey, params: MessageParams = {}) {
    super(translate(defaultLanguage, key, params))
    this.key = key
    this.params = params
  }
}

export function asMessageError(
  cause: unknown,
  fallback: MessageKey,
): MessageError {
  return cause instanceof MessageError ? cause : new MessageError(fallback)
}
