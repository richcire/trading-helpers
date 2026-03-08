import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import { useI18n } from '../../i18n'
import type { CalculationTooltipPayload } from '../../types'
import { formatCurrencyUnit, formatCurrencyValue, formatNumber } from '../../utils/format'
import { ActionButton } from '../../components/ui/ActionButton'
import { CopyButton } from '../../components/ui/CopyButton'
import { ValueWithTooltip } from '../../components/ui/CalculationTooltip'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { PnlBadge } from '../../components/ui/PnlBadge'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EntryRow } from './EntryRow'
import { useAvgCalc } from './useAvgCalc'

export function AvgCalcPage() {
  const { settings } = useSettingsStore()
  const { t } = useI18n()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    addEntry,
    currentPrice,
    currentPriceError,
    direction,
    entries,
    entryErrors,
    removeEntry,
    reset,
    result,
    setCurrentPrice,
    setDirection,
    setStopConfig,
    setTakeConfig,
    stopConfig,
    stopError,
    takeConfig,
    takeError,
    updateEntry,
  } = useAvgCalc()

  const summaryText = result
    ? [
      `${t('avg.metric.averagePrice')} ${formatCurrencyValue(result.avgPrice.E, settings.currency)}`,
      `${t('avg.metric.totalQty')} ${formatNumber(result.avgPrice.Q, 4)}`,
      `${t('avg.metric.stopPrice')} ${formatCurrencyValue(result.stopPrice, settings.currency)}`,
      `${t('avg.metric.takePrice')} ${formatCurrencyValue(result.takePrice, settings.currency)}`,
    ].join(' / ')
    : t('avg.noSummary')

  const tooltips = useMemo(() => {
    if (!result) {
      return null
    }

    const s = direction === 'LONG' ? 1 : -1
    const stopInput = Math.abs(Number.parseFloat(stopConfig.value) || 0)
    const takeInput = Math.abs(Number.parseFloat(takeConfig.value) || 0)
    const currentMark = Number.parseFloat(currentPrice)

    const stopFormula = stopConfig.mode === 'pct'
      ? settings.adjustStopTakePriceForFees
        ? direction === 'LONG'
          ? 'P = E × (1 + r) × (1 + f_in) / (1 - f_out)'
          : 'P = E × (1 - r) × (1 - f_in) / (1 + f_out)'
        : 'P = E × (1 + s × r)'
      : settings.adjustStopTakePriceForFees
        ? direction === 'LONG'
          ? 'P = (targetPnl + E×Q×(1+f_in)) / (Q×(1-f_out))'
          : 'P = (E×Q×(1-f_in) - targetPnl) / (Q×(1+f_out))'
        : 'P = E + targetPnl / (s×Q)'

    const stopSubstitution = stopConfig.mode === 'pct'
      ? `E=${formatNumber(result.avgPrice.E, 4)}, r=-${formatNumber(stopInput / 100, 4)}, s=${s}`
      : `E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}, targetPnl=-${formatNumber(stopInput, 2)}, s=${s}`

    const takeFormula = takeConfig.mode === 'pct'
      ? settings.adjustStopTakePriceForFees
        ? direction === 'LONG'
          ? 'P = E × (1 + r) × (1 + f_in) / (1 - f_out)'
          : 'P = E × (1 - r) × (1 - f_in) / (1 + f_out)'
        : 'P = E × (1 + s × r)'
      : settings.adjustStopTakePriceForFees
        ? direction === 'LONG'
          ? 'P = (targetPnl + E×Q×(1+f_in)) / (Q×(1-f_out))'
          : 'P = (E×Q×(1-f_in) - targetPnl) / (Q×(1+f_out))'
        : 'P = E + targetPnl / (s×Q)'

    const takeSubstitution = takeConfig.mode === 'pct'
      ? `E=${formatNumber(result.avgPrice.E, 4)}, r=+${formatNumber(takeInput / 100, 4)}, s=${s}`
      : `E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}, targetPnl=+${formatNumber(takeInput, 2)}, s=${s}`

    const avgFormula: CalculationTooltipPayload = {
      title: t('avg.metric.averagePrice'),
      formula: 'E = Σ(price_i × qty_i) / Σ(qty_i)',
      substitution: `E = ${formatNumber(result.avgPrice.totalCost, 4)} / ${formatNumber(result.avgPrice.Q, 4)}`,
      result: `E = ${formatCurrencyValue(result.avgPrice.E, settings.currency, 4)}`,
      note: t('avg.note.amountMode'),
      tone: 'accent',
    }

    const totalQty: CalculationTooltipPayload = {
      title: t('avg.metric.totalQty'),
      formula: 'Q = Σ(qty_i)',
      substitution: `Q = ${formatNumber(result.avgPrice.Q, 6)}`,
      result: `Q = ${formatNumber(result.avgPrice.Q, 4)}`,
      tone: 'accent',
    }

    const totalCost: CalculationTooltipPayload = {
      title: t('avg.metric.totalCost'),
      formula: 'totalCost = Σ(price_i × qty_i)',
      substitution: `totalCost = E × Q = ${formatNumber(result.avgPrice.E, 4)} × ${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.avgPrice.totalCost, settings.currency, 2),
      tone: 'accent',
    }

    const stopPrice: CalculationTooltipPayload = {
      title: t('avg.metric.stopPrice'),
      formula: stopFormula,
      substitution: stopSubstitution,
      result: `P = ${formatCurrencyValue(result.stopPrice, settings.currency, 4)}`,
      note: settings.adjustStopTakePriceForFees ? t('avg.note.adjustOn') : t('avg.note.adjustOff'),
      tone: 'loss',
    }

    const takePrice: CalculationTooltipPayload = {
      title: t('avg.metric.takePrice'),
      formula: takeFormula,
      substitution: takeSubstitution,
      result: `P = ${formatCurrencyValue(result.takePrice, settings.currency, 4)}`,
      note: settings.adjustStopTakePriceForFees ? t('avg.note.adjustOn') : t('avg.note.adjustOff'),
      tone: 'profit',
    }

    const stopPnlAmount: CalculationTooltipPayload = {
      title: t('avg.metric.stopPnl'),
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `s=${s}, P=${formatNumber(result.stopPrice, 4)}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.stopPnl.pnlAmount, settings.currency, 2),
      note: settings.includeFeesInPnL ? t('avg.note.feesOn') : t('avg.note.feesOff'),
      tone: 'loss',
    }

    const stopPnlPct: CalculationTooltipPayload = {
      title: t('avg.metric.stopPct'),
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.stopPnl.pnlPct, 4)}%`,
      result: `${formatNumber(result.stopPnl.pnlPct, 2)}%`,
      tone: 'loss',
    }

    const takePnlAmount: CalculationTooltipPayload = {
      title: t('avg.metric.takePnl'),
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `s=${s}, P=${formatNumber(result.takePrice, 4)}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.takePnl.pnlAmount, settings.currency, 2),
      note: settings.includeFeesInPnL ? t('avg.note.feesOn') : t('avg.note.feesOff'),
      tone: 'profit',
    }

    const takePnlPct: CalculationTooltipPayload = {
      title: t('avg.metric.takePct'),
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.takePnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.takePnl.pnlPct, 4)}%`,
      result: `${formatNumber(result.takePnl.pnlPct, 2)}%`,
      tone: 'profit',
    }

    const currentAmount: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: t('avg.metric.currentPnl'),
        formula: 'pnlAmount = s × (P - E) × Q',
        substitution: `s=${s}, P=${Number.isFinite(currentMark) ? formatNumber(currentMark, 4) : '-'}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
        result: formatCurrencyValue(result.currentPnl.pnlAmount, settings.currency, 2),
        note: settings.includeFeesInPnL ? t('avg.note.feesOn') : t('avg.note.feesOff'),
        tone: result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentPct: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: t('avg.metric.currentPct'),
        formula: 'pnlPct = (pnlAmount / baseCost) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.currentPnl.pnlPct, 4)}%`,
        result: `${formatNumber(result.currentPnl.pnlPct, 2)}%`,
        tone: result.currentPnl.pnlPct >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentRoi: CalculationTooltipPayload | null = result.currentPnl && typeof result.currentPnl.roiPct === 'number'
      ? {
        title: t('avg.metric.currentRoi'),
        formula: 'roiPct = (pnlAmount / margin) × 100, margin = (E×Q)/leverage',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}, leverage=${formatNumber(settings.leverage, 0)}`,
        result: `${formatNumber(result.currentPnl.roiPct, 2)}%`,
        tone: result.currentPnl.roiPct >= 0 ? 'profit' : 'loss',
      }
      : null

    return {
      avgFormula,
      totalQty,
      totalCost,
      stopPrice,
      stopPnlAmount,
      stopPnlPct,
      takePrice,
      takePnlAmount,
      takePnlPct,
      currentAmount,
      currentPct,
      currentRoi,
    }
  }, [currentPrice, direction, result, settings.adjustStopTakePriceForFees, settings.currency, settings.includeFeesInPnL, settings.leverage, stopConfig.mode, stopConfig.value, t, takeConfig.mode, takeConfig.value])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              {t('common.resetInputs')}
            </ActionButton>
          }
          description={t('avg.card.description')}
          eyebrow={t('avg.card.eyebrow')}
          title={t('avg.card.title')}
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

            <div className="space-y-3">
              {entries.map((row) => (
                <EntryRow
                  currencyUnit={currencyUnit}
                  errors={entryErrors[row.id]}
                  key={row.id}
                  onChange={updateEntry}
                  onRemove={removeEntry}
                  row={row}
                  showRemove={entries.length > 1}
                />
              ))}
            </div>

            <ActionButton onClick={addEntry} tone="accent" variant="outline">
              {t('common.addRow')}
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t('common.section.targets')} title={t('avg.targets.title')}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 p-4">
              <SegmentedControl
                onChange={(value) => setStopConfig({ mode: value })}
                options={[
                  { label: t('avg.stop.modePct'), value: 'pct' },
                  { label: t('avg.stop.modeAmount'), value: 'amount' },
                ]}
                tone="loss"
                value={stopConfig.mode}
              />
              <InputRow
                error={stopError ?? undefined}
                inputMode="decimal"
                label={t('avg.input.stopValue')}
                onChange={(value) => setStopConfig({ value })}
                placeholder="0"
                tone="loss"
                type="number"
                unit={stopConfig.mode === 'pct' ? '%' : currencyUnit}
                value={stopConfig.value}
              />
            </div>

            <div className="space-y-4 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 p-4">
              <SegmentedControl
                onChange={(value) => setTakeConfig({ mode: value })}
                options={[
                  { label: t('avg.take.modePct'), value: 'pct' },
                  { label: t('avg.take.modeAmount'), value: 'amount' },
                ]}
                tone="profit"
                value={takeConfig.mode}
              />
              <InputRow
                error={takeError ?? undefined}
                inputMode="decimal"
                label={t('avg.input.takeValue')}
                onChange={(value) => setTakeConfig({ value })}
                placeholder="0"
                tone="profit"
                type="number"
                unit={takeConfig.mode === 'pct' ? '%' : currencyUnit}
                value={takeConfig.value}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t('common.section.markPrice')} title={t('avg.mark.title')}>
          <InputRow
            error={currentPriceError ?? undefined}
            inputMode="decimal"
            label={t('avg.input.currentPrice')}
            onChange={setCurrentPrice}
            placeholder={t('avg.input.optional')}
            tone="warning"
            type="number"
            unit={currencyUnit}
            value={currentPrice}
          />
        </SectionCard>
      </div>

      <div className="space-y-5">
        <ResultCard
          actions={<CopyButton text={summaryText} />}
          title={t('avg.summary.title')}
        >
          {result && tooltips ? (
            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('avg.metric.averagePrice')}</p>
                  <ValueWithTooltip className="mt-2" tone="accent" tooltip={tooltips.avgFormula}>
                    <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.avgPrice.E)}</p>
                  </ValueWithTooltip>
                </div>
                {tooltips.currentPct ? (
                  <ValueWithTooltip tone={result.currentPnl && result.currentPnl.pnlPct >= 0 ? 'profit' : 'loss'} tooltip={tooltips.currentPct}>
                    <PnlBadge format="pct" value={result.currentPnl?.pnlPct ?? 0} />
                  </ValueWithTooltip>
                ) : (
                  <PnlBadge format="pct" value={result.currentPnl?.pnlPct ?? 0} />
                )}
              </div>
              <MetricRow label={t('avg.metric.totalQty')} tooltip={tooltips.totalQty} value={formatNumber(result.avgPrice.Q, 4)} />
              <MetricRow label={t('avg.metric.totalCost')} tooltip={tooltips.totalCost} value={formatCurrencyValue(result.avgPrice.totalCost, settings.currency)} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('avg.empty.summary')}</p>
          )}
        </ResultCard>

        <ResultCard title={t('avg.stopTake.title')}>
          {result && tooltips ? (
            <div>
              <MetricRow label={t('avg.metric.stopPrice')} tone="loss" tooltip={tooltips.stopPrice} value={formatCurrencyValue(result.stopPrice, settings.currency)} />
              <MetricRow label={t('avg.metric.stopPnl')} tooltip={tooltips.stopPnlAmount} value={<PnlBadge size="sm" value={result.stopPnl.pnlAmount} />} />
              <MetricRow label={t('avg.metric.stopPct')} tooltip={tooltips.stopPnlPct} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.pnlPct} />} />
              <MetricRow label={t('avg.metric.takePrice')} tone="profit" tooltip={tooltips.takePrice} value={formatCurrencyValue(result.takePrice, settings.currency)} />
              <MetricRow label={t('avg.metric.takePnl')} tooltip={tooltips.takePnlAmount} value={<PnlBadge size="sm" value={result.takePnl.pnlAmount} />} />
              <MetricRow label={t('avg.metric.takePct')} tooltip={tooltips.takePnlPct} value={<PnlBadge format="pct" size="sm" value={result.takePnl.pnlPct} />} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('avg.empty.stopTake')}</p>
          )}
        </ResultCard>

        <ResultCard title={t('avg.current.title')}>
          {result?.currentPnl && tooltips?.currentAmount && tooltips.currentPct ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('avg.metric.currentPnl')}</p>
                  <ValueWithTooltip className="mt-2" tone={result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss'} tooltip={tooltips.currentAmount}>
                    <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.currentPnl.pnlAmount)}</p>
                  </ValueWithTooltip>
                </div>
                <PnlBadge value={result.currentPnl.pnlAmount} />
              </div>
              <div className="mt-5">
                <MetricRow label={t('avg.metric.currentPct')} tooltip={tooltips.currentPct} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.pnlPct} />} />
                {typeof result.currentPnl.roiPct === 'number' && tooltips.currentRoi && (
                  <MetricRow label={t('avg.metric.currentRoi')} tooltip={tooltips.currentRoi} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.roiPct} />} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('avg.empty.current')}</p>
          )}
        </ResultCard>
      </div>
    </div>
  )
}
