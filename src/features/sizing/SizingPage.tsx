import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
import type { CalculationTooltipPayload } from '../../types'
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
      title: '허용 손실 금액',
      formula: riskMode === 'pct' ? 'riskAmount = equity × riskPct / 100' : 'riskAmount = riskValue',
      substitution: riskMode === 'pct' ? `${formatNumber(equity, 2)} × ${formatNumber(risk, 2)} / 100` : `${formatNumber(risk, 2)}`,
      result: formatCurrencyValue(result.riskAmount, settings.currency, 2),
      tone: 'warning',
    }

    const qty: CalculationTooltipPayload = {
      title: '권장 수량',
      formula: 'Q = min(riskQty, leverageCapQty)',
      substitution: `riskQty=${formatNumber(result.riskQty, 6)}, leverageCapQty=${formatNumber(result.leverageCapQty, 6)}`,
      result: `${formatNumber(result.qty, 6)}`,
      note: `leverageCapQty = equity × leverage / entry = ${formatNumber(equity, 2)} × ${formatNumber(settings.leverage, 2)} / ${formatNumber(entry, 4)}`,
      tone: 'accent',
    }

    const notional: CalculationTooltipPayload = {
      title: '포지션 명목',
      formula: 'notional = entryPrice × qty',
      substitution: `${formatNumber(entry, 4)} × ${formatNumber(result.qty, 6)}`,
      result: formatCurrencyValue(result.notional, settings.currency, 2),
      tone: 'accent',
    }

    const margin: CalculationTooltipPayload = {
      title: '증거금',
      formula: 'margin = notional / leverage',
      substitution: `${formatNumber(result.notional, 2)} / leverage`,
      result: formatCurrencyValue(result.margin, settings.currency, 2),
      tone: 'accent',
    }

    const stopPnlAmount: CalculationTooltipPayload = {
      title: '손절 시 손익',
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `direction=${direction}, E=${formatNumber(entry, 4)}, P=${formatNumber(stop, 4)}, Q=${formatNumber(result.qty, 6)}`,
      result: formatCurrencyValue(result.stopPnl.pnlAmount, settings.currency, 2),
      tone: 'loss',
    }

    const stopPnlPct: CalculationTooltipPayload = {
      title: '손절 시 손익률',
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}`,
      result: `${formatNumber(result.stopPnl.pnlPct, 2)}%`,
      tone: 'loss',
    }

    const stopRoi: CalculationTooltipPayload | null = typeof result.stopPnl.roiPct === 'number'
      ? {
        title: '손절 시 ROI',
        formula: 'roiPct = (pnlAmount / margin) × 100',
        substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}, margin=${formatNumber(result.margin, 2)}`,
        result: `${formatNumber(result.stopPnl.roiPct, 2)}%`,
        tone: 'loss',
      }
      : null

    return { riskAmount, qty, notional, margin, stopPnlAmount, stopPnlPct, stopRoi }
  }, [accountEquity, direction, entryPrice, result, riskMode, riskValue, settings.currency, settings.leverage, stopPrice])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              현재 입력 초기화
            </ActionButton>
          }
          description="허용 손실 기준으로 적정 포지션 수량과 증거금을 계산합니다."
          eyebrow="Risk Sizing"
          title="포지션 사이징"
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
              <InputRow inputMode="decimal" label="계좌 자산" onChange={setAccountEquity} tone="accent" type="number" unit={currencyUnit} value={accountEquity} />
              <div className="space-y-4">
                <SegmentedControl
                  onChange={setRiskMode}
                  options={[
                    { label: '리스크 %', value: 'pct' },
                    { label: '리스크 금액', value: 'amount' },
                  ]}
                  tone="warning"
                  value={riskMode}
                />
                <InputRow
                  inputMode="decimal"
                  label="허용 손실"
                  onChange={setRiskValue}
                  tone="warning"
                  type="number"
                  unit={riskMode === 'pct' ? '%' : currencyUnit}
                  value={riskValue}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Prices" title="진입가 / 손절가">
          <div className="grid gap-4 md:grid-cols-2">
            <InputRow inputMode="decimal" label="진입가" onChange={setEntryPrice} tone="accent" type="number" unit={currencyUnit} value={entryPrice} />
            <InputRow inputMode="decimal" label="손절가" onChange={setStopPrice} tone="loss" type="number" unit={currencyUnit} value={stopPrice} />
          </div>
          <div className="mt-3">
            <FieldError>{error ?? undefined}</FieldError>
          </div>
        </SectionCard>
      </div>

      <ResultCard title="사이징 결과">
        {result && tooltips ? (
          <div>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Recommended Size</p>
              <ValueWithTooltip className="mt-2" tone="accent" tooltip={tooltips.qty}>
                <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.qty, 4)}</p>
              </ValueWithTooltip>
            </div>
            <MetricRow label="허용 손실 금액" tooltip={tooltips.riskAmount} value={formatCurrencyValue(result.riskAmount, settings.currency)} />
            <MetricRow label="권장 수량" tooltip={tooltips.qty} value={formatNumber(result.qty, 4)} />
            <MetricRow label="포지션 명목" tooltip={tooltips.notional} value={formatCurrencyValue(result.notional, settings.currency)} />
            <MetricRow label="증거금" tooltip={tooltips.margin} value={formatCurrencyValue(result.margin, settings.currency)} />
            <MetricRow label="손절 시 손익" tooltip={tooltips.stopPnlAmount} value={<PnlBadge size="sm" value={result.stopPnl.pnlAmount} />} />
            <MetricRow label="손절 시 손익률" tooltip={tooltips.stopPnlPct} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.pnlPct} />} />
            {typeof result.stopPnl.roiPct === 'number' && tooltips.stopRoi && (
              <MetricRow label="손절 시 ROI" tooltip={tooltips.stopRoi} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.roiPct} />} />
            )}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--color-text-secondary)]">계좌 자산, 허용 손실, 진입가와 손절가를 입력하면 적정 수량을 계산합니다.</p>
        )}
      </ResultCard>
    </div>
  )
}
