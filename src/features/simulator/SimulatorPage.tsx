import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import type { CalculationTooltipPayload } from '../../types'
import { formatCurrencyUnit, formatCurrencyValue, formatNumber } from '../../utils/format'
import { parsePositiveNumber } from '../../utils/validate'
import { ActionButton } from '../../components/ui/ActionButton'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { PnlBadge } from '../../components/ui/PnlBadge'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { SimChart } from './SimChart'
import { useSimulator } from './useSimulator'

export function SimulatorPage() {
  const { settings } = useSettingsStore()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    avgPrice,
    currentPoint,
    currentPrice,
    direction,
    maxPrice,
    minPrice,
    points,
    qty,
    reset,
    setAvgPrice,
    setCurrentPrice,
    setDirection,
    setMaxPrice,
    setMinPrice,
    setQty,
    setStopPrice,
    setTakePrice,
    setYAxis,
    stopPrice,
    takePrice,
    yAxis,
  } = useSimulator()

  const minPoint = points.reduce((lowest, point) => (lowest === null || point.pnlAmount < lowest.pnlAmount ? point : lowest), null as typeof points[number] | null)
  const maxPoint = points.reduce((highest, point) => (highest === null || point.pnlAmount > highest.pnlAmount ? point : highest), null as typeof points[number] | null)

  const tooltips = useMemo(() => {
    if (points.length === 0) {
      return null
    }

    const parsedAvg = parsePositiveNumber(avgPrice)
    const parsedMin = parsePositiveNumber(minPrice)
    const parsedMax = parsePositiveNumber(maxPrice)

    const dataPoints: CalculationTooltipPayload = {
      title: '데이터 포인트',
      formula: 'N = 1000 (fixed)',
      substitution: 'steps=1000',
      result: `${points.length} points`,
      tone: 'accent',
    }

    const minPnl: CalculationTooltipPayload = {
      title: '구간 최소 손익',
      formula: 'minPnl = min(points.pnlAmount)',
      substitution: minPoint ? `price=${formatNumber(minPoint.price, 4)}` : '데이터 없음',
      result: minPoint ? formatCurrencyValue(minPoint.pnlAmount, settings.currency, 2) : '-',
      tone: 'loss',
    }

    const maxPnl: CalculationTooltipPayload = {
      title: '구간 최대 손익',
      formula: 'maxPnl = max(points.pnlAmount)',
      substitution: maxPoint ? `price=${formatNumber(maxPoint.price, 4)}` : '데이터 없음',
      result: maxPoint ? formatCurrencyValue(maxPoint.pnlAmount, settings.currency, 2) : '-',
      tone: 'profit',
    }

    const avgLine: CalculationTooltipPayload = {
      title: '평균단가 기준선',
      formula: 'x = E',
      substitution: `E=${parsedAvg ? formatNumber(parsedAvg, 4) : '-'}`,
      result: parsedAvg ? formatCurrencyValue(parsedAvg, settings.currency, 4) : '-',
      tone: 'accent',
    }

    const currentPnl: CalculationTooltipPayload = {
      title: '현재가 기준 손익',
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `direction=${direction}, E=${parsedAvg ? formatNumber(parsedAvg, 4) : '-'}, P=${parsePositiveNumber(currentPrice) ? formatNumber(parsePositiveNumber(currentPrice) ?? 0, 4) : '-'}, Q=${parsePositiveNumber(qty) ? formatNumber(parsePositiveNumber(qty) ?? 0, 4) : '-'}`,
      result: currentPoint ? formatCurrencyValue(currentPoint.pnlAmount, settings.currency, 2) : '-',
      note: parsedMin && parsedMax ? `시뮬레이션 구간: ${formatNumber(parsedMin, 2)} ~ ${formatNumber(parsedMax, 2)}` : undefined,
      tone: currentPoint && currentPoint.pnlAmount >= 0 ? 'profit' : 'loss',
    }

    return { dataPoints, minPnl, maxPnl, avgLine, currentPnl }
  }, [avgPrice, currentPoint, currentPrice, direction, maxPoint, maxPrice, minPoint, minPrice, points.length, qty, settings.currency])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              현재 입력 초기화
            </ActionButton>
          }
          description="가격 구간별 손익 곡선을 시각화하고 손절, 익절, 현재가를 같은 축에서 비교합니다."
          eyebrow="Simulation"
          title="포지션 시뮬레이터"
        >
          <div className="space-y-4">
            <SegmentedControl
              onChange={setDirection}
              options={[
                { label: 'LONG', value: 'LONG' },
                { label: 'SHORT', value: 'SHORT' },
              ]}
              tone={direction === 'LONG' ? 'profit' : 'loss'}
              value={direction}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <InputRow inputMode="decimal" label="평균단가" onChange={setAvgPrice} tone="accent" type="number" unit={currencyUnit} value={avgPrice} />
              <InputRow inputMode="decimal" label="수량" onChange={setQty} tone="accent" type="number" value={qty} />
              <InputRow inputMode="decimal" label="최소 가격" onChange={setMinPrice} tone="warning" type="number" unit={currencyUnit} value={minPrice} />
              <InputRow inputMode="decimal" label="최대 가격" onChange={setMaxPrice} tone="warning" type="number" unit={currencyUnit} value={maxPrice} />
              <InputRow inputMode="decimal" label="현재가" onChange={setCurrentPrice} tone="warning" type="number" unit={currencyUnit} value={currentPrice} />
              <InputRow inputMode="decimal" label="손절가" onChange={setStopPrice} tone="loss" type="number" unit={currencyUnit} value={stopPrice} />
              <InputRow inputMode="decimal" label="익절가" onChange={setTakePrice} tone="profit" type="number" unit={currencyUnit} value={takePrice} />
            </div>
            <SegmentedControl
              onChange={setYAxis}
              options={[
                { label: '손익 금액', value: 'amount' },
                { label: '손익률', value: 'pct' },
                { label: 'ROI', value: 'roi' },
              ]}
              value={yAxis}
            />
          </div>
        </SectionCard>

        <ResultCard title="시뮬레이션 요약">
          {points.length > 0 && tooltips ? (
            <div>
              <MetricRow label="데이터 포인트" tooltip={tooltips.dataPoints} value={String(points.length)} />
              <MetricRow label="구간 최소 손익" tooltip={tooltips.minPnl} value={minPoint ? <PnlBadge size="sm" value={minPoint.pnlAmount} /> : '-'} />
              <MetricRow label="구간 최대 손익" tooltip={tooltips.maxPnl} value={maxPoint ? <PnlBadge size="sm" value={maxPoint.pnlAmount} /> : '-'} />
              <MetricRow label="평균단가 기준선" tooltip={tooltips.avgLine} value={parsePositiveNumber(avgPrice) ? formatCurrencyValue(parsePositiveNumber(avgPrice) ?? 0, settings.currency) : '-'} />
              <MetricRow label="현재가 기준 손익" tooltip={tooltips.currentPnl} value={currentPoint ? <PnlBadge size="sm" value={currentPoint.pnlAmount} /> : '-'} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">평균단가, 수량, 시뮬레이션 가격 범위를 입력하면 손익 곡선을 생성합니다.</p>
          )}
        </ResultCard>
      </div>

      <SectionCard eyebrow="Chart" title="손익 곡선">
        {points.length > 0 ? (
          <SimChart
            avgPrice={parsePositiveNumber(avgPrice)}
            currencyUnit={currencyUnit}
            currentPrice={parsePositiveNumber(currentPrice)}
            direction={direction}
            entryPrice={parsePositiveNumber(avgPrice)}
            points={points}
            qty={parsePositiveNumber(qty)}
            stopPrice={parsePositiveNumber(stopPrice)}
            takePrice={parsePositiveNumber(takePrice)}
            yAxis={yAxis}
          />
        ) : (
          <p className="text-sm text-[color:var(--color-text-secondary)]">입력이 유효해지면 차트가 표시됩니다.</p>
        )}
      </SectionCard>
    </div>
  )
}
