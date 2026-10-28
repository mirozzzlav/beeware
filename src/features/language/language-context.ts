import { createContext } from 'react'
import type { Language, MessageKey, MessageParams } from './i18n'

export const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey, params?: MessageParams) => string
} | null>(null)
