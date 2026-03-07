import type { CurrencyCode } from '../types'

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) {
    return '-'
  }

  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
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
