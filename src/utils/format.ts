import { getActiveLocale } from '../i18n/language'
import type { CurrencyCode } from '../types'

function getNumberFormatter(decimals: number) {
  return new Intl.NumberFormat(getActiveLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return getNumberFormatter(decimals).format(value)
}

export function formatPnl(value: number, decimals = 2): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatNumber(value, decimals)}`
}

export function formatPct(value: number, decimals = 2): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatNumber(value, decimals)}%`
}

export function formatCurrencyUnit(currency: CurrencyCode): string {
  return currency
}

export function formatCurrencyValue(value: number, currency: CurrencyCode, decimals = 2): string {
  return `${formatNumber(value, decimals)} ${formatCurrencyUnit(currency)}`
}
