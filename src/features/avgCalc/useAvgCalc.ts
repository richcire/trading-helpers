import { useMemo, useState } from 'react'

import { calcAvgPrice, calcPnl, calcStopTakeByAmount, calcStopTakeByPct } from '../../calc'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { Direction, EntryRow, PnlResult, StopTakeConfig } from '../../types'
import { parseNonNegativeNumber, parsePositiveNumber } from '../../utils/validate'

interface AvgCalcResult {
  avgPrice: {
    E: number
    Q: number
    totalCost: number
  }
  stopPrice: number
  stopPnl: PnlResult
  takePrice: number
  takePnl: PnlResult
  currentPnl: PnlResult | null
}

interface UseAvgCalcReturn {
  direction: Direction
  entries: EntryRow[]
  stopConfig: StopTakeConfig
  takeConfig: StopTakeConfig
  currentPrice: string
  result: AvgCalcResult | null
  entryErrors: Record<string, { price?: string; qty?: string; amount?: string }>
  stopError: string | null
  takeError: string | null
  currentPriceError: string | null
  setDirection: (direction: Direction) => void
  addEntry: () => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, field: keyof EntryRow, value: string) => void
  setStopConfig: (patch: Partial<StopTakeConfig>) => void
  setTakeConfig: (patch: Partial<StopTakeConfig>) => void
  setCurrentPrice: (value: string) => void
  reset: () => void
}

function createEntry(): EntryRow {
  return {
    id: crypto.randomUUID(),
    price: '',
    qty: '',
    amount: '',
    mode: 'qty',
  }
}

const INITIAL_STOP: StopTakeConfig = { mode: 'pct', value: '3' }
const INITIAL_TAKE: StopTakeConfig = { mode: 'pct', value: '5' }

export function useAvgCalc(): UseAvgCalcReturn {
  const { settings } = useSettingsStore()
  const [direction, setDirection] = useState<Direction>('LONG')
  const [entries, setEntries] = useState<EntryRow[]>([createEntry()])
  const [stopConfig, setStopConfigState] = useState<StopTakeConfig>(INITIAL_STOP)
  const [takeConfig, setTakeConfigState] = useState<StopTakeConfig>(INITIAL_TAKE)
  const [currentPrice, setCurrentPrice] = useState('')

  const entryErrors = useMemo(() => {
    const errors: Record<string, { price?: string; qty?: string; amount?: string }> = {}

    for (const entry of entries) {
      const price = parsePositiveNumber(entry.price)
      const qty = parsePositiveNumber(entry.qty)
      const amount = parsePositiveNumber(entry.amount)

      if (entry.price.trim() !== '' && price === null) {
        errors[entry.id] = { ...errors[entry.id], price: '가격은 0보다 커야 합니다' }
      }

      if (entry.mode === 'qty' && entry.qty.trim() !== '' && qty === null) {
        errors[entry.id] = { ...errors[entry.id], qty: '수량은 0보다 커야 합니다' }
      }

      if (entry.mode === 'amount' && entry.amount.trim() !== '' && amount === null) {
        errors[entry.id] = { ...errors[entry.id], amount: '금액은 0보다 커야 합니다' }
      }
    }

    return errors
  }, [entries])

  const stopError = useMemo(() => {
    if (stopConfig.value.trim() === '') {
      return null
    }

    const value =
      stopConfig.mode === 'pct' ? parseNonNegativeNumber(stopConfig.value) : parsePositiveNumber(stopConfig.value)

    if (value === null) {
      return stopConfig.mode === 'pct' ? '손절 퍼센트는 0 이상이어야 합니다' : '손절 금액은 0보다 커야 합니다'
    }

    if (stopConfig.mode === 'pct' && value >= 100) {
      return '손절 퍼센트는 100% 미만이어야 합니다'
    }

    return null
  }, [stopConfig])

  const takeError = useMemo(() => {
    if (takeConfig.value.trim() === '') {
      return null
    }

    const value =
      takeConfig.mode === 'pct' ? parseNonNegativeNumber(takeConfig.value) : parsePositiveNumber(takeConfig.value)

    if (value === null) {
      return takeConfig.mode === 'pct' ? '익절 퍼센트는 0 이상이어야 합니다' : '익절 금액은 0보다 커야 합니다'
    }

    return null
  }, [takeConfig])

  const currentPriceError = useMemo(() => {
    if (currentPrice.trim() === '') {
      return null
    }

    return parsePositiveNumber(currentPrice) === null ? '현재가는 0보다 커야 합니다' : null
  }, [currentPrice])

  const result = useMemo<AvgCalcResult | null>(() => {
    if (stopError || takeError || currentPriceError) {
      return null
    }

    const avgPrice = calcAvgPrice(entries)
    if (!avgPrice) {
      return null
    }

    const stopValue = parseNonNegativeNumber(stopConfig.value)
    const takeValue = parseNonNegativeNumber(takeConfig.value)

    if (stopValue === null || takeValue === null) {
      return null
    }

    const stopPrice =
      stopConfig.mode === 'pct'
        ? calcStopTakeByPct(direction, avgPrice.E, -Math.abs(stopValue), settings)
        : calcStopTakeByAmount(direction, avgPrice.E, avgPrice.Q, -Math.abs(stopValue), settings)

    const takePrice =
      takeConfig.mode === 'pct'
        ? calcStopTakeByPct(direction, avgPrice.E, Math.abs(takeValue), settings)
        : calcStopTakeByAmount(direction, avgPrice.E, avgPrice.Q, Math.abs(takeValue), settings)

    if (!Number.isFinite(stopPrice) || !Number.isFinite(takePrice) || stopPrice <= 0 || takePrice <= 0) {
      return null
    }

    const stopPnl = calcPnl(direction, avgPrice.E, stopPrice, avgPrice.Q, settings)
    const takePnl = calcPnl(direction, avgPrice.E, takePrice, avgPrice.Q, settings)
    const current = parsePositiveNumber(currentPrice)

    return {
      avgPrice,
      stopPrice,
      stopPnl,
      takePrice,
      takePnl,
      currentPnl: current !== null ? calcPnl(direction, avgPrice.E, current, avgPrice.Q, settings) : null,
    }
  }, [currentPrice, currentPriceError, direction, entries, settings, stopConfig, stopError, takeConfig, takeError])

  return {
    direction,
    entries,
    stopConfig,
    takeConfig,
    currentPrice,
    result,
    entryErrors,
    stopError,
    takeError,
    currentPriceError,
    setDirection,
    addEntry: () => setEntries((current) => [...current, createEntry()]),
    removeEntry: (id) => setEntries((current) => (current.length === 1 ? current : current.filter((entry) => entry.id !== id))),
    updateEntry: (id, field, value) =>
      setEntries((current) =>
        current.map((entry) => {
          if (entry.id !== id) {
            return entry
          }

          if (field === 'mode') {
            return {
              ...entry,
              mode: value as EntryRow['mode'],
              qty: value === 'amount' ? '' : entry.qty,
              amount: value === 'qty' ? '' : entry.amount,
            }
          }

          return {
            ...entry,
            [field]: value,
          }
        }),
      ),
    setStopConfig: (patch) => setStopConfigState((current) => ({ ...current, ...patch })),
    setTakeConfig: (patch) => setTakeConfigState((current) => ({ ...current, ...patch })),
    setCurrentPrice,
    reset: () => {
      setDirection('LONG')
      setEntries([createEntry()])
      setStopConfigState(INITIAL_STOP)
      setTakeConfigState(INITIAL_TAKE)
      setCurrentPrice('')
    },
  }
}
