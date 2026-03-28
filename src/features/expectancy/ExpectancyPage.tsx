import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import { useI18n } from '../../i18n'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { CalculationTooltipPayload } from '../../types'
import { formatCurrencyUnit, formatNumber, formatPct } from '../../utils/format'
import { ActionButton } from '../../components/ui/ActionButton'
import { ValueWithTooltip } from '../../components/ui/CalculationTooltip'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useExpectancy } from './useExpectancy'

interface CurveTooltipPayloadItem {
  payload: { RR: number; breakEvenWinRate: number }
}

interface CurveTooltipProps {
  active?: boolean
  payload?: readonly CurveTooltipPayloadItem[]
}

export function ExpectancyPage() {
  const { settings } = useSettingsStore()
  const { t } = useI18n()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    RR,
    avgLoss,
    avgWin,
    curvePoints,
    mode,
    reset,
    result,
    setAvgLoss,
    setAvgWin,
    setMode,
    setRR,
    setWinRatePct,
    winRatePct,
  } = useExpectancy()

  const tooltips = useMemo(() => {
    if (!result) {
      return null
    }

    const winRate = Number.parseFloat(winRatePct)
    const rr = Number.parseFloat(RR)
    const win = Number.parseFloat(avgWin)
    const loss = Number.parseFloat(avgLoss)

    const expectancy: CalculationTooltipPayload = {
      title: t('exp.metric.expectancy'),
      formula: mode === 'rr' ? 'E = p×RR - (1-p)' : 'E = p×avgWin - (1-p)×avgLoss',
      substitution: mode === 'rr'
        ? `p=${formatNumber(winRate / 100, 4)}, RR=${formatNumber(rr, 4)}`
        : `p=${formatNumber(winRate / 100, 4)}, avgWin=${formatNumber(win, 2)}, avgLoss=${formatNumber(loss, 2)}`,
      result: `${formatNumber(result.expectancy, 4)}`,
      tone: result.expectancy >= 0 ? 'profit' : 'loss',
    }

    const breakEven: CalculationTooltipPayload = {
      title: t('exp.metric.breakEven'),
      formula: mode === 'rr' ? 'BE = 1 / (1 + RR)' : 'BE = avgLoss / (avgWin + avgLoss)',
      substitution: mode === 'rr' ? `RR=${formatNumber(rr, 4)}` : `avgLoss=${formatNumber(loss, 2)}, avgWin=${formatNumber(win, 2)}`,
      result: `${formatPct(result.breakEvenWinRate * 100, 2)}`,
      tone: 'warning',
    }

    const judgementResult = result.expectancy > 0
      ? t('exp.judgement.positive')
      : result.expectancy < 0
        ? t('exp.judgement.negative')
        : t('exp.judgement.neutral')

    const judgement: CalculationTooltipPayload = {
      title: t('exp.metric.judgement'),
      formula: t('exp.judgement.formula'),
      substitution: `expectancy=${formatNumber(result.expectancy, 4)}`,
      result: judgementResult,
      tone: result.expectancy > 0 ? 'profit' : result.expectancy < 0 ? 'loss' : 'warning',
    }

    return { expectancy, breakEven, judgement }
  }, [RR, avgLoss, avgWin, mode, result, t, winRatePct])

  const renderCurveTooltip = ({ active, payload }: CurveTooltipProps) => {
    if (!active || !payload || payload.length === 0) {
      return null
    }

    const point = payload[0].payload

    return (
      <div className="w-[min(90vw,22rem)] rounded-[var(--radius-control)] border border-[color:var(--color-border-strong)] panel-elevated p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-accent)]">{t('exp.curve.tooltipTitle')}</p>
        <div className="mt-2 space-y-1 text-xs text-[color:var(--color-text-secondary)]">
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.formula')}</span>
            <span className="text-data">breakEvenWinRate = 1 / (1 + RR)</span>
          </p>
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.substitution')}</span>
            <span className="text-data">1 / (1 + {formatNumber(point.RR, 2)})</span>
          </p>
          <p>
            <span className="mr-1 text-[color:var(--color-text-muted)]">{t('common.result')}</span>
            <span className="text-data font-semibold text-[color:var(--color-text-primary)]">{formatPct(point.breakEvenWinRate * 100, 2)}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid gap-3 sm:gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              {t('common.resetInputs')}
            </ActionButton>
          }
          description={t('exp.card.description')}
          eyebrow={t('common.section.expectancy')}
          stagger={60}
          title={t('exp.card.title')}
        >
          <div className="space-y-4">
            <SegmentedControl
              onChange={setMode}
              options={[
                { label: t('exp.mode.rr'), value: 'rr' },
                { label: t('exp.mode.amount'), value: 'amount' },
              ]}
              value={mode}
            />
            <InputRow inputMode="decimal" label={t('exp.input.winRate')} onChange={setWinRatePct} tone="accent" type="number" unit="%" value={winRatePct} />
            {mode === 'rr' ? (
              <InputRow inputMode="decimal" label={t('exp.input.rr')} onChange={setRR} tone="accent" type="number" value={RR} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <InputRow inputMode="decimal" label={t('exp.input.avgWin')} onChange={setAvgWin} tone="profit" type="number" unit={currencyUnit} value={avgWin} />
                <InputRow inputMode="decimal" label={t('exp.input.avgLoss')} onChange={setAvgLoss} tone="loss" type="number" unit={currencyUnit} value={avgLoss} />
              </div>
            )}
          </div>
        </SectionCard>

        <ResultCard stagger={100} title={t('exp.result.title')}>
          {result && tooltips ? (
            <div>
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('exp.metric.expectancy')}</p>
                <ValueWithTooltip className="mt-2" tone={result.expectancy >= 0 ? 'profit' : 'loss'} tooltip={tooltips.expectancy}>
                  <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.expectancy, 2)}</p>
                </ValueWithTooltip>
              </div>
              <MetricRow label={t('exp.metric.expectancy')} tooltip={tooltips.expectancy} value={formatNumber(result.expectancy, 2)} />
              <MetricRow label={t('exp.metric.breakEven')} tooltip={tooltips.breakEven} value={formatPct(result.breakEvenWinRate * 100, 2)} />
              <MetricRow
                label={t('exp.metric.judgement')}
                tooltip={tooltips.judgement}
                value={result.expectancy > 0 ? t('exp.judgement.positive') : result.expectancy < 0 ? t('exp.judgement.negative') : t('exp.judgement.neutral')}
              />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('exp.empty.result')}</p>
          )}
        </ResultCard>
      </div>

      <SectionCard eyebrow={t('common.section.curve')} stagger={160} title={t('exp.curve.title')}>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curvePoints} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="RR" stroke="var(--color-text-muted)" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <YAxis
                stroke="var(--color-text-muted)"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                tickFormatter={(value: number) => formatPct(value * 100, 0)}
              />
              <Tooltip content={renderCurveTooltip} />
              <Line dataKey="breakEvenWinRate" dot={false} isAnimationActive={false} stroke="var(--color-accent)" strokeWidth={2.5} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}
