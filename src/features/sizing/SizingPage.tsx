import { useMemo } from 'react'

import { useI18n } from '../../i18n'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { CalculationTooltipPayload, RiskMode } from '../../types'
import { formatCurrencyUnit, formatCurrencyValue, formatNumber } from '../../utils/format'
import { ActionButton } from '../../components/ui/ActionButton'
import { ValueWithTooltip } from '../../components/ui/CalculationTooltip'
import { FieldError } from '../../components/ui/FieldError'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { PnlBadge } from '../../components/ui/PnlBadge'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useSizing } from './useSizing'

export function SizingPage() {
  const { settings } = useSettingsStore()
  const { t } = useI18n()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    accountEquity,
    direction,
    entryPrice,
    error,
    reset,
    result,
    riskMode,
    riskValue,
    setAccountEquity,
    setDirection,
    setEntryPrice,
    setRiskMode,
    setRiskValue,
    setStopPrice,
    stopPrice,
  } = useSizing()

  const tooltips = useMemo(() => {
    if (!result) {
      return null
    }

    const equity = Number.parseFloat(accountEquity)
    const risk = Number.parseFloat(riskValue)
    const entry = Number.parseFloat(entryPrice)
    const stop = Number.parseFloat(stopPrice)

    const riskAmount: CalculationTooltipPayload = {
      title: t('sizing.metric.riskAmount'),
      formula: riskMode === 'pct' ? 'riskAmount = equity × riskPct / 100' : 'riskAmount = riskValue',
      substitution: riskMode === 'pct' ? `${formatNumber(equity, 2)} × ${formatNumber(risk, 2)} / 100` : `${formatNumber(risk, 2)}`,
      result: formatCurrencyValue(result.riskAmount, settings.currency, 2),
      tone: 'warning',
    }

    const qty: CalculationTooltipPayload = {
      title: t('sizing.metric.qty'),
      formula: 'Q = min(riskQty, leverageCapQty)',
      substitution: `riskQty=${formatNumber(result.riskQty, 6)}, leverageCapQty=${formatNumber(result.leverageCapQty, 6)}`,
      result: `${formatNumber(result.qty, 6)}`,
      note: `leverageCapQty = equity × leverage / entry = ${formatNumber(equity, 2)} × ${formatNumber(settings.leverage, 2)} / ${formatNumber(entry, 4)}`,
      tone: 'accent',
    }

    const notional: CalculationTooltipPayload = {
      title: t('sizing.metric.notional'),
      formula: 'notional = entryPrice × qty',
      substitution: `${formatNumber(entry, 4)} × ${formatNumber(result.qty, 6)}`,
      result: formatCurrencyValue(result.notional, settings.currency, 2),
      tone: 'accent',
    }

    const margin: CalculationTooltipPayload = {
      title: t('sizing.metric.margin'),
      formula: 'margin = notional / leverage',
      substitution: `${formatNumber(result.notional, 2)} / leverage`,
      result: formatCurrencyValue(result.margin, settings.currency, 2),
      tone: 'accent',
    }

    const stopPnlAmount: CalculationTooltipPayload = {
      title: t('sizing.metric.stopPnl'),
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `direction=${direction}, E=${formatNumber(entry, 4)}, P=${formatNumber(stop, 4)}, Q=${formatNumber(result.qty, 6)}`,
      result: formatCurrencyValue(result.stopPnl.pnlAmount, settings.currency, 2),
      tone: 'loss',
    }

    const stopPnlPct: CalculationTooltipPayload = {
      title: t('sizing.metric.stopPct'),
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}`,
      result: `${formatNumber(result.stopPnl.pnlPct, 2)}%`,
      tone: 'loss',
    }

    const stopRoi: CalculationTooltipPayload | null = typeof result.stopPnl.roiPct === 'number'
      ? {
        title: t('sizing.metric.stopRoi'),
        formula: 'roiPct = (pnlAmount / margin) × 100',
        substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}, margin=${formatNumber(result.margin, 2)}`,
        result: `${formatNumber(result.stopPnl.roiPct, 2)}%`,
        tone: 'loss',
      }
      : null

    return { riskAmount, qty, notional, margin, stopPnlAmount, stopPnlPct, stopRoi }
  }, [accountEquity, direction, entryPrice, result, riskMode, riskValue, settings.currency, settings.leverage, stopPrice, t])

  return (
    <div className="grid gap-3 sm:gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-3 sm:space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              {t('common.resetInputs')}
            </ActionButton>
          }
          description={t('sizing.card.description')}
          stagger={60}
          title={t('sizing.card.title')}
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
              <InputRow inputMode="decimal" label={t('sizing.input.equity')} onChange={setAccountEquity} tone="accent" type="number" unit={currencyUnit} value={accountEquity} />
              <div className="space-y-4">
                <SegmentedControl
                  className="hidden md:grid"
                  onChange={setRiskMode}
                  options={[
                    { label: t('sizing.mode.riskPct'), value: 'pct' },
                    { label: t('sizing.mode.riskAmount'), value: 'amount' },
                  ]}
                  tone="warning"
                  value={riskMode}
                />
                <InputRow
                  inputMode="decimal"
                  label={t('sizing.input.risk')}
                  modeOptions={[
                    { label: t('sizing.mode.riskPct'), value: 'pct' },
                    { label: t('sizing.mode.riskAmount'), value: 'amount' },
                  ]}
                  modeValue={riskMode}
                  onChange={setRiskValue}
                  onModeChange={(v) => setRiskMode(v as RiskMode)}
                  tone="warning"
                  type="number"
                  unit={riskMode === 'pct' ? '%' : currencyUnit}
                  value={riskValue}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard stagger={120} title={t('sizing.prices.title')}>
          <div className="grid gap-4 md:grid-cols-2">
            <InputRow inputMode="decimal" label={t('sizing.input.entry')} onChange={setEntryPrice} tone="accent" type="number" unit={currencyUnit} value={entryPrice} />
            <InputRow inputMode="decimal" label={t('sizing.input.stop')} onChange={setStopPrice} tone="loss" type="number" unit={currencyUnit} value={stopPrice} />
          </div>
          <div className="mt-3">
            <FieldError>{error ?? undefined}</FieldError>
          </div>
        </SectionCard>
      </div>

      <ResultCard stagger={100} title={t('sizing.result.title')}>
        {result && tooltips ? (
          <div>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('sizing.metric.qty')}</p>
              <ValueWithTooltip className="mt-2" tone="accent" tooltip={tooltips.qty}>
                <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.qty, 4)}</p>
              </ValueWithTooltip>
            </div>
            <MetricRow label={t('sizing.metric.riskAmount')} tooltip={tooltips.riskAmount} value={formatCurrencyValue(result.riskAmount, settings.currency)} />
            <MetricRow label={t('sizing.metric.qty')} tooltip={tooltips.qty} value={formatNumber(result.qty, 4)} />
            <MetricRow label={t('sizing.metric.notional')} tooltip={tooltips.notional} value={formatCurrencyValue(result.notional, settings.currency)} />
            <MetricRow label={t('sizing.metric.margin')} tooltip={tooltips.margin} value={formatCurrencyValue(result.margin, settings.currency)} />
            <MetricRow label={t('sizing.metric.stopPnl')} tooltip={tooltips.stopPnlAmount} value={<PnlBadge size="sm" value={result.stopPnl.pnlAmount} />} />
            <MetricRow label={t('sizing.metric.stopPct')} tooltip={tooltips.stopPnlPct} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.pnlPct} />} />
            {typeof result.stopPnl.roiPct === 'number' && tooltips.stopRoi && (
              <MetricRow label={t('sizing.metric.stopRoi')} tooltip={tooltips.stopRoi} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.roiPct} />} />
            )}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--color-text-secondary)]">{t('sizing.empty.result')}</p>
        )}
      </ResultCard>
    </div>
  )
}
