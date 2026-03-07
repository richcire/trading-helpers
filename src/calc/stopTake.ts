import type { Direction, Settings } from '../types'

function getFeeRates(settings: Settings) {
  return {
    feeEntry: settings.feeEntryPct / 100,
    feeExit: settings.feeExitPct / 100,
  }
}

export function calcStopTakeByPct(
  direction: Direction,
  E: number,
  rPct: number,
  settings: Settings,
): number {
  const r = rPct / 100
  if (!settings.adjustStopTakePriceForFees) {
    const sign = direction === 'LONG' ? 1 : -1
    return E * (1 + sign * r)
  }

  const { feeEntry, feeExit } = getFeeRates(settings)

  if (direction === 'LONG') {
    return E * (1 + r) * (1 + feeEntry) / (1 - feeExit)
  }

  return E * (1 - r) * (1 - feeEntry) / (1 + feeExit)
}

export function calcStopTakeByAmount(
  direction: Direction,
  E: number,
  Q: number,
  targetPnl: number,
  settings: Settings,
): number {
  if (!settings.adjustStopTakePriceForFees) {
    const sign = direction === 'LONG' ? 1 : -1
    return E + targetPnl / (sign * Q)
  }

  const { feeEntry, feeExit } = getFeeRates(settings)

  if (direction === 'LONG') {
    return (targetPnl + E * Q * (1 + feeEntry)) / (Q * (1 - feeExit))
  }

  return (E * Q * (1 - feeEntry) - targetPnl) / (Q * (1 + feeExit))
}
