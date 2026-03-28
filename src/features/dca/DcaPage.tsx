import { useMemo } from 'react'

import { useI18n } from '../../i18n'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { CalculationTooltipPayload } from '../../types'
import { formatCurrencyUnit, formatCurrencyValue, formatNumber } from '../../utils/format'
import { ActionButton } from '../../components/ui/ActionButton'
import { ValueWithTooltip } from '../../components/ui/CalculationTooltip'
import { InputRow } from '../../components/ui/InputRow'
import { MetricRow } from '../../components/ui/MetricRow'
import { PnlBadge } from '../../components/ui/PnlBadge'
import { ResultCard } from '../../components/ui/ResultCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useDca } from './useDca'

export function DcaPage() {
  const { settings } = useSettingsStore()
  const { t } = useI18n()
  const currencyUnit = formatCurrencyUnit(settings.currency)
  const {
    addAmount,
    addMode,
    addPrice,
    addQty,
    currentPrice,
    direction,
    oldAvgPrice,
    oldQty,
    reset,
    result,
    setAddAmount,
    setAddMode,
    setAddPrice,
    setAddQty,
    setCurrentPrice,
    setDirection,
    setOldAvgPrice,
    setOldQty,
  } = useDca()

  const tooltips = useMemo(() => {
    if (!result) {
      return null
    }

    const prevE = Number.parseFloat(oldAvgPrice)
    const prevQ = Number.parseFloat(oldQty)
    const addP = Number.parseFloat(addPrice)
    const addQ = addMode === 'qty' ? Number.parseFloat(addQty) : Number.parseFloat(addAmount) / addP
    const mark = Number.parseFloat(currentPrice)

    const newAvg: CalculationTooltipPayload = {
      title: t('dca.metric.newAvg'),
      formula: 'newE = (oldE×oldQ + addP×addQ) / (oldQ + addQ)',
      substitution: `(${formatNumber(prevE, 4)}×${formatNumber(prevQ, 4)} + ${formatNumber(addP, 4)}×${formatNumber(addQ, 4)}) / ${formatNumber(result.newQty, 4)}`,
      result: formatCurrencyValue(result.newAvgPrice, settings.currency, 4),
      note: addMode === 'amount' ? t('dca.note.amountMode') : undefined,
      tone: 'accent',
    }

    const newQty: CalculationTooltipPayload = {
      title: t('dca.metric.newQty'),
      formula: 'newQ = oldQ + addQ',
      substitution: `${formatNumber(prevQ, 4)} + ${formatNumber(addQ, 4)}`,
      result: `${formatNumber(result.newQty, 4)}`,
      tone: 'accent',
    }

    const breakeven: CalculationTooltipPayload = {
      title: t('dca.metric.breakeven'),
      formula: 'P_be = E (fee off) / E×(1±f_in)/(1∓f_out) (fee on)',
      substitution: `direction=${direction}, E=${formatNumber(result.newAvgPrice, 4)}`,
      result: formatCurrencyValue(result.breakevenPrice, settings.currency, 4),
      tone: 'warning',
    }

    const distance: CalculationTooltipPayload = {
      title: t('dca.metric.distance'),
      formula: direction === 'LONG' ? 'distance = ((P_be - mark) / mark) × 100' : 'distance = ((mark - P_be) / mark) × 100',
      substitution: `P_be=${formatNumber(result.breakevenPrice, 4)}, mark=${Number.isFinite(mark) ? formatNumber(mark, 4) : '-'}`,
      result: typeof result.distanceToBe === 'number' ? `${formatNumber(result.distanceToBe, 2)}%` : t('common.empty'),
      tone: 'warning',
    }

    const currentAmount: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: t('avg.metric.currentPnl'),
        formula: 'pnlAmount = s × (P - E) × Q',
        substitution: `P=${Number.isFinite(mark) ? formatNumber(mark, 4) : '-'}, E=${formatNumber(result.newAvgPrice, 4)}, Q=${formatNumber(result.newQty, 4)}`,
        result: formatCurrencyValue(result.currentPnl.pnlAmount, settings.currency, 2),
        tone: result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentPct: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: t('dca.metric.currentPct'),
        formula: 'pnlPct = (pnlAmount / baseCost) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}`,
        result: `${formatNumber(result.currentPnl.pnlPct, 2)}%`,
        tone: result.currentPnl.pnlPct >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentRoi: CalculationTooltipPayload | null = result.currentPnl && typeof result.currentPnl.roiPct === 'number'
      ? {
        title: t('dca.metric.currentRoi'),
        formula: 'roiPct = (pnlAmount / margin) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}`,
        result: `${formatNumber(result.currentPnl.roiPct, 2)}%`,
        tone: result.currentPnl.roiPct >= 0 ? 'profit' : 'loss',
      }
      : null

    return { newAvg, newQty, breakeven, distance, currentAmount, currentPct, currentRoi }
  }, [addAmount, addMode, addPrice, addQty, currentPrice, direction, oldAvgPrice, oldQty, result, settings.currency, t])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              {t('common.resetInputs')}
            </ActionButton>
          }
          description={t('dca.card.description')}
          eyebrow="DCA"
          stagger={60}
          title={t('dca.card.title')}
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
              <InputRow inputMode="decimal" label={t('dca.input.oldAvg')} onChange={setOldAvgPrice} tone="accent" type="number" unit={currencyUnit} value={oldAvgPrice} />
              <InputRow inputMode="decimal" label={t('dca.input.oldQty')} onChange={setOldQty} tone="accent" type="number" value={oldQty} />
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t('common.section.addPosition')} stagger={120} title={t('dca.add.title')}>
          <div className="space-y-4">
            <SegmentedControl
              onChange={setAddMode}
              options={[
                { label: t('avg.mode.qty'), value: 'qty' },
                { label: t('avg.mode.amount'), value: 'amount' },
              ]}
              value={addMode}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <InputRow inputMode="decimal" label={t('dca.input.addPrice')} onChange={setAddPrice} tone="accent" type="number" unit={currencyUnit} value={addPrice} />
              {addMode === 'qty' ? (
                <InputRow inputMode="decimal" label={t('dca.input.addQty')} onChange={setAddQty} tone="accent" type="number" value={addQty} />
              ) : (
                <InputRow inputMode="decimal" label={t('dca.input.addAmount')} onChange={setAddAmount} tone="accent" type="number" unit={currencyUnit} value={addAmount} />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow={t('common.section.markPrice')} stagger={180} title={t('dca.mark.title')}>
          <InputRow inputMode="decimal" label={t('dca.input.currentPrice')} onChange={setCurrentPrice} tone="warning" type="number" unit={currencyUnit} value={currentPrice} />
        </SectionCard>
      </div>

      <div className="space-y-5">
        <ResultCard stagger={100} title={t('dca.result.title')}>
          {result && tooltips ? (
            <div>
              <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('dca.metric.newAvg')}</p>
                <ValueWithTooltip className="mt-2" tone="accent" tooltip={tooltips.newAvg}>
                  <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.newAvgPrice)}</p>
                </ValueWithTooltip>
              </div>
              <MetricRow label={t('dca.metric.newAvg')} tooltip={tooltips.newAvg} value={formatCurrencyValue(result.newAvgPrice, settings.currency)} />
              <MetricRow label={t('dca.metric.newQty')} tooltip={tooltips.newQty} value={formatNumber(result.newQty, 4)} />
              <MetricRow label={t('dca.metric.breakeven')} tooltip={tooltips.breakeven} value={formatCurrencyValue(result.breakevenPrice, settings.currency)} />
              <MetricRow
                label={t('dca.metric.distance')}
                tooltip={tooltips.distance}
                value={
                  typeof result.distanceToBe === 'number' ? (
                    <PnlBadge format="pct" size="sm" value={result.distanceToBe} />
                  ) : (
                    t('common.empty')
                  )
                }
              />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('dca.empty.result')}</p>
          )}
        </ResultCard>

        <ResultCard stagger={160} title={t('dca.current.title')}>
          {result?.currentPnl && tooltips?.currentAmount && tooltips.currentPct ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">{t('avg.metric.currentPnl')}</p>
                  <ValueWithTooltip className="mt-2" tone={result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss'} tooltip={tooltips.currentAmount}>
                    <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.currentPnl.pnlAmount)}</p>
                  </ValueWithTooltip>
                </div>
                <PnlBadge value={result.currentPnl.pnlAmount} />
              </div>
              <div className="mt-5">
                <MetricRow label={t('dca.metric.currentPct')} tooltip={tooltips.currentPct} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.pnlPct} />} />
                {typeof result.currentPnl.roiPct === 'number' && tooltips.currentRoi && (
                  <MetricRow label={t('dca.metric.currentRoi')} tooltip={tooltips.currentRoi} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.roiPct} />} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">{t('dca.empty.current')}</p>
          )}
        </ResultCard>
      </div>
    </div>
  )
}
