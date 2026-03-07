import type { ExpectancyResult } from '../types'

export function calcExpectancyByRR(winRatePct: number, RR: number): ExpectancyResult | null {
  if (!Number.isFinite(winRatePct) || !Number.isFinite(RR) || winRatePct < 0 || winRatePct > 100 || RR <= 0) {
    return null
  }

  const p = winRatePct / 100
  const q = 1 - p
  const expectancy = p * RR - q
  const breakEvenWinRate = 1 / (1 + RR)

  return {
    expectancy,
    breakEvenWinRate,
    isPositive: expectancy > 0,
  }
}

export function calcExpectancyByAmount(
  winRatePct: number,
  avgWin: number,
  avgLoss: number,
): ExpectancyResult | null {
  if (
    !Number.isFinite(winRatePct) ||
    !Number.isFinite(avgWin) ||
    !Number.isFinite(avgLoss) ||
    winRatePct < 0 ||
    winRatePct > 100 ||
    avgWin <= 0 ||
    avgLoss <= 0
  ) {
    return null
  }

  const p = winRatePct / 100
  const q = 1 - p
  const expectancy = p * avgWin - q * avgLoss
  const breakEvenWinRate = avgLoss / (avgWin + avgLoss)

  return {
    expectancy,
    breakEvenWinRate,
    isPositive: expectancy > 0,
  }
}

export function generateBreakEvenCurve(): { RR: number; breakEvenWinRate: number }[] {
  const points: { RR: number; breakEvenWinRate: number }[] = []

  for (let RR = 0.2; RR <= 5.0001; RR += 0.1) {
    const rounded = Number.parseFloat(RR.toFixed(1))
    points.push({
      RR: rounded,
      breakEvenWinRate: 1 / (1 + rounded),
    })
  }

  return points
}
