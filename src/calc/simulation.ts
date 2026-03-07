import type { Direction, Settings, SimPoint } from '../types'
import { calcPnl } from './pnl'

export function generateSimulation(
  direction: Direction,
  E: number,
  Q: number,
  minPrice: number,
  maxPrice: number,
  steps: number,
  settings: Settings,
): SimPoint[] {
  const clampedSteps = Math.min(1000, Math.max(10, Math.round(steps)))
  const low = Math.min(minPrice, maxPrice)
  const high = Math.max(minPrice, maxPrice)
  const points: SimPoint[] = []

  if (![E, Q, low, high].every(Number.isFinite) || E <= 0 || Q <= 0 || low <= 0 || high <= 0) {
    return points
  }

  for (let index = 0; index < clampedSteps; index += 1) {
    const ratio = clampedSteps === 1 ? 0 : index / (clampedSteps - 1)
    const price = low + (high - low) * ratio
    const result = calcPnl(direction, E, price, Q, settings)
    points.push({
      price,
      pnlAmount: result.pnlAmount,
      pnlPct: result.pnlPct,
      roiPct: result.roiPct,
    })
  }

  return points
}
