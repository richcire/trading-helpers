import { CURRENCY_CODES, type Direction, type Settings } from '../types'

const currencyCodeSet = new Set(CURRENCY_CODES)
export type SettingsValidationErrorCode =
  | 'validation.settings.leverage'
  | 'validation.settings.feeEntry'
  | 'validation.settings.feeExit'
  | 'validation.settings.currency'

export type SizingValidationErrorCode =
  | 'validation.sizing.long'
  | 'validation.sizing.short'

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

export function validateSettings(settings: Settings): SettingsValidationErrorCode[] {
  const errors: SettingsValidationErrorCode[] = []

  if (settings.leverage < 1) {
    errors.push('validation.settings.leverage')
  }

  if (settings.feeEntryPct < 0 || settings.feeEntryPct >= 100) {
    errors.push('validation.settings.feeEntry')
  }

  if (settings.feeExitPct < 0 || settings.feeExitPct >= 100) {
    errors.push('validation.settings.feeExit')
  }

  if (!currencyCodeSet.has(settings.currency)) {
    errors.push('validation.settings.currency')
  }

  return errors
}

export function validateSizingDirection(
  direction: Direction,
  entryPrice: number,
  stopPrice: number,
): SizingValidationErrorCode | null {
  if (direction === 'LONG' && stopPrice >= entryPrice) {
    return 'validation.sizing.long'
  }

  if (direction === 'SHORT' && stopPrice <= entryPrice) {
    return 'validation.sizing.short'
  }

  return null
}
