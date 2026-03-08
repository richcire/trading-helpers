import { useEffect, useMemo, type ReactNode } from 'react'

import { useSettingsStore } from '../store/useSettingsStore'
import { I18nContext, type I18nContextValue } from './context'
import { setActiveLocale } from './language'
import { dictionaries } from './dictionaries'
import { getLocaleForLanguage, normalizeLanguage } from './language'

function applyParams(template: string, params?: Record<string, string | number>) {
  if (!params) {
    return template
  }

  return Object.entries(params).reduce((acc, [name, value]) => {
    return acc.replaceAll(`{${name}}`, String(value))
  }, template)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, setSettings } = useSettingsStore()
  const language = normalizeLanguage(settings.language)
  const locale = getLocaleForLanguage(language)

  useEffect(() => {
    setActiveLocale(locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[language]

    return {
      language,
      locale,
      setLanguage: (next) => setSettings({ language: next }),
      t: (key, params) => {
        const localized = dictionary[key] ?? dictionaries.en[key] ?? key
        return applyParams(localized, params)
      },
    }
  }, [language, locale, setSettings])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
