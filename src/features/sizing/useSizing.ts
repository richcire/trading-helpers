import { useMemo, useState } from 'react'

import { calcPnl, calcSizing } from '../../calc'
import { useI18n } from '../../i18n'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { Direction, PnlResult, RiskMode } from '../../types'
import { parsePositiveNumber, validateSizingDirection } from '../../utils/validate'

interface SizingResult {
  riskAmount: number
  riskQty: number
  leverageCapQty: number
  qty: number
  notional: number
  margin: number
  stopPnl: PnlResult
}

interface UseSizingReturn {
  direction: Direction
  accountEquity: string
  riskMode: RiskMode
  riskValue: string
  entryPrice: string
  stopPrice: string
  result: SizingResult | null
  error: string | null
  setDirection: (value: Direction) => void
  setAccountEquity: (value: string) => void
  setRiskMode: (value: RiskMode) => void
  setRiskValue: (value: string) => void
  setEntryPrice: (value: string) => void
  setStopPrice: (value: string) => void
  reset: () => void
}

export function useSizing(): UseSizingReturn {
  const { settings } = useSettingsStore()
  const { t } = useI18n()
  const [direction, setDirection] = useState<Direction>('LONG')
  const [accountEquity, setAccountEquity] = useState('')
  const [riskMode, setRiskMode] = useState<RiskMode>('pct')
  const [riskValue, setRiskValue] = useState('1')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')

  const error = useMemo<string | null>(() => {
    const entry = parsePositiveNumber(entryPrice)
    const stop = parsePositiveNumber(stopPrice)

    if (entry === null || stop === null) {
      return null
    }

    const code = validateSizingDirection(direction, entry, stop)
    return code ? t(code) : null
  }, [direction, entryPrice, stopPrice, t])

  const result = useMemo<SizingResult | null>(() => {
    const equity = parsePositiveNumber(accountEquity)
    const risk = parsePositiveNumber(riskValue)
    const entry = parsePositiveNumber(entryPrice)
    const stop = parsePositiveNumber(stopPrice)

    if (equity === null || risk === null || entry === null || stop === null || error) {
      return null
    }

    const riskAmount = riskMode === 'pct' ? (equity * risk) / 100 : risk
    const riskQty = calcSizing(direction, entry, stop, riskAmount, settings)

    if (riskQty === null) {
      return null
    }

    const leverageCapQty = (equity * settings.leverage) / entry

    if (!Number.isFinite(leverageCapQty) || leverageCapQty <= 0) {
      return null
    }

    const qty = Math.min(riskQty, leverageCapQty)

    const notional = entry * qty
    const margin = notional / settings.leverage
    const stopPnl = calcPnl(direction, entry, stop, qty, settings)

    return {
      riskAmount,
      riskQty,
      leverageCapQty,
      qty,
      notional,
      margin,
      stopPnl,
    }
  }, [accountEquity, direction, entryPrice, error, riskMode, riskValue, settings, stopPrice])

  return {
    direction,
    accountEquity,
    riskMode,
    riskValue,
    entryPrice,
    stopPrice,
    result,
    error,
    setDirection,
    setAccountEquity,
    setRiskMode,
    setRiskValue,
    setEntryPrice,
    setStopPrice,
    reset: () => {
      setDirection('LONG')
      setAccountEquity('')
      setRiskMode('pct')
      setRiskValue('1')
      setEntryPrice('')
      setStopPrice('')
    },
  }
}
