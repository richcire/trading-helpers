import { useMemo } from 'react'

import { useI18n } from '../../i18n'
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
  const { t } = useI18n()
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
      title: t('sim.metric.points'),
      formula: 'N = 1000 (fixed)',
      substitution: 'steps=1000',
      result: `${points.length} points`,
      tone: 'accent',
    }

    const minPnl: CalculationTooltipPayload = {
      title: t('sim.metric.minPnl'),
      formula: 'minPnl = min(points.pnlAmount)',
      substitution: minPoint ? `price=${formatNumber(minPoint.price, 4)}` : t('sim.note.noData'),
      result: minPoint ? formatCurrencyValue(minPoint.pnlAmount, settings.currency, 2) : t('common.empty'),
      tone: 'loss',
    }

    const maxPnl: CalculationTooltipPayload = {
      title: t('sim.metric.maxPnl'),
      formula: 'maxPnl = max(points.pnlAmount)',
      substitution: maxPoint ? `price=${formatNumber(maxPoint.price, 4)}` : t('sim.note.noData'),
      result: maxPoint ? formatCurrencyValue(maxPoint.pnlAmount, settings.currency, 2) : t('common.empty'),
      tone: 'profit',
    }

    const avgLine: CalculationTooltipPayload = {
      title: t('sim.metric.avgLine'),
      formula: 'x = E',
      substitution: `E=${parsedAvg ? formatNumber(parsedAvg, 4) : '-'}`,
      result: parsedAvg ? formatCurrencyValue(parsedAvg, settings.currency, 4) : t('common.empty'),
      tone: 'accent',
    }

    const currentPnl: CalculationTooltipPayload = {
      title: t('sim.metric.currentPnl'),
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `direction=${direction}, E=${parsedAvg ? formatNumber(parsedAvg, 4) : '-'}, P=${parsePositiveNumber(currentPrice) ? formatNumber(parsePositiveNumber(currentPrice) ?? 0, 4) : '-'}, Q=${parsePositiveNumber(qty) ? formatNumber(parsePositiveNumber(qty) ?? 0, 4) : '-'}`,
      result: currentPoint ? formatCurrencyValue(currentPoint.pnlAmount, settings.currency, 2) : t('common.empty'),
      note: parsedMin && parsedMax ? t('sim.note.range', { min: formatNumber(parsedMin, 2), max: formatNumber(parsedMax, 2) }) : undefined,
      tone: currentPoint && currentPoint.pnlAmount >= 0 ? 'profit' : 'loss',
    }

    return { dataPoints, minPnl, maxPnl, avgLine, currentPnl }
  }, [avgPrice, currentPoint, currentPrice, direction, maxPoint, maxPrice, minPoint, minPrice, points.length, qty, settings.currency, t])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              {t('common.resetInputs')}
            </ActionButton>
          }
          description={t('sim.card.description')}
          eyebrow={t('common.section.simulation')}
          title={t('sim.card.title')}
        >
          <div className="space-y-4">
            <SegmentedControl
              onChange={setDirection}
              options={[
                { label: t('common.long'), value: 'LONG' },
                { label: t('common.short'), value: 'SHORT' },
              ]}
              tone={direction === 'LONG' ? 'profit' : 'loss'}
              value={direction}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <InputRow inputMode="decimal" label={t('sim.input.avg')} onChange={setAvgPrice} tone="accent" type="number" unit={currencyUnit} value={avgPrice} />
              <InputRow inputMode="decimal" label={t('sim.input.qty')} onChange={setQty} tone="accent" type="number" value={qty} />
              <InputRow inputMode="decimal" label={t('sim.input.min')} onChange={setMinPrice} tone="warning" type="number" unit={currencyUnit} value={minPrice} />
              <InputRow inputMode="decimal" label={t('sim.input.max')} onChange={setMaxPrice} tone="warning" type="number" unit={currencyUnit} value={maxPrice} />
              <InputRow inputMode="decimal" label={t('sim.input.current')} onChange={setCurrentPrice} tone="warning" type="number" unit={currencyUnit} value={currentPrice} />
              <InputRow inputMode="decimal" label={t('sim.input.stop')} onChange={setStopPrice} tone="loss" type="number" unit={currencyUnit} value={stopPrice} />
              <InputRow inputMode="decimal" label={t('sim.input.take')} onChange={setTakePrice} tone="profit" type="number" unit={currencyUnit} value={takePrice} />
            </div>
            <SegmentedControl
              onChange={setYAxis}
              options={[
                { label: t('sim.axis.amount'), value: 'amount' },
                { label: t('sim.axis.pct'), value: 'pct' },
                { label: t('sim.axis.roi'), value: 'roi' },
              ]}
              value={yAxis}
            />
          </div>
        </SectionCard>

        <ResultCard title={t('sim.result.title')}>
          {points.length > 0 && tooltips ? (
            <div>
              <MetricRow label={t('sim.metric.points')} tooltip={tooltips.dataPoints} value={String(points.length)} />
              <MetricRow label={t('sim.metric.minPnl')} tooltip={tooltips.minPnl} value={minPoint ? <PnlBadge size="sm" value={minPoint.pnlAmount} /> : t('common.empty')} />
              <MetricRow label={t('sim.metric.maxPnl')} tooltip={tooltips.maxPnl} value={maxPoint ? <PnlBadge size="sm" value={maxPoint.pnlAmount} /> : t('common.empty')} />
              <MetricRow label={t('sim.metric.avgLine')} tooltip={tooltips.avgLine} value={parsePositiveNumber(avgPrice) ? formatCurrencyValue(parsePositiveNumber(avgPrice) ?? 0, settings.currency) : t('common.empty')} />
              <MetricRow label={t('sim.metric.currentPnl')} tooltip={tooltips.currentPnl} value={currentPoint ? <PnlBadge size="sm" value={currentPoint.pnlAmount} /> : t('common.empty')} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('sim.empty.result')}</p>
          )}
        </ResultCard>
      </div>

      <SectionCard eyebrow={t('common.section.chart')} title={t('sim.chart.title')}>
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
          <p className="text-sm text-[color:var(--color-text-secondary)]">{t('sim.empty.chart')}</p>
        )}
      </SectionCard>
    </div>
  )
}
