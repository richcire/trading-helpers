import type { Direction, Settings } from '../types'

export function calcSizing(
  direction: Direction,
  entryPrice: number,
  stopPrice: number,
  riskAmount: number,
  settings: Settings,
): number | null {
  if (direction === 'LONG' && stopPrice >= entryPrice) {
    return null
  }

  if (direction === 'SHORT' && stopPrice <= entryPrice) {
    return null
  }

  const feeEntry = settings.includeFeesInPnL ? settings.feeEntryPct / 100 : 0
  const feeExit = settings.includeFeesInPnL ? settings.feeExitPct / 100 : 0

  const lossPerUnit =
    direction === 'LONG'
      ? entryPrice * (1 + feeEntry) - stopPrice * (1 - feeExit)
      : stopPrice * (1 + feeExit) - entryPrice * (1 - feeEntry)

  if (!Number.isFinite(lossPerUnit) || lossPerUnit <= 0 || riskAmount <= 0) {
    return null
  }

  return riskAmount / lossPerUnit
}
