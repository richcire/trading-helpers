import type { Direction, PnlResult, Settings } from '../types'

function getFeeRates(settings: Settings) {
  return {
    feeEntry: settings.feeEntryPct / 100,
    feeExit: settings.feeExitPct / 100,
  }
}

export function calcPnl(
  direction: Direction,
  E: number,
  P: number,
  Q: number,
  settings: Settings,
): PnlResult {
  if (![E, P, Q, settings.leverage].every(Number.isFinite) || E <= 0 || P <= 0 || Q <= 0) {
    return { pnlAmount: 0, pnlPct: 0 }
  }

  const { feeEntry, feeExit } = getFeeRates(settings)
  const leverage = settings.leverage > 0 ? settings.leverage : 1

  let pnlAmount = 0
  let baseCost = E * Q

  if (!settings.includeFeesInPnL) {
    const sign = direction === 'LONG' ? 1 : -1
    pnlAmount = sign * (P - E) * Q
  } else if (direction === 'LONG') {
    pnlAmount = P * Q * (1 - feeExit) - E * Q * (1 + feeEntry)
    baseCost = E * Q * (1 + feeEntry)
  } else {
    pnlAmount = E * Q * (1 - feeEntry) - P * Q * (1 + feeExit)
    baseCost = E * Q * (1 - feeEntry)
  }

  const pnlPct = baseCost !== 0 ? (pnlAmount / baseCost) * 100 : 0
  const margin = (E * Q) / leverage
  const roiPct = margin !== 0 ? (pnlAmount / margin) * 100 : undefined

  return {
    pnlAmount,
    pnlPct,
    roiPct,
  }
}
