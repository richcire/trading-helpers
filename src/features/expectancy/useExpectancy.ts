import { useMemo, useState } from 'react'

import { calcExpectancyByAmount, calcExpectancyByRR, generateBreakEvenCurve } from '../../calc'
import type { ExpectancyMode, ExpectancyResult } from '../../types'
import { parsePositiveNumber } from '../../utils/validate'

interface UseExpectancyReturn {
  mode: ExpectancyMode
  winRatePct: string
  RR: string
  avgWin: string
  avgLoss: string
  result: ExpectancyResult | null
  curvePoints: { RR: number; breakEvenWinRate: number }[]
  setMode: (value: ExpectancyMode) => void
  setWinRatePct: (value: string) => void
  setRR: (value: string) => void
  setAvgWin: (value: string) => void
  setAvgLoss: (value: string) => void
  reset: () => void
}

export function useExpectancy(): UseExpectancyReturn {
  const [mode, setMode] = useState<ExpectancyMode>('rr')
  const [winRatePct, setWinRatePct] = useState('50')
  const [RR, setRR] = useState('2')
  const [avgWin, setAvgWin] = useState('')
  const [avgLoss, setAvgLoss] = useState('')

  const curvePoints = useMemo(() => generateBreakEvenCurve(), [])

  const result = useMemo(() => {
    const winRate = Number.parseFloat(winRatePct)
    if (!Number.isFinite(winRate)) {
      return null
    }

    if (mode === 'rr') {
      const rr = parsePositiveNumber(RR)
      return rr === null ? null : calcExpectancyByRR(winRate, rr)
    }

    const win = parsePositiveNumber(avgWin)
    const loss = parsePositiveNumber(avgLoss)
    return win === null || loss === null ? null : calcExpectancyByAmount(winRate, win, loss)
  }, [RR, avgLoss, avgWin, mode, winRatePct])

  return {
    mode,
    winRatePct,
    RR,
    avgWin,
    avgLoss,
    result,
    curvePoints,
    setMode,
    setWinRatePct,
    setRR,
    setAvgWin,
    setAvgLoss,
    reset: () => {
      setMode('rr')
      setWinRatePct('50')
      setRR('2')
      setAvgWin('')
      setAvgLoss('')
    },
  }
}
