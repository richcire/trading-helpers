import { CURRENCY_CODES, type Direction, type Settings } from '../types'

const currencyCodeSet = new Set(CURRENCY_CODES)

export function parsePositiveNumber(value: string): number | null {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parseNonNegativeNumber(value: string): number | null {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function isPositiveNumber(val: string): boolean {
  return parsePositiveNumber(val) !== null
}

export function isNonNegativeNumber(val: string): boolean {
  return parseNonNegativeNumber(val) !== null
}

export function validateSettings(settings: Settings): string[] {
  const errors: string[] = []

  if (settings.leverage < 1) {
    errors.push('레버리지는 1 이상이어야 합니다')
  }

  if (settings.feeEntryPct < 0 || settings.feeEntryPct >= 100) {
    errors.push('진입 수수료는 0~100% 미만이어야 합니다')
  }

  if (settings.feeExitPct < 0 || settings.feeExitPct >= 100) {
    errors.push('청산 수수료는 0~100% 미만이어야 합니다')
  }

  if (!currencyCodeSet.has(settings.currency)) {
    errors.push('지원하지 않는 통화입니다')
  }

  return errors
}

export function validateSizingDirection(
  direction: Direction,
  entryPrice: number,
  stopPrice: number,
): string | null {
  if (direction === 'LONG' && stopPrice >= entryPrice) {
    return 'LONG 포지션의 손절가는 진입가보다 낮아야 합니다'
  }

  if (direction === 'SHORT' && stopPrice <= entryPrice) {
    return 'SHORT 포지션의 손절가는 진입가보다 높아야 합니다'
  }

  return null
}
