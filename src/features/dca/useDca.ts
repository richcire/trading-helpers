import { useMemo, useState } from 'react'

import { calcBreakeven, calcPnl } from '../../calc'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { Direction, InputMode, PnlResult } from '../../types'
import { parsePositiveNumber } from '../../utils/validate'

interface DcaResult {
  newAvgPrice: number
  newQty: number
  breakevenPrice: number
  distanceToBe: number | null
  currentPnl: PnlResult | null
}

interface UseDcaReturn {
  direction: Direction
  oldAvgPrice: string
  oldQty: string
  addPrice: string
  addQty: string
  addMode: InputMode
  addAmount: string
  currentPrice: string
  result: DcaResult | null
  setDirection: (value: Direction) => void
  setOldAvgPrice: (value: string) => void
  setOldQty: (value: string) => void
  setAddPrice: (value: string) => void
  setAddQty: (value: string) => void
  setAddMode: (value: InputMode) => void
  setAddAmount: (value: string) => void
  setCurrentPrice: (value: string) => void
  reset: () => void
}

export function useDca(): UseDcaReturn {
  const { settings } = useSettingsStore()
  const [direction, setDirection] = useState<Direction>('LONG')
  const [oldAvgPrice, setOldAvgPrice] = useState('')
  const [oldQty, setOldQty] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addMode, setAddMode] = useState<InputMode>('qty')
  const [addAmount, setAddAmount] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  const result = useMemo<DcaResult | null>(() => {
    const previousAvg = parsePositiveNumber(oldAvgPrice)
    const previousQty = parsePositiveNumber(oldQty)
    const nextPrice = parsePositiveNumber(addPrice)
    const nextQty = addMode === 'qty' ? parsePositiveNumber(addQty) : null
    const nextAmount = addMode === 'amount' ? parsePositiveNumber(addAmount) : null

    if (previousAvg === null || previousQty === null || nextPrice === null) {
      return null
    }

    const convertedQty = addMode === 'qty' ? nextQty : nextAmount !== null ? nextAmount / nextPrice : null
    if (convertedQty === null || convertedQty <= 0) {
      return null
    }

    const newQty = previousQty + convertedQty
    const newAvgPrice = (previousAvg * previousQty + nextPrice * convertedQty) / newQty
    const breakevenPrice = calcBreakeven(direction, newAvgPrice, settings)
    const markPrice = parsePositiveNumber(currentPrice)

    let distanceToBe: number | null = null
    let currentPnl: PnlResult | null = null

    if (markPrice !== null) {
      currentPnl = calcPnl(direction, newAvgPrice, markPrice, newQty, settings)
      distanceToBe =
        direction === 'LONG'
          ? ((breakevenPrice - markPrice) / markPrice) * 100
          : ((markPrice - breakevenPrice) / markPrice) * 100
    }

    return {
      newAvgPrice,
      newQty,
      breakevenPrice,
      distanceToBe,
      currentPnl,
    }
  }, [addAmount, addMode, addPrice, addQty, currentPrice, direction, oldAvgPrice, oldQty, settings])

  return {
    direction,
    oldAvgPrice,
    oldQty,
    addPrice,
    addQty,
    addMode,
    addAmount,
    currentPrice,
    result,
    setDirection,
    setOldAvgPrice,
    setOldQty,
    setAddPrice,
    setAddQty,
    setAddMode,
    setAddAmount,
    setCurrentPrice,
    reset: () => {
      setDirection('LONG')
      setOldAvgPrice('')
      setOldQty('')
      setAddPrice('')
      setAddQty('')
      setAddMode('qty')
      setAddAmount('')
      setCurrentPrice('')
    },
  }
}
