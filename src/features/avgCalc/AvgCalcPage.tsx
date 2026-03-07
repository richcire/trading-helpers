import { useMemo } from 'react'

import { useSettingsStore } from '../../store/useSettingsStore'
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
      `평균단가 ${formatCurrencyValue(result.avgPrice.E, settings.currency)}`,
      `총수량 ${formatNumber(result.avgPrice.Q, 4)}`,
      `손절가 ${formatCurrencyValue(result.stopPrice, settings.currency)}`,
      `익절가 ${formatCurrencyValue(result.takePrice, settings.currency)}`,
    ].join(' / ')
    : '평균단가 계산 결과 없음'

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
      title: '평균단가',
      formula: 'E = Σ(price_i × qty_i) / Σ(qty_i)',
      substitution: `E = ${formatNumber(result.avgPrice.totalCost, 4)} / ${formatNumber(result.avgPrice.Q, 4)}`,
      result: `E = ${formatCurrencyValue(result.avgPrice.E, settings.currency, 4)}`,
      note: 'amount 모드 행은 qty = amount / price 로 환산됩니다.',
      tone: 'accent',
    }

    const totalQty: CalculationTooltipPayload = {
      title: '총수량',
      formula: 'Q = Σ(qty_i)',
      substitution: `Q = ${formatNumber(result.avgPrice.Q, 6)}`,
      result: `Q = ${formatNumber(result.avgPrice.Q, 4)}`,
      tone: 'accent',
    }

    const totalCost: CalculationTooltipPayload = {
      title: '총 진입금액',
      formula: 'totalCost = Σ(price_i × qty_i)',
      substitution: `totalCost = E × Q = ${formatNumber(result.avgPrice.E, 4)} × ${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.avgPrice.totalCost, settings.currency, 2),
      tone: 'accent',
    }

    const stopPrice: CalculationTooltipPayload = {
      title: '손절가',
      formula: stopFormula,
      substitution: stopSubstitution,
      result: `P = ${formatCurrencyValue(result.stopPrice, settings.currency, 4)}`,
      note: settings.adjustStopTakePriceForFees ? '수수료 보정 ON 상태입니다.' : '수수료 보정 OFF 상태입니다.',
      tone: 'loss',
    }

    const takePrice: CalculationTooltipPayload = {
      title: '익절가',
      formula: takeFormula,
      substitution: takeSubstitution,
      result: `P = ${formatCurrencyValue(result.takePrice, settings.currency, 4)}`,
      note: settings.adjustStopTakePriceForFees ? '수수료 보정 ON 상태입니다.' : '수수료 보정 OFF 상태입니다.',
      tone: 'profit',
    }

    const stopPnlAmount: CalculationTooltipPayload = {
      title: '손절 손익',
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `s=${s}, P=${formatNumber(result.stopPrice, 4)}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.stopPnl.pnlAmount, settings.currency, 2),
      note: settings.includeFeesInPnL ? '수수료 반영 ON입니다.' : '수수료 반영 OFF입니다.',
      tone: 'loss',
    }

    const stopPnlPct: CalculationTooltipPayload = {
      title: '손절 손익률',
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.stopPnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.stopPnl.pnlPct, 4)}%`,
      result: `${formatNumber(result.stopPnl.pnlPct, 2)}%`,
      tone: 'loss',
    }

    const takePnlAmount: CalculationTooltipPayload = {
      title: '익절 손익',
      formula: 'pnlAmount = s × (P - E) × Q',
      substitution: `s=${s}, P=${formatNumber(result.takePrice, 4)}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
      result: formatCurrencyValue(result.takePnl.pnlAmount, settings.currency, 2),
      note: settings.includeFeesInPnL ? '수수료 반영 ON입니다.' : '수수료 반영 OFF입니다.',
      tone: 'profit',
    }

    const takePnlPct: CalculationTooltipPayload = {
      title: '익절 손익률',
      formula: 'pnlPct = (pnlAmount / baseCost) × 100',
      substitution: `pnlAmount=${formatNumber(result.takePnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.takePnl.pnlPct, 4)}%`,
      result: `${formatNumber(result.takePnl.pnlPct, 2)}%`,
      tone: 'profit',
    }

    const currentAmount: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: '현재 손익',
        formula: 'pnlAmount = s × (P - E) × Q',
        substitution: `s=${s}, P=${Number.isFinite(currentMark) ? formatNumber(currentMark, 4) : '-'}, E=${formatNumber(result.avgPrice.E, 4)}, Q=${formatNumber(result.avgPrice.Q, 4)}`,
        result: formatCurrencyValue(result.currentPnl.pnlAmount, settings.currency, 2),
        note: settings.includeFeesInPnL ? '수수료 반영 ON입니다.' : '수수료 반영 OFF입니다.',
        tone: result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentPct: CalculationTooltipPayload | null = result.currentPnl
      ? {
        title: '현재 손익률',
        formula: 'pnlPct = (pnlAmount / baseCost) × 100',
        substitution: `pnlAmount=${formatNumber(result.currentPnl.pnlAmount, 2)}, pnlPct=${formatNumber(result.currentPnl.pnlPct, 4)}%`,
        result: `${formatNumber(result.currentPnl.pnlPct, 2)}%`,
        tone: result.currentPnl.pnlPct >= 0 ? 'profit' : 'loss',
      }
      : null

    const currentRoi: CalculationTooltipPayload | null = result.currentPnl && typeof result.currentPnl.roiPct === 'number'
      ? {
        title: '현재 ROI',
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
  }, [currentPrice, direction, result, settings.adjustStopTakePriceForFees, settings.currency, settings.includeFeesInPnL, settings.leverage, stopConfig.mode, stopConfig.value, takeConfig.mode, takeConfig.value])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <SectionCard
          actions={
            <ActionButton onClick={reset} tone="warning" variant="outline">
              현재 입력 초기화
            </ActionButton>
          }
          description="분할 진입 평균단가를 계산하고 같은 기준으로 손절, 익절, 현재 손익을 즉시 확인합니다."
          eyebrow="Average Entry"
          title="평균단가 + 손절/익절"
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
              + 행 추가
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Targets" title="손절 / 익절 설정">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-[var(--radius-control)] border border-[color:var(--color-border-subtle)] bg-black/10 p-4">
              <SegmentedControl
                onChange={(value) => setStopConfig({ mode: value })}
                options={[
                  { label: '손절 %', value: 'pct' },
                  { label: '손절 금액', value: 'amount' },
                ]}
                tone="loss"
                value={stopConfig.mode}
              />
              <InputRow
                error={stopError ?? undefined}
                inputMode="decimal"
                label="손절 값"
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
                  { label: '익절 %', value: 'pct' },
                  { label: '익절 금액', value: 'amount' },
                ]}
                tone="profit"
                value={takeConfig.mode}
              />
              <InputRow
                error={takeError ?? undefined}
                inputMode="decimal"
                label="익절 값"
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

        <SectionCard eyebrow="Mark Price" title="현재가 기준 손익">
          <InputRow
            error={currentPriceError ?? undefined}
            inputMode="decimal"
            label="현재가"
            onChange={setCurrentPrice}
            placeholder="선택 입력"
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
          title="포지션 요약"
        >
          {result && tooltips ? (
            <div>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Average Price</p>
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
              <MetricRow label="총수량" tooltip={tooltips.totalQty} value={formatNumber(result.avgPrice.Q, 4)} />
              <MetricRow label="총 진입금액" tooltip={tooltips.totalCost} value={formatCurrencyValue(result.avgPrice.totalCost, settings.currency)} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">유효한 진입 행을 입력하면 평균단가와 목표 가격을 계산합니다.</p>
          )}
        </ResultCard>

        <ResultCard title="손절 / 익절 결과">
          {result && tooltips ? (
            <div>
              <MetricRow label="손절가" tone="loss" tooltip={tooltips.stopPrice} value={formatCurrencyValue(result.stopPrice, settings.currency)} />
              <MetricRow label="손절 손익" tooltip={tooltips.stopPnlAmount} value={<PnlBadge size="sm" value={result.stopPnl.pnlAmount} />} />
              <MetricRow label="손절 손익률" tooltip={tooltips.stopPnlPct} value={<PnlBadge format="pct" size="sm" value={result.stopPnl.pnlPct} />} />
              <MetricRow label="익절가" tone="profit" tooltip={tooltips.takePrice} value={formatCurrencyValue(result.takePrice, settings.currency)} />
              <MetricRow label="익절 손익" tooltip={tooltips.takePnlAmount} value={<PnlBadge size="sm" value={result.takePnl.pnlAmount} />} />
              <MetricRow label="익절 손익률" tooltip={tooltips.takePnlPct} value={<PnlBadge format="pct" size="sm" value={result.takePnl.pnlPct} />} />
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">손절/익절 설정과 유효한 진입값이 있으면 결과가 표시됩니다.</p>
          )}
        </ResultCard>

        <ResultCard title="현재가 기준 손익">
          {result?.currentPnl && tooltips?.currentAmount && tooltips.currentPct ? (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Current PnL</p>
                  <ValueWithTooltip className="mt-2" tone={result.currentPnl.pnlAmount >= 0 ? 'profit' : 'loss'} tooltip={tooltips.currentAmount}>
                    <p className="text-data text-3xl font-semibold tracking-[-0.05em]">{formatNumber(result.currentPnl.pnlAmount)}</p>
                  </ValueWithTooltip>
                </div>
                <PnlBadge value={result.currentPnl.pnlAmount} />
              </div>
              <div className="mt-5">
                <MetricRow label="손익률" tooltip={tooltips.currentPct} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.pnlPct} />} />
                {typeof result.currentPnl.roiPct === 'number' && tooltips.currentRoi && (
                  <MetricRow label="ROI" tooltip={tooltips.currentRoi} value={<PnlBadge format="pct" size="sm" value={result.currentPnl.roiPct} />} />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text-secondary)]">현재가를 입력하면 현재 손익과 손익률을 확인할 수 있습니다.</p>
          )}
        </ResultCard>
      </div>
    </div>
  )
}
