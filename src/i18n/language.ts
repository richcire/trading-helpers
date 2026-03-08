import type { LanguageCode } from './types'
import { LOCALE_BY_LANGUAGE } from './types'

const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'ko', 'ja']

export function normalizeLanguage(language?: string | null): LanguageCode {
  if (!language) {
    return 'en'
  }

  const lowered = language.toLowerCase()
  if (lowered.startsWith('ko')) {
    return 'ko'
  }
  if (lowered.startsWith('ja')) {
    return 'ja'
  }
  if (lowered.startsWith('en')) {
    return 'en'
  }

  return 'en'
}

export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const fromNavigator = normalizeLanguage(window.navigator.language)
  if (SUPPORTED_LANGUAGES.includes(fromNavigator)) {
    return fromNavigator
  }

  return 'en'
}

let activeLocale = LOCALE_BY_LANGUAGE.en

export function getLocaleForLanguage(language: LanguageCode): string {
  return LOCALE_BY_LANGUAGE[language]
}

export function setActiveLocale(locale: string) {
  activeLocale = locale
}

export function getActiveLocale(): string {
  return activeLocale
}
