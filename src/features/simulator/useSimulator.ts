import { useMemo, useState } from 'react'

import { calcPnl, generateSimulation } from '../../calc'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { Direction, SimulatorYAxis, SimPoint } from '../../types'
import { parsePositiveNumber } from '../../utils/validate'

interface UseSimulatorReturn {
  direction: Direction
  avgPrice: string
  qty: string
  minPrice: string
  maxPrice: string
  stopPrice: string
  takePrice: string
  currentPrice: string
  yAxis: SimulatorYAxis
  points: SimPoint[]
  currentPoint: SimPoint | null
  setDirection: (value: Direction) => void
  setAvgPrice: (value: string) => void
  setQty: (value: string) => void
  setMinPrice: (value: string) => void
  setMaxPrice: (value: string) => void
  setStopPrice: (value: string) => void
  setTakePrice: (value: string) => void
  setCurrentPrice: (value: string) => void
  setYAxis: (value: SimulatorYAxis) => void
  reset: () => void
}

export function useSimulator(): UseSimulatorReturn {
  const { settings } = useSettingsStore()
  const [direction, setDirection] = useState<Direction>('LONG')
  const [avgPrice, setAvgPrice] = useState('')
  const [qty, setQty] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [takePrice, setTakePrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [yAxis, setYAxis] = useState<SimulatorYAxis>('amount')

  const points = useMemo(() => {
    const entry = parsePositiveNumber(avgPrice)
    const positionQty = parsePositiveNumber(qty)
    const min = parsePositiveNumber(minPrice)
    const max = parsePositiveNumber(maxPrice)

    if (entry === null || positionQty === null || min === null || max === null) {
      return []
    }

    return generateSimulation(direction, entry, positionQty, min, max, 1000, settings)
  }, [avgPrice, direction, maxPrice, minPrice, qty, settings])

  const currentPoint = useMemo(() => {
    const entry = parsePositiveNumber(avgPrice)
    const positionQty = parsePositiveNumber(qty)
    const mark = parsePositiveNumber(currentPrice)

    if (entry === null || positionQty === null || mark === null) {
      return null
    }

    const pnl = calcPnl(direction, entry, mark, positionQty, settings)
    return {
      price: mark,
      pnlAmount: pnl.pnlAmount,
      pnlPct: pnl.pnlPct,
      roiPct: pnl.roiPct,
    }
  }, [avgPrice, currentPrice, direction, qty, settings])

  return {
    direction,
    avgPrice,
    qty,
    minPrice,
    maxPrice,
    stopPrice,
    takePrice,
    currentPrice,
    yAxis,
    points,
    currentPoint,
    setDirection,
    setAvgPrice,
    setQty,
    setMinPrice,
    setMaxPrice,
    setStopPrice,
    setTakePrice,
    setCurrentPrice,
    setYAxis,
    reset: () => {
      setDirection('LONG')
      setAvgPrice('')
      setQty('')
      setMinPrice('')
      setMaxPrice('')
      setStopPrice('')
      setTakePrice('')
      setCurrentPrice('')
      setYAxis('amount')
    },
  }
}
