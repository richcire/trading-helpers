import { createContext } from 'react'

import type { LanguageCode } from './types'

export interface I18nContextValue {
  language: LanguageCode
  locale: string
  setLanguage: (next: LanguageCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
