import type { Direction, Settings } from '../types'

export function calcBreakeven(direction: Direction, E: number, settings: Settings): number {
  if (!settings.includeFeesInPnL) {
    return E
  }

  const feeEntry = settings.feeEntryPct / 100
  const feeExit = settings.feeExitPct / 100

  if (direction === 'LONG') {
    return E * (1 + feeEntry) / (1 - feeExit)
  }

  return E * (1 - feeEntry) / (1 + feeExit)
}
