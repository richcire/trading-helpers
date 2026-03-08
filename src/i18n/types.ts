export const LANGUAGE_CODES = ['en', 'ko', 'ja'] as const

export type LanguageCode = (typeof LANGUAGE_CODES)[number]

export const LOCALE_BY_LANGUAGE: Record<LanguageCode, string> = {
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
}

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
}
